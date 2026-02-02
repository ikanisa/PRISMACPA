/**
 * Agents View — The 11 FirmOS L5 Agents
 * Shows all agents with skills, proficiency, health, and domain
 */

import { useState, useEffect } from 'react';
import { loadAgents, type AgentCardData } from '../api';

export default function Agents() {
    const [agents, setAgents] = useState<AgentCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        loadAgents()
            .then(setAgents)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="animate-in">
                <header style={{ marginBottom: 'var(--space-xl)' }}>
                    <h1>Agents</h1>
                    <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                        Loading agent roster...
                    </p>
                </header>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-in">
                <header style={{ marginBottom: 'var(--space-xl)' }}>
                    <h1>Agents</h1>
                    <p style={{ marginTop: 'var(--space-xs)', color: 'var(--color-error)' }}>
                        Error: {error}
                    </p>
                </header>
            </div>
        );
    }

    const governance = agents.filter(a => ['agent_aline', 'agent_marco', 'agent_diane'].includes(a.id));
    const globalService = agents.filter(a => ['agent_patrick', 'agent_sofia', 'agent_james', 'agent_fatima'].includes(a.id));
    const malta = agents.filter(a => a.domain === 'malta');
    const rwanda = agents.filter(a => a.domain === 'rwanda');

    const totalSkills = agents.reduce((sum, a) => sum + a.skillCount, 0);

    return (
        <div className="animate-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1>Agents</h1>
                <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                    11-agent autonomous system • L5 Partner-level mastery
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                    <span className="badge badge-healthy">{totalSkills} total skills</span>
                    <span className="badge">All agents L5</span>
                </div>
            </header>

            {/* Governance Agents */}
            <Section title="🏛️ Governance" description="Orchestration, policy, and quality">
                <div className="grid grid-3">
                    {governance.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            expanded={expandedAgent === agent.id}
                            onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                        />
                    ))}
                </div>
            </Section>

            {/* Global Service Agents */}
            <Section title="🌍 Global Services" description="Cross-jurisdiction programs">
                <div className="grid grid-4">
                    {globalService.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            expanded={expandedAgent === agent.id}
                            onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                        />
                    ))}
                </div>
            </Section>

            {/* Malta Agents */}
            <Section title="🇲🇹 Malta" description="MT Tax & CSP/MBR">
                <div className="grid grid-2">
                    {malta.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            expanded={expandedAgent === agent.id}
                            onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                        />
                    ))}
                </div>
            </Section>

            {/* Rwanda Agents */}
            <Section title="🇷🇼 Rwanda" description="RW Tax & Private Notary">
                <div className="grid grid-2">
                    {rwanda.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            expanded={expandedAgent === agent.id}
                            onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                        />
                    ))}
                </div>
            </Section>
        </div>
    );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
                <h2>{title}</h2>
                <p className="text-muted text-sm">{description}</p>
            </div>
            {children}
        </section>
    );
}

function AgentCard({ agent, expanded, onToggle }: { agent: AgentCardData; expanded: boolean; onToggle: () => void }) {
    return (
        <div
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', cursor: 'pointer' }}
            onClick={onToggle}
        >
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <div
                    className={`agent-avatar ${agent.domain}`}
                    style={{ flexShrink: 0 }}
                >
                    {agent.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <h3>{agent.name}</h3>
                        <span className={`badge badge-${agent.status === 'healthy' ? 'healthy' : 'warning'}`}>
                            {agent.status}
                        </span>
                        <span className="badge" style={{ background: 'var(--accent-orchestrator)', color: 'white', fontSize: '10px' }}>
                            {agent.masteryLevel}
                        </span>
                    </div>
                    <p className="text-secondary text-sm" style={{ marginTop: 2 }}>{agent.role}</p>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        <span className="text-muted text-xs">{agent.jobs} jobs</span>
                        <span className="text-muted text-xs">• {agent.skillCount} skills</span>
                        <span className="text-muted text-xs">• {agent.evidenceTypes} evidence types</span>
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div
                    style={{
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: 'var(--space-md)',
                        marginTop: 'var(--space-xs)'
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div>
                            <p className="text-xs text-muted">Key Metric</p>
                            <p className="text-sm">{agent.keyMetric}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Skills Overview</p>
                            <p className="text-sm">{agent.skillCount} skills @ L5</p>
                        </div>
                    </div>
                    <div style={{ marginTop: 'var(--space-sm)' }}>
                        <p className="text-xs text-muted">Evidence Required</p>
                        <p className="text-sm">{agent.evidenceTypes} category types</p>
                    </div>
                </div>
            )}
        </div>
    );
}
