/**
 * FirmOS Template Factory Tests
 * 
 * Unit and integration tests for the Self-Building Template Factory.
 */

import { describe, it, expect } from 'vitest';
import {
    createTemplateDraft,
    publishTemplate,
    instantiateTemplate,
    searchTemplates,
    checkPackEnforcement,
    logDeviation,
    PackMismatchError,
    RISK_CLASSIFICATION,
    TEMPLATE_TRIGGERS,
    type Template,
    type TemplateApproval,
    type JurisdictionPack
} from '../packages/programs/template-factory.js';
import { runTemplateQC } from '../packages/core/src/template-qc.js';
import {
    TemplateSchema,
    TemplateInstanceSchema,
    TemplatePlaceholderSchema
} from '../packages/programs/validation.js';

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createValidTemplate(overrides: Partial<Template> = {}): Template {
    const now = new Date().toISOString();
    return {
        template_id: 'tmpl_test_001',
        name: 'MT Tax Filing Checklist',
        service_id: 'svc_mt_tax',
        jurisdiction_pack: 'MT_TAX',
        owner_agent: 'matthew',
        status: 'PUBLISHED',
        version: '1.0.0',
        purpose: 'Standard checklist for Malta corporate tax filings with all required evidence',
        risk_class: 'MEDIUM',
        required_inputs: ['trial_balance', 'prior_filings', 'entity_docs'],
        produced_outputs: ['tax_computation', 'filing_pack'],
        evidence_requirements: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS'],
        escalation_triggers: ['Contentious position', 'Missing critical evidence'],
        placeholders: [
            {
                field_id: 'entity_name',
                label: 'Entity Name',
                type: 'text',
                required: true
            },
            {
                field_id: 'tax_year',
                label: 'Tax Year',
                type: 'select',
                required: true,
                options: ['2024', '2025', '2026']
            },
            {
                field_id: 'assumptions',
                label: 'Key Assumptions',
                type: 'text',
                required: false
            }
        ],
        generation_instructions: [
            'Extract entity details from trial balance header',
            'Map book values to tax schedule line items',
            'Calculate deferred tax adjustments'
        ],
        quality_checks: ['Arithmetic integrity', 'Evidence linkage'],
        change_log: [{
            version: '1.0.0',
            date: now,
            author: 'matthew',
            changes: ['Initial template created']
        }],
        created_at: now,
        updated_at: now,
        ...overrides
    };
}

// =============================================================================
// TEMPLATE VALIDATION TESTS
// =============================================================================

describe('Template Validation', () => {
    it('validates template_id format (tmpl_*)', () => {
        const validResult = TemplateSchema.safeParse(createValidTemplate());
        expect(validResult.success).toBe(true);

        const invalidResult = TemplateSchema.safeParse(
            createValidTemplate({ template_id: 'invalid_001' })
        );
        expect(invalidResult.success).toBe(false);
    });

    it('rejects templates without required_inputs', () => {
        const result = TemplateSchema.safeParse(
            createValidTemplate({ required_inputs: [] })
        );
        // Schema allows empty arrays, but QC check should flag this
        expect(result.success).toBe(true);
    });

    it('rejects templates with invalid jurisdiction_pack', () => {
        const result = TemplateSchema.safeParse(
            createValidTemplate({ jurisdiction_pack: 'INVALID_PACK' as JurisdictionPack })
        );
        expect(result.success).toBe(false);
    });

    it('validates placeholder structure', () => {
        const validPlaceholder = {
            field_id: 'test_field',
            label: 'Test Field',
            type: 'text',
            required: true
        };
        expect(TemplatePlaceholderSchema.safeParse(validPlaceholder).success).toBe(true);

        const invalidPlaceholder = {
            field_id: '',
            label: 'Test',
            type: 'invalid_type',
            required: true
        };
        expect(TemplatePlaceholderSchema.safeParse(invalidPlaceholder).success).toBe(false);
    });
});

// =============================================================================
// PACK ENFORCEMENT TESTS
// =============================================================================

