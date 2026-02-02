/**
 * Audit Log Module
 * 
 * Immutable audit trail for all FirmOS operations.
 */

// Types
export type AuditAction =
    | "task_created"
    | "task_routed"
    | "workpaper_updated"
    | "evidence_attached"
    | "qc_submitted"
    | "qc_completed"
    | "release_requested"
    | "release_authorized"
    | "release_executed"
    | "escalation_triggered";

export interface AuditEntry {
    id: string;
    timestamp: Date;
    action: AuditAction;
    actor: string;
    resourceType: string;
    resourceId: string;
    details: Record<string, unknown>;
    ipAddress?: string;
}

export interface AuditQuery {
    resourceId?: string;
    resourceType?: string;
    actor?: string;
    action?: AuditAction;
    from?: Date;
    to?: Date;
    limit?: number;
}

// Public API (stubs for now)
export async function logAction(
    entry: Omit<AuditEntry, "id" | "timestamp">
): Promise<AuditEntry> {
    throw new Error("Not implemented - pending extraction");
}

export async function queryAuditLog(query: AuditQuery): Promise<AuditEntry[]> {
    throw new Error("Not implemented - pending extraction");
}

export async function getResourceHistory(
    resourceType: string,
    resourceId: string
): Promise<AuditEntry[]> {
    throw new Error("Not implemented - pending extraction");
}
