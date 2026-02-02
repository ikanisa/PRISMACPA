/**
 * Incidents API
 * 
 * Fetches FirmOS incident data from the gateway.
 */

import { getGateway } from './gateway';
import type { Incident, IncidentsListResult, IncidentSeverity, IncidentStatus } from './types';

export type { Incident, IncidentSeverity, IncidentStatus };

export async function loadIncidents(): Promise<Incident[]> {
    const gateway = getGateway();

    if (gateway?.connected) {
        try {
            const result = await gateway.request<IncidentsListResult>("firmos.incidents.list", {});
            if (result?.incidents) {
                return result.incidents;
            }
        } catch {
            // Gateway doesn't support this endpoint, use mock
        }
    }

    return getMockIncidents();
}

export async function resolveIncident(incidentId: string, resolution: string): Promise<boolean> {
    const gateway = getGateway();

    if (gateway?.connected) {
        try {
            await gateway.request("firmos.incidents.resolve", { incidentId, resolution });
            return true;
        } catch {
            return false;
        }
    }
    return false;
}

function getMockIncidents(): Incident[] {
    const now = new Date();
    const hoursAgo = (hours: number) => {
        const d = new Date(now);
        d.setHours(d.getHours() - hours);
        return d.toISOString();
    };

    return [
        {
            id: "inc-001",
            title: "Pack Leakage Attempt",
            type: "security",
            severity: "critical",
            status: "investigating",
            detectedAt: hoursAgo(3),
            detectedBy: "Marco (Governor)",
            assignee: "Diane",
            description: "Agent agent_matthew attempted to access RW_TAX pack",
        },
        {
            id: "inc-002",
            title: "Release Bypass Attempt",
            type: "compliance",
            severity: "high",
            status: "open",
            detectedAt: hoursAgo(1),
            detectedBy: "Diane (Guardian)",
            assignee: "Marco",
            description: "Agent agent_claire attempted release without PASS gate",
        },
        {
            id: "inc-003",
            title: "Missing Evidence Pattern",
            type: "compliance",
            severity: "medium",
            status: "open",
            detectedAt: hoursAgo(6),
            detectedBy: "Diane (Guardian)",
            assignee: "Emmanuel",
            description: "Repeated missing CLIENT_INSTRUCTION evidence in tax workstreams",
        },
        {
            id: "inc-004",
            title: "Unauthorized Tool Access",
            type: "security",
            severity: "high",
            status: "resolved",
            detectedAt: hoursAgo(24),
            detectedBy: "Marco (Governor)",
            assignee: "Aline",
            description: "Attempt to use restricted tool outside permitted context",
            resolvedAt: hoursAgo(20),
            resolution: "Access pattern corrected, agent retrained",
        },
    ];
}
