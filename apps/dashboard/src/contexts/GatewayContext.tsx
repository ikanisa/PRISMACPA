/**
 * Gateway Context — Provides authenticated gateway access to the app
 */

import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useGateway } from '../hooks/useGateway';
import type { GatewayEventFrame } from '../api/gateway';
import type { GatewayConfig } from '../api/gatewayConfig';

type EventListener = (evt: GatewayEventFrame) => void;
type ConnectionStatus = 'loading' | 'connecting' | 'connected' | 'disconnected' | 'auth-failed' | 'config-error';

interface GatewayContextType {
    connected: boolean;
    status: ConnectionStatus;
    error: string | null;
    config: GatewayConfig | null;
    request: <T = unknown>(method: string, params?: unknown) => Promise<T>;
    subscribe: (listener: EventListener) => () => void;
}

const GatewayContext = createContext<GatewayContextType | null>(null);

interface GatewayProviderProps {
    children: ReactNode;
}

export function GatewayProvider({ children }: GatewayProviderProps) {
    const listenersRef = useRef<Set<EventListener>>(new Set());

    const handleEvent = useCallback((evt: GatewayEventFrame) => {
        for (const listener of listenersRef.current) {
            try {
                listener(evt);
            } catch (err) {
                console.error('[gateway] Event listener error:', err);
            }
        }
    }, []);

    const { connected, status, error, config, request } = useGateway({ onEvent: handleEvent });

    const subscribe = useCallback((listener: EventListener) => {
        listenersRef.current.add(listener);
        return () => {
            listenersRef.current.delete(listener);
        };
    }, []);

    return (
        <GatewayContext.Provider value={{ connected, status, error, config, request, subscribe }}>
            {children}
        </GatewayContext.Provider>
    );
}

export function useGatewayContext() {
    const context = useContext(GatewayContext);
    if (!context) {
        throw new Error('useGatewayContext must be used within a GatewayProvider');
    }
    return context;
}

/**
 * Hook to subscribe to gateway events
 */
export function useGatewayEvent(eventType: string, handler: (payload: unknown) => void) {
    const { subscribe } = useGatewayContext();

    useEffect(() => {
        const listener = (evt: GatewayEventFrame) => {
            if (evt.event === eventType) {
                handler(evt.payload);
            }
        };
        return subscribe(listener);
    }, [eventType, handler, subscribe]);
}
