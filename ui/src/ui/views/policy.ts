import { html } from "lit";

export type PolicyProps = {
    connected: boolean;
    loading: boolean;
    error: string | null;
    decisions: Array<{
        id: string;
        timestamp: string;
        policyId: string;
        policyName: string;
        action: string;
        outcome: "allowed" | "denied" | "escalated";
        agent: string;
        context: string;
    }>;
    policies: Array<{
        id: string;
        name: string;
        category: string;
        enabled: boolean;
        evaluations: number;
        denials: number;
    }>;
    onRefresh: () => void;
};

function outcomeBadge(outcome: string): string {
    switch (outcome) {
        case "allowed":
            return "badge-ok";
        case "escalated":
            return "badge-warn";
        case "denied":
            return "badge-danger";
        default:
            return "";
    }
}

export function renderPolicy(props: PolicyProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Policy Console</div>
        <div class="card-sub">Connect to gateway to view policies.</div>
        <div class="callout" style="margin-top: 14px;">
          Gateway disconnected. Go to Overview to connect.
        </div>
      </section>
    `;
    }

    if (props.loading) {
        return html`
      <section class="card">
        <div class="card-title">Policy Console</div>
        <div class="card-sub">Loading policy data...</div>
        <div class="muted" style="margin-top: 14px;">⏳ Fetching data from gateway...</div>
      </section>
    `;
    }

    const totalEvaluations = props.policies.reduce((sum, p) => sum + p.evaluations, 0);
    const totalDenials = props.policies.reduce((sum, p) => sum + p.denials, 0);
    const activePolicies = props.policies.filter((p) => p.enabled).length;

    return html`
    <section class="grid grid-cols-4" style="gap: 18px;">
      <div class="card stat-card">
        <div class="stat-label">Active Policies</div>
        <div class="stat-value">${activePolicies}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Total Evaluations</div>
        <div class="stat-value">${totalEvaluations}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Denials</div>
        <div class="stat-value ${totalDenials > 0 ? 'warn' : ''}">${totalDenials}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Compliance Rate</div>
        <div class="stat-value ok">${totalEvaluations > 0 ? Math.round(((totalEvaluations - totalDenials) / totalEvaluations) * 100) : 100}%</div>
      </div>
    </section>

    <section class="grid grid-cols-2" style="margin-top: 18px; gap: 18px;">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Policy Rules</div>
            <div class="card-sub">Governance rules enforcing agent compliance.</div>
          </div>
        </div>
        ${props.policies.length === 0
            ? html`<div class="muted" style="margin-top: 14px;">No policies defined.</div>`
            : html`
              <div class="table-wrap" style="margin-top: 14px;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Policy</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Evals</th>
                      <th>Denials</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${props.policies.map(
                (p) => html`
                        <tr>
                          <td style="font-weight: 500;">${p.name}</td>
                          <td class="muted">${p.category}</td>
                          <td>
                            <span class="badge ${p.enabled ? 'badge-ok' : 'badge-muted'}">
                              ${p.enabled ? 'enabled' : 'disabled'}
                            </span>
                          </td>
                          <td>${p.evaluations}</td>
                          <td class="${p.denials > 0 ? 'warn' : ''}">${p.denials}</td>
                        </tr>
                      `
            )}
                  </tbody>
                </table>
              </div>
            `}
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Recent Decisions</div>
            <div class="card-sub">Latest policy evaluations.</div>
          </div>
          <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
        </div>
        ${props.decisions.length === 0
            ? html`<div class="muted" style="margin-top: 14px;">No recent decisions.</div>`
            : html`
              <div class="table-wrap" style="margin-top: 14px;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Policy</th>
                      <th>Action</th>
                      <th>Outcome</th>
                      <th>Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${props.decisions.slice(0, 10).map(
                (d) => html`
                        <tr>
                          <td class="muted mono" style="font-size: 11px;">${d.timestamp}</td>
                          <td>${d.policyName}</td>
                          <td class="mono" style="font-size: 12px;">${d.action}</td>
                          <td>
                            <span class="badge ${outcomeBadge(d.outcome)}">${d.outcome}</span>
                          </td>
                          <td>${d.agent}</td>
                        </tr>
                      `
            )}
                  </tbody>
                </table>
              </div>
            `}
      </div>
    </section>

    ${props.error
            ? html`<div class="callout danger" style="margin-top: 14px;">${props.error}</div>`
            : ''}
  `;
}
