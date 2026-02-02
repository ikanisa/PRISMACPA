/**
 * Auth Context — Supabase Session Authentication (P0 Security Fix)
 * 
 * Replaces insecure localStorage-based device auth with proper
 * Supabase session management. Operators must authenticate via
 * email/password or OAuth.
 */

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface Operator {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    operator: Operator | null;
    session: Session | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [operator, setOperator] = useState<Operator | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Convert Supabase user to Operator
    const userToOperator = (user: User): Operator => ({
        id: user.id,
        email: user.email ?? '',
        role: (user.user_metadata?.role as string) || 'operator',
    });

    useEffect(() => {
        // Check initial session
        const initAuth = async () => {
            try {
                const { data: { session: initialSession }, error: sessionError } =
                    await supabase.auth.getSession();

                if (sessionError) {
                    console.error('[Auth] Session error:', sessionError);
                    setError(sessionError.message);
                } else if (initialSession?.user) {
                    setSession(initialSession);
                    setOperator(userToOperator(initialSession.user));
                    setIsAuthenticated(true);
                    console.log('[Auth] Session restored for:', initialSession.user.email);
                } else {
                    console.log('[Auth] No active session');
                }
            } catch (err) {
                console.error('[Auth] Init error:', err);
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        void initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                if (newSession?.user) {
                    setSession(newSession);
                    setOperator(userToOperator(newSession.user));
                    setIsAuthenticated(true);
                    setError(null);
                } else {
                    setSession(null);
                    setOperator(null);
                    setIsAuthenticated(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) {
                setError(signInError.message);
            }
            return { error: signInError };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'operator', // Default role for new users
                    },
                },
            });
            if (signUpError) {
                setError(signUpError.message);
            }
            return { error: signUpError };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            setSession(null);
            setOperator(null);
            setIsAuthenticated(false);
            setError(null);
        } catch (err) {
            console.error('[Auth] Sign out error:', err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                operator,
                session,
                isAuthenticated,
                loading,
                error,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