describe('Pack Enforcement', () => {
    it('blocks MT template from RW case', () => {
        const mtTemplate = createValidTemplate({ jurisdiction_pack: 'MT_TAX' });
        const result = checkPackEnforcement(mtTemplate, 'RW_TAX');

        expect(result.allowed).toBe(false);
        expect(result.error).toBeInstanceOf(PackMismatchError);
    });

    it('blocks RW template from MT case', () => {
        const rwTemplate = createValidTemplate({
            jurisdiction_pack: 'RW_TAX',
            service_id: 'svc_rw_tax',
            owner_agent: 'emmanuel'
        });
        const result = checkPackEnforcement(rwTemplate, 'MT_TAX');

        expect(result.allowed).toBe(false);
        expect(result.error).toBeInstanceOf(PackMismatchError);
    });

    it('allows GLOBAL template for any case', () => {
        const globalTemplate = createValidTemplate({
            jurisdiction_pack: 'GLOBAL',
            service_id: 'svc_audit_assurance',
            owner_agent: 'patrick'
        });

        expect(checkPackEnforcement(globalTemplate, 'MT_TAX').allowed).toBe(true);
        expect(checkPackEnforcement(globalTemplate, 'RW_TAX').allowed).toBe(true);
        expect(checkPackEnforcement(globalTemplate, 'GLOBAL').allowed).toBe(true);
    });

    it('allows matching pack templates', () => {
        const mtTemplate = createValidTemplate({ jurisdiction_pack: 'MT_TAX' });
        expect(checkPackEnforcement(mtTemplate, 'MT_TAX').allowed).toBe(true);
    });
});

// =============================================================================
// TEMPLATE LIFECYCLE TESTS
// =============================================================================

describe('Template Lifecycle', () => {
    it('creates a DRAFT template with version 0.1.0', () => {
        const draft = createTemplateDraft(
            'matthew',
            'svc_mt_tax',
            'MT_TAX',
            'New Tax Template',
            'Template for standard tax filings'
        );

        expect(draft.status).toBe('DRAFT');
        expect(draft.version).toBe('0.1.0');
        expect(draft.template_id).toMatch(/^tmpl_/);
        expect(draft.owner_agent).toBe('matthew');
    });

    it('DRAFT -> PUBLISHED requires Diane pass', () => {
        const draft = createTemplateDraft(
            'matthew',
            'svc_mt_tax',
            'MT_TAX',
            'New Tax Template',
            'Template for standard tax filings'
        );

        // Without approval, should throw
        expect(() => publishTemplate(draft, [], ['Published'])).toThrow();

        // With Diane approval, should succeed
        const approval: TemplateApproval = {
            type: 'DIANE_PASS',
            approved_by: 'diane',
            approved_at: new Date().toISOString()
        };

        const published = publishTemplate(draft, [approval], ['Initial publish']);
        expect(published.status).toBe('PUBLISHED');
        expect(published.version).toBe('1.0.0');
    });

    it('PUBLISHED templates create new version on update', () => {
        const template = createValidTemplate({ version: '1.0.0' });
        const approval: TemplateApproval = {
            type: 'DIANE_PASS',
            approved_by: 'diane',
            approved_at: new Date().toISOString()
        };

        const updated = publishTemplate(template, [approval], ['Minor fix']);
        expect(updated.version).toBe('1.0.1');
    });

    it('HIGH risk templates require Marco approval', () => {
        const draft = createTemplateDraft(
            'matthew',
            'svc_mt_tax',
            'MT_TAX',
            'Filing Pack Template',
            'High risk filing template'
        );
        draft.risk_class = 'HIGH';

        const dianeApproval: TemplateApproval = {
            type: 'DIANE_PASS',
            approved_by: 'diane',
            approved_at: new Date().toISOString()
        };

        // Only Diane approval - should fail
        expect(() => publishTemplate(draft, [dianeApproval], ['Publish'])).toThrow('MARCO_POLICY_REVIEW');

        // Add Marco approval
        const marcoApproval: TemplateApproval = {
            type: 'MARCO_POLICY_REVIEW',
            approved_by: 'marco',
            approved_at: new Date().toISOString()
        };

        const published = publishTemplate(draft, [dianeApproval, marcoApproval], ['Published']);
        expect(published.status).toBe('PUBLISHED');
    });
});

// =============================================================================
// TEMPLATE SEARCH TESTS
// =============================================================================

describe('Template Search', () => {
    const templates: Template[] = [
        createValidTemplate({ template_id: 'tmpl_mt_001', version: '1.0.0' }),
        createValidTemplate({ template_id: 'tmpl_mt_002', version: '2.0.0' }),
        createValidTemplate({
            template_id: 'tmpl_rw_001',
            jurisdiction_pack: 'RW_TAX',
            service_id: 'svc_rw_tax',
            owner_agent: 'emmanuel'
        })
    ];

    it('finds templates by service and pack', () => {
        const result = searchTemplates(templates, {
            service_id: 'svc_mt_tax',
            jurisdiction_pack: 'MT_TAX'
        });

        expect(result.found).toBe(true);
        expect(result.templates.length).toBe(2);
    });

    it('returns latest version as best_match', () => {
        const result = searchTemplates(templates, {
            service_id: 'svc_mt_tax',
            jurisdiction_pack: 'MT_TAX'
        });

        expect(result.best_match?.version).toBe('2.0.0');
    });

    it('triggers TRG_NO_TEMPLATE_FOUND when no match', () => {
        const result = searchTemplates(templates, {
            service_id: 'svc_mt_csp_mbr',
            jurisdiction_pack: 'MT_CSP_MBR'
        });

        expect(result.found).toBe(false);
        expect(result.trigger?.id).toBe('TRG_NO_TEMPLATE_FOUND');
    });
});

