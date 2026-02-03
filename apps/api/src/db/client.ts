/**
 * FirmOS Database Client
 * 
 * Supabase/PostgreSQL connection for FirmOS API and modules.
 * Uses the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Database types generated from schema
 * TODO: Generate from supabase gen types
 */
export interface Database {
    public: {
        Tables: {
            cases: {
                Row: CaseRow;
                Insert: CaseInsert;
                Update: CaseUpdate;
            };
            audit_log: {
                Row: AuditLogRow;
                Insert: AuditLogInsert;
                Update: never; // Immutable
            };
            incidents: {
                Row: IncidentRow;
                Insert: IncidentInsert;
                Update: IncidentUpdate;
            };
            releases: {
                Row: ReleaseRow;
                Insert: ReleaseInsert;
                Update: ReleaseUpdate;
            };
            delegations: {
                Row: DelegationRow;
                Insert: DelegationInsert;
                Update: DelegationUpdate;
            };
            policy_decisions: {
                Row: PolicyDecisionRow;
                Insert: PolicyDecisionInsert;
                Update: never;
            };
            qc_results: {
                Row: QCResultRow;
                Insert: QCResultInsert;
                Update: never;
            };
            templates: {
                Row: TemplateRow;
                Insert: TemplateInsert;
                Update: TemplateUpdate;
            };
            template_usage: {
                Row: TemplateUsageRow;
                Insert: TemplateUsageInsert;
                Update: never;
            };
        };
    };
}

// =============================================================================
// ROW TYPES
// =============================================================================

