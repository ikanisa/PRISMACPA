/**
 * Protected Route — Requires Supabase session authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();
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
                <div className="text-secondary">Checking authentication...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Not authenticated, redirect to login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
