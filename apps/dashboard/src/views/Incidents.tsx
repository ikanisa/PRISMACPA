import React, { useState } from 'react';

/**
 * Incidents View — Dashboard for viewing security and compliance incidents
 */

// Mock incident data
const mockIncidents = [
    {
        id: 'inc-001',
        type: 'PACK_LEAKAGE',
        severity: 'CRITICAL',
        description: 'Agent agent_matthew attempted to access RW_TAX pack',
        agentId: 'agent_matthew',
        packId: 'RW_TAX',
        workstreamId: 'ws-123',
        createdAt: new Date('2026-02-01T10:30:00'),
        resolvedAt: new Date('2026-02-01T11:00:00'),
        resolution: 'False positive - routing error corrected'
    },
    {
        id: 'inc-002',
        type: 'RELEASE_BYPASS_ATTEMPT',
        severity: 'HIGH',
        description: 'Agent agent_claire attempted release without Diane PASS',
        agentId: 'agent_claire',
        workstreamId: 'ws-456',
        createdAt: new Date('2026-02-01T14:15:00'),
        resolvedAt: undefined,
        resolution: undefined
    },
    {
        id: 'inc-003',
        type: 'EVIDENCE_MISSING_PATTERN',
        severity: 'MEDIUM',
        description: 'Repeated missing CLIENT_INSTRUCTION evidence in tax workstreams',
        agentId: 'agent_emmanuel',
        workstreamId: 'ws-789',
        createdAt: new Date('2026-02-01T09:00:00'),
        resolvedAt: undefined,
        resolution: undefined
    }
];

const severityColors: Record<string, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#ca8a04',
    LOW: '#16a34a'
};

const typeLabels: Record<string, string> = {
    PACK_LEAKAGE: 'Pack Leakage',
    GATE_BYPASS_ATTEMPT: 'Gate Bypass',
    RELEASE_BYPASS_ATTEMPT: 'Release Bypass',
    EVIDENCE_MISSING_PATTERN: 'Evidence Pattern',
    REPEATED_CONTRADICTION: 'Contradiction',
    UNAUTHORIZED_TOOL_ACCESS: 'Unauthorized Tool',
    POLICY_VIOLATION: 'Policy Violation'
};

export function Incidents(): React.ReactElement {
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical'>('all');

    const filteredIncidents = mockIncidents.filter(inc => {
        if (filter === 'unresolved') return !inc.resolvedAt;
        if (filter === 'critical') return inc.severity === 'CRITICAL';
        return true;
    });

    return (
        <div style={{ padding: '24px', maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Incidents</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['all', 'unresolved', 'critical'] as const).map(f => (
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
                <StatCard label="Total" value={mockIncidents.length} color="#6b7280" />
                <StatCard label="Unresolved" value={mockIncidents.filter(i => !i.resolvedAt).length} color="#ea580c" />
                <StatCard label="Critical" value={mockIncidents.filter(i => i.severity === 'CRITICAL').length} color="#dc2626" />
            </div>

            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb' }}>
                            <th style={thStyle}>Severity</th>
                            <th style={thStyle}>Type</th>
                            <th style={thStyle}>Description</th>
                            <th style={thStyle}>Agent</th>
                            <th style={thStyle}>Created</th>
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
                                        fontSize: '12px'
                                    }}>
                                        {inc.severity}
                                    </span>
                                </td>
                                <td style={tdStyle}>{typeLabels[inc.type]}</td>
                                <td style={tdStyle}>{inc.description}</td>
                                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '13px' }}>{inc.agentId}</td>
                                <td style={tdStyle}>{inc.createdAt.toLocaleString()}</td>
                                <td style={tdStyle}>
                                    {inc.resolvedAt ? (
                                        <span style={{ color: '#16a34a' }}>✓ Resolved</span>
                                    ) : (
                                        <span style={{ color: '#ea580c' }}>● Open</span>
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
