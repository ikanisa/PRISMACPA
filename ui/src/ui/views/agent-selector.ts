import { html, nothing } from "lit";
import type { GatewayAgentRow, AgentStatus } from "../types";

export type AgentSelectorProps = {
    /** Whether the gateway is connected */
    connected: boolean;
    /** List of agents from the gateway */
    agents: GatewayAgentRow[];
    /** Currently selected agent ID (null for group chat) */
    currentAgentId: string | null;
    /** Whether group chat is active */
    isGroupChat: boolean;
    /** Maximum number of pills to show before overflow */
    maxVisiblePills?: number;
    /** Callback when an agent is selected */
    onAgentSelect: (agentId: string) => void;
    /** Callback when group chat is selected */
    onGroupChatSelect: () => void;
};

/**
 * Get display name for an agent
 */
function getAgentDisplayName(agent: GatewayAgentRow): string {
    return agent.identity?.name || agent.name || agent.id;
}

/**
 * Get emoji for an agent
 */
function getAgentEmoji(agent: GatewayAgentRow): string {
    return agent.identity?.emoji || "🤖";
}

/**
 * Get status indicator class based on agent status
 */
function getStatusClass(status: AgentStatus | undefined): string {
    switch (status) {
        case "online":
            return "agent-pill__status--online";
        case "busy":
            return "agent-pill__status--busy";
        case "offline":
            return "agent-pill__status--offline";
        case "error":
            return "agent-pill__status--error";
        default:
            return "agent-pill__status--online";
    }
}

/**
 * Render a single agent pill
 */
function renderAgentPill(
    agent: GatewayAgentRow,
    isSelected: boolean,
    onSelect: () => void,
) {
    const status = agent.status ?? "online";
    const displayName = getAgentDisplayName(agent);

    return html`
    <button
      class="agent-pill ${isSelected ? "agent-pill--selected" : ""}"
      @click=${onSelect}
      title="${displayName}"
      aria-pressed="${isSelected}"
    >
      <span class="agent-pill__emoji">${getAgentEmoji(agent)}</span>
      <span class="agent-pill__name">${displayName}</span>
      <span class="agent-pill__status ${getStatusClass(status)}"></span>
    </button>
  `;
}

/**
 * Render the group chat pill
 */
function renderGroupChatPill(isSelected: boolean, onSelect: () => void) {
    return html`
    <button
      class="agent-pill agent-pill--group ${isSelected ? "agent-pill--selected" : ""}"
      @click=${onSelect}
      title="Group Chat (all agents)"
      aria-pressed="${isSelected}"
    >
      <span class="agent-pill__emoji">👥</span>
      <span class="agent-pill__name">All</span>
    </button>
  `;
}

/**
 * Render overflow indicator for additional agents
 */
function renderOverflowBadge(count: number, onClick: () => void) {
    return html`
    <button
      class="agent-pill agent-pill--overflow"
      @click=${onClick}
      title="Show ${count} more agents"
    >
      +${count}
    </button>
  `;
}

/**
 * Render the agent selector component
 */
export function renderAgentSelector(props: AgentSelectorProps) {
    if (!props.connected || props.agents.length === 0) {
        return nothing;
    }

    const maxPills = props.maxVisiblePills ?? 3;
    const visibleAgents = props.agents.slice(0, maxPills);
    const overflowCount = Math.max(0, props.agents.length - maxPills);

    return html`
    <div class="agent-selector">
      ${renderGroupChatPill(props.isGroupChat, props.onGroupChatSelect)}

      ${visibleAgents.map((agent) =>
        renderAgentPill(
            agent,
            !props.isGroupChat && agent.id === props.currentAgentId,
            () => props.onAgentSelect(agent.id),
        ),
    )}

      ${overflowCount > 0
            ? renderOverflowBadge(overflowCount, () => {
                // For now, just select first overflow agent
                // A modal/dropdown would be better UX
                const nextAgent = props.agents[maxPills];
                if (nextAgent) {
                    props.onAgentSelect(nextAgent.id);
                }
            })
            : nothing
        }
    </div>

    <style>
      .agent-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 0;
      }

      .agent-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: 9999px;
        cursor: pointer;
        font-size: 13px;
        color: var(--foreground);
        transition: all 0.15s ease;
        line-height: 1;
      }

      .agent-pill:hover {
        background: var(--surface-2);
        border-color: var(--border-hover);
      }

      .agent-pill--selected {
        background: var(--accent-alpha);
        border-color: var(--accent);
        color: var(--accent);
      }

      .agent-pill--selected:hover {
        background: var(--accent-alpha);
      }

      .agent-pill__emoji {
        font-size: 16px;
        line-height: 1;
      }

      .agent-pill__name {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
      }

      .agent-pill__status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .agent-pill__status--online {
        background: var(--ok);
        box-shadow: 0 0 4px var(--ok);
      }

      .agent-pill__status--busy {
        background: var(--warn);
        box-shadow: 0 0 4px var(--warn);
      }

      .agent-pill__status--offline {
        background: var(--muted);
      }

      .agent-pill__status--error {
        background: var(--danger);
        box-shadow: 0 0 4px var(--danger);
      }

      .agent-pill--group {
        background: var(--surface-2);
      }

      .agent-pill--overflow {
        background: var(--surface-1);
        font-weight: 600;
        min-width: 44px;
        justify-content: center;
      }

      .agent-pill--overflow:hover {
        background: var(--accent-alpha);
        color: var(--accent);
      }

      /* Make pills smaller on mobile */
      @media (max-width: 600px) {
        .agent-pill__name {
          max-width: 60px;
        }
      }
    </style>
  `;
}
