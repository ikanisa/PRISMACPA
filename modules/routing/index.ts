/**
 * Routing Module
 * 
 * Re-exports from @firmos/programs for backward compatibility.
 * In v2027+, implementations will live here directly.
 */

// Re-export types and functions from the canonical source
export {
    type Jurisdiction,
    type ServiceKey,
    type RouteQuery,
    type RouteResult,
    routeService,
    getServiceById,
    getServicesByJurisdiction,
    getAvailableServiceIds,
    requiresEscalation,
    requiresGuardianPass
} from "@firmos/programs/routing.js";

// Additional types for module API (future expansion)
export interface RoutingRequest {
    taskId: string;
    taskType: string;
    jurisdiction?: "MT" | "RW";
    priority?: "low" | "medium" | "high" | "urgent";
    payload: Record<string, unknown>;
}

export interface RoutingDecision {
    agentId: string;
    agentName: string;
    confidence: number;
    reason: string;
}

// Future API stubs (not yet implemented)
export async function routeTask(_request: RoutingRequest): Promise<RoutingDecision> {
    throw new Error("Not implemented - use routeService() from @firmos/programs for now");
}

export function getAgentForService(_serviceId: string): string | null {
    // TODO: Extract from service catalog
    throw new Error("Not implemented - pending extraction from firmos-programs");
}

export function getAgentsByJurisdiction(_jurisdiction: "MT" | "RW"): string[] {
    // TODO: Extract from service catalog
    throw new Error("Not implemented - pending extraction from firmos-programs");
}
