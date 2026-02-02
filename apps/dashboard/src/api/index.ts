/**
 * FirmOS Dashboard API
 * 
 * Re-exports all API modules for easy access.
 */

export { GatewayClient, getGateway, initGateway } from './gateway';
export type { GatewayClientOptions, GatewayEventFrame, GatewayHelloOk } from './gateway';

export { loadAgents } from './agents';
export type { AgentCardData, AgentDomain, AgentStatus } from './agents';

export { loadServices } from './services';
export type { ServiceCardData } from './services';

export { loadIncidents, resolveIncident } from './incidents';
export type { Incident, IncidentSeverity, IncidentStatus } from './incidents';

export { loadPacks } from './packs';
export type { Pack, PackScope } from './packs';

export { loadPolicyDecisions } from './policy';
export type { PolicyDecision, PolicyDecisionOutcome, AutonomyTier } from './policy';

export type * from './types';
