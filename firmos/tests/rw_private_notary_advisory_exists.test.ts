/**
 * FirmOS Rwanda Private Notary Advisory Tests
 * 
 * Verifies RW Private Notary pack has all 3 required modules:
 * 1. Legal Advisory
 * 2. Document Factory
 * 3. Execution Support
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

describe('RW Private Notary Advisory Exists', () => {
    const packPath = join(__dirname, '../packages/packs/rwanda/rw_private_notary/pack.yaml');
    let pack: any;

    beforeAll(() => {
        const content = readFileSync(packPath, 'utf-8');
        pack = parse(content);
    });

    describe('Pack metadata', () => {
        it('Has correct pack_id', () => {
            expect(pack.pack_id).toBe('rw_private_notary');
        });

        it('Has correct jurisdiction', () => {
            expect(pack.jurisdiction).toBe('RW');
        });
    });

    describe('Required modules exist', () => {
        it('Has Legal Advisory module', () => {
            expect(pack.modules).toHaveProperty('legal_advisory');
            expect(pack.modules.legal_advisory.name).toBe('Legal Advisory');
        });

        it('Has Document Factory module', () => {
            expect(pack.modules).toHaveProperty('document_factory');
            expect(pack.modules.document_factory.name).toBe('Document Factory');
        });

        it('Has Execution Support module', () => {
            expect(pack.modules).toHaveProperty('execution_support');
            expect(pack.modules.execution_support.name).toBe('Execution Support');
        });
    });

    describe('Legal Advisory workflows', () => {
        it('Has legal_opinion workflow', () => {
            expect(pack.modules.legal_advisory.workflows).toHaveProperty('legal_opinion');
        });

        it('Has risk_assessment workflow', () => {
            expect(pack.modules.legal_advisory.workflows).toHaveProperty('risk_assessment');
        });
    });

    describe('Document Factory workflows', () => {
        it('Has contract_drafting workflow', () => {
            expect(pack.modules.document_factory.workflows).toHaveProperty('contract_drafting');
        });

        it('Has company_formation workflow', () => {
            expect(pack.modules.document_factory.workflows).toHaveProperty('company_formation');
        });
    });

    describe('Execution Support workflows', () => {
        it('Has signing_coordination workflow', () => {
            expect(pack.modules.execution_support.workflows).toHaveProperty('signing_coordination');
        });

        it('Has notarization_support workflow', () => {
            expect(pack.modules.execution_support.workflows).toHaveProperty('notarization_support');
        });

        it('Has matter_archival workflow', () => {
            expect(pack.modules.execution_support.workflows).toHaveProperty('matter_archival');
        });
    });

    describe('Constraints', () => {
        it('Has no notarization automation constraint', () => {
            expect(pack.constraints.no_notarization_automation).toBe(true);
        });

        it('Has human execution constraint', () => {
            expect(pack.constraints.human_execution).toBe(true);
        });

        it('Has lawyer sign-off required', () => {
            expect(pack.constraints.lawyer_sign_off_required).toBe(true);
        });
    });
});
