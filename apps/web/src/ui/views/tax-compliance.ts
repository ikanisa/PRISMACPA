import { html, nothing } from "lit";

/**
 * Tax & Compliance dashboard for Malta tax operations.
 * Displays VAT periods, evidence status, and approval workflows.
 */

export type TaxPeriod = {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: "open" | "draft" | "reviewed" | "filed";
    vatDue?: number;
    deadline: string;
};

export type EvidenceStats = {
    total: number;
    pending: number;
    extracted: number;
    verified: number;
};

export type ApprovalItem = {
    id: string;
    targetType: "entry" | "pack" | "period";
    targetId: string;
    approvalType: "prepare" | "review" | "file";
    approved: boolean;
    approverName: string;
    createdAt: string;
};

export type TaxComplianceProps = {
    connected: boolean;
    periods: TaxPeriod[];
    evidenceStats: EvidenceStats | null;
    pendingApprovals: ApprovalItem[];
    onRefresh: () => void;
};

function statusBadge(status: TaxPeriod["status"]) {
    const colors: Record<TaxPeriod["status"], string> = {
        open: "info",
        draft: "warn",
        reviewed: "ok",
        filed: "success",
    };
    return html`<span class="badge ${colors[status]}">${status}</span>`;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-MT", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
}

function daysUntil(deadline: string) {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return html`<span class="stat-value warn">Overdue</span>`;
    if (days <= 7) return html`<span class="stat-value warn">${days}d</span>`;
    return html`<span class="stat-value">${days}d</span>`;
}

export function renderTaxCompliance(props: TaxComplianceProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Tax & Compliance</div>
        <div class="card-sub">Connect to gateway to view Malta tax data.</div>
        <div class="callout info" style="margin-top: 14px;">
          Disconnected from gateway. Configure connection in Overview.
        </div>
      </section>
    `;
    }

    const stats = props.evidenceStats ?? { total: 0, pending: 0, extracted: 0, verified: 0 };

    return html`
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">🇲🇹 Malta VAT Periods</div>
        <div class="card-sub">Current and upcoming VAT return periods.</div>
        ${props.periods.length === 0
            ? html`<div class="callout info" style="margin-top: 14px;">
              No VAT periods configured. Use the agent to create periods.
            </div>`
            : html`
              <table class="data-table" style="margin-top: 14px;">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Status</th>
                    <th>VAT Due</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  ${props.periods.map(
                (p) => html`
                      <tr>
                        <td>${p.periodStart} → ${p.periodEnd}</td>
                        <td>${statusBadge(p.status)}</td>
                        <td>${p.vatDue != null ? formatCurrency(p.vatDue) : "—"}</td>
                        <td>${daysUntil(p.deadline)}</td>
                      </tr>
                    `
            )}
                </tbody>
              </table>
            `}
      </div>

      <div class="card">
        <div class="card-title">Evidence Ledger</div>
        <div class="card-sub">Document ingestion and extraction status.</div>
        <div class="stat-grid" style="margin-top: 16px;">
          <div class="stat">
            <div class="stat-label">Total</div>
            <div class="stat-value">${stats.total}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Pending</div>
            <div class="stat-value ${stats.pending > 0 ? "warn" : ""}">${stats.pending}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Extracted</div>
            <div class="stat-value">${stats.extracted}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Verified</div>
            <div class="stat-value ok">${stats.verified}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">Pending Approvals</div>
      <div class="card-sub">Maker-checker workflow items awaiting action.</div>
      ${props.pendingApprovals.length === 0
            ? html`<div class="callout" style="margin-top: 14px;">
            No pending approvals. All items have been reviewed.
          </div>`
            : html`
            <table class="data-table" style="margin-top: 14px;">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target</th>
                  <th>Action</th>
                  <th>Approver</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${props.pendingApprovals.map(
                (a) => html`
                    <tr>
                      <td><span class="badge">${a.targetType}</span></td>
                      <td class="mono">${a.targetId.slice(0, 8)}...</td>
                      <td>${a.approvalType}</td>
                      <td>${a.approverName}</td>
                      <td>${new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  `
            )}
              </tbody>
            </table>
          `}
      <div class="row" style="margin-top: 14px;">
        <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">⚠️ Critical Constraints</div>
      <div class="card-sub">Human-in-the-loop requirements for Malta tax operations.</div>
      <div class="note-grid" style="margin-top: 14px;">
        <div>
          <div class="note-title">NO PORTAL AUTOMATION</div>
          <div class="muted">Human performs all CFR portal submissions.</div>
        </div>
        <div>
          <div class="note-title">NO AUTO-PAY</div>
          <div class="muted">Tax payments require human action.</div>
        </div>
        <div>
          <div class="note-title">NO AUTO-JOURNALS</div>
          <div class="muted">GL postings require human approval.</div>
        </div>
      </div>
    </section>
  `;
}
