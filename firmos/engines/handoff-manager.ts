/**
 * FirmOS Handoff Manager
 *
 * Manages work transfers between FirmOS agents.
 * Uses sessions_send for real-time notification.
 */

import {
  createHandoff as dbCreateHandoff,
  acceptHandoff as dbAcceptHandoff,
  completeHandoff as dbCompleteHandoff,
  listPendingHandoffs,
  updateWorkstreamStatus,
  type Handoff,
  type HandoffStatus,
} from "./db.js";
import { getAgentById } from "./routing-engine.js";

// =============================================================================
// TYPES
// =============================================================================

export interface HandoffRequest {
  fromAgent: string;
  toAgent: string;
  workstreamId?: string;
  engagementId?: string;
  reason: string;
  context?: string;
}

export interface HandoffResult {
  success: boolean;
  handoff?: Handoff;
  error?: string;
}

// =============================================================================
// HANDOFF OPERATIONS
// =============================================================================

/**
 * Create a new handoff between agents
 */
export async function createHandoff(req: HandoffRequest): Promise<HandoffResult> {
  // Validate agents exist
  const fromAgentInfo = getAgentById(req.fromAgent);
  const toAgentInfo = getAgentById(req.toAgent);

  if (!fromAgentInfo) {
    return { success: false, error: `Unknown source agent: ${req.fromAgent}` };
  }
  if (!toAgentInfo) {
    return { success: false, error: `Unknown target agent: ${req.toAgent}` };
  }

  try {
    // Create handoff record
    const handoff = await dbCreateHandoff({
      from_agent: req.fromAgent,
      to_agent: req.toAgent,
      workstream_id: req.workstreamId,
      engagement_id: req.engagementId,
      reason: req.reason,
      context: req.context,
      status: "pending",
    });

    // Update workstream if provided
    if (req.workstreamId) {
      await updateWorkstreamStatus(req.workstreamId, "blocked");
    }

    // TODO: Notify receiving agent via sessions_send
    // await notifyAgent(req.toAgent, {
    //   type: 'handoff_request',
    //   handoffId: handoff.id,
    //   fromAgent: req.fromAgent,
    //   reason: req.reason,
    // });

    return { success: true, handoff };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Accept a pending handoff
 */
export async function acceptHandoff(
  handoffId: string,
  acceptingAgent: string,
): Promise<HandoffResult> {
  try {
    const handoff = await dbAcceptHandoff(handoffId);

    // Verify the accepting agent is the intended recipient
    if (handoff.to_agent !== acceptingAgent) {
      return {
        success: false,
        error: `Handoff is assigned to ${handoff.to_agent}, not ${acceptingAgent}`,
      };
    }

    // Update workstream assignment if present
    if (handoff.workstream_id) {
      await updateWorkstreamStatus(handoff.workstream_id, "in_progress");
    }

    // TODO: Notify originating agent
    // await notifyAgent(handoff.from_agent, {
    //   type: 'handoff_accepted',
    //   handoffId: handoff.id,
    //   acceptedBy: acceptingAgent,
    // });

    return { success: true, handoff };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Complete a handoff
 */
export async function completeHandoff(handoffId: string, notes?: string): Promise<HandoffResult> {
  try {
    const handoff = await dbCompleteHandoff(handoffId, notes);

    // Mark workstream as completed if present
    if (handoff.workstream_id) {
      await updateWorkstreamStatus(handoff.workstream_id, "completed");
    }

    // TODO: Notify originating agent
    // await notifyAgent(handoff.from_agent, {
    //   type: 'handoff_completed',
    //   handoffId: handoff.id,
    //   notes,
    // });

    return { success: true, handoff };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Get pending handoffs for an agent
 */
export async function getPendingHandoffsForAgent(agentId: string): Promise<Handoff[]> {
  return listPendingHandoffs(agentId);
}

/**
 * Reject a handoff
 */
export async function rejectHandoff(
  handoffId: string,
  rejectingAgent: string,
  reason: string,
): Promise<HandoffResult> {
  try {
    // For now, we'll update status directly
    // In a full implementation, we'd have a separate DB function
    const { getSupabaseClient } = await import("./db.js");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("handoffs")
      .update({
        status: "rejected" as HandoffStatus,
        response_notes: reason,
      })
      .eq("id", handoffId)
      .select()
      .single();

    if (error) throw error;

    // Unblock workstream if present
    if (data.workstream_id) {
      await updateWorkstreamStatus(data.workstream_id, "pending");
    }

    return { success: true, handoff: data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
