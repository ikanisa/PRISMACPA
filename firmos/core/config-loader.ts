/**
 * FirmOS Runtime Config Loader
 *
 * Loads all YAML catalogs at runtime and provides typed access.
 * Used by agents and governance modules to access configuration.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

// Resolve paths relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOGS_DIR = path.resolve(__dirname, '../catalogs');

// Types for loaded catalogs
export interface AgentConfig {
    id: string;
    name: string;
    role: string;
    domain: string;
    pack_access: string[];
    escalation_rules?: string[];
    system_prompt?: string;
}

export interface ServiceConfig {
    id: string;
    name: string;
    scope: 'global' | 'malta' | 'rwanda';
    pack_id: string;
    phases: Array<{
        id: string;
        name: string;
        tasks: Array<{
            id: string;
            owner_agent: string;
            autonomy_tier: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
            outputs: string[];
        }>;
    }>;
}

export interface SkillConfig {
    agent_id: string;
    skills: Array<{
        id: string;
        proficiency: number;
        certified: boolean;
    }>;
}

export interface ResourceConfig {
    id: string;
    type: string;
    pack_id: string;
    path: string;
    description: string;
}

export interface TemplateConfig {
    id: string;
    pack_id: string;
    version: string;
    status: string;
    author_agent: string;
}

// Main config interface
export interface FirmOSConfig {
    agents: Record<string, AgentConfig>;
    services: Record<string, ServiceConfig>;
    skills: Record<string, SkillConfig>;
    resources: ResourceConfig[];
    templates: TemplateConfig[];
}

// Cached config
let cachedConfig: FirmOSConfig | null = null;

/**
 * Load a single YAML file
 */
function loadYAML<T>(filename: string): T | null {
    const filepath = path.join(CATALOGS_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`[FirmOS] Config file not found: ${filepath}`);
        return null;
    }

    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        return YAML.parse(content) as T;
    } catch (error) {
        console.error(`[FirmOS] Failed to load ${filename}:`, error);
        return null;
    }
}

/**
 * Load all FirmOS catalogs
 */
export function loadConfig(forceReload = false): FirmOSConfig {
    if (cachedConfig && !forceReload) {
        return cachedConfig;
    }

    // Load agents catalog
    const agentsCatalog = loadYAML<{ agents: AgentConfig[] }>('agents_catalog.yaml');
    const agents: Record<string, AgentConfig> = {};
    if (agentsCatalog?.agents) {
        for (const agent of agentsCatalog.agents) {
            agents[agent.id] = agent;
        }
    }

    // Load services catalog
    const servicesCatalog = loadYAML<{ services: ServiceConfig[] }>('service_catalog.yaml');
    const services: Record<string, ServiceConfig> = {};
    if (servicesCatalog?.services) {
        for (const service of servicesCatalog.services) {
            services[service.id] = service;
        }
    }

    // Load skills matrix
    const skillsMatrix = loadYAML<{ agents: Record<string, SkillConfig> }>('skills_matrix.yaml');
    const skills: Record<string, SkillConfig> = skillsMatrix?.agents ?? {};

    // Load resources library
    const resourcesLibrary = loadYAML<{ resources: ResourceConfig[] }>('resource_library.yaml');
    const resources: ResourceConfig[] = resourcesLibrary?.resources ?? [];

    // Load templates catalog (if exists)
    const templatesCatalog = loadYAML<{ templates: TemplateConfig[] }>('template_catalog.yaml');
    const templates: TemplateConfig[] = templatesCatalog?.templates ?? [];

    cachedConfig = { agents, services, skills, resources, templates };
    return cachedConfig;
}

/**
 * Get a specific agent by ID
 */
export function getAgent(agentId: string): AgentConfig | undefined {
    return loadConfig().agents[agentId];
}

/**
 * Get a specific service by ID
 */
export function getService(serviceId: string): ServiceConfig | undefined {
    return loadConfig().services[serviceId];
}

/**
 * Get all agents for a specific domain
 */
export function getAgentsByDomain(domain: 'global' | 'malta' | 'rwanda'): AgentConfig[] {
    const config = loadConfig();
    return Object.values(config.agents).filter(a => a.domain === domain);
}

/**
 * Get services by scope (global, malta, rwanda)
 */
export function getServicesByScope(scope: 'global' | 'malta' | 'rwanda'): ServiceConfig[] {
    const config = loadConfig();
    return Object.values(config.services).filter(s => s.scope === scope);
}

/**
 * Check if an agent can access a pack
 */
export function canAccessPack(agentId: string, packId: string): boolean {
    const agent = getAgent(agentId);
    if (!agent) { return false; }
    return agent.pack_access.includes(packId) || agent.pack_access.includes('*');
}

/**
 * Clear cached config (for testing/hot reload)
 */
export function clearConfigCache(): void {
    cachedConfig = null;
}
