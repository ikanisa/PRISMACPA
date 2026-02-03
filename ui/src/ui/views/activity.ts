import { html, nothing } from "lit";
import type { GatewayAgentRow, AgentStatus } from "../types";

/** Activity event types */
export type ActivityEventType =
    | "agent_task_start"
    | "agent_task_complete"
    | "agent_task_error"
    | "user_message"
    | "system_event"
    | "session_start"
    | "session_end";

/** Single activity event */
export type ActivityEvent = {
    id: string;
    type: ActivityEventType;
    timestamp: number;
    agentId?: string;
    agentName?: string;
    agentEmoji?: string;
    message: string;
    details?: string;
    sessionKey?: string;
};

export type ActivityProps = {
    /** Whether the gateway is connected */
    connected: boolean;
    /** List of activity events */
    events: ActivityEvent[];
    /** List of agents for filtering */
    agents: GatewayAgentRow[];
    /** Loading state */
    loading: boolean;
    /** Error message if any */
    error: string | null;
    /** Filter by event type (null = all) */
    filterType: ActivityEventType | null;
    /** Filter by agent ID (null = all) */
    filterAgentId: string | null;
    /** Callback when filter changes */
    onFilterChange: (type: ActivityEventType | null, agentId: string | null) => void;
    /** Callback to refresh events */
    onRefresh: () => void;
};

/**
 * Get icon for activity event type
 */
function getEventIcon(type: ActivityEventType): string {
    switch (type) {
        case "agent_task_start":
            return "▶️";
        case "agent_task_complete":
            return "✅";
        case "agent_task_error":
            return "❌";
        case "user_message":
            return "💬";
        case "system_event":
            return "⚙️";
        case "session_start":
            return "🟢";
        case "session_end":
            return "🔴";
        default:
            return "📋";
    }
}

/**
 * Get human-readable label for event type
 */
function getEventLabel(type: ActivityEventType): string {
    switch (type) {
        case "agent_task_start":
            return "Task Started";
        case "agent_task_complete":
            return "Task Completed";
        case "agent_task_error":
            return "Task Error";
        case "user_message":
            return "User Message";
        case "system_event":
            return "System Event";
        case "session_start":
            return "Session Started";
        case "session_end":
            return "Session Ended";
        default:
            return "Event";
    }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 60000) {
        return "Just now";
    }
    if (diffMs < 3600000) {
        return `${Math.floor(diffMs / 60000)}m ago`;
    }
    if (diffMs < 86400000) {
        return `${Math.floor(diffMs / 3600000)}h ago`;
    }

    // Same day: show time
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // Different day: show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Render a single activity event
 */
function renderActivityEvent(event: ActivityEvent) {
    return html`
    <div class="activity-event activity-event--${event.type}">
      <div class="activity-event__icon">${getEventIcon(event.type)}</div>
      <div class="activity-event__content">
        <div class="activity-event__header">
          ${event.agentEmoji
            ? html`<span class="activity-event__agent-emoji">${event.agentEmoji}</span>`
            : nothing
        }
          ${event.agentName
            ? html`<span class="activity-event__agent-name">${event.agentName}</span>`
            : nothing
        }
          <span class="activity-event__type">${getEventLabel(event.type)}</span>
          <span class="activity-event__time">${formatTimestamp(event.timestamp)}</span>
        </div>
        <div class="activity-event__message">${event.message}</div>
        ${event.details
            ? html`<div class="activity-event__details muted">${event.details}</div>`
            : nothing
        }
      </div>
    </div>
  `;
}

/**
 * Render the activity stream view
 */
