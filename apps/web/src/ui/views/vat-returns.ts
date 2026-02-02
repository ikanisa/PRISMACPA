import { html, nothing } from "lit";

/**
 * VAT Returns Management View
 * Detailed VAT period management with line items, draft packs, and filing status.
 */

export type VatPeriodStatus = "open" | "draft" | "reviewed" | "filed" | "paid";

export type VatPeriod = {
    id: string;
    periodStart: string;
    periodEnd: string;
    deadline: string;
    status: VatPeriodStatus;
    outputVat: number;
    inputVat: number;
    vatDue: number;
    cfrReference?: string;
    filedAt?: string;
};

export type VatLineItem = {
    id: string;
    cfrBox: string;
    description: string;
    taxableAmount: number;
    vatAmount: number;
    vatRate: number;
    evidenceCount: number;
};

export type VatReturnsProps = {
    connected: boolean;
    periods: VatPeriod[];
    selectedPeriodId: string | null;
    lineItems: VatLineItem[];
    loading: boolean;
    onSelectPeriod: (id: string) => void;
    onCreatePeriod: () => void;
    onDraftReturn: (periodId: string) => void;
    onRefresh: () => void;
};

const statusConfig: Record<VatPeriodStatus, { color: string; label: string }> = {
    open: { color: "info", label: "Open" },
    draft: { color: "warn", label: "Draft" },
    reviewed: { color: "ok", label: "Reviewed" },
    filed: { color: "success", label: "Filed" },
    paid: { color: "success", label: "Paid" },
};

