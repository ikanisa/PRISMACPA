// Imports
import { getSupabaseClient } from '../lib/db.js';

// Types
export type AuditAction =
    | "task_created"
    | "task_routed"
    | "case_created"
    | "case_updated"
    | "case_status_changed"
    | "agent_assigned"
    | "workpaper_updated"
    | "evidence_attached"
    | "incident_reported"
    | "incident_resolved"
    | "qc_submitted"
    | "qc_completed"
    | "qc_gate_executed"
    | "template_created"
    | "template_published"
    | "release_requested"
    | "release_authorized"
    | "release_executed"
    | "release_denied"
    | "delegation_created"
    | "delegation_accepted"
    | "delegation_completed"
    | "escalation_triggered";

export interface AuditEntry {
    id: string;
    timestamp: Date;
    action: AuditAction;
    actor: string;
    actor_type?: 'agent' | 'operator' | 'system';
    resourceType: string;
    resourceId: string;
    details: Record<string, unknown>;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    ipAddress?: string;
    sessionId?: string;
    workstreamId?: string;
    engagementId?: string;
}

export interface AuditQuery {
    resourceId?: string;
    resourceType?: string;
    actor?: string;
    action?: AuditAction;
    from?: Date;
    to?: Date;
    limit?: number;
}

// Public API
export async function logAction(
    entry: Omit<AuditEntry, "id" | "timestamp">
): Promise<AuditEntry> {
    const supabase = getSupabaseClient();

    // Map to DB column names (camelCase -> snake_case)
    const dbEntry = {
        action: entry.action,
        actor: entry.actor,
        actor_type: entry.actor_type || 'system',
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        details: entry.details,
        previous_state: entry.previousState,
        new_state: entry.newState,
        ip_address: entry.ipAddress,
        session_id: entry.sessionId,
        workstream_id: entry.workstreamId,
        engagement_id: entry.engagementId,
        // Timestamp is handled by default NOW() in DB, but we fetch it back
    };

    const { data, error } = await supabase
        .from('audit_log')
        .insert(dbEntry)
        .select()
        .single();

    if (error) {
        console.error('Failed to write audit log:', error);
        throw new Error(`Audit log failure: ${error.message}`);
    }

    // Map back to domain model
    return mapDbToAuditEntry(data);
}

export async function queryAuditLog(query: AuditQuery): Promise<AuditEntry[]> {
    const supabase = getSupabaseClient();

    let builder = supabase
        .from('audit_log')
        .select('*')
        .order('timestamp', { ascending: false });

    if (query.resourceId) builder = builder.eq('resource_id', query.resourceId);
    if (query.resourceType) builder = builder.eq('resource_type', query.resourceType);
    if (query.actor) builder = builder.eq('actor', query.actor);
    if (query.action) builder = builder.eq('action', query.action);
    if (query.from) builder = builder.gte('timestamp', query.from.toISOString());
    if (query.to) builder = builder.lte('timestamp', query.to.toISOString());
    if (query.limit) builder = builder.limit(query.limit);

    const { data, error } = await builder;

    if (error) {
        throw new Error(`Audit query failure: ${error.message}`);
    }

    return (data || []).map(mapDbToAuditEntry);
}

export async function getResourceHistory(
    resourceType: string,
    resourceId: string
): Promise<AuditEntry[]> {
    return queryAuditLog({
        resourceType,
        resourceId,
        limit: 50 // Default history limit
    });
}

// Helper
function mapDbToAuditEntry(dbRow: any): AuditEntry {
    return {
        id: dbRow.id,
        timestamp: new Date(dbRow.timestamp),
        action: dbRow.action as AuditAction,
        actor: dbRow.actor,
        actor_type: dbRow.actor_type,
        resourceType: dbRow.resource_type,
        resourceId: dbRow.resource_id,
        details: dbRow.details,
        previousState: dbRow.previous_state,
        newState: dbRow.new_state,
        ipAddress: dbRow.ip_address,
        sessionId: dbRow.session_id,
        workstreamId: dbRow.workstream_id,
        engagementId: dbRow.engagement_id
    };
}
