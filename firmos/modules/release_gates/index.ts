/**
 * FirmOS Release Gates Module
 *
 * Provides Marco Governor release workflow functionality.
 * Ensures all releases are properly gated and authorized.
 */

export type ReleaseStatus = 'pending' | 'authorized' | 'denied' | 'executed';

export interface ReleaseRequest {
    id: string;
    task_id: string;
    service_id: string;
    pack_id: string;
    release_type: 'external_submission' | 'client_delivery' | 'publication';
    requested_by: string;
    requested_at: Date;
    qc_gate_id: string;
    qc_passed: boolean;
}

export interface ReleaseDecision {
    request_id: string;
    status: ReleaseStatus;
    decided_by: string;
    decided_at: Date;
    reason?: string;
    conditions?: string[];
}

export interface ReleaseAction {
    request_id: string;
    action: string;
    executed_at: Date;
    confirmation_id?: string;
    error?: string;
}

/**
 * Submit a release request for Marco's authorization
 */
export async function requestRelease(request: Omit<ReleaseRequest, 'id' | 'requested_at'>): Promise<ReleaseRequest> {
    // Validate QC passed as prerequisite
    if (!request.qc_passed) {
        throw new Error('Release request denied: QC gate must pass before release');
    }

    return {
        ...request,
        id: `rel_${Date.now()}`,
        requested_at: new Date(),
    };
}

/**
 * Authorize a release (Marco only)
 */
export async function authorizeRelease(
    requestId: string,
    authorizer: string,
    conditions?: string[],
): Promise<ReleaseDecision> {
    if (authorizer !== 'agent_marco') {
        throw new Error('Only Marco can authorize releases');
    }

    return {
        request_id: requestId,
        status: 'authorized',
        decided_by: authorizer,
        decided_at: new Date(),
        conditions,
    };
}

/**
 * Deny a release (Marco only)
 */
export async function denyRelease(
    requestId: string,
    authorizer: string,
    reason: string,
): Promise<ReleaseDecision> {
    if (authorizer !== 'agent_marco') {
        throw new Error('Only Marco can deny releases');
    }

    return {
        request_id: requestId,
        status: 'denied',
        decided_by: authorizer,
        decided_at: new Date(),
        reason,
    };
}

/**
 * Execute a release action after authorization
 */
export async function executeRelease(requestId: string, action: string): Promise<ReleaseAction> {
    return {
        request_id: requestId,
        action,
        executed_at: new Date(),
        confirmation_id: `conf_${Date.now()}`,
    };
}
