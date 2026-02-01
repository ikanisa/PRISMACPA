import type { GatewayBrowserClient } from "../gateway";

/**
 * Bank Reconciliation controller
 * Uses Gateway RPC calls to fetch bank data and matching.
 */

// Domain types
export type TransactionStatus = "unmatched" | "matched" | "partial" | "exception";

export type BankStatement = {
    id: string;
    periodId: string;
    bankName: string;
    accountNumber: string;
    statementDate: string;
    openingBalance: number;
    closingBalance: number;
    currency: string;
    transactionCount: number;
};

export type BankTransaction = {
    id: string;
    statementId: string;
    transactionDate: string;
    description: string;
    amount: number;
    balance: number;
    reference?: string;
    status: TransactionStatus;
};

export type ReconStats = {
    totalStatements: number;
    totalTransactions: number;
    matched: number;
    unmatched: number;
    exceptions: number;
    matchRate: number;
};

// Controller state
export type BankReconState = {
    client: GatewayBrowserClient | null;
    connected: boolean;
    bankReconLoading: boolean;
    bankStatements: BankStatement[];
    bankTransactions: BankTransaction[];
    reconStats: ReconStats | null;
    selectedStatementId: string | null;
    bankError: string | null;
};

/**
 * Load bank statements for a period
 */
export async function loadBankStatements(state: BankReconState, periodId?: string) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("bank.statements.list", { periodId });
        if (res && Array.isArray(res)) {
            state.bankStatements = res as BankStatement[];
        }
    } catch (err) {
        console.debug("bank.statements.list not available:", err);
    }
}

/**
 * Load transactions for a statement
 */
export async function loadBankTransactions(state: BankReconState, statementId: string) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("bank.transactions.list", { statementId });
        if (res && Array.isArray(res)) {
            state.bankTransactions = res as BankTransaction[];
        }
    } catch (err) {
        console.debug("bank.transactions.list not available:", err);
    }
}

/**
 * Load reconciliation statistics
 */
export async function loadReconStats(state: BankReconState) {
    if (!state.client || !state.connected) return;
    try {
        const res = await state.client.request("bank.recon.stats", {});
        if (res) {
            state.reconStats = res as ReconStats;
        }
    } catch (err) {
        console.debug("bank.recon.stats not available:", err);
    }
}

/**
 * Refresh all bank reconciliation data
 */
export async function refreshBankRecon(state: BankReconState) {
    if (!state.client || !state.connected) return;
    if (state.bankReconLoading) return;

    state.bankReconLoading = true;
    state.bankError = null;

    try {
        await Promise.all([
            loadBankStatements(state),
            loadReconStats(state),
        ]);
    } catch (err) {
        state.bankError = String(err);
    } finally {
        state.bankReconLoading = false;
    }
}
