/**
 * FirmOS Core — Tool Access Model
 * 
 * 5 tool groups with scoped access per agent.
 * Agents never mutate state directly — all changes go through these tools.
 */

export const TOOL_GROUPS = {
    CORE_CASE_MGMT: {
        id: 'CORE_CASE_MGMT',
        name: 'Core Case Management',
        description: 'Engagement, workstream, and task management',
        tools: [
            'create_engagement',
            'create_workstream',
            'create_tasks_from_program',
            'log_event'
        ] as const
    },
    DOC_FACTORY: {
        id: 'DOC_FACTORY',
        name: 'Document Factory',
        description: 'Document generation and versioning',
        tools: [
            'generate_document_from_template',
            'version_diff_document',
            'assemble_pack'
        ] as const
    },
    EVIDENCE: {
        id: 'EVIDENCE',
        name: 'Evidence Management',
        description: 'Evidence ingestion, classification, and linking',
        tools: [
            'ingest_evidence',
            'classify_evidence',
            'link_evidence',
            'evidence_quality_score'
        ] as const
    },
    QC_GATES: {
        id: 'QC_GATES',
        name: 'Quality Control Gates',
        description: 'Quality checks and consistency validation',
        tools: [
            'run_guardian_checks',
            'consistency_scan',
            'novelty_score'
        ] as const
    },
    RELEASE_GATED: {
        id: 'RELEASE_GATED',
        name: 'Release Gated',
        description: 'External delivery/filing — requires Marco + Diane PASS',
        tools: [
            'request_release',
            'release_action'
        ] as const,
        gateRequirements: {
            requiresMarcoAuthorization: true,
            requiresDianePass: true,
            requiresPolicyAllowsRelease: true
        }
    }
} as const;

export type ToolGroupId = keyof typeof TOOL_GROUPS;
export type ToolGroups = typeof TOOL_GROUPS;

/**
 * All tool names across all groups
 */
export type ToolName = typeof TOOL_GROUPS[ToolGroupId]['tools'][number];

/**
 * Get all tools for a set of allowed tool groups
 */
export function getToolsForGroups(groupIds: ToolGroupId[]): string[] {
    return groupIds.flatMap(id => [...TOOL_GROUPS[id].tools]);
}

/**
 * Check if a tool is in a specific group
 */
export function isToolInGroup(tool: string, groupId: ToolGroupId): boolean {
    return (TOOL_GROUPS[groupId].tools as readonly string[]).includes(tool);
}

/**
 * Check if a tool requires release gating (Marco + Diane approval)
 */
export function isReleaseGatedTool(tool: string): boolean {
    return isToolInGroup(tool, 'RELEASE_GATED');
}

/**
 * Get the tool group for a given tool
 */
export function getToolGroup(tool: string): ToolGroupId | undefined {
    for (const [groupId, group] of Object.entries(TOOL_GROUPS)) {
        if ((group.tools as readonly string[]).includes(tool)) {
            return groupId as ToolGroupId;
        }
    }
    return undefined;
}

// =============================================================================
// AGENT TOOL ACCESS MAPPING
// =============================================================================

/**
 * Standard tool group assignments per agent role.
 * This is the source of truth for which agents can access which tools.
 */
export const AGENT_TOOL_ACCESS: Record<string, ToolGroupId[]> = {
    // Governance agents
    agent_aline: ['CORE_CASE_MGMT', 'EVIDENCE', 'QC_GATES'],
    agent_marco: ['CORE_CASE_MGMT', 'QC_GATES', 'RELEASE_GATED'],
    agent_diane: ['EVIDENCE', 'QC_GATES', 'CORE_CASE_MGMT'],

    // Global engine agents
    agent_patrick: ['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES'],
    agent_sofia: ['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES'],
    agent_james: ['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES'],
    agent_fatima: ['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES'],

    // Malta engine agents
    agent_matthew: ['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES'],
    agent_claire: ['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES'],

    // Rwanda engine agents
    agent_emmanuel: ['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES'],
    agent_chantal: ['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES']
};

/**
 * Check if an agent can access a specific tool
 */
export function canAgentAccessTool(agentId: string, tool: string): boolean {
    const allowedGroups = AGENT_TOOL_ACCESS[agentId];
    if (!allowedGroups) return false;

    const toolGroup = getToolGroup(tool);
    if (!toolGroup) return false;

    return allowedGroups.includes(toolGroup);
}
