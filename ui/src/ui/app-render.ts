import { html, nothing } from "lit";
import type { AppViewState } from "./app-view-state";
import { parseAgentSessionKey } from "../../../src/routing/session-key.js";
import { refreshChatAvatar } from "./app-chat";
import { renderChatControls, renderTab, renderThemeToggle } from "./app-render.helpers";
import { loadChannels } from "./controllers/channels";
import { loadChatHistory } from "./controllers/chat";
import {
  applyConfig,
  loadConfig,
  runUpdate,
  saveConfig,
  updateConfigFormValue,
  removeConfigFormValue,
} from "./controllers/config";
import {
  loadCronRuns,
  toggleCronJob,
  runCronJob,
  removeCronJob,
  addCronJob,
} from "./controllers/cron";
import { loadDebug, callDebugMethod } from "./controllers/debug";
import {
  approveDevicePairing,
  loadDevices,
  rejectDevicePairing,
  revokeDeviceToken,
  rotateDeviceToken,
} from "./controllers/devices";
import {
  loadExecApprovals,
  removeExecApprovalsFormValue,
  saveExecApprovals,
  updateExecApprovalsFormValue,
} from "./controllers/exec-approvals";
import { loadLogs } from "./controllers/logs";
import { loadNodes } from "./controllers/nodes";
import { loadPresence } from "./controllers/presence";
import { deleteSession, loadSessions, patchSession } from "./controllers/sessions";
import {
  installSkill,
  loadSkills,
  saveSkillApiKey,
  updateSkillEdit,
  updateSkillEnabled,
} from "./controllers/skills";
import { icons } from "./icons";
import { TAB_GROUPS, subtitleForTab, titleForTab, serviceIdFromPath, pathForServiceDetail, pathForTab } from "./navigation";
import { renderChannels } from "./views/channels";
import { renderChat } from "./views/chat";
import { renderConfig } from "./views/config";
import { renderCron } from "./views/cron";
import { renderDebug } from "./views/debug";
import { renderExecApprovalPrompt } from "./views/exec-approval";
import { renderGatewayUrlConfirmation } from "./views/gateway-url-confirmation";
import { renderInstances } from "./views/instances";
import { renderLogs } from "./views/logs";
import { renderNodes } from "./views/nodes";
import { renderOverview } from "./views/overview";
import { renderSessions } from "./views/sessions";
import { renderSkills } from "./views/skills";
import { renderAgents } from "./views/agents";
import { renderActivity, type ActivityEvent, type ActivityEventType } from "./views/activity";
import { renderControlTower } from "./views/controltower";
import { renderServices } from "./views/services";
import { renderServiceDetail } from "./views/service-detail";
import { renderPacks } from "./views/packs";
import { renderReleases } from "./views/releases";
import { renderIncidents } from "./views/incidents";
import { renderPolicy } from "./views/policy";
import { renderAgentNav } from "./views/agent-nav";
import { syncUrlWithSessionKey } from "./app-settings";

const AVATAR_DATA_RE = /^data:/i;
const AVATAR_HTTP_RE = /^https?:\/\//i;

/**
 * Extract agent ID from session key string.
 * Session keys follow formats like:
 * - "agent:{agentId}:main" -> returns agentId
 * - "agent:all:group" -> returns "all"
 * - "main" or other -> returns null
 */
function extractAgentIdFromSessionKey(sessionKey: string): string | null {
  if (!sessionKey) return null;
  const match = /^agent:([^:]+):/.exec(sessionKey);
  return match ? match[1] : null;
}

function resolveAssistantAvatarUrl(state: AppViewState): string | undefined {
  const list = state.agentsList?.agents ?? [];
  const parsed = parseAgentSessionKey(state.sessionKey);
  const agentId = parsed?.agentId ?? state.agentsList?.defaultId ?? "main";
  const agent = list.find((entry) => entry.id === agentId);
  const identity = agent?.identity;
  const candidate = identity?.avatarUrl ?? identity?.avatar;
  if (!candidate) {
    return undefined;
  }
  if (AVATAR_DATA_RE.test(candidate) || AVATAR_HTTP_RE.test(candidate)) {
    return candidate;
  }
  return identity?.avatarUrl;
}

