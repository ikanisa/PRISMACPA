import type { GatewayBrowserClient } from "../gateway";

/**
 * Evidence Ledger controller for document management.
 * Uses Gateway RPC calls to fetch evidence data.
 */

// Domain types
export type EvidenceFileType =
    | "pdf"
    | "image"
    | "csv"
    | "excel"
    | "bank_statement"
    | "invoice"
    | "receipt"
    | "other";

export type EvidenceItem = {
    id: string;
    periodId: string;
    fileHash: string;
    fileName: string;
    fileType: EvidenceFileType;
    storagePath: string;
    extractionConfidence: number;
    createdAt: string;
};

export type EvidenceSummary = {
    total: number;
    byType: Record<EvidenceFileType, number>;
    pendingExtraction: number;
    averageConfidence: number;
};

// Controller state
export type EvidenceLedgerState = {
    client: GatewayBrowserClient | null;
    connected: boolean;
    evidenceLoading: boolean;
    evidenceItems: EvidenceItem[];
    evidenceSummary: EvidenceSummary | null;
    selectedPeriodId: string | null;
    evidenceError: string | null;
};

/**
 * Load evidence items for a period
 */
export async function loadEvidenceItems(state: EvidenceLedgerState, periodId?: string) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("evidence.list", {
            periodId: periodId ?? state.selectedPeriodId,
        });
        if (res && Array.isArray(res)) {
            state.evidenceItems = res as EvidenceItem[];
        }
    } catch (err) {
        console.debug("evidence.list not available:", err);
    }
}

/**
 * Load evidence summary statistics
 */
export async function loadEvidenceSummary(state: EvidenceLedgerState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("evidence.summary", {});
        if (res) {
            state.evidenceSummary = res as EvidenceSummary;
        }
    } catch (err) {
        console.debug("evidence.summary not available:", err);
    }
}

/**
 * Refresh all evidence data
 */
export async function refreshEvidenceLedger(state: EvidenceLedgerState) {
    if (!state.client || !state.connected) return;
    if (state.evidenceLoading) return;

    state.evidenceLoading = true;
    state.evidenceError = null;

    try {
        await Promise.all([
            loadEvidenceItems(state),
            loadEvidenceSummary(state),
        ]);
    } catch (err) {
        state.evidenceError = String(err);
    } finally {
        state.evidenceLoading = false;
    }
}
