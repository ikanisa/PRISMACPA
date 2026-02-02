/**
 * Policy API
 * 
 * Fetches FirmOS policy decisions from the gateway.
 */

import { getGateway } from './gateway';

export type PolicyDecisionOutcome = 'authorized' | 'denied' | 'escalated' | 'auto_approved';
export type AutonomyTier = 'A' | 'B' | 'C';

export type PolicyDecision = {
    id: string;
    action: string;
    client: string;
    tier: AutonomyTier;
    agent: string;
    decidedAt: string;
    outcome: PolicyDecisionOutcome;
    rationale?: string;
};

export type PolicyDecisionsResult = {
    decisions: PolicyDecision[];
    totalCount: number;
};

export async function loadPolicyDecisions(): Promise<PolicyDecision[]> {
    const gateway = getGateway();

    if (gateway?.connected) {
        try {
            const result = await gateway.request<PolicyDecisionsResult>("firmos.policy.decisions", {});
            if (result?.decisions) {
                return result.decisions;
            }
        } catch {
            // Gateway doesn't support this endpoint, use mock
        }
    }

    return getMockDecisions();
}

function getMockDecisions(): PolicyDecision[] {
    const now = new Date();
    const minutesAgo = (min: number) => {
        const d = new Date(now);
        d.setMinutes(d.getMinutes() - min);
        return d.toISOString();
    };

    return [
        { id: '1', action: 'Generate VAT Return draft', client: 'Acme Corp', tier: 'B', agent: 'Matthew', decidedAt: minutesAgo(2), outcome: 'authorized' },
        { id: '2', action: 'Submit Annual Return to MBR', client: 'Malta Holdings', tier: 'C', agent: 'Claire', decidedAt: minutesAgo(15), outcome: 'escalated', rationale: 'External submission requires human review' },
        { id: '3', action: 'Index incoming invoices', client: 'TechStart RW', tier: 'A', agent: 'Emmanuel', decidedAt: minutesAgo(23), outcome: 'auto_approved' },
        { id: '4', action: 'Draft legal opinion', client: 'Kigali Ventures', tier: 'C', agent: 'Chantal', decidedAt: minutesAgo(60), outcome: 'escalated', rationale: 'Novel legal matter' },
        { id: '5', action: 'Run guardian pre-flight', client: 'Acme Corp', tier: 'A', agent: 'Diane', decidedAt: minutesAgo(68), outcome: 'auto_approved' },
        { id: '6', action: 'Process tax refund claim', client: 'Global Ltd', tier: 'C', agent: 'Matthew', decidedAt: minutesAgo(90), outcome: 'denied', rationale: 'Missing supporting documentation' },
    ];
}
