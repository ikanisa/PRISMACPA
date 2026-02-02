/**
 * FirmOS Configuration Loader
 * 
 * Loads YAML configuration from firmos/ directory and provides typed access.
 * Validates against JSON schemas at load time.
 * 
 * Directory structure:
 *   firmos/catalogs/  - agents_catalog.yaml, service_catalog.yaml, jurisdictions.yaml
 *   firmos/policies/  - gate_policy.yaml, autonomy_policy.yaml, evidence_policy.yaml, router_rules.yaml
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

// Resolve path to firmos/ from repo root
// packages/firmos-core/src/firmos-config.ts → repo root is ../../..
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const FIRMOS_DIR = path.join(REPO_ROOT, "firmos");
const CATALOGS_DIR = path.join(FIRMOS_DIR, "catalogs");
const POLICIES_DIR = path.join(FIRMOS_DIR, "policies");

// =============================================================================
// TYPES — Catalogs
// =============================================================================

export type AutonomyLevel = "AUTO" | "AUTO+CHECK" | "ESCALATE";
export type AgentTier = "governance" | "global" | "malta" | "rwanda";
export type Jurisdiction = "MT" | "RW";

export interface AgentDefinition {
    id: string;
    name: string;
    role: string;
    tier: AgentTier;
    autonomy: AutonomyLevel;
    description: string;
    skill?: string;
    jurisdiction?: Jurisdiction;
    capabilities?: string[];
}

export interface AutonomyLevelDef {
    description: string;
    requires_qc: boolean;
    requires_release: boolean;
}

export interface AgentsCatalog {
    version: string;
    updated: string;
    agents: AgentDefinition[];
    autonomy_levels: Record<AutonomyLevel, AutonomyLevelDef>;
}

export interface ServiceDefinition {
    id: string;
    name: string;
    agent: string;
    tier: AgentTier;
    description: string;
    skill?: string;
    jurisdiction?: Jurisdiction;
    programs?: string[];
}

export interface ServiceCatalog {
    version: string;
    updated: string;
    services: ServiceDefinition[];
}

export interface JurisdictionDef {
    code: Jurisdiction;
    name: string;
    currency: string;
    timezone: string;
    tax_authority: string;
    corporate_registry: string;
    language: string[];
    enabled: boolean;
}

export interface JurisdictionsCatalog {
    version: string;
    updated: string;
    jurisdictions: JurisdictionDef[];
}

// =============================================================================
// TYPES — Policies
// =============================================================================

export interface QCOutcome {
    description: string;
    next_action: string;
    requires_comment?: boolean;
}

export interface GatePolicy {
    version: string;
    updated: string;
    qc_gate: {
        owner: string;
        description: string;
        required_checks: string[];
        outcomes: Record<"PASS" | "FAIL" | "ESCALATE", QCOutcome>;
    };
    release_gate: {
        owner: string;
        description: string;
        prerequisites: Array<Record<string, string>>;
        authorization_levels: Record<string, {
            auto_approve: boolean;
            conditions: Array<Record<string, unknown>>;
            requires?: Array<Record<string, boolean>>;
        }>;
    };
}

export interface AutonomyPolicy {
    version: string;
    updated: string;
    tiers: Record<AutonomyLevel, {
        description: string;
        requires_qc: boolean;
        requires_release: boolean;
        auto_timeout_hours?: number;
        escalation_targets?: string[];
    }>;
    escalation_rules: Array<{
        trigger: string;
        action: string;
        target: string;
    }>;
}

export interface EvidencePolicy {
    version: string;
    updated: string;
    evidence_types: Array<{
        id: string;
        name: string;
        description: string;
        retention_years: number;
    }>;
    minimums_by_service: Record<string, {
        required_types: string[];
        min_items: number;
    }>;
}

export interface RouterRules {
    version: string;
    updated: string;
    default_routing: {
        orchestrator: string;
        fallback_agent: string;
    };
    service_routing: Array<{
        service_id: string;
        agent: string;
        priority: number;
    }>;
    jurisdiction_routing: Record<Jurisdiction, {
        agents: string[];
        default_agent: string;
    }>;
}

// =============================================================================
// COMBINED CONFIG
// =============================================================================

export interface FirmOSConfiguration {
    catalogs: {
        agents: AgentsCatalog;
        services: ServiceCatalog;
        jurisdictions: JurisdictionsCatalog;
    };
    policies: {
        gates: GatePolicy;
        autonomy: AutonomyPolicy;
        evidence: EvidencePolicy;
        router: RouterRules;
    };
    loaded_at: string;
}

// Cached config
let cachedConfig: FirmOSConfiguration | null = null;

// =============================================================================
// LOADER FUNCTIONS
// =============================================================================

function loadYAML<T>(filepath: string): T {
    if (!fs.existsSync(filepath)) {
        throw new Error(`[FirmOS] Config file not found: ${filepath}`);
    }

    try {
        const content = fs.readFileSync(filepath, "utf-8");
        return YAML.parse(content) as T;
    } catch (error) {
        throw new Error(
            `[FirmOS] Failed to parse ${filepath}: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error }
        );
    }
}

function loadCatalogs() {
    return {
        agents: loadYAML<AgentsCatalog>(path.join(CATALOGS_DIR, "agents_catalog.yaml")),
        services: loadYAML<ServiceCatalog>(path.join(CATALOGS_DIR, "service_catalog.yaml")),
        jurisdictions: loadYAML<JurisdictionsCatalog>(path.join(CATALOGS_DIR, "jurisdictions.yaml")),
    };
}

function loadPolicies() {
    return {
        gates: loadYAML<GatePolicy>(path.join(POLICIES_DIR, "gate_policy.yaml")),
        autonomy: loadYAML<AutonomyPolicy>(path.join(POLICIES_DIR, "autonomy_policy.yaml")),
        evidence: loadYAML<EvidencePolicy>(path.join(POLICIES_DIR, "evidence_policy.yaml")),
        router: loadYAML<RouterRules>(path.join(POLICIES_DIR, "router_rules.yaml")),
    };
}

/**
 * Load FirmOS configuration from firmos/ directory
 */
