/**
 * Malta Tax Domain Types
 *
 * Core types for Malta VAT processing following CFR Malta regulations.
 */

/** Malta VAT rates as defined by CFR */
export type VATRate = 0 | 5 | 7 | 18;

/** VAT exception types requiring human review */
export type VATExceptionType =
    | 'missing_invoice'
    | 'ambiguous_rate'
    | 'duplicate_candidate'
    | 'reverse_charge';

/** Period status following maker-checker workflow */
export type PeriodStatus =
    | 'intake'        // Documents being collected
    | 'coding'        // Transactions being classified
    | 'reconciliation'// Bank matching in progress
    | 'draft'         // VAT pack draft ready for review
    | 'approved'      // Maker-checker complete
    | 'filed';        // Human confirmed submission

/** A tax period (e.g., Q1 2026) */
export interface Period {
    id: string;
    year: number;
    quarter: 1 | 2 | 3 | 4;
    status: PeriodStatus;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

/** An exception flagged during VAT processing */
export interface VATException {
    type: VATExceptionType;
    description: string;
    evidenceId?: string;
    suggestedAction: string;
}

/** A versioned VAT draft pack for review */
export interface VATDraftPack {
    id: string;
    periodId: string;
    versionNumber: number;
    outputVatTotal: number;
    inputVatTotal: number;
    netVat: number;
    evidenceIds: string[];
    exceptions: VATException[];
    packHash: string;           // SHA-256 for integrity
    previousVersionId?: string;
    createdAt: Date;
}

/** A single VAT line item */
export interface VATLineItem {
    id: string;
    packId: string;
    description: string;
    amount: number;
    vatRate: VATRate;
    vatAmount: number;
    isOutput: boolean;          // true = output VAT, false = input VAT
    evidenceId?: string;
}
