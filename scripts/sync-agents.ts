import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(REPO_ROOT, 'firmos/agents');
const CATALOG_PATH = path.join(REPO_ROOT, 'firmos/catalogs/agents_catalog.yaml');
const RUNTIME_DIR = path.join(REPO_ROOT, '../home/.openclaw/agents'); // Adjust if needed relative to repo

interface AgentConfig {
    id: string;
    name: string;
    title?: string;
    role: string;
    system_prompt?: string;
    allowed_packs?: string[];
    allowed_tools?: string[];
    [key: string]: any;
}

interface Catalog {
    governance_agents: AgentConfig[];
    global_engine_agents: AgentConfig[];
    malta_engine_agents: AgentConfig[];
    rwanda_engine_agents: AgentConfig[];
    [key: string]: any;
}

const AGENT_ID_MAP: Record<string, string> = {
    'agent_aline': 'firmos-orchestrator',
    'agent_marco': 'firmos-governance',
    'agent_diane': 'firmos-qc', // map diane to qc? or risk?
    'agent_patrick': 'firmos-audit',
    'agent_sofia': 'firmos-accounting',
    'agent_james': 'firmos-advisory',
    'agent_fatima': 'firmos-risk',
    'agent_matthew': 'firmos-tax',
    'agent_claire': 'firmos-csp',
    'agent_emmanuel': 'firmos-tax-rw',
    'agent_chantal': 'firmos-notary',

    // Fallback for ID mismatches (if any)
};

// Also handle the reverse mapping if needed or just iterate map
// Better: iterate catalog, find corresponding YAML file, write to mapped folder.

function loadCatalog(): Catalog {
    try {
        const content = fs.readFileSync(CATALOG_PATH, 'utf8');
        return yaml.load(content) as Catalog;
    } catch (e) {
        console.error(`Failed to load catalog from ${CATALOG_PATH}`, e);
        process.exit(1);
    }
}

function loadAgentYaml(agentId: string): Partial<AgentConfig> {
    // Try to find file matching name (e.g. aline.yaml for agent_aline)
    const shortName = agentId.replace('agent_', '');
    const filePath = path.join(SOURCE_DIR, `${shortName}.yaml`);

    if (fs.existsSync(filePath)) {
        return yaml.load(fs.readFileSync(filePath, 'utf8')) as Partial<AgentConfig>;
    }

    return {};
}

function syncAgents() {
    console.log('Starting Agent Sync...');
    console.log(`Source: ${SOURCE_DIR}`);
    console.log(`Target: ${RUNTIME_DIR}`);

    if (!fs.existsSync(RUNTIME_DIR)) {
        console.error(`Runtime directory not found: ${RUNTIME_DIR}`);
        // Optional: create it?
        // fs.mkdirSync(RUNTIME_DIR, { recursive: true });
        process.exit(1);
    }

    const catalog = loadCatalog();
    const allAgents: AgentConfig[] = [
        ...(catalog.governance_agents || []),
        ...(catalog.global_engine_agents || []),
        ...(catalog.malta_engine_agents || []),
        ...(catalog.rwanda_engine_agents || [])
    ];

    for (const agent of allAgents) {
        const runtimeName = AGENT_ID_MAP[agent.id];
        if (!runtimeName) {
            console.warn(`No runtime folder mapping for ${agent.id}. Skipping.`);
            continue;
        }

        const agentDir = path.join(RUNTIME_DIR, runtimeName, 'agent');
        if (!fs.existsSync(agentDir)) {
            console.warn(`Runtime agent dir not found: ${agentDir}. Creating...`);
            fs.mkdirSync(agentDir, { recursive: true });
        }

        const yamlConfig = loadAgentYaml(agent.id);

        // Merge Catalog config + YAML config
        // YAML takes precedence for system_prompt if defined
        // Catalog takes precedence for routing/structure
        const profile = {
            ...agent,
            ...yamlConfig,
            // Ensure specific fields required by runtime
            id: runtimeName, // Runtime usually expects its own folder name as ID or mapped ID
            name: agent.name,
            role: agent.role,
            system_prompt: yamlConfig.system_prompt || agent.system_prompt || "No prompt defined.",
            // Add extra runtime fields if needed
        };

        // Calculate can_delegate_to etc based on catalog logic?
        // For now, simple export.

        const profilePath = path.join(agentDir, 'profile.json');
        fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
        console.log(`Synced ${agent.id} -> ${runtimeName}/agent/profile.json`);
    }

    console.log('Sync Complete.');
}

syncAgents();
