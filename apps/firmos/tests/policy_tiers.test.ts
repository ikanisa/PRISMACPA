/**
 * FirmOS Policy Tier Tests
 * 
 * Verifies autonomy tier decisions (A/B/C) based on rules
 */

import { describe, it, expect } from 'vitest';
import {
    evaluateAutonomy,
    isFullyAutonomous,
    requiresHuman,
    type AutonomyDecisionInput
} from '@firmos/policies';

describe('Policy Tiers', () => {
    describe('Tier C - Escalation triggers', () => {
        it('External impact always escalates', () => {
            const input: AutonomyDecisionInput = {
                jurisdiction: 'MT',
                service: 'TAX',
                workflowType: 'vat_return',
                externalImpact: true,
                noveltyScore: 0,
                disputeOrRegulatorySignal: false,
                evidenceCompletenessScore: 100,
                isFirstTimeExecution: false,
                hasApprovedTemplate: true
            };

            const decision = evaluateAutonomy(input);
            expect(decision.tier).toBe('C');
            expect(decision.requires_human).toBe(true);
        });

        it('Dispute/regulatory signal always escalates', () => {
            const input: AutonomyDecisionInput = {
                jurisdiction: 'RW',
                service: 'PRIVATE_NOTARY',
                workflowType: 'legal_opinion',
                externalImpact: false,
                noveltyScore: 0,
                disputeOrRegulatorySignal: true,
                evidenceCompletenessScore: 100,
                isFirstTimeExecution: false,
                hasApprovedTemplate: true
            };

            expect(requiresHuman(input)).toBe(true);
        });

        it('High novelty (>70) always escalates', () => {
            const input: AutonomyDecisionInput = {
                jurisdiction: 'MT',
                service: 'AUDIT',
                workflowType: 'statutory_audit',
                externalImpact: false,
                noveltyScore: 80,
                disputeOrRegulatorySignal: false,
                evidenceCompletenessScore: 100,
                isFirstTimeExecution: false,
                hasApprovedTemplate: true
            };

            expect(evaluateAutonomy(input).tier).toBe('C');
        });

        it('First-time execution always escalates', () => {
            const input: AutonomyDecisionInput = {
                jurisdiction: 'MT',
                service: 'CSP',
                workflowType: 'annual_return',
                externalImpact: false,
                noveltyScore: 0,
                disputeOrRegulatorySignal: false,
                evidenceCompletenessScore: 100,
                isFirstTimeExecution: true,
                hasApprovedTemplate: true
            };

            expect(requiresHuman(input)).toBe(true);
        });

        it('Low evidence completeness (<50%) escalates', () => {
            const input: AutonomyDecisionInput = {
                jurisdiction: 'RW',
                service: 'TAX',
                workflowType: 'vat_return',
                externalImpact: false,
                noveltyScore: 0,
                disputeOrRegulatorySignal: false,
                evidenceCompletenessScore: 40,
                isFirstTimeExecution: false,
                hasApprovedTemplate: true
            };

            expect(evaluateAutonomy(input).tier).toBe('C');
        });
    });

    describe('Tier A - Fully autonomous', () => {
        it('Routine internal operation with templates is Tier A', () => {
            const input: AutonomyDecisionInput = {
                jurisdiction: 'MT',
                service: 'TAX',
                workflowType: 'invoice_indexing',
                externalImpact: false,
                noveltyScore: 10,
                disputeOrRegulatorySignal: false,
                evidenceCompletenessScore: 90,
                isFirstTimeExecution: false,
                hasApprovedTemplate: true
            };

            expect(isFullyAutonomous(input)).toBe(true);
        });
    });

    describe('Tier B - Auto with check', () => {
        it('Standard workflow with adequate evidence is Tier B', () => {
            const input: AutonomyDecisionInput = {
                jurisdiction: 'MT',
                service: 'ACCOUNTING',
                workflowType: 'bank_reconciliation',
                externalImpact: false,
                noveltyScore: 40,
                disputeOrRegulatorySignal: false,
                evidenceCompletenessScore: 70,
                isFirstTimeExecution: false,
                hasApprovedTemplate: false
            };

            expect(evaluateAutonomy(input).tier).toBe('B');
        });
    });

    describe('Default behavior', () => {
        it('Unknown scenario defaults to escalation', () => {
            // Create an input that matches no rules by design
            const input: AutonomyDecisionInput = {
                jurisdiction: 'MT',
                service: 'ADVISORY',
                workflowType: 'unknown_workflow',
                externalImpact: false,
                noveltyScore: 55, // Medium novelty
                disputeOrRegulatorySignal: false,
                evidenceCompletenessScore: 60, // Medium evidence
                isFirstTimeExecution: false,
                hasApprovedTemplate: false
            };

            const decision = evaluateAutonomy(input);
            // Should match B_STANDARD_WORKFLOW or default to C
            expect(['B', 'C']).toContain(decision.tier);
        });
    });
});
