/**
 * FirmOS Tax Engine (Matthew & Emmanuel)
 *
 * Handles tax compliance, VAT returns, and CIT computations
 * for Malta (Matthew) and Rwanda (Emmanuel).
 */

import { getSupabaseClient } from "../db.js";

// =============================================================================
// TYPES
// =============================================================================

export interface TaxReturn {
  id?: string;
  entityId: string;
  jurisdiction: "MT" | "RW";
  taxType: "VAT" | "CIT" | "PAYE" | "WHT";
  period: string;
  status: "draft" | "submitted" | "approved" | "filed";
  liability: number;
  dueDate: string;
  figures: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface TaxLiability {
  amount: number;
  currency: string;
  dueDate: string;
  isEstimated: boolean;
}

// =============================================================================
// TAX OPERATIONS
// =============================================================================

/**
 * Prepare a VAT return
 */
export async function prepareVATReturn(
  entityId: string,
  period: string,
  jurisdiction: "MT" | "RW",
): Promise<TaxReturn> {
  console.log(`[Tax] Preparing VAT return for ${entityId} (${jurisdiction} - ${period})...`);

  // In a real implementation:
  // 1. Fetch relevant transactions from DB/Accounting Engine
  // 2. Classify output VAT (sales) vs input VAT (purchases)
  // 3. Apply jurisdiction-specific rates and rules

  // For Phase 4, we will persist the "Draft" return to the DB
  try {
    const supabase = getSupabaseClient();

    let liability = 0;
    let figures: Record<string, number> = {};

    if (jurisdiction === "MT") {
      // Malta VAT Logic (18%, 7%, 5%, 0%, Exempt)
      // Simulation of calculation
      liability = 1800;
      figures = { sales_18: 10000, output_vat: 1800, purchases: 0, input_vat: 0 };
    } else {
      // Rwanda VAT Logic (18%, 0%, Exempt, Withholding)
      // Simulation of calculation
      liability = 1800000; // RWF mock
      figures = { turnover: 10000000, taxable_amt: 10000000, vat_payable: 1800000 };
    }

    const dueDate = getDueDate(period, jurisdiction, "VAT");

    const { data, error } = await supabase
      .from("tax_returns")
      .insert({
        entity_id: entityId,
        jurisdiction,
        tax_type: "VAT",
        period,
        status: "draft",
        liability,
        due_date: dueDate,
        figures,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to create tax return");

    return {
      id: data.id,
      entityId,
      jurisdiction,
      taxType: "VAT",
      period,
      status: "draft",
      liability,
      dueDate,
      figures,
    };
  } catch (err) {
    // Fallback for now if DB fails (or table missing) to keep app running
    console.error("[Tax] VAT Return Error:", err);
    throw new Error(
      `Failed to prepare VAT return: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Compute Tax Liability (CIT)
 */
export async function computeTaxLiability(
  entityId: string,
  year: number,
  jurisdiction: "MT" | "RW",
): Promise<TaxLiability> {
  try {
    const supabase = getSupabaseClient();

    // Mock computation logic preserved, but we log the liability to DB
    let amount = 0;
    let currency = "";
    let dueDate = "";

    if (jurisdiction === "MT") {
      // 35% standard CIT rate
      amount = 3500;
      currency = "EUR";
      dueDate = `${year + 1}-09-30`;
    } else {
      // Rwanda 30% CIT rate
      amount = 3000000;
      currency = "RWF";
      dueDate = `${year + 1}-03-31`;
    }

    // Persist liability record
    const { error } = await supabase.from("tax_liabilities").insert({
      entity_id: entityId,
      jurisdiction,
      tax_type: "CIT",
      year,
      amount,
      currency,
      due_date: dueDate,
      is_estimated: true,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("[Tax] Failed to persist liability:", error.message);
      // We don't throw here to allow return of computed value even if save fails
    }

    return {
      amount,
      currency,
      dueDate,
      isEstimated: true,
    };
  } catch (error) {
    throw new Error(`Failed to compute tax liability: ${String(error)}`);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getDueDate(period: string, jurisdiction: "MT" | "RW", type: string): string {
  // Logic to calculate deadlines based on period end dates
  const currentYear = new Date().getFullYear();
  // Default fallback
  return `${currentYear}-12-31`;
}
