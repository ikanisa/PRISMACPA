/**
 * Team router for multi-agent group chat.
 *
 * Handles:
 * - Building team-aware system prompts
 * - Detecting agent @mentions
 * - Routing messages to appropriate agents
 */

import type { OpenClawConfig } from "../config/config.js";
import type { AgentConfig } from "../config/types.agents.js";
import type { TeamConfig, TeamMessage } from "../config/types.team.js";
import {
  getTeamConfig,
  getTeamContext,
  getTeamMembers,
  getTeamSilentToken,
  hasAgentResponded,
} from "./team-session.js";

/**
 * Context for a team message being processed.
 */
export type TeamMessageContext = {
  teamId: string;
  teamName: string;
  fromUser: boolean;
  fromAgentId?: string;
  messageText: string;
  recentHistory: TeamMessage[];
  respondedAgents: string[];
  mentionedAgentId?: string;
};

/**
 * Build a team-aware system prompt addition for an agent.
 */
export function buildTeamSystemPrompt(params: {
  cfg: OpenClawConfig;
  agentId: string;
  teamId: string;
}): string {
  const { cfg, agentId, teamId } = params;
  const team = getTeamConfig(cfg, teamId);
  if (!team) {
    return "";
  }

  const members = getTeamMembers(cfg, teamId);
  const silentToken = getTeamSilentToken(cfg, teamId);

  // Get agent details for team members
  const memberDescriptions = members
    .filter((id) => id !== agentId)
    .map((id) => {
      const agent = cfg.agents?.list?.find((a) => a.id === id);
      const name = agent?.identity?.name ?? id;
      const role = agent?.name ?? "Agent";
      return `- @${id} (${name}): ${role}`;
    })
    .join("\n");

  const currentAgent = cfg.agents?.list?.find((a) => a.id === agentId);
  const currentName = currentAgent?.identity?.name ?? agentId;

  return `
## Team Context

You are **${currentName}** (@${agentId}), a member of team "${team.name}".

### Team Members
${memberDescriptions}

### Response Guidelines

1. **Only respond if your expertise is relevant** to the message
2. If another team member is better suited, **stay silent**
3. To address a teammate, use @mention: \`@agentId message\`
4. If observing but not responding, reply with exactly: \`${silentToken}\`
5. Check if another agent has already responded before you do
6. Be a good collaborator: complement your teammates, don't duplicate

### Open Communication Policy
- All team members see all messages (no secrets)
- Coordinate on complex tasks by @mentioning teammates
- Share relevant context that might help others

### Current Conversation
Review recent messages to understand context before responding.
`.trim();
}

/**
 * Parse @agentId mentions from message text.
 */
export function parseAgentMention(
  text: string,
  validAgentIds: string[],
): { targetAgentId: string; message: string } | null {
  // Match @agentId at start of message
  const mentionMatch = text.match(/^@([a-zA-Z0-9_-]+)\s+([\s\S]*)$/);
  if (!mentionMatch) {
    return null;
  }

  const [, agentId, message] = mentionMatch;
  if (!agentId || !validAgentIds.includes(agentId)) {
    return null;
  }

  return {
    targetAgentId: agentId,
    message: message.trim(),
  };
}

/**
 * Check if a message is directly addressed to a specific agent.
 */
export function isMessageForAgent(text: string, agentId: string, validAgentIds: string[]): boolean {
  const mention = parseAgentMention(text, validAgentIds);
  if (!mention) {
    // No specific mention = broadcast to all (in broadcast mode)
    return true;
  }
  return mention.targetAgentId === agentId;
}

/**
 * Build context for a team message.
 */
export function buildTeamMessageContext(params: {
  cfg: OpenClawConfig;
  teamId: string;
  messageText: string;
  fromAgentId?: string;
}): TeamMessageContext | null {
  const { cfg, teamId, messageText, fromAgentId } = params;
  const team = getTeamConfig(cfg, teamId);
  if (!team) {
    return null;
  }

  const members = getTeamMembers(cfg, teamId);
  const mention = parseAgentMention(messageText, members);
  const recentHistory = getTeamContext(teamId);
  const respondedAgents = recentHistory
    .filter((m) => m.from !== "user" && !m.silent)
    .map((m) => m.from);

  return {
    teamId,
    teamName: team.name,
    fromUser: !fromAgentId,
    fromAgentId,
    messageText,
    recentHistory,
    respondedAgents,
    mentionedAgentId: mention?.targetAgentId,
  };
}

/**
 * Determine which agents should process a message.
 */
export function resolveTargetAgents(params: {
  cfg: OpenClawConfig;
  teamId: string;
  messageText: string;
  senderAgentId?: string;
}): string[] {
  const { cfg, teamId, messageText, senderAgentId } = params;
  const team = getTeamConfig(cfg, teamId);
  if (!team) {
    return [];
  }

  const members = getTeamMembers(cfg, teamId);
  const mention = parseAgentMention(messageText, members);

  // If message mentions a specific agent, only that agent processes it
  if (mention) {
    return [mention.targetAgentId];
  }

  // In coordinator mode, only the coordinator receives user messages
  if (team.routing?.mode === "coordinator" && !senderAgentId) {
    const coordinatorId = team.routing.coordinatorId;
    if (coordinatorId && members.includes(coordinatorId)) {
      return [coordinatorId];
    }
  }

  // In broadcast mode, all agents (except sender) receive the message
  return members.filter((id) => id !== senderAgentId);
}

/**
 * Format team conversation history for injection into context.
 */
export function formatTeamHistory(messages: TeamMessage[], limit = 20): string {
  const recent = messages.slice(-limit);
  if (recent.length === 0) {
    return "No recent messages.";
  }

  return recent
    .filter((m) => !m.silent)
    .map((m) => {
      const sender = m.from === "user" ? "User" : `@${m.from}`;
      const target = m.to === "all" ? "" : ` → @${m.to}`;
      return `[${sender}${target}]: ${m.content}`;
    })
    .join("\n");
}

/**
 * Check if an agent should respond based on relevance heuristics.
 */
export function shouldAgentRespond(params: {
  cfg: OpenClawConfig;
  teamId: string;
  agentId: string;
  messageText: string;
}): { shouldRespond: boolean; reason: string } {
  const { cfg, teamId, agentId, messageText } = params;
  const members = getTeamMembers(cfg, teamId);

  // Direct mention = must respond
  const mention = parseAgentMention(messageText, members);
  if (mention?.targetAgentId === agentId) {
    return { shouldRespond: true, reason: "directly-mentioned" };
  }

  // Mentioned someone else = don't respond
  if (mention && mention.targetAgentId !== agentId) {
    return { shouldRespond: false, reason: "mentioned-other-agent" };
  }

  // Already responded to this user message
  if (hasAgentResponded(teamId, agentId)) {
    return { shouldRespond: false, reason: "already-responded" };
  }

  // In broadcast mode, agent decides based on relevance (via LLM)
  return { shouldRespond: true, reason: "broadcast-mode-decide" };
}
