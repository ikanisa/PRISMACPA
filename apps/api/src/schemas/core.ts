/**
 * FirmOS Core Data Model
 * 
 * Core schemas for the FirmOS multi-agent system.
 * Agents never mutate state directly — all changes go through Tools.
 */

import { z } from 'zod';

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

/** Supported jurisdictions */
export const Jurisdiction = z.enum(['MT', 'RW']);
export type Jurisdiction = z.infer<typeof Jurisdiction>;

/** Service types offered */
export const ServiceType = z.enum([
    'AUDIT',
    'TAX',
    'ACCOUNTING',
    'ADVISORY',
    'RISK',
    'CSP',           // Corporate Services (Malta)
    'PRIVATE_NOTARY' // Private Notary (Rwanda)
]);
export type ServiceType = z.infer<typeof ServiceType>;

/** Autonomy decision tiers */
export const AutonomyTier = z.enum(['AUTO', 'AUTO_CHECK', 'ESCALATE']);
export type AutonomyTier = z.infer<typeof AutonomyTier>;

/** Task status */
export const TaskStatus = z.enum([
    'pending',
    'in_progress',
    'blocked',
    'guardian_review',
    'escalated',
    'completed',
    'cancelled'
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

/** Workstream status */
export const WorkstreamStatus = z.enum([
    'draft',
    'active',
    'guardian_pending',
    'escalated',
    'completed',
    'archived'
]);
export type WorkstreamStatus = z.infer<typeof WorkstreamStatus>;

/** Escalation status */
export const EscalationStatus = z.enum([
    'pending',
    'acknowledged',
    'resolved',
    'rejected'
]);
export type EscalationStatus = z.infer<typeof EscalationStatus>;

/** Document status */
export const DocumentStatus = z.enum([
    'draft',
    'pending_review',
    'approved',
    'released',
    'superseded'
]);
export type DocumentStatus = z.infer<typeof DocumentStatus>;

// =============================================================================
// OPERATOR (Single Human)
// =============================================================================

/** The single human operator who handles escalations */
export const Operator = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Operator = z.infer<typeof Operator>;

// =============================================================================
// CLIENTS & PARTIES
// =============================================================================

/** A client entity */
export const Client = z.object({
    id: z.string().uuid(),
    name: z.string(),
    jurisdiction: Jurisdiction,
    taxId: z.string().optional(),
    email: z.string().email().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Client = z.infer<typeof Client>;

/** A related party (director, shareholder, UBO, etc.) */
export const Party = z.object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    type: z.enum(['director', 'shareholder', 'ubo', 'authorized_signatory', 'contact', 'other']),
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Party = z.infer<typeof Party>;

// =============================================================================
// ENGAGEMENT HIERARCHY
// =============================================================================

/** An engagement (contract/mandate) with a client */
export const Engagement = z.object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    name: z.string(),
    serviceType: ServiceType,
    jurisdiction: Jurisdiction,
    packId: z.string(), // Reference to country pack
    status: z.enum(['draft', 'active', 'completed', 'cancelled']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Engagement = z.infer<typeof Engagement>;

/** A workstream (unit of work) under an engagement */
export const Workstream = z.object({
    id: z.string().uuid(),
    engagementId: z.string().uuid(),
    name: z.string(),
    programId: z.string().optional(), // Links to program definition
    status: WorkstreamStatus,
    assignedAgent: z.string().optional(), // Agent name (e.g., 'matthew', 'chantal')
    autonomyTier: AutonomyTier.optional(),
    dueDate: z.coerce.date().optional(),
    guardianPass: z.boolean().nullable().default(null),
    guardianReportId: z.string().uuid().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Workstream = z.infer<typeof Workstream>;

/** A task within a workstream */
export const Task = z.object({
    id: z.string().uuid(),
    workstreamId: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    status: TaskStatus,
    assignedAgent: z.string().optional(),
    autonomyTier: AutonomyTier,
    requiredOutputs: z.array(z.string()).default([]),
    requiredEvidenceTypes: z.array(z.string()).default([]),
    order: z.number().int().default(0),
    dueDate: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Task = z.infer<typeof Task>;

// =============================================================================
// ARTIFACTS & DOCUMENTS
// =============================================================================

/** An artifact (any output produced by agents) */
export const Artifact = z.object({
    id: z.string().uuid(),
    workstreamId: z.string().uuid(),
    taskId: z.string().uuid().optional(),
    type: z.string(), // e.g., 'vat_return', 'audit_report', 'contract'
    name: z.string(),
    status: DocumentStatus,
    createdByAgent: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Artifact = z.infer<typeof Artifact>;

/** A document (file-based artifact) */
export const Document = z.object({
    id: z.string().uuid(),
    artifactId: z.string().uuid(),
    filename: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().int(),
    storagePath: z.string(),
    currentVersionId: z.string().uuid().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Document = z.infer<typeof Document>;

/** Document version for tracking changes */
export const DocumentVersion = z.object({
    id: z.string().uuid(),
    documentId: z.string().uuid(),
    versionNumber: z.number().int(),
    hash: z.string(), // SHA-256 for integrity
    storagePath: z.string(),
    createdByAgent: z.string(),
    previousVersionId: z.string().uuid().optional(),
    changelog: z.string().optional(),
    createdAt: z.coerce.date()
});
export type DocumentVersion = z.infer<typeof DocumentVersion>;

// =============================================================================
// EVIDENCE
// =============================================================================

/** Evidence item */
export const Evidence = z.object({
    id: z.string().uuid(),
    type: z.string(), // e.g., 'invoice', 'bank_statement', 'contract', 'screenshot'
    name: z.string(),
    hash: z.string(), // SHA-256
    storagePath: z.string(),
    sourceSystem: z.string().optional(), // e.g., 'ocr_pipeline', 'email_intake'
    metadata: z.record(z.string(), z.unknown()).optional(),
    verifiedAt: z.coerce.date().optional(),
    verifiedByAgent: z.string().optional(),
    createdAt: z.coerce.date()
});
export type Evidence = z.infer<typeof Evidence>;

/** Link between evidence and artifacts/workstreams */
export const EvidenceLink = z.object({
    id: z.string().uuid(),
    evidenceId: z.string().uuid(),
    targetType: z.enum(['workstream', 'task', 'artifact', 'document']),
    targetId: z.string().uuid(),
    relationship: z.string(), // e.g., 'supports', 'supersedes', 'references'
    createdByAgent: z.string(),
    createdAt: z.coerce.date()
});
export type EvidenceLink = z.infer<typeof EvidenceLink>;

// =============================================================================
// AUTONOMY & ESCALATION
// =============================================================================

/** Autonomy decision record */
export const Decision = z.object({
    id: z.string().uuid(),
    workstreamId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    requestedBy: z.string(), // Agent name
    decidedBy: z.string(), // 'marco' for policy decisions
    tier: AutonomyTier,
    action: z.string(), // What was requested
    reasoning: z.string(),
    inputs: z.record(z.string(), z.unknown()), // Rule inputs used
    approved: z.boolean(),
    createdAt: z.coerce.date()
});
export type Decision = z.infer<typeof Decision>;

/** Escalation to operator */
export const Escalation = z.object({
    id: z.string().uuid(),
    workstreamId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    decisionId: z.string().uuid().optional(),
    reason: z.string(),
    escalatedBy: z.string(), // Agent name
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    status: EscalationStatus,
    operatorNotes: z.string().optional(),
    resolvedAt: z.coerce.date().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Escalation = z.infer<typeof Escalation>;

// =============================================================================
// GUARDIAN GATE REPORT
// =============================================================================

/** Guardian check result */
export const GuardianCheck = z.object({
    name: z.string(),
    passed: z.boolean(),
    message: z.string().optional(),
    severity: z.enum(['info', 'warning', 'error']).default('error')
});
export type GuardianCheck = z.infer<typeof GuardianCheck>;

/** Guardian gate report for a workstream */
export const GuardianReport = z.object({
    id: z.string().uuid(),
    workstreamId: z.string().uuid(),
    passed: z.boolean(),
    checks: z.array(GuardianCheck),
    generatedByAgent: z.string(), // 'diane'
    blockedReason: z.string().optional(),
    createdAt: z.coerce.date()
});
export type GuardianReport = z.infer<typeof GuardianReport>;

// =============================================================================
// EVENT LOG (Append-Only Spine)
// =============================================================================

/** Event types */
export const EventType = z.enum([
    'engagement_created',
    'workstream_created',
    'task_created',
    'task_status_changed',
    'document_created',
    'document_version_created',
    'evidence_ingested',
    'evidence_linked',
    'guardian_check_run',
    'decision_made',
    'escalation_created',
    'escalation_resolved',
    'release_authorized',
    'release_blocked'
]);
export type EventType = z.infer<typeof EventType>;

/** Append-only event log entry */
export const EventLog = z.object({
    id: z.string().uuid(),
    eventType: EventType,
    entityType: z.string(), // e.g., 'workstream', 'task', 'document'
    entityId: z.string().uuid(),
    agentId: z.string(), // Agent name who triggered event
    previousState: z.record(z.string(), z.unknown()).optional(),
    newState: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.coerce.date()
});
export type EventLog = z.infer<typeof EventLog>;

// =============================================================================
// AGENT MANIFEST (for runtime loading)
// =============================================================================

/** Agent domain */
export const AgentDomain = z.enum(['global', 'malta', 'rwanda']);
export type AgentDomain = z.infer<typeof AgentDomain>;

/** Agent manifest schema for validation */
export const AgentManifest = z.object({
    name: z.string(),
    role: z.string(),
    domain: AgentDomain,
    purpose: z.string(),
    allowedTools: z.array(z.string()),
    defaultPrograms: z.array(z.string()).optional(),
    defaultPacks: z.array(z.string()).optional(),
    escalationTriggers: z.array(z.string()),
    loggingRequirements: z.array(z.string())
});
export type AgentManifest = z.infer<typeof AgentManifest>;

// =============================================================================
// PACK REFERENCE
// =============================================================================

/** Pack identifier */
export const PackId = z.enum([
    'mt_tax',
    'mt_csp',
    'rw_tax',
    'rw_private_notary'
]);
export type PackId = z.infer<typeof PackId>;

/** Pack jurisdiction mapping */
export const PACK_JURISDICTION: Record<PackId, Jurisdiction> = {
    mt_tax: 'MT',
    mt_csp: 'MT',
    rw_tax: 'RW',
    rw_private_notary: 'RW'
};
