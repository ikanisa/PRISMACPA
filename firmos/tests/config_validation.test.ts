/**
 * FirmOS Config Validation Tests
 *
 * Validates all YAML catalogs against their schemas.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import {
    AgentsCatalogSchema,
    ServiceCatalogSchema,
    SkillsMatrixSchema,
    validateCatalog,
    validateAllCatalogs,
} from '../schemas/validation.js';

const CATALOGS_DIR = path.join(__dirname, '..', 'catalogs');

describe('FirmOS Config Validation', () => {
    describe('agents_catalog.yaml', () => {
        const filePath = path.join(CATALOGS_DIR, 'agents_catalog.yaml');

        it('should exist', () => {
            expect(fs.existsSync(filePath)).toBe(true);
        });

        it('should be valid YAML', () => {
            const content = fs.readFileSync(filePath, 'utf-8');
            expect(() => YAML.parse(content)).not.toThrow();
        });

        it('should pass schema validation', () => {
            const result = validateCatalog(filePath, AgentsCatalogSchema);
            if (!result.valid) {
                console.log('Validation errors:', result.errors);
            }
            expect(result.valid).toBe(true);
        });

        it('should have all 11 agents', () => {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = YAML.parse(content);

            const allAgents = [
                ...(data.governance_agents || []),
                ...(data.global_engine_agents || []),
                ...(data.malta_engine_agents || []),
                ...(data.rwanda_engine_agents || []),
            ];

            expect(allAgents.length).toBe(11);
        });
    });

    describe('service_catalog.yaml', () => {
        const filePath = path.join(CATALOGS_DIR, 'service_catalog.yaml');

        it('should exist', () => {
            expect(fs.existsSync(filePath)).toBe(true);
        });

        it('should be valid YAML', () => {
            const content = fs.readFileSync(filePath, 'utf-8');
            expect(() => YAML.parse(content)).not.toThrow();
        });

        it('should pass schema validation', () => {
            const result = validateCatalog(filePath, ServiceCatalogSchema);
            if (!result.valid) {
                console.log('Validation errors:', result.errors);
            }
            expect(result.valid).toBe(true);
        });

        it('should have 8 services (4 global + 2 malta + 2 rwanda)', () => {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = YAML.parse(content);

            expect(data.services.length).toBe(8);

            const globalServices = data.services.filter((s: { scope: string }) => s.scope === 'global');
            const maltaServices = data.services.filter((s: { scope: string }) => s.scope === 'malta');
            const rwandaServices = data.services.filter((s: { scope: string }) => s.scope === 'rwanda');

            expect(globalServices.length).toBe(4);
            expect(maltaServices.length).toBe(2);
            expect(rwandaServices.length).toBe(2);
        });

        it('should have autonomy tiers for all tasks', () => {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = YAML.parse(content);

            for (const service of data.services) {
                for (const task of service.task_graph) {
                    expect(['AUTO', 'AUTO_CHECK', 'ESCALATE']).toContain(task.autonomy);
                }
            }
        });
    });

    describe('skills_matrix.yaml', () => {
        const filePath = path.join(CATALOGS_DIR, 'skills_matrix.yaml');

        it('should exist', () => {
            expect(fs.existsSync(filePath)).toBe(true);
        });

        it('should be valid YAML', () => {
            const content = fs.readFileSync(filePath, 'utf-8');
            expect(() => YAML.parse(content)).not.toThrow();
        });

        it('should pass schema validation', () => {
            const result = validateCatalog(filePath, SkillsMatrixSchema);
            if (!result.valid) {
                console.log('Validation errors:', result.errors);
            }
            expect(result.valid).toBe(true);
        });
    });

    describe('validateAllCatalogs', () => {
        it('should validate all catalogs without errors', () => {
            const results = validateAllCatalogs(CATALOGS_DIR);

            for (const result of results) {
                if (!result.valid) {
                    console.log(`${result.catalog} errors:`, result.errors);
                }
            }

            const allValid = results.every((r) => r.valid);
            expect(allValid).toBe(true);
        });
    });
});
