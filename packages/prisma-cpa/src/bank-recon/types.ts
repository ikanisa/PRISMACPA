/**
 * Bank Reconciliation Domain Types
 *
 * Types for bank statement import and matching.
 */

/** Bank transaction status */
export type BankTransactionStatus =
    | 'unmatched'
    | 'matched'
    | 'partial'
    | 'exception';

/** Match confidence level */
export type MatchConfidence = 'high' | 'medium' | 'low';

/** A bank statement header */
export interface BankStatement {
    id: string;
    periodId: string;
    bankName: string;
    accountNumber: string;     // Masked: ****1234
    statementDate: Date;
    openingBalance: number;
    closingBalance: number;
    currency: string;          // ISO 4217, e.g., 'EUR'
    evidenceId: string;        // Link to evidence ledger
    createdAt: Date;
}

/** A single bank transaction */
export interface BankTransaction {
    id: string;
    statementId: string;
    transactionDate: Date;
    valueDate?: Date;
    description: string;
    amount: number;            // Positive = credit, negative = debit
    balance?: number;
    reference?: string;
    status: BankTransactionStatus;
    createdAt: Date;
}

/** A potential match candidate */
export interface MatchCandidate {
    transactionId: string;
    candidateType: 'invoice' | 'payment' | 'journal';
    candidateId: string;
    confidence: MatchConfidence;
    score: number;             // 0.0 to 1.0
    matchReason: string;
}

/** A confirmed bank match */
export interface BankMatch {
    id: string;
    transactionId: string;
    matchedType: 'invoice' | 'payment' | 'journal' | 'manual';
    matchedId?: string;
    matchedAt: Date;
    matchedBy: string;         // User or 'system'
    notes?: string;
}

/** Bank reconciliation summary */
export interface ReconciliationSummary {
    periodId: string;
    totalTransactions: number;
    matched: number;
    unmatched: number;
    exceptions: number;
    matchRate: number;         // 0.0 to 1.0
}
