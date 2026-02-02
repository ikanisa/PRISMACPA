/**
 * Protected Route — Allows access if device is authorized
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
                <div className="text-secondary">Checking device authorization...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Device not authorized, redirect to device registration
        return <Navigate to="/register-device" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
