/**
 * Services View — FirmOS Service Lines
 * Shows all services with assigned agents and active engagements
 */

import { useState, useEffect } from 'react';
import { loadServices, type ServiceCardData } from '../api';

export default function Services() {
    const [services, setServices] = useState<ServiceCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        loadServices()
            .then(setServices)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="animate-in">
                <header style={{ marginBottom: 'var(--space-xl)' }}>
                    <h1>Services</h1>
                    <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                        Loading service catalog...
                    </p>
                </header>
                <div className="grid grid-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card" style={{ height: '150px', opacity: 0.5 }} />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-in">
                <header style={{ marginBottom: 'var(--space-xl)' }}>
                    <h1>Services</h1>
                    <p className="text-secondary" style={{ marginTop: 'var(--space-xs)', color: 'var(--color-error)' }}>
                        Error: {error}
                    </p>
                </header>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1>Services</h1>
                <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                    Service lines and their assigned agents
                </p>
            </header>

            <div className="grid grid-2">
                {services.map(service => (
                    <ServiceCard key={service.id} service={service} />
                ))}
            </div>
        </div>
    );
}

function ServiceCard({ service }: { service: ServiceCardData }) {
    const scopeColors: Record<string, string> = {
        global: 'var(--accent-orchestrator)',
        malta: 'var(--accent-malta)',
        rwanda: 'var(--accent-rwanda)',
    };
    const color = scopeColors[service.scope] || 'var(--accent-orchestrator)';

    return (
        <div
            className="card"
            style={{
                borderLeft: `3px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <span style={{ fontSize: '1.5rem' }}>{service.icon}</span>
                <div>
                    <h3>{service.name}</h3>
                    <p className="text-secondary text-sm">Owner: {service.owner}</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
                <div>
                    <p className="stat-value" style={{ fontSize: '1.5rem', color }}>
                        {service.engagements}
                    </p>
                    <p className="text-muted text-xs">Active Engagements</p>
                </div>
                <div>
                    <p className="stat-value" style={{ fontSize: '1.5rem' }}>
                        {service.phaseCount}
                    </p>
                    <p className="text-muted text-xs">Phases</p>
                </div>
                <div>
                    <p className="stat-value" style={{ fontSize: '1.5rem' }}>
                        {service.taskCount}
                    </p>
                    <p className="text-muted text-xs">Tasks</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                <span
                    style={{
                        background: 'var(--bg-glass)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)'
                    }}
                >
                    {service.id}
                </span>
            </div>
        </div>
    );
}
