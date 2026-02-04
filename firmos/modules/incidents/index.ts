
import { getSupabaseClient } from '../lib/db.js';
import { logAction } from '../audit_log/index.js';

// Types
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface Incident {
    id: string;
    description: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    reportedBy: string;
    detectedAt: Date;
    resolvedAt?: Date;
    resolutionNotes?: string;
    metadata: Record<string, unknown>;
}

export interface IncidentCreateOps {
    description: string;
    severity: IncidentSeverity;
    reportedBy: string;
    metadata?: Record<string, unknown>;
}

export interface IncidentFilter {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    reportedBy?: string;
    from?: Date;
    to?: Date;
    limit?: number;
}

/**
 * Report a new incident
 */
export async function reportIncident(ops: IncidentCreateOps): Promise<Incident> {
    const supabase = getSupabaseClient();

    // 1. Insert incident
    const dbEntry = {
        description: ops.description,
        severity: ops.severity,
        status: 'open',
        reported_by: ops.reportedBy,
        metadata: ops.metadata || {},
    };

    const { data, error } = await supabase
        .from('incidents')
        .insert(dbEntry)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to report incident: ${error.message}`);
    }

    const incident = mapDbToIncident(data);

    // 2. Audit log
    await logAction({
        action: 'incident_reported',
        actor: ops.reportedBy,
        resourceType: 'incident',
        resourceId: incident.id,
        details: {
            severity: ops.severity,
            description: ops.description,
        }
    });

    return incident;
}

/**
 * Update an incident
 */
export async function updateIncident(
    id: string,
    updates: Partial<Omit<Incident, 'id' | 'detectedAt' | 'reportedBy'>>,
    actor: string
): Promise<Incident> {
    const supabase = getSupabaseClient();

    // Get current state for audit
    const { data: current } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();

    if (!current) throw new Error('Incident not found');

    const dbUpdates: any = {};
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.severity) dbUpdates.severity = updates.severity;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.resolutionNotes) dbUpdates.resolution_notes = updates.resolutionNotes;
    if (updates.metadata) dbUpdates.metadata = updates.metadata;
    if (updates.resolvedAt) dbUpdates.resolved_at = updates.resolvedAt.toISOString();

    const { data, error } = await supabase
        .from('incidents')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update incident: ${error.message}`);
    }

    const updated = mapDbToIncident(data);

    // Audit log
    await logAction({
        action: updates.status === 'resolved' ? 'incident_resolved' : 'incident_reported',
        actor: actor,
        resourceType: 'incident',

        resourceId: id,
        details: updates,
        previousState: current,
        newState: data
    });

    return updated;
}

/**
 * Resolve an incident
 */
export async function resolveIncident(
    id: string,
    notes: string,
    actor: string
): Promise<Incident> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('incidents')
        .update({
            status: 'resolved',
            resolution_notes: notes,
            resolved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to resolve incident: ${error.message}`);
    }

    const incident = mapDbToIncident(data);

    await logAction({
        action: 'incident_resolved',
        actor: actor,
        resourceType: 'incident',
        resourceId: id,
        details: { notes }
    });

    return incident;
}

/**
 * List incidents
 */
export async function listIncidents(filter: IncidentFilter): Promise<Incident[]> {
    const supabase = getSupabaseClient();

    let builder = supabase
        .from('incidents')
        .select('*')
        .order('detected_at', { ascending: false });

    if (filter.status) builder = builder.eq('status', filter.status);
    if (filter.severity) builder = builder.eq('severity', filter.severity);
    if (filter.reportedBy) builder = builder.eq('reported_by', filter.reportedBy);
    if (filter.from) builder = builder.gte('detected_at', filter.from.toISOString());
    if (filter.to) builder = builder.lte('detected_at', filter.to.toISOString());
    if (filter.limit) builder = builder.limit(filter.limit);

    const { data, error } = await builder;

    if (error) {
        throw new Error(`Failed to list incidents: ${error.message}`);
    }

    return (data || []).map(mapDbToIncident);
}

/**
 * Get single incident
 */
export async function getIncident(id: string): Promise<Incident | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;

    return mapDbToIncident(data);
}

// Helper
function mapDbToIncident(row: any): Incident {
    return {
        id: row.id,
        description: row.description,
        severity: row.severity,
        status: row.status,
        reportedBy: row.reported_by,
        detectedAt: new Date(row.detected_at),
        resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
        resolutionNotes: row.resolution_notes,
        metadata: row.metadata,
    };
}
