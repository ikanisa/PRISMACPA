/**
 * FirmOS Core — Validation Rules
 * 
 * 4 automated validation rules that the system runs to decide
 * if an agent output can proceed.
 */

import type { EvidenceType } from './evidence-taxonomy.js';

export type ValidationRuleId =
    | 'VAL_PACK_SEPARATION'
    | 'VAL_EVIDENCE_MINIMUM'
    | 'VAL_GUARDIAN_PASS_REQUIRED'
    | 'VAL_RELEASE_GATED';

export interface ValidationRule {
    id: ValidationRuleId;
    name: string;
    rule: string;
    severity: 'error' | 'warning';
    failHard: boolean;
}

export const VALIDATION_RULES: Record<ValidationRuleId, ValidationRule> = {
    VAL_PACK_SEPARATION: {
        id: 'VAL_PACK_SEPARATION',
        name: 'Pack Separation',
        rule: 'All referenced resources and templates must match engagement jurisdiction pack',
        severity: 'error',
        failHard: true
    },
    VAL_EVIDENCE_MINIMUM: {
        id: 'VAL_EVIDENCE_MINIMUM',
        name: 'Evidence Minimum',
        rule: 'Required evidence taxonomy types must be present before final deliverables',
        severity: 'error',
        failHard: true
    },
    VAL_GUARDIAN_PASS_REQUIRED: {
        id: 'VAL_GUARDIAN_PASS_REQUIRED',
        name: 'Guardian Pass Required',
        rule: 'Any client-facing delivery requires Diane PASS',
        severity: 'error',
        failHard: true
    },
    VAL_RELEASE_GATED: {
        id: 'VAL_RELEASE_GATED',
        name: 'Release Gated',
        rule: 'Any external filing/submission requires Marco authorization + Diane PASS + policy_allows_release',
        severity: 'error',
        failHard: true
    }
};

// =============================================================================
// VALIDATION CONTEXTS
// =============================================================================

export interface PackSeparationContext {
    engagementJurisdiction: 'MT' | 'RW';
    referencedResourceIds: string[];
    referencedTemplateIds: string[];
}

export interface EvidenceMinimumContext {
    requiredTypes: EvidenceType[];
    linkedTypes: EvidenceType[];
}

export interface GuardianPassContext {
    dianeCheckResult: 'PASS' | 'FAIL' | 'PENDING';
    isClientFacing: boolean;
}

export interface ReleaseGateContext {
    marcoAuthorization: boolean;
    dianePass: boolean;
    policyAllowsRelease: boolean;
    releaseType: 'delivery' | 'filing' | 'publication';
}

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface ValidationResult {
    ruleId: ValidationRuleId;
    passed: boolean;
    message: string;
    blockedReason?: string;
}

export interface ValidationReport {
    allPassed: boolean;
    results: ValidationResult[];
    blockedReasons: string[];
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Resource scope to jurisdiction mapping
 */
const RESOURCE_JURISDICTION: Record<string, 'MT' | 'RW' | 'GLOBAL'> = {
    // Malta resources
    MBR_ANNUAL_RETURNS: 'MT',
    MFSA_CSP_RULEBOOK: 'MT',
    MALTA_CSP_ACT_CAP529: 'MT',
    MFSA_CSP_FAQS: 'MT',
    FIAU_IMPL_PROCS: 'MT',
    // Rwanda resources
    RW_LAW_NOTARY_RWANDALII: 'RW',
    RW_LAW_NOTARY_MINIJUST_PDF: 'RW',
    RW_NOTARY_AMEND_2023_PDF: 'RW'
    // Global resources implicitly allowed everywhere
};

export function validatePackSeparation(ctx: PackSeparationContext): ValidationResult {
    const violations: string[] = [];

    for (const resourceId of ctx.referencedResourceIds) {
        const resourceJurisdiction = RESOURCE_JURISDICTION[resourceId];
        if (resourceJurisdiction &&
            resourceJurisdiction !== 'GLOBAL' &&
            resourceJurisdiction !== ctx.engagementJurisdiction) {
            violations.push(`Resource ${resourceId} is ${resourceJurisdiction} but engagement is ${ctx.engagementJurisdiction}`);
        }
    }

    return {
        ruleId: 'VAL_PACK_SEPARATION',
        passed: violations.length === 0,
        message: violations.length === 0
            ? 'Pack separation validated'
            : `Pack separation violations: ${violations.join('; ')}`,
        blockedReason: violations.length > 0
            ? `FATAL: Pack mismatch detected — ${violations[0]}`
            : undefined
    };
}

export function validateEvidenceMinimum(ctx: EvidenceMinimumContext): ValidationResult {
    const linkedSet = new Set(ctx.linkedTypes);
    const missing = ctx.requiredTypes.filter(t => !linkedSet.has(t));

    return {
        ruleId: 'VAL_EVIDENCE_MINIMUM',
        passed: missing.length === 0,
        message: missing.length === 0
            ? 'Evidence minimum satisfied'
            : `Missing required evidence types: ${missing.join(', ')}`,
        blockedReason: missing.length > 0
            ? `Evidence minimum not met: ${missing.join(', ')}`
            : undefined
    };
}

export function validateGuardianPass(ctx: GuardianPassContext): ValidationResult {
    if (!ctx.isClientFacing) {
        return {
            ruleId: 'VAL_GUARDIAN_PASS_REQUIRED',
            passed: true,
            message: 'Not client-facing, guardian pass not required'
        };
    }

    const passed = ctx.dianeCheckResult === 'PASS';
    return {
        ruleId: 'VAL_GUARDIAN_PASS_REQUIRED',
        passed,
        message: passed
            ? 'Guardian (Diane) PASS received'
            : `Guardian check result: ${ctx.dianeCheckResult}`,
        blockedReason: !passed
            ? `Client-facing delivery blocked: Diane check = ${ctx.dianeCheckResult}`
            : undefined
    };
}

export function validateReleaseGate(ctx: ReleaseGateContext): ValidationResult {
    const conditions = {
        marco: ctx.marcoAuthorization,
        diane: ctx.dianePass,
        policy: ctx.policyAllowsRelease
    };

    const failed = Object.entries(conditions)
        .filter(([_, v]) => !v)
        .map(([k, _]) => k);

    const passed = failed.length === 0;

    return {
        ruleId: 'VAL_RELEASE_GATED',
        passed,
        message: passed
            ? 'Release gates satisfied'
            : `Release blocked: missing ${failed.join(', ')}`,
        blockedReason: !passed
            ? `External ${ctx.releaseType} blocked: ${failed.join(', ')} not satisfied`
            : undefined
    };
}

/**
 * Run all validation rules and return a consolidated report
 */
export function runAllValidations(contexts: {
    packSeparation?: PackSeparationContext;
    evidenceMinimum?: EvidenceMinimumContext;
    guardianPass?: GuardianPassContext;
    releaseGate?: ReleaseGateContext;
}): ValidationReport {
    const results: ValidationResult[] = [];

    if (contexts.packSeparation) {
        results.push(validatePackSeparation(contexts.packSeparation));
    }
    if (contexts.evidenceMinimum) {
        results.push(validateEvidenceMinimum(contexts.evidenceMinimum));
    }
    if (contexts.guardianPass) {
        results.push(validateGuardianPass(contexts.guardianPass));
    }
    if (contexts.releaseGate) {
        results.push(validateReleaseGate(contexts.releaseGate));
    }

    return {
        allPassed: results.every(r => r.passed),
        results,
        blockedReasons: results
            .filter(r => r.blockedReason)
            .map(r => r.blockedReason!)
    };
}
