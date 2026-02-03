/**
 * Device Auth State — Reactive device-based authentication state for Lit components
 * 
 * Provides a singleton auth state that Lit components can subscribe to.
 * Uses device identity (Ed25519 key pair) stored in localStorage.
 * No login required — auto-authenticates based on device identity.
 */

import { loadOrCreateDeviceIdentity, type DeviceIdentity } from './device-identity';

export type DeviceAuthState = {
    loading: boolean;
    authenticated: boolean;
    deviceId: string | null;
    publicKey: string | null;
    error: string | null;
};

type DeviceAuthListener = (state: DeviceAuthState) => void;

class DeviceAuthStore {
    private state: DeviceAuthState = {
        loading: true,
        authenticated: false,
        deviceId: null,
        publicKey: null,
        error: null,
    };

    private identity: DeviceIdentity | null = null;
    private listeners = new Set<DeviceAuthListener>();
    private initialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        if (this.initialized) return;
        this.initialized = true;

        try {
            // Load or create device identity
            this.identity = await loadOrCreateDeviceIdentity();
            
            this.setState({
                loading: false,
                authenticated: true,
                deviceId: this.identity.deviceId,
                publicKey: this.identity.publicKey,
                error: null,
            });
            
            console.log('[DeviceAuth] Device authenticated:', this.identity.deviceId.slice(0, 16) + '...');
        } catch (err) {
            console.error('[DeviceAuth] Failed to initialize device identity:', err);
            this.setState({ 
                loading: false, 
                authenticated: false,
                error: String(err) 
            });
        }
    }

    private setState(partial: Partial<DeviceAuthState>) {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    private notify() {
        for (const listener of this.listeners) {
            try {
                listener(this.state);
            } catch (err) {
                console.error('[DeviceAuthStore] Listener error:', err);
            }
        }
    }

    getState(): DeviceAuthState {
        return this.state;
    }

    getIdentity(): DeviceIdentity | null {
        return this.identity;
    }

    subscribe(listener: DeviceAuthListener): () => void {
        this.listeners.add(listener);
        // Immediately call with current state
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    /**
     * Get the device ID for API calls
     */
    getDeviceId(): string | null {
        return this.state.deviceId;
    }

    /**
     * Get the public key for signing/verification
     */
    getPublicKey(): string | null {
        return this.state.publicKey;
    }

    /**
     * Force re-initialize device identity (useful for testing)
     */
    async reinitialize(): Promise<void> {
        this.initialized = false;
        this.setState({ loading: true, authenticated: false, error: null });
        await this.init();
    }
}

// Singleton instance
export const deviceAuthStore = new DeviceAuthStore();
