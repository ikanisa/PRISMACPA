/**
 * Packs View — Country-Specific Compliance Packs
 * Shows Malta and Rwanda jurisdiction packs with workflows
 */

const PACKS = [
    {
        id: 'mt_tax',
        name: 'Malta Tax Pack',
        jurisdiction: 'MT',
        agent: 'Matthew',
        version: '1.0',
        workflows: ['vat_return', 'income_tax_annual', 'provisional_tax'],
        activeWorkstreams: 6
    },
    {
        id: 'mt_csp',
        name: 'Malta CSP/MBR Pack',
        jurisdiction: 'MT',
        agent: 'Claire',
        version: '1.0',
        workflows: ['annual_return', 'board_minutes', 'director_change', 'ubo_registration'],
        activeWorkstreams: 5
    },
    {
        id: 'rw_tax',
        name: 'Rwanda Tax Pack',
        jurisdiction: 'RW',
        agent: 'Emmanuel',
        version: '1.0',
        workflows: ['vat_return', 'corporate_income_tax', 'paye_monthly'],
        activeWorkstreams: 4
    },
    {
        id: 'rw_private_notary',
        name: 'Rwanda Private Notary Pack',
        jurisdiction: 'RW',
        agent: 'Chantal',
        version: '1.0',
        workflows: ['legal_opinion', 'risk_assessment', 'contract_drafting', 'company_formation', 'signing_coordination', 'notarization_support', 'matter_archival'],
        activeWorkstreams: 7,
        modules: ['Legal Advisory', 'Document Factory', 'Execution Support']
    }
];

export default function Packs() {
    return (
        <div className="animate-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1>Jurisdiction Packs</h1>
                <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                    Country-specific compliance workflows
                </p>
            </header>

            {/* Malta */}
            <Section title="🇲🇹 Malta" color="var(--accent-malta)">
                <div className="grid grid-2">
                    {PACKS.filter(p => p.jurisdiction === 'MT').map(pack => (
                        <PackCard key={pack.id} pack={pack} />
                    ))}
                </div>
            </Section>

            {/* Rwanda */}
            <Section title="🇷🇼 Rwanda" color="var(--accent-rwanda)">
                <div className="grid grid-2">
                    {PACKS.filter(p => p.jurisdiction === 'RW').map(pack => (
                        <PackCard key={pack.id} pack={pack} />
                    ))}
                </div>
            </Section>

            {/* Separation Warning */}
            <div
                className="card"
                style={{
                    marginTop: 'var(--space-xl)',
                    background: 'rgba(239, 68, 68, 0.05)',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <div>
                        <h3 style={{ color: 'var(--status-error)' }}>Strict Jurisdiction Separation</h3>
                        <p className="text-secondary text-sm">
                            Malta packs cannot be used in Rwanda workflows and vice versa.
                            Diane (Guardian) will block any cross-jurisdiction attempts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                {title}
                <span
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: color
                    }}
                />
            </h2>
            {children}
        </section>
    );
}

function PackCard({ pack }: { pack: typeof PACKS[0] }) {
    const color = pack.jurisdiction === 'MT' ? 'var(--accent-malta)' : 'var(--accent-rwanda)';

    return (
        <div
            className="card"
            style={{ borderTop: `3px solid ${color}` }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3>{pack.name}</h3>
                    <p className="text-secondary text-sm">Agent: {pack.agent}</p>
                </div>
                <span
                    style={{
                        background: 'var(--bg-glass)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)'
                    }}
                >
                    v{pack.version}
                </span>
            </div>

            {'modules' in pack && pack.modules && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                    <p className="text-muted text-xs" style={{ marginBottom: 'var(--space-xs)' }}>MODULES</p>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                        {pack.modules.map(m => (
                            <span key={m} className="badge badge-healthy">{m}</span>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 'var(--space-md)' }}>
                <p className="text-muted text-xs" style={{ marginBottom: 'var(--space-xs)' }}>
                    WORKFLOWS ({pack.workflows.length})
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                    {pack.workflows.slice(0, 4).map(w => (
                        <span
                            key={w}
                            style={{
                                background: 'var(--bg-glass)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)'
                            }}
                        >
                            {w}
                        </span>
                    ))}
                    {pack.workflows.length > 4 && (
                        <span className="text-muted text-xs" style={{ alignSelf: 'center' }}>
                            +{pack.workflows.length - 4} more
                        </span>
                    )}
                </div>
            </div>

            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ color, fontWeight: 600 }}>{pack.activeWorkstreams}</span>
                <span className="text-muted text-sm"> active workstreams</span>
            </div>
        </div>
    );
}
