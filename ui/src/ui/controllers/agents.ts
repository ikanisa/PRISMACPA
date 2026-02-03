import type { GatewayBrowserClient } from "../gateway";
import type { AgentsListResult, GatewayAgentRow } from "../types";

export type AgentsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  agentsLoading: boolean;
  agentsError: string | null;
  agentsList: AgentsListResult | null;
};

export async function loadAgents(state: AgentsState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.agentsLoading) {
    return;
  }
  state.agentsLoading = true;
  state.agentsError = null;
  try {
    const res = await state.client.request("agents.list", {}) as AgentsListResult | null;
    if (res) {
      state.agentsList = res;
    }
  } catch (err) {
    state.agentsError = String(err);
  } finally {
    state.agentsLoading = false;
  }
}

/**
 * Get display name for an agent
 */
export function getAgentDisplayName(agent: GatewayAgentRow): string {
  return agent.identity?.name || agent.name || agent.id;
}

/**
 * Get emoji for an agent
 */
export function getAgentEmoji(agent: GatewayAgentRow): string {
  return agent.identity?.emoji || "🤖";
}

/**
 * Get agent by ID from state
 */
export function getAgentById(
  state: AgentsState,
  agentId: string,
): GatewayAgentRow | undefined {
  return state.agentsList?.agents.find((a) => a.id === agentId);
}