function formatEur(amount: number): string {
    return new Intl.NumberFormat("en-MT", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-MT", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function daysUntil(deadline: string): number {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderPeriodCard(period: VatPeriod, isSelected: boolean, onSelect: () => void) {
    const config = statusConfig[period.status];
    const days = daysUntil(period.deadline);
    const isOverdue = days < 0;

    return html`
    <div 
      class="period-card ${isSelected ? "selected" : ""}" 
      @click=${onSelect}
      role="button"
      tabindex="0"
    >
      <div class="period-header">
        <span class="period-dates">
          ${formatDate(period.periodStart)} → ${formatDate(period.periodEnd)}
        </span>
        <span class="badge ${config.color}">${config.label}</span>
      </div>
      <div class="period-details">
        <div class="period-amounts">
          <span>VAT Due: <strong>${formatEur(period.vatDue)}</strong></span>
        </div>
        <div class="period-deadline ${isOverdue ? "overdue" : days <= 7 ? "urgent" : ""}">
          ${isOverdue
            ? html`<span class="warn">Overdue</span>`
            : html`<span>${days}d to deadline</span>`}
        </div>
      </div>
      ${period.cfrReference ? html`
        <div class="cfr-ref">
          CFR: <span class="mono">${period.cfrReference}</span>
        </div>
      ` : nothing}
    </div>
  `;
}

function renderLineItems(items: VatLineItem[]) {
    if (items.length === 0) {
        return html`
      <div class="callout info">
        No line items for this period. Use the agent to classify evidence.
      </div>
    `;
    }

    const totalTaxable = items.reduce((sum, i) => sum + i.taxableAmount, 0);
    const totalVat = items.reduce((sum, i) => sum + i.vatAmount, 0);

    return html`
    <table class="data-table">
      <thead>
        <tr>
          <th>CFR Box</th>
          <th>Description</th>
          <th style="text-align: right;">Taxable</th>
          <th style="text-align: right;">VAT</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: center;">Evidence</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => html`
          <tr>
            <td><span class="mono">${item.cfrBox}</span></td>
            <td>${item.description}</td>
            <td style="text-align: right;">${formatEur(item.taxableAmount)}</td>
            <td style="text-align: right;">${formatEur(item.vatAmount)}</td>
            <td style="text-align: right;">${item.vatRate}%</td>
            <td style="text-align: center;">
              <span class="badge">${item.evidenceCount}</span>
            </td>
          </tr>
        `)}
      </tbody>
      <tfoot>
        <tr class="totals-row">
          <td colspan="2"><strong>Totals</strong></td>
          <td style="text-align: right;"><strong>${formatEur(totalTaxable)}</strong></td>
          <td style="text-align: right;"><strong>${formatEur(totalVat)}</strong></td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
  `;
}

export function renderVatReturns(props: VatReturnsProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">🇲🇹 VAT Returns</div>
        <div class="card-sub">Connect to gateway to manage Malta VAT periods.</div>
        <div class="callout info" style="margin-top: 14px;">
          Disconnected from gateway. Configure connection in Overview.
        </div>
      </section>
    `;
    }

    const selectedPeriod = props.selectedPeriodId
        ? props.periods.find(p => p.id === props.selectedPeriodId)
        : null;

    return html`
    <style>
      .vat-layout { display: grid; grid-template-columns: 320px 1fr; gap: 18px; }
      .period-list { display: flex; flex-direction: column; gap: 10px; }
      .period-card { 
        padding: 14px; 
        border: 1px solid var(--border-color); 
        border-radius: 8px; 
        cursor: pointer;
        transition: all 150ms ease;
      }
      .period-card:hover { border-color: var(--accent-color); }
      .period-card.selected { 
        border-color: var(--accent-color); 
        background: var(--hover-bg);
      }
      .period-header { display: flex; justify-content: space-between; align-items: center; }
      .period-dates { font-weight: 500; }
      .period-details { margin-top: 8px; display: flex; justify-content: space-between; font-size: 13px; }
      .period-deadline.overdue, .period-deadline.urgent { color: var(--warn-color); }
      .cfr-ref { margin-top: 6px; font-size: 12px; color: var(--muted-color); }
      .totals-row { background: var(--hover-bg); }
      @media (max-width: 800px) {
        .vat-layout { grid-template-columns: 1fr; }
      }
    </style>

    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">🇲🇹 Malta VAT Returns</div>
          <div class="card-sub">Manage VAT periods, line items, and CFR filings.</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn" @click=${() => props.onCreatePeriod()}>+ New Period</button>
          <button class="btn secondary" @click=${() => props.onRefresh()}>Refresh</button>
        </div>
      </div>
    </section>

    ${props.loading ? html`
      <section class="card">
        <div class="loading-skeleton"></div>
      </section>
    ` : html`
      <div class="vat-layout" style="margin-top: 18px;">
        <section class="card">
          <div class="card-title" style="font-size: 14px; margin-bottom: 12px;">Periods</div>
          ${props.periods.length === 0 ? html`
            <div class="callout">No VAT periods. Create one to get started.</div>
          ` : html`
            <div class="period-list">
              ${props.periods.map(p =>
        renderPeriodCard(p, p.id === props.selectedPeriodId, () => props.onSelectPeriod(p.id))
    )}
            </div>
          `}
        </section>

        <section class="card">
          ${selectedPeriod ? html`
            <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div class="card-title" style="font-size: 14px;">
                ${formatDate(selectedPeriod.periodStart)} → ${formatDate(selectedPeriod.periodEnd)}
              </div>
              ${selectedPeriod.status === "open" || selectedPeriod.status === "draft" ? html`
                <button class="btn small" @click=${() => props.onDraftReturn(selectedPeriod.id)}>
                  Draft Return
                </button>
              ` : nothing}
            </div>
            
            <div class="stat-grid" style="margin-bottom: 16px;">
              <div class="stat">
                <div class="stat-label">Output VAT</div>
                <div class="stat-value">${formatEur(selectedPeriod.outputVat)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Input VAT</div>
                <div class="stat-value">${formatEur(selectedPeriod.inputVat)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Net Payable</div>
                <div class="stat-value ${selectedPeriod.vatDue > 0 ? "warn" : "ok"}">
                  ${formatEur(selectedPeriod.vatDue)}
                </div>
              </div>
            </div>

            <div class="card-title" style="font-size: 13px; margin-bottom: 10px;">Line Items</div>
            ${renderLineItems(props.lineItems)}
          ` : html`
            <div class="callout">Select a period to view details.</div>
          `}
        </section>
      </div>
    `}

    <section class="card" style="margin-top: 18px;">
      <div class="card-title" style="font-size: 13px;">⚠️ Filing Requirements</div>
      <div class="note-grid" style="margin-top: 10px; font-size: 13px;">
        <div>
          <strong>Human Portal Submission</strong>
          <div class="muted">Agent prepares pack, human files on CFR portal.</div>
        </div>
        <div>
          <strong>Human Payment</strong>
          <div class="muted">Tax payments require manual bank transfer.</div>
        </div>
      </div>
    </section>
  `;
}
