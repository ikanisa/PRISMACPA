
/**
 * Release Gates Module
 * 
 * Re-exports Marco's release gate workflow from @firmos/programs.
 * Integrates with FirmOS config for policy-driven authorization.
 * In v2027+, implementations will live here directly.
 */

import { getSupabaseClient } from '../lib/db.js';
import { logAction } from '../audit_log/index.js';
import { getQCHistory } from '../qc_gates/index.js';

// Re-export types and functions from canonical source
export {
    type ReleaseType,
    type ReleaseStatus,
    type ReleaseRequest,
    type ReleaseDecision,
    type ReleaseWorkflow,
    createReleaseRequest,
    runReleaseQC,
    authorizeRelease,
    denyRelease,
    executeRelease as executeReleaseWorkflow, // Renamed to avoid conflict
    rollbackRelease,
    getReleaseWorkflow,
    getPendingReleases,
    validateReleasePackAccess
} from "@firmos/programs/release-gate-workflow.js";

// Config integration
import {
    loadFirmOSConfig,
    requiresReleaseGate,
    getReleaseGateOwner,
    getAgentById,
    type AutonomyLevel
} from "@firmos/core";

// Module-specific types for future expansion
export type ReleaseStatusSimple =
    | "pending_qc"
    | "pending_authorization"
    | "authorized"
    | "denied"
    | "released";

export interface ReleaseRequestSimple {
    workpaperId: string;
    requestedBy: string;
    description: string;
    metadata?: Record<string, unknown>;
}

export interface ReleaseRecord {
    id: string;
    workpaperId: string;
    status: ReleaseStatusSimple;
    requestedBy: string;
    requestedAt: Date;
    authorizedBy?: string;
    authorizedAt?: Date;
    releasedAt?: Date;
    metadata: Record<string, unknown>;
}

/**
 * Check if release gate is required for an autonomy level (policy-driven)
 */
export function isReleaseRequired(autonomyLevel: string): boolean {
    return requiresReleaseGate(autonomyLevel as AutonomyLevel);
}

/**
 * Check if a specific agent requires release authorization
 */
export function agentRequiresRelease(agentId: string): boolean {
    const agent = getAgentById(agentId);
    if (!agent) { return true; } // Fail safe: require release if agent unknown
    return requiresReleaseGate(agent.autonomy);
}

/**
 * Get the release gate owner agent ID from policy (typically "marco")
 */
export function getReleaseOwner(): string {
    return getReleaseGateOwner();
}

/**
 * Request a Release (Persisted)
 */
export async function requestRelease(request: ReleaseRequestSimple): Promise<ReleaseRecord> {
    const supabase = getSupabaseClient();

    // 1. Check QC Gates
    const qcHistory = await getQCHistory(request.workpaperId);
    const lastQC = qcHistory[0];

    // If no passing QC, reject via failure (or could allow pending_qc status)
    if (!lastQC || lastQC.outcome !== 'PASS') {
        throw new Error("Cannot request release: Workpaper has not passed QC.");
    }

    // 2. Insert Release Request
    const dbEntry = {
        workpaper_id: request.workpaperId,
        status: 'pending_authorization',
        requested_by: request.requestedBy,
        metadata: request.metadata || {}
    };

    const { data, error } = await supabase
        .from('releases')
        .insert(dbEntry)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to request release: ${error.message}`);
    }

    const record = mapDbToReleaseRecord(data);

    // 3. Audit Log
    await logAction({
        action: 'release_requested',
        actor: request.requestedBy,
        resourceType: 'release',
        resourceId: record.id,
        details: {
            workpaperId: request.workpaperId,
            qcReference: lastQC.id
        }
    });

    return record;
}

/**
 * Authorize (or Deny) a Release
 */
export async function authorizeReleaseSimple(
    releaseId: string,
    decision: 'authorized' | 'denied',
    actor: string
): Promise<ReleaseRecord> {
    const supabase = getSupabaseClient();

    // Verify actor authority (basic check)
    // In strict mode, check if actor === getReleaseOwner() or is admin

    const updates: any = {
        status: decision,
        authorized_by: actor,
        authorized_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('releases')
        .update(updates)
        .eq('id', releaseId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update release: ${error.message}`);
    }

    const record = mapDbToReleaseRecord(data);

    await logAction({
        action: decision === 'authorized' ? 'release_authorized' : 'release_denied',
        actor,
        resourceType: 'release',
        resourceId: releaseId,
        details: { decision }
    });

    return record;
}

/**
 * Execute Release (Move to Released state)
 */
export async function executeRelease(releaseId: string, actor: string): Promise<ReleaseRecord> {
    const supabase = getSupabaseClient();

    // Must be authorized first
    const current = await getReleaseById(releaseId);
    if (!current || current.status !== 'authorized') {
        throw new Error("Cannot execute release: Release is not authorized.");
    }

    const { data, error } = await supabase
        .from('releases')
        .update({
            status: 'released',
            released_at: new Date().toISOString()
        })
        .eq('id', releaseId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to execute release: ${error.message}`);
    }

    const record = mapDbToReleaseRecord(data);

    await logAction({
        action: 'release_executed',
        actor,
        resourceType: 'release',
        resourceId: releaseId,
        details: {}
    });

    return record;
}

/**
 * Get Release Status by Workpaper
 */
export async function getReleaseStatus(workpaperId: string): Promise<ReleaseStatusSimple | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('releases')
        .select('status')
        .eq('workpaper_id', workpaperId)
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        throw new Error(`Failed to fetch release status: ${error.message}`);
    }

    return data ? (data.status as ReleaseStatusSimple) : null;
}

async function getReleaseById(id: string): Promise<ReleaseRecord | null> {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('releases').select('*').eq('id', id).single();
    return data ? mapDbToReleaseRecord(data) : null;
}

// Helper
function mapDbToReleaseRecord(row: any): ReleaseRecord {
    return {
        id: row.id,
        workpaperId: row.workpaper_id,
        status: row.status,
        requestedBy: row.requested_by,
        requestedAt: new Date(row.requested_at),
        authorizedBy: row.authorized_by,
        authorizedAt: row.authorized_at ? new Date(row.authorized_at) : undefined,
        releasedAt: row.released_at ? new Date(row.released_at) : undefined,
        metadata: row.metadata || {}
    };
}
