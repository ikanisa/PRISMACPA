import { html, nothing } from "lit";

/**
 * AML Dashboard View
 * CDD status, STR queue, and risk tier monitoring for Malta FIAU compliance.
 */

export type CddRiskTier = "low" | "medium" | "high" | "pep" | "sanctioned";
export type CddStatus = "pending" | "in_progress" | "approved" | "expired" | "rejected";
export type StrStatus = "draft" | "review" | "submitted" | "acknowledged" | "closed";

export type CddRecord = {
    id: string;
    legalName: string;
    entityType: "individual" | "company" | "trust";
    riskTier: CddRiskTier;
    status: CddStatus;
    nextReviewDate?: string;
    documentsVerified: boolean;
};

export type StrReport = {
    id: string;
    internalReference: string;
    subjectName: string;
    suspicionType: string;
    transactionAmount?: number;
    status: StrStatus;
    draftedAt: string;
};

export type AmlAlert = {
    id: string;
    alertType: "large_transaction" | "pattern" | "pep_match" | "sanctions_hit";
    alertSeverity: "low" | "medium" | "high" | "critical";
    alertDescription: string;
    cddRecordId?: string;
    createdAt: string;
};

export type AmlStats = {
    cdd: {
        total: number;
        pending: number;
        expired: number;
        highRisk: number;
    };
    str: {
        draft: number;
        review: number;
        submitted: number;
    };
    alerts: {
        pendingHigh: number;
        pendingMedium: number;
        pendingLow: number;
    };
};

export type AmlDashboardProps = {
    connected: boolean;
    stats: AmlStats;
    cddRecords: CddRecord[];
    strReports: StrReport[];
    alerts: AmlAlert[];
    loading: boolean;
    onViewCddRecord: (id: string) => void;
    onViewStrReport: (id: string) => void;
    onDismissAlert: (id: string) => void;
    onRefresh: () => void;
};

const riskTierConfig: Record<CddRiskTier, { color: string; label: string }> = {
    low: { color: "success", label: "Low" },
    medium: { color: "warn", label: "Medium" },
    high: { color: "error", label: "High" },
    pep: { color: "error", label: "PEP" },
    sanctioned: { color: "error", label: "Sanctioned" },
};

const cddStatusConfig: Record<CddStatus, { color: string; label: string }> = {
    pending: { color: "warn", label: "Pending" },
    in_progress: { color: "info", label: "In Progress" },
    approved: { color: "success", label: "Approved" },
    expired: { color: "error", label: "Expired" },
    rejected: { color: "error", label: "Rejected" },
};

const strStatusConfig: Record<StrStatus, { color: string; label: string }> = {
    draft: { color: "info", label: "Draft" },
    review: { color: "warn", label: "Review" },
    submitted: { color: "ok", label: "Submitted" },
    acknowledged: { color: "success", label: "Acknowledged" },
    closed: { color: "muted", label: "Closed" },
};

