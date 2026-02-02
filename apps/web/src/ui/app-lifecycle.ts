import type { Tab } from "./navigation";
import { connectGateway } from "./app-gateway";
import {
  startLogsPolling,
  startNodesPolling,
  stopLogsPolling,
  stopNodesPolling,
  startDebugPolling,
  stopDebugPolling,
} from "./app-polling";
import { observeTopbar, scheduleChatScroll, scheduleLogsScroll } from "./app-scroll";
import {
  applySettingsFromUrl,
  attachThemeListener,
  detachThemeListener,
  inferBasePath,
  syncTabWithLocation,
  syncThemeWithSettings,
} from "./app-settings";

type LifecycleHost = {
  basePath: string;
  tab: Tab;
  chatHasAutoScrolled: boolean;
  chatLoading: boolean;
  chatMessages: unknown[];
  chatToolMessages: unknown[];
  chatStream: string;
  logsAutoFollow: boolean;
  logsAtBottom: boolean;
  logsEntries: unknown[];
  popStateHandler: () => void;
  topbarObserver: ResizeObserver | null;
};

export function handleConnected(host: LifecycleHost) {
  host.basePath = inferBasePath();
  applySettingsFromUrl(host as unknown as Parameters<typeof applySettingsFromUrl>[0]);
  syncTabWithLocation(host as unknown as Parameters<typeof syncTabWithLocation>[0], true);
  syncThemeWithSettings(host as unknown as Parameters<typeof syncThemeWithSettings>[0]);
  attachThemeListener(host as unknown as Parameters<typeof attachThemeListener>[0]);
  window.addEventListener("popstate", host.popStateHandler);

  // Auto-fetch token for dev mode if not configured
  void autoConnectWithToken(host as unknown as Parameters<typeof connectGateway>[0]);

  startNodesPolling(host as unknown as Parameters<typeof startNodesPolling>[0]);
  if (host.tab === "logs") {
    startLogsPolling(host as unknown as Parameters<typeof startLogsPolling>[0]);
  }
  if (host.tab === "debug") {
    startDebugPolling(host as unknown as Parameters<typeof startDebugPolling>[0]);
  }
}

/**
 * Auto-fetch token from gateway for local dev, then connect.
 * Tries known gateway ports to find a running gateway and fetch its token.
 */
async function autoConnectWithToken(host: Parameters<typeof connectGateway>[0]) {
  const hostTyped = host as unknown as { settings: import("./storage").UiSettings };
  const settings = hostTyped.settings;

  // If token already configured, just connect
  if (settings.token && settings.token.trim()) {
    connectGateway(host);
    return;
  }

  // Try known gateway ports for dev-token (local development only)
  // Standard port: 18789, Dev port: 19001
  const knownGatewayPorts = [18789, 19001];

  for (const port of knownGatewayPorts) {
    try {
      const tokenUrl = `http://127.0.0.1:${port}/__openclaw__/dev-token`;

      const response = await fetch(tokenUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(1000) // 1s timeout per port
      });

      if (response.ok) {
        const data = await response.json() as { token?: string };
        if (data.token && data.token.trim()) {
          // Apply fetched token AND update gateway URL to the correct port
          const { applySettings } = await import("./app-settings");
          const gatewayUrl = `ws://127.0.0.1:${port}`;
          const newSettings: import("./storage").UiSettings = {
            ...settings,
            token: data.token,
            gatewayUrl
          };
          applySettings(
            host as unknown as Parameters<typeof applySettings>[0],
            newSettings
          );
          console.log(`[gateway] auto-connected to gateway on port ${port}`);

          // Connect with the updated settings
          connectGateway(host);
          return;
        }
      }
    } catch {
      // Port not available, try next
    }
  }

  // No dev token found, connect with whatever settings we have (will fail if no token)
  connectGateway(host);
}

export function handleFirstUpdated(host: LifecycleHost) {
  observeTopbar(host as unknown as Parameters<typeof observeTopbar>[0]);
}

export function handleDisconnected(host: LifecycleHost) {
  window.removeEventListener("popstate", host.popStateHandler);
  stopNodesPolling(host as unknown as Parameters<typeof stopNodesPolling>[0]);
  stopLogsPolling(host as unknown as Parameters<typeof stopLogsPolling>[0]);
  stopDebugPolling(host as unknown as Parameters<typeof stopDebugPolling>[0]);
  detachThemeListener(host as unknown as Parameters<typeof detachThemeListener>[0]);
  host.topbarObserver?.disconnect();
  host.topbarObserver = null;
}

export function handleUpdated(host: LifecycleHost, changed: Map<PropertyKey, unknown>) {
  if (
    host.tab === "chat" &&
    (changed.has("chatMessages") ||
      changed.has("chatToolMessages") ||
      changed.has("chatStream") ||
      changed.has("chatLoading") ||
      changed.has("tab"))
  ) {
    const forcedByTab = changed.has("tab");
    const forcedByLoad =
      changed.has("chatLoading") &&
      changed.get("chatLoading") === true &&
      host.chatLoading === false;
    scheduleChatScroll(
      host as unknown as Parameters<typeof scheduleChatScroll>[0],
      forcedByTab || forcedByLoad || !host.chatHasAutoScrolled,
    );
  }
  if (
    host.tab === "logs" &&
    (changed.has("logsEntries") || changed.has("logsAutoFollow") || changed.has("tab"))
  ) {
    if (host.logsAutoFollow && host.logsAtBottom) {
      scheduleLogsScroll(
        host as unknown as Parameters<typeof scheduleLogsScroll>[0],
        changed.has("tab") || changed.has("logsAutoFollow"),
      );
    }
  }
}
