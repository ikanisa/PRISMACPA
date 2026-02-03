/**
 * FirmOS Audit Engine (Patrick)
 *
 * Handles audit engagements, risk assessments, and evidence collection.
 */

import { getSupabaseClient } from "../db.js";

// =============================================================================
// TYPES
// =============================================================================

export interface AuditEngagement {
  id?: string;
  clientEntityId: string;
  yearEnding: string;
  status: "planning" | "fieldwork" | "review" | "completed";
  auditStandard: "ISA" | "GALS";
  partnerInCharge: string;
  managerInCharge: string;
  materiality: number;
}

export interface AuditEvidence {
  id?: string;
  engagementId: string;
  description: string;
  type: "inquiry" | "observation" | "inspection" | "recalculation";
  fileUrl?: string;
  collectedBy: string;
  collectedAt: string;
}

export interface Workpaper {
  id?: string;
  engagementId: string;
  reference: string; // e.g., "A.100"
  title: string;
  status: "draft" | "reviewed" | "final";
  content: string; // Markdown or JSON content
}

// =============================================================================
// AUDIT OPERATIONS
// =============================================================================

/**
 * Create a new audit engagement
 */
/**
 * Create a new audit engagement
 */
export async function createAuditEngagement(
  params: Omit<AuditEngagement, "id" | "status">,
): Promise<{ success: boolean; engagement?: AuditEngagement; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("audit_engagements")
      .insert({
        client_entity_id: params.clientEntityId,
        year_ending: params.yearEnding,
        status: "planning",
        audit_standard: params.auditStandard,
        partner_in_charge: params.partnerInCharge,
        manager_in_charge: params.managerInCharge,
        materiality: params.materiality,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to create audit engagement");

    // Map snake_case DB fields back to camelCase
    const engagement: AuditEngagement = {
      id: data.id,
      clientEntityId: data.client_entity_id,
      yearEnding: data.year_ending,
      status: data.status,
      auditStandard: data.audit_standard,
      partnerInCharge: data.partner_in_charge,
      managerInCharge: data.manager_in_charge,
      materiality: data.materiality,
    };

    console.log(`[Audit] Created engagement for ${params.clientEntityId} (${params.yearEnding})`);

    return { success: true, engagement };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Record audit evidence
 */
export async function recordEvidence(
  engagementId: string,
  description: string,
  type: AuditEvidence["type"],
  collectedBy: string,
): Promise<{ success: boolean; evidence?: AuditEvidence }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("audit_evidence")
      .insert({
        engagement_id: engagementId,
        description,
        type,
        collected_by: collectedBy,
        collected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to record evidence");

    const evidence: AuditEvidence = {
      id: data.id,
      engagementId: data.engagement_id,
      description: data.description,
      type: data.type,
      collectedBy: data.collected_by,
      collectedAt: data.collected_at,
      fileUrl: data.file_url,
    };

    console.log(`[Audit] Recorded evidence for ${engagementId}: ${description}`);
    return { success: true, evidence };
  } catch (err) {
    return { success: false, evidence: undefined };
  }
}

/**
 * Create or update a workpaper
 */
export async function manageWorkpaper(
  params: Workpaper,
): Promise<{ success: boolean; workpaper?: Workpaper }> {
  try {
    const supabase = getSupabaseClient();

    // Upsert workpaper based on ID (if exists) or create new (if generated ID provided or null)
    // Here we assume if params.id is present we upsert

    const payload = {
      id: params.id,
      engagement_id: params.engagementId,
      reference: params.reference,
      title: params.title,
      status: params.status,
      content: params.content,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("audit_workpapers")
      .upsert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const workpaper: Workpaper = {
      id: data.id,
      engagementId: data.engagement_id,
      reference: data.reference,
      title: data.title,
      status: data.status,
      content: data.content,
    };

    console.log(`[Audit] Managing workpaper ${params.reference}: ${params.title}`);
    return { success: true, workpaper };
  } catch (err) {
    return { success: false };
  }
}
