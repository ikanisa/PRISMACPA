import { html } from "lit";

export type PacksProps = {
    connected: boolean;
    loading: boolean;
    error: string | null;
    packs: Array<{
        id: string;
        name: string;
        version: string;
        policiesCount: number;
        status: "active" | "draft" | "deprecated";
        lastUpdated: string;
    }>;
    onRefresh: () => void;
};

export function renderPacks(props: PacksProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Policy Packs</div>
        <div class="card-sub">Connect to gateway to view packs.</div>
        <div class="callout" style="margin-top: 14px;">
          Gateway disconnected. Go to Overview to connect.
        </div>
      </section>
    `;
    }

    if (props.loading) {
        return html`
      <section class="card">
        <div class="card-title">Policy Packs</div>
        <div class="card-sub">Loading policy packs...</div>
        <div class="muted" style="margin-top: 14px;">⏳ Fetching data from gateway...</div>
      </section>
    `;
    }

    return html`
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Policy Packs</div>
          <div class="card-sub">Governance policy bundles for agent compliance.</div>
        </div>
        <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
      </div>
      ${props.packs.length === 0
            ? html`<div class="muted" style="margin-top: 14px;">No policy packs defined. Create packs to bundle governance rules.</div>`
            : html`
            <div class="table-wrap" style="margin-top: 14px;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Pack Name</th>
                    <th>Version</th>
                    <th>Policies</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  ${props.packs.map(
                (pack) => html`
                      <tr>
                        <td style="font-weight: 500;">${pack.name}</td>
                        <td class="mono">${pack.version}</td>
                        <td>${pack.policiesCount}</td>
                        <td>
                          <span class="badge ${pack.status === 'active' ? 'badge-ok' : pack.status === 'draft' ? 'badge-warn' : 'badge-muted'}">
                            ${pack.status}
                          </span>
                        </td>
                        <td class="muted">${pack.lastUpdated}</td>
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
