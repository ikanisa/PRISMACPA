/**
 * FirmOS Agent Schema
 * 
 * Zod schemas for agent manifests and the agent service catalog.
 * Maps 11 named agents to their services, packs, outputs, and external actions.
 */

import { z } from 'zod';
import { AutonomyTier, PackId } from './service-catalog-schema.js';

// =============================================================================
// AGENT EXTERNAL ACTIONS
// =============================================================================

/** Gate types for external actions */
export const ActionGate = z.enum(['policy', 'evidence_checks', 'guardian_pass', 'policy_allows_release']);
export type ActionGate = z.infer<typeof ActionGate>;

/** An external action the agent can trigger */
export const AgentExternalAction = z.object({
    action: z.string(),
    autonomy: AutonomyTier,
    gated_by: z.array(ActionGate)
});
export type AgentExternalAction = z.infer<typeof AgentExternalAction>;

// =============================================================================
// SERVICE IDS
// =============================================================================

/** All service IDs in the FirmOS catalog */
export const ServiceId = z.enum([
    'svc_audit_assurance',
    'svc_accounting_fin_reporting',
    'svc_advisory_consulting',
    'svc_risk_controls_internal_audit',
    'svc_mt_tax',
    'svc_mt_csp_mbr',
    'svc_rw_tax',
    'svc_rw_private_notary'
]);
export type ServiceId = z.infer<typeof ServiceId>;

/** Sentinel value for agents that support all services */
export const AllServices = z.literal('ALL');
export type AllServices = z.infer<typeof AllServices>;

// =============================================================================
// AGENT MANIFEST
// =============================================================================

/** Complete agent manifest definition */
export const AgentManifest = z.object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
    primary_functions: z.array(z.string()),
    owns_services: z.array(ServiceId),
    supports_services: z.union([z.array(ServiceId), AllServices]),
    allowed_packs: z.array(PackId),
    programs: z.array(z.string()).optional(),
    outputs: z.array(z.string()),
    external_actions: z.array(AgentExternalAction)
});
export type AgentManifest = z.infer<typeof AgentManifest>;

// =============================================================================
// CATALOG LINKAGE
// =============================================================================

/** Maps services to their owning agent */
export const ServiceOwnership = z.record(ServiceId, z.string());
export type ServiceOwnership = z.infer<typeof ServiceOwnership>;

/** Governance agent roles */
export const GovernanceAgents = z.object({
    orchestrator: z.string(),
    policy_governor: z.string(),
    guardian: z.string()
});
export type GovernanceAgents = z.infer<typeof GovernanceAgents>;

/** Catalog linkage section */
export const CatalogLinkage = z.object({
    services_owned_by_agents: ServiceOwnership,
    governance_agents: GovernanceAgents
});
export type CatalogLinkage = z.infer<typeof CatalogLinkage>;

// =============================================================================
// AGENT SERVICE CATALOG
// =============================================================================

/** Complete agent service catalog */
export const AgentServiceCatalog = z.object({
    version: z.string(),
    name: z.string(),
    mode: z.literal('additive_only'),
    goal: z.string(),
    agents: z.array(AgentManifest),
    catalog_linkage: CatalogLinkage
});
export type AgentServiceCatalog = z.infer<typeof AgentServiceCatalog>;
