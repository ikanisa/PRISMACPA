/**
 * Control Tower — FirmOS Command Center
 * Shows system status, deadlines, blocked items, and escalations
 */

import { useState } from 'react';

// Mock data — will be replaced with API calls
const MOCK_STATS = {
    activeEngagements: 12,
    workstreamsInProgress: 28,
    pendingEscalations: 3,
    agentsHealthy: 11
};

const MOCK_DEADLINES = [
    { id: 1, client: 'Acme Corp MT', workflow: 'VAT Return Q4', due: '2026-02-15', agent: 'Matthew', status: 'on_track' },
    { id: 2, client: 'TechStart RW', workflow: 'CIT Annual', due: '2026-02-10', agent: 'Emmanuel', status: 'at_risk' },
    { id: 3, client: 'Malta Holdings', workflow: 'Annual Return', due: '2026-02-08', agent: 'Claire', status: 'on_track' },
    { id: 4, client: 'Kigali Ventures', workflow: 'Contract Draft', due: '2026-02-05', agent: 'Chantal', status: 'blocked' }
];

const MOCK_ESCALATIONS = [
    { id: 1, type: 'TIER_C', client: 'TechStart RW', reason: 'First-time CIT filing — requires operator review', agent: 'Emmanuel', created: '2h ago' },
    { id: 2, type: 'TIER_C', client: 'Acme Corp MT', reason: 'Dispute signal detected in correspondence', agent: 'Matthew', created: '4h ago' },
    { id: 3, type: 'GUARDIAN_BLOCK', client: 'Kigali Ventures', reason: 'Missing required evidence: signed engagement letter', agent: 'Chantal', created: '1d ago' }
];

export default function ControlTower() {
    const [stats] = useState(MOCK_STATS);

    return (
        <div className="animate-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1>Control Tower</h1>
                <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                    System overview and operator actions
                </p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <StatCard
                    value={stats.activeEngagements}
                    label="Active Engagements"
                    color="var(--accent-orchestrator)"
                />
                <StatCard
                    value={stats.workstreamsInProgress}
                    label="Workstreams In Progress"
                    color="var(--accent-accounting)"
                />
                <StatCard
                    value={stats.pendingEscalations}
                    label="Pending Escalations"
                    color="var(--status-warning)"
                    highlight
                />
                <StatCard
                    value={stats.agentsHealthy}
                    label="Agents Healthy"
                    color="var(--status-healthy)"
                />
            </div>

            {/* Escalations (Priority) */}
            <section style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>
                    ⚠️ Pending Escalations
                </h2>
                <div className="card">
                    {MOCK_ESCALATIONS.map((esc) => (
                        <div
                            key={esc.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 'var(--space-md)',
                                padding: 'var(--space-md) 0',
                                borderBottom: '1px solid var(--border-subtle)'
                            }}
                        >
                            <span
                                className={`badge ${esc.type === 'GUARDIAN_BLOCK' ? 'badge-error' : 'badge-warning'}`}
                            >
                                {esc.type === 'GUARDIAN_BLOCK' ? 'BLOCKED' : 'REVIEW'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 500 }}>{esc.client}</p>
                                <p className="text-secondary text-sm">{esc.reason}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p className="text-sm">{esc.agent}</p>
                                <p className="text-muted text-xs">{esc.created}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Upcoming Deadlines */}
            <section>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>
                    📅 Upcoming Deadlines
                </h2>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Workflow</th>
                                <th>Due Date</th>
                                <th>Agent</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_DEADLINES.map((d) => (
                                <tr key={d.id}>
                                    <td style={{ fontWeight: 500 }}>{d.client}</td>
                                    <td>{d.workflow}</td>
                                    <td>{d.due}</td>
                                    <td>{d.agent}</td>
                                    <td>
                                        <span className={`badge badge-${d.status === 'on_track' ? 'healthy' :
                                            d.status === 'at_risk' ? 'warning' : 'error'
                                            }`}>
                                            {d.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function StatCard({
    value,
    label,
    color,
    highlight = false
}: {
    value: number;
    label: string;
    color: string;
    highlight?: boolean;
}) {
    return (
        <div
            className="card"
            style={{
                borderColor: highlight ? color : undefined,
                boxShadow: highlight ? `0 0 20px ${color}33` : undefined
            }}
        >
            <p className="stat-value" style={{ color }}>{value}</p>
            <p className="stat-label">{label}</p>
        </div>
    );
}
