import type { GatewayBrowserClient } from "../gateway";
import type {
    JurisdictionCode,
    KPISummary,
    EngagementSummary,
} from "../views/executive-dashboard";

/**
 * Controller for Executive Dashboard.
 * Fetches KPIs and engagements from the gateway.
 */

export type ExecutiveDashboardState = {
    loading: boolean;
    error: string | null;
    jurisdiction: JurisdictionCode;
    kpis: KPISummary | null;
    engagements: EngagementSummary[];
};

export function createExecutiveDashboardState(): ExecutiveDashboardState {
    return {
        loading: false,
        error: null,
        jurisdiction: "MT",
        kpis: null,
        engagements: [],
    };
}

/**
 * Load executive dashboard data from the gateway.
 * Falls back to mock data for development.
 */
export async function loadExecutiveDashboard(
    client: GatewayBrowserClient | null,
    jurisdiction: JurisdictionCode
): Promise<{ kpis: KPISummary; engagements: EngagementSummary[] }> {
    // Try gateway first if connected
    if (client) {
        try {
            const result = await client.request("executive.dashboard.get", {
                jurisdiction,
            });
            if (result && typeof result === "object" && "kpis" in result) {
                return result as { kpis: KPISummary; engagements: EngagementSummary[] };
            }
        } catch {
            // Gateway doesn't support this endpoint yet, use mock data
        }
    }

    // Return mock data for development
    return getMockData(jurisdiction);
}

function getMockData(jurisdiction: JurisdictionCode): {
    kpis: KPISummary;
    engagements: EngagementSummary[];
} {
    const now = new Date();
    const daysFromNow = (days: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
    };

    return {
        kpis: {
            openEngagements: 12,
            atRiskItems: 3,
            pendingApprovals: 7,
            upcomingDeadlines: 4,
            evidenceBacklog: 15,
            completionRate: 78,
        },
        engagements: [
            {
                id: "eng-001",
                clientName: "ABC Holdings Ltd",
                type: "tax",
                jurisdiction,
                status: "review",
                riskLevel: "high",
                dueDate: daysFromNow(5),
                assignee: "Maria C.",
            },
            {
                id: "eng-002",
                clientName: "XYZ Trading Co",
                type: "audit",
                jurisdiction,
                status: "active",
                riskLevel: "medium",
                dueDate: daysFromNow(12),
                assignee: "John D.",
            },
            {
                id: "eng-003",
                clientName: "GHI Investments",
                type: "tax",
                jurisdiction,
                status: "filing",
                riskLevel: "low",
                dueDate: daysFromNow(3),
                assignee: "Sarah M.",
            },
            {
                id: "eng-004",
                clientName: "MNO Services",
                type: "advisory",
                jurisdiction,
                status: "active",
                riskLevel: "critical",
                dueDate: daysFromNow(-2), // Overdue
                assignee: "Tom K.",
            },
            {
                id: "eng-005",
                clientName: "PQR Finance",
                type: "audit",
                jurisdiction,
                status: "review",
                riskLevel: "high",
                dueDate: daysFromNow(8),
                assignee: "Lisa P.",
            },
        ],
    };
}
