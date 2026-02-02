/**
 * FirmOS Config Validation
 *
 * Runtime validation for FirmOS YAML catalog files.
 * Uses Zod for TypeScript-native validation with JSONSchema interop.
 */

import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';

// =============================================================================
// ENUMS
// =============================================================================

export const PackId = z.enum(['GLOBAL', 'MT_TAX', 'MT_CSP_MBR', 'RW_TAX', 'RW_PRIVATE_NOTARY']);
export type PackId = z.infer<typeof PackId>;

export const ToolGroup = z.enum(['CORE_CASE_MGMT', 'EVIDENCE', 'DOC_FACTORY', 'QC_GATES', 'RELEASE_GATED']);
export type ToolGroup = z.infer<typeof ToolGroup>;

export const AgentRole = z.enum(['orchestration', 'policy_governance', 'quality_assurance', 'service_delivery']);
export type AgentRole = z.infer<typeof AgentRole>;

export const AutonomyTier = z.enum(['AUTO', 'AUTO_CHECK', 'ESCALATE']);
export type AutonomyTier = z.infer<typeof AutonomyTier>;

export const ServiceScope = z.enum(['global', 'malta', 'rwanda']);
export type ServiceScope = z.infer<typeof ServiceScope>;

// =============================================================================
// AGENTS CATALOG SCHEMA
// =============================================================================

export const AgentSchema = z.object({
    id: z.string().regex(/^agent_[a-z]+$/),
    name: z.string().min(1),
    title: z.string().min(1),
    role: AgentRole,
    owns_services: z.array(z.string().regex(/^svc_/)).default([]),
    supports_services: z.array(z.string().regex(/^svc_/)).default([]),
    allowed_packs: z.array(PackId).min(1),
    allowed_tools: z.array(ToolGroup).min(1),
});
export type Agent = z.infer<typeof AgentSchema>;

export const ToolGroupDefSchema = z.object({
    description: z.string(),
    tools: z.array(z.string()).min(1),
});

export const AgentsCatalogSchema = z.object({
    version: z.string().regex(/^[0-9]+\.[0-9]+$/),
    name: z.string(),
    governance_agents: z.array(AgentSchema).optional(),
    global_engine_agents: z.array(AgentSchema).optional(),
    malta_engine_agents: z.array(AgentSchema).optional(),
    rwanda_engine_agents: z.array(AgentSchema).optional(),
    service_ownership: z.record(z.string(), z.string()).optional(),
    tool_groups: z.record(z.string(), ToolGroupDefSchema).optional(),
});
export type AgentsCatalog = z.infer<typeof AgentsCatalogSchema>;

// =============================================================================
// SERVICE CATALOG SCHEMA
// =============================================================================

export const TaskSchema = z.object({
    id: z.string(),
    name: z.string(),
    autonomy: AutonomyTier,
    depends_on: z.array(z.string()),
    outputs: z.array(z.string()).min(1),
});
export type Task = z.infer<typeof TaskSchema>;

export const ServiceSchema = z.object({
    id: z.string().regex(/^svc_/),
    name: z.string(),
    scope: ServiceScope,
    owner_agent: z.string().regex(/^agent_/),
    description: z.string().optional(),
    phases: z.array(z.string()).min(1),
    task_graph: z.array(TaskSchema).min(1),
    escalation_triggers: z.array(z.string()).optional(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const ServiceCatalogSchema = z.object({
    version: z.string().regex(/^[0-9]+\.[0-9]+$/),
    name: z.string(),
    mode: z.enum(['additive_only', 'replace']).optional(),
    goal: z.string().optional(),
    autonomy_tiers: z.record(z.string(), z.string()).optional(),
    global_quality_rules: z.object({
        version_control: z.string().optional(),
        evidence_minimum: z.array(z.string()).optional(),
        guardian_pass_required: z.array(z.string()).optional(),
        pack_separation: z.string().optional(),
        traceability: z.string().optional(),
    }).optional(),
    services: z.array(ServiceSchema),
    integration_notes: z.object({
        routing_rules: z.array(z.string()).optional(),
        release_controls: z.array(z.string()).optional(),
    }).optional(),
});
export type ServiceCatalog = z.infer<typeof ServiceCatalogSchema>;

// =============================================================================
// SKILLS MATRIX SCHEMA
// =============================================================================

export const SkillLevel = z.enum(['L3', 'L4', 'L5']);
export type SkillLevel = z.infer<typeof SkillLevel>;

export const SkillEntrySchema = z.object({
    skill: z.string(),
    level: SkillLevel,
});

export const AgentSkillsSchema = z.object({
    name: z.string(),
    title: z.string(),
    mastery_expectation: SkillLevel.optional(),
    skills: z.array(SkillEntrySchema),
});

export const SkillsMatrixSchema = z.object({
    version: z.string().regex(/^[0-9]+\.[0-9]+$/),
    name: z.string(),
    proficiency_levels: z.record(z.string(), z.string()).optional(),
    agents: z.record(z.string(), AgentSkillsSchema),
});
export type SkillsMatrix = z.infer<typeof SkillsMatrixSchema>;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    catalog?: string;
}

/**
 * Validate a YAML file against its corresponding schema
 */
export function validateCatalog(
    filePath: string,
    schema: z.ZodSchema,
): ValidationResult {
    const catalogName = path.basename(filePath, '.yaml');

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = YAML.parse(content);
        const result = schema.safeParse(data);

        if (result.success) {
            return { valid: true, errors: [], catalog: catalogName };
        }

        const errors = result.error.issues.map(
            (issue) => `${issue.path.join('.')}: ${issue.message}`,
        );
        return { valid: false, errors, catalog: catalogName };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            valid: false,
            errors: [`Failed to read/parse ${filePath}: ${message}`],
            catalog: catalogName,
        };
    }
}

/**
 * Validate all FirmOS catalogs
 */
export function validateAllCatalogs(catalogsDir: string): ValidationResult[] {
    const results: ValidationResult[] = [];

    const catalogSchemas: Record<string, z.ZodSchema> = {
        'agents_catalog.yaml': AgentsCatalogSchema,
        'service_catalog.yaml': ServiceCatalogSchema,
        'skills_matrix.yaml': SkillsMatrixSchema,
    };

    for (const [filename, schema] of Object.entries(catalogSchemas)) {
        const filePath = path.join(catalogsDir, filename);
        if (fs.existsSync(filePath)) {
            results.push(validateCatalog(filePath, schema));
        } else {
            results.push({
                valid: false,
                errors: [`File not found: ${filePath}`],
                catalog: filename,
            });
        }
    }

    return results;
}

/**
 * CLI entry point for validation
 */
export function runValidation(): void {
    const catalogsDir = process.argv[2] || path.join(__dirname, '..', 'catalogs');

    console.log(`🔍 Validating FirmOS catalogs in: ${catalogsDir}\n`);

    const results = validateAllCatalogs(catalogsDir);
    let allValid = true;

    for (const result of results) {
        if (result.valid) {
            console.log(`✅ ${result.catalog}: Valid`);
        } else {
            console.log(`❌ ${result.catalog}: Invalid`);
            for (const error of result.errors) {
                console.log(`   - ${error}`);
            }
            allValid = false;
        }
    }

    console.log('');

    if (allValid) {
        console.log('✅ All catalogs validated successfully!');
        process.exit(0);
    } else {
        console.log('❌ Validation failed. See errors above.');
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runValidation();
}
