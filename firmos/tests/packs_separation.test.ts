/**
 * FirmOS Pack Separation Tests
 * 
 * Verifies strict MT/RW jurisdiction separation
 */

import { describe, it, expect } from 'vitest';
import { canAgentUsePack, getAgentDomain } from '../packages/tools/src/permissions.js';

describe('Pack Separation', () => {
    describe('Malta agents cannot use Rwanda packs', () => {
        it('Matthew (MT Tax) cannot use RW packs', () => {
            expect(canAgentUsePack('matthew', 'rw_tax')).toBe(false);
            expect(canAgentUsePack('matthew', 'rw_private_notary')).toBe(false);
        });

        it('Claire (MT CSP) cannot use RW packs', () => {
            expect(canAgentUsePack('claire', 'rw_tax')).toBe(false);
            expect(canAgentUsePack('claire', 'rw_private_notary')).toBe(false);
        });
    });

    describe('Rwanda agents cannot use Malta packs', () => {
        it('Emmanuel (RW Tax) cannot use MT packs', () => {
            expect(canAgentUsePack('emmanuel', 'mt_tax')).toBe(false);
            expect(canAgentUsePack('emmanuel', 'mt_csp')).toBe(false);
        });

        it('Chantal (RW Notary) cannot use MT packs', () => {
            expect(canAgentUsePack('chantal', 'mt_tax')).toBe(false);
            expect(canAgentUsePack('chantal', 'mt_csp')).toBe(false);
        });
    });

    describe('Malta agents CAN use Malta packs', () => {
        it('Matthew can use mt_tax', () => {
            expect(canAgentUsePack('matthew', 'mt_tax')).toBe(true);
        });

        it('Claire can use mt_csp', () => {
            expect(canAgentUsePack('claire', 'mt_csp')).toBe(true);
        });
    });

    describe('Rwanda agents CAN use Rwanda packs', () => {
        it('Emmanuel can use rw_tax', () => {
            expect(canAgentUsePack('emmanuel', 'rw_tax')).toBe(true);
        });

        it('Chantal can use rw_private_notary', () => {
            expect(canAgentUsePack('chantal', 'rw_private_notary')).toBe(true);
        });
    });

    describe('Global agents can use any pack', () => {
        const globalAgents = ['aline', 'marco', 'diane', 'patrick', 'sofia', 'james', 'fatima'] as const;
        const allPacks = ['mt_tax', 'mt_csp', 'rw_tax', 'rw_private_notary'] as const;

        globalAgents.forEach(agent => {
            allPacks.forEach(pack => {
                it(`${agent} can use ${pack}`, () => {
                    expect(canAgentUsePack(agent, pack)).toBe(true);
                });
            });
        });
    });

    describe('Agent domain assignments', () => {
        it('Matthew and Claire are Malta domain', () => {
            expect(getAgentDomain('matthew')).toBe('malta');
            expect(getAgentDomain('claire')).toBe('malta');
        });

        it('Emmanuel and Chantal are Rwanda domain', () => {
            expect(getAgentDomain('emmanuel')).toBe('rwanda');
            expect(getAgentDomain('chantal')).toBe('rwanda');
        });

        it('All other agents are global domain', () => {
            expect(getAgentDomain('aline')).toBe('global');
            expect(getAgentDomain('marco')).toBe('global');
            expect(getAgentDomain('diane')).toBe('global');
        });
    });
});
