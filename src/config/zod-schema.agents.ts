import { z } from "zod";
import { AgentDefaultsSchema } from "./zod-schema.agent-defaults.js";
import { AgentEntrySchema } from "./zod-schema.agent-runtime.js";
import { TranscribeAudioSchema } from "./zod-schema.core.js";

/**
 * Schema for team routing configuration.
 */
export const TeamRoutingSchema = z
  .object({
    mode: z.enum(["broadcast", "coordinator"]).optional(),
    coordinatorId: z.string().optional(),
    silentToken: z.string().optional(),
  })
  .strict()
  .optional();

/**
 * Schema for inter-agent communication settings.
 */
export const TeamInterAgentSchema = z
  .object({
    directMessages: z.boolean().optional(),
    sharedContext: z.boolean().optional(),
    contextLimit: z.number().int().positive().optional(),
  })
  .strict()
  .optional();

/**
 * Schema for team identity.
 */
export const TeamIdentitySchema = z
  .object({
    emoji: z.string().optional(),
    theme: z.string().optional(),
    avatar: z.string().optional(),
  })
  .strict()
  .optional();

/**
 * Schema for a single team configuration.
 */
export const TeamConfigSchema = z
  .object({
    id: z.string().min(1, "Team ID is required"),
    name: z.string().min(1, "Team name is required"),
    members: z.array(z.string()).min(1, "Team must have at least one member"),
    routing: TeamRoutingSchema,
    interAgent: TeamInterAgentSchema,
    identity: TeamIdentitySchema,
  })
  .strict();

/**
 * Schema for array of teams.
 */
export const TeamsSchema = z.array(TeamConfigSchema).optional();

export const AgentsSchema = z
  .object({
    defaults: z.lazy(() => AgentDefaultsSchema).optional(),
    list: z.array(AgentEntrySchema).optional(),
    teams: TeamsSchema,
  })
  .strict()
  .optional();

export const BindingsSchema = z
  .array(
    z
      .object({
        agentId: z.string(),
        match: z
          .object({
            channel: z.string(),
            accountId: z.string().optional(),
            peer: z
              .object({
                kind: z.union([z.literal("dm"), z.literal("group"), z.literal("channel")]),
                id: z.string(),
              })
              .strict()
              .optional(),
            guildId: z.string().optional(),
            teamId: z.string().optional(),
          })
          .strict(),
      })
      .strict(),
  )
  .optional();

export const BroadcastStrategySchema = z.enum(["parallel", "sequential"]);

export const BroadcastSchema = z
  .object({
    strategy: BroadcastStrategySchema.optional(),
  })
  .catchall(z.array(z.string()))
  .optional();

export const AudioSchema = z
  .object({
    transcription: TranscribeAudioSchema,
  })
  .strict()
  .optional();
