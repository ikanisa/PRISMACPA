/**
 * FirmOS L5 Agent Skills Matrix Tests
 * 
 * Test suite for L5 partner-level agent definitions:
 * - Proficiency validation
 * - Evidence minimum enforcement
 * - Resource scope validation
 * - Evaluation metrics
 */

import { describe, it, expect } from 'vitest';
import {
    validateAgentEvidenceMinimum,
    calculateEvidenceQualityScore,
    AGENT_EVIDENCE_MINIMUM,
} from '@firmos/policies';
import {
    ALL_L5_AGENTS,
    L5_AGENTS_BY_ID
} from '@firmos/agents';

// =============================================================================
// PROFICIENCY VALIDATION TESTS
// =============================================================================

describe('L5 Agent Proficiency Validation', () => {
    it('all L5 agents have partner-level mastery expectation', () => {
        for (const agent of ALL_L5_AGENTS) {
            expect(agent.mastery_expectation).toBe('L5');
        }
    });

    it('each L5 agent has at least 5 skills', () => {
        for (const agent of ALL_L5_AGENTS) {
            expect(agent.skills.length).toBeGreaterThanOrEqual(5);
        }
    });

    it('all skills have valid proficiency levels (L1-L5)', () => {
        const validLevels = ['L1', 'L2', 'L3', 'L4', 'L5'];
        for (const agent of ALL_L5_AGENTS) {
            for (const skill of agent.skills) {
                expect(validLevels).toContain(skill.level);
            }
        }
    });

    it('L5 agents have at least one L5 skill', () => {
        for (const agent of ALL_L5_AGENTS) {
            const hasL5Skill = agent.skills.some(s => s.level === 'L5');
            expect(hasL5Skill).toBe(true);
        }
    });
});

// =============================================================================
// EVIDENCE MINIMUM ENFORCEMENT TESTS
// =============================================================================

describe('Evidence Minimum Enforcement', () => {
    it('validateAgentEvidenceMinimum returns satisfied when all evidence present', () => {
        const result = validateAgentEvidenceMinimum('agent_aline', [
            'CLIENT_INSTRUCTION',
            'WORKPAPER_TRAIL'
        ]);
        expect(result.satisfied).toBe(true);
        expect(result.missing).toHaveLength(0);
    });

    it('validateAgentEvidenceMinimum returns missing evidence when incomplete', () => {
        const result = validateAgentEvidenceMinimum('agent_aline', [
            'CLIENT_INSTRUCTION'
            // Missing WORKPAPER_TRAIL
        ]);
        expect(result.satisfied).toBe(false);
        expect(result.missing).toContain('WORKPAPER_TRAIL');
    });

    it('all 11 agents have registered evidence requirements', () => {
        const agentIds = [
            'agent_aline', 'agent_marco', 'agent_diane', 'agent_patrick',
            'agent_sofia', 'agent_james', 'agent_fatima', 'agent_matthew',
            'agent_claire', 'agent_emmanuel', 'agent_chantal'
        ];
        for (const id of agentIds) {
            expect(AGENT_EVIDENCE_MINIMUM[id]).toBeDefined();
            expect(AGENT_EVIDENCE_MINIMUM[id].length).toBeGreaterThan(0);
        }
    });

    it('Diane requires WORKPAPER_TRAIL, LEGAL_SOURCES, and FINANCIAL_RECORDS', () => {
        const dianeRequired = AGENT_EVIDENCE_MINIMUM['agent_diane'];
        expect(dianeRequired).toContain('WORKPAPER_TRAIL');
        expect(dianeRequired).toContain('LEGAL_SOURCES');
        expect(dianeRequired).toContain('FINANCIAL_RECORDS');
    });

    it('Claire requires most evidence types (5)', () => {
        const claireRequired = AGENT_EVIDENCE_MINIMUM['agent_claire'];
        expect(claireRequired.length).toBe(5);
        expect(claireRequired).toContain('CLIENT_INSTRUCTION');
        expect(claireRequired).toContain('IDENTITY_AUTHORITY');
        expect(claireRequired).toContain('REGISTRY_EXTRACTS');
    });
});

