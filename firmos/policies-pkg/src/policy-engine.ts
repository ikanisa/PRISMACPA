/**
 * FirmOS Policy Engine
 * 
 * Marco's autonomy decision engine.
 * Determines tier (A/B/C) for each action based on rules.
 */

import { z } from 'zod';

// =============================================================================
// DECISION INPUT SCHEMA
// =============================================================================

export const AutonomyDecisionInput = z.object({
    jurisdiction: z.enum(['MT', 'RW']),
    service: z.enum(['AUDIT', 'TAX', 'ACCOUNTING', 'ADVISORY', 'RISK', 'CSP', 'PRIVATE_NOTARY']),
    workflowType: z.string(),
    documentType: z.string().optional(),
    externalImpact: z.boolean(), // Does this go outside the firm?
    noveltyScore: z.number().min(0).max(100), // 0 = routine, 100 = never seen
    disputeOrRegulatorySignal: z.boolean(),
    evidenceCompletenessScore: z.number().min(0).max(100), // % complete
    isFirstTimeExecution: z.boolean(),
    hasApprovedTemplate: z.boolean()
});

export type AutonomyDecisionInput = z.infer<typeof AutonomyDecisionInput>;

// =============================================================================
// DECISION OUTPUT
// =============================================================================

export type AutonomyTier = 'A' | 'B' | 'C';

export interface AutonomyDecision {
    tier: AutonomyTier;
    reasoning: string;
    rules_applied: string[];
    requires_human: boolean;
}

// =============================================================================
// RULES
// =============================================================================

interface PolicyRule {
    id: string;
    description: string;
    condition: (input: AutonomyDecisionInput) => boolean;
    result: AutonomyTier;
    priority: number; // Lower = higher priority
}

const POLICY_RULES: PolicyRule[] = [
    // TIER C - Escalate (highest priority blockers)
    {
        id: 'C_EXTERNAL',
        description: 'External impact requires escalation',
        condition: (input) => input.externalImpact,
        result: 'C',
        priority: 1
    },
    {
        id: 'C_DISPUTE',
        description: 'Dispute or regulatory signals require escalation',
        condition: (input) => input.disputeOrRegulatorySignal,
        result: 'C',
        priority: 2
    },
    {
        id: 'C_HIGH_NOVELTY',
        description: 'High novelty actions require escalation',
        condition: (input) => input.noveltyScore > 70,
        result: 'C',
        priority: 3
    },
    {
        id: 'C_FIRST_TIME',
        description: 'First-time workflow execution requires escalation',
        condition: (input) => input.isFirstTimeExecution,
        result: 'C',
        priority: 4
    },
    {
        id: 'C_INCOMPLETE_EVIDENCE',
        description: 'Low evidence completeness requires escalation',
        condition: (input) => input.evidenceCompletenessScore < 50,
        result: 'C',
        priority: 5
    },

    // TIER A - Full auto (checked before B rules since conditions are stricter)
    {
        id: 'A_ROUTINE',
        description: 'Routine internal operations',
        condition: (input) =>
            !input.externalImpact &&
            !input.disputeOrRegulatorySignal &&
            input.noveltyScore <= 30 &&
            input.evidenceCompletenessScore >= 70 &&
            input.hasApprovedTemplate,
        result: 'A',
        priority: 9
    },

    // TIER B - Auto with check
    {
        id: 'B_TEMPLATE_WITH_REVIEW',
        description: 'Approved template with medium novelty',
        condition: (input) =>
            input.hasApprovedTemplate &&
            input.noveltyScore <= 70 &&
            input.noveltyScore > 30,
        result: 'B',
        priority: 10
    },
    {
        id: 'B_STANDARD_WORKFLOW',
        description: 'Standard workflow with adequate evidence',
        condition: (input) =>
            !input.externalImpact &&
            !input.disputeOrRegulatorySignal &&
            input.evidenceCompletenessScore >= 50 &&
            input.noveltyScore <= 50,
        result: 'B',
        priority: 11
    }
];

// =============================================================================
// POLICY ENGINE
// =============================================================================

/**
 * Evaluate autonomy tier for an action
 * Returns the decision with reasoning
 */
export function evaluateAutonomy(input: AutonomyDecisionInput): AutonomyDecision {
    // Validate input
    const validatedInput = AutonomyDecisionInput.parse(input);

    // Find matching rules, sorted by priority (non-mutating)
    const matchingRules = POLICY_RULES
        .filter(rule => rule.condition(validatedInput))
        .toSorted((a, b) => a.priority - b.priority);

    // If no rules match, default to escalate
    if (matchingRules.length === 0) {
        return {
            tier: 'C',
            reasoning: 'No matching policy rules — defaulting to escalation',
            rules_applied: ['DEFAULT_ESCALATE'],
            requires_human: true
        };
    }

    // Apply highest priority (lowest number) matching rule
    const applied = matchingRules[0];

    return {
        tier: applied.result,
        reasoning: applied.description,
        rules_applied: matchingRules.map(r => r.id),
        requires_human: applied.result === 'C'
    };
}

/**
 * Quick check if action is fully autonomous
 */
export function isFullyAutonomous(input: AutonomyDecisionInput): boolean {
    return evaluateAutonomy(input).tier === 'A';
}

/**
 * Quick check if action requires human
 */
export function requiresHuman(input: AutonomyDecisionInput): boolean {
    return evaluateAutonomy(input).tier === 'C';
}
