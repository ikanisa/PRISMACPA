/**
 * Auth State — Reactive authentication state for Lit components
 * 
 * Provides a singleton auth state that Lit components can subscribe to.
 * Uses Supabase session management.
 */

import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AuthState = {
    loading: boolean;
    session: Session | null;
    user: User | null;
    error: string | null;
};

type AuthListener = (state: AuthState) => void;

class AuthStore {
    private state: AuthState = {
        loading: true,
        session: null,
        user: null,
        error: null,
    };

    private listeners = new Set<AuthListener>();
    private initialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        if (this.initialized) return;
        this.initialized = true;

        try {
            // Check existing session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                this.setState({ loading: false, error: error.message });
            } else {
                this.setState({
                    loading: false,
                    session,
                    user: session?.user ?? null,
                    error: null,
                });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                this.setState({
                    loading: false,
                    session,
                    user: session?.user ?? null,
                    error: null,
                });
            });
        } catch (err) {
            this.setState({ loading: false, error: String(err) });
        }
    }

    private setState(partial: Partial<AuthState>) {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    private notify() {
        for (const listener of this.listeners) {
            try {
                listener(this.state);
            } catch (err) {
                console.error('[AuthStore] Listener error:', err);
            }
        }
    }

    getState(): AuthState {
        return this.state;
    }

    subscribe(listener: AuthListener): () => void {
        this.listeners.add(listener);
        // Immediately call with current state
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    async signInWithGoogle(): Promise<{ error: Error | null }> {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) {
                this.setState({ error: error.message });
                return { error };
            }
            return { error: null };
        } catch (err) {
            const error = err as Error;
            this.setState({ error: error.message });
            return { error };
        }
    }

    async signOut(): Promise<void> {
        await supabase.auth.signOut();
        this.setState({ session: null, user: null, error: null });
    }

    /**
     * Get the current access token for API calls
     */
    getAccessToken(): string | null {
        return this.state.session?.access_token ?? null;
    }
}

// Singleton instance
export const authStore = new AuthStore();
