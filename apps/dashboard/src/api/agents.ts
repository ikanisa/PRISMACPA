/**
 * Agents API
 * 
 * Fetches FirmOS agent data from the gateway.
 */

import { getGateway } from './gateway';
import type { AgentsListResult, GatewayAgentRow } from './types';

export type AgentDomain = 'global' | 'malta' | 'rwanda';
export type AgentStatus = 'healthy' | 'warning' | 'error';

export type AgentCardData = {
    id: string;
    name: string;
    role: string;
    domain: AgentDomain;
    status: AgentStatus;
    jobs: number;
    skillCount: number;
    evidenceTypes: number;
    masteryLevel: string;
    keyMetric: string;
};

export async function loadAgents(): Promise<AgentCardData[]> {
    const gateway = getGateway();

    if (gateway?.connected) {
        try {
            const result = await gateway.request<AgentsListResult>("agents.list", {});
            if (result?.agents) {
                return result.agents.map(transformAgentToCard);
            }
        } catch {
            // Gateway doesn't support this endpoint, use mock
        }
    }

    return getMockAgents();
}

function transformAgentToCard(agent: GatewayAgentRow): AgentCardData {
    const id = agent.id.toLowerCase();

    // Determine domain from agent ID
    let domain: AgentDomain = 'global';
    if (id.includes('matthew') || id.includes('claire') || id.includes('mt_')) {
        domain = 'malta';
    } else if (id.includes('emmanuel') || id.includes('chantal') || id.includes('rw_')) {
        domain = 'rwanda';
    }

    return {
        id: agent.id,
        name: agent.identity?.name || agent.name || agent.id,
        role: getRoleForAgent(agent.id),
        domain,
        status: 'healthy',
        jobs: Math.floor(Math.random() * 15) + 1,
        skillCount: Math.floor(Math.random() * 10) + 5,
        evidenceTypes: Math.floor(Math.random() * 4) + 2,
        masteryLevel: 'L5',
        keyMetric: getKeyMetricForAgent(agent.id),
    };
}

function getRoleForAgent(agentId: string): string {
    const roles: Record<string, string> = {
        agent_aline: 'Firm Orchestrator',
        agent_marco: 'Autonomy & Policy Governor',
        agent_diane: 'Quality, Risk & Evidence Guardian',
        agent_patrick: 'Audit & Assurance Engine',
        agent_sofia: 'Accounting & Financial Reporting',
        agent_james: 'Advisory & Consulting Engine',
        agent_fatima: 'Risk, Controls & Internal Audit',
        agent_matthew: 'Malta Tax Engine',
        agent_claire: 'Malta CSP/MBR Engine',
        agent_emmanuel: 'Rwanda Tax Engine',
        agent_chantal: 'Rwanda Private Notary Engine',
    };
    return roles[agentId] || 'FirmOS Agent';
}

function getKeyMetricForAgent(agentId: string): string {
    const metrics: Record<string, string> = {
        agent_aline: 'Workstream throughput',
        agent_marco: 'Policy escalation accuracy',
        agent_diane: 'Guardian pass rate',
        agent_patrick: 'Audit quality score',
        agent_sofia: 'Financial close accuracy',
        agent_james: 'Client satisfaction',
        agent_fatima: 'Control effectiveness',
        agent_matthew: 'Tax compliance rate',
        agent_claire: 'Registry accuracy',
        agent_emmanuel: 'Filing accuracy',
        agent_chantal: 'Authentication rate',
    };
    return metrics[agentId] || 'Task completion rate';
}

function getMockAgents(): AgentCardData[] {
    return [
        // Global Governance
        { id: 'agent_aline', name: 'Aline', role: 'Firm Orchestrator', domain: 'global', jobs: 12, status: 'healthy', skillCount: 12, evidenceTypes: 2, masteryLevel: 'L5', keyMetric: 'Workstream throughput' },
        { id: 'agent_marco', name: 'Marco', role: 'Autonomy & Policy Governor', domain: 'global', jobs: 28, status: 'healthy', skillCount: 11, evidenceTypes: 2, masteryLevel: 'L5', keyMetric: 'Policy escalation accuracy' },
        { id: 'agent_diane', name: 'Diane', role: 'Quality, Risk & Evidence Guardian', domain: 'global', jobs: 35, status: 'healthy', skillCount: 11, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Guardian pass rate' },

        // Global Service
        { id: 'agent_patrick', name: 'Patrick', role: 'Audit & Assurance Engine', domain: 'global', jobs: 4, status: 'healthy', skillCount: 15, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Audit quality score' },
        { id: 'agent_sofia', name: 'Sofia', role: 'Accounting & Financial Reporting', domain: 'global', jobs: 8, status: 'healthy', skillCount: 12, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Financial close accuracy' },
        { id: 'agent_james', name: 'James', role: 'Advisory & Consulting Engine', domain: 'global', jobs: 2, status: 'healthy', skillCount: 11, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Client satisfaction' },
        { id: 'agent_fatima', name: 'Fatima', role: 'Risk, Controls & Internal Audit', domain: 'global', jobs: 3, status: 'healthy', skillCount: 10, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Control effectiveness' },

        // Malta
        { id: 'agent_matthew', name: 'Matthew', role: 'Malta Tax Engine', domain: 'malta', jobs: 6, status: 'healthy', skillCount: 8, evidenceTypes: 4, masteryLevel: 'L5', keyMetric: 'Tax compliance rate' },
        { id: 'agent_claire', name: 'Claire', role: 'Malta CSP/MBR Engine', domain: 'malta', jobs: 5, status: 'healthy', skillCount: 9, evidenceTypes: 5, masteryLevel: 'L5', keyMetric: 'Registry accuracy' },

        // Rwanda
        { id: 'agent_emmanuel', name: 'Emmanuel', role: 'Rwanda Tax Engine', domain: 'rwanda', jobs: 4, status: 'warning', skillCount: 7, evidenceTypes: 4, masteryLevel: 'L5', keyMetric: 'Filing accuracy' },
        { id: 'agent_chantal', name: 'Chantal', role: 'Rwanda Private Notary Engine', domain: 'rwanda', jobs: 7, status: 'healthy', skillCount: 11, evidenceTypes: 4, masteryLevel: 'L5', keyMetric: 'Authentication rate' },
    ];
}
