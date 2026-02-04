/**
 * FirmOS Release Gate — Marco's Authorization System
 *
 * Implements the release workflow:
 * - requestRelease() — Engine agents request release
 * - authorizeRelease() — Marco-only authorization
 * - releaseAction() — System-level execution after authorization
 *
 * Guardrails:
 * - Diane PASS required before Marco can authorize
 * - Only Marco (agent_marco) can call authorizeRelease
 * - All release decisions are logged for audit
 */

import { z } from 'zod';

// =============================================================================
// TYPES
// =============================================================================

export type ReleaseStatus = 'PENDING' | 'AUTHORIZED' | 'DENIED' | 'EXECUTED' | 'ROLLED_BACK';

export interface ReleaseRequest {
    requestId: string;
    workstreamId: string;
    requestingAgentId: string;
    actionType: 'FILING' | 'SUBMISSION' | 'DELIVERY' | 'NOTIFICATION';
    targetSystem?: string; // e.g., 'MBR', 'RRA', 'Client'
    description: string;
    evidenceMapRef: string;
    guardianPassRef?: string;
    createdAt: Date;
}

export interface ReleaseDecision {
    requestId: string;
    decision: 'AUTHORIZE' | 'DENY' | 'HOLD';
    authorizingAgentId: string;
    ruleBasis: string[];
    evidenceBasis: string[];
    riskRationale: string;
    conditions?: string[];
    decidedAt: Date;
}

export interface ReleaseExecution {
    requestId: string;
    executedAt: Date;
    executedBy: string; // system or agent
    outcome: 'SUCCESS' | 'FAILURE';
    externalRef?: string; // e.g., filing receipt number
    notes?: string;
}

// =============================================================================
// SCHEMAS
// =============================================================================

export const ReleaseRequestSchema = z.object({
    requestId: z.string().uuid(),
    workstreamId: z.string(),
    requestingAgentId: z.string(),
    actionType: z.enum(['FILING', 'SUBMISSION', 'DELIVERY', 'NOTIFICATION']),
    targetSystem: z.string().optional(),
    description: z.string().min(1),
    evidenceMapRef: z.string(),
    guardianPassRef: z.string().optional(),
    createdAt: z.date()
});

export const ReleaseDecisionSchema = z.object({
    requestId: z.string().uuid(),
    decision: z.enum(['AUTHORIZE', 'DENY', 'HOLD']),
    authorizingAgentId: z.string(),
    ruleBasis: z.array(z.string()),
    evidenceBasis: z.array(z.string()),
    riskRationale: z.string(),
    conditions: z.array(z.string()).optional(),
    decidedAt: z.date()
});

// =============================================================================
// RELEASE GATE STATE
// =============================================================================

const releaseRequests = new Map<string, ReleaseRequest>();
const releaseDecisions = new Map<string, ReleaseDecision>();
const releaseExecutions = new Map<string, ReleaseExecution>();

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Request a release from Marco.
 * Called by engine agents when they have a deliverable ready for external action.
 */
export function requestRelease(request: Omit<ReleaseRequest, 'requestId' | 'createdAt'>): ReleaseRequest {
    const fullRequest: ReleaseRequest = {
        ...request,
        requestId: crypto.randomUUID(),
        createdAt: new Date()
    };

    // Validate
    ReleaseRequestSchema.parse(fullRequest);

    // Store
    releaseRequests.set(fullRequest.requestId, fullRequest);

    return fullRequest;
}

/**
 * Authorize (or deny) a release request.
 * ONLY Marco (agent_marco) can call this function.
 */
export function authorizeRelease(
    requestId: string,
    authorizingAgentId: string,
    decision: 'AUTHORIZE' | 'DENY' | 'HOLD',
    ruleBasis: string[],
    evidenceBasis: string[],
    riskRationale: string,
    conditions?: string[]
): ReleaseDecision {
    // Check Marco-only constraint
    if (authorizingAgentId !== 'agent_marco') {
        throw new Error(`SECURITY_VIOLATION: Only agent_marco can authorize releases. Attempted by: ${authorizingAgentId}`);
    }

    // Check request exists
    const request = releaseRequests.get(requestId);
    if (!request) {
        throw new Error(`Release request not found: ${requestId}`);
    }

    // Check Diane PASS requirement
    if (!request.guardianPassRef) {
        throw new Error(`GUARDIAN_REQUIRED: Cannot authorize release without Diane PASS. Request: ${requestId}`);
    }

    const releaseDecision: ReleaseDecision = {
        requestId,
        decision,
        authorizingAgentId,
        ruleBasis,
        evidenceBasis,
        riskRationale,
        conditions,
        decidedAt: new Date()
    };

    // Validate
    ReleaseDecisionSchema.parse(releaseDecision);

    // Store
    releaseDecisions.set(requestId, releaseDecision);

    return releaseDecision;
}

/**
 * Execute a release action after authorization.
 * Only callable for AUTHORIZED requests.
 */
export function executeRelease(
    requestId: string,
    executedBy: string,
    outcome: 'SUCCESS' | 'FAILURE',
    externalRef?: string,
    notes?: string
): ReleaseExecution {
    // Check authorization exists
    const decision = releaseDecisions.get(requestId);
    if (!decision) {
        throw new Error(`No release decision found for: ${requestId}`);
    }

    if (decision.decision !== 'AUTHORIZE') {
        throw new Error(`Cannot execute non-authorized release. Decision: ${decision.decision}`);
    }

    const execution: ReleaseExecution = {
        requestId,
        executedAt: new Date(),
        executedBy,
        outcome,
        externalRef,
        notes
    };

    releaseExecutions.set(requestId, execution);

    return execution;
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

export function getRelease(requestId: string): {
    request: ReleaseRequest | undefined;
    decision: ReleaseDecision | undefined;
    execution: ReleaseExecution | undefined;
} {
    return {
        request: releaseRequests.get(requestId),
        decision: releaseDecisions.get(requestId),
        execution: releaseExecutions.get(requestId)
    };
}

export function getPendingReleases(): ReleaseRequest[] {
    return Array.from(releaseRequests.values()).filter(
        r => !releaseDecisions.has(r.requestId)
    );
}

export function getReleasesByWorkstream(workstreamId: string): ReleaseRequest[] {
    return Array.from(releaseRequests.values()).filter(
        r => r.workstreamId === workstreamId
    );
}

/**
 * Check if a release can proceed (authorized and not yet executed).
 */
export function canExecuteRelease(requestId: string): boolean {
    const decision = releaseDecisions.get(requestId);
    const execution = releaseExecutions.get(requestId);

    return decision?.decision === 'AUTHORIZE' && !execution;
}

/**
 * Get release status for a request.
 */
export function getReleaseStatus(requestId: string): ReleaseStatus {
    const execution = releaseExecutions.get(requestId);
    if (execution) {
        return execution.outcome === 'SUCCESS' ? 'EXECUTED' : 'ROLLED_BACK';
    }

    const decision = releaseDecisions.get(requestId);
    if (decision) {
        return decision.decision === 'AUTHORIZE' ? 'AUTHORIZED' : 'DENIED';
    }

    return 'PENDING';
}
