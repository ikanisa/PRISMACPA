import { html, nothing } from "lit";

/**
 * Bank Reconciliation View
 * Import status, matching queue, and exception handling.
 */

export type BankTransactionStatus = "unmatched" | "matched" | "confirmed" | "exception";
export type BankMatchType = "auto_exact" | "auto_fuzzy" | "manual" | "split" | "bulk";

export type BankAccount = {
    id: string;
    accountName: string;
    accountNumber?: string;
    iban?: string;
    currency: string;
    bankName?: string;
    isActive: boolean;
};

export type BankTransaction = {
    id: string;
    bankAccountId: string;
    transactionDate: string;
    description: string;
    reference?: string;
    amount: number;
    status: BankTransactionStatus;
    matchedEvidenceId?: string;
    matchType?: BankMatchType;
    confidenceScore?: number;
};

export type BankReconStats = {
    total: number;
    unmatched: number;
    matched: number;
    confirmed: number;
    exception: number;
    matchRate: number;
};

export type BankReconciliationProps = {
    connected: boolean;
    accounts: BankAccount[];
    selectedAccountId: string | null;
    transactions: BankTransaction[];
    stats: BankReconStats;
    loading: boolean;
    filter: BankTransactionStatus | "all";
    onSelectAccount: (id: string) => void;
    onFilterChange: (filter: BankTransactionStatus | "all") => void;
    onConfirmMatch: (transactionId: string) => void;
    onRejectMatch: (transactionId: string) => void;
    onManualMatch: (transactionId: string) => void;
    onImport: () => void;
    onRefresh: () => void;
};

const statusConfig: Record<BankTransactionStatus, { color: string; label: string }> = {
    unmatched: { color: "warn", label: "Unmatched" },
    matched: { color: "info", label: "Matched" },
    confirmed: { color: "success", label: "Confirmed" },
    exception: { color: "error", label: "Exception" },
};

