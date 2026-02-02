/**
 * Unit tests for FirmOS Service Catalog Routing
 */

import { describe, it, expect } from 'vitest';
import {
    routeService,
    getServiceById,
    getServicesByJurisdiction,
    getAvailableServiceIds,
    requiresEscalation,
    requiresGuardianPass
} from './routing.js';
import {
    SERVICE_CATALOG,
    ALL_SERVICES
} from './service-catalog.js';

// =============================================================================
// ROUTING TESTS
// =============================================================================

describe('routeService', () => {
    describe('Malta jurisdiction routing', () => {
        it('routes malta + tax to svc_mt_tax', () => {
            const result = routeService({ jurisdiction: 'malta', service: 'tax' });
            expect(result.serviceId).toBe('svc_mt_tax');
            expect(result.service?.scope).toBe('malta');
            expect(result.error).toBeUndefined();
        });

        it('routes malta + csp to svc_mt_csp_mbr', () => {
            const result = routeService({ jurisdiction: 'malta', service: 'csp' });
            expect(result.serviceId).toBe('svc_mt_csp_mbr');
            expect(result.service?.scope).toBe('malta');
        });
    });

    describe('Rwanda jurisdiction routing', () => {
        it('routes rwanda + tax to svc_rw_tax', () => {
            const result = routeService({ jurisdiction: 'rwanda', service: 'tax' });
            expect(result.serviceId).toBe('svc_rw_tax');
            expect(result.service?.scope).toBe('rwanda');
        });

        it('routes rwanda + private_notary to svc_rw_private_notary', () => {
            const result = routeService({ jurisdiction: 'rwanda', service: 'private_notary' });
            expect(result.serviceId).toBe('svc_rw_private_notary');
            expect(result.service?.scope).toBe('rwanda');
        });
    });

    describe('Global service routing', () => {
        it('routes audit to svc_audit_assurance (no jurisdiction needed)', () => {
            const result = routeService({ service: 'audit' });
            expect(result.serviceId).toBe('svc_audit_assurance');
            expect(result.service?.scope).toBe('global');
        });

        it('routes accounting to svc_accounting_fin_reporting', () => {
            const result = routeService({ service: 'accounting' });
            expect(result.serviceId).toBe('svc_accounting_fin_reporting');
        });

        it('routes advisory to svc_advisory_consulting', () => {
            const result = routeService({ service: 'advisory' });
            expect(result.serviceId).toBe('svc_advisory_consulting');
        });

        it('routes risk_internal_audit to svc_risk_controls_internal_audit', () => {
            const result = routeService({ service: 'risk_internal_audit' });
            expect(result.serviceId).toBe('svc_risk_controls_internal_audit');
        });
    });

    describe('Priority handling', () => {
        it('jurisdiction-specific rules take precedence over global', () => {
            // Malta tax should route to svc_mt_tax, not a global service
            const result = routeService({ jurisdiction: 'malta', service: 'tax' });
            expect(result.serviceId).toBe('svc_mt_tax');
            expect(result.service?.strictPack).toBe('MT_TAX');
        });
    });

    describe('Error handling', () => {
        it('returns error for unknown service combination', () => {
            // @ts-expect-error Testing invalid input
            const result = routeService({ jurisdiction: 'malta', service: 'unknown' });
            expect(result.service).toBeNull();
            expect(result.error).toBeDefined();
        });
    });
});

// =============================================================================
// SERVICE LOOKUP TESTS
// =============================================================================

describe('getServiceById', () => {
    it('returns service for valid ID', () => {
        const service = getServiceById('svc_mt_tax');
        expect(service).toBeDefined();
        expect(service?.id).toBe('svc_mt_tax');
    });

    it('returns undefined for invalid ID', () => {
        const service = getServiceById('nonexistent_service');
        expect(service).toBeUndefined();
    });
});

describe('getServicesByJurisdiction', () => {
    it('returns only global services for global jurisdiction', () => {
        const services = getServicesByJurisdiction('global');
        expect(services.every(s => s.scope === 'global')).toBe(true);
        expect(services.length).toBe(4);
    });

    it('returns malta + global services for malta jurisdiction', () => {
        const services = getServicesByJurisdiction('malta');
        const maltaCount = services.filter(s => s.scope === 'malta').length;
        const globalCount = services.filter(s => s.scope === 'global').length;
        expect(maltaCount).toBe(2);
        expect(globalCount).toBe(4);
    });

    it('returns rwanda + global services for rwanda jurisdiction', () => {
        const services = getServicesByJurisdiction('rwanda');
        const rwandaCount = services.filter(s => s.scope === 'rwanda').length;
        const globalCount = services.filter(s => s.scope === 'global').length;
        expect(rwandaCount).toBe(2);
        expect(globalCount).toBe(4);
    });
});

