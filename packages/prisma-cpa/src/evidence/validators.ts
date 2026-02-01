/**
 * Evidence Validators
 *
 * Zod schemas for runtime validation of evidence data.
 */

import { z } from 'zod';

/** Evidence file type schema */
export const EvidenceFileTypeSchema = z.enum([
    'pdf',
    'image',
    'csv',
    'excel',
    'bank_statement',
    'invoice',
    'receipt',
    'other',
]);

/** Evidence item schema */
export const EvidenceItemSchema = z.object({
    id: z.string().uuid(),
    periodId: z.string().uuid(),
    fileHash: z.string().length(64), // SHA-256 hex
    fileName: z.string().min(1),
    fileType: EvidenceFileTypeSchema,
    storagePath: z.string().min(1),
    extractedFields: z.record(z.unknown()),
    extractionConfidence: z.number().min(0).max(1),
    createdAt: z.coerce.date(),
});

/** Evidence pack schema */
export const EvidencePackSchema = z.object({
    id: z.string().uuid(),
    periodId: z.string().uuid(),
    evidenceIds: z.array(z.string().uuid()),
    packHash: z.string().length(64),
    createdAt: z.coerce.date(),
});

/** Evidence upload request schema */
export const EvidenceUploadRequestSchema = z.object({
    periodId: z.string().uuid(),
    fileName: z.string().min(1),
    fileType: EvidenceFileTypeSchema,
    fileBytes: z.instanceof(Uint8Array),
});

// Type inference helpers
export type EvidenceItemInput = z.input<typeof EvidenceItemSchema>;
export type EvidencePackInput = z.input<typeof EvidencePackSchema>;