function formatEur(amount: number): string {
    return new Intl.NumberFormat("en-MT", {
        style: "currency",
        currency: "EUR",
        signDisplay: "always",
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-MT", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function renderMatchBadge(type: BankMatchType | undefined, confidence: number | undefined) {
    if (!type) return nothing;
    const labels: Record<BankMatchType, string> = {
        auto_exact: "Auto (Exact)",
        auto_fuzzy: "Auto (Fuzzy)",
        manual: "Manual",
        split: "Split",
        bulk: "Bulk",
    };
    const confText = confidence !== undefined ? ` ${Math.round(confidence * 100)}%` : "";
    return html`<span class="badge info">${labels[type]}${confText}</span>`;
}

export function renderBankReconciliation(props: BankReconciliationProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">🏦 Bank Reconciliation</div>
        <div class="card-sub">Connect to gateway to manage bank transactions.</div>
        <div class="callout info" style="margin-top: 14px;">
          Disconnected from gateway. Configure connection in Overview.
        </div>
      </section>
    `;
    }

    const filteredTxns = props.filter === "all"
        ? props.transactions
        : props.transactions.filter(t => t.status === props.filter);

    return html`
    <style>
      .bank-layout { display: grid; grid-template-columns: 260px 1fr; gap: 18px; }
      .account-list { display: flex; flex-direction: column; gap: 8px; }
      .account-card {
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 150ms ease;
      }
      .account-card:hover { border-color: var(--accent-color); }
      .account-card.selected {
        border-color: var(--accent-color);
        background: var(--hover-bg);
      }
      .account-card .name { font-weight: 500; }
      .account-card .details { font-size: 12px; color: var(--muted-color); margin-top: 4px; }
      .recon-filters { display: flex; gap: 6px; flex-wrap: wrap; }
      .recon-filters button {
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        border: 1px solid var(--border-color);
        background: transparent;
      }
      .recon-filters button.active {
        background: var(--accent-color);
        color: white;
        border-color: var(--accent-color);
      }
      .amount-credit { color: var(--success-color); }
      .amount-debit { color: var(--error-color); }
      .action-btns { display: flex; gap: 4px; }
      .action-btns button { font-size: 11px; padding: 3px 7px; }
      @media (max-width: 800px) {
        .bank-layout { grid-template-columns: 1fr; }
      }
    </style>

    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">🏦 Bank Reconciliation</div>
          <div class="card-sub">Match bank transactions to evidence documents.</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn" @click=${() => props.onImport()}>Import Statement</button>
          <button class="btn secondary" @click=${() => props.onRefresh()}>Refresh</button>
        </div>
      </div>
    </section>

    ${props.loading ? html`
      <section class="card" style="margin-top: 18px;">
        <div class="loading-skeleton"></div>
      </section>
    ` : html`
      <div class="bank-layout" style="margin-top: 18px;">
        <section class="card">
          <div class="card-title" style="font-size: 14px; margin-bottom: 12px;">Accounts</div>
          ${props.accounts.length === 0 ? html`
            <div class="callout">No bank accounts configured.</div>
          ` : html`
            <div class="account-list">
              ${props.accounts.filter(a => a.isActive).map(account => html`
                <div 
                  class="account-card ${account.id === props.selectedAccountId ? "selected" : ""}"
                  @click=${() => props.onSelectAccount(account.id)}
                >
                  <div class="name">${account.accountName}</div>
                  <div class="details">
                    ${account.bankName ? html`${account.bankName} · ` : nothing}
                    ${account.currency}
                  </div>
                </div>
              `)}
            </div>
          `}
        </section>

        <section class="card">
          ${props.selectedAccountId ? html`
            <div class="stat-grid" style="margin-bottom: 16px;">
              <div class="stat">
                <div class="stat-label">Total</div>
                <div class="stat-value">${props.stats.total}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Unmatched</div>
                <div class="stat-value ${props.stats.unmatched > 0 ? "warn" : ""}">${props.stats.unmatched}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Matched</div>
                <div class="stat-value">${props.stats.matched}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Confirmed</div>
                <div class="stat-value ok">${props.stats.confirmed}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Exceptions</div>
                <div class="stat-value ${props.stats.exception > 0 ? "error" : ""}">${props.stats.exception}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Match Rate</div>
                <div class="stat-value">${Math.round(props.stats.matchRate * 100)}%</div>
              </div>
            </div>

            <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div class="card-title" style="font-size: 14px;">Transactions</div>
              <div class="recon-filters">
                <button 
                  class="${props.filter === "all" ? "active" : ""}"
                  @click=${() => props.onFilterChange("all")}
                >All</button>
                ${(Object.keys(statusConfig) as BankTransactionStatus[]).map(status => html`
                  <button 
                    class="${props.filter === status ? "active" : ""}"
                    @click=${() => props.onFilterChange(status)}
                  >${statusConfig[status].label}</button>
                `)}
              </div>
            </div>

            ${filteredTxns.length === 0 ? html`
              <div class="callout">No transactions found for selected filter.</div>
            ` : html`
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                    <th>Status</th>
                    <th>Match</th>
                    <th style="width: 100px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredTxns.map(txn => html`
                    <tr>
                      <td>${formatDate(txn.transactionDate)}</td>
                      <td>
                        <div>${txn.description}</div>
                        ${txn.reference ? html`
                          <div class="mono" style="font-size: 11px; color: var(--muted-color);">
                            ${txn.reference}
                          </div>
                        ` : nothing}
                      </td>
                      <td style="text-align: right;" class="${txn.amount >= 0 ? "amount-credit" : "amount-debit"}">
                        ${formatEur(txn.amount)}
                      </td>
                      <td>
                        <span class="badge ${statusConfig[txn.status].color}">
                          ${statusConfig[txn.status].label}
                        </span>
                      </td>
                      <td>${renderMatchBadge(txn.matchType, txn.confidenceScore)}</td>
                      <td>
                        ${txn.status === "matched" ? html`
                          <div class="action-btns">
                            <button class="btn small" @click=${() => props.onConfirmMatch(txn.id)}>✓</button>
                            <button class="btn small secondary" @click=${() => props.onRejectMatch(txn.id)}>✗</button>
                          </div>
                        ` : txn.status === "unmatched" || txn.status === "exception" ? html`
                          <button class="btn small" @click=${() => props.onManualMatch(txn.id)}>Match</button>
                        ` : nothing}
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            `}
          ` : html`
            <div class="callout">Select an account to view transactions.</div>
          `}
        </section>
      </div>
    `}
  `;
}
