/**
 * useGateway Hook — Connects gateway client with dynamic config from Supabase
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GatewayClient, type GatewayClientOptions, type GatewayEventFrame } from '../api/gateway';
import { fetchGatewayConfig, type GatewayConfig } from '../api/gatewayConfig';

// Fallback for local development when edge function is not available
const LOCAL_GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'ws://localhost:19001';
const LOCAL_GATEWAY_TOKEN = import.meta.env.VITE_GATEWAY_TOKEN || 'dev-token';

interface UseGatewayOptions {
    onEvent?: (evt: GatewayEventFrame) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
}

type ConnectionStatus = 'loading' | 'connecting' | 'connected' | 'disconnected' | 'auth-failed' | 'config-error';

export function useGateway(options: UseGatewayOptions = {}) {
    const { isAuthenticated } = useAuth();
    const clientRef = useRef<GatewayClient | null>(null);
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState<ConnectionStatus>('loading');
    const [config, setConfig] = useState<GatewayConfig | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch gateway config on mount
    useEffect(() => {
        if (!isAuthenticated) {
            setStatus('disconnected');
            return;
        }

        setStatus('loading');
        setError(null);

        fetchGatewayConfig()
            .then((cfg) => {
                console.log('[useGateway] Config loaded:', cfg.environment, cfg.url);
                setConfig(cfg);
            })
            .catch((err) => {
                console.error('[useGateway] Failed to load config:', err);

                // Fallback to local env vars
                console.log('[useGateway] Using local fallback config');
                setConfig({
                    url: LOCAL_GATEWAY_URL,
                    token: LOCAL_GATEWAY_TOKEN,
                    environment: 'local',
                });
            });
    }, [isAuthenticated]);

    // Connect to gateway when config is available
    useEffect(() => {
        if (!isAuthenticated || !config) {
            if (clientRef.current) {
                clientRef.current.stop();
                clientRef.current = null;
                setConnected(false);
            }
            return;
        }

        if (!config.token && config.environment !== 'local') {
            console.error('[useGateway] No token configured for', config.environment);
            setStatus('auth-failed');
            setError('Gateway token not configured');
            return;
        }

        setStatus('connecting');
        console.log('[useGateway] Connecting to gateway:', config.url);

        const clientOpts: GatewayClientOptions = {
            url: config.url,
            token: config.token,
            onHello: () => {
                console.log('[useGateway] Connected to gateway');
            },
            onEvent: options.onEvent,
            onConnected: () => {
                setConnected(true);
                setStatus('connected');
                setError(null);
                options.onConnected?.();
            },
            onClose: (info) => {
                setConnected(false);

                // Check for auth failures
                if (info.code === 4001 || info.code === 4008 || info.reason?.includes('auth')) {
                    setStatus('auth-failed');
                    setError('Authentication failed - check gateway token');
                } else {
                    setStatus('disconnected');
                    setError(info.reason || null);
                }

                options.onDisconnected?.();
            },
        };

        const client = new GatewayClient(clientOpts);
        clientRef.current = client;
        client.start();

        return () => {
            client.stop();
            clientRef.current = null;
        };
    }, [config, isAuthenticated, options.onEvent, options.onConnected, options.onDisconnected]);

    const request = useCallback(<T = unknown>(method: string, params?: unknown): Promise<T> => {
        if (!clientRef.current) {
            return Promise.reject(new Error('Gateway not initialized'));
        }
        return clientRef.current.request<T>(method, params);
    }, []);

    return {
        connected,
        status,
        error,
        config,
        request,
        client: clientRef.current,
    };
}