export function renderActivity(props: ActivityProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="callout warn">
          <strong>Not connected</strong>
          <p>Connect to the gateway to view activity.</p>
        </div>
      </section>
    `;
    }

    // Apply filters
    let filteredEvents = props.events;
    if (props.filterType) {
        filteredEvents = filteredEvents.filter((e) => e.type === props.filterType);
    }
    if (props.filterAgentId) {
        filteredEvents = filteredEvents.filter((e) => e.agentId === props.filterAgentId);
    }

    const eventTypes: ActivityEventType[] = [
        "agent_task_start",
        "agent_task_complete",
        "agent_task_error",
        "user_message",
        "system_event",
    ];

    return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Activity Stream</div>
          <div class="card-sub">Real-time feed of agent and system events.</div>
        </div>
        <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
          ${props.loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      ${props.error
            ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
            : nothing
        }

      <!-- Filters -->
      <div class="activity-filters" style="margin-top: 16px;">
        <div class="activity-filters__group">
          <label class="activity-filters__label">Type:</label>
          <select
            class="activity-filters__select"
            .value=${props.filterType ?? ""}
            @change=${(e: Event) => {
            const value = (e.target as HTMLSelectElement).value;
            props.onFilterChange(value ? (value as ActivityEventType) : null, props.filterAgentId);
        }}
          >
            <option value="">All Types</option>
            ${eventTypes.map(
            (type) => html`<option value=${type}>${getEventLabel(type)}</option>`,
        )}
          </select>
        </div>

        ${props.agents.length > 0
            ? html`
                <div class="activity-filters__group">
                  <label class="activity-filters__label">Agent:</label>
                  <select
                    class="activity-filters__select"
                    .value=${props.filterAgentId ?? ""}
                    @change=${(e: Event) => {
                    const value = (e.target as HTMLSelectElement).value;
                    props.onFilterChange(props.filterType, value || null);
                }}
                  >
                    <option value="">All Agents</option>
                    ${props.agents.map(
                    (agent) =>
                        html`<option value=${agent.id}>
                          ${agent.identity?.emoji ?? "🤖"} ${agent.identity?.name ?? agent.id}
                        </option>`,
                )}
                  </select>
                </div>
              `
            : nothing
        }
      </div>

      <!-- Event List -->
      ${filteredEvents.length === 0
            ? html`
              <div class="empty-state" style="margin-top: 24px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
                <div class="muted">No activity events yet.</div>
                <p class="muted" style="font-size: 13px;">
                  Events will appear here as agents process tasks.
                </p>
              </div>
            `
            : html`
              <div class="activity-list" style="margin-top: 16px;">
                ${filteredEvents.map((event) => renderActivityEvent(event))}
              </div>
            `
        }
    </section>

    <style>
      .activity-filters {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .activity-filters__group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .activity-filters__label {
        font-size: 13px;
        color: var(--muted);
      }

      .activity-filters__select {
        padding: 6px 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--surface-1);
        color: var(--foreground);
        font-size: 13px;
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .activity-event {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        transition: border-color 0.15s ease;
      }

      .activity-event:hover {
        border-color: var(--border-hover);
      }

      .activity-event__icon {
        font-size: 20px;
        line-height: 1;
        flex-shrink: 0;
      }

      .activity-event__content {
        flex: 1;
        min-width: 0;
      }

      .activity-event__header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 4px;
      }

      .activity-event__agent-emoji {
        font-size: 14px;
      }

      .activity-event__agent-name {
        font-weight: 600;
        font-size: 13px;
      }

      .activity-event__type {
        font-size: 12px;
        color: var(--muted);
        padding: 2px 6px;
        background: var(--surface-2);
        border-radius: var(--radius-sm);
      }

      .activity-event__time {
        font-size: 12px;
        color: var(--muted);
        margin-left: auto;
      }

      .activity-event__message {
        font-size: 14px;
        line-height: 1.4;
      }

      .activity-event__details {
        font-size: 12px;
        margin-top: 4px;
        font-family: var(--font-mono);
      }

      /* Event type colors */
      .activity-event--agent_task_complete {
        border-left: 3px solid var(--ok);
      }

      .activity-event--agent_task_error {
        border-left: 3px solid var(--danger);
      }

      .activity-event--user_message {
        border-left: 3px solid var(--accent);
      }

      .activity-event--system_event {
        border-left: 3px solid var(--muted);
      }
    </style>
  `;
}
