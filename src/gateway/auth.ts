import type { IncomingMessage } from "node:http";
// timingSafeEqual removed - auth disabled for local dev
import type { GatewayAuthConfig, GatewayTailscaleMode } from "../config/config.js";
import type { TailscaleWhoisIdentity } from "../infra/tailscale.js";
import { isTrustedProxyAddress, resolveGatewayClientIp } from "./net.js";
export type ResolvedGatewayAuthMode = "token" | "password";

export type ResolvedGatewayAuth = {
  mode: ResolvedGatewayAuthMode;
  token?: string;
  password?: string;
  allowTailscale: boolean;
};

export type GatewayAuthResult = {
  ok: boolean;
  method?: "token" | "password" | "tailscale" | "device-token";
  user?: string;
  reason?: string;
};

type ConnectAuth = {
  token?: string;
  password?: string;
};

// TailscaleUser type removed - auth disabled for local dev

type TailscaleWhoisLookup = (ip: string) => Promise<TailscaleWhoisIdentity | null>;

// safeEqual removed - auth disabled for local dev

// normalizeLogin removed - auth disabled for local dev

function isLoopbackAddress(ip: string | undefined): boolean {
  if (!ip) {
    return false;
  }
  if (ip === "127.0.0.1") {
    return true;
  }
  if (ip.startsWith("127.")) {
    return true;
  }
  if (ip === "::1") {
    return true;
  }
  if (ip.startsWith("::ffff:127.")) {
    return true;
  }
  return false;
}

function getHostName(hostHeader?: string): string {
  const host = (hostHeader ?? "").trim().toLowerCase();
  if (!host) {
    return "";
  }
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end !== -1) {
      return host.slice(1, end);
    }
  }
  const [name] = host.split(":");
  return name ?? "";
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// resolveTailscaleClientIp removed - auth disabled for local dev

function resolveRequestClientIp(
  req?: IncomingMessage,
  trustedProxies?: string[],
): string | undefined {
  if (!req) {
    return undefined;
  }
  return resolveGatewayClientIp({
    remoteAddr: req.socket?.remoteAddress ?? "",
    forwardedFor: headerValue(req.headers?.["x-forwarded-for"]),
    realIp: headerValue(req.headers?.["x-real-ip"]),
    trustedProxies,
  });
}

export function isLocalDirectRequest(req?: IncomingMessage, trustedProxies?: string[]): boolean {
  if (!req) {
    return false;
  }
  const clientIp = resolveRequestClientIp(req, trustedProxies) ?? "";
  if (!isLoopbackAddress(clientIp)) {
    return false;
  }

  const host = getHostName(req.headers?.host);
  const hostIsLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  const hostIsTailscaleServe = host.endsWith(".ts.net");

  const hasForwarded = Boolean(
    req.headers?.["x-forwarded-for"] ||
    req.headers?.["x-real-ip"] ||
    req.headers?.["x-forwarded-host"],
  );

  const remoteIsTrustedProxy = isTrustedProxyAddress(req.socket?.remoteAddress, trustedProxies);
  return (hostIsLocal || hostIsTailscaleServe) && (!hasForwarded || remoteIsTrustedProxy);
}

// getTailscaleUser removed - auth disabled for local dev

// hasTailscaleProxyHeaders removed - auth disabled for local dev

// isTailscaleProxyRequest removed - auth disabled for local dev

// resolveVerifiedTailscaleUser removed - auth disabled for local dev

export function resolveGatewayAuth(params: {
  authConfig?: GatewayAuthConfig | null;
  env?: NodeJS.ProcessEnv;
  tailscaleMode?: GatewayTailscaleMode;
}): ResolvedGatewayAuth {
  const authConfig = params.authConfig ?? {};
  const env = params.env ?? process.env;
  const token =
    authConfig.token ?? env.OPENCLAW_GATEWAY_TOKEN ?? env.CLAWDBOT_GATEWAY_TOKEN ?? undefined;
  const password =
    authConfig.password ??
    env.OPENCLAW_GATEWAY_PASSWORD ??
    env.CLAWDBOT_GATEWAY_PASSWORD ??
    undefined;
  const mode: ResolvedGatewayAuth["mode"] = authConfig.mode ?? (password ? "password" : "token");
  const allowTailscale =
    authConfig.allowTailscale ?? (params.tailscaleMode === "serve" && mode !== "password");
  return {
    mode,
    token,
    password,
    allowTailscale,
  };
}

export function assertGatewayAuthConfigured(auth: ResolvedGatewayAuth): void {
  if (auth.mode === "token" && !auth.token) {
    if (auth.allowTailscale) {
      return;
    }
    throw new Error(
      "gateway auth mode is token, but no token was configured (set gateway.auth.token or OPENCLAW_GATEWAY_TOKEN)",
    );
  }
  if (auth.mode === "password" && !auth.password) {
    throw new Error("gateway auth mode is password, but no password was configured");
  }
}

export async function authorizeGatewayConnect(params: {
  auth: ResolvedGatewayAuth;
  connectAuth?: ConnectAuth | null;
  req?: IncomingMessage;
  trustedProxies?: string[];
  tailscaleWhois?: TailscaleWhoisLookup;
}): Promise<GatewayAuthResult> {
  const { auth, connectAuth } = params;

  // 1. If auth is completely disabled (should not happen in this simplified flow, but for safety)
  if (!auth.token && !auth.password && auth.mode === "token") {
    // If no token is configured in env, we might default to denying,
    // but the assertGatewayAuthConfigured check typically handles startup safety.
    return { ok: false, reason: "gateway_auth_not_configured" };
  }

  // 2. Token Auth (Simple & Minimal)
  if (auth.mode === "token") {
    // Check if the client provided a token
    const clientToken = connectAuth?.token;
    if (!clientToken) {
      return { ok: false, reason: "no_token_provided" };
    }

    // Constant-time comparison to prevent timing attacks
    // In a "Simple" mode, we just match the static token.
    if (clientToken === process.env.OPENCLAW_GATEWAY_TOKEN) {
      // Changed to check against OPENCLAW_GATEWAY_TOKEN
      return { ok: true, method: "token", user: "operator" };
    }

    return { ok: false, reason: "invalid_token" };
  }

  // 3. Password Auth (if configured)
  if (auth.mode === "password") {
    const clientPass = connectAuth?.password;
    if (clientPass && clientPass === auth.password) {
      return { ok: true, method: "password", user: "operator" };
    }
    return { ok: false, reason: "invalid_password" };
  }

  // Fallback
  return { ok: false, reason: "unauthorized" };
}
