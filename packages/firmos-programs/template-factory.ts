/**
 * FirmOS Template Factory — Agent-Generated Precedents
 * 
 * Enables agents to autonomously generate and evolve templates/precedents/checklists/workpapers
 * per service, with versioning, pack separation, evidence traceability, and QC/policy gates.
 * 
 * v1.0 - Self-Building Template Factory
 */

// Local evidence type definition to avoid cross-package TypeScript rootDir constraints
// Full evidence taxonomy is defined in packages/core/src/evidence-taxonomy.ts
export type EvidenceType =
    | 'FINANCIAL_RECORDS'
    | 'SOURCE_DOCUMENTS'
    | 'THIRD_PARTY_CONFIRMATIONS'
    | 'AUTHORITATIVE_LITERATURE'
    | 'EXPERT_OPINIONS'
    | 'ANALYTICAL_EVIDENCE'
    | 'PHYSICAL_INSPECTION'
    | 'REPRESENTATIONS_ASSERTIONS'
    | 'ELECTRONIC_EVIDENCE'
    | 'PRIOR_PERIOD'
    | 'WORK_IN_PROGRESS'
    | 'SUPERSEDED';

// =============================================================================

/** Jurisdiction packs (strict country separation) */
export type JurisdictionPack =
    | 'GLOBAL'
    | 'MT_TAX'
    | 'MT_CSP_MBR'
    | 'RW_TAX'
    | 'RW_PRIVATE_NOTARY';

/** Template status lifecycle */
export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';

/** Template instance status */
export type TemplateInstanceStatus = 'DRAFT' | 'FINAL';

/** Risk classification for templates */
export type RiskClassification = 'LOW' | 'MEDIUM' | 'HIGH';

/** Agent identifiers */
export type AgentId =
    | 'aline' | 'marco' | 'diane'           // Governance
    | 'patrick' | 'sofia' | 'james' | 'fatima' // Global engines
    | 'matthew' | 'claire'                   // Malta engines
    | 'emmanuel' | 'chantal';                // Rwanda engines

/** Structured placeholder in a template */
export interface TemplatePlaceholder {
    field_id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select';
    required: boolean;
    options?: string[];        // For select/multi_select types
    validation_rule?: string;  // Optional regex or validation expression
    default_value?: unknown;
}

/** Change log entry for template versioning */
export interface ChangeLogEntry {
    version: string;
    date: string;
    author: AgentId;
    changes: string[];
}

/** Deviation note when agent diverges from template */
export interface DeviationNote {
    deviation_id: string;
    instance_id: string;
    field_id?: string;
    description: string;
    reason: string;
    logged_by: AgentId;
    logged_at: string;
}

/** Approval record for template/instance */
export interface TemplateApproval {
    type: 'DIANE_PASS' | 'MARCO_POLICY_REVIEW' | 'OPERATOR_ACK';
    approved_by: AgentId | 'operator';
    approved_at: string;
    notes?: string;
}

// =============================================================================
// TEMPLATE OBJECT
// =============================================================================

/**
 * Template — Deterministic shell for workpapers/checklists/precedents
 * 
 * Templates are produced by agents, not hardcoded by humans.
 * PUBLISHED templates are immutable; updates create new versions.
 */
export interface Template {
    /** Unique template ID (format: tmpl_*) */
    template_id: string;

    /** Human-readable name */
    name: string;

    /** Service this template belongs to (e.g., svc_mt_tax) */
    service_id: string;

    /** Jurisdiction pack (strict country separation) */
    jurisdiction_pack: JurisdictionPack;

    /** Owner agent responsible for maintaining this template */
    owner_agent: AgentId;

    /** Template lifecycle status */
    status: TemplateStatus;

    /** Semantic version (MAJOR.MINOR.PATCH) */
    version: string;

    /** Purpose/description of this template */
    purpose: string;

    /** Risk classification (affects publish gates) */
    risk_class: RiskClassification;

    /** Required inputs to instantiate this template */
    required_inputs: string[];

    /** Outputs produced when template is completed */
    produced_outputs: string[];

    /** Evidence types required (from evidence-taxonomy) */
    evidence_requirements: EvidenceType[];

    /** Triggers that require escalation */
    escalation_triggers: string[];

    /** Structured placeholders (not prose) */
    placeholders: TemplatePlaceholder[];

    /** Executable steps for instantiation */
    generation_instructions: string[];

    /** Quality checks Diane runs */
    quality_checks: string[];

    /** Version history */
    change_log: ChangeLogEntry[];

    /** Timestamps */
    created_at: string;
    updated_at: string;
}

// =============================================================================
// TEMPLATE INSTANCE
// =============================================================================

/**
 * TemplateInstance — Populated template for a specific case/task
 * 
 * Created by instantiating a Template with case-specific data.
 */
export interface TemplateInstance {
    /** Unique instance ID (format: inst_*) */
    instance_id: string;

    /** Source template ID */
    template_id: string;

    /** Version of template used */
    template_version: string;

    /** Case this instance belongs to */
    case_id: string;

