
/**
 * Case Management Module
 * 
 * Client engagement and case lifecycle management.
 */

import { getSupabaseClient } from '../lib/db.js';
import { logAction } from '../audit_log/index.js';

// Types
export type CaseStatus =
    | "intake"
    | "active"
    | "in_progress"
    | "pending_review"
    | "completed"
    | "archived";

export interface Case {
    id: string;
    clientId: string;
    clientName: string;
    description?: string;
    jurisdiction: "MT" | "RW";
    serviceType: string;
    status: CaseStatus;
    assignedAgent: string;
    createdAt: Date;
    dueDate?: Date;
    metadata: Record<string, unknown>;
}

export interface CaseCreateParams {
    clientId: string;
    clientName: string;
    description?: string;
    jurisdiction: Case["jurisdiction"];
    serviceType: string;
    dueDate?: Date;
    metadata?: Record<string, unknown>;
    assignedAgent?: string;
}

export interface CaseFilter {
    clientId?: string;
    status?: CaseStatus;
    jurisdiction?: Case["jurisdiction"];
    assignedAgent?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
}

// Public API

/**
 * Create a new case
 */
export async function createCase(params: CaseCreateParams, actor: string = 'system'): Promise<Case> {
    const supabase = getSupabaseClient();

    const dbEntry = {
        client_id: params.clientId,
        client_name: params.clientName,
        jurisdiction: params.jurisdiction,
        service_type: params.serviceType,
        status: 'intake',
        assigned_agent: params.assignedAgent || null,
        description: params.description || null,
        due_date: params.dueDate ? params.dueDate.toISOString() : null,
        metadata: params.metadata || {},
    };

    const { data, error } = await supabase
        .from('cases')
        .insert(dbEntry)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create case: ${error.message}`);
    }

    const newCase = mapDbToCase(data);

    await logAction({
        action: 'case_created',
        actor: actor,
        resourceType: 'case',
        resourceId: newCase.id,
        details: {
            serviceType: params.serviceType,
            jurisdiction: params.jurisdiction,
        }
    });

    return newCase;
}

/**
 * Get case by ID
 */
export async function getCase(caseId: string): Promise<Case | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

    if (error) return null;

    return mapDbToCase(data);
}

/**
 * Update case status
 */
export async function updateCaseStatus(caseId: string, status: CaseStatus, actor: string = 'system'): Promise<Case> {
    const supabase = getSupabaseClient();

    // Get current for audit
    const current = await getCase(caseId);
    if (!current) throw new Error('Case not found');

    const { data, error } = await supabase
        .from('cases')
        .update({ status })
        .eq('id', caseId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update case status: ${error.message}`);
    }

    const updated = mapDbToCase(data);

    await logAction({
        action: 'case_status_changed',
        actor: actor,
        resourceType: 'case',
        resourceId: caseId,
        details: { from: current.status, to: status },
        previousState: current as unknown as Record<string, unknown>,
        newState: updated as unknown as Record<string, unknown>
    });

    return updated;
}

/**
 * List cases with filtering
 */
export async function listCases(filter: CaseFilter): Promise<Case[]> {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

    if (filter.clientId) query = query.eq('client_id', filter.clientId);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.jurisdiction) query = query.eq('jurisdiction', filter.jurisdiction);
    if (filter.assignedAgent) query = query.eq('assigned_agent', filter.assignedAgent);
    if (filter.from) query = query.gte('created_at', filter.from.toISOString());
    if (filter.to) query = query.lte('created_at', filter.to.toISOString());

    if (filter.limit) query = query.limit(filter.limit);
    if (filter.offset) query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to list cases: ${error.message}`);
    }

    return (data || []).map(mapDbToCase);
}

/**
 * Assign an agent to a case
 */
export async function assignAgent(caseId: string, agentId: string, actor: string = 'system'): Promise<Case> {
    const supabase = getSupabaseClient();

    const current = await getCase(caseId);
    if (!current) throw new Error('Case not found');

    const { data, error } = await supabase
        .from('cases')
        .update({ assigned_agent: agentId })
        .eq('id', caseId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to assign agent: ${error.message}`);
    }

    const updated = mapDbToCase(data);

    await logAction({
        action: 'agent_assigned',
        actor: actor,
        resourceType: 'case',
        resourceId: caseId,
        details: { agentId },
        previousState: current as unknown as Record<string, unknown>,
        newState: updated as unknown as Record<string, unknown>
    });

    return updated;
}

// Helpers
function mapDbToCase(row: any): Case {
    return {
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        description: row.description,
        jurisdiction: row.jurisdiction,
        serviceType: row.service_type,
        status: row.status,
        assignedAgent: row.assigned_agent,
        createdAt: new Date(row.created_at),
        dueDate: row.due_date ? new Date(row.due_date) : undefined,
        metadata: row.metadata,
    };
}
