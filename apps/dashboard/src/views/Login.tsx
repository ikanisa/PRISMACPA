/**
 * Login — Google OAuth via Supabase (P0 Security Fix)
 * 
 * Operators sign in with their Google account.
 * No email/password — Google OAuth only.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
    const { isAuthenticated, loading, error } = useAuth();
    const navigate = useNavigate();
    const [signingIn, setSigningIn] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        // If already authenticated, redirect to dashboard
        if (!loading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const handleGoogleSignIn = async () => {
        setSigningIn(true);
        setLocalError('');

        try {
            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });

            if (signInError) {
                setLocalError(signInError.message);
                setSigningIn(false);
            }
            // If successful, user will be redirected to Google
        } catch (err) {
            setLocalError((err as Error).message);
            setSigningIn(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-primary)',
            }}>
                <div className="text-secondary">Checking session...</div>
            </div>
        );
    }

    const displayError = localError || error;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 'var(--space-xl)',
                background: 'var(--bg-primary)',
            }}
        >
            <div
                className="card"
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    padding: 'var(--space-2xl)',
                    textAlign: 'center',
                }}
            >
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🔐</div>
                    <h1 style={{ marginBottom: 'var(--space-sm)' }}>FirmOS Dashboard</h1>
                    <p className="text-muted">
                        11-Agent Operating System for Professional Services
                    </p>
                </div>

                {displayError && (
                    <div style={{
                        padding: 'var(--space-sm) var(--space-md)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--status-error)',
                        fontSize: '0.875rem',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        {displayError}
                    </div>
                )}

                <button
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-sm)',
                        padding: 'var(--space-md) var(--space-xl)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        background: signingIn ? 'var(--bg-tertiary)' : 'white',
                        color: signingIn ? 'var(--text-muted)' : '#1f2937',
                        cursor: signingIn ? 'not-allowed' : 'pointer',
                    }}
                >
                    {!signingIn && (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                    )}
                    {signingIn ? 'Redirecting to Google...' : 'Sign in with Google'}
                </button>

                <p className="text-xs text-muted" style={{ marginTop: 'var(--space-xl)' }}>
                    Only authorized operators can access this dashboard.
                </p>
            </div>
        </div>
    );
}
