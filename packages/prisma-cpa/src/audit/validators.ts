/**
 * Audit Validators
 *
 * Zod schemas for runtime validation of audit data.
 */

import { z } from 'zod';

/** Approval type schema */
export const ApprovalTypeSchema = z.enum(['prepare', 'review', 'file']);

/** Approval target type schema */
export const ApprovalTargetTypeSchema = z.enum(['entry', 'pack', 'period']);

/** Audit action type schema */
export const AuditActionTypeSchema = z.enum([
    'create',
    'update',
    'approve',
    'reject',
    'submit',
    'archive',
]);

/** Approval schema */
export const ApprovalSchema = z.object({
    id: z.string().uuid(),
    targetType: ApprovalTargetTypeSchema,
    targetId: z.string().uuid(),
    approvalType: ApprovalTypeSchema,
    approved: z.boolean(),
    notes: z.string().optional(),
    approverId: z.string().uuid(),
    approverName: z.string().min(1),
    createdAt: z.coerce.date(),
});

/** Work paper status schema */
export const WorkPaperStatusSchema = z.enum(['draft', 'review', 'approved', 'archived']);

/** Finding severity schema */
export const FindingSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/** Finding status schema */
export const FindingStatusSchema = z.enum(['open', 'acknowledged', 'resolved']);

/** Finding schema */
export const FindingSchema = z.object({
    id: z.string().uuid(),
    workPaperId: z.string().uuid(),
    severity: FindingSeveritySchema,
    title: z.string().min(1),
    description: z.string().min(1),
    recommendation: z.string().min(1),
    managementResponse: z.string().optional(),
    status: FindingStatusSchema,
    createdAt: z.coerce.date(),
});

/** Work paper schema */
export const WorkPaperSchema = z.object({
    id: z.string().uuid(),
    periodId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string(),
    category: z.string().min(1),
    status: WorkPaperStatusSchema,
    evidenceIds: z.array(z.string().uuid()),
    findings: z.array(FindingSchema),
    createdBy: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

/** Audit trail schema */
export const AuditTrailSchema = z.object({
    id: z.string().uuid(),
    entityType: z.string().min(1),
    entityId: z.string().uuid(),
    action: AuditActionTypeSchema,
    previousValue: z.record(z.unknown()).optional(),
    newValue: z.record(z.unknown()).optional(),
    performedBy: z.string().uuid(),
    performedAt: z.coerce.date(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
});

// Type inference helpers
export type ApprovalInput = z.input<typeof ApprovalSchema>;
export type WorkPaperInput = z.input<typeof WorkPaperSchema>;
export type FindingInput = z.input<typeof FindingSchema>;
export type AuditTrailInput = z.input<typeof AuditTrailSchema>;
