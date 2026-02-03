import { html } from "lit";

export type ServicesProps = {
    connected: boolean;
    loading: boolean;
    error: string | null;
    services: Array<{
        id: string;
        name: string;
        role: string;
        status: "online" | "offline" | "busy" | "error";
        lastSeen: string | null;
        tasksCompleted: number;
        description: string;
    }>;
    onRefresh: () => void;
};

function statusColor(status: string): string {
    switch (status) {
        case "online":
            return "ok";
        case "busy":
            return "warn";
        case "error":
        case "offline":
            return "danger";
        default:
            return "";
    }
}

export function renderServices(props: ServicesProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Agent Services</div>
        <div class="card-sub">Connect to gateway to view services.</div>
        <div class="callout" style="margin-top: 14px;">
          Gateway disconnected. Go to Overview to connect.
        </div>
      </section>
    `;
    }

    if (props.loading) {
        return html`
      <section class="card">
        <div class="card-title">Agent Services</div>
        <div class="card-sub">Loading services...</div>
        <div class="muted" style="margin-top: 14px;">⏳ Fetching data from gateway...</div>
      </section>
    `;
    }

    return html`
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Agent Services</div>
          <div class="card-sub">All registered FirmOS agent services.</div>
        </div>
        <button class="btn" @click=${() => props.onRefresh()}>Refresh</button>
      </div>
      ${props.services.length === 0
            ? html`<div class="muted" style="margin-top: 14px;">No services registered. Configure agents in your firmos.json.</div>`
            : html`
            <div class="grid grid-cols-3" style="margin-top: 18px; gap: 14px;">
              ${props.services.map(
                (svc) => html`
                  <div class="card">
                    <div class="row" style="justify-content: space-between; align-items: flex-start;">
                      <div>
                        <div style="font-weight: 600;">${svc.name}</div>
                        <div class="muted" style="font-size: 12px;">${svc.role}</div>
                      </div>
                      <span class="badge badge-${statusColor(svc.status)}">${svc.status}</span>
                    </div>
                    <div class="muted" style="margin-top: 10px; font-size: 13px;">${svc.description}</div>
                    <div class="stat-grid" style="margin-top: 12px;">
                      <div class="stat">
                        <div class="stat-label">Tasks</div>
                        <div class="stat-value">${svc.tasksCompleted}</div>
                      </div>
                      <div class="stat">
                        <div class="stat-label">Last Seen</div>
                        <div class="stat-value">${svc.lastSeen ?? "never"}</div>
                      </div>
                    </div>
                  </div>
                `
            )}
            </div>
          `}
    </section>

    ${props.error
            ? html`<div class="callout danger" style="margin-top: 14px;">${props.error}</div>`
            : ''}
  `;
}
