/**
 * FirmOS Service Catalog Validation
 * 
 * Runtime validation using Zod schemas for service catalog data.
 */

import { z } from 'zod';
import type {
    ServiceDefinition,
    ServiceCatalog,
    GlobalQualityRules,
    TaskNode
} from './service-catalog.js';

// =============================================================================
// ZOD SCHEMAS (Runtime Validation)
// =============================================================================

/** Autonomy tier validation */
export const AutonomyTierSchema = z.enum(['AUTO', 'AUTO_CHECK', 'ESCALATE']);

/** Service scope validation */
export const ServiceScopeSchema = z.enum(['global', 'malta', 'rwanda']);

/** Service phase validation */
export const ServicePhaseSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1)
});

/** Task node validation */
export const TaskNodeSchema = z.object({
    key: z.string().min(1),
    autonomy: AutonomyTierSchema,
    outputs: z.array(z.string()).min(1, 'Task must have at least one output'),
    evidence: z.array(z.string()).min(1, 'Task must have at least one evidence requirement')
});

/** External action validation */
export const ExternalActionSchema = z.object({
    action: z.string().min(1),
    requires: z.array(z.string()),
    defaultAutonomy: AutonomyTierSchema
});

/** Service definition validation */
export const ServiceDefinitionSchema = z.object({
    id: z.string().min(1).regex(/^svc_/, 'Service ID must start with svc_'),
    name: z.string().min(1),
    scope: ServiceScopeSchema,
    strictPack: z.string().optional(),
    includesMandatory: z.array(z.string()).optional(),
    standardProcess: z.object({
        phases: z.array(ServicePhaseSchema).min(1, 'Service must have at least one phase')
    }),
    taskGraph: z.array(TaskNodeSchema).min(1, 'Service must have at least one task'),
    escalationTriggers: z.array(z.string()).min(1, 'Service must have escalation triggers'),
    externalActions: z.array(ExternalActionSchema).min(1, 'Service must have external actions')
});

/** Global quality rules validation */
export const GlobalQualityRulesSchema = z.object({
    requiredForAllServices: z.array(z.string()).min(1),
    guardianPassConditions: z.array(z.string()).min(1),
    universalEscalationTriggers: z.array(z.string()).min(1)
});

/** Complete service catalog validation */
export const ServiceCatalogSchema = z.object({
    version: z.string().regex(/^\d+\.\d+/, 'Version must be in format X.Y'),
    name: z.string().min(1),
    mode: z.string().min(1),
    goal: z.string().min(1),
    autonomyTiers: z.record(z.string(), z.string()),
    globalQualityRules: GlobalQualityRulesSchema,
    services: z.array(ServiceDefinitionSchema).min(1),
    integrationNotes: z.object({
        routingRules: z.array(z.string()),
        releaseControls: z.array(z.string())
    })
});

// =============================================================================
// SERVICE PROGRAM SCHEMAS (v1.0 - Task Graphs)
// =============================================================================

/** Jurisdiction pack validation */
export const JurisdictionPackSchema = z.enum([
    'GLOBAL',
    'MT_TAX',
    'MT_CSP_MBR',
    'RW_TAX',
    'RW_PRIVATE_NOTARY'
]);

/** Evidence type validation (for programs) */
export const EvidenceTypeSchema = z.enum([
    'CLIENT_INSTRUCTION',
    'IDENTITY_AUTHORITY',
    'FINANCIAL_RECORDS',
    'SOURCE_DOCUMENTS',
    'REGISTRY_EXTRACTS',
    'LEGAL_SOURCES',
    'WORKPAPER_TRAIL'
]);

/** Program task validation */
export const ProgramTaskSchema = z.object({
    task_id: z.string().min(1).regex(/^[A-Z]{3}_T\d{2}/, 'Task ID must match format XXX_TNN (e.g. AUD_T01)'),
    agent: z.string().min(1),
    autonomy: AutonomyTierSchema,
    required_outputs: z.array(z.string()).min(1, 'Task must have at least one required output'),
    required_evidence: z.array(EvidenceTypeSchema).min(1, 'Task must have at least one evidence requirement'),
    qc_triggers: z.array(z.string()),
    escalation_triggers: z.array(z.string())
});

/** Program phase validation */
export const ProgramPhaseSchema = z.object({
    phase_id: z.string().min(1).regex(/^[A-Z]{3}_P\d/, 'Phase ID must match format XXX_PN (e.g. AUD_P1)'),
    tasks: z.array(ProgramTaskSchema).min(1, 'Phase must have at least one task')
});

