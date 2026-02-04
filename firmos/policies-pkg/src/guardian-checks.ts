/**
 * FirmOS Guardian Checks
 * 
 * Diane's quality gate checks.
 * All checks must pass before release_action can proceed.
 */

import { z } from 'zod';

// =============================================================================
// CHECK RESULT SCHEMA
// =============================================================================

export const CheckResult = z.object({
    checkId: z.string(),
    passed: z.boolean(),
    severity: z.enum(['error', 'warning', 'info']),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional()
});

export type CheckResult = z.infer<typeof CheckResult>;

export interface GuardianReport {
    workstreamId: string;
    passed: boolean;
    checks: CheckResult[];
    blockedReason?: string;
    generatedAt: Date;
}

// =============================================================================
// WORKSTREAM INPUT FOR CHECKS
// =============================================================================

export interface WorkstreamContext {
    workstreamId: string;
    packId: string;
    jurisdiction: 'MT' | 'RW';
    tasks: {
        id: string;
        name: string;
        status: string;
        required_outputs: string[];
        outputs_present: string[];
        required_evidence: string[];
        evidence_linked: string[];
    }[];
    documents: {
        id: string;
        name: string;
        status: string;
        hash: string;
        stored_hash: string;
    }[];
    metadata: {
        client_name?: string;
        dates?: string[];
        amounts?: number[];
        ids?: string[];
    };
}

// =============================================================================
// GUARDIAN CHECKS
// =============================================================================

interface GuardianCheck {
    id: string;
    name: string;
    severity: 'error' | 'warning' | 'info';
    failHard: boolean; // If true, cannot proceed even with "ignore"
    run: (ctx: WorkstreamContext) => CheckResult;
}

const GUARDIAN_CHECKS: GuardianCheck[] = [
    {
        id: 'REQUIRED_OUTPUTS',
        name: 'Required Outputs Present',
        severity: 'error',
        failHard: true,
        run: (ctx) => {
            const missing: string[] = [];

            for (const task of ctx.tasks) {
                for (const required of task.required_outputs) {
                    if (!task.outputs_present.includes(required)) {
                        missing.push(`${task.name}: ${required}`);
                    }
                }
            }

            return {
                checkId: 'REQUIRED_OUTPUTS',
                passed: missing.length === 0,
                severity: 'error',
                message: missing.length === 0
                    ? 'All required outputs present'
                    : `Missing outputs: ${missing.join(', ')}`,
                details: { missing }
            };
        }
    },
    {
        id: 'REQUIRED_EVIDENCE',
        name: 'Required Evidence Linked',
        severity: 'error',
        failHard: true,
        run: (ctx) => {
            const missing: string[] = [];

            for (const task of ctx.tasks) {
                for (const required of task.required_evidence) {
                    if (!task.evidence_linked.includes(required)) {
                        missing.push(`${task.name}: ${required}`);
                    }
                }
            }

            return {
                checkId: 'REQUIRED_EVIDENCE',
                passed: missing.length === 0,
                severity: 'error',
                message: missing.length === 0
                    ? 'All required evidence linked'
                    : `Missing evidence: ${missing.join(', ')}`,
                details: { missing }
            };
        }
    },
    {
        id: 'HASH_INTEGRITY',
        name: 'Document Hash Integrity',
        severity: 'error',
        failHard: true,
        run: (ctx) => {
            const failures: string[] = [];

            for (const doc of ctx.documents) {
                if (doc.hash !== doc.stored_hash) {
                    failures.push(doc.name);
                }
            }

            return {
                checkId: 'HASH_INTEGRITY',
                passed: failures.length === 0,
                severity: 'error',
                message: failures.length === 0
                    ? 'All document hashes verified'
                    : `Hash mismatch: ${failures.join(', ')}`,
                details: { failures }
            };
        }
    },
    {
        id: 'COUNTRY_PACK_MISMATCH',
        name: 'Country Pack Jurisdiction Match',
        severity: 'error',
        failHard: true,
        run: (ctx) => {
            const packJurisdiction: Record<string, string> = {
                mt_tax: 'MT',
                mt_csp: 'MT',
                rw_tax: 'RW',
                rw_private_notary: 'RW'
            };

            const expectedJurisdiction = packJurisdiction[ctx.packId];
            const matched = expectedJurisdiction === ctx.jurisdiction;

            return {
                checkId: 'COUNTRY_PACK_MISMATCH',
                passed: matched,
                severity: 'error',
                message: matched
                    ? `Pack ${ctx.packId} matches jurisdiction ${ctx.jurisdiction}`
                    : `FATAL: Pack ${ctx.packId} cannot be used in ${ctx.jurisdiction}`,
                details: { packId: ctx.packId, expectedJurisdiction, actualJurisdiction: ctx.jurisdiction }
            };
        }
    },
    {
        id: 'TASKS_COMPLETE',
        name: 'All Tasks Completed',
        severity: 'error',
        failHard: false,
        run: (ctx) => {
            const incomplete = ctx.tasks.filter(t => t.status !== 'completed');

            return {
                checkId: 'TASKS_COMPLETE',
                passed: incomplete.length === 0,
                severity: 'error',
                message: incomplete.length === 0
                    ? 'All tasks completed'
                    : `Incomplete tasks: ${incomplete.map(t => t.name).join(', ')}`,
                details: { incomplete: incomplete.map(t => t.id) }
            };
        }
    },
    {
        id: 'DOCUMENTS_APPROVED',
        name: 'All Documents Approved',
        severity: 'warning',
        failHard: false,
        run: (ctx) => {
            const unapproved = ctx.documents.filter(d => d.status !== 'approved' && d.status !== 'released');

            return {
                checkId: 'DOCUMENTS_APPROVED',
                passed: unapproved.length === 0,
                severity: 'warning',
                message: unapproved.length === 0
                    ? 'All documents approved'
                    : `Unapproved documents: ${unapproved.map(d => d.name).join(', ')}`,
                details: { unapproved: unapproved.map(d => d.id) }
            };
        }
    }
];

