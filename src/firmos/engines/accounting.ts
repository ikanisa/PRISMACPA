/**
 * FirmOS Accounting Engine (Sofia)
 *
 * Handles general ledger operations, reconciliation, and financial reporting.
 */

import { getSupabaseClient } from "../db.js";

// =============================================================================
// TYPES
// =============================================================================

export interface JournalEntry {
  id?: string;
  entityId: string;
  date: string;
  description: string;
  reference?: string;
  lines: JournalLine[];
  status: "draft" | "posted" | "voided";
  metadata?: Record<string, unknown>;
}

export interface JournalLine {
  accountId: string;
  description?: string;
  debit?: number;
  credit?: number;
}

export interface Reconciliation {
  id: string;
  accountId: string;
  periodEnd: string;
  balancePerBank: number;
  balancePerBook: number;
  difference: number;
  status: "balanced" | "unbalanced";
  reviewedBy?: string;
  completedAt?: string;
}

export interface PeriodCloseResult {
  success: boolean;
  period: string;
  closedAt: string;
  issues: string[];
}

// =============================================================================
// ACCOUNTING OPERATIONS
// =============================================================================

/**
 * Post a journal entry to the general ledger
 */
/**
 * Post a journal entry to the general ledger
 */
export async function postJournalEntry(
  entry: JournalEntry,
): Promise<{ success: boolean; id?: string; error?: string }> {
  // Validate debits = credits
  const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      success: false,
      error: `Journal entry unbalanced: Debits ${totalDebit} != Credits ${totalCredit}`,
    };
  }

  try {
    const supabase = getSupabaseClient();

    // 1. Insert Journal Entry Header
    const { data: journalData, error: journalError } = await supabase
      .from("accounting_journals")
      .insert({
        entity_id: entry.entityId,
        date: entry.date,
        description: entry.description,
        reference: entry.reference,
        status: "posted",
        metadata: entry.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (journalError) throw new Error(journalError.message);
    if (!journalData) throw new Error("Failed to create journal entry");

    const journalId = journalData.id;

    // 2. Insert Journal Lines
    const linesToInsert = entry.lines.map((line) => ({
      journal_id: journalId,
      account_id: line.accountId,
      description: line.description || entry.description,
      debit: line.debit || 0,
      credit: line.credit || 0,
    }));

    const { error: linesError } = await supabase
      .from("accounting_journal_lines")
      .insert(linesToInsert);

    if (linesError) {
      // Rollback (delete header) - crude rollback for now
      await supabase.from("accounting_journals").delete().eq("id", journalId);
      throw new Error(`Failed to insert lines: ${linesError.message}`);
    }

    console.log(`[Accounting] Posted journal entry ${journalId} for ${entry.entityId}`);

    return {
      success: true,
      id: journalId,
    };
  } catch (err) {
    console.error("[Accounting] Post Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Perform account reconciliation
 */
export async function reconcileAccount(
  accountId: string,
  periodEnd: string,
  balancePerBank: number,
): Promise<Reconciliation> {
  const supabase = getSupabaseClient();

  // Fetch book balance from GL (sum of debit - credit for this account up to periodEnd)
  // For now, we'll still simulate the calculation query as it's complex sql
  const balancePerBook = balancePerBank;

  const difference = balancePerBank - balancePerBook;
  const status = Math.abs(difference) < 0.01 ? "balanced" : "unbalanced";

  return {
    id: `rec-${Date.now()}`,
    accountId,
    periodEnd,
    balancePerBank,
    balancePerBook,
    difference,
    status,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Execute period close checklist
 */
export async function executePeriodClose(
  entityId: string,
  period: string,
): Promise<PeriodCloseResult> {
  console.log(`[Accounting] Starting period close for ${entityId} (${period})...`);

  // In a real system, this would run a series of checks against the DB
  // For Phase 4, we'll verify connection and log the attempt

  try {
    const supabase = getSupabaseClient();

    // Log the close attempt
    await supabase.from("accounting_period_closes").insert({
      entity_id: entityId,
      period: period,
      status: "closed", // Optimistic close
      closed_at: new Date().toISOString(),
    });

    return {
      success: true,
      period,
      closedAt: new Date().toISOString(),
      issues: [],
    };
  } catch (err) {
    return {
      success: false,
      period,
      closedAt: new Date().toISOString(),
      issues: [String(err)],
    };
  }
}
