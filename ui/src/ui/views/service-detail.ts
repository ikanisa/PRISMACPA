import { html, nothing } from "lit";
import type { GatewayAgentRow, AgentStatus } from "../types";
import { icons } from "../icons";

export type ServiceDetailProps = {
  /** Whether the gateway is connected */
  connected: boolean;
  /** Service ID from URL */
  serviceId: string;
  /** The agent assigned to this service */
  agent: GatewayAgentRow | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback when chat is clicked */
  onChatClick: (agentId: string) => void;
  /** Callback to go back */
  onBack: () => void;
  /** Callback to refresh */
  onRefresh: () => void;
};

/**
 * Service definitions - the business offerings of FirmOS
 * Each service has a name, description, and capabilities
 */
const SERVICES: Record<string, {
  name: string;
  description: string;
  capabilities: string[];
  icon: string;
}> = {
  "accounting": {
    name: "Accounting",
    description: "Full-service accounting including bookkeeping, financial statements, and compliance reporting.",
    capabilities: [
      "Monthly bookkeeping & reconciliation",
      "Financial statement preparation",
      "Compliance reporting",
      "Cash flow management",
      "Payroll processing",
    ],
    icon: "📊",
  },
  "advisory": {
    name: "Advisory",
    description: "Strategic business advisory services including growth planning and operational optimization.",
    capabilities: [
      "Business strategy development",
      "Growth planning",
      "Operational optimization",
      "M&A advisory",
      "Restructuring support",
    ],
    icon: "💼",
  },
  "audit": {
    name: "Audit",
    description: "Internal and external audit services ensuring compliance and financial integrity.",
    capabilities: [
      "Statutory audits",
      "Internal audit",
      "Compliance reviews",
      "Financial due diligence",
      "Process assessments",
    ],
    icon: "🔍",
  },
  "risk": {
    name: "Risk Management",
    description: "Enterprise risk assessment, mitigation strategies, and ongoing monitoring.",
    capabilities: [
      "Risk assessment & mapping",
      "Control design & implementation",
      "Ongoing risk monitoring",
      "Regulatory compliance",
      "Crisis management",
    ],
    icon: "⚠️",
  },
  "csp": {
    name: "CSP (Malta)",
    description: "Corporate Service Provider services for Malta-registered entities.",
    capabilities: [
      "Company formation",
      "Corporate administration",
      "Registered office services",
      "Directorship services",
      "Compliance & reporting",
    ],
    icon: "🏛️",
  },
  "notary": {
    name: "Notary (Rwanda)",
    description: "Notarial services under Rwandan law including document authentication.",
    capabilities: [
      "Document authentication",
      "Contract notarization",
      "Legal certifications",
      "Apostille services",
      "Signature witnessing",
    ],
    icon: "📜",
  },
  "governance": {
    name: "Governance",
    description: "Corporate governance advisory and board secretarial services.",
    capabilities: [
      "Board meeting coordination",
      "Corporate secretarial",
      "Governance frameworks",
      "Policy development",
      "Compliance monitoring",
    ],
    icon: "⚖️",
  },
  "tax": {
    name: "Tax (Malta)",
    description: "Malta tax planning, compliance, and advisory services.",
    capabilities: [
      "Tax planning & optimization",
      "VAT compliance",
      "Corporate tax returns",
      "International tax structuring",
      "Tax dispute resolution",
    ],
    icon: "💰",
  },
  "tax-rw": {
    name: "Tax (Rwanda)",
    description: "Rwanda tax planning, compliance, and advisory services.",
    capabilities: [
      "RRA compliance",
      "Corporate tax returns",
      "VAT management",
      "Tax planning",
      "Regulatory liaison",
    ],
    icon: "💰",
  },
  "qc": {
    name: "Quality Control",
    description: "Quality assurance review of all deliverables before client submission.",
    capabilities: [
      "Document review",
      "Quality checks",
      "Accuracy verification",
      "Standards compliance",
      "Client-ready preparation",
    ],
    icon: "✅",
  },
  "fullstack": {
    name: "Development",
    description: "System development and maintenance, UI/UX improvements, and technical operations.",
    capabilities: [
      "System maintenance",
      "Feature development",
      "Bug fixes",
      "Performance optimization",
      "Technical support",
    ],
    icon: "💻",
  },
  "orchestrator": {
    name: "Orchestration",
    description: "Workflow coordination and multi-agent task distribution.",
    capabilities: [
      "Task routing",
      "Workflow optimization",
      "Agent coordination",
      "Priority management",
      "Status monitoring",
    ],
    icon: "🎯",
  },
};

/**
 * Get the agent's personal name
 */
