/**
 * Agents Dashboard View
 * 
 * Displays all configured agents with their status, skills, and jurisdiction.
 * Allows per-agent chat routing and agent-to-agent delegation.
 */

import { html, nothing } from "lit";
import type { GatewayAgentRow, AgentsListResult, SkillStatusEntry } from "../types";

// Agent jurisdiction (MT = Malta, RW = Rwanda)
export type AgentJurisdiction = "MT" | "RW";

export type AgentStatus = "online" | "busy" | "offline";

export type AgentCardData = {
    id: string;
    name: string;
    jurisdiction: AgentJurisdiction;
    status: AgentStatus;
    avatar?: string;
    emoji?: string;
    theme?: string;
    skills: string[];
    lastActiveAt?: number;
    activeSessions: number;
};

export type AgentsDashboardProps = {
    connected: boolean;
    loading: boolean;
    error: string | null;
    agents: AgentCardData[];
    selectedAgentId: string | null;
    onSelectAgent: (agentId: string) => void;
    onChatWithAgent: (agentId: string) => void;
    onRefresh: () => void;
};

// Status badge color mapping
const STATUS_COLORS: Record<AgentStatus, string> = {
    online: "var(--status-success, #22c55e)",
    busy: "var(--status-warning, #eab308)",
    offline: "var(--status-error, #ef4444)",
};

// Jurisdiction flag mapping
const JURISDICTION_FLAGS: Record<AgentJurisdiction, { flag: string; name: string }> = {
    MT: { flag: "🇲🇹", name: "Malta" },
    RW: { flag: "🇷🇼", name: "Rwanda" },
};

function renderStatusBadge(status: AgentStatus) {
    return html`
    <span
      class="agent-status-badge"
      style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: capitalize;
        background: ${STATUS_COLORS[status]}22;
        color: ${STATUS_COLORS[status]};
      "
    >
      <span
        style="
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${STATUS_COLORS[status]};
        "
      ></span>
      ${status}
    </span>
  `;
}

function renderJurisdictionBadge(jurisdiction: AgentJurisdiction) {
    const { flag, name } = JURISDICTION_FLAGS[jurisdiction];
    return html`
    <span
      class="agent-jurisdiction-badge"
      title="${name}"
      style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        background: var(--surface-secondary, #f1f5f9);
        color: var(--text-secondary, #64748b);
      "
    >
      ${flag} ${name}
    </span>
  `;
}

function renderSkillBadge(skill: string) {
    return html`
    <span
      class="agent-skill-badge"
      style="
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        background: var(--primary-subtle, #e0e7ff);
        color: var(--primary, #4f46e5);
      "
    >
      ${skill}
    </span>
  `;
}

