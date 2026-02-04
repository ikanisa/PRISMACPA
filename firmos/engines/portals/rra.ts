/**
 * Rwanda Revenue Authority (RRA) Portal Stub
 */

import { GovernmentPortal, PortalResponse, PortalSession } from "./base.js";

export class RRAPortal extends GovernmentPortal {
  protected name = "RRA Portal";
  protected jurisdiction = "RW" as const;

  async login(): Promise<PortalResponse<PortalSession>> {
    console.log(`[RRA] Logging in with TIN...`);
    this.session = {
      sessionId: `rra-sess-${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000),
      isActive: true,
    };
    return { success: true, data: this.session };
  }

  async logout(): Promise<PortalResponse<void>> {
    console.log("[RRA] Logging out...");
    this.session = null;
    return { success: true };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async submitTaxDeclaration(
    tin: string,
    taxType: string,
    amount: number,
  ): Promise<PortalResponse> {
    this.ensureSession();
    console.log(`[RRA] Declaring ${taxType} for TIN ${tin}: RWF ${amount}`);
    return {
      success: true,
      transactionId: `DEC-${Date.now()}`,
    };
  }
}
