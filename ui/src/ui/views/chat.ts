import { html, nothing } from "lit";
import { ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
import type { GatewayAgentRow, SessionsListResult } from "../types";
import type { ChatItem, MessageGroup } from "../types/chat-types";
import type { ChatAttachment, ChatQueueItem } from "../ui-types";
import {
  renderMessageGroup,
  renderReadingIndicatorGroup,
  renderStreamingGroup,
} from "../chat/grouped-render";
import { isInterAgentMessage, normalizeMessage, normalizeRoleForGrouping } from "../chat/message-normalizer";
import { icons } from "../icons";
import { renderMarkdownSidebar } from "./markdown-sidebar";
import { renderAgentSelector } from "./agent-selector";
import {
  renderMentionAutocomplete,
  detectMentionTrigger,
  insertMention,
  filterAgentsForMention,
} from "../components/mention-autocomplete";
import "../components/resizable-divider";

export type CompactionIndicatorStatus = {
  active: boolean;
  startedAt: number | null;
  completedAt: number | null;
};

export type ChatProps = {
  sessionKey: string;
  onSessionKeyChange: (next: string) => void;
  thinkingLevel: string | null;
  showThinking: boolean;
  loading: boolean;
  sending: boolean;
  canAbort?: boolean;
  compactionStatus?: CompactionIndicatorStatus | null;
  messages: unknown[];
  toolMessages: unknown[];
  stream: string | null;
  streamStartedAt: number | null;
  assistantAvatarUrl?: string | null;
  draft: string;
  queue: ChatQueueItem[];
  connected: boolean;
  canSend: boolean;
  disabledReason: string | null;
  error: string | null;
  sessions: SessionsListResult | null;
  // Focus mode
  focusMode: boolean;
  // Sidebar state
  sidebarOpen?: boolean;
  sidebarContent?: string | null;
  sidebarError?: string | null;
  splitRatio?: number;
  assistantName: string;
  assistantAvatar: string | null;
  // Image attachments
  attachments?: ChatAttachment[];
  onAttachmentsChange?: (attachments: ChatAttachment[]) => void;
  // Agent selector props (optional - only shown when agents available)
  agents?: GatewayAgentRow[];
  currentAgentId?: string | null;
  isGroupChat?: boolean;
  onAgentSelect?: (agentId: string) => void;
  onGroupChatSelect?: () => void;
  // Event handlers
  onRefresh: () => void;
  onToggleFocusMode: () => void;
  onDraftChange: (next: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  onQueueRemove: (id: string) => void;
  onNewSession: () => void;
  onOpenSidebar?: (content: string) => void;
  onCloseSidebar?: () => void;
  onSplitRatioChange?: (ratio: number) => void;
  onChatScroll?: (event: Event) => void;
  // Mention autocomplete state (managed by parent)
  mentionActive?: boolean;
  mentionQuery?: string;
  mentionHighlightIndex?: number;
  onMentionStateChange?: (active: boolean, query: string, highlightIndex: number) => void;
};

const COMPACTION_TOAST_DURATION_MS = 5000;

function adjustTextareaHeight(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function renderCompactionIndicator(status: CompactionIndicatorStatus | null | undefined) {
  if (!status) {
    return nothing;
  }

  // Show "compacting..." while active
  if (status.active) {
    return html`
      <div class="callout info compaction-indicator compaction-indicator--active">
        ${icons.loader} Compacting context...
      </div>
    `;
  }

  // Show "compaction complete" briefly after completion
  if (status.completedAt) {
    const elapsed = Date.now() - status.completedAt;
    if (elapsed < COMPACTION_TOAST_DURATION_MS) {
      return html`
        <div class="callout success compaction-indicator compaction-indicator--complete">
          ${icons.check} Context compacted
        </div>
      `;
    }
  }

  return nothing;
}

function generateAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function handlePaste(e: ClipboardEvent, props: ChatProps) {
  const items = e.clipboardData?.items;
  if (!items || !props.onAttachmentsChange) {
    return;
  }

  const imageItems: DataTransferItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith("image/")) {
      imageItems.push(item);
    }
  }

  if (imageItems.length === 0) {
    return;
  }

  e.preventDefault();

  for (const item of imageItems) {
    const file = item.getAsFile();
    if (!file) {
      continue;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const dataUrl = reader.result as string;
      const newAttachment: ChatAttachment = {
        id: generateAttachmentId(),
        dataUrl,
        mimeType: file.type,
      };
      const current = props.attachments ?? [];
      props.onAttachmentsChange?.([...current, newAttachment]);
    });
    reader.readAsDataURL(file);
  }
}

