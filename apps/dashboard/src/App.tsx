import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { GatewayProvider } from './contexts/GatewayContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { ConnectionIndicator } from './components/ConnectionIndicator';
import Login from './views/Login';
import ControlTower from './views/ControlTower';
import AIAssistant from './views/AIAssistant';
import Services from './views/Services';
import Packs from './views/Packs';
import PolicyConsole from './views/PolicyConsole';
import { Incidents } from './views/Incidents';
import { Releases } from './views/Releases';
import NotFound from './views/NotFound';


function DashboardLayout() {
    const { operator, signOut } = useAuth();

    const handleLogout = async () => {
        if (confirm('Sign out from this dashboard?')) {
            await signOut();
        }
    };

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
                    <ConnectionIndicator />
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        ⚡ Control Tower
                    </NavLink>
                    <NavLink to="/assistant" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        🤖 AI Assistant
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
                        <p className="text-xs text-muted">Signed in as</p>
                        <p className="text-sm" style={{
                            fontWeight: 500,
                            marginBottom: 'var(--space-sm)',
                            wordBreak: 'break-all'
                        }}>
                            {operator?.email || 'Operator'}
                        </p>
                        <p className="text-xs" style={{
                            color: 'var(--accent-orchestrator)',
                            marginBottom: 'var(--space-sm)'
                        }}>
                            ✓ {operator?.role || 'operator'}
                        </p>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: 'var(--space-xs) var(--space-sm)',
                                background: 'transparent',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Routes>
                    <Route path="/" element={<ControlTower />} />
                    <Route path="/assistant" element={<AIAssistant />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/packs" element={<Packs />} />
                    <Route path="/releases" element={<Releases />} />
                    <Route path="/incidents" element={<Incidents />} />
                    <Route path="/policy" element={<AdminRoute><PolicyConsole /></AdminRoute>} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            {/* Keep register-device for backwards compatibility */}
            <Route path="/register-device" element={<Login />} />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <GatewayProvider>
                            <DashboardLayout />
                        </GatewayProvider>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
