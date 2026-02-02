import type { GatewayBrowserClient } from "../gateway";

/**
 * Audit Workpapers controller
 * Uses Gateway RPC calls to fetch audit and PBC data.
 */

// Domain types
export type WorkpaperStatus = "draft" | "in_review" | "reviewed" | "finalized";

export type AuditEngagement = {
    id: string;
    clientName: string;
    engagementType: "audit" | "review" | "compilation" | "agreed_upon";
    fiscalYearEnd: string;
    status: WorkpaperStatus;
    leadPartner: string;
    createdAt: string;
};

export type WorkingPaper = {
    id: string;
    engagementId: string;
    reference: string;
    title: string;
    status: WorkpaperStatus;
    preparedBy: string;
    reviewedBy?: string;
    lastModified: string;
};

export type PbcItem = {
    id: string;
    engagementId: string;
    description: string;
    requestedDate: string;
    dueDate: string;
    receivedDate?: string;
    status: "pending" | "received" | "overdue" | "na";
    assignedTo: string;
};

export type AuditStats = {
    totalEngagements: number;
    activeEngagements: number;
    workpapersComplete: number;
    workpapersTotal: number;
    pbcPending: number;
    pbcOverdue: number;
};

// Controller state
export type AuditWorkpapersState = {
    client: GatewayBrowserClient | null;
    connected: boolean;
    auditLoading: boolean;
    auditEngagements: AuditEngagement[];
    workingPapers: WorkingPaper[];
    pbcItems: PbcItem[];
    auditStats: AuditStats | null;
    selectedEngagementId: string | null;
    auditError: string | null;
};

/**
 * Load audit engagements
 */
export async function loadAuditEngagements(state: AuditWorkpapersState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("audit.engagements.list", {});
        if (res && Array.isArray(res)) {
            state.auditEngagements = res as AuditEngagement[];
        }
    } catch (err) {
        console.debug("audit.engagements.list not available:", err);
    }
}

/**
 * Load working papers for an engagement
 */
export async function loadWorkingPapers(state: AuditWorkpapersState, engagementId?: string) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("audit.workpapers.list", {
            engagementId: engagementId ?? state.selectedEngagementId,
        });
        if (res && Array.isArray(res)) {
            state.workingPapers = res as WorkingPaper[];
        }
    } catch (err) {
        console.debug("audit.workpapers.list not available:", err);
    }
}

/**
 * Load PBC items for an engagement
 */
export async function loadPbcItems(state: AuditWorkpapersState, engagementId?: string) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("audit.pbc.list", {
            engagementId: engagementId ?? state.selectedEngagementId,
        });
        if (res && Array.isArray(res)) {
            state.pbcItems = res as PbcItem[];
        }
    } catch (err) {
        console.debug("audit.pbc.list not available:", err);
    }
}

/**
 * Load audit statistics
 */
export async function loadAuditStats(state: AuditWorkpapersState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("audit.stats", {});
        if (res) {
            state.auditStats = res as AuditStats;
        }
    } catch (err) {
        console.debug("audit.stats not available:", err);
    }
}

/**
 * Refresh all audit workpapers data
 */
export async function refreshAuditWorkpapers(state: AuditWorkpapersState) {
    if (!state.client || !state.connected) return;
    if (state.auditLoading) return;

    state.auditLoading = true;
    state.auditError = null;

    try {
        await Promise.all([
            loadAuditEngagements(state),
            loadAuditStats(state),
        ]);
        // Load working papers and PBC if an engagement is selected
        if (state.selectedEngagementId) {
            await Promise.all([
                loadWorkingPapers(state),
                loadPbcItems(state),
            ]);
        }
    } catch (err) {
        state.auditError = String(err);
    } finally {
        state.auditLoading = false;
    }
}