function renderAgentCard(
    agent: AgentCardData,
    isSelected: boolean,
    onSelect: () => void,
    onChat: () => void
) {
    const avatar = agent.avatar || agent.emoji || agent.name.charAt(0).toUpperCase();
    const isEmoji = agent.emoji && !agent.avatar;

    return html`
    <div
      class="agent-card ${isSelected ? "selected" : ""}"
      style="
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        background: var(--surface-card, #ffffff);
        border: 2px solid ${isSelected ? "var(--primary, #4f46e5)" : "var(--border-subtle, #e2e8f0)"};
        cursor: pointer;
        transition: all 0.15s ease;
      "
      @click=${onSelect}
    >
      <!-- Header: Avatar + Name + Status -->
      <div style="display: flex; align-items: center; gap: 12px;">
        <div
          class="agent-avatar"
          style="
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: ${agent.theme || "var(--primary-subtle, #e0e7ff)"};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isEmoji ? "24px" : "18px"};
            font-weight: 600;
            color: var(--primary, #4f46e5);
          "
        >
          ${agent.avatar
            ? html`<img
                src="${agent.avatar}"
                alt="${agent.name}"
                style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;"
              />`
            : avatar}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div
            style="
              font-weight: 600;
              font-size: 14px;
              color: var(--text-primary, #1e293b);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            "
          >
            ${agent.name}
          </div>
          <div style="font-size: 12px; color: var(--text-tertiary, #94a3b8);">
            ${agent.id}
          </div>
        </div>
        ${renderStatusBadge(agent.status)}
      </div>

      <!-- Badges: Jurisdiction + Skills -->
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${renderJurisdictionBadge(agent.jurisdiction)}
        ${agent.skills.slice(0, 3).map((skill) => renderSkillBadge(skill))}
        ${agent.skills.length > 3
            ? html`<span
              style="
                font-size: 10px;
                color: var(--text-tertiary, #94a3b8);
                padding: 2px 6px;
              "
            >
              +${agent.skills.length - 3} more
            </span>`
            : nothing}
      </div>

      <!-- Footer: Sessions + Chat Button -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
        <div style="font-size: 12px; color: var(--text-tertiary, #94a3b8);">
          ${agent.activeSessions} active session${agent.activeSessions !== 1 ? "s" : ""}
        </div>
        <button
          class="agent-chat-btn"
          style="
            padding: 6px 12px;
            border-radius: 8px;
            border: none;
            background: var(--primary, #4f46e5);
            color: white;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
          "
          @click=${(e: Event) => {
            e.stopPropagation();
            onChat();
        }}
        >
          Chat
        </button>
      </div>
    </div>
  `;
}

function renderEmptyState() {
    return html`
    <div
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        color: var(--text-tertiary, #94a3b8);
      "
    >
      <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
      <div style="font-size: 16px; font-weight: 500; color: var(--text-secondary, #64748b);">
        No Agents Configured
      </div>
      <div style="font-size: 13px; max-width: 300px; margin-top: 8px;">
        Add agents to your configuration to start delegating work across specialized AI assistants.
      </div>
    </div>
  `;
}

function renderLoadingState() {
    return html`
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        padding: 16px;
      "
    >
      ${[1, 2, 3].map(
        () => html`
          <div
            class="agent-card-skeleton"
            style="
              height: 160px;
              border-radius: 12px;
              background: linear-gradient(
                90deg,
                var(--surface-secondary, #f1f5f9) 0%,
                var(--surface-card, #ffffff) 50%,
                var(--surface-secondary, #f1f5f9) 100%
              );
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite;
            "
          ></div>
        `
    )}
    </div>
    <style>
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    </style>
  `;
}

function renderErrorState(error: string, onRetry: () => void) {
    return html`
    <div
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
      "
    >
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <div style="font-size: 16px; font-weight: 500; color: var(--status-error, #ef4444);">
        Failed to Load Agents
      </div>
      <div style="font-size: 13px; color: var(--text-tertiary, #94a3b8); max-width: 300px; margin: 8px 0 16px;">
        ${error}
      </div>
      <button
        style="
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-subtle, #e2e8f0);
          background: var(--surface-card, #ffffff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
        "
        @click=${onRetry}
      >
        Retry
      </button>
    </div>
  `;
}

export function renderAgentsDashboard(props: AgentsDashboardProps) {
    const { connected, loading, error, agents, selectedAgentId, onSelectAgent, onChatWithAgent, onRefresh } = props;

    if (!connected) {
        return html`
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          color: var(--text-tertiary, #94a3b8);
        "
      >
        Connect to gateway to view agents
      </div>
    `;
    }

    return html`
    <div class="agents-dashboard" style="display: flex; flex-direction: column; height: 100%;">
      <!-- Header -->
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border-subtle, #e2e8f0);
        "
      >
        <div>
          <h2
            style="
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: var(--text-primary, #1e293b);
            "
          >
            Agents
          </h2>
          <p
            style="
              margin: 4px 0 0;
              font-size: 13px;
              color: var(--text-tertiary, #94a3b8);
            "
          >
            ${agents.length} agent${agents.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          style="
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid var(--border-subtle, #e2e8f0);
            background: var(--surface-card, #ffffff);
            color: var(--text-primary, #1e293b);
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          "
          @click=${onRefresh}
          ?disabled=${loading}
        >
          ${loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <!-- Content -->
      <div style="flex: 1; overflow-y: auto; padding: 16px;">
        ${loading
            ? renderLoadingState()
            : error
                ? renderErrorState(error, onRefresh)
                : agents.length === 0
                    ? renderEmptyState()
                    : html`
                  <div
                    style="
                      display: grid;
                      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                      gap: 16px;
                    "
                  >
                    ${agents.map((agent) =>
                        renderAgentCard(
                            agent,
                            agent.id === selectedAgentId,
                            () => onSelectAgent(agent.id),
                            () => onChatWithAgent(agent.id)
                        )
                    )}
                  </div>
                `}
      </div>
    </div>
  `;
}
