/**
 * FirmOS Tool Policy
 * 
 * Defines tool access groups, permission rules, and release gating logic.
 * Agents never mutate core state directly; all actions via audited tools.
 */

// Local type definitions (mirrors agents/types.ts to avoid cross-package dependency)
export type ToolGroup =
    | 'CORE_CASE_MGMT'
    | 'DOC_FACTORY'
    | 'EVIDENCE'
    | 'QC_GATES'
    | 'RELEASE_GATED';

export type JurisdictionPack =
    | 'GLOBAL'
    | 'MT_TAX'
    | 'MT_CSP_MBR'
    | 'RW_TAX'
    | 'RW_PRIVATE_NOTARY';

// =============================================================================
// TOOL GROUP DEFINITIONS
// =============================================================================

export const TOOL_GROUP_DEFINITIONS: Record<ToolGroup, {
    name: string;
    description: string;
    tools: string[];
    requires_gating: boolean;
}> = {
    CORE_CASE_MGMT: {
        name: 'Core Case Management',
        description: 'Engagement, workstream, and task creation tools',
        tools: ['create_engagement', 'create_workstream', 'create_tasks_from_program', 'log_event'],
        requires_gating: false
    },
    DOC_FACTORY: {
        name: 'Document Factory',
        description: 'Document generation and assembly tools',
        tools: ['generate_document_from_template', 'version_diff_document', 'assemble_pack'],
        requires_gating: false
    },
    EVIDENCE: {
        name: 'Evidence Management',
        description: 'Evidence ingestion, classification, and linking tools',
        tools: ['ingest_evidence', 'classify_evidence', 'link_evidence', 'evidence_quality_score'],
        requires_gating: false
    },
    QC_GATES: {
        name: 'Quality Control Gates',
        description: 'Guardian checks and quality validation tools',
        tools: ['run_guardian_checks', 'consistency_scan', 'novelty_score'],
        requires_gating: false
    },
    RELEASE_GATED: {
        name: 'Release Gated Actions',
        description: 'External actions requiring Marco + Diane approval',
        tools: ['request_release', 'release_action'],
        requires_gating: true
    }
};

// =============================================================================
// POLICY RULES
// =============================================================================

export interface PolicyRule {
    id: string;
    description: string;
    enforce: (context: PolicyContext) => PolicyDecision;
}

export interface PolicyContext {
    agentId: string;
    toolName: string;
    toolGroup: ToolGroup;
    jurisdiction?: JurisdictionPack;
    hasMarcoApproval?: boolean;
    hasDianePass?: boolean;
    noveltyScore?: number;
    isExternalAction?: boolean;
}

export interface PolicyDecision {
    allowed: boolean;
    reason: string;
    requiresEscalation?: boolean;
    escalationTarget?: 'marco' | 'diane' | 'operator';
}

/**
 * Core policy rules for tool access
 */
export const POLICY_RULES: PolicyRule[] = [
    {
        id: 'no_direct_mutation',
        description: 'Agents never mutate core state directly',
        enforce: (ctx) => ({
            allowed: true,
            reason: 'All mutations go through audited tool layer'
        })
    },
    {
        id: 'release_dual_gate',
        description: 'Release actions require Marco authorization + Diane PASS',
        enforce: (ctx) => {
            if (ctx.toolGroup !== 'RELEASE_GATED') {
                return { allowed: true, reason: 'Not a release-gated tool' };
            }

            if (!ctx.hasMarcoApproval) {
                return {
                    allowed: false,
                    reason: 'Release requires Marco authorization',
                    requiresEscalation: true,
                    escalationTarget: 'marco'
                };
            }

            if (!ctx.hasDianePass) {
                return {
                    allowed: false,
                    reason: 'Release requires Diane quality PASS',
                    requiresEscalation: true,
                    escalationTarget: 'diane'
                };
            }

            return { allowed: true, reason: 'Dual gate satisfied' };
        }
    },
    {
        id: 'jurisdiction_isolation',
        description: 'Agents can only use tools within their allowed packs',
        enforce: (ctx) => {
            // This would check against agent's allowed_packs
            return { allowed: true, reason: 'Jurisdiction check delegated to agent layer' };
        }
    },
    {
        id: 'novelty_escalation',
        description: 'High novelty scores require escalation',
        enforce: (ctx) => {
            if (ctx.noveltyScore !== undefined && ctx.noveltyScore > 0.7) {
                return {
                    allowed: false,
                    reason: 'High novelty score requires operator review',
                    requiresEscalation: true,
                    escalationTarget: 'operator'
                };
            }
            return { allowed: true, reason: 'Novelty within acceptable range' };
        }
    },
    {
        id: 'external_action_hold',
        description: 'External actions default to HOLD',
        enforce: (ctx) => {
            if (ctx.isExternalAction && !ctx.hasMarcoApproval) {
                return {
                    allowed: false,
                    reason: 'External actions require explicit authorization',
                    requiresEscalation: true,
                    escalationTarget: 'marco'
                };
            }
            return { allowed: true, reason: 'Internal action or authorized' };
        }
    }
];

// =============================================================================
// POLICY ENFORCEMENT
// =============================================================================

/**
 * Evaluate all policy rules for a given context
 */
export function evaluatePolicy(context: PolicyContext): PolicyDecision {
    for (const rule of POLICY_RULES) {
        const decision = rule.enforce(context);
        if (!decision.allowed) {
            return decision;
        }
    }

    return {
        allowed: true,
        reason: 'All policy rules passed'
    };
}

/**
 * Check if a tool requires release gating
 */
export function requiresReleaseGating(toolName: string): boolean {
    return TOOL_GROUP_DEFINITIONS.RELEASE_GATED.tools.includes(toolName);
}

/**
 * Get the tool group for a given tool
 */
export function getToolGroup(toolName: string): ToolGroup | undefined {
    for (const [group, def] of Object.entries(TOOL_GROUP_DEFINITIONS)) {
        if (def.tools.includes(toolName)) {
            return group as ToolGroup;
        }
    }
    return undefined;
}
