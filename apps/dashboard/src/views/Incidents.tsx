/**
 * Incidents View — Dashboard for viewing security and compliance incidents
 */

import { useState, useEffect } from 'react';
import { loadIncidents, type Incident, type IncidentSeverity } from '../api';

const severityColors: Record<IncidentSeverity, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#16a34a'
};

const typeLabels: Record<string, string> = {
    security: 'Security',
    compliance: 'Compliance',
};

export function Incidents() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'open' | 'critical'>('all');

    useEffect(() => {
        setLoading(true);
        loadIncidents()
            .then(setIncidents)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filteredIncidents = incidents.filter(inc => {
        if (filter === 'open') {
            return inc.status !== 'resolved';
        }
        if (filter === 'critical') {
            return inc.severity === 'critical';
        }
        return true;
    });

    if (loading) {
        return (
            <div style={{ padding: '24px', maxWidth: '1200px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Incidents</h1>
                <p className="text-secondary">Loading incidents...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '24px', maxWidth: '1200px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Incidents</h1>
                <p style={{ color: '#dc2626' }}>Error: {error}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Incidents</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['all', 'open', 'critical'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: filter === f ? '#3b82f6' : '#e5e7eb',
                                color: filter === f ? 'white' : '#374151',
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Total" value={incidents.length} color="#6b7280" />
                <StatCard label="Open" value={incidents.filter(i => i.status !== 'resolved').length} color="#ea580c" />
                <StatCard label="Critical" value={incidents.filter(i => i.severity === 'critical').length} color="#dc2626" />
            </div>

            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb' }}>
                            <th style={thStyle}>Severity</th>
                            <th style={thStyle}>Type</th>
                            <th style={thStyle}>Title</th>
                            <th style={thStyle}>Assignee</th>
                            <th style={thStyle}>Detected</th>
                            <th style={thStyle}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIncidents.map(inc => (
                            <tr key={inc.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: severityColors[inc.severity] + '20',
                                        color: severityColors[inc.severity],
                                        fontWeight: 500,
                                        fontSize: '12px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {inc.severity}
                                    </span>
                                </td>
                                <td style={tdStyle}>{typeLabels[inc.type] || inc.type}</td>
                                <td style={tdStyle}>{inc.title}</td>
                                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '13px' }}>{inc.assignee}</td>
                                <td style={tdStyle}>{new Date(inc.detectedAt).toLocaleString()}</td>
                                <td style={tdStyle}>
                                    {inc.status === 'resolved' ? (
                                        <span style={{ color: '#16a34a' }}>✓ Resolved</span>
                                    ) : (
                                        <span style={{ color: '#ea580c' }}>● {inc.status}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div style={{
            padding: '16px 24px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            minWidth: '120px'
        }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color }}>{value}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>{label}</div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '14px'
};

export default Incidents;
