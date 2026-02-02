/**
 * Team Chat View
 *
 * Multi-agent conversation display for team group chats.
 * Shows messages from all team members with color-coding and avatars.
 */

import { html, nothing, type TemplateResult } from "lit";


/**
 * Agent info for display.
 */
export type TeamAgentInfo = {
    id: string;
    name: string;
    emoji?: string;
    theme?: string;
    avatar?: string;
};

/**
 * Message in the team chat.
 */
export type TeamChatMessage = {
    id: string;
    timestamp: number;
    from: "user" | string;
    to: "all" | string;
    content: string;
    silent?: boolean;
};

/**
 * Props for the team chat view.
 */
export type TeamChatViewProps = {
    connected: boolean;
    loading: boolean;
    error: string | null;
    teamId: string;
    teamName: string;
    members: TeamAgentInfo[];
    messages: TeamChatMessage[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onSendMessage: () => void;
    onBack: () => void;
};

/**
 * Color palette for agents (rotate through these).
 */
const AGENT_COLORS = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
];

/**
 * Get a consistent color for an agent.
 */
function getAgentColor(agentId: string, members: TeamAgentInfo[]): string {
    const index = members.findIndex((m) => m.id === agentId);
    return AGENT_COLORS[index % AGENT_COLORS.length] ?? AGENT_COLORS[0]!;
}

/**
 * Format timestamp for display.
 */
function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Render a single message.
 */
function renderMessage(
    msg: TeamChatMessage,
    members: TeamAgentInfo[],
): TemplateResult {
    const isUser = msg.from === "user";
    const agent = !isUser ? members.find((m) => m.id === msg.from) : null;
    const agentColor = !isUser ? getAgentColor(msg.from, members) : "#64748b";
    const displayName = isUser ? "You" : agent?.name ?? msg.from;
    const emoji = agent?.emoji ?? "🤖";

    // Skip silent messages in display (or show them differently)
    if (msg.silent) {
        return html``;
    }

    const targetDisplay =
        msg.to !== "all" ? html`<span style="opacity: 0.6;">→ @${msg.to}</span>` : "";

    return html`
    <div
      style="
        display: flex;
        gap: 12px;
        padding: 12px 16px;
        ${isUser ? "flex-direction: row-reverse;" : ""}
      "
    >
      <!-- Avatar -->
      <div
        style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${isUser ? "var(--primary, #3b82f6)" : agentColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        "
      >
        ${isUser ? "👤" : emoji}
      </div>

      <!-- Message content -->
      <div
        style="
          max-width: 70%;
          ${isUser ? "text-align: right;" : ""}
        "
      >
        <!-- Header -->
        <div
          style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
            ${isUser ? "justify-content: flex-end;" : ""}
          "
        >
          <span
            style="
              font-weight: 600;
              font-size: 13px;
              color: ${isUser ? "var(--text-primary, #1e293b)" : agentColor};
            "
          >
            ${displayName}
          </span>
          ${targetDisplay}
          <span
            style="
              font-size: 11px;
              color: var(--text-tertiary, #94a3b8);
            "
          >
            ${formatTime(msg.timestamp)}
          </span>
        </div>

        <!-- Bubble -->
        <div
          style="
            padding: 10px 14px;
            border-radius: 16px;
            ${isUser
            ? "background: var(--primary, #3b82f6); color: white; border-bottom-right-radius: 4px;"
            : "background: var(--surface-secondary, #f1f5f9); color: var(--text-primary, #1e293b); border-bottom-left-radius: 4px;"}
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
          "
        >
          ${msg.content}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the team members bar.
 */
function renderMembersBar(members: TeamAgentInfo[]): TemplateResult {
    return html`
    <div
      style="
        display: flex;
        gap: 8px;
        padding: 8px 16px;
        border-bottom: 1px solid var(--border-subtle, #e2e8f0);
        overflow-x: auto;
      "
    >
      ${members.map((m) => {
        const color = getAgentColor(m.id, members);
        return html`
          <div
            style="
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              background: ${color}15;
              border: 1px solid ${color}40;
              border-radius: 16px;
              font-size: 12px;
              white-space: nowrap;
            "
          >
            <span>${m.emoji ?? "🤖"}</span>
            <span style="color: ${color}; font-weight: 500;">${m.name}</span>
          </div>
        `;
    })}
    </div>
  `;
}

/**
 * Render the message input area.
 */
function renderInputArea(props: TeamChatViewProps): TemplateResult {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            props.onSendMessage();
        }
    };

    return html`
    <div
      style="
        display: flex;
        gap: 12px;
        padding: 16px;
        border-top: 1px solid var(--border-subtle, #e2e8f0);
        background: var(--surface-primary, #ffffff);
      "
    >
      <input
        type="text"
        placeholder="Message the team... (use @agentId to mention)"
        .value=${props.inputValue}
        @input=${(e: InputEvent) =>
            props.onInputChange((e.target as HTMLInputElement).value)}
        @keydown=${handleKeyDown}
        style="
          flex: 1;
          padding: 12px 16px;
          border: 1px solid var(--border-subtle, #e2e8f0);
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        "
      />
      <button
        @click=${props.onSendMessage}
        ?disabled=${!props.inputValue.trim()}
        style="
          padding: 12px 20px;
          background: var(--primary, #3b82f6);
          color: white;
          border: none;
          border-radius: 24px;
          font-weight: 500;
          cursor: pointer;
          opacity: ${props.inputValue.trim() ? 1 : 0.5};
          transition: opacity 0.15s;
        "
      >
        Send
      </button>
    </div>
  `;
}

/**
 * Render the team chat view.
 */
export function renderTeamChatView(props: TeamChatViewProps): TemplateResult {
    const { connected, loading, error, teamName, members, messages, onBack } = props;

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
        Connect to gateway to use team chat
      </div>
    `;
    }

    return html`
    <div
      style="
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--surface-primary, #ffffff);
      "
    >
      <!-- Header -->
      <div
        style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid var(--border-subtle, #e2e8f0);
        "
      >
        <button
          @click=${onBack}
          style="
            padding: 8px;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 18px;
            color: var(--text-secondary, #64748b);
          "
        >
          ←
        </button>
        <div style="flex: 1;">
          <h2
            style="
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: var(--text-primary, #1e293b);
            "
          >
            ${teamName}
          </h2>
          <p
            style="
              margin: 2px 0 0;
              font-size: 13px;
              color: var(--text-tertiary, #94a3b8);
            "
          >
            ${members.length} team members
          </p>
        </div>
      </div>

      <!-- Members bar -->
      ${renderMembersBar(members)}

      <!-- Messages area -->
      <div
        style="
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        "
      >
        ${loading
            ? html`
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 48px;
                  color: var(--text-tertiary, #94a3b8);
                "
              >
                Loading team chat...
              </div>
            `
            : error
                ? html`
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px;
                    color: var(--status-error, #ef4444);
                  "
                >
                  ${error}
                </div>
              `
                : messages.length === 0
                    ? html`
                  <div
                    style="
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      padding: 48px;
                      text-align: center;
                      color: var(--text-tertiary, #94a3b8);
                    "
                  >
                    <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
                    <p style="margin: 0; font-size: 14px;">
                      Start the conversation! All team members will see your message.
                    </p>
                    <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.7;">
                      Use @agentId to mention a specific teammate
                    </p>
                  </div>
                `
                    : messages.map((msg) => renderMessage(msg, members))}
      </div>

      <!-- Input area -->
      ${renderInputArea(props)}
    </div>
  `;
}
