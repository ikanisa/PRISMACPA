/**
 * Policy Console — Marco's Autonomy Rules
 * Shows tier definitions and recent decisions
 */

const TIER_DEFINITIONS = [
    {
        tier: 'A',
        name: 'Full Auto',
        color: 'var(--status-healthy)',
        description: 'Internal operations, routine tasks with approved templates',
        examples: ['Invoice indexing', 'Scheduled reminders', 'Internal document versioning'],
        conditions: [
            'No external impact',
            'Novelty score ≤ 30',
            'Evidence completeness ≥ 70%',
            'Has approved template'
        ]
    },
    {
        tier: 'B',
        name: 'Auto + Check',
        color: 'var(--status-warning)',
        description: 'Routine drafting from templates, standard workflows',
        examples: ['Document generation', 'Standard calculations', 'Compliance checks'],
        conditions: [
            'No external impact',
            'Novelty score 30-70',
            'Evidence completeness ≥ 50%'
        ]
    },
    {
        tier: 'C',
        name: 'Escalate',
        color: 'var(--status-error)',
        description: 'Novel, uncertain, dispute, or regulatory actions',
        examples: ['First-time filings', 'Dispute responses', 'External submissions'],
        conditions: [
            'External impact = true',
            'OR dispute/regulatory signal',
            'OR novelty score > 70',
            'OR first-time execution',
            'OR evidence < 50%'
        ]
    }
];

const RECENT_DECISIONS = [
    { id: 1, action: 'Generate VAT Return draft', client: 'Acme Corp', tier: 'B', agent: 'Matthew', time: '2m ago' },
    { id: 2, action: 'Submit Annual Return to MBR', client: 'Malta Holdings', tier: 'C', agent: 'Claire', time: '15m ago' },
    { id: 3, action: 'Index incoming invoices', client: 'TechStart RW', tier: 'A', agent: 'Emmanuel', time: '23m ago' },
    { id: 4, action: 'Draft legal opinion', client: 'Kigali Ventures', tier: 'C', agent: 'Chantal', time: '1h ago' },
    { id: 5, action: 'Run guardian pre-flight', client: 'Acme Corp', tier: 'A', agent: 'Diane', time: '1h ago' }
];

export default function PolicyConsole() {
    return (
        <div className="animate-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1>Policy Console</h1>
                <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                    Marco's autonomy rules and decision log
                </p>
            </header>

            {/* Tier Definitions */}
            <section style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>Autonomy Tiers</h2>
                <div className="grid grid-3">
                    {TIER_DEFINITIONS.map(tier => (
                        <TierCard key={tier.tier} tier={tier} />
                    ))}
                </div>
            </section>

            {/* Recent Decisions */}
            <section>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>Recent Decisions</h2>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Client</th>
                                <th>Tier</th>
                                <th>Agent</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_DECISIONS.map(d => (
                                <tr key={d.id}>
                                    <td style={{ fontWeight: 500 }}>{d.action}</td>
                                    <td className="text-secondary">{d.client}</td>
                                    <td>
                                        <TierBadge tier={d.tier as 'A' | 'B' | 'C'} />
                                    </td>
                                    <td>{d.agent}</td>
                                    <td className="text-muted">{d.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Key Rules */}
            <section style={{ marginTop: 'var(--space-xl)' }}>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>Key Policy Rules</h2>
                <div className="grid grid-2">
                    <RuleCard
                        icon="🔐"
                        title="release_action Gate"
                        description="Only Marco can authorize release_action tool. Diane can block any release with guardian report."
                    />
                    <RuleCard
                        icon="🌍"
                        title="Jurisdiction Isolation"
                        description="Malta agents cannot use Rwanda packs. Emmanuel/Chantal are bound to RW. Matthew/Claire are bound to MT."
                    />
                    <RuleCard
                        icon="📎"
                        title="Evidence-First"
                        description="All outputs must be evidence-linked. Guardian checks verify hash integrity before any release."
                    />
                    <RuleCard
                        icon="👤"
                        title="Operator Visibility"
                        description="Operator only sees Tier C escalations and GUARDIAN_BLOCK events. Tiers A/B run silently."
                    />
                </div>
            </section>
        </div>
    );
}

function TierCard({ tier }: { tier: typeof TIER_DEFINITIONS[0] }) {
    return (
        <div
            className="card"
            style={{ borderTop: `3px solid ${tier.color}` }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <span
                    style={{
                        background: tier.color,
                        color: 'white',
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                    }}
                >
                    {tier.tier}
                </span>
                <h3>{tier.name}</h3>
            </div>

            <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-md)' }}>
                {tier.description}
            </p>

            <div style={{ marginBottom: 'var(--space-md)' }}>
                <p className="text-muted text-xs" style={{ marginBottom: 'var(--space-xs)' }}>CONDITIONS</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {tier.conditions.map((c, i) => (
                        <li key={i} className="text-sm" style={{ marginBottom: 2 }}>
                            • {c}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <p className="text-muted text-xs" style={{ marginBottom: 'var(--space-xs)' }}>EXAMPLES</p>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                    {tier.examples.map(e => (
                        <span
                            key={e}
                            style={{
                                background: 'var(--bg-glass)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem'
                            }}
                        >
                            {e}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TierBadge({ tier }: { tier: 'A' | 'B' | 'C' }) {
    const colors: Record<string, string> = {
        A: 'var(--status-healthy)',
        B: 'var(--status-warning)',
        C: 'var(--status-error)'
    };

    return (
        <span
            style={{
                background: colors[tier],
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '0.75rem'
            }}
        >
            Tier {tier}
        </span>
    );
}

function RuleCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="card" style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <div>
                <h3 style={{ marginBottom: 'var(--space-xs)' }}>{title}</h3>
                <p className="text-secondary text-sm">{description}</p>
            </div>
        </div>
    );
}
