/**
 * Audit Domain Types
 *
 * Types for audit workpapers, approvals, and maker-checker workflow.
 */

/** Approval types in the maker-checker workflow */
export type ApprovalType = 'prepare' | 'review' | 'file';

/** Target types that can be approved */
export type ApprovalTargetType = 'entry' | 'pack' | 'period';

/** Audit trail action types */
export type AuditActionType =
    | 'create'
    | 'update'
    | 'approve'
    | 'reject'
    | 'submit'
    | 'archive';

/** An approval record (maker-checker) */
export interface Approval {
    id: string;
    targetType: ApprovalTargetType;
    targetId: string;
    approvalType: ApprovalType;
    approved: boolean;
    notes?: string;
    approverId: string;
    approverName: string;
    createdAt: Date;
}

/** An audit workpaper */
export interface WorkPaper {
    id: string;
    periodId: string;
    title: string;
    description: string;
    category: string;
    status: 'draft' | 'review' | 'approved' | 'archived';
    evidenceIds: string[];
    findings: Finding[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

/** A finding from audit work */
export interface Finding {
    id: string;
    workPaperId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    recommendation: string;
    managementResponse?: string;
    status: 'open' | 'acknowledged' | 'resolved';
    createdAt: Date;
}

/** An entry in the audit trail */
export interface AuditTrail {
    id: string;
    entityType: string;
    entityId: string;
    action: AuditActionType;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    performedBy: string;
    performedAt: Date;
    ipAddress?: string;
    userAgent?: string;
}

/** Approval chain definition */
export interface ApprovalChain {
    id: string;
    name: string;
    steps: ApprovalStep[];
    active: boolean;
}

/** A step in an approval chain */
export interface ApprovalStep {
    order: number;
    approvalType: ApprovalType;
    requiredRole: string;
    description: string;
}