describe('getAvailableServiceIds', () => {
    it('returns all service IDs when no jurisdiction specified', () => {
        const ids = getAvailableServiceIds();
        expect(ids.length).toBe(8);
    });

    it('returns correct IDs for malta', () => {
        const ids = getAvailableServiceIds('malta');
        expect(ids).toContain('svc_mt_tax');
        expect(ids).toContain('svc_mt_csp_mbr');
        expect(ids).toContain('svc_audit_assurance');
    });
});

// =============================================================================
// RELEASE CONTROL TESTS
// =============================================================================

describe('requiresEscalation', () => {
    it('returns true for ESCALATE autonomy actions', () => {
        // Malta tax submissions require escalation
        const service = getServiceById('svc_mt_tax')!;
        expect(requiresEscalation(service, 'submit_mt_tax_pack')).toBe(true);
    });

    it('returns false for AUTO_CHECK autonomy actions', () => {
        // Audit pack delivery is AUTO_CHECK, not ESCALATE
        const service = getServiceById('svc_audit_assurance')!;
        expect(requiresEscalation(service, 'deliver_audit_pack')).toBe(false);
    });

    it('returns true for unknown actions (safe default)', () => {
        const service = getServiceById('svc_mt_tax')!;
        expect(requiresEscalation(service, 'unknown_action')).toBe(true);
    });
});

describe('requiresGuardianPass', () => {
    it('returns true for actions requiring guardian_pass', () => {
        const service = getServiceById('svc_audit_assurance')!;
        expect(requiresGuardianPass(service, 'deliver_audit_pack')).toBe(true);
    });

    it('returns true for unknown actions (safe default)', () => {
        const service = getServiceById('svc_mt_tax')!;
        expect(requiresGuardianPass(service, 'unknown_action')).toBe(true);
    });
});

// =============================================================================
// CATALOG STRUCTURE TESTS
// =============================================================================

describe('SERVICE_CATALOG', () => {
    it('has correct version', () => {
        expect(SERVICE_CATALOG.version).toBe('1.0');
    });

    it('has all 8 services', () => {
        expect(SERVICE_CATALOG.services.length).toBe(8);
    });

    it('has global quality rules defined', () => {
        expect(SERVICE_CATALOG.globalQualityRules.requiredForAllServices.length).toBeGreaterThan(0);
        expect(SERVICE_CATALOG.globalQualityRules.guardianPassConditions.length).toBeGreaterThan(0);
    });

    it('has integration notes with routing rules', () => {
        expect(SERVICE_CATALOG.integrationNotes.routingRules.length).toBeGreaterThan(0);
    });
});

describe('ALL_SERVICES', () => {
    it('contains exactly 8 services', () => {
        expect(ALL_SERVICES.length).toBe(8);
    });

    it('has 4 global services', () => {
        const globalServices = ALL_SERVICES.filter(s => s.scope === 'global');
        expect(globalServices.length).toBe(4);
    });

    it('has 2 Malta services', () => {
        const maltaServices = ALL_SERVICES.filter(s => s.scope === 'malta');
        expect(maltaServices.length).toBe(2);
    });

    it('has 2 Rwanda services', () => {
        const rwandaServices = ALL_SERVICES.filter(s => s.scope === 'rwanda');
        expect(rwandaServices.length).toBe(2);
    });

    it('all services have required structure', () => {
        for (const service of ALL_SERVICES) {
            expect(service.id).toBeDefined();
            expect(service.name).toBeDefined();
            expect(service.scope).toBeDefined();
            expect(service.standardProcess.phases.length).toBeGreaterThan(0);
            expect(service.taskGraph.length).toBeGreaterThan(0);
            expect(service.escalationTriggers.length).toBeGreaterThan(0);
            expect(service.externalActions.length).toBeGreaterThan(0);
        }
    });
});

// =============================================================================
// TASK GRAPH STRUCTURE TESTS
// =============================================================================

describe('Task graph validation', () => {
    it('all tasks have valid autonomy tiers', () => {
        const validTiers = ['AUTO', 'AUTO_CHECK', 'ESCALATE'];
        for (const service of ALL_SERVICES) {
            for (const task of service.taskGraph) {
                expect(validTiers).toContain(task.autonomy);
            }
        }
    });

    it('all tasks have outputs defined', () => {
        for (const service of ALL_SERVICES) {
            for (const task of service.taskGraph) {
                expect(task.outputs.length).toBeGreaterThan(0);
            }
        }
    });

    it('all tasks have evidence defined', () => {
        for (const service of ALL_SERVICES) {
            for (const task of service.taskGraph) {
                expect(task.evidence.length).toBeGreaterThan(0);
            }
        }
    });
});
