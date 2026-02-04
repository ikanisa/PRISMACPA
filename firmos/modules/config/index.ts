/**
 * FirmOS Config Loader
 * 
 * Loads and validates YAML configs from firmos/ at runtime.
 * Validates against JSON schemas in schemas/.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYAML } from "yaml";
import Ajv from "ajv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIRMOS_ROOT = join(__dirname, "..", "..", "firmos");
const SCHEMAS_ROOT = join(__dirname, "..", "..", "schemas");

// Config cache
let configCache: FirmOSConfig | null = null;

// Type definitions
export interface ServiceEntry {
    id: string;
    name: string;
    agent: string;
    tier: string;
    skill?: string;
    jurisdiction?: "MT" | "RW";
    programs?: string[];
    description?: string;
}

export interface AgentEntry {
    id: string;
    name: string;
    role: string;
    tier: string;
    autonomy: string;
    skills?: string[];
}

export interface JurisdictionEntry {
    code: string;
    name: string;
    currency: string;
    timezone: string;
}

export interface RouterRules {
    version: string;
    routing_rules: {
        by_service: Record<string, unknown>;
        by_task_type: Record<string, unknown>;
    };
    priority_rules: Record<string, unknown>;
    load_balancing: {
        enabled: boolean;
        max_concurrent_per_agent: number;
        rebalance_interval_minutes: number;
    };
}

export interface FirmOSConfig {
    catalogs: {
        services: ServiceEntry[];
        agents: AgentEntry[];
        jurisdictions: JurisdictionEntry[];
    };
    policies: {
        routerRules: RouterRules;
        gatePolicy: unknown;
        autonomyPolicy: unknown;
        evidencePolicy: unknown;
    };
    loadedAt: Date;
    valid: boolean;
}

/**
 * Load a YAML file and parse it
 */
function loadYAML<T>(relativePath: string): T {
    const fullPath = join(FIRMOS_ROOT, relativePath);
    if (!existsSync(fullPath)) {
        throw new Error(`FirmOS config not found: ${fullPath}`);
    }
    const content = readFileSync(fullPath, "utf-8");
    return parseYAML(content) as T;
}

/**
 * Load a JSON schema
 */
function loadSchema(schemaName: string): object | null {
    const fullPath = join(SCHEMAS_ROOT, `${schemaName}.schema.json`);
    if (!existsSync(fullPath)) {
        console.warn(`Schema not found: ${fullPath}`);
        return null;
    }
    const content = readFileSync(fullPath, "utf-8");
    return JSON.parse(content);
}

/**
 * Validate data against a JSON schema
 */
function validateAgainstSchema(data: unknown, schemaName: string): boolean {
    const schema = loadSchema(schemaName);
    if (!schema) {
        // No schema = pass (schema validation optional)
        return true;
    }

    // @ts-ignore - Ajv import interop issue
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid && validate.errors) {
        console.error(`Validation errors for ${schemaName}:`, validate.errors);
    }

    return !!valid;
}

/**
 * Load all FirmOS configuration files
 * Results are cached for performance
 */
export function loadFirmOSConfig(forceReload = false): FirmOSConfig {
    if (configCache && !forceReload) {
        return configCache;
    }

    // Load catalogs
    const serviceCatalog = loadYAML<{ services: ServiceEntry[] }>("catalogs/service_catalog.yaml");
    const agentsCatalog = loadYAML<{ agents: AgentEntry[] }>("catalogs/agents_catalog.yaml");
    const jurisdictions = loadYAML<{ jurisdictions: JurisdictionEntry[] }>("catalogs/jurisdictions.yaml");

    // Load policies
    const routerRules = loadYAML<RouterRules>("policies/router_rules.yaml");
    const gatePolicy = loadYAML<unknown>("policies/gate_policy.yaml");
    const autonomyPolicy = loadYAML<unknown>("policies/autonomy_policy.yaml");
    const evidencePolicy = loadYAML<unknown>("policies/evidence_policy.yaml");

    // Validate against schemas
    const serviceValid = validateAgainstSchema(serviceCatalog, "service_catalog");
    const agentValid = validateAgainstSchema(agentsCatalog, "agent");
    const policyValid = validateAgainstSchema(gatePolicy, "policy");

    const config: FirmOSConfig = {
        catalogs: {
            services: serviceCatalog.services || [],
            agents: agentsCatalog.agents || [],
            jurisdictions: jurisdictions.jurisdictions || [],
        },
        policies: {
            routerRules,
            gatePolicy,
            autonomyPolicy,
            evidencePolicy,
        },
        loadedAt: new Date(),
        valid: serviceValid && agentValid && policyValid,
    };

    configCache = config;
    return config;
}

/**
 * Clear the config cache (for hot reload)
 */
export function clearConfigCache(): void {
    configCache = null;
}

/**
 * Get a service by ID
 */
export function getService(serviceId: string): ServiceEntry | undefined {
    const config = loadFirmOSConfig();
    return config.catalogs.services.find(s => s.id === serviceId);
}

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): AgentEntry | undefined {
    const config = loadFirmOSConfig();
    return config.catalogs.agents.find(a => a.id === agentId);
}

/**
 * Get all services for a jurisdiction
 */
export function getServicesByJurisdictionConfig(jurisdiction: "MT" | "RW"): ServiceEntry[] {
    const config = loadFirmOSConfig();
    return config.catalogs.services.filter(s => s.jurisdiction === jurisdiction);
}

/**
 * Get router rules
 */
export function getRouterRules(): RouterRules {
    const config = loadFirmOSConfig();
    return config.policies.routerRules;
}