/** Service program validation */
export const ServiceProgramSchema = z.object({
    service_id: z.string().min(1).regex(/^svc_/, 'Service ID must start with svc_'),
    jurisdiction_pack: JurisdictionPackSchema,
    owner_agent: z.string().min(1),
    orchestrator_agent: z.string().min(1),
    phases: z.array(ProgramPhaseSchema).min(1, 'Program must have at least one phase')
});

/** Universal gate validation */
export const UniversalGateSchema = z.object({
    id: z.string().min(1).regex(/^GATE_G\d/, 'Gate ID must match format GATE_GN'),
    trigger: z.string().min(1),
    enforced_by: z.string().min(1),
    prerequisite: z.string().optional()
});

/** Governance defaults validation */
export const GovernanceDefaultsSchema = z.object({
    novelty_scoring: z.object({
        enabled: z.boolean(),
        threshold_actions: z.record(z.string(), z.string())
    }),
    arithmetic_integrity_checks: z.object({
        enabled: z.boolean(),
        owner: z.string().min(1)
    }),
    pack_mismatch_block: z.object({
        enabled: z.boolean(),
        severity: z.string().min(1),
        owner: z.string().min(1)
    })
});

// =============================================================================
// TEMPLATE FACTORY SCHEMAS (v1.0 - Agent-Generated Precedents)
// =============================================================================

/** Template status validation */
export const TemplateStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'RETIRED']);

/** Template instance status validation */
export const TemplateInstanceStatusSchema = z.enum(['DRAFT', 'FINAL']);

/** Risk classification validation */
export const RiskClassificationSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

/** Agent ID validation */
export const AgentIdSchema = z.enum([
    'aline', 'marco', 'diane',
    'patrick', 'sofia', 'james', 'fatima',
    'matthew', 'claire',
    'emmanuel', 'chantal'
]);

/** Template placeholder validation */
export const TemplatePlaceholderSchema = z.object({
    field_id: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'number', 'date', 'boolean', 'select', 'multi_select']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    validation_rule: z.string().optional(),
    default_value: z.unknown().optional()
});

/** Change log entry validation */
export const ChangeLogEntrySchema = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format X.Y.Z'),
    date: z.string().datetime({ offset: true }),
    author: AgentIdSchema,
    changes: z.array(z.string()).min(1)
});

/** Deviation note validation */
export const DeviationNoteSchema = z.object({
    deviation_id: z.string().min(1),
    instance_id: z.string().regex(/^inst_/, 'Instance ID must start with inst_'),
    field_id: z.string().optional(),
    description: z.string().min(1),
    reason: z.string().min(1),
    logged_by: AgentIdSchema,
    logged_at: z.string().datetime({ offset: true })
});

/** Template approval validation */
export const TemplateApprovalSchema = z.object({
    type: z.enum(['DIANE_PASS', 'MARCO_POLICY_REVIEW', 'OPERATOR_ACK']),
    approved_by: z.union([AgentIdSchema, z.literal('operator')]),
    approved_at: z.string().datetime({ offset: true }),
    notes: z.string().optional()
});

/** Template validation */
export const TemplateSchema = z.object({
    template_id: z.string().regex(/^tmpl_/, 'Template ID must start with tmpl_'),
    name: z.string().min(1),
    service_id: z.string().regex(/^svc_/, 'Service ID must start with svc_'),
    jurisdiction_pack: JurisdictionPackSchema,
    owner_agent: AgentIdSchema,
    status: TemplateStatusSchema,
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format X.Y.Z'),
    purpose: z.string().min(1),
    risk_class: RiskClassificationSchema,
    required_inputs: z.array(z.string()),
    produced_outputs: z.array(z.string()),
    evidence_requirements: z.array(EvidenceTypeSchema),
    escalation_triggers: z.array(z.string()),
    placeholders: z.array(TemplatePlaceholderSchema),
    generation_instructions: z.array(z.string()),
    quality_checks: z.array(z.string()),
    change_log: z.array(ChangeLogEntrySchema).min(1, 'Template must have at least one change log entry'),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true })
});

