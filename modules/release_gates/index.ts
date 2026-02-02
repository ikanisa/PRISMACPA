/**
 * Release Gates Module
 * 
 * Re-exports Marco's release gate workflow from @firmos/programs.
 * Integrates with FirmOS config for policy-driven authorization.
 * In v2027+, implementations will live here directly.
 */

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
    requestedAt: Date;
    qcResult: { outcome: "PASS" };
    authorizationLevel: "standard" | "elevated" | "critical";
}

export interface ReleaseDecisionSimple {
    status: ReleaseStatusSimple;
    authorizedBy: "marco" | "operator";
    authorizedAt: Date;
    comment?: string;
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
 * Get authorization levels from policy config
 */
export function getAuthorizationLevels(): string[] {
    const config = loadFirmOSConfig();
    return Object.keys(config.policies.gates.release_gate.authorization_levels);
}

// Future API stubs
export async function requestRelease(_request: ReleaseRequestSimple): Promise<ReleaseDecisionSimple> {
    throw new Error("Not implemented - use createReleaseRequest() from @firmos/programs for now");
}

export async function getReleaseStatus(_workpaperId: string): Promise<ReleaseStatusSimple> {
    throw new Error("Not implemented - pending extraction");
}

export async function executeRelease(_workpaperId: string): Promise<void> {
    throw new Error("Not implemented - use executeReleaseWorkflow() from @firmos/programs for now");
}
