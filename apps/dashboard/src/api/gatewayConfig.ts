/**
 * Gateway Config API
 * 
 * Fetches dynamic gateway configuration from Supabase edge function.
 * Falls back to local env vars for development.
 */

import { supabase } from '../lib/supabase';

export interface GatewayConfig {
    url: string;
    token: string;
    environment: 'local' | 'staging' | 'production';
}

// Cache for session
let cachedConfig: GatewayConfig | null = null;

/**
 * Fetch gateway configuration from Supabase edge function.
 * Caches the result for the session.
 */
export async function fetchGatewayConfig(): Promise<GatewayConfig> {
    // Return cached config if available
    if (cachedConfig) {
        return cachedConfig;
    }

    // Check for local development override
    const localUrl = import.meta.env.VITE_GATEWAY_URL_LOCAL;
    const localToken = import.meta.env.VITE_GATEWAY_TOKEN_LOCAL;

    if (localUrl && localToken) {
        console.log('[gateway-config] Using local development config');
        cachedConfig = {
            url: localUrl,
            token: localToken,
            environment: 'local',
        };
        return cachedConfig;
    }

    try {
        // Fetch from Supabase edge function
        const { data, error } = await supabase.functions.invoke<GatewayConfig>('gateway-config');

        if (error) {
            console.error('[gateway-config] Edge function error:', error);
            throw new Error(`Failed to fetch gateway config: ${error.message}`);
        }

        if (!data || !data.url) {
            throw new Error('Invalid gateway config response');
        }

        console.log('[gateway-config] Fetched config for environment:', data.environment);
        cachedConfig = data;
        return cachedConfig;

    } catch (err) {
        console.error('[gateway-config] Failed to fetch config:', err);

        // Fallback to legacy env vars if edge function fails
        const fallbackUrl = import.meta.env.VITE_GATEWAY_URL;
        const fallbackToken = import.meta.env.VITE_GATEWAY_TOKEN;

        if (fallbackUrl) {
            console.warn('[gateway-config] Using fallback env vars');
            cachedConfig = {
                url: fallbackUrl,
                token: fallbackToken || '',
                environment: 'local',
            };
            return cachedConfig;
        }

        throw err;
    }
}

/**
 * Clear cached config (useful for testing or reconnection)
 */
export function clearGatewayConfigCache(): void {
    cachedConfig = null;
}

/**
 * Get cached config without fetching (returns null if not cached)
 */
export function getCachedGatewayConfig(): GatewayConfig | null {
    return cachedConfig;
}