export function renderApp(state: AppViewState) {
  const presenceCount = state.presenceEntries.length;
  const sessionsCount = state.sessionsResult?.count ?? null;
  const cronNext = state.cronStatus?.nextWakeAtMs ?? null;
  const chatDisabledReason = state.connected ? null : "Disconnected from gateway.";
  const isChat = state.tab === "chat";
  const chatFocus = isChat && (state.settings.chatFocusMode || state.onboarding);
  const showThinking = state.onboarding ? false : state.settings.chatShowThinking;
  const assistantAvatarUrl = resolveAssistantAvatarUrl(state);
  const chatAvatarUrl = state.chatAvatarUrl ?? assistantAvatarUrl ?? null;

  return html`
    <device-gate
      .connected=${state.connected}
      .lastError=${state.lastError}
      @token-submit=${(e: CustomEvent<{ token: string }>) => {
      state.applySettings({
        ...state.settings,
        token: e.detail.token,
      });
      state.connect();
    }}
    >
    <div class="shell ${isChat ? "shell--chat" : ""} ${chatFocus ? "shell--chat-focus" : ""} ${state.settings.navCollapsed ? "shell--nav-collapsed" : ""} ${state.onboarding ? "shell--onboarding" : ""}">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="nav-collapse-toggle"
            @click=${() =>
      state.applySettings({
        ...state.settings,
        navCollapsed: !state.settings.navCollapsed,
      })}
            title="${state.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"}"
            aria-label="${state.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"}"
          >
            <span class="nav-collapse-toggle__icon">${icons.menu}</span>
          </button>
          <div class="brand">
            <div class="brand-logo">
              <img src="/favicon.svg" alt="OpenClaw" />
            </div>
            <div class="brand-text">
              <div class="brand-title">OPENCLAW</div>
              <div class="brand-sub">Gateway Dashboard</div>
            </div>
          </div>
        </div>
        <div class="topbar-status">
          <div class="pill">
            <span class="statusDot ${state.connected ? "ok" : ""}"></span>
            <span>Health</span>
            <span class="mono">${state.connected ? "OK" : "Offline"}</span>
          </div>
          ${renderThemeToggle(state)}
        </div>
      </header>
      <aside class="nav ${state.settings.navCollapsed ? "nav--collapsed" : ""}">
        ${TAB_GROUPS.map((group) => {
        const isGroupCollapsed = state.settings.navGroupsCollapsed[group.label] ?? false;
        const hasActiveTab = group.tabs.some((tab) => tab === state.tab);
        const isChatGroup = group.label === "Chat";
        return html`
            <div class="nav-group ${isGroupCollapsed && !hasActiveTab ? "nav-group--collapsed" : ""}">
              <button
                class="nav-label"
                @click=${() => {
            const next = { ...state.settings.navGroupsCollapsed };
            next[group.label] = !isGroupCollapsed;
            state.applySettings({
              ...state.settings,
              navGroupsCollapsed: next,
            });
          }}
                aria-expanded=${!isGroupCollapsed}
              >
                <span class="nav-label__text">${group.label}</span>
                <span class="nav-label__chevron">${isGroupCollapsed ? "+" : "−"}</span>
              </button>
              <div class="nav-group__items">
                ${group.tabs.map((tab) => renderTab(state, tab))}
                ${isChatGroup && state.connected ? renderAgentNav({
            connected: state.connected,
            agents: state.agentsList?.agents ?? [],
            currentAgentId: extractAgentIdFromSessionKey(state.sessionKey),
            expanded: state.settings.agentNavExpanded ?? false,
            onAgentSelect: (agentId: string) => {
              const newSessionKey = `agent:${agentId}:main`;
              state.switchToAgentSession(newSessionKey);
              syncUrlWithSessionKey(state, newSessionKey, true);
              state.setTab("chat");
            },
            onGroupChatSelect: () => {
              const groupSessionKey = "agent:all:group";
              state.switchToAgentSession(groupSessionKey);
              syncUrlWithSessionKey(state, groupSessionKey, true);
              state.setTab("chat");
            },
            onToggleExpanded: () => {
              state.applySettings({
                ...state.settings,
                agentNavExpanded: !(state.settings.agentNavExpanded ?? false),
              });
            },
          }) : nothing}
              </div>
            </div>
          `;
      })}
        <div class="nav-group nav-group--links">
          <div class="nav-label nav-label--static">
            <span class="nav-label__text">Resources</span>
          </div>
          <div class="nav-group__items">
            <a
              class="nav-item nav-item--external"
              href="https://docs.firmos.ai"
              target="_blank"
              rel="noreferrer"
              title="Docs (opens in new tab)"
            >
              <span class="nav-item__icon" aria-hidden="true">${icons.book}</span>
              <span class="nav-item__text">Docs</span>
            </a>
          </div>
        </div>
      </aside>
      <main class="content ${isChat ? "content--chat" : ""}">
        <section class="content-header">
          <div>
            <div class="page-title">${titleForTab(state.tab)}</div>
            <div class="page-sub">${subtitleForTab(state.tab)}</div>
          </div>
          <div class="page-meta">
            ${state.lastError ? html`<div class="pill danger">${state.lastError}</div>` : nothing}
            ${isChat ? renderChatControls(state) : nothing}
          </div>
        </section>

        ${state.tab === "overview"
      ? renderOverview({
        connected: state.connected,
        hello: state.hello,
        settings: state.settings,
        password: state.password,
        lastError: state.lastError,
        presenceCount,
        sessionsCount,
        cronEnabled: state.cronStatus?.enabled ?? null,
        cronNext,
        lastChannelsRefresh: state.channelsLastSuccess,
        onSettingsChange: (next) => state.applySettings(next),
        onPasswordChange: (next) => (state.password = next),
        onSessionKeyChange: (next) => {
          state.sessionKey = next;
          state.chatMessage = "";
          state.resetToolStream();
          state.applySettings({
            ...state.settings,
            sessionKey: next,
            lastActiveSessionKey: next,
          });
          void state.loadAssistantIdentity();
        },
        onConnect: () => state.connect(),
        onRefresh: () => state.loadOverview(),
      })
      : nothing
    }

        ${state.tab === "channels"
      ? renderChannels({
        connected: state.connected,
        loading: state.channelsLoading,
        snapshot: state.channelsSnapshot,
        lastError: state.channelsError,
        lastSuccessAt: state.channelsLastSuccess,
        whatsappMessage: state.whatsappLoginMessage,
        whatsappQrDataUrl: state.whatsappLoginQrDataUrl,
        whatsappConnected: state.whatsappLoginConnected,
        whatsappBusy: state.whatsappBusy,
        configSchema: state.configSchema,
        configSchemaLoading: state.configSchemaLoading,
        configForm: state.configForm,
        configUiHints: state.configUiHints,
        configSaving: state.configSaving,
        configFormDirty: state.configFormDirty,
        nostrProfileFormState: state.nostrProfileFormState,
        nostrProfileAccountId: state.nostrProfileAccountId,
        onRefresh: (probe) => loadChannels(state, probe),
        onWhatsAppStart: (force) => state.handleWhatsAppStart(force),
        onWhatsAppWait: () => state.handleWhatsAppWait(),
        onWhatsAppLogout: () => state.handleWhatsAppLogout(),
        onConfigPatch: (path, value) => updateConfigFormValue(state, path, value),
        onConfigSave: () => state.handleChannelConfigSave(),
        onConfigReload: () => state.handleChannelConfigReload(),
        onNostrProfileEdit: (accountId, profile) =>
          state.handleNostrProfileEdit(accountId, profile),
        onNostrProfileCancel: () => state.handleNostrProfileCancel(),
        onNostrProfileFieldChange: (field, value) =>
          state.handleNostrProfileFieldChange(field, value),
        onNostrProfileSave: () => state.handleNostrProfileSave(),
        onNostrProfileImport: () => state.handleNostrProfileImport(),
        onNostrProfileToggleAdvanced: () => state.handleNostrProfileToggleAdvanced(),
      })
      : nothing
    }

        ${state.tab === "instances"
      ? renderInstances({
        loading: state.presenceLoading,
        entries: state.presenceEntries,
        lastError: state.presenceError,
        statusMessage: state.presenceStatus,
        onRefresh: () => loadPresence(state),
      })
      : nothing
    }

        ${state.tab === "sessions"
      ? renderSessions({
        loading: state.sessionsLoading,
        result: state.sessionsResult,
        error: state.sessionsError,
        activeMinutes: state.sessionsFilterActive,
        limit: state.sessionsFilterLimit,
        includeGlobal: state.sessionsIncludeGlobal,
        includeUnknown: state.sessionsIncludeUnknown,
        basePath: state.basePath,
        onFiltersChange: (next) => {
          state.sessionsFilterActive = next.activeMinutes;
          state.sessionsFilterLimit = next.limit;
          state.sessionsIncludeGlobal = next.includeGlobal;
          state.sessionsIncludeUnknown = next.includeUnknown;
        },
        onRefresh: () => loadSessions(state),
        onPatch: (key, patch) => patchSession(state, key, patch),
        onDelete: (key) => deleteSession(state, key),
      })
      : nothing
    }

        ${state.tab === "cron"
      ? renderCron({
        loading: state.cronLoading,
        status: state.cronStatus,
        jobs: state.cronJobs,
        error: state.cronError,
        busy: state.cronBusy,
        form: state.cronForm,
        channels: state.channelsSnapshot?.channelMeta?.length
          ? state.channelsSnapshot.channelMeta.map((entry) => entry.id)
          : (state.channelsSnapshot?.channelOrder ?? []),
        channelLabels: state.channelsSnapshot?.channelLabels ?? {},
        channelMeta: state.channelsSnapshot?.channelMeta ?? [],
        runsJobId: state.cronRunsJobId,
        runs: state.cronRuns,
        onFormChange: (patch) => (state.cronForm = { ...state.cronForm, ...patch }),
        onRefresh: () => state.loadCron(),
        onAdd: () => addCronJob(state),
        onToggle: (job, enabled) => toggleCronJob(state, job, enabled),
        onRun: (job) => runCronJob(state, job),
        onRemove: (job) => removeCronJob(state, job),
        onLoadRuns: (jobId) => loadCronRuns(state, jobId),
      })
      : nothing
    }

        ${state.tab === "agents"
      ? renderAgents({
        connected: state.connected,
        agents: state.agentsList?.agents ?? [],
        selectedAgentId: state.sessionKey ? (extractAgentIdFromSessionKey(state.sessionKey) ?? null) : null,
        loading: state.agentsLoading,
        error: state.agentsError,
        onAgentSelect: (agentId: string) => {
          const newSessionKey = `agent:${agentId}:main`;
          state.switchToAgentSession(newSessionKey);
          syncUrlWithSessionKey(state, newSessionKey, true);
          state.setTab("chat");
        },
        onServiceClick: (serviceId: string) => {
          // Navigate to service detail page
          const servicePath = pathForServiceDetail(serviceId, state.basePath);
          window.history.pushState({}, "", servicePath);
          state.tab = "services";
        },
        onRefresh: () => state.loadOverview(),
      })
      : nothing
    }

        ${state.tab === "activity"
      ? renderActivity({
        connected: state.connected,
        events: (state as any).activityEvents ?? [],
        agents: state.agentsList?.agents ?? [],
        loading: (state as any).activityLoading ?? false,
        error: (state as any).activityError ?? null,
        filterType: (state as any).activityFilterType ?? null,
        filterAgentId: (state as any).activityFilterAgentId ?? null,
        onFilterChange: (type: ActivityEventType | null, agentId: string | null) => {
          (state as any).activityFilterType = type;
          (state as any).activityFilterAgentId = agentId;
        },
        onRefresh: () => {/* Activity events refresh - placeholder */ },
      })
      : nothing
    }

        ${state.tab === "skills"
      ? renderSkills({
        loading: state.skillsLoading,
        report: state.skillsReport,
        error: state.skillsError,
        filter: state.skillsFilter,
        edits: state.skillEdits,
        messages: state.skillMessages,
        busyKey: state.skillsBusyKey,
        onFilterChange: (next) => (state.skillsFilter = next),
        onRefresh: () => loadSkills(state, { clearMessages: true }),
        onToggle: (key, enabled) => updateSkillEnabled(state, key, enabled),
        onEdit: (key, value) => updateSkillEdit(state, key, value),
        onSaveKey: (key) => saveSkillApiKey(state, key),
        onInstall: (skillKey, name, installId) =>
          installSkill(state, skillKey, name, installId),
      })
      : nothing
    }

        ${state.tab === "nodes"
      ? renderNodes({
        loading: state.nodesLoading,
        nodes: state.nodes,
        devicesLoading: state.devicesLoading,
        devicesError: state.devicesError,
        devicesList: state.devicesList,
        configForm:
          state.configForm ??
          (state.configSnapshot?.config as Record<string, unknown> | null),
        configLoading: state.configLoading,
        configSaving: state.configSaving,
        configDirty: state.configFormDirty,
        configFormMode: state.configFormMode,
        execApprovalsLoading: state.execApprovalsLoading,
        execApprovalsSaving: state.execApprovalsSaving,
        execApprovalsDirty: state.execApprovalsDirty,
        execApprovalsSnapshot: state.execApprovalsSnapshot,
        execApprovalsForm: state.execApprovalsForm,
        execApprovalsSelectedAgent: state.execApprovalsSelectedAgent,
        execApprovalsTarget: state.execApprovalsTarget,
        execApprovalsTargetNodeId: state.execApprovalsTargetNodeId,
        onRefresh: () => loadNodes(state),
        onDevicesRefresh: () => loadDevices(state),
        onDeviceApprove: (requestId) => approveDevicePairing(state, requestId),
        onDeviceReject: (requestId) => rejectDevicePairing(state, requestId),
        onDeviceRotate: (deviceId, role, scopes) =>
          rotateDeviceToken(state, { deviceId, role, scopes }),
        onDeviceRevoke: (deviceId, role) => revokeDeviceToken(state, { deviceId, role }),
        onLoadConfig: () => loadConfig(state),
        onLoadExecApprovals: () => {
          const target =
            state.execApprovalsTarget === "node" && state.execApprovalsTargetNodeId
              ? { kind: "node" as const, nodeId: state.execApprovalsTargetNodeId }
              : { kind: "gateway" as const };
          return loadExecApprovals(state, target);
        },
        onBindDefault: (nodeId) => {
          if (nodeId) {
            updateConfigFormValue(state, ["tools", "exec", "node"], nodeId);
          } else {
            removeConfigFormValue(state, ["tools", "exec", "node"]);
          }
        },
        onBindAgent: (agentIndex, nodeId) => {
          const basePath = ["agents", "list", agentIndex, "tools", "exec", "node"];
          if (nodeId) {
            updateConfigFormValue(state, basePath, nodeId);
          } else {
            removeConfigFormValue(state, basePath);
          }
        },
        onSaveBindings: () => saveConfig(state),
        onExecApprovalsTargetChange: (kind, nodeId) => {
          state.execApprovalsTarget = kind;
          state.execApprovalsTargetNodeId = nodeId;
          state.execApprovalsSnapshot = null;
          state.execApprovalsForm = null;
          state.execApprovalsDirty = false;
          state.execApprovalsSelectedAgent = null;
        },
        onExecApprovalsSelectAgent: (agentId) => {
          state.execApprovalsSelectedAgent = agentId;
        },
        onExecApprovalsPatch: (path, value) =>
          updateExecApprovalsFormValue(state, path, value),
        onExecApprovalsRemove: (path) => removeExecApprovalsFormValue(state, path),
        onSaveExecApprovals: () => {
          const target =
            state.execApprovalsTarget === "node" && state.execApprovalsTargetNodeId
              ? { kind: "node" as const, nodeId: state.execApprovalsTargetNodeId }
              : { kind: "gateway" as const };
          return saveExecApprovals(state, target);
        },
      })
      : nothing
    }

        ${state.tab === "chat"
      ? renderChat({
        sessionKey: state.sessionKey,
        onSessionKeyChange: (next) => {
          state.sessionKey = next;
          state.chatMessage = "";
          state.chatAttachments = [];
          state.chatStream = null;
          state.chatStreamStartedAt = null;
          state.chatRunId = null;
          state.chatQueue = [];
          state.resetToolStream();
          state.resetChatScroll();
          state.applySettings({
            ...state.settings,
            sessionKey: next,
            lastActiveSessionKey: next,
          });
          void state.loadAssistantIdentity();
          void loadChatHistory(state);
          void refreshChatAvatar(state);
        },
        thinkingLevel: state.chatThinkingLevel,
        showThinking,
        loading: state.chatLoading,
        sending: state.chatSending,
        compactionStatus: state.compactionStatus,
        assistantAvatarUrl: chatAvatarUrl,
        messages: state.chatMessages,
        toolMessages: state.chatToolMessages,
        stream: state.chatStream,
        streamStartedAt: state.chatStreamStartedAt,
        draft: state.chatMessage,
        queue: state.chatQueue,
        connected: state.connected,
        canSend: state.connected,
        disabledReason: chatDisabledReason,
        error: state.lastError,
        sessions: state.sessionsResult,
        focusMode: chatFocus,
        onRefresh: () => {
          state.resetToolStream();
          return Promise.all([loadChatHistory(state), refreshChatAvatar(state)]);
        },
        onToggleFocusMode: () => {
          if (state.onboarding) {
            return;
          }
          state.applySettings({
            ...state.settings,
            chatFocusMode: !state.settings.chatFocusMode,
          });
        },
        onChatScroll: (event) => state.handleChatScroll(event),
        onDraftChange: (next) => (state.chatMessage = next),
        attachments: state.chatAttachments,
        onAttachmentsChange: (next) => (state.chatAttachments = next),
        onSend: () => state.handleSendChat(),
        canAbort: Boolean(state.chatRunId),
        onAbort: () => void state.handleAbortChat(),
        onQueueRemove: (id) => state.removeQueuedMessage(id),
        onNewSession: () => state.handleSendChat("/new", { restoreDraft: true }),
        // Sidebar props for tool output viewing
        sidebarOpen: state.sidebarOpen,
        sidebarContent: state.sidebarContent,
        sidebarError: state.sidebarError,
        splitRatio: state.splitRatio,
        onOpenSidebar: (content: string) => state.handleOpenSidebar(content),
        onCloseSidebar: () => state.handleCloseSidebar(),
        onSplitRatioChange: (ratio: number) => state.handleSplitRatioChange(ratio),
        // Agent selector props for quick switching
        agents: state.agentsList?.agents,
        currentAgentId: extractAgentIdFromSessionKey(state.sessionKey),
        isGroupChat: state.sessionKey === "agent:all:group",
        onAgentSelect: (agentId: string) => {
          const newSessionKey = `agent:${agentId}:main`;
          state.switchToAgentSession(newSessionKey);
          syncUrlWithSessionKey(state, newSessionKey, true);
        },
        onGroupChatSelect: () => {
          const groupSessionKey = "agent:all:group";
          state.switchToAgentSession(groupSessionKey);
          syncUrlWithSessionKey(state, groupSessionKey, true);
        },
        assistantName: state.assistantName,
        assistantAvatar: state.assistantAvatar,
        // Mention autocomplete state
        mentionActive: (state as any).mentionActive ?? false,
        mentionQuery: (state as any).mentionQuery ?? "",
        mentionHighlightIndex: (state as any).mentionHighlightIndex ?? 0,
        onMentionStateChange: (active: boolean, query: string, highlightIndex: number) => {
          (state as any).mentionActive = active;
          (state as any).mentionQuery = query;
          (state as any).mentionHighlightIndex = highlightIndex;
        },
      })
      : nothing
    }

        ${state.tab === "config"
      ? renderConfig({
        raw: state.configRaw,
        originalRaw: state.configRawOriginal,
        valid: state.configValid,
        issues: state.configIssues,
        loading: state.configLoading,
        saving: state.configSaving,
        applying: state.configApplying,
        updating: state.updateRunning,
        connected: state.connected,
        schema: state.configSchema,
        schemaLoading: state.configSchemaLoading,
        uiHints: state.configUiHints,
        formMode: state.configFormMode,
        formValue: state.configForm,
        originalValue: state.configFormOriginal,
        searchQuery: state.configSearchQuery,
        activeSection: state.configActiveSection,
        activeSubsection: state.configActiveSubsection,
        onRawChange: (next) => {
          state.configRaw = next;
        },
        onFormModeChange: (mode) => (state.configFormMode = mode),
        onFormPatch: (path, value) => updateConfigFormValue(state, path, value),
        onSearchChange: (query) => (state.configSearchQuery = query),
        onSectionChange: (section) => {
          state.configActiveSection = section;
          state.configActiveSubsection = null;
        },
        onSubsectionChange: (section) => (state.configActiveSubsection = section),
        onReload: () => loadConfig(state),
        onSave: () => saveConfig(state),
        onApply: () => applyConfig(state),
        onUpdate: () => runUpdate(state),
      })
      : nothing
    }

        ${state.tab === "debug"
      ? renderDebug({
        loading: state.debugLoading,
        status: state.debugStatus,
        health: state.debugHealth,
        models: state.debugModels,
        heartbeat: state.debugHeartbeat,
        eventLog: state.eventLog,
        callMethod: state.debugCallMethod,
        callParams: state.debugCallParams,
        callResult: state.debugCallResult,
        callError: state.debugCallError,
        onCallMethodChange: (next) => (state.debugCallMethod = next),
        onCallParamsChange: (next) => (state.debugCallParams = next),
        onRefresh: () => loadDebug(state),
        onCall: () => callDebugMethod(state),
      })
      : nothing
    }

        ${state.tab === "logs"
      ? renderLogs({
        loading: state.logsLoading,
        error: state.logsError,
        file: state.logsFile,
        entries: state.logsEntries,
        filterText: state.logsFilterText,
        levelFilters: state.logsLevelFilters,
        autoFollow: state.logsAutoFollow,
        truncated: state.logsTruncated,
        onFilterTextChange: (next) => (state.logsFilterText = next),
        onLevelToggle: (level, enabled) => {
          state.logsLevelFilters = { ...state.logsLevelFilters, [level]: enabled };
        },
        onToggleAutoFollow: (next) => (state.logsAutoFollow = next),
        onRefresh: () => loadLogs(state, { reset: true }),
        onExport: (lines, label) => state.exportLogs(lines, label),
        onScroll: (event) => state.handleLogsScroll(event),
      })
      : nothing
    }

        ${state.tab === "controltower"
      ? renderControlTower({
        connected: state.connected,
        loading: false,
        error: null,
        stats: null,
        escalations: [],
        deadlines: [],
        onRefresh: () => { },
      })
      : nothing
    }

        ${state.tab === "services"
      ? (() => {
        // Check if we're viewing a specific service detail
        const serviceId = serviceIdFromPath(window.location.pathname, state.basePath);
        if (serviceId) {
          // Find the matching agent for this service
          const agentId = serviceId === "main" ? "main" : `firmos-${serviceId}`;
          const agent = (state.agentsList?.agents ?? []).find((a) => a.id === agentId) || null;
          return renderServiceDetail({
            connected: state.connected,
            serviceId,
            agent,
            loading: state.agentsLoading,
            error: state.agentsError,
            onChatClick: (id) => {
              const newSessionKey = `agent:${id}:main`;
              state.switchToAgentSession(newSessionKey);
              syncUrlWithSessionKey(state, newSessionKey, true);
            },
            onBack: () => {
              // Navigate back to agents list
              const agentsPath = pathForTab("agents", state.basePath);
              window.history.pushState({}, "", agentsPath);
              state.tab = "agents";
            },
            onRefresh: () => state.loadOverview(),
          });
        }
        // Otherwise show the services list
        return renderServices({
          connected: state.connected,
          loading: state.agentsLoading,
          error: state.agentsError,
          services: (state.agentsList?.agents ?? []).map((agent) => ({
            id: agent.id,
            name: agent.identity?.name ?? agent.id,
            role: "FirmOS Agent",
            status: "online" as const,
            lastSeen: null,
            tasksCompleted: 0,
            description: `Agent workspace: ${agent.id}`,
          })),
          onRefresh: () => state.loadOverview(),
        });
      })()
      : nothing
    }

        ${state.tab === "packs"
      ? renderPacks({
        connected: state.connected,
        loading: false,
        error: null,
        packs: [],
        onRefresh: () => { },
      })
      : nothing
    }

        ${state.tab === "releases"
      ? renderReleases({
        connected: state.connected,
        loading: false,
        error: null,
        releases: [],
        onRefresh: () => { },
      })
      : nothing
    }

        ${state.tab === "incidents"
      ? renderIncidents({
        connected: state.connected,
        loading: false,
        error: null,
        incidents: [],
        onRefresh: () => { },
      })
      : nothing
    }

        ${state.tab === "policy"
      ? renderPolicy({
        connected: state.connected,
        loading: false,
        error: null,
        decisions: [],
        policies: [],
        onRefresh: () => { },
      })
      : nothing
    }
      </main>
      ${renderExecApprovalPrompt(state)}
      ${renderGatewayUrlConfirmation(state)}
    </div>
    </device-gate>
  `;
}
