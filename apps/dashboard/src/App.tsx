import { Routes, Route, NavLink } from 'react-router-dom';
import ControlTower from './views/ControlTower';
import Agents from './views/Agents';
import Services from './views/Services';
import Packs from './views/Packs';
import PolicyConsole from './views/PolicyConsole';
import { Incidents } from './views/Incidents';
import { Releases } from './views/Releases';

export default function App() {
    return (
        <div className="layout">
            <aside className="sidebar">
                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h1 style={{ fontSize: '1.25rem' }}>
                        <span style={{ color: 'var(--accent-orchestrator)' }}>Firm</span>OS
                    </h1>
                    <p className="text-muted text-xs" style={{ marginTop: '4px' }}>
                        11-Agent Operating System
                    </p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        ⚡ Control Tower
                    </NavLink>
                    <NavLink to="/agents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        🤖 Agents
                    </NavLink>
                    <NavLink to="/services" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        📋 Services
                    </NavLink>
                    <NavLink to="/packs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        📦 Packs
                    </NavLink>
                    <NavLink to="/releases" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        🚀 Releases
                    </NavLink>
                    <NavLink to="/incidents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        ⚠️ Incidents
                    </NavLink>
                    <NavLink to="/policy" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        ⚖️ Policy Console
                    </NavLink>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-xl)' }}>
                    <div className="card" style={{ padding: 'var(--space-md)' }}>
                        <p className="text-xs text-muted">Operator</p>
                        <p className="text-sm" style={{ fontWeight: 500 }}>operator@firmos.local</p>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Routes>
                    <Route path="/" element={<ControlTower />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/packs" element={<Packs />} />
                    <Route path="/releases" element={<Releases />} />
                    <Route path="/incidents" element={<Incidents />} />
                    <Route path="/policy" element={<PolicyConsole />} />
                </Routes>
            </main>
        </div>
    );
}

