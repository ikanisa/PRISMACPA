/**
 * Team session management for multi-agent group chat.
 *
 * Team session keys follow the format: team:<teamId>:main
 * Each agent's view is stored at: team:<teamId>:agent:<agentId>
 */

import crypto from "node:crypto";
import type { OpenClawConfig } from "../config/config.js";
import type { TeamConfig, TeamMessage, TeamSession } from "../config/types.team.js";
import { DEFAULT_TEAM_INTER_AGENT, DEFAULT_TEAM_ROUTING } from "../config/types.team.js";

// In-memory store for team sessions (would be persisted in production)
const teamSessions = new Map<string, TeamSession>();

/**
 * Create a team session key from team ID.
 */
export function resolveTeamSessionKey(teamId: string): string {
  return `team:${teamId}:main`;
}

/**
 * Check if a session key is a team session.
 */
export function isTeamSession(sessionKey: string): boolean {
  return sessionKey.startsWith("team:") && sessionKey.endsWith(":main");
}

/**
 * Parse team ID from session key.
 */
export function parseTeamId(sessionKey: string): string | undefined {
  if (!isTeamSession(sessionKey)) {
    return undefined;
  }
  const parts = sessionKey.split(":");
  // format: team:<teamId>:main
  if (parts.length >= 3 && parts[0] === "team" && parts[parts.length - 1] === "main") {
    return parts.slice(1, -1).join(":");
  }
  return undefined;
}

/**
 * Get team configuration by ID.
 */
export function getTeamConfig(cfg: OpenClawConfig, teamId: string): TeamConfig | undefined {
  return cfg.agents?.teams?.find((t) => t.id === teamId);
}

/**
 * Get list of agent IDs that are members of a team.
 */
export function getTeamMembers(cfg: OpenClawConfig, teamId: string): string[] {
  const team = getTeamConfig(cfg, teamId);
  return team?.members ?? [];
}

/**
 * Get or create a team session.
 */
export function getOrCreateTeamSession(teamId: string): TeamSession {
  const sessionKey = resolveTeamSessionKey(teamId);
  let session = teamSessions.get(sessionKey);

  if (!session) {
    const now = Date.now();
    session = {
      teamId,
      sessionKey,
      messages: [],
      respondedAgents: [],
      observingAgents: [],
      updatedAt: now,
      createdAt: now,
    };
    teamSessions.set(sessionKey, session);
  }

  return session;
}

/**
 * Add a message to the team session.
 */
export function addTeamMessage(params: {
  teamId: string;
  from: string;
  to: string;
  content: string;
  silent?: boolean;
}): TeamMessage {
  const { teamId, from, to, content, silent } = params;
  const session = getOrCreateTeamSession(teamId);

  const message: TeamMessage = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    from,
    to,
    content,
    silent,
  };

  session.messages.push(message);
  session.updatedAt = Date.now();

  // Track which agents have responded
  if (from !== "user" && !silent) {
    if (!session.respondedAgents.includes(from)) {
      session.respondedAgents.push(from);
    }
  }

  // Track observing agents
  if (from !== "user" && silent) {
    if (!session.observingAgents.includes(from)) {
      session.observingAgents.push(from);
    }
  }

  return message;
}

/**
 * Get recent messages for team context.
 */
export function getTeamContext(teamId: string, limit?: number): TeamMessage[] {
  const session = teamSessions.get(resolveTeamSessionKey(teamId));
  if (!session) {
    return [];
  }
  const contextLimit = limit ?? DEFAULT_TEAM_INTER_AGENT.contextLimit;
  return session.messages.slice(-contextLimit);
}

/**
 * Check if an agent has already responded to the current user message.
 */
export function hasAgentResponded(teamId: string, agentId: string): boolean {
  const session = teamSessions.get(resolveTeamSessionKey(teamId));
  return session?.respondedAgents.includes(agentId) ?? false;
}

/**
 * Reset response tracking for a new user message.
 */
export function resetResponseTracking(teamId: string): void {
  const session = teamSessions.get(resolveTeamSessionKey(teamId));
  if (session) {
    session.respondedAgents = [];
    session.observingAgents = [];
  }
}

/**
 * Get the silent token for a team.
 */
export function getTeamSilentToken(cfg: OpenClawConfig, teamId: string): string {
  const team = getTeamConfig(cfg, teamId);
  return team?.routing?.silentToken ?? DEFAULT_TEAM_ROUTING.silentToken;
}

/**
 * Check if a response is a silent observation.
 */
export function isSilentResponse(cfg: OpenClawConfig, teamId: string, response: string): boolean {
  const silentToken = getTeamSilentToken(cfg, teamId);
  return response.trim() === silentToken;
}

/**
 * Get the routing mode for a team.
 */
export function getTeamRoutingMode(
  cfg: OpenClawConfig,
  teamId: string,
): "broadcast" | "coordinator" {
  const team = getTeamConfig(cfg, teamId);
  return team?.routing?.mode ?? DEFAULT_TEAM_ROUTING.mode;
}

/**
 * Get the coordinator agent for a team (if mode is coordinator).
 */
export function getTeamCoordinator(cfg: OpenClawConfig, teamId: string): string | undefined {
  const team = getTeamConfig(cfg, teamId);
  if (team?.routing?.mode === "coordinator") {
    return team.routing.coordinatorId;
  }
  return undefined;
}

/**
 * List all active team sessions.
 */
export function listTeamSessions(): TeamSession[] {
  return Array.from(teamSessions.values());
}

/**
 * Clear a team session (for testing or reset).
 */
export function clearTeamSession(teamId: string): void {
  const sessionKey = resolveTeamSessionKey(teamId);
  teamSessions.delete(sessionKey);
}

/**
 * Clear all team sessions (for testing).
 */
export function clearAllTeamSessions(): void {
  teamSessions.clear();
}
