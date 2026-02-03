/**
 * FirmOS Database Client
 *
 * Provides typed access to FirmOS Supabase tables.
 * Used by routing engine, handoff manager, and specialist engines.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type Jurisdiction = "MT" | "RW";

export type EntityStatus = "prospect" | "active" | "inactive" | "archived";
export type EntityType =
  | "company"
  | "partnership"
  | "sole_trader"
  | "trust"
  | "ngo"
  | "public_body";

export type EngagementStatus =
  | "draft"
  | "active"
  | "in_progress"
  | "pending_review"
  | "pending_approval"
  | "completed"
  | "cancelled"
  | "on_hold";

export type WorkstreamStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "pending_qc"
  | "qc_revision"
  | "pending_approval"
  | "completed"
  | "cancelled";

export type WorkstreamPriority = "low" | "normal" | "high" | "urgent";

export type HandoffStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

export type DeadlineStatus =
  | "upcoming"
  | "pending"
  | "in_progress"
  | "completed"
  | "missed"
  | "waived";

export type IncidentType = "security" | "compliance" | "operational" | "policy";
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

// =============================================================================
// ROW TYPES
// =============================================================================

export interface Entity {
  id: string;
  name: string;
  legal_name?: string;
  entity_type?: EntityType;
  jurisdiction: Jurisdiction;
  registration_number?: string;
  tin?: string;
  vat_number?: string;
  primary_email?: string;
  primary_phone?: string;
  registered_address?: string;
  year_end_month?: number;
  year_end_day?: number;
  status: EntityStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Engagement {
  id: string;
  entity_id: string;
  service_type: string;
  service_id?: string;
  period: string;
  period_start?: string;
  period_end?: string;
  primary_agent: string;
  secondary_agents?: string[];
  status: EngagementStatus;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  fee_amount?: number;
  fee_currency?: string;
  billing_status?: string;
  description?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Workstream {
  id: string;
  engagement_id: string;
  title: string;
  description?: string;
  task_type: string;
  assigned_agent: string;
  status: WorkstreamStatus;
  priority: WorkstreamPriority;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  depends_on?: string[];
  qc_required: boolean;
  qc_result_id?: string;
  output_document_ids?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Handoff {
  id: string;
  from_agent: string;
  to_agent: string;
  workstream_id?: string;
  engagement_id?: string;
  reason: string;
  context?: string;
  status: HandoffStatus;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  response_notes?: string;
}

export interface Deadline {
  id: string;
  entity_id?: string;
  title: string;
  description?: string;
  deadline_type: string;
  jurisdiction: Jurisdiction;
  due_date: string;
  assigned_agent?: string;
  status: DeadlineStatus;
  engagement_id?: string;
  workstream_id?: string;
  completed_at?: string;
  completed_by?: string;
  alert_days_before?: number[];
  last_alert_sent?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  reporter: string;
  status: IncidentStatus;
  affected_clients?: number;
  affected_workstreams?: string[];
  jurisdiction?: Jurisdiction;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  root_cause?: string;
  preventive_actions?: unknown[];
  reported_at: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// DATABASE CLIENT
// =============================================================================

let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables");
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// =============================================================================
// ENTITY OPERATIONS
// =============================================================================

export async function listEntities(opts?: {
  jurisdiction?: Jurisdiction;
  status?: EntityStatus;
  limit?: number;
}): Promise<Entity[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from("entities").select("*");

  if (opts?.jurisdiction) {
    query = query.eq("jurisdiction", opts.jurisdiction);
  }
  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query.order("name");
  if (error) throw error;
  return data || [];
}

export async function getEntityById(id: string): Promise<Entity | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("entities").select("*").eq("id", id).single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createEntity(
  entity: Omit<Entity, "id" | "created_at" | "updated_at">,
): Promise<Entity> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("entities").insert(entity).select().single();

  if (error) throw error;
  return data;
}

// =============================================================================
// ENGAGEMENT OPERATIONS
// =============================================================================

export async function listEngagements(opts?: {
  entity_id?: string;
  primary_agent?: string;
  status?: EngagementStatus;
  limit?: number;
}): Promise<Engagement[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from("engagements").select("*, entities(name)");

  if (opts?.entity_id) {
    query = query.eq("entity_id", opts.entity_id);
  }
  if (opts?.primary_agent) {
    query = query.eq("primary_agent", opts.primary_agent);
  }
  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query.order("due_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createEngagement(
  engagement: Omit<Engagement, "id" | "created_at" | "updated_at">,
): Promise<Engagement> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("engagements").insert(engagement).select().single();

  if (error) throw error;
  return data;
}

export async function updateEngagementStatus(
  id: string,
  status: EngagementStatus,
): Promise<Engagement> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("engagements")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// WORKSTREAM OPERATIONS
// =============================================================================

export async function listWorkstreams(opts?: {
  engagement_id?: string;
  assigned_agent?: string;
  status?: WorkstreamStatus;
  limit?: number;
}): Promise<Workstream[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from("workstreams").select("*");

  if (opts?.engagement_id) {
    query = query.eq("engagement_id", opts.engagement_id);
  }
  if (opts?.assigned_agent) {
    query = query.eq("assigned_agent", opts.assigned_agent);
  }
  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query.order("due_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createWorkstream(
  workstream: Omit<Workstream, "id" | "created_at" | "updated_at">,
): Promise<Workstream> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("workstreams").insert(workstream).select().single();

  if (error) throw error;
  return data;
}

export async function updateWorkstreamStatus(
  id: string,
  status: WorkstreamStatus,
): Promise<Workstream> {
  const supabase = getSupabaseClient();
  const updates: Partial<Workstream> = { status };

  if (status === "in_progress" && !updates.started_at) {
    updates.started_at = new Date().toISOString();
  }
  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("workstreams")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// HANDOFF OPERATIONS
// =============================================================================

export async function createHandoff(handoff: Omit<Handoff, "id" | "created_at">): Promise<Handoff> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("handoffs").insert(handoff).select().single();

  if (error) throw error;
  return data;
}

export async function listPendingHandoffs(toAgent: string): Promise<Handoff[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("handoffs")
    .select("*")
    .eq("to_agent", toAgent)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function acceptHandoff(id: string): Promise<Handoff> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("handoffs")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeHandoff(id: string, notes?: string): Promise<Handoff> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("handoffs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      response_notes: notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// DEADLINE OPERATIONS
// =============================================================================

export async function listUpcomingDeadlines(opts?: {
  jurisdiction?: Jurisdiction;
  assigned_agent?: string;
  daysAhead?: number;
}): Promise<Deadline[]> {
  const supabase = getSupabaseClient();
  const daysAhead = opts?.daysAhead ?? 30;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  let query = supabase
    .from("deadlines")
    .select("*, entities(name)")
    .gte("due_date", new Date().toISOString().split("T")[0])
    .lte("due_date", futureDate.toISOString().split("T")[0])
    .in("status", ["upcoming", "pending", "in_progress"]);

  if (opts?.jurisdiction) {
    query = query.eq("jurisdiction", opts.jurisdiction);
  }
  if (opts?.assigned_agent) {
    query = query.eq("assigned_agent", opts.assigned_agent);
  }

  const { data, error } = await query.order("due_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createDeadline(
  deadline: Omit<Deadline, "id" | "created_at" | "updated_at">,
): Promise<Deadline> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("deadlines").insert(deadline).select().single();

  if (error) throw error;
  return data;
}

// =============================================================================
// INCIDENT OPERATIONS
// =============================================================================

export async function listIncidents(opts?: {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  jurisdiction?: Jurisdiction;
  limit?: number;
}): Promise<Incident[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from("incidents").select("*");

  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  if (opts?.severity) {
    query = query.eq("severity", opts.severity);
  }
  if (opts?.jurisdiction) {
    query = query.eq("jurisdiction", opts.jurisdiction);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query.order("reported_at", {
    ascending: false,
  });
  if (error) throw error;
  return data || [];
}

export async function createIncident(
  incident: Omit<Incident, "id" | "created_at" | "updated_at" | "reported_at">,
): Promise<Incident> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("incidents").insert(incident).select().single();

  if (error) throw error;
  return data;
}

export async function resolveIncident(
  id: string,
  resolution: string,
  resolvedBy: string,
): Promise<Incident> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("incidents")
    .update({
      status: "resolved",
      resolution,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// TOWER STATS (for dashboard)
// =============================================================================

export interface TowerStats {
  activeWorkstreams: number;
  pendingQC: number;
  openIncidents: number;
  upcomingDeadlines: number;
  activeEntities: number;
  agentUtilization: Record<string, number>;
}

export async function getTowerStats(): Promise<TowerStats> {
  const supabase = getSupabaseClient();

  const [workstreams, qcPending, incidents, deadlines, entities] = await Promise.all([
    supabase
      .from("workstreams")
      .select("count", { count: "exact", head: true })
      .in("status", ["in_progress", "pending"]),
    supabase
      .from("workstreams")
      .select("count", { count: "exact", head: true })
      .eq("status", "pending_qc"),
    supabase
      .from("incidents")
      .select("count", { count: "exact", head: true })
      .in("status", ["open", "investigating"]),
    supabase
      .from("deadlines")
      .select("count", { count: "exact", head: true })
      .gte("due_date", new Date().toISOString().split("T")[0])
      .lte("due_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .in("status", ["upcoming", "pending"]),
    supabase
      .from("entities")
      .select("count", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  // Get agent utilization (count of active workstreams per agent)
  const { data: agentCounts } = await supabase
    .from("workstreams")
    .select("assigned_agent")
    .in("status", ["in_progress", "pending"]);

  const agentUtilization: Record<string, number> = {};
  if (agentCounts) {
    for (const row of agentCounts) {
      const agent = row.assigned_agent;
      agentUtilization[agent] = (agentUtilization[agent] || 0) + 1;
    }
  }

  return {
    activeWorkstreams: workstreams.count || 0,
    pendingQC: qcPending.count || 0,
    openIncidents: incidents.count || 0,
    upcomingDeadlines: deadlines.count || 0,
    activeEntities: entities.count || 0,
    agentUtilization,
  };
}
