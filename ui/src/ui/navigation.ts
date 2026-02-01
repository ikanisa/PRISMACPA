import type { IconName } from "./icons.js";

export const TAB_GROUPS = [
  { label: "Chat", tabs: ["chat"] },
  {
    label: "Control",
    tabs: ["overview", "executive", "channels", "instances", "sessions", "cron"],
  },
  { label: "Agent", tabs: ["skills", "nodes"] },
  { label: "Compliance", tabs: ["tax", "vat", "evidence", "bank", "audit", "aml"] },
  { label: "Settings", tabs: ["config", "debug", "logs"] },
] as const;


export type Tab =
  | "overview"
  | "executive"
  | "channels"
  | "instances"
  | "sessions"
  | "cron"
  | "skills"
  | "nodes"
  | "chat"
  | "tax"
  | "vat"
  | "evidence"
  | "bank"
  | "audit"
  | "aml"
  | "config"
  | "debug"
  | "logs";

const TAB_PATHS: Record<Tab, string> = {
  overview: "/overview",
  executive: "/executive",
  channels: "/channels",
  instances: "/instances",
  sessions: "/sessions",
  cron: "/cron",
  skills: "/skills",
  nodes: "/nodes",
  chat: "/chat",
  tax: "/tax",
  vat: "/vat",
  evidence: "/evidence",
  bank: "/bank",
  audit: "/audit",
  aml: "/aml",
  config: "/config",
  debug: "/debug",
  logs: "/logs",
};

const PATH_TO_TAB = new Map(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as Tab]));

export function normalizeBasePath(basePath: string): string {
  if (!basePath) return "";
  let base = basePath.trim();
  if (!base.startsWith("/")) base = `/${base}`;
  if (base === "/") return "";
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

export function normalizePath(path: string): string {
  if (!path) return "/";
  let normalized = path.trim();
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function pathForTab(tab: Tab, basePath = ""): string {
  const base = normalizeBasePath(basePath);
  const path = TAB_PATHS[tab];
  return base ? `${base}${path}` : path;
}

export function tabFromPath(pathname: string, basePath = ""): Tab | null {
  const base = normalizeBasePath(basePath);
  let path = pathname || "/";
  if (base) {
    if (path === base) {
      path = "/";
    } else if (path.startsWith(`${base}/`)) {
      path = path.slice(base.length);
    }
  }
  let normalized = normalizePath(path).toLowerCase();
  if (normalized.endsWith("/index.html")) normalized = "/";
  if (normalized === "/") return "chat";
  return PATH_TO_TAB.get(normalized) ?? null;
}

export function inferBasePathFromPathname(pathname: string): string {
  let normalized = normalizePath(pathname);
  if (normalized.endsWith("/index.html")) {
    normalized = normalizePath(normalized.slice(0, -"/index.html".length));
  }
  if (normalized === "/") return "";
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  for (let i = 0; i < segments.length; i++) {
    const candidate = `/${segments.slice(i).join("/")}`.toLowerCase();
    if (PATH_TO_TAB.has(candidate)) {
      const prefix = segments.slice(0, i);
      return prefix.length ? `/${prefix.join("/")}` : "";
    }
  }
  return `/${segments.join("/")}`;
}

export function iconForTab(tab: Tab): IconName {
  switch (tab) {
    case "chat":
      return "messageSquare";
    case "overview":
      return "barChart";
    case "executive":
      return "globe";
    case "channels":
      return "link";
    case "instances":
      return "radio";
    case "sessions":
      return "fileText";
    case "cron":
      return "loader";
    case "skills":
      return "zap";
    case "nodes":
      return "monitor";
    case "tax":
      return "fileText";
    case "vat":
      return "fileText";
    case "evidence":
      return "folder";
    case "bank":
      return "book";
    case "audit":
      return "edit";
    case "aml":
      return "brain";
    case "config":
      return "settings";
    case "debug":
      return "bug";
    case "logs":
      return "scrollText";
    default:
      return "folder";
  }
}

export function titleForTab(tab: Tab) {
  switch (tab) {
    case "overview":
      return "Overview";
    case "executive":
      return "Executive Dashboard";
    case "channels":
      return "Channels";
    case "instances":
      return "Instances";
    case "sessions":
      return "Sessions";
    case "cron":
      return "Cron Jobs";
    case "skills":
      return "Skills";
    case "nodes":
      return "Nodes";
    case "chat":
      return "Chat";
    case "tax":
      return "Tax & Compliance";
    case "vat":
      return "VAT Returns";
    case "evidence":
      return "Evidence Ledger";
    case "bank":
      return "Bank Recon";
    case "audit":
      return "Audit Papers";
    case "aml":
      return "AML Compliance";
    case "config":
      return "Config";
    case "debug":
      return "Debug";
    case "logs":
      return "Logs";
    default:
      return "Control";
  }
}

export function subtitleForTab(tab: Tab) {
  switch (tab) {
    case "overview":
      return "Gateway status, entry points, and a fast health read.";
    case "executive":
      return "Partner & Manager KPIs, risk heatmap, and deadline tracking.";
    case "channels":
      return "Manage channels and settings.";
    case "instances":
      return "Presence beacons from connected clients and nodes.";
    case "sessions":
      return "Inspect active sessions and adjust per-session defaults.";
    case "cron":
      return "Schedule wakeups and recurring agent runs.";
    case "skills":
      return "Manage skill availability and API key injection.";
    case "nodes":
      return "Paired devices, capabilities, and command exposure.";
    case "chat":
      return "Direct gateway chat session for quick interventions.";
    case "tax":
      return "Malta VAT periods, evidence ledger, and approval workflows.";
    case "vat":
      return "Malta VAT period management and CFR filings.";
    case "evidence":
      return "Document intake, OCR extraction, and verification.";
    case "bank":
      return "Bank transaction matching and reconciliation.";
    case "audit":
      return "Working papers, PBC tracking, and pack assembly.";
    case "aml":
      return "CDD monitoring, STR queue, and FIAU compliance.";
    case "config":
      return "Edit ~/.openclaw/openclaw.json safely.";
    case "debug":
      return "Gateway snapshots, events, and manual RPC calls.";
    case "logs":
      return "Live tail of the gateway file logs.";
    default:
      return "";
  }
}
