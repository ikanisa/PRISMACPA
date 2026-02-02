import { html } from "lit";

export type IncidentsProps = {
    connected: boolean;
    loading: boolean;
    error: string | null;
    incidents: Array<{
        id: string;
        title: string;
        severity: "critical" | "high" | "medium" | "low";
        status: "open" | "investigating" | "resolved" | "closed";
        createdAt: string;
        resolvedAt: string | null;
        assignee: string | null;
        description: string;
    }>;
    onRefresh: () => void;
};

function severityBadge(severity: string): string {
    switch (severity) {
        case "critical":
            return "badge-danger";
        case "high":
            return "badge-warn";
        case "medium":
            return "badge-muted";
        case "low":
            return "";
        default:
            return "";
    }
}

function statusBadge(status: string): string {
    switch (status) {
        case "resolved":
        case "closed":
            return "badge-ok";
        case "investigating":
            return "badge-warn";
        case "open":
            return "badge-danger";
        default:
            return "";
    }
}

export function renderIncidents(props: IncidentsProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Incidents</div>
        <div class="card-sub">Connect to gateway to view incidents.</div>
        <div class="callout" style="margin-top: 14px;">
          Gateway disconnected. Go to Overview to connect.
        </div>
      </section>
    `;
    }

    if (props.loading) {
        return html`
      <section class="card">
        <div class="card-title">Incidents</div>
        <div class="card-sub">Loading incidents...</div>
        <div class="muted" style="margin-top: 14px;">⏳ Fetching data from gateway...</div>
      </section>
    `;
    }

    const openCount = props.incidents.filter((i) => i.status === "open" || i.status === "investigating").length;

    return html`
    <section class="grid grid-cols-4" style="gap: 18px;">
      <div class="card stat-card">
        <div class="stat-label">Total Incidents</div>
        <div class="stat-value">${props.incidents.length}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Open</div>
        <div class="stat-value ${openCount > 0 ? 'warn' : ''}">${openCount}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Resolved</div>
        <div class="stat-value ok">${props.incidents.filter((i) => i.status === "resolved" || i.status === "closed").length}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Critical</div>
        <div class="stat-value ${props.incidents.filter((i) => i.severity === "critical").length > 0 ? 'danger' : ''}">${props.incidents.filter((i) => i.severity === "critical").length}</div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-header">
        <div>
          <div class="card-title">Incident Log</div>
          <div class="card-sub">System issues and their resolution status.</div>
        </div>
        <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
      </div>
      ${props.incidents.length === 0
            ? html`<div class="muted" style="margin-top: 14px;">No incidents recorded. System is operating normally. ✅</div>`
            : html`
            <div class="table-wrap" style="margin-top: 14px;">
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Created</th>
                    <th>Resolved</th>
                  </tr>
                </thead>
                <tbody>
                  ${props.incidents.map(
                (inc) => html`
                      <tr>
                        <td class="mono">${inc.id}</td>
                        <td>${inc.title}</td>
                        <td>
                          <span class="badge ${severityBadge(inc.severity)}">${inc.severity}</span>
                        </td>
                        <td>
                          <span class="badge ${statusBadge(inc.status)}">${inc.status}</span>
                        </td>
                        <td>${inc.assignee ?? '-'}</td>
                        <td class="muted">${inc.createdAt}</td>
                        <td class="muted">${inc.resolvedAt ?? '-'}</td>
                      </tr>
                    `
            )}
                </tbody>
              </table>
            </div>
          `}
    </section>

    ${props.error
            ? html`<div class="callout danger" style="margin-top: 14px;">${props.error}</div>`
            : ''}
  `;
}
