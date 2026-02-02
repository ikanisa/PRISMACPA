/**
 * Admin Route Guard — Requires admin role for access
 * 
 * Use this for admin-only routes. Falls back to Access Denied
 * for authenticated users without admin role.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
    fallbackPath?: string;
}

export function AdminRoute({ children, fallbackPath: _fallbackPath = '/' }: AdminRouteProps) {
    const { operator, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: 'var(--bg-primary)',
                }}
            >
                <div className="text-secondary">Checking permissions...</div>
            </div>
        );
    }

    // Not authenticated at all — redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Authenticated but not admin — show access denied or redirect
    const isAdmin = operator?.role === 'admin';
    if (!isAdmin) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-xl)',
                }}
            >
                <div style={{ fontSize: '3rem' }}>🔒</div>
                <h2 style={{ margin: 0 }}>Access Denied</h2>
                <p className="text-muted" style={{ textAlign: 'center', maxWidth: '400px' }}>
                    This section requires admin privileges. Contact your administrator
                    if you believe you should have access.
                </p>
                <button
                    onClick={() => window.history.back()}
                    className="btn"
                    style={{
                        padding: 'var(--space-sm) var(--space-lg)',
                        background: 'var(--accent-orchestrator)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
