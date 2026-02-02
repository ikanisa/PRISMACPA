import { html } from "lit";

export type ReleasesProps = {
    connected: boolean;
    loading: boolean;
    error: string | null;
    releases: Array<{
        id: string;
        version: string;
        environment: string;
        status: "pending" | "in_progress" | "completed" | "failed" | "rolled_back";
        startedAt: string | null;
        completedAt: string | null;
        deployedBy: string;
        changes: number;
    }>;
    onRefresh: () => void;
};

function statusBadge(status: string): string {
    switch (status) {
        case "completed":
            return "badge-ok";
        case "in_progress":
        case "pending":
            return "badge-warn";
        case "failed":
        case "rolled_back":
            return "badge-danger";
        default:
            return "";
    }
}

export function renderReleases(props: ReleasesProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Releases</div>
        <div class="card-sub">Connect to gateway to view releases.</div>
        <div class="callout" style="margin-top: 14px;">
          Gateway disconnected. Go to Overview to connect.
        </div>
      </section>
    `;
    }

    if (props.loading) {
        return html`
      <section class="card">
        <div class="card-title">Releases</div>
        <div class="card-sub">Loading release history...</div>
        <div class="muted" style="margin-top: 14px;">⏳ Fetching data from gateway...</div>
      </section>
    `;
    }

    return html`
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Release Pipeline</div>
          <div class="card-sub">Configuration and policy deployments.</div>
        </div>
        <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
      </div>
      ${props.releases.length === 0
            ? html`<div class="muted" style="margin-top: 14px;">No releases recorded. Deploy configuration changes to see history.</div>`
            : html`
            <div class="table-wrap" style="margin-top: 14px;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Environment</th>
                    <th>Status</th>
                    <th>Changes</th>
                    <th>Started</th>
                    <th>Completed</th>
                    <th>Deployed By</th>
                  </tr>
                </thead>
                <tbody>
                  ${props.releases.map(
                (r) => html`
                      <tr>
                        <td class="mono" style="font-weight: 500;">${r.version}</td>
                        <td>${r.environment}</td>
                        <td>
                          <span class="badge ${statusBadge(r.status)}">
                            ${r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>${r.changes}</td>
                        <td class="muted">${r.startedAt ?? '-'}</td>
                        <td class="muted">${r.completedAt ?? '-'}</td>
                        <td>${r.deployedBy}</td>
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
