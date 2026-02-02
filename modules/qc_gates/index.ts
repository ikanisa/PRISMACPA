/**
 * QC Gates Module
 * 
 * Diane's quality control gate execution.
 * Will be extracted from packages/firmos-programs/qc-gate-runner.ts
 */

// Types
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

// Public API (stubs for now)
export async function executeQCGate(request: QCRequest): Promise<QCResult> {
    throw new Error("Not implemented - pending extraction from firmos-programs");
}

export function isQCRequired(autonomyLevel: string): boolean {
    return autonomyLevel === "AUTO+CHECK" || autonomyLevel === "ESCALATE";
}

export async function getQCHistory(workpaperId: string): Promise<QCResult[]> {
    throw new Error("Not implemented - pending extraction");
}
