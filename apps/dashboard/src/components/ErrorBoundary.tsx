/**
 * Error Boundary — Catches unhandled errors and displays a fallback UI
 */

import React, { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        padding: 'var(--space-xl)',
                        textAlign: 'center',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '3rem',
                            marginBottom: 'var(--space-lg)',
                        }}
                    >
                        ⚠️
                    </div>
                    <h1 style={{ marginBottom: 'var(--space-md)' }}>
                        Something went wrong
                    </h1>
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-lg)',
                            maxWidth: '400px',
                        }}
                    >
                        An unexpected error occurred. Please try again or contact support if the problem persists.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            background: 'var(--accent-orchestrator)',
                            color: 'white',
                            border: 'none',
                            padding: 'var(--space-sm) var(--space-lg)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                        }}
                    >
                        Try Again
                    </button>
                    {this.state.error && (
                        <pre
                            style={{
                                marginTop: 'var(--space-xl)',
                                padding: 'var(--space-md)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                color: 'var(--status-error)',
                                maxWidth: '100%',
                                overflow: 'auto',
                                textAlign: 'left',
                            }}
                        >
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
