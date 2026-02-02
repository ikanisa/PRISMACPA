/**
 * FirmOS Service Catalog Schema
 * 
 * Comprehensive Zod schemas for the Big Four-level service catalog.
 * Defines services with phases, task graphs, outputs, evidence, autonomy, and escalation.
 */

import { z } from 'zod';

// =============================================================================
// AUTONOMY TIERS
// =============================================================================

/** Autonomy tier descriptions */
export const AutonomyTierDescription = {
    AUTO: 'Agent completes without operator',
    AUTO_CHECK: 'Agent completes; Guardian must PASS before release/external use',
    ESCALATE: 'Requires operator attention (exception/high-risk/irreversible)'
} as const;

export const AutonomyTier = z.enum(['AUTO', 'AUTO_CHECK', 'ESCALATE']);
export type AutonomyTier = z.infer<typeof AutonomyTier>;

// =============================================================================
// GLOBAL QUALITY RULES
// =============================================================================

/** Rules required for all services */
export const GlobalQualityRules = z.object({
    requiredForAllServices: z.array(z.string()),
    guardianPassConditions: z.array(z.string()),
    universalEscalationTriggers: z.array(z.string())
});
export type GlobalQualityRules = z.infer<typeof GlobalQualityRules>;

export const DEFAULT_QUALITY_RULES: GlobalQualityRules = {
    requiredForAllServices: [
        'All deliverables must be versioned (draft -> final) and evidence-linked',
        'All key facts must have a source (client instruction, evidence file, registry extract, ledger)',
        'No cross-country logic leakage (MT pack cannot be used for RW workflows and vice versa)',
        'Contradictions (names/dates/amounts/IDs) must be resolved or escalated'
    ],
    guardianPassConditions: [
        'Required outputs present',
        'Required evidence present',
        'Consistency checks pass',
        'Country pack matches engagement jurisdiction'
    ],
    universalEscalationTriggers: [
        'Dispute / litigation / threat language',
        'Regulatory breach allegation or enforcement risk',
        'Identity uncertainty (party names/IDs mismatch)',
        'Novel terms outside clause policy (novelty score high)',
        'Irreversible external action blocked by policy'
    ]
};

// =============================================================================
// SERVICE PHASES
// =============================================================================

/** A phase in a service's standard process */
export const ServicePhase = z.object({
    id: z.string(),
    name: z.string()
});
export type ServicePhase = z.infer<typeof ServicePhase>;

// =============================================================================
// TASK NODES
// =============================================================================

/** A task in the service's task graph */
export const TaskNode = z.object({
    key: z.string(),
    autonomy: AutonomyTier,
    outputs: z.array(z.string()),
    evidence: z.array(z.string())
});
export type TaskNode = z.infer<typeof TaskNode>;

// =============================================================================
// EXTERNAL ACTIONS
// =============================================================================

/** An external action with release controls */
export const ExternalAction = z.object({
    action: z.string(),
    requires: z.array(z.string()),
    defaultAutonomy: AutonomyTier
});
export type ExternalAction = z.infer<typeof ExternalAction>;

// =============================================================================
// SERVICE DEFINITION
// =============================================================================

/** Scope of a service */
export const ServiceScope = z.enum(['global', 'malta', 'rwanda']);
export type ServiceScope = z.infer<typeof ServiceScope>;

/** Complete service definition */
export const ServiceDefinition = z.object({
    id: z.string(),
    name: z.string(),
    scope: ServiceScope,
    strictPack: z.string().optional(),
    includesMandatory: z.array(z.string()).optional(),
    standardProcess: z.object({
        phases: z.array(ServicePhase)
    }),
    taskGraph: z.array(TaskNode),
    escalationTriggers: z.array(z.string()),
    externalActions: z.array(ExternalAction)
});
export type ServiceDefinition = z.infer<typeof ServiceDefinition>;

// =============================================================================
// SERVICE CATALOG
// =============================================================================

/** Complete service catalog */
export const ServiceCatalog = z.object({
    version: z.string(),
    name: z.string(),
    mode: z.string(),
    goal: z.string(),
    autonomyTiers: z.record(z.string(), z.string()),
    globalQualityRules: GlobalQualityRules,
    services: z.array(ServiceDefinition),
    integrationNotes: z.object({
        routingRules: z.array(z.string()),
        releaseControls: z.array(z.string())
    })
});
export type ServiceCatalog = z.infer<typeof ServiceCatalog>;

// =============================================================================
// PACK IDS (Country-specific)
// =============================================================================

export const PackId = z.enum([
    'MT_TAX',
    'MT_CSP_MBR',
    'RW_TAX',
    'RW_PRIVATE_NOTARY'
]);
export type PackId = z.infer<typeof PackId>;

/** Pack to jurisdiction mapping */
export const PACK_JURISDICTION: Record<PackId, 'MT' | 'RW'> = {
    MT_TAX: 'MT',
    MT_CSP_MBR: 'MT',
    RW_TAX: 'RW',
    RW_PRIVATE_NOTARY: 'RW'
};
