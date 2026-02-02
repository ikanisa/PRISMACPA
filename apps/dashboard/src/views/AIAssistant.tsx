/**
 * AI Assistant View — Unified Agent + Chat Interface
 * Combines agent selection with real-time chat in a single view
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGatewayContext } from '../contexts/GatewayContext';
import { loadAgents, type AgentCardData } from '../api';
import type { ChatMessage, Session, ChatHistoryResult, ChatSendResult, SessionsListResult } from '../api/types';
import type { GatewayEventFrame } from '../api/gateway';

type ChatEventPayload = {
    runId: string;
    sessionKey: string;
    seq: number;
    state: 'started' | 'delta' | 'final' | 'error';
    delta?: string;
    message?: ChatMessage;
    errorMessage?: string;
};

export default function AIAssistant() {
    const { connected, request, subscribe } = useGatewayContext();

    // Agent state
    const [agents, setAgents] = useState<AgentCardData[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [agentsLoading, setAgentsLoading] = useState(true);

    // Chat state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamingContent, setStreamingContent] = useState<string>('');
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedSessionRef = useRef(selectedSession);

    // Keep ref in sync
    useEffect(() => {
        selectedSessionRef.current = selectedSession;
    }, [selectedSession]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    // Load agents on mount
    useEffect(() => {
        loadAgents()
            .then(setAgents)
            .catch(err => setError(err.message))
            .finally(() => setAgentsLoading(false));
    }, []);

    // Subscribe to chat events
    useEffect(() => {
        const unsubscribe = subscribe((evt: GatewayEventFrame) => {
            if (evt.event !== 'chat') { return; }

            const payload = evt.payload as ChatEventPayload;
            if (payload.sessionKey !== selectedSessionRef.current) { return; }

            switch (payload.state) {
                case 'delta':
                    if (payload.delta) {
                        setStreamingContent(prev => prev + payload.delta);
                    }
                    break;
                case 'final':
                    if (payload.message) {
                        setMessages(prev => [...prev, payload.message!]);
                    }
                    setStreamingContent('');
                    setSending(false);
                    setCurrentRunId(null);
                    break;
                case 'error':
                    setError(payload.errorMessage || 'Chat error occurred');
                    setStreamingContent('');
                    setSending(false);
                    setCurrentRunId(null);
                    break;
            }
        });

        return unsubscribe;
    }, [subscribe]);

    // Load sessions when connected
    useEffect(() => {
        if (!connected) { return; }

        const loadSessions = async () => {
            setLoading(true);
            try {
                const sessionsResult = await request<SessionsListResult>('sessions.list', {
                    limit: 50,
                    includeDerivedTitles: true,
                    includeLastMessage: true,
                });
                setSessions(sessionsResult.sessions);
                if (sessionsResult.sessions.length > 0 && !selectedSession) {
                    setSelectedSession(sessionsResult.sessions[0].key);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load sessions');
            } finally {
                setLoading(false);
            }
        };

        void loadSessions();
    }, [connected, request]);

    // Load chat history when session changes
    useEffect(() => {
        if (!connected || !selectedSession) {
            setMessages([]);
            return;
        }

        const loadHistory = async () => {
            setLoading(true);
            try {
                const result = await request<ChatHistoryResult>('chat.history', {
                    sessionKey: selectedSession,
                    limit: 100,
                });
                setMessages(result.messages);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load history');
            } finally {
                setLoading(false);
            }
        };

        void loadHistory();
    }, [connected, selectedSession, request]);

    // Send message
    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || !selectedSession || sending) { return; }

        const messageText = inputValue.trim();
        setInputValue('');
        setSending(true);
        setError(null);

        const userMessage: ChatMessage = {
            role: 'user',
            content: [{ type: 'text', text: messageText }],
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const idempotencyKey = crypto.randomUUID();
            const result = await request<ChatSendResult>('chat.send', {
                sessionKey: selectedSession,
                message: messageText,
                idempotencyKey,
            });
            setCurrentRunId(result.runId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
            setSending(false);
        }
    }, [inputValue, selectedSession, sending, request]);

    // Handle abort
    const handleAbort = useCallback(async () => {
        if (!currentRunId || !selectedSession) { return; }

        try {
            await request<{ ok: boolean; aborted: boolean }>('chat.abort', {
                sessionKey: selectedSession,
                runId: currentRunId,
            });
            setStreamingContent('');
            setSending(false);
            setCurrentRunId(null);
        } catch (err) {
            console.error('Failed to abort:', err);
        }
    }, [currentRunId, selectedSession, request]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    const getSessionName = (session: Session) => {
        return session.derivedTitle || session.displayName || session.label || session.key;
    };

    // Group agents by category
    const governance = agents.filter(a => ['agent_aline', 'agent_marco', 'agent_diane'].includes(a.id));
    const globalService = agents.filter(a => ['agent_patrick', 'agent_sofia', 'agent_james', 'agent_fatima'].includes(a.id));
    const malta = agents.filter(a => a.domain === 'malta');
    const rwanda = agents.filter(a => a.domain === 'rwanda');

    if (!connected) {
        return (
            <div className="animate-in">
                <header style={{ marginBottom: 'var(--space-xl)' }}>
                    <h1>🤖 AI Assistant</h1>
                    <p style={{ marginTop: 'var(--space-xs)', color: 'var(--color-error)' }}>
                        ⚠️ Gateway not connected. Start the gateway to enable chat.
                    </p>
                </header>
                <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                    <p className="text-secondary">
                        Run <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                            openclaw gateway run --port 18789
                        </code> to start the gateway.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in" style={{ display: 'flex', gap: 'var(--space-lg)', height: '100%' }}>
            {/* Agent Selector Panel */}
            <div style={{
                width: '280px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                overflow: 'auto',
            }}>
                <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-xs)' }}>Agents</h2>

                {agentsLoading ? (
                    <p className="text-muted text-sm">Loading agents...</p>
                ) : (
                    <>
                        <AgentGroup title="🏛️ Governance" agents={governance} selected={selectedAgent} onSelect={setSelectedAgent} />
                        <AgentGroup title="🌍 Global" agents={globalService} selected={selectedAgent} onSelect={setSelectedAgent} />
                        <AgentGroup title="🇲🇹 Malta" agents={malta} selected={selectedAgent} onSelect={setSelectedAgent} />
                        <AgentGroup title="🇷🇼 Rwanda" agents={rwanda} selected={selectedAgent} onSelect={setSelectedAgent} />
                    </>
                )}
            </div>

            {/* Chat Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <header style={{ marginBottom: 'var(--space-md)' }}>
                    <h1>🤖 AI Assistant</h1>
                    <p className="text-secondary text-sm">
                        {selectedAgent ? `Chatting with ${agents.find(a => a.id === selectedAgent)?.name || 'Agent'}` : 'Real-time chat with FirmOS agents'}
                    </p>
                </header>

                {/* Session Selector */}
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <select
                        value={selectedSession}
                        onChange={e => setSelectedSession(e.target.value)}
                        style={{
                            width: '100%',
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                        }}
                    >
                        <option value="">Select a session...</option>
                        {sessions.map(session => (
                            <option key={session.key} value={session.key}>
                                {getSessionName(session)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Error display */}
                {error && (
                    <div style={{
                        padding: 'var(--space-sm) var(--space-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-error)',
                        marginBottom: 'var(--space-md)',
                    }}>
                        {error}
                    </div>
                )}

                {/* Messages Area */}
                <div
                    className="card"
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: 'var(--space-md)',
                        minHeight: '200px',
                    }}
                >
                    {loading && messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                            <p className="text-secondary">Loading...</p>
                        </div>
                    ) : messages.length === 0 && !selectedSession ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                            <p className="text-secondary">Select a session to start chatting</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                            <p className="text-secondary">No messages yet. Send a message to start.</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        marginBottom: 'var(--space-md)',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'transparent',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: msg.role === 'assistant' ? '3px solid var(--color-primary)' : 'none',
                                    }}
                                >
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-tertiary)',
                                        marginBottom: 'var(--space-xs)',
                                        textTransform: 'capitalize',
                                    }}>
                                        {msg.role}
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {msg.content.map((c, i) => (
                                            <span key={i}>{c.type === 'text' ? c.text : `[${c.type}]`}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Streaming content */}
                            {streamingContent && (
                                <div
                                    style={{
                                        marginBottom: 'var(--space-md)',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        borderLeft: '3px solid var(--color-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        opacity: 0.8,
                                    }}
                                >
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-tertiary)',
                                        marginBottom: 'var(--space-xs)',
                                    }}>
                                        Assistant (streaming...)
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {streamingContent}
                                        <span style={{ animation: 'pulse 1s infinite' }}>▊</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div style={{
                    marginTop: 'var(--space-md)',
                    display: 'flex',
                    gap: 'var(--space-sm)',
                }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedSession ? 'Type a message...' : 'Select a session first'}
                        disabled={!selectedSession || sending}
                        style={{
                            flex: 1,
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                        }}
                    />
                    {sending ? (
                        <button
                            onClick={handleAbort}
                            style={{
                                padding: 'var(--space-md) var(--space-xl)',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: 'var(--color-error)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Abort
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!selectedSession || !inputValue.trim()}
                            style={{
                                padding: 'var(--space-md) var(--space-xl)',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: !selectedSession || !inputValue.trim()
                                    ? 'var(--bg-tertiary)'
                                    : 'var(--color-primary)',
                                color: !selectedSession || !inputValue.trim()
                                    ? 'var(--text-tertiary)'
                                    : 'white',
                                cursor: !selectedSession || !inputValue.trim() ? 'not-allowed' : 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Send
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Agent Group Component
function AgentGroup({
    title,
    agents,
    selected,
    onSelect
}: {
    title: string;
    agents: AgentCardData[];
    selected: string | null;
    onSelect: (id: string | null) => void;
}) {
    if (agents.length === 0) { return null; }

    return (
        <div>
            <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-xs)' }}>{title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {agents.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => onSelect(selected === agent.id ? null : agent.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: selected === agent.id ? 'var(--bg-tertiary)' : 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'background 0.15s',
                        }}
                    >
                        <div
                            className={`agent-avatar ${agent.domain}`}
                            style={{ width: '28px', height: '28px', fontSize: '12px' }}
                        >
                            {agent.name[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{agent.name}</p>
                            <p className="text-muted text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {agent.role}
                            </p>
                        </div>
                        <span className={`badge badge-${agent.status === 'healthy' ? 'healthy' : 'warning'}`} style={{ fontSize: '9px' }}>
                            {agent.status === 'healthy' ? '●' : '○'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