export interface CaseRow {
    id: string;
    client_id: string;
    client_name: string;
    jurisdiction: 'MT' | 'RW' | null;
    service_type: string;
    status: 'intake' | 'active' | 'in_progress' | 'pending_review' | 'completed' | 'archived';
    assigned_agent: string;
    due_date: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface CaseInsert {
    id?: string;
    client_id: string;
    client_name: string;
    jurisdiction?: 'MT' | 'RW' | null;
    service_type: string;
    status?: CaseRow['status'];
    assigned_agent: string;
    due_date?: string | null;
    metadata?: Record<string, unknown>;
}

export interface CaseUpdate {
    client_name?: string;
    jurisdiction?: 'MT' | 'RW' | null;
    service_type?: string;
    status?: CaseRow['status'];
    assigned_agent?: string;
    due_date?: string | null;
    metadata?: Record<string, unknown>;
}

export interface AuditLogRow {
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    actor_type: 'agent' | 'operator' | 'system';
    resource_type: string;
    resource_id: string;
    details: Record<string, unknown>;
    previous_state: Record<string, unknown> | null;
    new_state: Record<string, unknown> | null;
    session_id: string | null;
    workstream_id: string | null;
    engagement_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
}

export interface AuditLogInsert {
    id?: string;
    action: string;
    actor: string;
    actor_type: 'agent' | 'operator' | 'system';
    resource_type: string;
    resource_id: string;
    details?: Record<string, unknown>;
    previous_state?: Record<string, unknown> | null;
    new_state?: Record<string, unknown> | null;
    session_id?: string | null;
    workstream_id?: string | null;
    engagement_id?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
}

export interface IncidentRow {
    id: string;
    type: 'security' | 'compliance' | 'operational' | 'policy';
    title: string;
    description: string | null;
    severity: 'critical' | 'high' | 'medium' | 'low';
    reporter: string;
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    affected_clients: number;
    affected_workstreams: string[];
    jurisdiction: 'MT' | 'RW' | null;
    resolution: string | null;
    resolved_by: string | null;
    resolved_at: string | null;
    root_cause: string | null;
    preventive_actions: unknown[];
    reported_at: string;
    created_at: string;
    updated_at: string;
}

export interface IncidentInsert {
    id?: string;
    type: IncidentRow['type'];
    title: string;
    description?: string;
    severity: IncidentRow['severity'];
    reporter: string;
    status?: IncidentRow['status'];
    affected_clients?: number;
    affected_workstreams?: string[];
    jurisdiction?: 'MT' | 'RW' | null;
}

export interface IncidentUpdate {
    title?: string;
    description?: string;
    severity?: IncidentRow['severity'];
    status?: IncidentRow['status'];
    affected_clients?: number;
    resolution?: string;
    resolved_by?: string;
    resolved_at?: string;
    root_cause?: string;
    preventive_actions?: unknown[];
}

export interface ReleaseRow {
    id: string;
    type: 'template' | 'policy' | 'workflow' | 'service';
    name: string;
    version: string;
    requested_by: string;
    requested_at: string;
    jurisdiction: 'MT' | 'RW' | null;
    target_pack: string | null;
    status: 'pending' | 'approved' | 'denied' | 'deployed';
    priority: 'critical' | 'high' | 'normal';
    qc_passed: boolean;
    qc_report_id: string | null;
    change_log: string | null;
    affected_components: unknown[];
    authorized_by: string | null;
    authorized_at: string | null;
    authorization_notes: string | null;
    deployed_at: string | null;
    deployment_notes: string | null;
    can_rollback: boolean;
    rollback_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ReleaseInsert {
    id?: string;
    type: ReleaseRow['type'];
    name: string;
    version: string;
    requested_by: string;
    jurisdiction?: 'MT' | 'RW' | null;
    target_pack?: string;
    status?: ReleaseRow['status'];
    priority?: ReleaseRow['priority'];
    change_log?: string;
    affected_components?: unknown[];
}

export interface ReleaseUpdate {
    status?: ReleaseRow['status'];
    priority?: ReleaseRow['priority'];
    qc_passed?: boolean;
    qc_report_id?: string;
    authorized_by?: string;
    authorized_at?: string;
    authorization_notes?: string;
    deployed_at?: string;
    deployment_notes?: string;
    rollback_notes?: string;
}

export interface DelegationRow {
    id: string;
    from_agent: string;
    to_agent: string;
    task_type: string;
    task_description: string | null;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    workstream_id: string | null;
    engagement_id: string | null;
    client_name: string | null;
    delegated_at: string;
    accepted_at: string | null;
    completed_at: string | null;
    due_date: string | null;
    delegation_reason: string | null;
    completion_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface DelegationInsert {
    id?: string;
    from_agent: string;
    to_agent: string;
    task_type: string;
    task_description?: string;
    status?: DelegationRow['status'];
    workstream_id?: string;
    engagement_id?: string;
    client_name?: string;
    due_date?: string;
    delegation_reason?: string;
}

export interface DelegationUpdate {
    status?: DelegationRow['status'];
    accepted_at?: string;
    completed_at?: string;
    completion_notes?: string;
}

export interface PolicyDecisionRow {
    id: string;
    policy_id: string;
    policy_name: string;
    jurisdiction: 'MT' | 'RW' | null;
    pack: string | null;
    decided_by: string;
    decision: 'approve' | 'deny' | 'escalate';
    reasoning: string | null;
    inputs: Record<string, unknown>;
    rule_version: string | null;
    requested_by: string;
    requested_at: string;
    workstream_id: string | null;
    engagement_id: string | null;
    created_at: string;
}

export interface PolicyDecisionInsert {
    id?: string;
    policy_id: string;
    policy_name: string;
    jurisdiction?: 'MT' | 'RW' | null;
    pack?: string;
    decided_by: string;
    decision: PolicyDecisionRow['decision'];
    reasoning?: string;
    inputs?: Record<string, unknown>;
    rule_version?: string;
    requested_by: string;
    workstream_id?: string;
    engagement_id?: string;
}

export interface QCResultRow {
    id: string;
    workpaper_id: string;
    workstream_id: string | null;
    gate_type: string;
    gate_version: string | null;
    passed: boolean;
    score: number | null;
    checks_performed: unknown[];
    checks_passed: number;
    checks_failed: number;
    checks_warnings: number;
    findings: unknown[];
    recommendations: unknown[];
    executed_by: string;
    executed_at: string;
    created_at: string;
}

export interface QCResultInsert {
    id?: string;
    workpaper_id: string;
    workstream_id?: string;
    gate_type: string;
    gate_version?: string;
    passed: boolean;
    score?: number;
    checks_performed?: unknown[];
    checks_passed?: number;
    checks_failed?: number;
    checks_warnings?: number;
    findings?: unknown[];
    recommendations?: unknown[];
    executed_by: string;
}

export interface TemplateRow {
    id: string;
    template_id: string;
    version: string;
    name: string;
    description: string | null;
    category: string;
    jurisdiction: 'MT' | 'RW' | null;
    pack: string | null;
    content_path: string;
    content_hash: string;
    status: 'draft' | 'pending_qc' | 'published' | 'deprecated';
    created_by: string;
    published_by: string | null;
    published_at: string | null;
    qc_passed: boolean;
    qc_result_id: string | null;
    usage_count: number;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface TemplateInsert {
    id?: string;
    template_id: string;
    version: string;
    name: string;
    description?: string;
    category: string;
    jurisdiction?: 'MT' | 'RW' | null;
    pack?: string;
    content_path: string;
    content_hash: string;
    status?: TemplateRow['status'];
    created_by: string;
}

export interface TemplateUpdate {
    name?: string;
    description?: string;
    category?: string;
    status?: TemplateRow['status'];
    published_by?: string;
    published_at?: string;
    qc_passed?: boolean;
    qc_result_id?: string;
    usage_count?: number;
    last_used_at?: string;
}

export interface TemplateUsageRow {
    id: string;
    template_id: string;
    workstream_id: string | null;
    engagement_id: string | null;
    document_id: string | null;
    used_by: string;
    used_at: string;
}

export interface TemplateUsageInsert {
    id?: string;
    template_id: string;
    workstream_id?: string;
    engagement_id?: string;
    document_id?: string;
    used_by: string;
}

// =============================================================================
// CLIENT SINGLETON
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: SupabaseClient<any> | null = null;

/**
 * Get the Supabase client instance
 * Uses service role key for server-side operations
 * Note: Using 'any' type until proper types are generated via supabase gen types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseClient(): SupabaseClient<any> {
    if (supabaseClient) {
        return supabaseClient;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
        );
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return supabaseClient;
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<{
    connected: boolean;
    error?: string;
    latencyMs?: number;
}> {
    const start = Date.now();
    try {
        const client = getSupabaseClient();
        // Simple query to test connection
        const { error } = await client.from('audit_log').select('id').limit(1);

        if (error) {
            return { connected: false, error: error.message };
        }

        return { connected: true, latencyMs: Date.now() - start };
    } catch (err) {
        return {
            connected: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}

/**
 * Reset client (for testing)
 */
export function resetSupabaseClient(): void {
    supabaseClient = null;
}
