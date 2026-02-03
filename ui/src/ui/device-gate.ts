
/**
 * Device Gate — Lit component
 *
 * Implements the "Soft Liquid Glass" login screen for Gateway Authentication.
 * Blocks access to the app until a valid connection is established.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('device-gate')
export class DeviceGate extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      --gate-bg: var(--bg, #12141a);
      --gate-card: var(--card, #181b22);
      --gate-text: var(--card-foreground, #f4f4f5);
      --gate-accent: var(--accent, #ff5c5c);
      --gate-border: rgba(255, 255, 255, 0.05);
    }

    .gate-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--gate-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.3s ease;
    }

    .gate-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
      background: var(--gate-card);
      border: 1px solid var(--gate-border);
      border-radius: 16px; /* Soft radius */
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
      text-align: center;
      animation: floatUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes floatUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .brand-logo {
      width: 64px;
      height: 64px;
      margin: 0 auto 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-logo img {
      width: 40px;
      height: 40px;
    }

    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--gate-text);
    }

    p {
      margin: 0 0 2rem;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }

    .input-group {
      margin-bottom: 1.5rem;
      text-align: left;
    }

    label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--gate-border);
      border-radius: 8px;
      color: var(--gate-text);
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: var(--gate-accent);
      box-shadow: 0 0 0 2px rgba(255, 92, 92, 0.15);
      background: rgba(0, 0, 0, 0.3);
    }

    button {
      width: 100%;
      padding: 0.875rem;
      border: none;
      border-radius: 8px;
      background: var(--gate-accent);
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.1s ease;
    }

    button:hover {
      opacity: 0.9;
    }

    button:active {
      transform: scale(0.98);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-msg {
      margin-top: 1rem;
      color: #ff5c5c;
      font-size: 0.875rem;
      background: rgba(255, 92, 92, 0.1);
      padding: 0.75rem;
      border-radius: 6px;
    }

    /* Transition for content visibility */
    ::slotted(*) {
      transition: opacity 0.3s ease;
    }
  `;

  @property({ type: Boolean }) connected = false;
  @property({ type: String }) lastError: string | null = null;

  @state() private token = '';
  @state() private hasSubmitted = false;

  private handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.token.trim()) return;

    this.hasSubmitted = true;
    this.dispatchEvent(new CustomEvent('token-submit', {
      detail: { token: this.token }
    }));
  }

  render() {
    // If connected, hide the gate (but keep it mounted for transitions)
    const isLocked = !this.connected;

    return html`
      <slot style="opacity: ${isLocked ? '0' : '1'}; pointer-events: ${isLocked ? 'none' : 'auto'}"></slot>

      <div class="gate-overlay ${!isLocked ? 'hidden' : ''}">
        <div class="login-card">
          <div class="brand-logo">
            <img src="/favicon.svg" alt="Logo" />
          </div>
          <h1>Gateway Access</h1>
          <p>Authenticating with Secure Gateway</p>

          <form @submit=${this.handleSubmit}>
            <div class="input-group">
              <label for="token">Security Token</label>
              <input
                type="password"
                id="token"
                placeholder="Enter access token..."
                .value=${this.token}
                @input=${(e: Event) => this.token = (e.target as HTMLInputElement).value}
                ?disabled=${this.hasSubmitted && this.connected}
                autofocus
              />
            </div>

            <button type="submit" ?disabled=${!this.token.trim()}>
              ${this.hasSubmitted && !this.lastError && !this.connected ? 'Connecting...' : 'Connect'}
            </button>

            ${this.lastError ? html`
              <div class="error-msg">
                ${this.lastError}
              </div>
            ` : nothing}
          </form>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'device-gate': DeviceGate;
  }
}
