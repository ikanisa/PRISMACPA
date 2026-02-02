/**
 * FirmOS Template Factory — Diane QC Checks
 * 
 * Quality control checks that Diane runs on templates before publishing.
 * Ensures templates are deterministic, complete, and safe for production use.
 */

// Local type definition to avoid cross-package import
// Full Template type is defined in packages/programs/template-factory.ts
import type { EvidenceType } from './evidence-taxonomy.js';

/** Jurisdiction packs (mirrors programs/template-factory.ts) */
type JurisdictionPack =
    | 'GLOBAL'
    | 'MT_TAX'
    | 'MT_CSP_MBR'
    | 'RW_TAX'
    | 'RW_PRIVATE_NOTARY';

/** Risk classification */
type RiskClassification = 'LOW' | 'MEDIUM' | 'HIGH';

/** Placeholder type (simplified for QC) */
interface TemplatePlaceholder {
    field_id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select';
    required: boolean;
    options?: string[];
}

/** Template interface (minimal for QC checks) */
export interface Template {
    template_id: string;
    name: string;
    service_id: string;
    jurisdiction_pack: JurisdictionPack;
    status: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
    version: string;
    purpose: string;
    risk_class: RiskClassification;
    required_inputs: string[];
    produced_outputs: string[];
    evidence_requirements: EvidenceType[];
    escalation_triggers: string[];
    placeholders: TemplatePlaceholder[];
    generation_instructions: string[];
    quality_checks: string[];
}

// =============================================================================
// QC CHECK RESULTS
// =============================================================================

export type CheckStatus = 'PASS' | 'FAIL' | 'WARN';

export interface CheckResult {
    check_id: string;
    name: string;
    status: CheckStatus;
    message: string;
    details?: string[];
}

export interface TemplateQCResult {
    passed: boolean;
    overall_score: number; // 0-100
    checks: {
        determinism: CheckResult;
        completeness: CheckResult;
        evidence_discipline: CheckResult;
        safe_language: CheckResult;
        pack_correctness: CheckResult;
        escalation_triggers: CheckResult;
        no_client_leakage: CheckResult;
    };
    fix_list: string[];
    publish_recommendation: 'APPROVE' | 'REJECT' | 'NEEDS_FIXES';
}

// =============================================================================
// AMBIGUOUS INSTRUCTION PATTERNS
// =============================================================================

const AMBIGUOUS_PATTERNS = [
    /do the usual/i,
    /as appropriate/i,
    /if needed/i,
    /as necessary/i,
    /standard approach/i,
    /normal process/i,
    /common practice/i,
    /generally accepted/i,
    /as per practice/i,
    /use judgment/i,
    /discretion applies/i
];

// =============================================================================
// CLIENT DATA PATTERNS (to detect leakage)
// =============================================================================

const CLIENT_DATA_PATTERNS = [
    /\b[A-Z][a-z]+ (Ltd|Limited|LLC|Inc|Corp|Company|SA|Srl|GmbH)\b/,  // Company names
    /\b[A-Z]{2}\d{6,12}\b/,  // Registration numbers
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,  // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // Emails
    /€\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/,  // Euro amounts (specific)
    /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/,  // Dollar amounts (specific)
];

// =============================================================================
// UNSAFE LANGUAGE PATTERNS
// =============================================================================

const UNSAFE_LANGUAGE_PATTERNS = [
    /guarantee(s|d)?/i,
    /certain(ly)?/i,
    /always/i,
    /never fail/i,
    /100%/i,
    /absolute(ly)?/i,
    /no risk/i,
    /risk-free/i,
    /will definitely/i,
    /assured/i
];

// =============================================================================
// INDIVIDUAL CHECK FUNCTIONS
// =============================================================================

/**
 * Check 1: Determinism
 * Templates must have clear placeholders and no ambiguous instructions.
 */
function checkDeterminism(template: Template): CheckResult {
    const issues: string[] = [];

    // Check for ambiguous patterns in generation_instructions
    for (const instruction of template.generation_instructions) {
        for (const pattern of AMBIGUOUS_PATTERNS) {
            if (pattern.test(instruction)) {
                issues.push(`Ambiguous instruction found: "${instruction.substring(0, 50)}..."`);
            }
        }
    }

    // Check placeholders have proper structure
    for (const placeholder of template.placeholders) {
        if (!placeholder.field_id || placeholder.field_id.trim() === '') {
            issues.push('Placeholder missing field_id');
        }
        if (!placeholder.label || placeholder.label.trim() === '') {
            issues.push(`Placeholder ${placeholder.field_id} missing label`);
        }
        if (placeholder.type === 'select' || placeholder.type === 'multi_select') {
            if (!placeholder.options || placeholder.options.length === 0) {
                issues.push(`Placeholder ${placeholder.field_id} is ${placeholder.type} but has no options`);
            }
        }
    }

    return {
        check_id: 'QC_DETERMINISM',
        name: 'Determinism Check',
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        message: issues.length === 0
            ? 'Template has clear, unambiguous instructions and placeholders'
            : `Found ${issues.length} determinism issues`,
        details: issues
    };
}

