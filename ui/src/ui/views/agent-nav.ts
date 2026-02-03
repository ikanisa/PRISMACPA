/**
 * @deprecated Use agent-selector.ts for new implementations.
 * This dropdown-style navigator is kept for sidebar compatibility.
 * The pill-based agent-selector.ts provides a better UX for quick switching.
 */
import { html, nothing } from "lit";
import type { GatewayAgentRow } from "../types";
import { icons } from "../icons";

export type AgentNavProps = {
  connected: boolean;
  agents: GatewayAgentRow[];
  currentAgentId: string | null;
  expanded: boolean;
  onAgentSelect: (agentId: string) => void;
  onGroupChatSelect: () => void;
  onToggleExpanded: () => void;
};

function getAgentDisplayName(agent: GatewayAgentRow): string {
  return agent.identity?.name || agent.name || agent.id;
}

function getAgentEmoji(agent: GatewayAgentRow): string {
  return agent.identity?.emoji || "🤖";
}

export function renderAgentNav(props: AgentNavProps) {
  if (!props.connected || props.agents.length === 0) {
    return nothing;
  }

  const currentAgent = props.agents.find((a) => a.id === props.currentAgentId);
  const currentAgentName = currentAgent ? getAgentDisplayName(currentAgent) : "Select Agent";

  return html`
    <div class="agent-nav ${props.expanded ? "agent-nav--expanded" : ""}">
      <button
        class="agent-nav__header"
        @click=${props.onToggleExpanded}
        aria-expanded=${props.expanded}
        title="Select agent to chat with"
      >
        <span class="agent-nav__current">
          ${currentAgent ? html`<span class="agent-nav__emoji">${getAgentEmoji(currentAgent)}</span>` : nothing}
          <span class="agent-nav__name">${currentAgentName}</span>
        </span>
        <span class="agent-nav__chevron">${props.expanded ? "▲" : "▼"}</span>
      </button>
      
      ${props.expanded
      ? html`
          <div class="agent-nav__list">
            <!-- Group Chat Option -->
            <button
              class="agent-nav__item ${props.currentAgentId === "all" ? "agent-nav__item--active" : ""}"
              @click=${() => props.onGroupChatSelect()}
              title="Chat with all agents"
            >
              <span class="agent-nav__emoji">👥</span>
              <span class="agent-nav__item-name">All Agents (Group)</span>
            </button>
            
            <!-- Individual Agents -->
            ${props.agents.map(
        (agent) => html`
                <button
                  class="agent-nav__item ${agent.id === props.currentAgentId ? "agent-nav__item--active" : ""}"
                  @click=${() => props.onAgentSelect(agent.id)}
                  title="Chat with ${getAgentDisplayName(agent)}"
                >
                  <span class="agent-nav__emoji">${getAgentEmoji(agent)}</span>
                  <span class="agent-nav__item-name">${getAgentDisplayName(agent)}</span>
                </button>
              `,
      )}
          </div>
        `
      : nothing}
    </div>
  `;
}