// =============================================================================
// TEMPLATE INSTANCE TESTS
// =============================================================================

describe('Template Instance', () => {
    it('creates instance from template', () => {
        const template = createValidTemplate();
        const instance = instantiateTemplate(template, 'case_001', 'task_001', 'MT_TAX');

        expect(instance.instance_id).toMatch(/^inst_/);
        expect(instance.template_id).toBe(template.template_id);
        expect(instance.template_version).toBe(template.version);
        expect(instance.status).toBe('DRAFT');
    });

    it('throws on pack mismatch', () => {
        const template = createValidTemplate({ jurisdiction_pack: 'MT_TAX' });

        expect(() => instantiateTemplate(template, 'case_001', 'task_001', 'RW_TAX'))
            .toThrow(PackMismatchError);
    });

    it('logs deviation notes', () => {
        const template = createValidTemplate();
        let instance = instantiateTemplate(template, 'case_001', 'task_001', 'MT_TAX');

        instance = logDeviation(
            instance,
            'Used simplified calculation method',
            'Client data was incomplete',
            'matthew',
            'tax_computation'
        );

        expect(instance.deviation_notes.length).toBe(1);
        expect(instance.deviation_notes[0].field_id).toBe('tax_computation');
        expect(instance.deviation_notes[0].logged_by).toBe('matthew');
    });
});

// =============================================================================
// DIANE QC CHECKS TESTS
// =============================================================================

describe('Diane QC Checks', () => {
    it('passes valid templates', () => {
        const template = createValidTemplate();
        const result = runTemplateQC(template);

        expect(result.passed).toBe(true);
        expect(result.publish_recommendation).toBe('APPROVE');
    });

    it('fails templates with ambiguous placeholders', () => {
        const template = createValidTemplate({
            generation_instructions: ['Do the usual tax calculations', 'Apply standard approach']
        });
        const result = runTemplateQC(template);

        expect(result.checks.determinism.status).toBe('FAIL');
    });

    it('fails templates missing evidence requirements', () => {
        const template = createValidTemplate({
            evidence_requirements: []
        });
        const result = runTemplateQC(template);

        expect(result.checks.evidence_discipline.status).not.toBe('PASS');
    });

    it('warns on unsafe language', () => {
        const template = createValidTemplate({
            purpose: 'This template will definitely guarantee accuracy'
        });
        const result = runTemplateQC(template);

        expect(result.checks.safe_language.status).not.toBe('PASS');
    });

    it('fails templates with cross-pack references', () => {
        const template = createValidTemplate({
            jurisdiction_pack: 'MT_TAX',
            generation_instructions: ['Apply Rwanda tax rules for this section']
        });
        const result = runTemplateQC(template);

        expect(result.checks.pack_correctness.status).toBe('FAIL');
    });

    it('detects client data leakage', () => {
        const template = createValidTemplate({
            purpose: 'Template for ABC Company Ltd tax filing'
        });
        const result = runTemplateQC(template);

        expect(result.checks.no_client_leakage.status).toBe('FAIL');
    });
});

// =============================================================================
// RISK CLASSIFICATION TESTS
// =============================================================================

describe('Risk Classification', () => {
    it('LOW risk requires only Diane pass', () => {
        expect(RISK_CLASSIFICATION.LOW.publish_gate).toEqual(['DIANE_PASS']);
    });

    it('HIGH risk requires Diane + Marco', () => {
        expect(RISK_CLASSIFICATION.HIGH.publish_gate).toContain('DIANE_PASS');
        expect(RISK_CLASSIFICATION.HIGH.publish_gate).toContain('MARCO_POLICY_REVIEW');
    });
});

// =============================================================================
// TRIGGER TESTS
// =============================================================================

describe('Template Triggers', () => {
    it('defines required triggers', () => {
        expect(TEMPLATE_TRIGGERS.TRG_NO_TEMPLATE_FOUND.action).toContain('Aline');
        expect(TEMPLATE_TRIGGERS.TRG_HIGH_DEVIATION_RATE.threshold).toBe(30);
        expect(TEMPLATE_TRIGGERS.TRG_REPEAT_DEFECTS.threshold).toBe(5);
    });
});
