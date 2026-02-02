/**
 * FirmOS API Types
 * 
 * Type definitions for FirmOS gateway responses.
 */

// ============================================================================
// Agent Types
// ============================================================================

export type AgentIdentity = {
    name?: string;
    theme?: string;
    emoji?: string;
    avatar?: string;
    avatarUrl?: string;
};

export type GatewayAgentRow = {
    id: string;
    name?: string;
    identity?: AgentIdentity;
};

export type AgentsListResult = {
    defaultId: string;
    mainKey: string;
    scope: string;
    agents: GatewayAgentRow[];
};

// ============================================================================
// Service Types
// ============================================================================

export type ServiceScope = "global" | "malta" | "rwanda";

export type GatewayServiceSummary = {
    id: string;
    name: string;
    scope: ServiceScope;
    strictPack: string | null;
    phaseCount: number;
    taskCount: number;
};

export type ServicesListResult = {
    services: GatewayServiceSummary[];
    totalCount: number;
    catalogVersion: string;
};

// ============================================================================
// Incident Types
// ============================================================================

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "investigating" | "resolved";
export type IncidentType = "security" | "compliance";

export type Incident = {
    id: string;
    title: string;
    type: IncidentType;
    severity: IncidentSeverity;
    status: IncidentStatus;
    detectedAt: string;
    detectedBy: string;
    assignee: string;
    description: string;
    resolvedAt?: string;
    resolution?: string;
};

export type IncidentsListResult = {
    incidents: Incident[];
    totalCount: number;
};

// ============================================================================
// Pack Types
// ============================================================================

export type PackScope = "MT" | "RW";

export type Pack = {
    id: string;
    name: string;
    scope: PackScope;
    description: string;
    resourceCount: number;
    lastUpdated: string;
};

export type PacksListResult = {
    packs: Pack[];
    totalCount: number;
};

// ============================================================================
// Policy Types
// ============================================================================

export type PolicyStatus = "active" | "draft" | "archived";

export type Policy = {
    id: string;
    name: string;
    description: string;
    status: PolicyStatus;
    version: string;
    lastUpdated: string;
    rules: number;
};

export type PoliciesListResult = {
    policies: Policy[];
    totalCount: number;
};
