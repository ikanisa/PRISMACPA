import { html, nothing } from "lit";
import type { GatewayAgentRow, AgentStatus } from "../types";
import { icons } from "../icons";

export type AgentsProps = {
  /** Whether the gateway is connected */
  connected: boolean;
  /** List of agents from the gateway */
  agents: GatewayAgentRow[];
  /** Currently selected agent ID */
  selectedAgentId: string | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback when an agent is selected for chat */
  onAgentSelect: (agentId: string) => void;
  /** Callback when an agent card is clicked (navigate to service page) */
  onServiceClick?: (serviceId: string) => void;
  /** Callback to refresh agent list */
  onRefresh: () => void;
};

/**
 * Service name mapping from agent IDs to human-readable service names
 */
const SERVICE_NAMES: Record<string, string> = {
  "firmos-accounting": "Accounting",
  "firmos-advisory": "Advisory",
  "firmos-audit": "Audit",
  "firmos-risk": "Risk Management",
  "firmos-csp": "CSP (Malta)",
  "firmos-notary": "Notary (Rwanda)",
  "firmos-governance": "Governance",
  "firmos-tax": "Tax (Malta)",
  "firmos-tax-rw": "Tax (Rwanda)",
  "firmos-qc": "Quality Control",
  "firmos-fullstack": "Development",
  "firmos-orchestrator": "Orchestration",
  "main": "System",
};

/**
 * Get the agent's personal name (sans service)
 */
function getAgentName(agent: GatewayAgentRow): string {
  const fullName = agent.identity?.name || agent.name || agent.id;
  // Extract just the first name if format is "Name (Service)"
  const match = fullName.match(/^([^(]+)/);
  return match ? match[1].trim() : fullName;
}

/**
 * Get the service name for an agent
 */
function getServiceName(agent: GatewayAgentRow): string {
  // Check if we have a mapped service name
  if (SERVICE_NAMES[agent.id]) {
    return SERVICE_NAMES[agent.id];
  }
  // Try to extract from identity name "Name (Service)" format
  const fullName = agent.identity?.name || "";
  const match = fullName.match(/\(([^)]+)\)/);
  if (match) {
    return match[1].trim();
  }
  // Fallback: derive from agent ID
  return agent.id.replace(/^firmos-/, "").replace(/-/g, " ");
}

/**
 * Get display name in "Service (Agent)" format
 */
function getAgentDisplayName(agent: GatewayAgentRow): string {
  const serviceName = getServiceName(agent);
  const agentName = getAgentName(agent);
  return `${serviceName} (${agentName})`;
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
      return "status-indicator--online";
    case "busy":
      return "status-indicator--busy";
    case "offline":
      return "status-indicator--offline";
    case "error":
      return "status-indicator--error";
    default:
      return "status-indicator--online"; // Default to online if no status
  }
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: AgentStatus | undefined): string {
  switch (status) {
    case "online":
      return "Online";
    case "busy":
      return "Busy";
    case "offline":
      return "Offline";
    case "error":
      return "Error";
    default:
      return "Available";
  }
}

/**
 * Format relative time from timestamp
 */
