/**
 * FirmOS Portal Abstraction
 *
 * Defines the standard interface for all government portal integrations.
 */

export interface PortalAuth {
  username?: string;
  password?: string;
  apiKey?: string;
  certificatePath?: string;
}

export interface PortalSession {
  sessionId: string;
  expiresAt: Date;
  isActive: boolean;
}

export interface PortalResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionId?: string;
}

export abstract class GovernmentPortal {
  protected abstract name: string;
  protected abstract jurisdiction: "MT" | "RW";
  protected session: PortalSession | null = null;

  constructor(protected auth: PortalAuth) {}

  /**
   * Initialize connection and authenticate
   */
  abstract login(): Promise<PortalResponse<PortalSession>>;

  /**
   * Terminate session
   */
  abstract logout(): Promise<PortalResponse<void>>;

  /**
   * Check if the service is currently reachable
   */
  abstract healthCheck(): Promise<boolean>;

  protected ensureSession(): void {
    if (!this.session || !this.session.isActive || new Date() > this.session.expiresAt) {
      throw new Error(`[${this.name}] No active session. Please login first.`);
    }
  }
}
