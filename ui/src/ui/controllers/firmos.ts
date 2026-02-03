import type { GatewayBrowserClient } from "../gateway";
import type {
    FirmOSIncident,
    FirmOSPolicyDecision,
    FirmOSQCReview,
    FirmOSRelease,
    FirmOSTowerStats,
} from "../types";

export type FirmOSState = {
    client: GatewayBrowserClient | null;
    connected: boolean;

    towerLoading: boolean;
    towerError: string | null;
    towerStats: FirmOSTowerStats | null;

    qcLoading: boolean;
    qcError: string | null;
    qcReviews: FirmOSQCReview[];

    releasesLoading: boolean;
    releasesError: string | null;
    releases: FirmOSRelease[];

    incidentsLoading: boolean;
    incidentsError: string | null;
    incidents: FirmOSIncident[];

    policyLoading: boolean;
    policyError: string | null;
    policyDecisions: FirmOSPolicyDecision[];
};

/**
 * Load Tower Stats (Control Tower)
 */
export async function loadFirmOSTowerStats(state: FirmOSState) {
    if (!state.client || !state.connected || state.towerLoading) return;

    state.towerLoading = true;
    state.towerError = null;

    try {
        const res = (await state.client.request("firmos.tower.get", {})) as {
            stats: FirmOSTowerStats;
        };
        if (res?.stats) {
            state.towerStats = res.stats;
        }
    } catch (err) {
        state.towerError = String(err);
    } finally {
        state.towerLoading = false;
    }
}

/**
 * Load QC Reviews (Diane)
 */
export async function loadQCReviews(state: FirmOSState) {
    if (!state.client || !state.connected || state.qcLoading) return;

    state.qcLoading = true;
    state.qcError = null;

    try {
        const res = (await state.client.request("firmos.qc.list", {})) as {
            reviews: FirmOSQCReview[];
        };
        if (res?.reviews) {
            state.qcReviews = res.reviews;
        }
    } catch (err) {
        state.qcError = String(err);
    } finally {
        state.qcLoading = false;
    }
}

/**
 * Load Releases (Marco)
 */
export async function loadReleases(state: FirmOSState) {
    if (!state.client || !state.connected || state.releasesLoading) return;

    state.releasesLoading = true;
    state.releasesError = null;

    try {
        const res = (await state.client.request("firmos.releases.list", {})) as {
            releases: FirmOSRelease[];
        };
        if (res?.releases) {
            state.releases = res.releases;
        }
    } catch (err) {
        state.releasesError = String(err);
    } finally {
        state.releasesLoading = false;
    }
}

/**
 * Load Incidents (Fatima)
 */
export async function loadIncidents(state: FirmOSState) {
    if (!state.client || !state.connected || state.incidentsLoading) return;

    state.incidentsLoading = true;
    state.incidentsError = null;

    try {
        const res = (await state.client.request("firmos.incidents.list", {})) as {
            incidents: FirmOSIncident[];
        };
        if (res?.incidents) {
            state.incidents = res.incidents;
        }
    } catch (err) {
        state.incidentsError = String(err);
    } finally {
        state.incidentsLoading = false;
    }
}

/**
 * Load Policy Decisions (Marco)
 */
export async function loadPolicyDecisions(state: FirmOSState) {
    if (!state.client || !state.connected || state.policyLoading) return;

    state.policyLoading = true;
    state.policyError = null;

    try {
        const res = (await state.client.request("firmos.policy.decisions", {})) as {
            decisions: FirmOSPolicyDecision[];
        };
        if (res?.decisions) {
            state.policyDecisions = res.decisions;
        }
    } catch (err) {
        state.policyError = String(err);
    } finally {
        state.policyLoading = false;
    }
}
