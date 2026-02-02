/**
 * Gateway Config Guard
 * 
 * Automatically clears stale device auth tokens when gateway configuration changes.
 * This prevents authentication failures when switching between gateway deployments.
 */

import { clearAllDeviceAuthTokens, getStoredGatewayConfigHash, storeGatewayConfigHash } from "./device-auth";

/**
 * Generates a simple hash of gateway config for change detection.
 * Not cryptographic — just for detecting config drift.
 */
function hashGatewayConfig(url: string, token: string | undefined): string {
    const data = `${url}|${token ?? ""}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36);
}

/**
 * Clears stale device auth tokens if gateway config has changed.
 * Call this before creating a GatewayBrowserClient.
 */
export function clearStaleTokensIfConfigChanged(url: string, token?: string): void {
    const currentHash = hashGatewayConfig(url, token);
    const storedHash = getStoredGatewayConfigHash();

    if (storedHash && storedHash !== currentHash) {
        console.log("[gateway] Config changed, clearing stale device tokens");
        clearAllDeviceAuthTokens();
    }

    storeGatewayConfigHash(currentHash);
}
