/**
 * Case Management Module
 * 
 * Client engagement and case lifecycle management.
 */

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
    jurisdiction: Case["jurisdiction"];
    serviceType: string;
    dueDate?: Date;
    metadata?: Record<string, unknown>;
}

// Public API (stubs for now)
export async function createCase(_params: CaseCreateParams): Promise<Case> {
    throw new Error("Not implemented - pending extraction");
}

export async function getCase(_caseId: string): Promise<Case | null> {
    throw new Error("Not implemented - pending extraction");
}

export async function updateCaseStatus(_caseId: string, _status: CaseStatus): Promise<Case> {
    throw new Error("Not implemented - pending extraction");
}

export async function listCases(_filter: Partial<Case>): Promise<Case[]> {
    throw new Error("Not implemented - pending extraction");
}

export async function assignAgent(_caseId: string, _agentId: string): Promise<Case> {
    throw new Error("Not implemented - pending extraction");
}