    /** Task this instance is for */
    task_id: string;

    /** Instance status */
    status: TemplateInstanceStatus;

    /** Populated placeholder values */
    populated_fields: Record<string, unknown>;

    /** Map of output -> evidence reference */
    evidence_map: Record<string, string>;

    /** Notes when agent deviates from template */
    deviation_notes: DeviationNote[];

    /** Approvals received */
    approvals: TemplateApproval[];

    /** Timestamps */
    created_at: string;
    updated_at: string;
}

// =============================================================================
// RISK CLASSIFICATION & PUBLISH GATES
// =============================================================================

/** Risk classification definitions */
export const RISK_CLASSIFICATION: Record<RiskClassification, {
    examples: string[];
    publish_gate: string[];
}> = {
    LOW: {
        examples: ['internal checklists', 'PBC lists', 'working paper shells'],
        publish_gate: ['DIANE_PASS']
    },
    MEDIUM: {
        examples: ['client deliverable shells (non-filing)', 'standard memos'],
        publish_gate: ['DIANE_PASS']
    },
    HIGH: {
        examples: ['external filing packs', 'tax position memos that guide submissions', 'legal opinion shells'],
        publish_gate: ['DIANE_PASS', 'MARCO_POLICY_REVIEW', 'operator_ack_optional']
    }
};

// =============================================================================
// TEMPLATE CREATION TRIGGERS
// =============================================================================

/** Template creation trigger definitions */
export const TEMPLATE_TRIGGERS = {
    /** No suitable template exists for this task */
    TRG_NO_TEMPLATE_FOUND: {
        id: 'TRG_NO_TEMPLATE_FOUND',
        when: 'task starts AND template_search(service_id, task_type, pack) returns none',
        action: 'Aline opens Template-Creation Workstream'
    },
    /** High deviation rate from existing template */
    TRG_HIGH_DEVIATION_RATE: {
        id: 'TRG_HIGH_DEVIATION_RATE',
        when: 'deviation_notes_count(template_id, last_30_cases) > threshold',
        threshold: 30,
        action: 'Owner agent must propose template vNext'
    },
    /** Repeated defects from same template */
    TRG_REPEAT_DEFECTS: {
        id: 'TRG_REPEAT_DEFECTS',
        when: 'Diane defects for same output_type > threshold',
        threshold: 5,
        action: 'Template remediation sprint'
    }
} as const;

// =============================================================================
// TEMPLATE SEARCH & SELECTION
// =============================================================================

/**
 * Search for matching templates
 * 
 * Selection rules:
 * 1. Match by service_id + task_type + jurisdiction_pack first
 * 2. Prefer latest PUBLISHED version
 * 3. If multiple match: choose highest Diane quality_score
 * 4. If none: trigger TRG_NO_TEMPLATE_FOUND
 */
export interface TemplateSearchParams {
    service_id: string;
    task_type?: string;
    jurisdiction_pack: JurisdictionPack;
}

export interface TemplateSearchResult {
    found: boolean;
    templates: Template[];
    best_match?: Template;
    trigger?: typeof TEMPLATE_TRIGGERS.TRG_NO_TEMPLATE_FOUND;
}

/**
 * Search for templates matching the given criteria
 */
export function searchTemplates(
    templates: Template[],
    params: TemplateSearchParams
): TemplateSearchResult {
    // Filter by service and pack
    const matches = templates.filter(t =>
        t.service_id === params.service_id &&
        t.jurisdiction_pack === params.jurisdiction_pack &&
        t.status === 'PUBLISHED'
    );

    if (matches.length === 0) {
        return {
            found: false,
            templates: [],
            trigger: TEMPLATE_TRIGGERS.TRG_NO_TEMPLATE_FOUND
        };
    }

    // Sort by version (highest first) - simple semver comparison
    const sorted = matches.toSorted((a, b) => {
        const aVer = a.version.split('.').map(Number);
        const bVer = b.version.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (bVer[i] !== aVer[i]) { return bVer[i] - aVer[i]; }
        }
        return 0;
    });

    return {
        found: true,
        templates: sorted,
        best_match: sorted[0]
    };
}

// =============================================================================
// PACK ENFORCEMENT
// =============================================================================

/**
 * Pack enforcement error
 */
export class PackMismatchError extends Error {
    constructor(
        public templatePack: JurisdictionPack,
        public casePack: JurisdictionPack,
        public templateId: string
    ) {
        super(`PACK_MISMATCH: Template ${templateId} (${templatePack}) cannot be used for case pack ${casePack}`);
        this.name = 'PackMismatchError';
    }
}

/**
 * Check if template pack matches case pack (hard block if mismatch)
 * 
 * GLOBAL templates can be used for any case.
 * Pack-specific templates can ONLY be used for matching packs.
 */
