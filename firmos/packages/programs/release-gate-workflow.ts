/**
 * Marco Release Gate Workflow
 *
 * Governor agent's release authorization and gating.
 * Controls what gets released to production.
 */

import { loadConfig } from '../core/config-loader.js';
import { runQCGate, type QCGateResult, type QCContext } from './qc-gate-runner.js';

// Release types
export type ReleaseType =
    | 'template_publish'
    | 'service_update'
    | 'agent_config'
    | 'pack_release'
    | 'emergency_fix';

export type ReleaseStatus =
    | 'pending'
    | 'qc_in_progress'
    | 'qc_passed'
    | 'qc_failed'
    | 'authorized'
    | 'denied'
    | 'executed'
    | 'rolled_back';

export interface ReleaseRequest {
    release_id: string;
    type: ReleaseType;
    pack_id: string;
    requester_agent: string;
    description: string;
    artifact_refs: string[];
    evidence_refs: string[];
    metadata?: Record<string, unknown>;
}

export interface ReleaseDecision {
    release_id: string;
    status: ReleaseStatus;
    decided_by: 'marco' | 'operator';
    decided_at: string;
    qc_result?: QCGateResult;
    conditions?: string[];
    denial_reason?: string;
    execution_notes?: string;
}

export interface ReleaseWorkflow {
    request: ReleaseRequest;
    decisions: ReleaseDecision[];
    current_status: ReleaseStatus;
    created_at: string;
    updated_at: string;
}

// In-memory workflow store (replace with DB in production)
const workflows = new Map<string, ReleaseWorkflow>();

/**
 * Create a new release request
 */
export function createReleaseRequest(request: ReleaseRequest): ReleaseWorkflow {
    const now = new Date().toISOString();

    const workflow: ReleaseWorkflow = {
        request,
        decisions: [{
            release_id: request.release_id,
            status: 'pending',
            decided_by: 'marco',
            decided_at: now
        }],
        current_status: 'pending',
        created_at: now,
        updated_at: now
    };

    workflows.set(request.release_id, workflow);
    return workflow;
}

/**
 * Run QC gate for a release
 */
export async function runReleaseQC(releaseId: string): Promise<ReleaseWorkflow | null> {
    const workflow = workflows.get(releaseId);
    if (!workflow) return null;

    // Update status
    workflow.current_status = 'qc_in_progress';
    workflow.updated_at = new Date().toISOString();

    // Build QC context
    const ctx: QCContext = {
        service_id: `release_${workflow.request.type}`,
        task_id: `RELEASE_${releaseId}`,
        agent_id: workflow.request.requester_agent,
        outputs: workflow.request.metadata ?? {},
        evidence_refs: workflow.request.evidence_refs,
        pack_id: workflow.request.pack_id
    };

    // Run QC gate
    const qcResult = await runQCGate(
        `GATE_RELEASE_${releaseId}`,
        `Release QC: ${workflow.request.description}`,
        ctx
    );

    // Record decision
    const newStatus: ReleaseStatus = qcResult.status === 'passed' ? 'qc_passed' : 'qc_failed';

    workflow.decisions.push({
        release_id: releaseId,
        status: newStatus,
        decided_by: 'marco',
        decided_at: new Date().toISOString(),
        qc_result: qcResult
    });

    workflow.current_status = newStatus;
    workflow.updated_at = new Date().toISOString();

    return workflow;
}

/**
 * Authorize a release (after QC passes)
 */
export function authorizeRelease(
    releaseId: string,
    conditions?: string[]
): ReleaseWorkflow | null {
    const workflow = workflows.get(releaseId);
    if (!workflow) return null;

    // Only authorize if QC passed
    if (workflow.current_status !== 'qc_passed') {
        console.warn(`[Marco] Cannot authorize release ${releaseId}: status is ${workflow.current_status}`);
        return workflow;
    }

    workflow.decisions.push({
        release_id: releaseId,
        status: 'authorized',
        decided_by: 'marco',
        decided_at: new Date().toISOString(),
        conditions
    });

    workflow.current_status = 'authorized';
    workflow.updated_at = new Date().toISOString();

    return workflow;
}

/**
 * Deny a release
 */
export function denyRelease(
    releaseId: string,
    reason: string
): ReleaseWorkflow | null {
    const workflow = workflows.get(releaseId);
    if (!workflow) return null;

    workflow.decisions.push({
        release_id: releaseId,
        status: 'denied',
        decided_by: 'marco',
        decided_at: new Date().toISOString(),
        denial_reason: reason
    });

    workflow.current_status = 'denied';
    workflow.updated_at = new Date().toISOString();

    return workflow;
}

/**
 * Mark a release as executed
 */
export function executeRelease(
    releaseId: string,
    notes?: string
): ReleaseWorkflow | null {
    const workflow = workflows.get(releaseId);
    if (!workflow) return null;

    // Only execute if authorized
    if (workflow.current_status !== 'authorized') {
        console.warn(`[Marco] Cannot execute release ${releaseId}: not authorized`);
        return workflow;
    }

    workflow.decisions.push({
        release_id: releaseId,
        status: 'executed',
        decided_by: 'marco',
        decided_at: new Date().toISOString(),
        execution_notes: notes
    });

    workflow.current_status = 'executed';
    workflow.updated_at = new Date().toISOString();

    return workflow;
}

/**
 * Rollback an executed release
 */
export function rollbackRelease(
    releaseId: string,
    reason: string
): ReleaseWorkflow | null {
    const workflow = workflows.get(releaseId);
    if (!workflow) return null;

    // Only rollback if executed
    if (workflow.current_status !== 'executed') {
        console.warn(`[Marco] Cannot rollback release ${releaseId}: not executed`);
        return workflow;
    }

    workflow.decisions.push({
        release_id: releaseId,
        status: 'rolled_back',
        decided_by: 'marco',
        decided_at: new Date().toISOString(),
        denial_reason: reason
    });

    workflow.current_status = 'rolled_back';
    workflow.updated_at = new Date().toISOString();

    return workflow;
}

/**
 * Get release workflow status
 */
export function getReleaseWorkflow(releaseId: string): ReleaseWorkflow | null {
    return workflows.get(releaseId) ?? null;
}

/**
 * Get all pending releases
 */
export function getPendingReleases(): ReleaseWorkflow[] {
    return Array.from(workflows.values()).filter(
        w => w.current_status === 'pending' || w.current_status === 'qc_passed'
    );
}

/**
 * Validate pack access for release
 */
export function validateReleasePackAccess(releaseId: string): boolean {
    const workflow = workflows.get(releaseId);
    if (!workflow) return false;

    const config = loadConfig();
    const agent = config.agents[workflow.request.requester_agent];

    if (!agent) return false;

    return agent.pack_access.includes(workflow.request.pack_id) ||
        agent.pack_access.includes('*');
}