/**
 * Check 2: Completeness
 * Required inputs and outputs must be defined.
 */
function checkCompleteness(template: Template): CheckResult {
    const issues: string[] = [];

    if (template.required_inputs.length === 0) {
        issues.push('No required_inputs defined');
    }

    if (template.produced_outputs.length === 0) {
        issues.push('No produced_outputs defined');
    }

    if (template.placeholders.length === 0) {
        issues.push('No placeholders defined (template appears to be static)');
    }

    if (template.generation_instructions.length === 0) {
        issues.push('No generation_instructions defined');
    }

    if (!template.purpose || template.purpose.length < 20) {
        issues.push('Purpose is missing or too brief');
    }

    return {
        check_id: 'QC_COMPLETENESS',
        name: 'Completeness Check',
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        message: issues.length === 0
            ? 'Template has all required sections defined'
            : `Found ${issues.length} completeness issues`,
        details: issues
    };
}

/**
 * Check 3: Evidence Discipline
 * Each output type should list evidence minimums.
 */
function checkEvidenceDiscipline(template: Template): CheckResult {
    const issues: string[] = [];

    if (template.evidence_requirements.length === 0) {
        issues.push('No evidence_requirements defined');
    }

    // Check that outputs have corresponding evidence
    const outputToEvidenceRatio = template.evidence_requirements.length / Math.max(template.produced_outputs.length, 1);
    if (outputToEvidenceRatio < 0.5) {
        issues.push('Evidence requirements seem insufficient for the number of outputs');
    }

    return {
        check_id: 'QC_EVIDENCE_DISCIPLINE',
        name: 'Evidence Discipline Check',
        status: issues.length === 0 ? 'PASS' : (issues.length === 1 ? 'WARN' : 'FAIL'),
        message: issues.length === 0
            ? 'Evidence requirements properly defined'
            : `Found ${issues.length} evidence discipline issues`,
        details: issues
    };
}

/**
 * Check 4: Safe Language
 * No overclaiming; assumptions fields mandatory.
 */
function checkSafeLanguage(template: Template): CheckResult {
    const issues: string[] = [];
    const allText = [
        template.purpose,
        ...template.generation_instructions,
        ...template.quality_checks
    ].join(' ');

    for (const pattern of UNSAFE_LANGUAGE_PATTERNS) {
        if (pattern.test(allText)) {
            const match = allText.match(pattern);
            issues.push(`Unsafe language found: "${match?.[0]}"`);
        }
    }

    // Check for assumptions placeholder
    const hasAssumptionsField = template.placeholders.some(p =>
        p.field_id.toLowerCase().includes('assumption') ||
        p.label.toLowerCase().includes('assumption')
    );

    if (!hasAssumptionsField && template.risk_class !== 'LOW') {
        issues.push('Templates of MEDIUM/HIGH risk should have an assumptions field');
    }

    return {
        check_id: 'QC_SAFE_LANGUAGE',
        name: 'Safe Language Check',
        status: issues.length === 0 ? 'PASS' : (issues.length <= 2 ? 'WARN' : 'FAIL'),
        message: issues.length === 0
            ? 'Language is appropriately cautious and professional'
            : `Found ${issues.length} safe language issues`,
        details: issues
    };
}

/**
 * Check 5: Pack Correctness
 * Template must reference correct jurisdiction shelf only.
 */