export function checkPackEnforcement(
    template: Template,
    casePack: JurisdictionPack
): { allowed: boolean; error?: PackMismatchError } {
    // GLOBAL templates can be used anywhere
    if (template.jurisdiction_pack === 'GLOBAL') {
        return { allowed: true };
    }

    // Must match exactly
    if (template.jurisdiction_pack === casePack) {
        return { allowed: true };
    }

    return {
        allowed: false,
        error: new PackMismatchError(template.jurisdiction_pack, casePack, template.template_id)
    };
}

// =============================================================================
// TEMPLATE LIFECYCLE FUNCTIONS
// =============================================================================

/**
 * Generate a new template ID
 */
export function generateTemplateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `tmpl_${timestamp}_${random}`;
}

/**
 * Generate a new instance ID
 */
export function generateInstanceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `inst_${timestamp}_${random}`;
}

/**
 * Create a new template draft
 */
export function createTemplateDraft(
    owner_agent: AgentId,
    service_id: string,
    jurisdiction_pack: JurisdictionPack,
    name: string,
    purpose: string
): Template {
    const now = new Date().toISOString();
    return {
        template_id: generateTemplateId(),
        name,
        service_id,
        jurisdiction_pack,
        owner_agent,
        status: 'DRAFT',
        version: '0.1.0',
        purpose,
        risk_class: 'LOW', // Default, can be changed
        required_inputs: [],
        produced_outputs: [],
        evidence_requirements: [],
        escalation_triggers: [],
        placeholders: [],
        generation_instructions: [],
        quality_checks: [],
        change_log: [{
            version: '0.1.0',
            date: now,
            author: owner_agent,
            changes: ['Initial draft created']
        }],
        created_at: now,
        updated_at: now
    };
}

/**
 * Check if a template can be published
 */
export function canPublish(
    template: Template,
    approvals: TemplateApproval[]
): { canPublish: boolean; missing: string[] } {
    const requiredGates = RISK_CLASSIFICATION[template.risk_class].publish_gate;
    const missing: string[] = [];

    for (const gate of requiredGates) {
        if (gate === 'operator_ack_optional') { continue; }

        const hasApproval = approvals.some(a => a.type === gate);
        if (!hasApproval) {
            missing.push(gate);
        }
    }

    return {
        canPublish: missing.length === 0,
        missing
    };
}

/**
 * Publish a template (creates new version if already published)
 */
export function publishTemplate(
    template: Template,
    approvals: TemplateApproval[],
    changeNotes: string[]
): Template {
    const { canPublish: allowed, missing } = canPublish(template, approvals);

    if (!allowed) {
        throw new Error(`Cannot publish: missing approvals: ${missing.join(', ')}`);
    }

    // Increment version
    const [major, minor, patch] = template.version.split('.').map(Number);
    const newVersion = template.status === 'PUBLISHED'
        ? `${major}.${minor}.${patch + 1}`
        : `${major + 1}.0.0`;

    const now = new Date().toISOString();

    return {
        ...template,
        status: 'PUBLISHED',
        version: newVersion,
        change_log: [
            ...template.change_log,
            {
                version: newVersion,
                date: now,
                author: template.owner_agent,
                changes: changeNotes
            }
        ],
        updated_at: now
    };
}

/**
 * Instantiate a template for a specific case/task
 */
export function instantiateTemplate(
    template: Template,
    case_id: string,
    task_id: string,
    casePack: JurisdictionPack
): TemplateInstance {
    // Enforce pack matching
    const packCheck = checkPackEnforcement(template, casePack);
    if (!packCheck.allowed) {
        throw packCheck.error;
    }

    const now = new Date().toISOString();

    return {
        instance_id: generateInstanceId(),
        template_id: template.template_id,
        template_version: template.version,
        case_id,
        task_id,
        status: 'DRAFT',
        populated_fields: {},
        evidence_map: {},
        deviation_notes: [],
        approvals: [],
        created_at: now,
        updated_at: now
    };
}

/**
 * Log a deviation note on an instance
 */
export function logDeviation(
    instance: TemplateInstance,
    description: string,
    reason: string,
    logged_by: AgentId,
    field_id?: string
): TemplateInstance {
    const deviation: DeviationNote = {
        deviation_id: `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        instance_id: instance.instance_id,
        field_id,
        description,
        reason,
        logged_by,
        logged_at: new Date().toISOString()
    };

    return {
        ...instance,
        deviation_notes: [...instance.deviation_notes, deviation],
        updated_at: new Date().toISOString()
    };
}

// =============================================================================
// AGENT TEMPLATE FACTORY META-BLOCK
// =============================================================================

/**
 * Meta-block to append to engine agent system prompts
 */
export const TEMPLATE_FACTORY_AGENT_RULES = `
TEMPLATE FACTORY RULES:
- If no suitable PUBLISHED template exists for your task, you must create a TEMPLATE DRAFT.
- Your template must be a deterministic shell: placeholders + required_inputs + required_outputs + escalation triggers.
- Do not include any client-identifying details in templates. Use de-identified examples only.
- Submit template drafts to Diane for QC. If HIGH-RISK, flag for Marco policy review.
- When instantiating a template, populate fields from evidence; attach evidence_map; log deviations.
`;
