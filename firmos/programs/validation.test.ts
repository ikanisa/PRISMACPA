/**
 * Unit tests for FirmOS Service Catalog Validation
 */

import { describe, it, expect } from 'vitest';
import {
    validateServiceDefinition,
    validateServiceCatalog,
    validateTaskNode,
    validateGlobalQualityRules,
    checkUniqueServiceIds,
    checkUniqueTaskKeys,
    checkMaltaPackConsistency,
    checkRwandaPackConsistency,
    runAllIntegrityChecks
} from './validation.js';
import {
    SERVICE_CATALOG,
    ALL_SERVICES,
    svcMtTax
} from './service-catalog.js';

// =============================================================================
// SCHEMA VALIDATION TESTS
// =============================================================================

describe('validateServiceDefinition', () => {
    it('validates a correct service definition', () => {
        const result = validateServiceDefinition(svcMtTax);
        expect(result.success).toBe(true);
        expect(result.data?.id).toBe('svc_mt_tax');
    });

    it('rejects service without svc_ prefix', () => {
        const invalid = { ...svcMtTax, id: 'invalid_mt_tax' };
        const result = validateServiceDefinition(invalid);
        expect(result.success).toBe(false);
        expect(result.errors?.issues[0].message).toContain('svc_');
    });

    it('rejects service with empty taskGraph', () => {
        const invalid = { ...svcMtTax, taskGraph: [] };
        const result = validateServiceDefinition(invalid);
        expect(result.success).toBe(false);
    });

    it('rejects service with empty phases', () => {
        const invalid = { ...svcMtTax, standardProcess: { phases: [] } };
        const result = validateServiceDefinition(invalid);
        expect(result.success).toBe(false);
    });
});

describe('validateServiceCatalog', () => {
    it('validates the complete SERVICE_CATALOG', () => {
        const result = validateServiceCatalog(SERVICE_CATALOG);
        expect(result.success).toBe(true);
    });

    it('rejects catalog with invalid version format', () => {
        const invalid = { ...SERVICE_CATALOG, version: 'v1' };
        const result = validateServiceCatalog(invalid);
        expect(result.success).toBe(false);
    });
});

describe('validateTaskNode', () => {
    it('validates a correct task node', () => {
        const task = svcMtTax.taskGraph[0];
        const result = validateTaskNode(task);
        expect(result.success).toBe(true);
    });

    it('rejects task with invalid autonomy', () => {
        const invalid = { key: 'test', autonomy: 'INVALID', outputs: ['out'], evidence: ['ev'] };
        const result = validateTaskNode(invalid);
        expect(result.success).toBe(false);
    });

    it('rejects task with empty outputs', () => {
        const invalid = { key: 'test', autonomy: 'AUTO', outputs: [], evidence: ['ev'] };
        const result = validateTaskNode(invalid);
        expect(result.success).toBe(false);
    });

    it('rejects task with empty evidence', () => {
        const invalid = { key: 'test', autonomy: 'AUTO', outputs: ['out'], evidence: [] };
        const result = validateTaskNode(invalid);
        expect(result.success).toBe(false);
    });
});

describe('validateGlobalQualityRules', () => {
    it('validates correct quality rules', () => {
        const result = validateGlobalQualityRules(SERVICE_CATALOG.globalQualityRules);
        expect(result.success).toBe(true);
    });

    it('rejects empty quality rules', () => {
        const invalid = {
            requiredForAllServices: [],
            guardianPassConditions: [],
            universalEscalationTriggers: []
        };
        const result = validateGlobalQualityRules(invalid);
        expect(result.success).toBe(false);
    });
});

// =============================================================================
// INTEGRITY CHECK TESTS
// =============================================================================

describe('checkUniqueServiceIds', () => {
    it('all service IDs are unique in ALL_SERVICES', () => {
        const result = checkUniqueServiceIds(ALL_SERVICES);
        expect(result.valid).toBe(true);
        expect(result.duplicates).toHaveLength(0);
    });

    it('detects duplicate service IDs', () => {
        const duplicated = [...ALL_SERVICES, ALL_SERVICES[0]];
        const result = checkUniqueServiceIds(duplicated);
        expect(result.valid).toBe(false);
        expect(result.duplicates).toContain(ALL_SERVICES[0].id);
    });
});

describe('checkUniqueTaskKeys', () => {
    it('all task keys are unique within each service', () => {
        for (const service of ALL_SERVICES) {
            const result = checkUniqueTaskKeys(service);
            expect(result.valid).toBe(true);
        }
    });

    it('detects duplicate task keys', () => {
        const duplicated = {
            ...svcMtTax,
            taskGraph: [...svcMtTax.taskGraph, svcMtTax.taskGraph[0]]
        };
        const result = checkUniqueTaskKeys(duplicated);
        expect(result.valid).toBe(false);
    });
});

describe('checkMaltaPackConsistency', () => {
    it('Malta services have correct strictPack prefix', () => {
        const result = checkMaltaPackConsistency(ALL_SERVICES);
        expect(result.valid).toBe(true);
    });

    it('detects Malta service with wrong pack prefix', () => {
        const malformed = [{ ...svcMtTax, strictPack: 'RW_TAX' }];
        const result = checkMaltaPackConsistency(malformed);
        expect(result.valid).toBe(false);
    });
});

describe('checkRwandaPackConsistency', () => {
    it('Rwanda services have correct strictPack prefix', () => {
        const result = checkRwandaPackConsistency(ALL_SERVICES);
        expect(result.valid).toBe(true);
    });
});

describe('runAllIntegrityChecks', () => {
    it('SERVICE_CATALOG passes all integrity checks', () => {
        const result = runAllIntegrityChecks(SERVICE_CATALOG);
        expect(result.valid).toBe(true);
    });

    it('reports failed checks correctly', () => {
        const malformed = {
            ...SERVICE_CATALOG,
            services: [...SERVICE_CATALOG.services, SERVICE_CATALOG.services[0]]
        };
        const result = runAllIntegrityChecks(malformed);
        expect(result.valid).toBe(false);
        expect(result.checks['uniqueServiceIds'].valid).toBe(false);
    });
});
