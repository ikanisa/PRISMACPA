/**
 * Auth Gate — Lit component that gates the app behind authentication
 * 
 * Shows login screen if not authenticated, otherwise renders child content.
 * Uses Google OAuth via Supabase.
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authStore, type AuthState } from './auth-state';

@customElement('auth-gate')
export class AuthGate extends LitElement {
    @state() private authState: AuthState = authStore.getState();
    @state() private signingIn = false;

    private unsubscribe: (() => void) | null = null;

    static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--bg-primary, #0a0a0a);
      color: var(--text-primary, #f5f5f5);
      font-family: system-ui, -apple-system, sans-serif;
    }

    .login-card {
      max-width: 400px;
      width: 100%;
      padding: 48px;
      background: var(--bg-secondary, #141414);
      border-radius: 12px;
      border: 1px solid var(--border-subtle, #2a2a2a);
      text-align: center;
    }

    .logo {
      font-size: 3rem;
      margin-bottom: 24px;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .subtitle {
      color: var(--text-secondary, #888);
      font-size: 0.875rem;
      margin-bottom: 32px;
    }

    .error {
      padding: 12px 16px;
      background: rgba(239, 68, 68, 0.15);
      border-radius: 8px;
      color: #ef4444;
      font-size: 0.875rem;
      margin-bottom: 24px;
    }

    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 14px 24px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid var(--border-subtle, #2a2a2a);
      background: white;
      color: #1f2937;
      cursor: pointer;
      transition: background 0.15s;
    }

    .google-btn:hover:not(:disabled) {
      background: #f5f5f5;
    }

    .google-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .google-icon {
      width: 20px;
      height: 20px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: var(--bg-primary, #0a0a0a);
      color: var(--text-secondary, #888);
    }

    .note {
      margin-top: 24px;
      font-size: 0.75rem;
      color: var(--text-muted, #666);
    }
  `;

    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = authStore.subscribe((state) => {
            this.authState = state;
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.unsubscribe?.();
    }

    private async handleGoogleSignIn() {
        this.signingIn = true;
        await authStore.signInWithGoogle();
        // If successful, user will be redirected to Google
        // If error, signingIn stays true but error is shown
        this.signingIn = false;
    }

    private renderLoading() {
        return html`
      <div class="loading">
        Checking authentication...
      </div>
    `;
    }

    private renderLogin() {
        return html`
      <div class="login-container">
        <div class="login-card">
          <div class="logo">🔐</div>
          <h1>OpenClaw Control</h1>
          <p class="subtitle">11-Agent Operating System for Professional Services</p>
          
          ${this.authState.error ? html`
            <div class="error">${this.authState.error}</div>
          ` : ''}
          
          <button 
            class="google-btn" 
            @click=${this.handleGoogleSignIn}
            ?disabled=${this.signingIn}
          >
            ${!this.signingIn ? html`
              <svg class="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            ` : ''}
            ${this.signingIn ? 'Redirecting to Google...' : 'Sign in with Google'}
          </button>
          
          <p class="note">Only authorized operators can access this dashboard.</p>
        </div>
      </div>
    `;
    }

    render() {
        if (this.authState.loading) {
            return this.renderLoading();
        }

        if (!this.authState.session) {
            return this.renderLogin();
        }

        // Authenticated — render the app
        return html`<slot></slot>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'auth-gate': AuthGate;
    }
}
