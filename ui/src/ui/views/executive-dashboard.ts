import { html } from "lit";

/**
 * Executive Dashboard for Big 4-level professional services.
 * Provides partner/manager KPIs, risk heatmaps, and deadline tracking.
 */

export type JurisdictionCode = "MT" | "EU" | "US" | "UK";

export type Jurisdiction = {
    code: JurisdictionCode;
    name: string;
    flag: string;
    regulator: string;
};

export const JURISDICTIONS: Jurisdiction[] = [
    { code: "MT", name: "Malta", flag: "🇲🇹", regulator: "CFR" },
    { code: "EU", name: "European Union", flag: "🇪🇺", regulator: "EU DAC" },
    { code: "US", name: "United States", flag: "🇺🇸", regulator: "IRS" },
    { code: "UK", name: "United Kingdom", flag: "🇬🇧", regulator: "HMRC" },
];

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type EngagementSummary = {
    id: string;
    clientName: string;
    type: "tax" | "audit" | "advisory";
    jurisdiction: JurisdictionCode;
    status: "active" | "review" | "filing" | "complete";
    riskLevel: RiskLevel;
    dueDate: string;
    assignee: string;
};

export type KPISummary = {
    openEngagements: number;
    atRiskItems: number;
    pendingApprovals: number;
    upcomingDeadlines: number;
    evidenceBacklog: number;
    completionRate: number;
};

export type ExecutiveDashboardProps = {
    connected: boolean;
    jurisdiction: JurisdictionCode;
    kpis: KPISummary | null;
    engagements: EngagementSummary[];
    onJurisdictionChange: (code: JurisdictionCode) => void;
    onRefresh: () => void;
};

function riskBadge(level: RiskLevel) {
    const colors: Record<RiskLevel, string> = {
        low: "ok",
        medium: "info",
        high: "warn",
        critical: "danger",
    };
    return html`<span class="badge ${colors[level]}">${level.toUpperCase()}</span>`;
}

function statusBadge(status: EngagementSummary["status"]) {
    const colors: Record<EngagementSummary["status"], string> = {
        active: "info",
        review: "warn",
        filing: "ok",
        complete: "success",
    };
    return html`<span class="badge ${colors[status]}">${status}</span>`;
}

function typeBadge(type: EngagementSummary["type"]) {
    const icons: Record<EngagementSummary["type"], string> = {
        tax: "📊",
        audit: "📋",
        advisory: "💡",
    };
    return html`<span class="badge">${icons[type]} ${type}</span>`;
}