function checkPackCorrectness(template: Template): CheckResult {
    const issues: string[] = [];
    const pack = template.jurisdiction_pack;

    // Check service_id matches pack
    if (pack.startsWith('MT_') && !template.service_id.includes('mt')) {
        // Malta pack but service doesn't seem Malta-specific - just a warning
    }
    if (pack.startsWith('RW_') && !template.service_id.includes('rw')) {
        // Rwanda pack but service doesn't seem Rwanda-specific - just a warning  
    }

    // Check for cross-pack references in instructions
    const allText = template.generation_instructions.join(' ').toLowerCase();

    if (pack.startsWith('MT_')) {
        if (allText.includes('rwanda') || allText.includes('rw_')) {
            issues.push('Malta template references Rwanda content');
        }
    }
    if (pack.startsWith('RW_')) {
        if (allText.includes('malta') || allText.includes('mt_')) {
            issues.push('Rwanda template references Malta content');
        }
    }

    return {
        check_id: 'QC_PACK_CORRECTNESS',
        name: 'Pack Correctness Check',
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        message: issues.length === 0
            ? 'Template properly scoped to its jurisdiction pack'
            : `Found ${issues.length} pack correctness issues`,
        details: issues
    };
}

/**
 * Check 6: Escalation Triggers
 * Present and sensible for risk class.
 */
function checkEscalationTriggers(template: Template): CheckResult {
    const issues: string[] = [];

    if (template.escalation_triggers.length === 0) {
        issues.push('No escalation_triggers defined');
    }

    // Higher risk templates should have more escalation triggers
    const minTriggers = template.risk_class === 'HIGH' ? 3
        : template.risk_class === 'MEDIUM' ? 2 : 1;

    if (template.escalation_triggers.length < minTriggers) {
        issues.push(`${template.risk_class} risk templates should have at least ${minTriggers} escalation triggers`);
    }

    return {
        check_id: 'QC_ESCALATION_TRIGGERS',
        name: 'Escalation Triggers Check',
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        message: issues.length === 0
            ? 'Escalation triggers properly defined for risk level'
            : `Found ${issues.length} escalation trigger issues`,
        details: issues
    };
}

/**
 * Check 7: No Client Data Leakage
 * Template body must not contain client-specific information.
 */
function checkNoClientLeakage(template: Template): CheckResult {
    const issues: string[] = [];

    const allText = [
        template.name,
        template.purpose,
        ...template.generation_instructions,
        ...template.quality_checks,
        ...template.placeholders.map(p => p.label)
    ].join(' ');

    for (const pattern of CLIENT_DATA_PATTERNS) {
        if (pattern.test(allText)) {
            const match = allText.match(pattern);
            issues.push(`Possible client data found: "${match?.[0]}"`);
        }
    }

    return {
        check_id: 'QC_NO_CLIENT_LEAKAGE',
        name: 'No Client Data Leakage Check',
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        message: issues.length === 0
            ? 'Template contains no client-specific data'
            : `Found ${issues.length} potential client data leakage issues`,
        details: issues
    };
}

// =============================================================================
// MAIN QC FUNCTION
// =============================================================================

/**
 * Run all QC checks on a template
 */
export function runTemplateQC(template: Template): TemplateQCResult {
    const checks = {
        determinism: checkDeterminism(template),
        completeness: checkCompleteness(template),
        evidence_discipline: checkEvidenceDiscipline(template),
        safe_language: checkSafeLanguage(template),
        pack_correctness: checkPackCorrectness(template),
        escalation_triggers: checkEscalationTriggers(template),
        no_client_leakage: checkNoClientLeakage(template)
    };

    // Calculate score
    const checkList = Object.values(checks);
    const passCount = checkList.filter(c => c.status === 'PASS').length;
    const warnCount = checkList.filter(c => c.status === 'WARN').length;
    const failCount = checkList.filter(c => c.status === 'FAIL').length;

    const score = Math.round(
        ((passCount * 100) + (warnCount * 50)) / checkList.length
    );

    // Collect fix list
    const fix_list = checkList
        .filter(c => c.status !== 'PASS')
        .flatMap(c => c.details || [c.message]);

    // Determine recommendation
    let publish_recommendation: 'APPROVE' | 'REJECT' | 'NEEDS_FIXES';
    if (failCount === 0 && warnCount <= 2) {
        publish_recommendation = 'APPROVE';
    } else if (failCount === 0) {
        publish_recommendation = 'NEEDS_FIXES';
    } else {
        publish_recommendation = 'REJECT';
    }

    return {
        passed: failCount === 0,
        overall_score: score,
        checks,
        fix_list,
        publish_recommendation
    };
}

/**
 * Get a summary string of QC results
 */
export function getQCSummary(result: TemplateQCResult): string {
    const { passed, overall_score, publish_recommendation, fix_list } = result;

    let summary = `QC Result: ${publish_recommendation} (Score: ${overall_score}/100)\n`;

    if (!passed) {
        summary += `\nFixes Required:\n${fix_list.map(f => `  - ${f}`).join('\n')}`;
    }

    return summary;
}
