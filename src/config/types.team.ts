/**
 * Team configuration for multi-agent group chat.
 *
 * Teams allow multiple agents to collaborate in a shared conversation:
 * - All team members see all messages
 * - Each agent decides if they need to respond based on relevance
 * - Agents can communicate with each other via @mentions
 * - Open communication policy (no secrets between team members)
 */

import type { DeliveryContext } from "../utils/delivery-context.js";

/**
 * How messages are routed within the team.
 */
export type TeamRoutingMode =
  /** All agents see all messages and decide relevance. */
  | "broadcast"
  /** A coordinator agent routes messages to relevant members. */
  | "coordinator";

/**
 * Configuration for a team of agents.
 */
export type TeamConfig = {
  /** Unique team identifier (used in session keys: team:<id>:main). */
  id: string;

  /** Human-readable team name. */
  name: string;

  /** Agent IDs that are members of this team. */
  members: string[];

  /** Message routing configuration. */
  routing?: {
    /**
     * How to route user messages:
     * - "broadcast" (default): All agents see message, each decides if relevant
     * - "coordinator": Coordinator agent routes to appropriate member
     */
    mode?: TeamRoutingMode;

    /**
     * Agent ID of coordinator (required if mode="coordinator").
     */
    coordinatorId?: string;

    /**
     * How agents indicate they're observing but not responding.
     * Default: "[SILENT]"
     */
    silentToken?: string;
  };

  /** Inter-agent communication settings. */
  interAgent?: {
    /**
     * Allow agents to directly message each other via @mentions.
     * Default: true
     */
    directMessages?: boolean;

    /**
     * Share conversation context across all team members.
     * Default: true
     */
    sharedContext?: boolean;

    /**
     * Maximum recent messages to include in team context.
     * Default: 50
     */
    contextLimit?: number;
  };

  /** Team identity for display purposes. */
  identity?: {
    /** Emoji for the team. */
    emoji?: string;

    /** Theme color. */
    theme?: string;

    /** Avatar image path or URL. */
    avatar?: string;
  };
};

/**
 * Message within a team conversation.
 */
export type TeamMessage = {
  /** Unique message ID. */
  id: string;

  /** Timestamp when sent. */
  timestamp: number;

  /** Source of message: "user" or agent ID. */
  from: "user" | string;

  /** Target: "all" (broadcast), or specific agent ID for @mention. */
  to: "all" | string;

  /** Message content. */
  content: string;

  /** Whether this was a silent observation (no response). */
  silent?: boolean;

  /** Original delivery context (for external channels). */
  origin?: DeliveryContext;
};

/**
 * State of a team session.
 */
export type TeamSession = {
  /** Team ID. */
  teamId: string;

  /** Session key: team:<teamId>:main. */
  sessionKey: string;

  /** Ordered message history. */
  messages: TeamMessage[];

  /** Which agents have responded to the current user message. */
  respondedAgents: string[];

  /** Which agents are currently observing (silent). */
  observingAgents: string[];

  /** Last updated timestamp. */
  updatedAt: number;

  /** Created timestamp. */
  createdAt: number;
};

/**
 * Default routing configuration.
 */
export const DEFAULT_TEAM_ROUTING: Required<NonNullable<TeamConfig["routing"]>> = {
  mode: "broadcast",
  coordinatorId: undefined as unknown as string, // Only used if mode="coordinator"
  silentToken: "[SILENT]",
};

/**
 * Default inter-agent configuration.
 */
export const DEFAULT_TEAM_INTER_AGENT: Required<NonNullable<TeamConfig["interAgent"]>> = {
  directMessages: true,
  sharedContext: true,
  contextLimit: 50,
};
