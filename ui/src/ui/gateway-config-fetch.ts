/**
 * Gateway Config Fetch — Fetches gateway URL and token from Supabase edge function
 * 
 * This allows the UI to dynamically get the gateway connection info at runtime
 * rather than relying on hardcoded or empty defaults.
 */

import { supabase } from './supabase';

export type GatewayConfig = {
    url: string;
    token: string;
    environment: 'local' | 'staging' | 'production';
};

let cachedConfig: GatewayConfig | null = null;

/**
 * Fetches gateway config from the Supabase edge function.
 * Caches the result to avoid repeated calls.
 */
export async function fetchGatewayConfig(): Promise<GatewayConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    try {
        const { data, error } = await supabase.functions.invoke<GatewayConfig>('gateway-config');

        if (error) {
            console.error('[gateway-config] Supabase function error:', error);
            throw new Error(`Failed to fetch gateway config: ${error.message}`);
        }

        if (!data || !data.url || !data.token) {
            console.error('[gateway-config] Invalid response:', data);
            throw new Error('Gateway config response missing url or token');
        }

        cachedConfig = data;
        console.log('[gateway-config] Fetched config for environment:', data.environment);
        return data;
    } catch (err) {
        console.error('[gateway-config] Fetch failed:', err);
        throw err;
    }
}

/**
 * Clears the cached config (useful for testing or forcing a refresh)
 */
export function clearGatewayConfigCache(): void {
    cachedConfig = null;
}
