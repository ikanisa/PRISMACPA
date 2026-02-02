/**
 * 404 Not Found — Displayed when a route doesn't match
 */

import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div
            className="animate-in"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                textAlign: 'center',
            }}
        >
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>
                🔍
            </div>
            <h1 style={{ marginBottom: 'var(--space-md)' }}>
                Page Not Found
            </h1>
            <p
                className="text-secondary"
                style={{ marginBottom: 'var(--space-xl)', maxWidth: '400px' }}
            >
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link
                to="/"
                style={{
                    background: 'var(--accent-orchestrator)',
                    color: 'white',
                    padding: 'var(--space-sm) var(--space-lg)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                }}
            >
                Back to Control Tower
            </Link>
        </div>
    );
}
