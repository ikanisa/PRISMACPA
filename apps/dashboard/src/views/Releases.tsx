import React, { useState } from 'react';

/**
 * Releases View — Dashboard for tracking release requests and approvals
 */

type ReleaseStatus = 'PENDING' | 'AUTHORIZED' | 'DENIED' | 'EXECUTED';

interface Release {
    id: string;
    workstreamId: string;
    requestingAgent: string;
    actionType: 'FILING' | 'SUBMISSION' | 'DELIVERY';
    targetSystem?: string;
    description: string;
    status: ReleaseStatus;
    guardianPass: boolean;
    requestedAt: Date;
    decidedAt?: Date;
    decidedBy?: string;
}

// Mock release data
const mockReleases: Release[] = [
    {
        id: 'rel-001',
        workstreamId: 'ws-mt-tax-2026',
        requestingAgent: 'agent_matthew',
        actionType: 'FILING',
        targetSystem: 'CFR Malta',
        description: 'Q4 2025 Corporate Tax Return',
        status: 'EXECUTED',
        guardianPass: true,
        requestedAt: new Date('2026-01-28T09:00:00'),
        decidedAt: new Date('2026-01-28T10:30:00'),
        decidedBy: 'agent_marco'
    },
    {
        id: 'rel-002',
        workstreamId: 'ws-mt-csp-001',
        requestingAgent: 'agent_claire',
        actionType: 'SUBMISSION',
        targetSystem: 'MBR',
        description: 'Annual Return — ABC Ltd',
        status: 'PENDING',
        guardianPass: true,
        requestedAt: new Date('2026-02-01T14:00:00')
    },
    {
        id: 'rel-003',
        workstreamId: 'ws-rw-notary-007',
        requestingAgent: 'agent_chantal',
        actionType: 'DELIVERY',
        description: 'Share Transfer Agreement — Final Executed Copy',
        status: 'AUTHORIZED',
        guardianPass: true,
        requestedAt: new Date('2026-02-01T11:00:00'),
        decidedAt: new Date('2026-02-01T11:45:00'),
        decidedBy: 'agent_marco'
    },
    {
        id: 'rel-004',
        workstreamId: 'ws-rw-tax-003',
        requestingAgent: 'agent_emmanuel',
        actionType: 'FILING',
        targetSystem: 'RRA',
        description: 'December 2025 VAT Return',
        status: 'DENIED',
        guardianPass: false,
        requestedAt: new Date('2026-01-30T16:00:00'),
        decidedAt: new Date('2026-01-30T16:30:00'),
        decidedBy: 'agent_marco'
    }
];

const statusColors: Record<ReleaseStatus, string> = {
    PENDING: '#ca8a04',
    AUTHORIZED: '#16a34a',
    DENIED: '#dc2626',
    EXECUTED: '#6b7280'
};

const statusIcons: Record<ReleaseStatus, string> = {
    PENDING: '⏳',
    AUTHORIZED: '✓',
    DENIED: '✗',
    EXECUTED: '✓✓'
};

export function Releases(): React.ReactElement {
    const [filter, setFilter] = useState<'all' | 'pending' | 'decided'>('all');

    const filteredReleases = mockReleases.filter(rel => {
        if (filter === 'pending') { return rel.status === 'PENDING'; }
        if (filter === 'decided') { return rel.status !== 'PENDING'; }
        return true;
    });

    return (
        <div style={{ padding: '24px', maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Release Queue</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['all', 'pending', 'decided'] as const).map(f => (
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
                <StatCard label="Pending" value={mockReleases.filter(r => r.status === 'PENDING').length} color="#ca8a04" />
                <StatCard label="Authorized" value={mockReleases.filter(r => r.status === 'AUTHORIZED').length} color="#16a34a" />
                <StatCard label="Executed" value={mockReleases.filter(r => r.status === 'EXECUTED').length} color="#6b7280" />
                <StatCard label="Denied" value={mockReleases.filter(r => r.status === 'DENIED').length} color="#dc2626" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredReleases.map(rel => (
                    <ReleaseCard key={rel.id} release={rel} />
                ))}
            </div>
        </div>
    );
}

function ReleaseCard({ release }: { release: Release }) {
    return (
        <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '20px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            background: statusColors[release.status] + '20',
                            color: statusColors[release.status],
                            fontWeight: 500,
                            fontSize: '13px'
                        }}>
                            {statusIcons[release.status]} {release.status}
                        </span>
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            background: '#e5e7eb',
                            fontSize: '13px'
                        }}>
                            {release.actionType}
                        </span>
                        {release.guardianPass ? (
                            <span style={{ color: '#16a34a', fontSize: '13px' }}>✓ Diane PASS</span>
                        ) : (
                            <span style={{ color: '#dc2626', fontSize: '13px' }}>✗ No Guardian PASS</span>
                        )}
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 500 }}>{release.description}</h3>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        <span>Requested by <code>{release.requestingAgent}</code></span>
                        {release.targetSystem && <span> → {release.targetSystem}</span>}
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px', color: '#6b7280' }}>
                    <div>Requested: {release.requestedAt.toLocaleString()}</div>
                    {release.decidedAt && (
                        <div>Decided: {release.decidedAt.toLocaleString()}</div>
                    )}
                    {release.decidedBy && (
                        <div>By: <code>{release.decidedBy}</code></div>
                    )}
                </div>
            </div>

            {release.status === 'PENDING' && (
                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '8px'
                }}>
                    <button style={{
                        padding: '8px 16px',
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}>
                        Authorize
                    </button>
                    <button style={{
                        padding: '8px 16px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}>
                        Deny
                    </button>
                    <button style={{
                        padding: '8px 16px',
                        background: '#ca8a04',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}>
                        Hold
                    </button>
                </div>
            )}
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
            minWidth: '100px'
        }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color }}>{value}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>{label}</div>
        </div>
    );
}
