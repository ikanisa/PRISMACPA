/**
 * Gateway Config Fetch — Provides gateway URL for local connection
 * 
 * Auth disabled - no token needed. Gateway runs in auth.mode=none.
 */

export type GatewayConfig = {
    url: string;
    token: string;
    environment: 'local' | 'staging' | 'production';
};

/**
 * Returns gateway config - derived from env or empty to prompt user.
 */
export async function fetchGatewayConfig(): Promise<GatewayConfig> {
    // Read from Vite env vars, with fallbacks for  // 1. Env (Static config)
    const envUrl = import.meta.env.VITE_GATEWAY_URL;
    const envToken = import.meta.env.VITE_GATEWAY_TOKEN;

    // If env provides a token, use it.
    // If env provides "null" or empty string, we return empty string.
    // This signals to the UI that it should Prompt the user for a token.
    let token = "";
    if (envToken && envToken !== "null") {
        token = envToken.trim();
    }

    const url = envUrl || "ws://localhost:5176";
    console.log('[gateway-config] Using gateway:', url);

    return {
        url,
        token, // Empty means "Prompt User"
        environment: 'local',
    };
}

/**
 * Clears the cached config (unused but kept for API compatibility)
 */
export function clearGatewayConfigCache(): void {
    // No-op - no cache
}

/**
 * Checks if a static token is available in environment
 */
export function hasGatewayToken(): boolean {
    const envToken = import.meta.env.VITE_GATEWAY_TOKEN;
    return !!envToken && envToken !== "null";
}