// =============================================================================
// EVIDENCE QUALITY SCORE TESTS
// =============================================================================

describe('Evidence Quality Score Calculation', () => {
    it('returns 100 when all required evidence present', () => {
        const result = calculateEvidenceQualityScore(
            ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL'],
            ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL']
        );
        expect(result.score).toBe(100);
        expect(result.coverage).toBe(1);
        expect(result.missing).toHaveLength(0);
    });

    it('returns 50 when half of evidence present', () => {
        const result = calculateEvidenceQualityScore(
            ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS'],
            ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES']
        );
        expect(result.score).toBe(50);
        expect(result.missing).toHaveLength(2);
    });

    it('returns 0 when no required evidence present', () => {
        const result = calculateEvidenceQualityScore(
            ['CLIENT_INSTRUCTION'], // irrelevant type
            ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS']
        );
        expect(result.score).toBe(0);
        expect(result.missing).toHaveLength(2);
    });

    it('returns 100 when no evidence is required', () => {
        const result = calculateEvidenceQualityScore(
            ['FINANCIAL_RECORDS'],
            [] // no requirements
        );
        expect(result.score).toBe(100);
    });
});

// =============================================================================
// RESOURCE SCOPE VALIDATION TESTS
// =============================================================================

describe('Resource Scope Validation', () => {
    it('Malta-scoped agents include malta resource scope', () => {
        const mattL5 = L5_AGENTS_BY_ID['agent_matthew'];
        expect(mattL5.allowed_resource_scopes).toContain('malta');
    });

    it('Rwanda-scoped agents include rwanda resource scope', () => {
        const chantalL5 = L5_AGENTS_BY_ID['agent_chantal'];
        expect(chantalL5.allowed_resource_scopes).toContain('rwanda');
    });

    it('multi-jurisdiction agents have multiple scopes', () => {
        const alineL5 = L5_AGENTS_BY_ID['agent_aline'];
        expect(alineL5.allowed_resource_scopes.length).toBeGreaterThanOrEqual(2);
    });
});

// =============================================================================
// EVALUATION METRICS TESTS
// =============================================================================

describe('Agent Evaluation Metrics', () => {
    it('all L5 agents have evaluation metrics', () => {
        for (const agent of ALL_L5_AGENTS) {
            expect(agent.evaluation_metrics).toBeDefined();
            expect(agent.evaluation_metrics.length).toBeGreaterThan(0);
        }
    });

    it('Aline has delivery performance metric', () => {
        const alineL5 = L5_AGENTS_BY_ID['agent_aline'];
        const hasDeliveryMetric = alineL5.evaluation_metrics.some(
            m => m.toLowerCase().includes('delivery') || m.toLowerCase().includes('routing')
        );
        expect(hasDeliveryMetric).toBe(true);
    });

    it('Diane has guardian pass rate metric', () => {
        const dianeL5 = L5_AGENTS_BY_ID['agent_diane'];
        const hasGuardianMetric = dianeL5.evaluation_metrics.some(
            m => m.toLowerCase().includes('guardian') || m.toLowerCase().includes('pass')
        );
        expect(hasGuardianMetric).toBe(true);
    });
});

// =============================================================================
// ESCALATION RULES TESTS
// =============================================================================

describe('Agent Escalation Rules', () => {
    it('all L5 agents have escalation rules', () => {
        for (const agent of ALL_L5_AGENTS) {
            expect(agent.escalation_rules).toBeDefined();
            expect(agent.escalation_rules.length).toBeGreaterThan(0);
        }
    });

    it('Marco has release control escalation rules', () => {
        const marcoL5 = L5_AGENTS_BY_ID['agent_marco'];
        const hasReleaseRule = marcoL5.escalation_rules.some(
            r => r.toLowerCase().includes('release') || r.toLowerCase().includes('diane') || r.toLowerCase().includes('block')
        );
        expect(hasReleaseRule).toBe(true);
    });
});
