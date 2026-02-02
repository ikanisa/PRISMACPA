/**
 * Services View — FirmOS Service Lines
 * Shows all services with assigned agents and active engagements
 */

const SERVICES = [
    {
        id: 'audit',
        name: 'Audit & Assurance',
        icon: '📊',
        owner: 'Patrick',
        color: 'var(--accent-audit)',
        engagements: 4,
        programs: ['audit_program']
    },
    {
        id: 'accounting',
        name: 'Accounting & Financial Reporting',
        icon: '📒',
        owner: 'Sofia',
        color: 'var(--accent-accounting)',
        engagements: 8,
        programs: ['accounting_close_program']
    },
    {
        id: 'advisory',
        name: 'Advisory & Consulting',
        icon: '💡',
        owner: 'James',
        color: 'var(--accent-advisory)',
        engagements: 2,
        programs: ['advisory_cfo_program']
    },
    {
        id: 'risk',
        name: 'Risk, Controls & Internal Audit',
        icon: '🛡️',
        owner: 'Fatima',
        color: 'var(--accent-risk)',
        engagements: 3,
        programs: ['internal_audit_program']
    },
    {
        id: 'mt_tax',
        name: 'Malta Tax',
        icon: '🇲🇹',
        owner: 'Matthew',
        color: 'var(--accent-malta)',
        engagements: 6,
        programs: ['mt_tax']
    },
    {
        id: 'mt_csp',
        name: 'Malta CSP/MBR',
        icon: '🏢',
        owner: 'Claire',
        color: 'var(--accent-malta)',
        engagements: 5,
        programs: ['mt_csp']
    },
    {
        id: 'rw_tax',
        name: 'Rwanda Tax',
        icon: '🇷🇼',
        owner: 'Emmanuel',
        color: 'var(--accent-rwanda)',
        engagements: 4,
        programs: ['rw_tax']
    },
    {
        id: 'rw_notary',
        name: 'Rwanda Private Notary',
        icon: '⚖️',
        owner: 'Chantal',
        color: 'var(--accent-rwanda)',
        engagements: 7,
        programs: ['rw_private_notary']
    }
];

export default function Services() {
    return (
        <div className="animate-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1>Services</h1>
                <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                    Service lines and their assigned agents
                </p>
            </header>

            <div className="grid grid-2">
                {SERVICES.map(service => (
                    <ServiceCard key={service.id} service={service} />
                ))}
            </div>
        </div>
    );
}

function ServiceCard({ service }: { service: typeof SERVICES[0] }) {
    return (
        <div
            className="card"
            style={{
                borderLeft: `3px solid ${service.color}`,
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
                    <p className="stat-value" style={{ fontSize: '1.5rem', color: service.color }}>
                        {service.engagements}
                    </p>
                    <p className="text-muted text-xs">Active Engagements</p>
                </div>
                <div>
                    <p className="stat-value" style={{ fontSize: '1.5rem' }}>
                        {service.programs.length}
                    </p>
                    <p className="text-muted text-xs">Programs</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                {service.programs.map(p => (
                    <span
                        key={p}
                        style={{
                            background: 'var(--bg-glass)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)'
                        }}
                    >
                        {p}
                    </span>
                ))}
            </div>
        </div>
    );
}