function getAgentName(agent: GatewayAgentRow): string {
  const fullName = agent.identity?.name || agent.name || agent.id;
  // Extract just the first name part before any parentheses
  const match = fullName.match(/^([^(]+)/);
  return match ? match[1].trim() : fullName;
}

/**
 * Get status class
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
      return "status-indicator--online";
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: AgentStatus | undefined): string {
  switch (status) {
    case "online":
      return "Available";
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
 * Render the service detail page
 * Shows the SERVICE (business offering) with the assigned AGENT (team member)
 */
export function renderServiceDetail(props: ServiceDetailProps) {
  if (!props.connected) {
    return html`
      <section class="card">
        <div class="callout warn">
          <strong>Not connected</strong>
          <p>Connect to the gateway to view service details.</p>
        </div>
      </section>
    `;
  }

  const service = SERVICES[props.serviceId] || {
    name: props.serviceId,
    description: `Service: ${props.serviceId}`,
    capabilities: [],
    icon: "📋",
  };

  if (props.loading) {
    return html`
      <section class="card">
        <div class="card-title">${service.name}</div>
        <div class="card-sub">Loading service details...</div>
        <div class="muted" style="margin-top: 14px;">⏳ Fetching data from gateway...</div>
      </section>
    `;
  }

  const agentName = props.agent ? getAgentName(props.agent) : null;
  const status = props.agent?.status ?? "offline";
  const metrics = props.agent?.metrics;

  return html`
    <section class="service-detail-page">
      <!-- Back Navigation -->
      <div class="service-header">
        <button class="btn btn-ghost" @click=${props.onBack}>
          ${icons.chevronLeft} Back to Agents
        </button>
        <button class="btn" @click=${props.onRefresh}>Refresh</button>
      </div>

      <!-- Service Hero -->
      <div class="service-hero">
        <div class="service-icon">${service.icon}</div>
        <div class="service-info">
          <h1 class="service-title">${service.name}</h1>
          <p class="service-description">${service.description}</p>
        </div>
      </div>

      <div class="service-content">
        <!-- Service Capabilities -->
        <div class="card capabilities-card">
          <div class="card-title">Service Capabilities</div>
          <ul class="capabilities-list">
            ${service.capabilities.map((cap) => html`
              <li class="capability-item">
                <span class="capability-bullet">•</span>
                ${cap}
              </li>
            `)}
          </ul>
        </div>

        <!-- Assigned Agent -->
        <div class="card agent-card">
          <div class="card-title">Assigned Team Member</div>
          ${props.agent
      ? html`
              <div class="agent-profile">
                <div class="agent-avatar">
                  ${props.agent.identity?.emoji || "🤖"}
                </div>
                <div class="agent-details">
                  <div class="agent-name">${agentName}</div>
                  <div class="agent-role muted">${service.name} Specialist</div>
                  <div class="agent-status">
                    <span class="status-indicator ${getStatusClass(status)}"></span>
                    <span class="status-label">${getStatusLabel(status)}</span>
                  </div>
                </div>
              </div>
              
              <div class="agent-stats">
                <div class="stat">
                  <div class="stat-value">${metrics?.queueDepth ?? 0}</div>
                  <div class="stat-label">Pending Tasks</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${metrics?.activeSessions ?? 0}</div>
                  <div class="stat-label">Active Sessions</div>
                </div>
              </div>

              <button 
                class="btn primary full-width" 
                @click=${() => props.onChatClick(props.agent!.id)}
              >
                ${icons.messageSquare} Chat with ${agentName}
              </button>
            `
      : html`
              <div class="no-agent">
                <div class="muted">No team member assigned to this service.</div>
              </div>
            `
    }
        </div>
      </div>

      ${props.error
      ? html`<div class="callout danger" style="margin-top: 14px;">${props.error}</div>`
      : nothing
    }
    </section>

    <style>
      .service-detail-page {
        max-width: 900px;
      }

      .service-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .btn-ghost {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        cursor: pointer;
      }

      .btn-ghost:hover {
        color: var(--text-primary);
        background: var(--surface-1);
        border-radius: var(--radius);
      }

      .btn-ghost svg {
        width: 16px;
        height: 16px;
      }

      .service-hero {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        margin-bottom: 24px;
        padding: 28px;
        background: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
      }

      .service-icon {
        font-size: 48px;
        line-height: 1;
      }

      .service-title {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }

      .service-description {
        font-size: 15px;
        color: var(--muted);
        margin: 0;
        line-height: 1.5;
      }

      .service-content {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 20px;
      }

      .capabilities-card {
        padding: 20px;
      }

      .capabilities-list {
        list-style: none;
        margin: 16px 0 0 0;
        padding: 0;
      }

      .capability-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
        color: var(--text-secondary);
      }

      .capability-item:last-child {
        border-bottom: none;
      }

      .capability-bullet {
        color: var(--accent);
        font-weight: 600;
      }

      .agent-card {
        padding: 20px;
        height: fit-content;
      }

      .agent-profile {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
      }

      .agent-avatar {
        font-size: 48px;
        line-height: 1;
      }

      .agent-name {
        font-weight: 600;
        font-size: 18px;
        color: var(--text-primary);
      }

      .agent-role {
        font-size: 13px;
        margin-top: 2px;
      }

      .agent-status {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .status-indicator--online {
        background: var(--ok);
        box-shadow: 0 0 6px var(--ok);
      }

      .status-indicator--busy {
        background: var(--warn);
        box-shadow: 0 0 6px var(--warn);
      }

      .status-indicator--offline {
        background: var(--muted);
      }

      .status-indicator--error {
        background: var(--danger);
      }

      .status-label {
        font-size: 12px;
        color: var(--muted);
      }

      .agent-stats {
        display: flex;
        gap: 16px;
        padding: 16px 0;
      }

      .stat {
        flex: 1;
        text-align: center;
        padding: 12px;
        background: var(--surface-0);
        border-radius: var(--radius);
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 11px;
        color: var(--muted);
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .no-agent {
        padding: 24px;
        text-align: center;
      }

      .full-width {
        width: 100%;
        margin-top: 16px;
      }

      @media (max-width: 760px) {
        .service-content {
          grid-template-columns: 1fr;
        }

        .service-hero {
          flex-direction: column;
          text-align: center;
          align-items: center;
        }
      }
    </style>
  `;
}