function formatLastActive(timestamp: number | undefined): string {
  if (!timestamp) return "Unknown";
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Get service ID from agent ID
 */
function getServiceId(agentId: string): string {
  return agentId.replace(/^firmos-/, "");
}

/**
 * Render a single agent card
 */
function renderAgentCard(agent: GatewayAgentRow, props: AgentsProps) {
  const isSelected = agent.id === props.selectedAgentId;
  const status = agent.status ?? "online";
  const metrics = agent.metrics;
  const serviceId = getServiceId(agent.id);
  const serviceName = getServiceName(agent);
  const agentName = getAgentName(agent);

  const handleCardClick = () => {
    if (props.onServiceClick) {
      props.onServiceClick(serviceId);
    }
  };

  return html`
    <div 
      class="agent-card ${isSelected ? "agent-card--selected" : ""}"
      @click=${handleCardClick}
      style="cursor: ${props.onServiceClick ? "pointer" : "default"}"
    >
      <div class="agent-card__header">
        <div class="agent-card__title-group">
          <div class="agent-card__name">${serviceName}</div>
          <div class="agent-card__agent muted">(${agentName})</div>
        </div>
        <div class="agent-card__status-group">
          <span class="status-label">${getStatusLabel(status)}</span>
          <span class="status-indicator ${getStatusClass(status)}" title="${getStatusLabel(status)}"></span>
        </div>
      </div>
      
      <div class="agent-card__body">
        <div class="agent-card__subtitle muted">FirmOS Agent</div>
        <div class="agent-card__id muted">Agent workspace: ${agent.id}</div>
        
        ${metrics?.currentTask
      ? html`<div class="agent-card__task muted">${metrics.currentTask}</div>`
      : nothing
    }
      </div>

      <div class="agent-card__stats">
        <div class="stat-box">
          <div class="stat-label">TASKS</div>
          <div class="stat-value">${metrics?.queueDepth ?? 0}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">LAST SEEN</div>
          <div class="stat-value">${metrics?.lastActiveAt ? formatLastActive(metrics.lastActiveAt) : "never"}</div>
        </div>
      </div>
      
      <div class="agent-card__footer">
        <button
          class="btn btn-sm primary"
          @click=${(e: Event) => {
      e.stopPropagation();
      props.onAgentSelect(agent.id);
    }}
          title="Start chat with ${agentName}"
        >
          ${icons.messageSquare} Chat
        </button>
      </div>
    </div>
  `;
}

/**
 * Render the agents dashboard view
 */
export function renderAgents(props: AgentsProps) {
  if (!props.connected) {
    return html`
      <section class="card">
        <div class="callout warn">
          <strong>Not connected</strong>
          <p>Connect to the gateway to view agents.</p>
        </div>
      </section>
    `;
  }

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Agents</div>
          <div class="card-sub">All agents with status and workload.</div>
        </div>
        <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
          ${props.loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      ${props.error
      ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
      : nothing
    }

      ${props.agents.length === 0
      ? html`
              <div class="empty-state" style="margin-top: 24px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">🤖</div>
                <div class="muted">No agents configured.</div>
                <p class="muted" style="font-size: 13px;">
                  Add agents to your <code>firmos.json</code> configuration.
                </p>
              </div>
            `
      : html`
              <div class="agents-grid" style="margin-top: 16px;">
                ${props.agents.map((agent) => renderAgentCard(agent, props))}
              </div>
            `
    }
    </section>

    <style>
      .agents-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }
      
      .agent-card {
        background: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 16px;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      
      .agent-card:hover {
        border-color: var(--border-hover);
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
      
      .agent-card--selected {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px var(--accent-alpha);
      }
      
      .agent-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .agent-card__title-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .agent-card__name {
        font-weight: 600;
        font-size: 16px;
        color: var(--text-primary);
      }
      
      .agent-card__agent {
        font-size: 13px;
        color: var(--muted);
      }
      
      .agent-card__status-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .status-label {
        font-size: 12px;
        color: var(--muted);
        text-transform: lowercase;
      }
      
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      
      .status-indicator--online {
        background-color: var(--ok);
        box-shadow: 0 0 6px var(--ok);
      }
      
      .status-indicator--busy {
        background-color: var(--warn);
        box-shadow: 0 0 6px var(--warn);
      }
      
      .status-indicator--offline {
        background-color: var(--muted);
      }
      
      .status-indicator--error {
        background-color: var(--danger);
        box-shadow: 0 0 6px var(--danger);
      }
      
      .agent-card__body {
        margin-bottom: 12px;
      }
      
      .agent-card__subtitle {
        font-size: 12px;
        margin-bottom: 4px;
      }
      
      .agent-card__id {
        font-size: 12px;
        font-family: var(--font-mono);
      }
      
      .agent-card__task {
        font-size: 13px;
        margin-top: 8px;
        font-style: italic;
      }
      
      .agent-card__stats {
        display: flex;
        gap: 12px;
        margin-bottom: 14px;
        padding: 10px 0;
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
      }
      
      .stat-box {
        flex: 1;
        text-align: center;
      }
      
      .stat-box .stat-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--muted);
        margin-bottom: 4px;
      }
      
      .stat-box .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .agent-card__footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }
      
      .btn-sm {
        padding: 6px 12px;
        font-size: 13px;
      }
      
      .btn-sm svg {
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }
    </style>
  `;
}
