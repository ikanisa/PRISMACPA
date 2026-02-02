/**
 * FirmOS Agent System Types
 * 
 * Comprehensive type definitions for BigFour-grade agent personas,
 * constraints, escalation rules, and response schemas.
 */

// =============================================================================
// PERSONA TYPES
// =============================================================================

/**
 * Agent persona - defines the character and communication style
 */
export interface AgentPersona {
    /** Core identity description (e.g., "Managing Partner of Operations") */
    identity: string;
    /** Communication voice (e.g., "Decisive, minimal words, always returns a plan") */
    voice: string;
    /** Behavioral temperament (e.g., "No drama; ruthless about deadlines") */
    temperament: string;
}

// =============================================================================
// CONSTRAINT TYPES
// =============================================================================

/**
 * Mandatory and forbidden behaviors for an agent
 */
export interface AgentConstraints {
    /** Behaviors the agent MUST always exhibit */
    must: string[];
    /** Behaviors the agent must NEVER exhibit */
    must_never: string[];
}

/**
 * Escalation rule defining when an agent must escalate
 */
export interface EscalationRule {
    /** Trigger condition description */
    trigger: string;
    /** Severity level */
    severity?: 'warning' | 'error' | 'critical';
    /** Whether to halt processing */
    halt?: boolean;
}

// =============================================================================
// OUTPUT TYPES
// =============================================================================

/**
 * Deliverable template format specification
 */
export interface DeliverableTemplate {
    /** Template name */
    name: string;
    /** Template format description (e.g., "Scope | Jurisdiction | Service | Outputs") */
    format: string;
}

/**
 * Quality bar - measurable success criteria
 */
export interface QualityBar {
    /** Metric description */
    metric: string;
    /** Target value or threshold */
    target: string;
}

// =============================================================================
// TOOL GROUPS
// =============================================================================

export type ToolGroup =
    | 'CORE_CASE_MGMT'
    | 'DOC_FACTORY'
    | 'EVIDENCE'
    | 'QC_GATES'
    | 'RELEASE_GATED';

export const TOOL_GROUPS: Record<ToolGroup, string[]> = {
    CORE_CASE_MGMT: ['create_engagement', 'create_workstream', 'create_tasks_from_program', 'log_event'],
    DOC_FACTORY: ['generate_document_from_template', 'version_diff_document', 'assemble_pack'],
    EVIDENCE: ['ingest_evidence', 'classify_evidence', 'link_evidence', 'evidence_quality_score'],
    QC_GATES: ['run_guardian_checks', 'consistency_scan', 'novelty_score'],
    RELEASE_GATED: ['request_release', 'release_action']
};

// =============================================================================
// JURISDICTION PACKS
// =============================================================================

export type JurisdictionPack =
    | 'GLOBAL'
    | 'MT_TAX'
    | 'MT_CSP_MBR'
    | 'RW_TAX'
    | 'RW_PRIVATE_NOTARY';

// =============================================================================
// PROFICIENCY & SKILLS (Partner-level L5 standard)
// =============================================================================

export type ProficiencyLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface Skill {
    skill: string;
    level: ProficiencyLevel;
}

// =============================================================================
// RESOURCE SCOPES
// =============================================================================

export type ResourceScope = 'global' | 'malta' | 'rwanda';

export interface ResourceDependencies {
    /** Standards the agent must know */
    must_know: string[];
    /** Jurisdiction-specific packs (optional) */
    jurisdiction_packs?: Record<string, string[]>;
    /** Malta mandatory resources */
    malta_mandatory?: string[];
    /** Malta CSP mandatory resources */
    malta_csp_mandatory?: string[];
    /** Rwanda mandatory resources */
    rwanda_mandatory?: string[];
    /** Rwanda supporting resources */
    rwanda_supporting?: string[];
}

// =============================================================================
// EVIDENCE TYPES
// =============================================================================

export type EvidenceType =
    | 'CLIENT_INSTRUCTION'
    | 'IDENTITY_AUTHORITY'
    | 'FINANCIAL_RECORDS'
    | 'SOURCE_DOCUMENTS'
    | 'REGISTRY_EXTRACTS'
    | 'LEGAL_SOURCES'
    | 'WORKPAPER_TRAIL';

// =============================================================================
// ENHANCED AGENT MANIFEST
// =============================================================================

/**
 * External action definition with autonomy tier and gating
 */
export interface ExternalAction {
    action: string;
    autonomy: 'AUTO' | 'AUTO_CHECK' | 'ESCALATE';
    gated_by: ('policy' | 'guardian')[];
}

/**
 * Enhanced agent manifest with L5 partner-level skills matrix
 * Based on FirmOS Agent Skills & Resources Matrix v1.0
 */
export interface EnhancedAgentManifest {
    // Core identification
    id: string;
    name: string;
    title: string;
    version: string;

    // Persona (new)
    persona: AgentPersona;

    // Mastery expectation (new - L5 partner standard)
    mastery_expectation: ProficiencyLevel;

    // Resource scopes (new)
    allowed_resource_scopes: ResourceScope[];

    // Jurisdiction & tools
    allowed_packs: JurisdictionPack[];
    allowed_tools: ToolGroup[];

    // Skills matrix (new - partner-level skills with proficiency)
    skills: Skill[];

    // Required evidence minimum (new)
    required_evidence_minimum: EvidenceType[];

    // Resource dependencies (new)
    resource_dependencies: ResourceDependencies;

    // Mission & capabilities
    mission: string[];
    primary_functions: string[];

    // Service ownership
    owns_services: string[];
    supports_services: string[];

    // Constraints (new)
    constraints: AgentConstraints;

    // Escalation rules (enhanced - from spec)
    escalation_rules: string[];

    // Evaluation metrics (new - per-agent KPIs)
    evaluation_metrics: string[];

    // Outputs
    outputs: string[];
    outputs_required: string[];
    deliverable_templates?: DeliverableTemplate[];

    // Quality (new)
    quality_bar: QualityBar[];

    // External actions
    external_actions: ExternalAction[];
}

// =============================================================================
// AGENT RESPONSE SCHEMA
// =============================================================================

/**
 * Standard response schema that all agent outputs must follow
 */
export interface AgentResponse {
    /** Brief summary of what was done */
    summary: string;

    /** Detailed work performed */
    work_done: string[];

    /** List of output artifacts created */
    outputs_created: string[];

    /** Links to evidence items */
    evidence_links: string[];

    /** Assumptions made during processing */
    assumptions: string[];

    /** Risks and flags identified */
    risks_and_flags: string[];

    /** Escalations requested (to Marco, Diane, or operator) */
    escalations_requested: string[];

    /** Recommended next actions */
    next_actions: string[];
}

/**
 * Validate an agent response has all required fields
 */
export function validateAgentResponse(response: unknown): response is AgentResponse {
    if (typeof response !== 'object' || response === null) return false;

    const r = response as Record<string, unknown>;
    const requiredArrayFields = [
        'work_done', 'outputs_created', 'evidence_links',
        'assumptions', 'risks_and_flags', 'escalations_requested', 'next_actions'
    ];

    if (typeof r.summary !== 'string') return false;

    for (const field of requiredArrayFields) {
        if (!Array.isArray(r[field])) return false;
    }

    return true;
}
