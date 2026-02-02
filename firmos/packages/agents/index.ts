/**
 * FirmOS Agents — Barrel Export
 * 
 * Re-exports all 11 agent manifests for easy consumption.
 */

// Governance agents
export { agentAline } from './aline.js';
export { agentMarco } from './marco.js';
export { agentDiane } from './diane.js';

// Global engine agents
export { agentPatrick } from './patrick.js';
export { agentSofia } from './sofia.js';
export { agentJames } from './james.js';
export { agentFatima } from './fatima.js';

// Malta engine agents
export { agentMatthew } from './matthew.js';
export { agentClaire } from './claire.js';

// Rwanda engine agents
export { agentEmmanuel } from './emmanuel.js';
export { agentChantal } from './chantal.js';

// L5 Partner-level agents (enhanced manifests)
export {
    agentAlineL5,
    agentMarcoL5,
    agentDianeL5,
    agentPatrickL5,
    agentSofiaL5,
    agentJamesL5,
    agentFatimaL5,
    agentMatthewL5,
    agentClaireL5,
    agentEmmanuelL5,
    agentChantalL5,
    ALL_L5_AGENTS,
    L5_AGENTS_BY_ID
} from './l5-agents.js';

// Types and schemas
export * from './types.js';

// System prompts
export {
    SYSTEM_PROMPT_ALINE,
    SYSTEM_PROMPT_MARCO,
    SYSTEM_PROMPT_DIANE,
    SYSTEM_PROMPT_PATRICK,
    SYSTEM_PROMPT_SOFIA,
    SYSTEM_PROMPT_JAMES,
    SYSTEM_PROMPT_FATIMA,
    SYSTEM_PROMPT_MATTHEW,
    SYSTEM_PROMPT_CLAIRE,
    SYSTEM_PROMPT_EMMANUEL,
    SYSTEM_PROMPT_CHANTAL,
    AGENT_SYSTEM_PROMPTS,
    SHARED_RESPONSE_SCHEMA,
    SHARED_NON_NEGOTIABLES,
    getAgentSystemPrompt,
    getAgentIds
} from './system-prompts.js';
export type { AgentId } from './system-prompts.js';

// All agents array
export const ALL_AGENTS = [
    // Governance
    'agentAline',
    'agentMarco',
    'agentDiane',
    // Global engines
    'agentPatrick',
    'agentSofia',
    'agentJames',
    'agentFatima',
    // Malta engines
    'agentMatthew',
    'agentClaire',
    // Rwanda engines
    'agentEmmanuel',
    'agentChantal'
] as const;
