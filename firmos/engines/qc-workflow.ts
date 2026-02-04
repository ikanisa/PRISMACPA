/**
 * FirmOS QC Workflow Engine
 *
 * State machine for quality control reviews.
 * Manages transitions: DRAFT → PENDING → IN_REVIEW → PASS/REVISE/ESCALATE → RELEASED
 */

import { getSupabaseClient, type WorkstreamStatus } from "./db.js";

// =============================================================================
// TYPES
// =============================================================================

export type QCState =
  | "draft"
  | "pending"
  | "in_review"
  | "pass"
  | "revise"
  | "escalate"
  | "released";

export interface QCReview {
  id: string;
  workstream_id: string;
  reviewer_agent: string;
  status: QCState;
  outcome?: string;
  comments?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface QCTransitionResult {
  success: boolean;
  review?: QCReview;
  error?: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  passed?: boolean;
  notes?: string;
}

export interface ChecklistResult {
  passed: boolean;
  score: number;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  results: Array<{
    itemId: string;
    passed: boolean;
    notes?: string;
  }>;
}

// =============================================================================
// STATE MACHINE
// =============================================================================

const ALLOWED_TRANSITIONS: Record<QCState, QCState[]> = {
  draft: ["pending"],
  pending: ["in_review", "revise"],
  in_review: ["pass", "revise", "escalate"],
  pass: ["released"],
  revise: ["pending"],
  escalate: ["in_review", "released"],
  released: [],
};

export function canTransition(from: QCState, to: QCState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// QC OPERATIONS
// =============================================================================

/**
 * Submit a workstream for QC review
 */
export async function submitForQC(
  workstreamId: string,
  submittingAgent: string,
): Promise<QCTransitionResult> {
  const supabase = getSupabaseClient();

  try {
    // Create QC review record
    const { data: review, error } = await supabase
      .from("qc_reviews")
      .insert({
        workstream_id: workstreamId,
        reviewer_agent: "firmos-qc", // Diane
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Update workstream status
    await supabase
      .from("workstreams")
      .update({ status: "pending_qc" as WorkstreamStatus })
      .eq("id", workstreamId);

    // Log the submission
    await logQCAction(review.id, "submitted", submittingAgent, {
      workstream_id: workstreamId,
    });

    return { success: true, review };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Transition a QC review to a new state
 */
export async function transitionQC(
  reviewId: string,
  targetState: QCState,
  actor: string,
  comments?: string,
): Promise<QCTransitionResult> {
  const supabase = getSupabaseClient();

  try {
    // Get current review
    const { data: current, error: fetchError } = await supabase
      .from("qc_reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (fetchError) throw fetchError;
    if (!current) throw new Error("QC review not found");

    const currentState = current.status as QCState;

    // Validate transition
    if (!canTransition(currentState, targetState)) {
      return {
        success: false,
        error: `Invalid transition: ${currentState} → ${targetState}`,
      };
    }

    // Prepare update
    const updates: Partial<QCReview> = {
      status: targetState,
      comments: comments || current.comments,
    };

    if (["pass", "revise", "escalate"].includes(targetState)) {
      updates.outcome = targetState;
      updates.reviewed_at = new Date().toISOString();
    }

    // Update review
    const { data: updated, error: updateError } = await supabase
      .from("qc_reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update workstream status based on QC outcome
    if (current.workstream_id) {
      let workstreamStatus: WorkstreamStatus = "pending_qc";

      if (targetState === "pass") {
        workstreamStatus = "pending_approval";
      } else if (targetState === "revise") {
        workstreamStatus = "qc_revision";
      } else if (targetState === "released") {
        workstreamStatus = "completed";
      }

      await supabase
        .from("workstreams")
        .update({ status: workstreamStatus })
        .eq("id", current.workstream_id);
    }

    // Log the transition
    await logQCAction(reviewId, `transitioned_to_${targetState}`, actor, {
      from: currentState,
      to: targetState,
      comments,
    });

    // Handle escalation to Marco
    if (targetState === "escalate") {
      await handleEscalation(updated, actor, comments);
    }

    return { success: true, review: updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Get QC review status
 */
export async function getQCReview(reviewId: string): Promise<QCReview | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from("qc_reviews").select("*").eq("id", reviewId).single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/**
 * List pending QC reviews (for Diane)
 */
export async function listPendingQCReviews(): Promise<QCReview[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("qc_reviews")
    .select("*, workstreams(title, assigned_agent)")
    .in("status", ["pending", "in_review"])
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// =============================================================================
// CHECKLIST EVALUATION
// =============================================================================

const CHECKLISTS: Record<string, ChecklistItem[]> = {
  audit: [
    { id: "scope_defined", description: "Audit scope is clearly defined", required: true },
    { id: "risk_assessed", description: "Risk assessment completed", required: true },
    { id: "evidence_documented", description: "All evidence properly documented", required: true },
    { id: "findings_supported", description: "Findings supported by evidence", required: true },
    { id: "review_complete", description: "Partner review completed", required: true },
  ],
  tax: [
    { id: "data_complete", description: "All tax data gathered", required: true },
    { id: "calculations_verified", description: "Tax calculations verified", required: true },
    { id: "deadline_checked", description: "Filing deadline confirmed", required: true },
    { id: "client_approved", description: "Client approval obtained", required: false },
  ],
  accounting: [
    { id: "entries_balanced", description: "All entries balance", required: true },
    { id: "reconciled", description: "Accounts reconciled", required: true },
    { id: "supporting_docs", description: "Supporting documents attached", required: true },
    { id: "period_correct", description: "Correct accounting period", required: true },
  ],
  default: [
    { id: "complete", description: "Work is complete", required: true },
    { id: "documented", description: "Work is documented", required: true },
    { id: "reviewed", description: "Self-review completed", required: true },
  ],
};

export function getChecklist(taskType: string): ChecklistItem[] {
  // Map task types to checklist categories
  if (taskType.includes("audit")) return CHECKLISTS.audit;
  if (taskType.includes("tax") || taskType.includes("vat")) return CHECKLISTS.tax;
  if (taskType.includes("journal") || taskType.includes("reconcil")) return CHECKLISTS.accounting;
  return CHECKLISTS.default;
}

export function evaluateChecklist(
  checklist: ChecklistItem[],
  responses: Record<string, boolean>,
): ChecklistResult {
  let passedItems = 0;
  let failedItems = 0;
  const results: ChecklistResult["results"] = [];

  for (const item of checklist) {
    const passed = responses[item.id] ?? false;
    results.push({ itemId: item.id, passed });

    if (passed) {
      passedItems++;
    } else if (item.required) {
      failedItems++;
    }
  }

  const score = checklist.length > 0 ? (passedItems / checklist.length) * 100 : 0;
  const passed = failedItems === 0;

  return {
    passed,
    score,
    totalItems: checklist.length,
    passedItems,
    failedItems,
    results,
  };
}

// =============================================================================
// ESCALATION HANDLING
// =============================================================================

async function handleEscalation(
  review: QCReview,
  escalatedBy: string,
  reason?: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  // Create policy decision record for Marco
  await supabase.from("policy_decisions").insert({
    policy_id: "qc_escalation",
    policy_name: "QC Escalation Review",
    decided_by: "firmos-governance", // Marco
    decision: "escalate",
    reasoning: reason || "Escalated from QC review",
    requested_by: escalatedBy,
    workstream_id: review.workstream_id,
    inputs: { review_id: review.id },
  });

  // TODO: Notify Marco via sessions_send
  // await notifyAgent('firmos-governance', {
  //   type: 'qc_escalation',
  //   reviewId: review.id,
  //   reason,
  // });
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

async function logQCAction(
  reviewId: string,
  action: string,
  actor: string,
  details: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.from("audit_log").insert({
    action: `qc_${action}`,
    actor,
    actor_type: "agent",
    resource_type: "qc_review",
    resource_id: reviewId,
    details,
  });
}
