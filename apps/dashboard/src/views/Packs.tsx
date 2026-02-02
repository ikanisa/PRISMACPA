/**
 * Packs View — Jurisdiction Packs (MT/RW)
 * Shows pack-based resource isolation for Malta and Rwanda
 */

import { useState, useEffect } from 'react';
import { loadPacks, type Pack, type PackScope } from '../api';

export default function Packs() {
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | PackScope>('all');

    useEffect(() => {
        setLoading(true);
        loadPacks()
            .then(setPacks)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filteredPacks = packs.filter(pack => {
        if (filter === 'all') return true;
        return pack.scope === filter;
    });

    if (loading) {
        return (
            <div className="animate-in">
                <header style={{ marginBottom: 'var(--space-xl)' }}>
                    <h1>Jurisdiction Packs</h1>
                    <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                        Loading packs...
                    </p>
                </header>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-in">
                <header style={{ marginBottom: 'var(--space-xl)' }}>
                    <h1>Jurisdiction Packs</h1>
                    <p style={{ marginTop: 'var(--space-xs)', color: 'var(--color-error)' }}>
                        Error: {error}
                    </p>
                </header>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1>Jurisdiction Packs</h1>
                <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                    Resource isolation by jurisdiction — strict enforcement
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                    {(['all', 'MT', 'RW'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: filter === f ? 'var(--accent-orchestrator)' : 'var(--bg-glass)',
                                color: filter === f ? 'white' : 'inherit',
                                cursor: 'pointer',
                            }}
                        >
                            {f === 'all' ? 'All' : f === 'MT' ? '🇲🇹 Malta' : '🇷🇼 Rwanda'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-2">
                {filteredPacks.map(pack => (
                    <PackCard key={pack.id} pack={pack} />
                ))}
            </div>

            {filteredPacks.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                    No packs found for this filter.
                </div>
            )}
        </div>
    );
}

function PackCard({ pack }: { pack: Pack }) {
    const scopeColors: Record<PackScope, string> = {
        MT: 'var(--accent-malta)',
        RW: 'var(--accent-rwanda)',
    };
    const scopeLabels: Record<PackScope, string> = {
        MT: '🇲🇹 Malta',
        RW: '🇷🇼 Rwanda',
    };

    const color = scopeColors[pack.scope];
    const lastUpdated = new Date(pack.lastUpdated);
    const daysAgo = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3>{pack.name}</h3>
                    <p className="text-secondary text-sm" style={{ marginTop: 4 }}>{pack.description}</p>
                </div>
                <span
                    style={{
                        background: color + '20',
                        color: color,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                    }}
                >
                    {scopeLabels[pack.scope]}
                </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
                <div>
                    <p className="stat-value" style={{ fontSize: '1.25rem', color }}>{pack.resourceCount}</p>
                    <p className="text-muted text-xs">Resources</p>
                </div>
                <div>
                    <p className="stat-value" style={{ fontSize: '1.25rem' }}>
                        {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                    </p>
                    <p className="text-muted text-xs">Last Updated</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                <span
                    style={{
                        background: 'var(--bg-glass)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)'
                    }}
                >
                    {pack.id}
                </span>
            </div>
        </div>
    );
}
