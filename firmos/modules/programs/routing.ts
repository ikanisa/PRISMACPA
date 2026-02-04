/**
 * Routing stub - placeholder for @firmos/programs/routing.js
 * TODO: Implement actual routing logic
 */

export interface RoutingResult {
    route: string;
    agentId: string;
    confidence: number;
}

export interface RoutingConfig {
    routes: Record<string, string>;
}

export async function routeMessage(
    _config: RoutingConfig,
    _message: string
): Promise<RoutingResult> {
    return {
        route: "default",
        agentId: "aline",
        confidence: 1.0,
    };
}

export function createRouter(_config: RoutingConfig) {
    return {
        route: routeMessage,
    };
}
