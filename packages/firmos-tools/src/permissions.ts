/**
 * FirmOS Tool Permissions
 * 
 * Permission rules for tool execution:
 * - Only Marco can authorize release_action
 * - Diane can block any release
 * - All agents can use non-gated tools
 */

import type { ToolName } from './registry.js';

// =============================================================================
// AGENT IDENTIFIERS
// =============================================================================

/** The 11 named agents */
export const AGENTS = [
    'aline',     // Firm Orchestrator
    'marco',     // Autonomy & Policy Governor
    'diane',     // Quality, Risk & Evidence Guardian
    'patrick',   // Audit & Assurance Engine
    'sofia',     // Accounting & Financial Reporting
    'james',     // Advisory & Consulting Engine
    'fatima',    // Risk, Controls & Internal Audit
    'matthew',   // Malta Tax Engine
    'claire',    // Malta CSP/MBR Engine
    'emmanuel',  // Rwanda Tax Engine
    'chantal'    // Rwanda Private Notary Engine
] as const;

export type AgentId = typeof AGENTS[number];

// =============================================================================
// PERMISSION POLICIES
// =============================================================================

/** Agents who can authorize gated tools */
export const GATED_TOOL_AUTHORIZERS: Record<string, AgentId[]> = {
    release_action: ['marco']
};

/** Agents who can block gated tools */
export const GATED_TOOL_BLOCKERS: AgentId[] = ['diane'];

/** Tool allowlists per agent domain */
export const DOMAIN_TOOL_RESTRICTIONS: Record<string, ToolName[]> = {
    // Malta-only agents cannot use RW packs
    malta: ['create_engagement', 'create_workstream', 'create_tasks_from_program',
        'generate_document_from_template', 'version_diff_document',
        'ingest_evidence', 'link_evidence', 'run_guardian_checks',
        'request_autonomy_decision', 'log_event'],
    // Rwanda-only agents cannot use MT packs
    rwanda: ['create_engagement', 'create_workstream', 'create_tasks_from_program',
        'generate_document_from_template', 'version_diff_document',
        'ingest_evidence', 'link_evidence', 'run_guardian_checks',
        'request_autonomy_decision', 'log_event'],
    // Global agents can use all tools
    global: ['create_engagement', 'create_workstream', 'create_tasks_from_program',
        'generate_document_from_template', 'version_diff_document',
        'ingest_evidence', 'link_evidence', 'run_guardian_checks',
        'request_autonomy_decision', 'release_action', 'log_event']
};

// =============================================================================
// PERMISSION CHECKS
// =============================================================================

export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
    requiresApproval?: {
        from: AgentId;
        type: 'authorize' | 'guardian_pass';
    };
}

/**
 * Check if an agent can execute a tool
 */
export function checkToolPermission(
    agentId: AgentId,
    toolName: ToolName,
    context?: { marcoApproved?: boolean; dianePass?: boolean }
): PermissionCheckResult {
    // Check if tool is gated
    const authorizers = GATED_TOOL_AUTHORIZERS[toolName];

    if (authorizers) {
        // Gated tool — check for Marco authorization
        if (!context?.marcoApproved) {
            return {
                allowed: false,
                reason: `Tool '${toolName}' requires authorization from Marco`,
                requiresApproval: { from: 'marco', type: 'authorize' }
            };
        }

        // Gated tool — check for Diane guardian pass
        if (!context?.dianePass) {
            return {
                allowed: false,
                reason: `Tool '${toolName}' requires Guardian pass from Diane`,
                requiresApproval: { from: 'diane', type: 'guardian_pass' }
            };
        }
    }

    return { allowed: true };
}

/**
 * Check if an agent can authorize a gated tool
 */
export function canAuthorizeGatedTool(agentId: AgentId, toolName: ToolName): boolean {
    const authorizers = GATED_TOOL_AUTHORIZERS[toolName];
    return authorizers?.includes(agentId) ?? false;
}

/**
 * Check if an agent can block a gated tool
 */
export function canBlockGatedTool(agentId: AgentId): boolean {
    return GATED_TOOL_BLOCKERS.includes(agentId);
}

/**
 * Get domain for an agent
 */
export function getAgentDomain(agentId: AgentId): 'global' | 'malta' | 'rwanda' {
    const maltaAgents: AgentId[] = ['matthew', 'claire'];
    const rwandaAgents: AgentId[] = ['emmanuel', 'chantal'];

    if (maltaAgents.includes(agentId)) {
        return 'malta';
    }
    if (rwandaAgents.includes(agentId)) {
        return 'rwanda';
    }
    return 'global';
}

// =============================================================================
// PACK PERMISSION CHECKS
// =============================================================================

type PackId = 'mt_tax' | 'mt_csp' | 'rw_tax' | 'rw_private_notary';

const PACK_JURISDICTION: Record<PackId, 'MT' | 'RW'> = {
    mt_tax: 'MT',
    mt_csp: 'MT',
    rw_tax: 'RW',
    rw_private_notary: 'RW'
};

/**
 * Check if an agent can use a pack
 * Enforces strict jurisdiction separation
 */
export function canAgentUsePack(agentId: AgentId, packId: PackId): boolean {
    const agentDomain = getAgentDomain(agentId);

    // Global agents can use any pack
    if (agentDomain === 'global') {
        return true;
    }

    // Domain agents can only use their jurisdiction's packs
    const packJurisdiction = PACK_JURISDICTION[packId];

    if (agentDomain === 'malta' && packJurisdiction === 'MT') {
        return true;
    }
    if (agentDomain === 'rwanda' && packJurisdiction === 'RW') {
        return true;
    }

    return false;
}