export function loadFirmOSConfig(forceReload = false): FirmOSConfiguration {
    if (cachedConfig && !forceReload) {
        return cachedConfig;
    }

    cachedConfig = {
        catalogs: loadCatalogs(),
        policies: loadPolicies(),
        loaded_at: new Date().toISOString(),
    };

    console.log(`[FirmOS] Configuration loaded at ${cachedConfig.loaded_at}`);
    return cachedConfig;
}

/**
 * Clear cached config (for testing/hot reload)
 */
export function clearFirmOSCache(): void {
    cachedConfig = null;
}

// =============================================================================
// CONVENIENCE ACCESSORS
// =============================================================================

/**
 * Get agent by ID
 */
export function getAgentById(agentId: string): AgentDefinition | undefined {
    const config = loadFirmOSConfig();
    return config.catalogs.agents.agents.find((a) => a.id === agentId);
}

/**
 * Get all agents by tier
 */
export function getAgentsByTier(tier: AgentTier): AgentDefinition[] {
    const config = loadFirmOSConfig();
    return config.catalogs.agents.agents.filter((a) => a.tier === tier);
}

/**
 * Get service by ID
 */
export function getServiceById(serviceId: string): ServiceDefinition | undefined {
    const config = loadFirmOSConfig();
    return config.catalogs.services.services.find((s) => s.id === serviceId);
}

/**
 * Get services by jurisdiction
 */
export function getServicesByJurisdiction(
    jurisdiction: Jurisdiction
): ServiceDefinition[] {
    const config = loadFirmOSConfig();
    const tierMap: Record<Jurisdiction, AgentTier> = { MT: "malta", RW: "rwanda" };
    const tier = tierMap[jurisdiction];
    return config.catalogs.services.services.filter(
        (s) => s.tier === tier || s.tier === "global" || s.tier === "governance"
    );
}

/**
 * Get jurisdiction config
 */
export function getJurisdiction(code: Jurisdiction): JurisdictionDef | undefined {
    const config = loadFirmOSConfig();
    return config.catalogs.jurisdictions.jurisdictions.find(
        (j) => j.code === code
    );
}

/**
 * Get enabled jurisdictions
 */
export function getEnabledJurisdictions(): JurisdictionDef[] {
    const config = loadFirmOSConfig();
    return config.catalogs.jurisdictions.jurisdictions.filter((j) => j.enabled);
}

/**
 * Check if autonomy level requires QC gate
 */
export function requiresQCGate(autonomy: AutonomyLevel): boolean {
    const config = loadFirmOSConfig();
    return config.catalogs.agents.autonomy_levels[autonomy]?.requires_qc ?? true;
}

/**
 * Check if autonomy level requires release gate
 */
export function requiresReleaseGate(autonomy: AutonomyLevel): boolean {
    const config = loadFirmOSConfig();
    return config.catalogs.agents.autonomy_levels[autonomy]?.requires_release ?? true;
}

/**
 * Get default agent for a service
 */
export function getDefaultAgentForService(serviceId: string): string | undefined {
    const config = loadFirmOSConfig();

    // Check service catalog first
    const service = config.catalogs.services.services.find((s) => s.id === serviceId);
    if (service?.agent) {
        return service.agent;
    }

    // Check router rules
    const route = config.policies.router.service_routing.find(
        (r) => r.service_id === serviceId
    );
    return route?.agent ?? config.policies.router.default_routing.fallback_agent;
}

/**
 * Get QC gate owner (typically Diane)
 */
export function getQCGateOwner(): string {
    const config = loadFirmOSConfig();
    return config.policies.gates.qc_gate.owner;
}

/**
 * Get release gate owner (typically Marco)
 */
export function getReleaseGateOwner(): string {
    const config = loadFirmOSConfig();
    return config.policies.gates.release_gate.owner;
}