function renderAttachmentPreview(props: ChatProps) {
  const attachments = props.attachments ?? [];
  if (attachments.length === 0) {
    return nothing;
  }

  return html`
    <div class="chat-attachments">
      ${attachments.map(
    (att) => html`
          <div class="chat-attachment">
            <img
              src=${att.dataUrl}
              alt="Attachment preview"
              class="chat-attachment__img"
            />
            <button
              class="chat-attachment__remove"
              type="button"
              aria-label="Remove attachment"
              @click=${() => {
        const next = (props.attachments ?? []).filter((a) => a.id !== att.id);
        props.onAttachmentsChange?.(next);
      }}
            >
              ${icons.x}
            </button>
          </div>
        `,
  )}
    </div>
  `;
}

export function renderChat(props: ChatProps) {
  const canCompose = props.connected;
  const isBusy = props.sending || props.stream !== null;
  const canAbort = Boolean(props.canAbort && props.onAbort);
  const activeSession = props.sessions?.sessions?.find((row) => row.key === props.sessionKey);
  const reasoningLevel = activeSession?.reasoningLevel ?? "off";
  const showReasoning = props.showThinking && reasoningLevel !== "off";
  const assistantIdentity = {
    name: props.assistantName,
    avatar: props.assistantAvatar ?? props.assistantAvatarUrl ?? null,
  };

  const hasAttachments = (props.attachments?.length ?? 0) > 0;
  const composePlaceholder = props.connected
    ? hasAttachments
      ? "Add a message or paste more images..."
      : "Message (↩ to send, Shift+↩ for line breaks, paste images)"
    : "Connect to the gateway to start chatting…";

  const splitRatio = props.splitRatio ?? 0.6;
  const sidebarOpen = Boolean(props.sidebarOpen && props.onCloseSidebar);
  const thread = html`
    <div
      class="chat-thread"
      role="log"
      aria-live="polite"
      @scroll=${props.onChatScroll}
    >
      ${props.loading
      ? html`
              <div class="muted">Loading chat…</div>
            `
      : nothing
    }
      ${repeat(
      buildChatItems(props),
      (item) => item.key,
      (item) => {
        if (item.kind === "reading-indicator") {
          return renderReadingIndicatorGroup(assistantIdentity);
        }

        if (item.kind === "stream") {
          return renderStreamingGroup(
            item.text,
            item.startedAt,
            props.onOpenSidebar,
            assistantIdentity,
          );
        }

        if (item.kind === "group") {
          return renderMessageGroup(item, {
            onOpenSidebar: props.onOpenSidebar,
            showReasoning,
            assistantName: props.assistantName,
            assistantAvatar: assistantIdentity.avatar,
            agents: props.agents,
          });
        }

        return nothing;
      },
    )}
    </div>
  `;

  return html`
    <section class="card chat">
      ${props.disabledReason ? html`<div class="callout">${props.disabledReason}</div>` : nothing}

      ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}

      ${renderCompactionIndicator(props.compactionStatus)}

      ${props.agents && props.agents.length > 0 && props.onAgentSelect && props.onGroupChatSelect
      ? renderAgentSelector({
        connected: props.connected,
        agents: props.agents,
        currentAgentId: props.currentAgentId ?? null,
        isGroupChat: props.isGroupChat ?? false,
        maxVisiblePills: 5,
        onAgentSelect: props.onAgentSelect,
        onGroupChatSelect: props.onGroupChatSelect,
      })
      : nothing
    }

      ${props.focusMode
      ? html`
            <button
              class="chat-focus-exit"
              type="button"
              @click=${props.onToggleFocusMode}
              aria-label="Exit focus mode"
              title="Exit focus mode"
            >
              ${icons.x}
            </button>
          `
      : nothing
    }

      <div
        class="chat-split-container ${sidebarOpen ? "chat-split-container--open" : ""}"
      >
        <div
          class="chat-main"
          style="flex: ${sidebarOpen ? `0 0 ${splitRatio * 100}%` : "1 1 100%"}"
        >
          ${thread}
        </div>

        ${sidebarOpen
      ? html`
              <resizable-divider
                .splitRatio=${splitRatio}
                @resize=${(e: CustomEvent) => props.onSplitRatioChange?.(e.detail.splitRatio)}
              ></resizable-divider>
              <div class="chat-sidebar">
                ${renderMarkdownSidebar({
        content: props.sidebarContent ?? null,
        error: props.sidebarError ?? null,
        onClose: props.onCloseSidebar!,
        onViewRawText: () => {
          if (!props.sidebarContent || !props.onOpenSidebar) {
            return;
          }
          props.onOpenSidebar(`\`\`\`\n${props.sidebarContent}\n\`\`\``);
        },
      })}
              </div>
            `
      : nothing
    }
      </div>

      ${props.queue.length
      ? html`
            <div class="chat-queue" role="status" aria-live="polite">
              <div class="chat-queue__title">Queued (${props.queue.length})</div>
              <div class="chat-queue__list">
                ${props.queue.map(
        (item) => html`
                    <div class="chat-queue__item">
                      <div class="chat-queue__text">
                        ${item.text ||
          (item.attachments?.length ? `Image (${item.attachments.length})` : "")
          }
                      </div>
                      <button
                        class="btn chat-queue__remove"
                        type="button"
                        aria-label="Remove queued message"
                        @click=${() => props.onQueueRemove(item.id)}
                      >
                        ${icons.x}
                      </button>
                    </div>
                  `,
      )}
              </div>
            </div>
          `
      : nothing
    }

      <div class="chat-compose">
        ${renderAttachmentPreview(props)}
        ${renderMentionDropdown(props)}
        <div class="chat-compose__row">
          <label class="field chat-compose__field">
            <span>Message</span>
            <textarea
              ${ref((el) => el && adjustTextareaHeight(el as HTMLTextAreaElement))}
              .value=${props.draft}
              ?disabled=${!props.connected}
              @keydown=${(e: KeyboardEvent) => handleComposeKeydown(e, props, canCompose)}
              @input=${(e: Event) => handleComposeInput(e, props)}
              @paste=${(e: ClipboardEvent) => handlePaste(e, props)}
              placeholder=${composePlaceholder}
            ></textarea>
          </label>
          <div class="chat-compose__actions">
            <button
              class="btn"
              ?disabled=${!props.connected || (!canAbort && props.sending)}
              @click=${canAbort ? props.onAbort : props.onNewSession}
            >
              ${canAbort ? "Stop" : "New session"}
            </button>
            <button
              class="btn primary"
              ?disabled=${!props.connected}
              @click=${props.onSend}
            >
              ${isBusy ? "Queue" : "Send"}<kbd class="btn-kbd">↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Handle keydown in the compose textarea, including mention navigation
 */
function handleComposeKeydown(e: KeyboardEvent, props: ChatProps, canCompose: boolean) {
  const target = e.target as HTMLTextAreaElement;
  const agents = props.agents ?? [];
  const mentionActive = props.mentionActive ?? false;
  const mentionQuery = props.mentionQuery ?? "";
  const highlightIndex = props.mentionHighlightIndex ?? 0;

  // If mention autocomplete is active, handle navigation keys
  if (mentionActive && agents.length > 0 && props.onMentionStateChange) {
    const filtered = filterAgentsForMention(agents, mentionQuery);
    const maxIndex = filtered.length - 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = Math.min(highlightIndex + 1, maxIndex);
      props.onMentionStateChange(true, mentionQuery, newIndex);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = Math.max(highlightIndex - 1, 0);
      props.onMentionStateChange(true, mentionQuery, newIndex);
      return;
    }

    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      const selected = filtered[highlightIndex];
      if (selected) {
        const agentName = selected.identity?.name || selected.name || selected.id;
        const cursorPos = target.selectionStart ?? props.draft.length;
        const { newText, newCursorPosition } = insertMention(props.draft, cursorPos, agentName);
        props.onDraftChange(newText);
        props.onMentionStateChange(false, "", 0);
        // Set cursor position after mention
        requestAnimationFrame(() => {
          target.setSelectionRange(newCursorPosition, newCursorPosition);
        });
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      props.onMentionStateChange(false, "", 0);
      return;
    }
  }

  // Normal Enter handling for sending message
  if (e.key !== "Enter") {
    return;
  }
  if (e.isComposing || e.keyCode === 229) {
    return;
  }
  if (e.shiftKey) {
    return; // Allow Shift+Enter for line breaks
  }
  if (!props.connected) {
    return;
  }
  e.preventDefault();
  if (canCompose) {
    props.onSend();
  }
}

/**
 * Handle input changes in the compose textarea, detecting @ mentions
 */
function handleComposeInput(e: Event, props: ChatProps) {
  const target = e.target as HTMLTextAreaElement;
  adjustTextareaHeight(target);
  props.onDraftChange(target.value);

  // Detect @ trigger for mention autocomplete
  if (props.agents && props.agents.length > 0 && props.onMentionStateChange) {
    const cursorPos = target.selectionStart ?? target.value.length;
    const query = detectMentionTrigger(target.value, cursorPos);
    if (query !== null) {
      props.onMentionStateChange(true, query, 0);
    } else if (props.mentionActive) {
      props.onMentionStateChange(false, "", 0);
    }
  }
}

/**
 * Render mention autocomplete dropdown
 */
function renderMentionDropdown(props: ChatProps) {
  if (!props.mentionActive || !props.agents || props.agents.length === 0) {
    return nothing;
  }

  return renderMentionAutocomplete({
    active: props.mentionActive,
    query: props.mentionQuery ?? "",
    agents: props.agents,
    highlightedIndex: props.mentionHighlightIndex ?? 0,
    onSelect: (agent) => {
      // We handle selection in keydown for now (Enter key)
      // This is for click selection
      if (props.onMentionStateChange) {
        const agentName = agent.identity?.name || agent.name || agent.id;
        // Insert mention at current position
        const el = document.querySelector(".chat-compose__field textarea") as HTMLTextAreaElement | null;
        const cursorPos = el?.selectionStart ?? props.draft.length;
        const { newText, newCursorPosition } = insertMention(props.draft, cursorPos, agentName);
        props.onDraftChange(newText);
        props.onMentionStateChange(false, "", 0);
        // Restore focus and set cursor
        if (el) {
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(newCursorPosition, newCursorPosition);
          });
        }
      }
    },
    onClose: () => {
      props.onMentionStateChange?.(false, "", 0);
    },
  });
}

const CHAT_HISTORY_RENDER_LIMIT = 200;

function groupMessages(items: ChatItem[]): Array<ChatItem | MessageGroup> {
  const result: Array<ChatItem | MessageGroup> = [];
  let currentGroup: MessageGroup | null = null;

  for (const item of items) {
    if (item.kind !== "message") {
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      result.push(item);
      continue;
    }

    const normalized = normalizeMessage(item.message);
    const role = normalizeRoleForGrouping(normalized.role);
    const timestamp = normalized.timestamp || Date.now();
    // Extract agentId from message for grouping (enables agent avatars)
    const msgObj = item.message as Record<string, unknown> | null;
    const agentId = typeof msgObj?.agentId === "string" ? msgObj.agentId : undefined;
    // Detect inter-agent (A2A) messages for special styling
    const isA2A = isInterAgentMessage(item.message);

    // Group by both role AND agentId so different agents get separate groups
    const sameGroup =
      currentGroup &&
      currentGroup.role === role &&
      currentGroup.agentId === agentId;

    if (!sameGroup) {
      if (currentGroup) {
        result.push(currentGroup);
      }
      currentGroup = {
        kind: "group",
        key: `group:${role}:${agentId ?? "default"}:${item.key}`,
        role,
        agentId,
        isInterAgent: isA2A,
        messages: [{ message: item.message, key: item.key }],
        timestamp,
        isStreaming: false,
      };
    } else {
      currentGroup!.messages.push({ message: item.message, key: item.key });
    }
  }

  if (currentGroup) {
    result.push(currentGroup);
  }
  return result;
}

function buildChatItems(props: ChatProps): Array<ChatItem | MessageGroup> {
  const items: ChatItem[] = [];
  const history = Array.isArray(props.messages) ? props.messages : [];
  const tools = Array.isArray(props.toolMessages) ? props.toolMessages : [];
  const historyStart = Math.max(0, history.length - CHAT_HISTORY_RENDER_LIMIT);
  if (historyStart > 0) {
    items.push({
      kind: "message",
      key: "chat:history:notice",
      message: {
        role: "system",
        content: `Showing last ${CHAT_HISTORY_RENDER_LIMIT} messages (${historyStart} hidden).`,
        timestamp: Date.now(),
      },
    });
  }
  for (let i = historyStart; i < history.length; i++) {
    const msg = history[i];
    const normalized = normalizeMessage(msg);

    if (!props.showThinking && normalized.role.toLowerCase() === "toolresult") {
      continue;
    }

    items.push({
      kind: "message",
      key: messageKey(msg, i),
      message: msg,
    });
  }
  if (props.showThinking) {
    for (let i = 0; i < tools.length; i++) {
      items.push({
        kind: "message",
        key: messageKey(tools[i], i + history.length),
        message: tools[i],
      });
    }
  }

  if (props.stream !== null) {
    const key = `stream:${props.sessionKey}:${props.streamStartedAt ?? "live"}`;
    if (props.stream.trim().length > 0) {
      items.push({
        kind: "stream",
        key,
        text: props.stream,
        startedAt: props.streamStartedAt ?? Date.now(),
      });
    } else {
      items.push({ kind: "reading-indicator", key });
    }
  }

  return groupMessages(items);
}

function messageKey(message: unknown, index: number): string {
  const m = message as Record<string, unknown>;
  const toolCallId = typeof m.toolCallId === "string" ? m.toolCallId : "";
  if (toolCallId) {
    return `tool:${toolCallId}`;
  }
  const id = typeof m.id === "string" ? m.id : "";
  if (id) {
    return `msg:${id}`;
  }
  const messageId = typeof m.messageId === "string" ? m.messageId : "";
  if (messageId) {
    return `msg:${messageId}`;
  }
  const timestamp = typeof m.timestamp === "number" ? m.timestamp : null;
  const role = typeof m.role === "string" ? m.role : "unknown";
  if (timestamp != null) {
    return `msg:${role}:${timestamp}:${index}`;
  }
  return `msg:${role}:${index}`;
}
