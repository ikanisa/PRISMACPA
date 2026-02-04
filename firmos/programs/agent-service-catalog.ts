/**
 * FirmOS Agent Service Catalog — Who Offers What
 * 
 * Maps each named agent to the services they provide/own, the programs they run,
 * the country packs they are allowed to use, the outputs they produce, and the
 * external actions they can trigger (always gated by policy + guardian).
 */

import type { AgentServiceCatalog } from '../../apps/api/src/schemas/agent-schema.js';
import { agentAline } from '../agents/aline.js';
import { agentMarco } from '../agents/marco.js';
import { agentDiane } from '../agents/diane.js';
import { agentPatrick } from '../agents/patrick.js';
import { agentSofia } from '../agents/sofia.js';
import { agentJames } from '../agents/james.js';
import { agentFatima } from '../agents/fatima.js';
import { agentMatthew } from '../agents/matthew.js';
import { agentClaire } from '../agents/claire.js';
import { agentEmmanuel } from '../agents/emmanuel.js';
import { agentChantal } from '../agents/chantal.js';

/**
 * Complete FirmOS Agent Service Catalog
 * 
 * Version 1.0 — Maps 11 agents to services, packs, outputs, and external actions.
 */
export const AGENT_SERVICE_CATALOG: AgentServiceCatalog = {
    version: '1.0',
    name: 'FirmOS Agent Service Catalog — Who Offers What (YAML)',
    mode: 'additive_only',
    goal: `Map each named agent to the services they provide/own, the programs they run,
the country packs they are allowed to use, the outputs they produce, and the
external actions they can trigger (always gated by policy + guardian).`,
    agents: [
        agentAline,
        agentMarco,
        agentDiane,
        agentPatrick,
        agentSofia,
        agentJames,
        agentFatima,
        agentMatthew,
        agentClaire,
        agentEmmanuel,
        agentChantal
    ],
    catalog_linkage: {
        services_owned_by_agents: {
            svc_audit_assurance: 'Patrick',
            svc_accounting_fin_reporting: 'Sofia',
            svc_advisory_consulting: 'James',
            svc_risk_controls_internal_audit: 'Fatima',
            svc_mt_tax: 'Matthew',
            svc_mt_csp_mbr: 'Claire',
            svc_rw_tax: 'Emmanuel',
            svc_rw_private_notary: 'Chantal'
        },
        governance_agents: {
            orchestrator: 'Aline',
            policy_governor: 'Marco',
            guardian: 'Diane'
        }
    }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the agent who owns a specific service
 */
export function getServiceOwner(serviceId: string): string | undefined {
    return AGENT_SERVICE_CATALOG.catalog_linkage.services_owned_by_agents[
        serviceId as keyof typeof AGENT_SERVICE_CATALOG.catalog_linkage.services_owned_by_agents
    ];
}

/**
 * Get an agent manifest by ID
 */
export function getAgentById(agentId: string) {
    return AGENT_SERVICE_CATALOG.agents.find(a => a.id === agentId);
}

/**
 * Get all agents that can work with a specific pack
 */
export function getAgentsByPack(packId: string) {
    return AGENT_SERVICE_CATALOG.agents.filter(a =>
        a.allowed_packs.includes(packId as never)
    );
}
