/**
 * Connection Indicator — Shows gateway connection status and data source
 * 
 * Clearly differentiates between:
 * - 🟢 Live Data (Gateway Connected, real database)
 * - 🟡 Mock Data (No gateway, using demo/placeholder data)
 */

import { useGatewayContext } from '../contexts/GatewayContext';

interface ConnectionIndicatorProps {
    className?: string;
}

export function ConnectionIndicator({ className = '' }: ConnectionIndicatorProps) {
    const { connected } = useGatewayContext();

    return (
        <div
            className={`connection-indicator ${className}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-xs)',
                marginTop: 'var(--space-sm)',
            }}
        >
            {/* Connection Status */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    padding: 'var(--space-xs) var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    background: connected
                        ? 'rgba(34, 197, 94, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${connected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    fontSize: '0.75rem',
                    transition: 'all 0.2s ease',
                }}
            >
                <span
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: connected ? '#22c55e' : '#ef4444',
                        boxShadow: connected
                            ? '0 0 8px rgba(34, 197, 94, 0.5)'
                            : '0 0 8px rgba(239, 68, 68, 0.5)',
                        animation: connected ? 'pulse 2s infinite' : 'none',
                    }}
                />
                <span style={{ color: connected ? '#22c55e' : '#ef4444' }}>
                    {connected ? 'Gateway Connected' : 'Gateway Offline'}
                </span>
            </div>

            {/* Data Source Indicator */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    padding: 'var(--space-xs) var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    background: connected
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(234, 179, 8, 0.1)',
                    border: `1px solid ${connected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                    fontSize: '0.7rem',
                    transition: 'all 0.2s ease',
                }}
                title={connected
                    ? 'Data is fetched from the live database via the gateway API'
                    : 'Using demo/placeholder data for preview purposes'
                }
            >
                <span style={{ fontSize: '0.85rem' }}>
                    {connected ? '🗄️' : '📋'}
                </span>
                <span style={{
                    color: connected ? '#3b82f6' : '#eab308',
                    fontWeight: 500,
                }}>
                    {connected ? 'Live Data' : 'Mock Data'}
                </span>
                {!connected && (
                    <span
                        style={{
                            marginLeft: 'auto',
                            background: 'rgba(234, 179, 8, 0.2)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '0.6rem',
                            color: '#eab308',
                        }}
                    >
                        DEMO
                    </span>
                )}
            </div>
        </div>
    );
}
