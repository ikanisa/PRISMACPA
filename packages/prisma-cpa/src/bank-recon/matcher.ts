/**
 * Bank Reconciliation Matching Algorithm
 *
 * Fuzzy matching for bank transactions against invoices/payments.
 */

import type { BankTransaction, MatchCandidate, MatchConfidence } from './types.js';

/** A matchable record (invoice, payment, etc.) */
export interface MatchableRecord {
    id: string;
    type: 'invoice' | 'payment' | 'journal';
    amount: number;
    date: Date;
    reference?: string;
    description?: string;
}

/**
 * Find match candidates for a bank transaction.
 *
 * Matching rules:
 * 1. Exact amount match = high confidence
 * 2. Amount within 1% + similar date = medium confidence
 * 3. Reference/description fuzzy match = low confidence
 */
export function findMatchCandidates(
    transaction: BankTransaction,
    records: MatchableRecord[],
    options: { toleranceDays?: number; tolerancePercent?: number } = {}
): MatchCandidate[] {
    const {
        toleranceDays = 7,
        tolerancePercent = 0.01,
    } = options;

    const candidates: MatchCandidate[] = [];

    for (const record of records) {
        const amountMatch = matchAmount(transaction.amount, record.amount, tolerancePercent);
        const dateMatch = matchDate(transaction.transactionDate, record.date, toleranceDays);
        const refMatch = matchReference(transaction.reference, record.reference);

        // Calculate overall score
        let score = 0;
        let confidence: MatchConfidence = 'low';
        let reason = '';

        if (amountMatch.exact) {
            score += 0.5;
            reason = 'Exact amount match';
        } else if (amountMatch.within) {
            score += 0.3;
            reason = `Amount within ${tolerancePercent * 100}%`;
        }

        if (dateMatch) {
            score += 0.25;
            reason += reason ? '; date within range' : 'Date within range';
        }

        if (refMatch) {
            score += 0.25;
            reason += reason ? '; reference match' : 'Reference match';
        }

        // Determine confidence
        if (score >= 0.75) {
            confidence = 'high';
        } else if (score >= 0.5) {
            confidence = 'medium';
        } else if (score >= 0.25) {
            confidence = 'low';
        } else {
            continue; // No match
        }

        candidates.push({
            transactionId: transaction.id,
            candidateType: record.type,
            candidateId: record.id,
            confidence,
            score,
            matchReason: reason,
        });
    }

    // Sort by score descending
    return candidates.sort((a, b) => b.score - a.score);
}

/** Check if amounts match */
function matchAmount(
    bankAmount: number,
    recordAmount: number,
    tolerance: number
): { exact: boolean; within: boolean } {
    const absBank = Math.abs(bankAmount);
    const absRecord = Math.abs(recordAmount);

    const exact = absBank === absRecord;
    const within = Math.abs(absBank - absRecord) <= absBank * tolerance;

    return { exact, within };
}

/** Check if dates are within tolerance */
function matchDate(bankDate: Date, recordDate: Date, toleranceDays: number): boolean {
    const diffMs = Math.abs(bankDate.getTime() - recordDate.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= toleranceDays;
}

/** Fuzzy reference matching */
function matchReference(bankRef?: string, recordRef?: string): boolean {
    if (!bankRef || !recordRef) return false;

    const normalizedBank = bankRef.toLowerCase().replace(/\s+/g, '');
    const normalizedRecord = recordRef.toLowerCase().replace(/\s+/g, '');

    return normalizedBank.includes(normalizedRecord) || normalizedRecord.includes(normalizedBank);
}