const alertSeverityConfig: Record<string, { color: string; icon: string }> = {
    low: { color: "info", icon: "ℹ️" },
    medium: { color: "warn", icon: "⚠️" },
    high: { color: "error", icon: "🔴" },
    critical: { color: "error", icon: "🚨" },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-MT", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatEur(amount: number | undefined): string {
    if (amount === undefined) return "—";
    return new Intl.NumberFormat("en-MT", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
}

export function renderAmlDashboard(props: AmlDashboardProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">🔍 AML Compliance</div>
        <div class="card-sub">Connect to gateway to view AML data.</div>
        <div class="callout info" style="margin-top: 14px;">
          Disconnected from gateway. Configure connection in Overview.
        </div>
      </section>
    `;
    }

    const pendingAlerts = props.alerts.slice(0, 5);
    const highRiskCdd = props.cddRecords.filter(c =>
        c.riskTier === "high" || c.riskTier === "pep" || c.riskTier === "sanctioned"
    );

    return html`
    <style>
      .aml-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .alert-item {
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .alert-item.high, .alert-item.critical { border-left: 3px solid var(--error-color); }
      .alert-item.medium { border-left: 3px solid var(--warn-color); }
      .alert-content { flex: 1; }
      .alert-dismiss { 
        background: none; 
        border: none; 
        cursor: pointer; 
        opacity: 0.5;
        padding: 4px;
      }
      .alert-dismiss:hover { opacity: 1; }
      @media (max-width: 800px) {
        .aml-grid { grid-template-columns: 1fr; }
      }
    </style>

    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">🔍 AML Compliance Dashboard</div>
          <div class="card-sub">Malta FIAU compliance monitoring and reporting.</div>
        </div>
        <button class="btn secondary" @click=${() => props.onRefresh()}>Refresh</button>
      </div>
    </section>

    ${props.loading ? html`
      <section class="card" style="margin-top: 18px;">
        <div class="loading-skeleton"></div>
      </section>
    ` : html`
      <section class="card" style="margin-top: 18px;">
        <div class="card-title" style="font-size: 14px; margin-bottom: 12px;">Overview</div>
        <div class="stat-grid">
          <div class="stat">
            <div class="stat-label">CDD Records</div>
            <div class="stat-value">${props.stats.cdd.total}</div>
          </div>
          <div class="stat">
            <div class="stat-label">CDD Pending</div>
            <div class="stat-value ${props.stats.cdd.pending > 0 ? "warn" : ""}">${props.stats.cdd.pending}</div>
          </div>
          <div class="stat">
            <div class="stat-label">CDD Expired</div>
            <div class="stat-value ${props.stats.cdd.expired > 0 ? "error" : ""}">${props.stats.cdd.expired}</div>
          </div>
          <div class="stat">
            <div class="stat-label">High Risk</div>
            <div class="stat-value ${props.stats.cdd.highRisk > 0 ? "warn" : ""}">${props.stats.cdd.highRisk}</div>
          </div>
          <div class="stat">
            <div class="stat-label">STR Drafts</div>
            <div class="stat-value">${props.stats.str.draft}</div>
          </div>
          <div class="stat">
            <div class="stat-label">STR In Review</div>
            <div class="stat-value ${props.stats.str.review > 0 ? "warn" : ""}">${props.stats.str.review}</div>
          </div>
        </div>
      </section>

      <div class="aml-grid" style="margin-top: 18px;">
        <section class="card">
          <div class="card-title" style="font-size: 14px; margin-bottom: 12px;">
            🚨 Active Alerts (${props.alerts.length})
          </div>
          ${pendingAlerts.length === 0 ? html`
            <div class="callout success">No active alerts. All clear.</div>
          ` : html`
            ${pendingAlerts.map(alert => html`
              <div class="alert-item ${alert.alertSeverity}">
                <div class="alert-content">
                  <div>
                    ${alertSeverityConfig[alert.alertSeverity].icon}
                    <strong>${alert.alertType.replace("_", " ")}</strong>
                  </div>
                  <div class="muted" style="font-size: 12px; margin-top: 4px;">
                    ${alert.alertDescription}
                  </div>
                  <div class="muted" style="font-size: 11px; margin-top: 2px;">
                    ${formatDate(alert.createdAt)}
                  </div>
                </div>
                <button class="alert-dismiss" @click=${() => props.onDismissAlert(alert.id)} title="Dismiss">
                  ✕
                </button>
              </div>
            `)}
          `}
        </section>

        <section class="card">
          <div class="card-title" style="font-size: 14px; margin-bottom: 12px;">
            ⚠️ High Risk Entities (${highRiskCdd.length})
          </div>
          ${highRiskCdd.length === 0 ? html`
            <div class="callout">No high-risk entities flagged.</div>
          ` : html`
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${highRiskCdd.slice(0, 5).map(cdd => html`
                  <tr @click=${() => props.onViewCddRecord(cdd.id)} style="cursor: pointer;">
                    <td>${cdd.legalName}</td>
                    <td>
                      <span class="badge ${riskTierConfig[cdd.riskTier].color}">
                        ${riskTierConfig[cdd.riskTier].label}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${cddStatusConfig[cdd.status].color}">
                        ${cddStatusConfig[cdd.status].label}
                      </span>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          `}
        </section>
      </div>

      <section class="card" style="margin-top: 18px;">
        <div class="card-title" style="font-size: 14px; margin-bottom: 12px;">
          📝 STR Reports (${props.strReports.length})
        </div>
        ${props.strReports.length === 0 ? html`
          <div class="callout">No STR reports on file.</div>
        ` : html`
          <table class="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Subject</th>
                <th>Suspicion</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${props.strReports.map(str => html`
                <tr @click=${() => props.onViewStrReport(str.id)} style="cursor: pointer;">
                  <td class="mono">${str.internalReference}</td>
                  <td>${str.subjectName}</td>
                  <td>${str.suspicionType}</td>
                  <td>${formatEur(str.transactionAmount)}</td>
                  <td>
                    <span class="badge ${strStatusConfig[str.status].color}">
                      ${strStatusConfig[str.status].label}
                    </span>
                  </td>
                  <td>${formatDate(str.draftedAt)}</td>
                </tr>
              `)}
            </tbody>
          </table>
        `}
      </section>

      <section class="card" style="margin-top: 18px;">
        <div class="card-title" style="font-size: 13px;">⚠️ FIAU Compliance Notice</div>
        <div class="muted" style="font-size: 12px; margin-top: 6px;">
          All STR submissions to Malta FIAU must be performed by authorized personnel.
          This dashboard provides draft preparation only. Final submission is human-only.
        </div>
      </section>
    `}
  `;
}
