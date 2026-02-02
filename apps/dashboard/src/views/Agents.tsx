/**
 * Agents View — The 11 FirmOS L5 Agents
 * Shows all agents with skills, proficiency, health, and domain
 */

import { useState } from 'react';

/** L5 Agent data with skills metrics */
const AGENTS = [
    // Global Governance
    { id: 'agent_aline', name: 'Aline', role: 'Firm Orchestrator', domain: 'global', jobs: 12, status: 'healthy', skillCount: 12, evidenceTypes: 2, masteryLevel: 'L5', keyMetric: 'Workstream throughput' },
    { id: 'agent_marco', name: 'Marco', role: 'Autonomy & Policy Governor', domain: 'global', jobs: 28, status: 'healthy', skillCount: 11, evidenceTypes: 2, masteryLevel: 'L5', keyMetric: 'Policy escalation accuracy' },
    { id: 'agent_diane', name: 'Diane', role: 'Quality, Risk & Evidence Guardian', domain: 'global', jobs: 35, status: 'healthy', skillCount: 11, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Guardian pass rate' },

    // Global Service
    { id: 'agent_patrick', name: 'Patrick', role: 'Audit & Assurance Engine', domain: 'global', jobs: 4, status: 'healthy', skillCount: 15, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Audit quality score' },
    { id: 'agent_sofia', name: 'Sofia', role: 'Accounting & Financial Reporting', domain: 'global', jobs: 8, status: 'healthy', skillCount: 12, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Financial close accuracy' },
    { id: 'agent_james', name: 'James', role: 'Advisory & Consulting Engine', domain: 'global', jobs: 2, status: 'healthy', skillCount: 11, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Client satisfaction' },
    { id: 'agent_fatima', name: 'Fatima', role: 'Risk, Controls & Internal Audit', domain: 'global', jobs: 3, status: 'healthy', skillCount: 10, evidenceTypes: 3, masteryLevel: 'L5', keyMetric: 'Control effectiveness' },

    // Malta
    { id: 'agent_matthew', name: 'Matthew', role: 'Malta Tax Engine', domain: 'malta', jobs: 6, status: 'healthy', skillCount: 8, evidenceTypes: 4, masteryLevel: 'L5', keyMetric: 'Tax compliance rate' },
    { id: 'agent_claire', name: 'Claire', role: 'Malta CSP/MBR Engine', domain: 'malta', jobs: 5, status: 'healthy', skillCount: 9, evidenceTypes: 5, masteryLevel: 'L5', keyMetric: 'Registry accuracy' },

    // Rwanda
    { id: 'agent_emmanuel', name: 'Emmanuel', role: 'Rwanda Tax Engine', domain: 'rwanda', jobs: 4, status: 'warning', skillCount: 7, evidenceTypes: 4, masteryLevel: 'L5', keyMetric: 'Filing accuracy' },
    { id: 'agent_chantal', name: 'Chantal', role: 'Rwanda Private Notary Engine', domain: 'rwanda', jobs: 7, status: 'healthy', skillCount: 11, evidenceTypes: 4, masteryLevel: 'L5', keyMetric: 'Authentication rate' }
];

type Agent = typeof AGENTS[0];

export default function Agents() {
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

    return (
        <div className="animate-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1>Agents</h1>
                <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                    11-agent autonomous system • L5 Partner-level mastery
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                    <span className="badge badge-healthy">107 total skills</span>
                    <span className="badge">All agents L5</span>
                </div>
            </header>

            {/* Governance Agents */}
            <Section title="🏛️ Governance" description="Orchestration, policy, and quality">
                <div className="grid grid-3">
                    {AGENTS.filter(a => ['agent_aline', 'agent_marco', 'agent_diane'].includes(a.id)).map(agent => (
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
                    {AGENTS.filter(a => ['agent_patrick', 'agent_sofia', 'agent_james', 'agent_fatima'].includes(a.id)).map(agent => (
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
                    {AGENTS.filter(a => a.domain === 'malta').map(agent => (
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
                    {AGENTS.filter(a => a.domain === 'rwanda').map(agent => (
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

function AgentCard({ agent, expanded, onToggle }: { agent: Agent; expanded: boolean; onToggle: () => void }) {
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

