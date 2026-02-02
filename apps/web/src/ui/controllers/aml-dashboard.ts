import type { GatewayBrowserClient } from "../gateway";

/**
 * AML Dashboard controller
 * Uses Gateway RPC calls for CDD, STR, and FIAU compliance data.
 */

// Domain types
export type RiskTier = "low" | "medium" | "high" | "pep" | "sanctioned";
export type CddStatus = "current" | "due_soon" | "overdue" | "blocked";
export type StrStatus = "draft" | "under_review" | "submitted" | "acknowledged";

export type CddRecord = {
    id: string;
    clientName: string;
    riskTier: RiskTier;
    status: CddStatus;
    lastReviewDate: string;
    nextReviewDate: string;
    assignedMlro: string;
};

export type StrReport = {
    id: string;
    reference: string;
    clientId: string;
    clientName: string;
    status: StrStatus;
    createdAt: string;
    submittedAt?: string;
    fiauAckRef?: string;
};

export type AmlAlert = {
    id: string;
    clientId: string;
    clientName: string;
    alertType: "unusual_transaction" | "screening_hit" | "cdd_overdue" | "risk_change";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    createdAt: string;
    resolved: boolean;
};

export type CddStats = {
    total: number;
    current: number;
    dueSoon: number;
    overdue: number;
    byRisk: Record<RiskTier, number>;
};

export type AmlStats = {
    cddStats: CddStats;
    strPending: number;
    strSubmitted: number;
    alertsOpen: number;
    alertsCritical: number;
};

// Controller state
export type AmlDashboardState = {
    client: GatewayBrowserClient | null;
    connected: boolean;
    amlLoading: boolean;
    cddRecords: CddRecord[];
    strReports: StrReport[];
    amlAlerts: AmlAlert[];
    amlStats: AmlStats | null;
    selectedRiskFilter: RiskTier | "all";
    amlError: string | null;
};

/**
 * Load CDD records with optional risk filter
 */
export async function loadCddRecords(state: AmlDashboardState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("aml.cdd.list", {
            riskTier: state.selectedRiskFilter !== "all" ? state.selectedRiskFilter : undefined,
        });
        if (res && Array.isArray(res)) {
            state.cddRecords = res as CddRecord[];
        }
    } catch (err) {
        console.debug("aml.cdd.list not available:", err);
    }
}

/**
 * Load STR reports queue
 */
export async function loadStrReports(state: AmlDashboardState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("aml.str.list", {});
        if (res && Array.isArray(res)) {
            state.strReports = res as StrReport[];
        }
    } catch (err) {
        console.debug("aml.str.list not available:", err);
    }
}

/**
 * Load AML alerts
 */
export async function loadAmlAlerts(state: AmlDashboardState, includeResolved = false) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("aml.alerts.list", { includeResolved });
        if (res && Array.isArray(res)) {
            state.amlAlerts = res as AmlAlert[];
        }
    } catch (err) {
        console.debug("aml.alerts.list not available:", err);
    }
}

/**
 * Load AML statistics
 */
export async function loadAmlStats(state: AmlDashboardState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("aml.stats", {});
        if (res) {
            state.amlStats = res as AmlStats;
        }
    } catch (err) {
        console.debug("aml.stats not available:", err);
    }
}

/**
 * Refresh all AML dashboard data
 */
export async function refreshAmlDashboard(state: AmlDashboardState) {
    if (!state.client || !state.connected) return;
    if (state.amlLoading) return;

    state.amlLoading = true;
    state.amlError = null;

    try {
        await Promise.all([
            loadCddRecords(state),
            loadStrReports(state),
            loadAmlAlerts(state),
            loadAmlStats(state),
        ]);
    } catch (err) {
        state.amlError = String(err);
    } finally {
        state.amlLoading = false;
    }
}
