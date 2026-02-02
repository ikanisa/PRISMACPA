/**
 * QC Gates Module
 * 
 * Re-exports Diane's QC gate runner from @firmos/programs.
 * Integrates with FirmOS config for policy-driven QC gates.
 * In v2027+, implementations will live here directly.
 */

// Re-export types and functions from canonical source
export {
    type QCStatus,
    type QCCheckResult,
    type QCGateResult,
    type QCCheck,
    type QCContext,
    registerQCCheck,
    getAllChecks,
    runQCGate,
    runServiceQC
} from "@firmos/programs/qc-gate-runner.js";

// Config integration
import {
    loadFirmOSConfig,
    requiresQCGate,
    getQCGateOwner,
    getAgentById,
    type AutonomyLevel
} from "@firmos/core";

// Additional types for module API (future expansion)
export type QCOutcome = "PASS" | "FAIL" | "ESCALATE";

export interface QCRequest {
    workpaperId: string;
    serviceType: string;
    agentId: string;
    submittedAt: Date;
}

export interface QCResult {
    outcome: QCOutcome;
    reviewedBy: "diane";
    reviewedAt: Date;
    findings: QCFinding[];
    comment?: string;
}

export interface QCFinding {
    check: string;
    passed: boolean;
    severity: "info" | "warning" | "error";
    message?: string;
}

/**
 * Check if QC is required for an agent's autonomy level (policy-driven)
 */
export function isQCRequired(autonomyLevel: string): boolean {
    return requiresQCGate(autonomyLevel as AutonomyLevel);
}

/**
 * Check if a specific agent requires QC gate based on their config
 */
export function agentRequiresQC(agentId: string): boolean {
    const agent = getAgentById(agentId);
    if (!agent) { return true; } // Fail safe: require QC if agent unknown
    return requiresQCGate(agent.autonomy);
}

/**
 * Get the QC gate owner agent ID from policy (typically "diane")
 */
export function getQCOwner(): string {
    return getQCGateOwner();
}

/**
 * Get required QC checks from policy config
 */
export function getRequiredChecks(): string[] {
    const config = loadFirmOSConfig();
    // Convert from "key: description" format to just keys
    return config.policies.gates.qc_gate.required_checks.map(check => {
        if (typeof check === 'string') {
            const [key] = check.split(':');
            return key.trim();
        }
        return String(check);
    });
}

// Future API stubs
export async function executeQCGate(_request: QCRequest): Promise<QCResult> {
    throw new Error("Not implemented - use runQCGate() from @firmos/programs for now");
}

export async function getQCHistory(_workpaperId: string): Promise<QCResult[]> {
    throw new Error("Not implemented - pending extraction");
}