function daysUntil(deadline: string): number {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function deadlineDisplay(deadline: string) {
    const days = daysUntil(deadline);
    if (days < 0) return html`<span class="stat-value danger">Overdue by ${Math.abs(days)}d</span>`;
    if (days <= 3) return html`<span class="stat-value danger">${days}d</span>`;
    if (days <= 7) return html`<span class="stat-value warn">${days}d</span>`;
    if (days <= 14) return html`<span class="stat-value info">${days}d</span>`;
    return html`<span class="stat-value">${days}d</span>`;
}

export function renderExecutiveDashboard(props: ExecutiveDashboardProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Executive Dashboard</div>
        <div class="card-sub">Partner & Manager overview for professional services.</div>
        <div class="callout info" style="margin-top: 14px;">
          Disconnected from gateway. Configure connection in Overview.
        </div>
      </section>
    `;
    }

    const currentJurisdiction = JURISDICTIONS.find((j) => j.code === props.jurisdiction) ?? JURISDICTIONS[0];
    const kpis = props.kpis ?? {
        openEngagements: 0,
        atRiskItems: 0,
        pendingApprovals: 0,
        upcomingDeadlines: 0,
        evidenceBacklog: 0,
        completionRate: 0,
    };

    // Filter engagements by deadline proximity
    const upcomingDeadlines = props.engagements
        .filter((e) => e.status !== "complete")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

    const atRiskEngagements = props.engagements.filter(
        (e) => e.riskLevel === "high" || e.riskLevel === "critical"
    );

    return html`
    <!-- Jurisdiction Selector -->
    <section class="card" style="margin-bottom: 18px;">
      <div class="row" style="gap: 12px; align-items: center;">
        <div class="card-title" style="margin: 0;">
          ${currentJurisdiction.flag} ${currentJurisdiction.name}
        </div>
        <select
          class="select"
          .value=${props.jurisdiction}
          @change=${(e: Event) => {
            const code = (e.target as HTMLSelectElement).value as JurisdictionCode;
            props.onJurisdictionChange(code);
        }}
        >
          ${JURISDICTIONS.map(
            (j) => html`<option value=${j.code}>${j.flag} ${j.name}</option>`
        )}
        </select>
        <span class="muted">Regulator: ${currentJurisdiction.regulator}</span>
        <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
      </div>
    </section>

    <!-- KPI Grid -->
    <section class="grid grid-cols-3" style="margin-bottom: 18px;">
      <div class="card stat-card">
        <div class="stat-label">Open Engagements</div>
        <div class="stat-value">${kpis.openEngagements}</div>
        <div class="muted">Active work in progress</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">At-Risk Items</div>
        <div class="stat-value ${kpis.atRiskItems > 0 ? "danger" : "ok"}">
          ${kpis.atRiskItems}
        </div>
        <div class="muted">Requires immediate attention</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Pending Approvals</div>
        <div class="stat-value ${kpis.pendingApprovals > 0 ? "warn" : "ok"}">
          ${kpis.pendingApprovals}
        </div>
        <div class="muted">Maker-checker queue</div>
      </div>
    </section>

    <section class="grid grid-cols-3" style="margin-bottom: 18px;">
      <div class="card stat-card">
        <div class="stat-label">Upcoming Deadlines</div>
        <div class="stat-value ${kpis.upcomingDeadlines > 0 ? "info" : ""}">
          ${kpis.upcomingDeadlines}
        </div>
        <div class="muted">Next 14 days</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Evidence Backlog</div>
        <div class="stat-value ${kpis.evidenceBacklog > 0 ? "warn" : "ok"}">
          ${kpis.evidenceBacklog}
        </div>
        <div class="muted">Documents pending extraction</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Completion Rate</div>
        <div class="stat-value ${kpis.completionRate >= 80 ? "ok" : "warn"}">
          ${kpis.completionRate}%
        </div>
        <div class="muted">YTD engagement completion</div>
      </div>
    </section>

    <!-- Risk Heatmap & Deadlines -->
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">🔥 At-Risk Engagements</div>
        <div class="card-sub">High or critical risk items requiring attention.</div>
        ${atRiskEngagements.length === 0
            ? html`<div class="callout ok" style="margin-top: 14px;">
              No at-risk items. All engagements on track.
            </div>`
            : html`
              <table class="data-table" style="margin-top: 14px;">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Risk</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  ${atRiskEngagements.map(
                (e) => html`
                      <tr>
                        <td>${e.clientName}</td>
                        <td>${typeBadge(e.type)}</td>
                        <td>${riskBadge(e.riskLevel)}</td>
                        <td>${deadlineDisplay(e.dueDate)}</td>
                      </tr>
                    `
            )}
                </tbody>
              </table>
            `}
      </div>

      <div class="card">
        <div class="card-title">📅 Upcoming Deadlines</div>
        <div class="card-sub">Next filing dates and deliverables.</div>
        ${upcomingDeadlines.length === 0
            ? html`<div class="callout" style="margin-top: 14px;">
              No upcoming deadlines in the next 14 days.
            </div>`
            : html`
              <table class="data-table" style="margin-top: 14px;">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  ${upcomingDeadlines.map(
                (e) => html`
                      <tr>
                        <td>${e.clientName}</td>
                        <td>${statusBadge(e.status)}</td>
                        <td>${e.assignee}</td>
                        <td>${deadlineDisplay(e.dueDate)}</td>
                      </tr>
                    `
            )}
                </tbody>
              </table>
            `}
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="card" style="margin-top: 18px;">
      <div class="card-title">⚡ Quick Actions</div>
      <div class="row" style="gap: 12px; margin-top: 14px;">
        <button class="btn">+ New Engagement</button>
        <button class="btn">Review Queue</button>
        <button class="btn">Evidence Intake</button>
        <button class="btn">Generate Report</button>
      </div>
    </section>
  `;
}
