/**
 * Evidence Ledger Domain Types
 *
 * Append-only evidence storage with cryptographic integrity.
 */

/** Supported evidence file types */
export type EvidenceFileType =
    | 'pdf'
    | 'image'
    | 'csv'
    | 'excel'
    | 'bank_statement'
    | 'invoice'
    | 'receipt'
    | 'other';

/** An item in the append-only evidence ledger */
export interface EvidenceItem {
    id: string;
    periodId: string;
    fileHash: string;           // SHA-256 of file bytes
    fileName: string;
    fileType: EvidenceFileType;
    storagePath: string;        // Path in object storage
    extractedFields: Record<string, unknown>;
    extractionConfidence: number; // 0.0 to 1.0
    createdAt: Date;
    // Append-only: no updatedAt
}

/** A pack of evidence for a VAT period */
export interface EvidencePack {
    id: string;
    periodId: string;
    evidenceIds: string[];
    packHash: string;           // Hash of all evidence hashes
    createdAt: Date;
}

/** Evidence upload request */
export interface EvidenceUploadRequest {
    periodId: string;
    fileName: string;
    fileType: EvidenceFileType;
    fileBytes: Uint8Array;
}

/** Evidence extraction result from AI/OCR */
export interface EvidenceExtraction {
    evidenceId: string;
    extractedFields: Record<string, unknown>;
    confidence: number;
    extractedAt: Date;
}
