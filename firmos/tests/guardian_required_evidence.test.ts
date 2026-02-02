/**
 * FirmOS Guardian Required Evidence Tests
 * 
 * Verifies Diane's quality gate checks
 */

import { describe, it, expect } from 'vitest';
import {
    runGuardianChecks,
    canRelease,
    WorkstreamContext
} from '../packages/policies/src/guardian-checks.js';

describe('Guardian Required Evidence', () => {
    describe('Required Outputs Check', () => {
        it('Passes when all required outputs are present', () => {
            const ctx: WorkstreamContext = {
                workstreamId: 'ws-1',
                packId: 'mt_tax',
                jurisdiction: 'MT',
                tasks: [
                    {
                        id: 't1',
                        name: 'Collect invoices',
                        status: 'completed',
                        required_outputs: ['invoice_register'],
                        outputs_present: ['invoice_register'],
                        required_evidence: [],
                        evidence_linked: []
                    }
                ],
                documents: [],
                metadata: {}
            };

            const report = runGuardianChecks(ctx);
            const outputCheck = report.checks.find(c => c.checkId === 'REQUIRED_OUTPUTS');
            expect(outputCheck?.passed).toBe(true);
        });

        it('Fails when required outputs are missing', () => {
            const ctx: WorkstreamContext = {
                workstreamId: 'ws-2',
                packId: 'mt_tax',
                jurisdiction: 'MT',
                tasks: [
                    {
                        id: 't1',
                        name: 'Collect invoices',
                        status: 'completed',
                        required_outputs: ['invoice_register', 'summary_report'],
                        outputs_present: ['invoice_register'], // Missing summary_report
                        required_evidence: [],
                        evidence_linked: []
                    }
                ],
                documents: [],
                metadata: {}
            };

            const report = runGuardianChecks(ctx);
            expect(report.passed).toBe(false);
        });
    });

    describe('Required Evidence Check', () => {
        it('Passes when all required evidence is linked', () => {
            const ctx: WorkstreamContext = {
                workstreamId: 'ws-3',
                packId: 'rw_tax',
                jurisdiction: 'RW',
                tasks: [
                    {
                        id: 't1',
                        name: 'Collect EBM invoices',
                        status: 'completed',
                        required_outputs: [],
                        outputs_present: [],
                        required_evidence: ['ebm_invoice_pdf', 'bank_statement'],
                        evidence_linked: ['ebm_invoice_pdf', 'bank_statement']
                    }
                ],
                documents: [],
                metadata: {}
            };

            const report = runGuardianChecks(ctx);
            const evidenceCheck = report.checks.find(c => c.checkId === 'REQUIRED_EVIDENCE');
            expect(evidenceCheck?.passed).toBe(true);
        });

        it('Fails when required evidence is missing', () => {
            const ctx: WorkstreamContext = {
                workstreamId: 'ws-4',
                packId: 'rw_tax',
                jurisdiction: 'RW',
                tasks: [
                    {
                        id: 't1',
                        name: 'Collect EBM invoices',
                        status: 'completed',
                        required_outputs: [],
                        outputs_present: [],
                        required_evidence: ['ebm_invoice_pdf', 'bank_statement'],
                        evidence_linked: ['ebm_invoice_pdf'] // Missing bank_statement
                    }
                ],
                documents: [],
                metadata: {}
            };

            expect(canRelease(ctx)).toBe(false);
        });
    });

    describe('Hash Integrity Check', () => {
        it('Passes when all document hashes match', () => {
            const ctx: WorkstreamContext = {
                workstreamId: 'ws-5',
                packId: 'mt_csp',
                jurisdiction: 'MT',
                tasks: [],
                documents: [
                    {
                        id: 'd1',
                        name: 'Annual Return',
                        status: 'approved',
                        hash: 'abc123',
                        stored_hash: 'abc123'
                    }
                ],
                metadata: {}
            };

            const report = runGuardianChecks(ctx);
            const hashCheck = report.checks.find(c => c.checkId === 'HASH_INTEGRITY');
            expect(hashCheck?.passed).toBe(true);
        });

        it('Fails when document hash mismatches', () => {
            const ctx: WorkstreamContext = {
                workstreamId: 'ws-6',
                packId: 'mt_csp',
                jurisdiction: 'MT',
                tasks: [],
                documents: [
                    {
                        id: 'd1',
                        name: 'Annual Return',
                        status: 'approved',
                        hash: 'abc123',
                        stored_hash: 'xyz789' // MISMATCH
                    }
                ],
                metadata: {}
            };

            const report = runGuardianChecks(ctx);
            expect(report.passed).toBe(false);
            expect(report.blockedReason).toContain('Hash mismatch');
        });
    });

    describe('Country Pack Mismatch Check', () => {
        it('Passes when pack matches jurisdiction', () => {
            const ctx: WorkstreamContext = {
                workstreamId: 'ws-7',
                packId: 'rw_private_notary',
                jurisdiction: 'RW',
                tasks: [],
                documents: [],
                metadata: {}
            };

            const report = runGuardianChecks(ctx);
            const packCheck = report.checks.find(c => c.checkId === 'COUNTRY_PACK_MISMATCH');
            expect(packCheck?.passed).toBe(true);
        });

        it('FAILS HARD when pack mismatches jurisdiction', () => {
            const ctx: WorkstreamContext = {
                workstreamId: 'ws-8',
                packId: 'mt_tax', // Malta pack
                jurisdiction: 'RW', // Rwanda jurisdiction - MISMATCH!
                tasks: [],
                documents: [],
                metadata: {}
            };

            const report = runGuardianChecks(ctx);
            expect(report.passed).toBe(false);
            expect(report.blockedReason).toContain('FATAL');
        });
    });
});