/** Template instance validation */
export const TemplateInstanceSchema = z.object({
    instance_id: z.string().regex(/^inst_/, 'Instance ID must start with inst_'),
    template_id: z.string().regex(/^tmpl_/, 'Template ID must start with tmpl_'),
    template_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    case_id: z.string().min(1),
    task_id: z.string().min(1),
    status: TemplateInstanceStatusSchema,
    populated_fields: z.record(z.string(), z.unknown()),
    evidence_map: z.record(z.string(), z.string()),
    deviation_notes: z.array(DeviationNoteSchema),
    approvals: z.array(TemplateApprovalSchema),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true })
});

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/** Validation result type */
export interface ValidationResult<T = unknown> {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
}

/**
 * Validate a service definition.
 */
export function validateServiceDefinition(data: unknown): ValidationResult<ServiceDefinition> {
    const result = ServiceDefinitionSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data as ServiceDefinition };
    }
    return { success: false, errors: result.error };
}

/**
 * Validate the complete service catalog.
 */
export function validateServiceCatalog(data: unknown): ValidationResult<ServiceCatalog> {
    const result = ServiceCatalogSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data as ServiceCatalog };
    }
    return { success: false, errors: result.error };
}

/**
 * Validate a task node.
 */
export function validateTaskNode(data: unknown): ValidationResult<TaskNode> {
    const result = TaskNodeSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data as TaskNode };
    }
    return { success: false, errors: result.error };
}

/**
 * Validate global quality rules.
 */
export function validateGlobalQualityRules(data: unknown): ValidationResult<GlobalQualityRules> {
    const result = GlobalQualityRulesSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data as GlobalQualityRules };
    }
    return { success: false, errors: result.error };
}

// =============================================================================
// CATALOG INTEGRITY CHECKS
// =============================================================================

/**
 * Check that all service IDs are unique.
 */
export function checkUniqueServiceIds(services: ServiceDefinition[]): { valid: boolean; duplicates: string[] } {
    const ids = services.map(s => s.id);
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const id of ids) {
        if (seen.has(id)) {
            duplicates.push(id);
        }
        seen.add(id);
    }

    return { valid: duplicates.length === 0, duplicates };
}

/**
 * Check that all task keys within a service are unique.
 */
export function checkUniqueTaskKeys(service: ServiceDefinition): { valid: boolean; duplicates: string[] } {
    const keys = service.taskGraph.map(t => t.key);
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const key of keys) {
        if (seen.has(key)) {
            duplicates.push(key);
        }
        seen.add(key);
    }

    return { valid: duplicates.length === 0, duplicates };
}

/**
 * Check that Malta services have strictPack = 'MT_*'
 */
export function checkMaltaPackConsistency(services: ServiceDefinition[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const service of services) {
        if (service.scope === 'malta') {
            if (!service.strictPack || !service.strictPack.startsWith('MT_')) {
                issues.push(`Malta service ${service.id} should have strictPack starting with MT_`);
            }
        }
    }

    return { valid: issues.length === 0, issues };
}

/**
 * Check that Rwanda services have strictPack = 'RW_*'
 */
export function checkRwandaPackConsistency(services: ServiceDefinition[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const service of services) {
        if (service.scope === 'rwanda') {
            if (!service.strictPack || !service.strictPack.startsWith('RW_')) {
                issues.push(`Rwanda service ${service.id} should have strictPack starting with RW_`);
            }
        }
    }

    return { valid: issues.length === 0, issues };
}

/**
 * Run all integrity checks on a service catalog.
 */
export function runAllIntegrityChecks(catalog: ServiceCatalog): {
    valid: boolean;
    checks: Record<string, { valid: boolean; issues?: string[] }>
} {
    const checks: Record<string, { valid: boolean; issues?: string[] }> = {};

    // Unique service IDs
    const uniqueIds = checkUniqueServiceIds(catalog.services);
    checks['uniqueServiceIds'] = { valid: uniqueIds.valid, issues: uniqueIds.duplicates };

    // Unique task keys per service
    for (const service of catalog.services) {
        const uniqueKeys = checkUniqueTaskKeys(service);
        checks[`uniqueTaskKeys_${service.id}`] = { valid: uniqueKeys.valid, issues: uniqueKeys.duplicates };
    }

    // Malta pack consistency
    const maltaPacks = checkMaltaPackConsistency(catalog.services);
    checks['maltaPackConsistency'] = { valid: maltaPacks.valid, issues: maltaPacks.issues };

    // Rwanda pack consistency
    const rwandaPacks = checkRwandaPackConsistency(catalog.services);
    checks['rwandaPackConsistency'] = { valid: rwandaPacks.valid, issues: rwandaPacks.issues };

    const allValid = Object.values(checks).every(c => c.valid);

    return { valid: allValid, checks };
}
