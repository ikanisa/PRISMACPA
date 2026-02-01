/**
 * Malta Tax Validators
 *
 * Zod schemas for runtime validation of Malta VAT data.
 */

import { z } from 'zod';

/** VAT rate schema */
export const VATRateSchema = z.union([
    z.literal(0),
    z.literal(5),
    z.literal(7),
    z.literal(18),
]);

/** VAT exception type schema */
export const VATExceptionTypeSchema = z.enum([
    'missing_invoice',
    'ambiguous_rate',
    'duplicate_candidate',
    'reverse_charge',
]);

/** Period status schema */
export const PeriodStatusSchema = z.enum([
    'intake',
    'coding',
    'reconciliation',
    'draft',
    'approved',
    'filed',
]);

/** Period schema */
export const PeriodSchema = z.object({
    id: z.string().uuid(),
    year: z.number().int().min(2020).max(2100),
    quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    status: PeriodStatusSchema,
    dueDate: z.coerce.date(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

/** VAT exception schema */
export const VATExceptionSchema = z.object({
    type: VATExceptionTypeSchema,
    description: z.string().min(1),
    evidenceId: z.string().uuid().optional(),
    suggestedAction: z.string().min(1),
});

/** VAT draft pack schema */
export const VATDraftPackSchema = z.object({
    id: z.string().uuid(),
    periodId: z.string().uuid(),
    versionNumber: z.number().int().positive(),
    outputVatTotal: z.number(),
    inputVatTotal: z.number(),
    netVat: z.number(),
    evidenceIds: z.array(z.string().uuid()),
    exceptions: z.array(VATExceptionSchema),
    packHash: z.string().length(64), // SHA-256 hex
    previousVersionId: z.string().uuid().optional(),
    createdAt: z.coerce.date(),
});

/** VAT line item schema */
export const VATLineItemSchema = z.object({
    id: z.string().uuid(),
    packId: z.string().uuid(),
    description: z.string().min(1),
    amount: z.number(),
    vatRate: VATRateSchema,
    vatAmount: z.number(),
    isOutput: z.boolean(),
    evidenceId: z.string().uuid().optional(),
});

// Type inference helpers
export type VATRateInput = z.input<typeof VATRateSchema>;
export type PeriodInput = z.input<typeof PeriodSchema>;
export type VATDraftPackInput = z.input<typeof VATDraftPackSchema>;
export type VATLineItemInput = z.input<typeof VATLineItemSchema>;
