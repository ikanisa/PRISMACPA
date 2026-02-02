/**
 * Device Registration — For new devices to be authorized
 * 
 * Note: The first device is auto-registered as primary operator.
 * This page is only shown for subsequent devices that need authorization.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DeviceRegistration() {
    const { isAuthenticated, deviceId, registerThisDevice, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If already authenticated, redirect to dashboard
        if (!loading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const handleRegister = () => {
        registerThisDevice();
        navigate('/', { replace: true });
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
                <div className="text-secondary">Checking device...</div>
            </div>
        );
    }

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
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🔐</div>
                <h1 style={{ marginBottom: 'var(--space-sm)' }}>FirmOS Dashboard</h1>
                <p className="text-muted" style={{ marginBottom: 'var(--space-xl)' }}>
                    11-Agent Operating System for Professional Services
                </p>

                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-xl)',
                }}>
                    <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-xs)' }}>
                        Device ID
                    </p>
                    <code style={{
                        fontSize: '0.7rem',
                        wordBreak: 'break-all',
                        color: 'var(--accent-orchestrator)',
                    }}>
                        {deviceId}
                    </code>
                </div>

                <button
                    onClick={handleRegister}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: 'var(--space-md) var(--space-xl)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'var(--accent-orchestrator)',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    ✓ Register This Device
                </button>

                <p className="text-xs text-muted" style={{ marginTop: 'var(--space-lg)' }}>
                    Only authorized operator devices can access this dashboard.
                </p>
            </div>
        </div>
    );
}
