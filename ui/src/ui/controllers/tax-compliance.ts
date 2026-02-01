import type { GatewayBrowserClient } from "../gateway";

/**
 * Tax & Compliance controller for Malta tax operations.
 * Uses Gateway RPC calls to fetch tax data.
 */

// Domain types
export type TaxPeriod = {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: "open" | "draft" | "reviewed" | "filed";
    vatDue?: number;
    deadline: string;
};

export type EvidenceStats = {
    total: number;
    pending: number;
    extracted: number;
    verified: number;
};

export type ApprovalItem = {
    id: string;
    targetType: "entry" | "pack" | "period";
    targetId: string;
    approvalType: "prepare" | "review" | "file";
    approved: boolean;
    approverName: string;
    createdAt: string;
};

// Controller state
export type TaxComplianceState = {
    client: GatewayBrowserClient | null;
    connected: boolean;
    taxComplianceLoading: boolean;
    taxPeriods: TaxPeriod[];
    taxEvidenceStats: EvidenceStats | null;
    taxPendingApprovals: ApprovalItem[];
    taxError: string | null;
};

/**
 * Load VAT periods from gateway
 */
export async function loadTaxPeriods(state: TaxComplianceState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("tax.periods.list", {});
        if (res && Array.isArray(res)) {
            state.taxPeriods = res as TaxPeriod[];
        }
    } catch (err) {
        // RPC not implemented yet - graceful fallback
        console.debug("tax.periods.list not available:", err);
    }
}

/**
 * Load evidence ledger statistics
 */
export async function loadEvidenceStats(state: TaxComplianceState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("tax.evidence.stats", {});
        if (res) {
            state.taxEvidenceStats = res as EvidenceStats;
        }
    } catch (err) {
        console.debug("tax.evidence.stats not available:", err);
    }
}

/**
 * Load pending approvals for maker-checker workflow
 */
export async function loadPendingApprovals(state: TaxComplianceState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("tax.approvals.pending", {});
        if (res && Array.isArray(res)) {
            state.taxPendingApprovals = res as ApprovalItem[];
        }
    } catch (err) {
        console.debug("tax.approvals.pending not available:", err);
    }
}

/**
 * Refresh all tax compliance data
 */
export async function refreshTaxCompliance(state: TaxComplianceState) {
    if (!state.client || !state.connected) return;
    if (state.taxComplianceLoading) return;

    state.taxComplianceLoading = true;
    state.taxError = null;

    try {
        await Promise.all([
            loadTaxPeriods(state),
            loadEvidenceStats(state),
            loadPendingApprovals(state),
        ]);
    } catch (err) {
        state.taxError = String(err);
    } finally {
        state.taxComplianceLoading = false;
    }
}
