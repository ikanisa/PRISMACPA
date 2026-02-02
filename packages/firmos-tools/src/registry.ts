/**
 * FirmOS Tool Registry
 * 
 * Agents never mutate state directly — all changes go through these tools.
 * Each tool has input validation, audit logging, and permission checks.
 */

import { z } from 'zod';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

/** Tool input schemas */
export const ToolInputSchemas = {
    create_engagement: z.object({
        clientId: z.string().uuid(),
        name: z.string().min(1),
        serviceType: z.enum(['AUDIT', 'TAX', 'ACCOUNTING', 'ADVISORY', 'RISK', 'CSP', 'PRIVATE_NOTARY']),
        jurisdiction: z.enum(['MT', 'RW']),
        packId: z.enum(['mt_tax', 'mt_csp', 'rw_tax', 'rw_private_notary']),
        startDate: z.string().datetime()
    }),

    create_workstream: z.object({
        engagementId: z.string().uuid(),
        name: z.string().min(1),
        programId: z.string().optional(),
        assignedAgent: z.string().optional()
    }),

    create_tasks_from_program: z.object({
        workstreamId: z.string().uuid(),
        programId: z.string()
    }),

    generate_document_from_template: z.object({
        workstreamId: z.string().uuid(),
        taskId: z.string().uuid().optional(),
        templateId: z.string(),
        variables: z.record(z.string(), z.unknown())
    }),

    version_diff_document: z.object({
        documentId: z.string().uuid(),
        newContent: z.string(),
        changelog: z.string()
    }),

    ingest_evidence: z.object({
        type: z.string(),
        name: z.string(),
        storagePath: z.string(),
        hash: z.string(),
        sourceSystem: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional()
    }),

    link_evidence: z.object({
        evidenceId: z.string().uuid(),
        targetType: z.enum(['workstream', 'task', 'artifact', 'document']),
        targetId: z.string().uuid(),
        relationship: z.string()
    }),

    classify_evidence: z.object({
        evidenceId: z.string().uuid(),
        evidenceType: z.enum([
            'CLIENT_INSTRUCTION',
            'IDENTITY_AUTHORITY',
            'FINANCIAL_RECORDS',
            'SOURCE_DOCUMENTS',
            'REGISTRY_EXTRACTS',
            'LEGAL_SOURCES',
            'WORKPAPER_TRAIL'
        ]),
        confidence: z.number().min(0).max(1).optional()
    }),

    evidence_quality_score: z.object({
        workstreamId: z.string().uuid(),
        requiredEvidence: z.array(z.string()).optional()
    }),

    assemble_pack: z.object({
        workstreamId: z.string().uuid(),
        packType: z.string(),
        includeArtifacts: z.array(z.string().uuid()).optional()
    }),

    run_guardian_checks: z.object({
        workstreamId: z.string().uuid()
    }),

    consistency_scan: z.object({
        workstreamId: z.string().uuid(),
        checkTypes: z.array(z.enum(['names', 'dates', 'amounts', 'references'])).optional()
    }),

    novelty_score: z.object({
        documentId: z.string().uuid().optional(),
        clauseText: z.string().optional(),
        templateId: z.string().optional()
    }),

    request_autonomy_decision: z.object({
        workstreamId: z.string().uuid().optional(),
        taskId: z.string().uuid().optional(),
        action: z.string(),
        inputs: z.record(z.string(), z.unknown())
    }),

    request_release: z.object({
        workstreamId: z.string().uuid(),
        artifactId: z.string().uuid(),
        releaseType: z.enum(['delivery', 'filing', 'publication']),
        reason: z.string()
    }),

    release_action: z.object({
        workstreamId: z.string().uuid(),
        artifactId: z.string().uuid(),
        releaseType: z.enum(['delivery', 'filing', 'publication']),
        externalTarget: z.string().optional(),
        approvalId: z.string().uuid() // Must have prior request_release approval
    }),

    log_event: z.object({
        eventType: z.string(),
        entityType: z.string(),
        entityId: z.string().uuid(),
        previousState: z.record(z.string(), z.unknown()).optional(),
        newState: z.record(z.string(), z.unknown()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional()
    })
};

export type ToolName = keyof typeof ToolInputSchemas;

// =============================================================================
// TOOL METADATA
// =============================================================================

interface ToolMetadata {
    name: ToolName;
    description: string;
    requiresAuth: boolean;
    gated: boolean; // Requires Marco + Diane approval
    logsEvent: boolean;
}

export const ToolRegistry: Record<ToolName, ToolMetadata> = {
    create_engagement: {
        name: 'create_engagement',
        description: 'Create a new engagement under a client',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    create_workstream: {
        name: 'create_workstream',
        description: 'Create a workstream under an engagement',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    create_tasks_from_program: {
        name: 'create_tasks_from_program',
        description: 'Instantiate a program into tasks for a workstream',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    generate_document_from_template: {
        name: 'generate_document_from_template',
        description: 'Generate a document from a template with variables',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    version_diff_document: {
        name: 'version_diff_document',
        description: 'Create a new version of a document with a diff',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    ingest_evidence: {
        name: 'ingest_evidence',
        description: 'Add evidence to the evidence ledger',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    link_evidence: {
        name: 'link_evidence',
        description: 'Link evidence to a workstream, task, artifact, or document',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    classify_evidence: {
        name: 'classify_evidence',
        description: 'Classify evidence into taxonomy categories',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    evidence_quality_score: {
        name: 'evidence_quality_score',
        description: 'Calculate evidence sufficiency score for a workstream',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    assemble_pack: {
        name: 'assemble_pack',
        description: 'Assemble artifacts into a delivery/filing pack',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    run_guardian_checks: {
        name: 'run_guardian_checks',
        description: 'Execute Diane\'s quality gate checks on a workstream',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    consistency_scan: {
        name: 'consistency_scan',
        description: 'Scan for consistency issues (names, dates, amounts, references)',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    novelty_score: {
        name: 'novelty_score',
        description: 'Score novelty of clauses/documents vs. approved templates',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    request_autonomy_decision: {
        name: 'request_autonomy_decision',
        description: 'Request Marco\'s policy decision for an action',
        requiresAuth: true,
        gated: false,
        logsEvent: true
    },
    request_release: {
        name: 'request_release',
        description: 'Request approval for external release (step 1 of 2)',
        requiresAuth: true,
        gated: true, // Gated by Marco
        logsEvent: true
    },
    release_action: {
        name: 'release_action',
        description: 'Execute external release (step 2) — GATED: requires Marco + Diane + prior approval',
        requiresAuth: true,
        gated: true,
        logsEvent: true
    },
    log_event: {
        name: 'log_event',
        description: 'Append an event to the EventLog',
        requiresAuth: true,
        gated: false,
        logsEvent: false // Meta: doesn't log itself
    }
};

// =============================================================================
// TOOL EXECUTION CONTEXT
// =============================================================================

export interface ToolExecutionContext {
    agentId: string;
    workspaceId?: string;
    timestamp: Date;
}

export interface ToolResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    eventId?: string;
}

// =============================================================================
// TOOL VALIDATION
// =============================================================================

export function validateToolInput<T extends ToolName>(
    toolName: T,
    input: unknown
): z.infer<(typeof ToolInputSchemas)[T]> {
    const schema = ToolInputSchemas[toolName] as unknown as z.ZodType<z.infer<(typeof ToolInputSchemas)[T]>>;
    return schema.parse(input);
}

export function isGatedTool(toolName: ToolName): boolean {
    return ToolRegistry[toolName].gated;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ToolInputSchemas as Schemas };
