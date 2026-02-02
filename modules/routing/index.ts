/**
 * Routing Module
 * 
 * Handles task routing from Aline orchestrator to service agents.
 * Will be extracted from packages/firmos-programs/routing.ts
 */

// Types
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

// Public API (stubs for now - will be implemented in P4)
export async function routeTask(_request: RoutingRequest): Promise<RoutingDecision> {
    // TODO: Extract from firmos-programs/routing.ts
    throw new Error("Not implemented - pending extraction from firmos-programs");
}

export function getAgentForService(_serviceId: string): string | null {
    // TODO: Extract from firmos-programs/routing.ts
    throw new Error("Not implemented - pending extraction from firmos-programs");
}

export function getAgentsByJurisdiction(_jurisdiction: "MT" | "RW"): string[] {
    // TODO: Extract from firmos-programs/routing.ts
    throw new Error("Not implemented - pending extraction from firmos-programs");
}
