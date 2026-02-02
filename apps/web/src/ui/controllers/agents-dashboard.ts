/**
 * Agents Dashboard Controller
 * 
 * Handles fetching agents from gateway and transforming into view-compatible data.
 */

import type { GatewayBrowserClient } from "../gateway";
import type { AgentsListResult, SkillStatusReport } from "../types";
import type { AgentCardData, AgentJurisdiction, AgentStatus } from "../views/agents-dashboard";

export type AgentsDashboardState = {
    client: GatewayBrowserClient | null;
    connected: boolean;
    agentsLoading: boolean;
    agentsError: string | null;
    agentsList: AgentsListResult | null;
    agentsCards: AgentCardData[];
    selectedAgentId: string | null;
    skillsReport: SkillStatusReport | null;
};

/**
 * Transform gateway agent rows into view-compatible card data
 */
function transformAgentToCard(
    agent: AgentsListResult["agents"][0],
    defaultId: string,
    skillNames: string[]
): AgentCardData {
    // Determine jurisdiction from agent ID or default to MT
    const jurisdiction: AgentJurisdiction = agent.id.toLowerCase().includes("rwanda") ||
        agent.id.toLowerCase().includes("rw")
        ? "RW"
        : "MT";

    // Determine status (simplified - would need session tracking for real status)
    const status: AgentStatus = agent.id === defaultId ? "online" : "online";

    return {
        id: agent.id,
        name: agent.identity?.name || agent.name || agent.id,
        jurisdiction,
        status,
        avatar: agent.identity?.avatarUrl || agent.identity?.avatar,
        emoji: agent.identity?.emoji,
        theme: agent.identity?.theme,
        skills: skillNames,
        activeSessions: agent.id === defaultId ? 1 : 0,
    };
}

/**
 * Load agents from the gateway
 */
export async function loadAgentsDashboard(state: AgentsDashboardState): Promise<void> {
    if (!state.client || !state.connected) return;
    if (state.agentsLoading) return;

    state.agentsLoading = true;
    state.agentsError = null;

    try {
        // Fetch agents list
        const agentsRes = await state.client.request("agents.list", {}) as AgentsListResult | undefined;

        if (agentsRes) {
            state.agentsList = agentsRes;

            // Fetch skills for each agent (simplified - would need per-agent skill config)
            let skillNames: string[] = [];
            try {
                const skillsRes = await state.client.request("skills.status", {}) as SkillStatusReport | undefined;
                if (skillsRes) {
                    state.skillsReport = skillsRes;
                    skillNames = skillsRes.skills
                        .filter((s) => s.eligible && !s.disabled)
                        .map((s) => s.name)
                        .slice(0, 5);
                }
            } catch {
                // Skills are optional
            }

            // Transform to card data
            state.agentsCards = agentsRes.agents.map((agent) =>
                transformAgentToCard(agent, agentsRes.defaultId, skillNames)
            );
        }
    } catch (err) {
        state.agentsError = err instanceof Error ? err.message : String(err);
    } finally {
        state.agentsLoading = false;
    }
}

/**
 * Select an agent for detailed view
 */
export function selectAgent(state: AgentsDashboardState, agentId: string): void {
    state.selectedAgentId = state.selectedAgentId === agentId ? null : agentId;
}

/**
 * Navigate to chat with a specific agent
 * Returns the session key to navigate to
 */
export function getChatSessionKeyForAgent(
    state: AgentsDashboardState,
    agentId: string
): string | null {
    if (!state.agentsList) return null;

    // Use the agent's main key format
    const scope = state.agentsList.scope || "main";
    return `${scope}:${agentId}`;
}

/**
 * Get mock agent data for development/testing
 */
export function getMockAgentCards(): AgentCardData[] {
    return [
        {
            id: "main",
            name: "Prisma CPA",
            jurisdiction: "MT",
            status: "online",
            emoji: "📊",
            skills: ["vat-pack-drafter", "evidence-intake", "bank-matcher"],
            activeSessions: 2,
        },
        {
            id: "tax-specialist",
            name: "Tax Specialist",
            jurisdiction: "MT",
            status: "online",
            emoji: "🧾",
            skills: ["vat-pack-drafter", "compliance-checker"],
            activeSessions: 1,
        },
        {
            id: "rwanda-ops",
            name: "Rwanda Operations",
            jurisdiction: "RW",
            status: "online",
            emoji: "🇷🇼",
            skills: ["bank-matcher", "evidence-intake"],
            activeSessions: 0,
        },
        {
            id: "auditor",
            name: "Audit Assistant",
            jurisdiction: "MT",
            status: "busy",
            emoji: "🔍",
            skills: ["audit-workpapers", "evidence-review"],
            activeSessions: 3,
        },
    ];
}
