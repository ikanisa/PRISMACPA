import { html } from "lit";

export type ControlTowerProps = {
    connected: boolean;
    loading: boolean;
    error: string | null;
    stats: {
        activeEngagements: number;
        workstreamsInProgress: number;
        pendingEscalations: number;
        agentsHealthy: number;
    } | null;
    escalations: Array<{
        id: string;
        type: string;
        client: string;
        reason: string;
        agent: string;
        created: string;
    }>;
    deadlines: Array<{
        id: string;
        client: string;
        workflow: string;
        due: string;
        agent: string;
        status: string;
    }>;
    onRefresh: () => void;
};

export function renderControlTower(props: ControlTowerProps) {
    const stats = props.stats ?? {
        activeEngagements: 0,
        workstreamsInProgress: 0,
        pendingEscalations: 0,
        agentsHealthy: 0,
    };

    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Control Tower</div>
        <div class="card-sub">Connect to gateway to view system status.</div>
        <div class="callout" style="margin-top: 14px;">
          Gateway disconnected. Go to Overview to connect.
        </div>
      </section>
    `;
    }

    if (props.loading) {
        return html`
      <section class="card">
        <div class="card-title">Control Tower</div>
        <div class="card-sub">Loading system status...</div>
        <div class="muted" style="margin-top: 14px;">⏳ Fetching data from gateway...</div>
      </section>
    `;
    }

    return html`
    <section class="grid grid-cols-4" style="gap: 18px;">
      <div class="card stat-card">
        <div class="stat-label">Active Engagements</div>
        <div class="stat-value" style="color: var(--primary)">${stats.activeEngagements}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Workstreams In Progress</div>
        <div class="stat-value">${stats.workstreamsInProgress}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Pending Escalations</div>
        <div class="stat-value ${stats.pendingEscalations > 0 ? 'warn' : ''}">${stats.pendingEscalations}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Agents Healthy</div>
        <div class="stat-value ok">${stats.agentsHealthy}</div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-header">
        <div>
          <div class="card-title">⚠️ Pending Escalations</div>
          <div class="card-sub">Items requiring operator review or action.</div>
        </div>
        <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
      </div>
      ${props.escalations.length === 0
            ? html`<div class="muted" style="margin-top: 14px;">No pending escalations. All clear! ✅</div>`
            : html`
            <div class="table-wrap" style="margin-top: 14px;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Reason</th>
                    <th>Agent</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  ${props.escalations.map(
                (esc) => html`
                      <tr>
                        <td>
                          <span class="badge ${esc.type === 'GUARDIAN_BLOCK' ? 'badge-danger' : 'badge-warn'}">
                            ${esc.type === 'GUARDIAN_BLOCK' ? 'BLOCKED' : 'REVIEW'}
                          </span>
                        </td>
                        <td>${esc.client}</td>
                        <td class="muted">${esc.reason}</td>
                        <td>${esc.agent}</td>
                        <td class="muted">${esc.created}</td>
                      </tr>
                    `
            )}
                </tbody>
              </table>
            </div>
          `}
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">📅 Upcoming Deadlines</div>
      <div class="card-sub">Workstreams with approaching due dates.</div>
      ${props.deadlines.length === 0
            ? html`<div class="muted" style="margin-top: 14px;">No upcoming deadlines.</div>`
            : html`
            <div class="table-wrap" style="margin-top: 14px;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Workflow</th>
                    <th>Due Date</th>
                    <th>Agent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${props.deadlines.map(
                (d) => html`
                      <tr>
                        <td>${d.client}</td>
                        <td>${d.workflow}</td>
                        <td>${d.due}</td>
                        <td>${d.agent}</td>
                        <td>
                          <span class="badge ${d.status === 'on_track' ? 'badge-ok' : d.status === 'at_risk' ? 'badge-warn' : 'badge-danger'}">
                            ${d.status.replace('_', ' ')}
                          </span>
                        </td>
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