// =============================================================================
// GUARDIAN ENGINE
// =============================================================================

/** Evidence types for L5 agent requirements */
export type EvidenceType =
    | 'CLIENT_INSTRUCTION'
    | 'IDENTITY_AUTHORITY'
    | 'FINANCIAL_RECORDS'
    | 'SOURCE_DOCUMENTS'
    | 'REGISTRY_EXTRACTS'
    | 'LEGAL_SOURCES'
    | 'WORKPAPER_TRAIL';

/** Agent evidence requirements from L5 Agent Skills Matrix */
export const AGENT_EVIDENCE_MINIMUM: Record<string, EvidenceType[]> = {
    agent_aline: ['CLIENT_INSTRUCTION', 'WORKPAPER_TRAIL'],
    agent_marco: ['LEGAL_SOURCES', 'WORKPAPER_TRAIL'],
    agent_diane: ['WORKPAPER_TRAIL', 'LEGAL_SOURCES', 'FINANCIAL_RECORDS'],
    agent_patrick: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL'],
    agent_sofia: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL'],
    agent_james: ['CLIENT_INSTRUCTION', 'FINANCIAL_RECORDS', 'WORKPAPER_TRAIL'],
    agent_fatima: ['SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
    agent_matthew: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'LEGAL_SOURCES', 'WORKPAPER_TRAIL'],
    agent_claire: ['CLIENT_INSTRUCTION', 'IDENTITY_AUTHORITY', 'REGISTRY_EXTRACTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
    agent_emmanuel: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'LEGAL_SOURCES', 'WORKPAPER_TRAIL'],
    agent_chantal: ['CLIENT_INSTRUCTION', 'IDENTITY_AUTHORITY', 'LEGAL_SOURCES', 'WORKPAPER_TRAIL']
};

/**
 * Validate that linked evidence satisfies agent's required minimum
 */
export function validateAgentEvidenceMinimum(
    agentId: string,
    linkedEvidence: EvidenceType[]
): { satisfied: boolean; missing: EvidenceType[] } {
    const required = AGENT_EVIDENCE_MINIMUM[agentId] || [];
    const linkedSet = new Set(linkedEvidence);
    const missing = required.filter(e => !linkedSet.has(e));
    return {
        satisfied: missing.length === 0,
        missing
    };
}

/**
 * Calculate evidence quality score for a workstream
 * Score = (linked evidence types / required evidence types) * 100
 */
export function calculateEvidenceQualityScore(
    linkedEvidence: EvidenceType[],
    requiredEvidence: EvidenceType[]
): { score: number; coverage: number; missing: EvidenceType[] } {
    const linkedSet = new Set(linkedEvidence);
    const _requiredSet = new Set(requiredEvidence);

    const covered = requiredEvidence.filter(e => linkedSet.has(e)).length;
    const missing = requiredEvidence.filter(e => !linkedSet.has(e));
    const coverage = requiredEvidence.length > 0 ? (covered / requiredEvidence.length) : 1;

    return {
        score: Math.round(coverage * 100),
        coverage,
        missing
    };
}

/**
 * Run all guardian checks on a workstream
 */
export function runGuardianChecks(ctx: WorkstreamContext): GuardianReport {
    const results: CheckResult[] = [];
    let blocked = false;
    let blockedReason: string | undefined;

    for (const check of GUARDIAN_CHECKS) {
        const result = check.run(ctx);
        results.push(result);

        if (!result.passed && check.failHard) {
            blocked = true;
            blockedReason = blockedReason
                ? `${blockedReason}; ${result.message}`
                : result.message;
        }
    }

    const allPassed = results.every(r => r.passed || r.severity !== 'error');

    return {
        workstreamId: ctx.workstreamId,
        passed: allPassed && !blocked,
        checks: results,
        blockedReason: blocked ? blockedReason : undefined,
        generatedAt: new Date()
    };
}

/**
 * Quick check if workstream can be released
 */
export function canRelease(ctx: WorkstreamContext): boolean {
    return runGuardianChecks(ctx).passed;
}

/**
 * Run guardian checks with agent evidence minimum validation
 */
export function runAgentGuardianChecks(
    ctx: WorkstreamContext,
    agentId: string,
    linkedEvidence: EvidenceType[]
): GuardianReport & { evidenceValidation: { satisfied: boolean; missing: EvidenceType[] } } {
    const baseReport = runGuardianChecks(ctx);
    const evidenceValidation = validateAgentEvidenceMinimum(agentId, linkedEvidence);

    // Add evidence minimum check result
    const evidenceCheck: CheckResult = {
        checkId: 'AGENT_EVIDENCE_MINIMUM',
        passed: evidenceValidation.satisfied,
        severity: 'error',
        message: evidenceValidation.satisfied
            ? `Agent ${agentId} evidence requirements satisfied`
            : `Missing evidence for ${agentId}: ${evidenceValidation.missing.join(', ')}`,
        details: { agentId, missing: evidenceValidation.missing }
    };

    return {
        ...baseReport,
        passed: baseReport.passed && evidenceValidation.satisfied,
        checks: [...baseReport.checks, evidenceCheck],
        evidenceValidation
    };
}

