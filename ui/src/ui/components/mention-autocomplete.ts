import { html, nothing } from "lit";
import type { GatewayAgentRow } from "../types";

export type MentionAutocompleteProps = {
    /** Whether the autocomplete is currently active */
    active: boolean;
    /** Current query text after @ (without the @) */
    query: string;
    /** List of agents to filter */
    agents: GatewayAgentRow[];
    /** Currently highlighted index in the filtered list */
    highlightedIndex: number;
    /** Position for the dropdown (relative to input) */
    position?: { top: number; left: number };
    /** Callback when an agent is selected */
    onSelect: (agent: GatewayAgentRow) => void;
    /** Callback to close the autocomplete */
    onClose: () => void;
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
 * Filter agents based on query
 */
export function filterAgentsForMention(
    agents: GatewayAgentRow[],
    query: string,
): GatewayAgentRow[] {
    if (!query.trim()) {
        return agents;
    }
    const lowerQuery = query.toLowerCase();
    return agents.filter((agent) => {
        const name = getAgentDisplayName(agent).toLowerCase();
        const id = agent.id.toLowerCase();
        return name.includes(lowerQuery) || id.includes(lowerQuery);
    });
}

/**
 * Detect if we should show mention autocomplete based on cursor position
 * Returns the query string after @ or null if not in mention mode
 */
export function detectMentionTrigger(
    text: string,
    cursorPosition: number,
): string | null {
    // Look backwards from cursor for @ that is at start or preceded by whitespace
    const beforeCursor = text.slice(0, cursorPosition);
    const match = /@(\w*)$/.exec(beforeCursor);

    if (!match) {
        return null;
    }

    // Check that @ is at start or preceded by whitespace
    const atIndex = beforeCursor.length - match[0].length;
    if (atIndex > 0 && !/\s/.test(beforeCursor[atIndex - 1])) {
        return null;
    }

    return match[1]; // Return the query part (without @)
}

/**
 * Insert mention at the current position in text
 */
export function insertMention(
    text: string,
    cursorPosition: number,
    agentName: string,
): { newText: string; newCursorPosition: number } {
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    // Find and remove the @query portion
    const match = /@(\w*)$/.exec(beforeCursor);
    if (!match) {
        return { newText: text, newCursorPosition: cursorPosition };
    }

    const prefix = beforeCursor.slice(0, beforeCursor.length - match[0].length);
    const mention = `@${agentName} `;
    const newText = prefix + mention + afterCursor;
    const newCursorPosition = prefix.length + mention.length;

    return { newText, newCursorPosition };
}

/**
 * Render the mention autocomplete dropdown
 */
export function renderMentionAutocomplete(props: MentionAutocompleteProps) {
    if (!props.active) {
        return nothing;
    }

    const filtered = filterAgentsForMention(props.agents, props.query);

    if (filtered.length === 0) {
        return nothing;
    }

    const style = props.position
        ? `top: ${props.position.top}px; left: ${props.position.left}px;`
        : "";

    return html`
    <div class="mention-autocomplete" style="${style}">
      <div class="mention-autocomplete__header">Mention an agent</div>
      <ul class="mention-autocomplete__list" role="listbox">
        ${filtered.map((agent, index) => {
        const isHighlighted = index === props.highlightedIndex;
        return html`
            <li
              class="mention-autocomplete__item ${isHighlighted ? "mention-autocomplete__item--highlighted" : ""}"
              role="option"
              aria-selected="${isHighlighted}"
              @click=${() => props.onSelect(agent)}
              @mouseenter=${() => {
                // Could update highlighted index on hover
            }}
            >
              <span class="mention-autocomplete__emoji">${getAgentEmoji(agent)}</span>
              <span class="mention-autocomplete__name">${getAgentDisplayName(agent)}</span>
              <span class="mention-autocomplete__id">@${agent.id}</span>
            </li>
          `;
    })}
      </ul>
    </div>

    <style>
      .mention-autocomplete {
        position: absolute;
        z-index: 100;
        min-width: 200px;
        max-width: 300px;
        max-height: 200px;
        overflow-y: auto;
        background: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .mention-autocomplete__header {
        padding: 8px 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--muted);
        border-bottom: 1px solid var(--border);
      }

      .mention-autocomplete__list {
        list-style: none;
        margin: 0;
        padding: 4px;
      }

      .mention-autocomplete__item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.1s ease;
      }

      .mention-autocomplete__item:hover,
      .mention-autocomplete__item--highlighted {
        background: var(--surface-2);
      }

      .mention-autocomplete__emoji {
        font-size: 16px;
        flex-shrink: 0;
      }

      .mention-autocomplete__name {
        font-weight: 500;
        color: var(--foreground);
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .mention-autocomplete__id {
        font-size: 12px;
        color: var(--muted);
        flex-shrink: 0;
      }
    </style>
  `;
}
