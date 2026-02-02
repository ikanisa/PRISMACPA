import { html, nothing } from "lit";

/**
 * Audit Working Papers View
 * PBC tracking, working paper status, and pack assembly for audit engagements.
 */

export type WorkpaperStatus = "not_started" | "in_progress" | "review" | "completed";
export type PbcStatus = "pending" | "received" | "reviewed" | "nai"; // NAI = Not Applicable / Information

export type WorkingPaper = {
    id: string;
    reference: string;  // e.g., "A.1.1", "B.2.3"
    title: string;
    description?: string;
    status: WorkpaperStatus;
    assignedTo?: string;
    preparedBy?: string;
    preparedAt?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    evidenceCount: number;
    notes?: string;
};

export type PbcItem = {
    id: string;
    description: string;
    requestedFrom: string;
    requestedAt: string;
    dueDate: string;
    status: PbcStatus;
    receivedAt?: string;
    notes?: string;
};

export type AuditEngagement = {
    id: string;
    clientName: string;
    periodEnd: string;
    status: "planning" | "fieldwork" | "review" | "completed";
    workpaperCount: number;
    completedCount: number;
    pbcPendingCount: number;
};

export type AuditWorkpapersProps = {
    connected: boolean;
    engagements: AuditEngagement[];
    selectedEngagementId: string | null;
    workpapers: WorkingPaper[];
    pbcItems: PbcItem[];
    loading: boolean;
    onSelectEngagement: (id: string) => void;
    onUpdateWorkpaper: (id: string, status: WorkpaperStatus) => void;
    onAddPbcItem: () => void;
    onRefresh: () => void;
};

const wpStatusConfig: Record<WorkpaperStatus, { color: string; label: string }> = {
    not_started: { color: "muted", label: "Not Started" },
    in_progress: { color: "info", label: "In Progress" },
    review: { color: "warn", label: "In Review" },
    completed: { color: "success", label: "Completed" },
};

const pbcStatusConfig: Record<PbcStatus, { color: string; label: string }> = {
    pending: { color: "warn", label: "Pending" },
    received: { color: "info", label: "Received" },
    reviewed: { color: "success", label: "Reviewed" },
    nai: { color: "muted", label: "N/A" },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-MT", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function daysUntil(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function renderAuditWorkpapers(props: AuditWorkpapersProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">📋 Audit Working Papers</div>
        <div class="card-sub">Connect to gateway to manage audit engagements.</div>
        <div class="callout info" style="margin-top: 14px;">
          Disconnected from gateway. Configure connection in Overview.
        </div>
      </section>
    `;
    }

    const selectedEngagement = props.selectedEngagementId
        ? props.engagements.find(e => e.id === props.selectedEngagementId)
        : null;

    return html`
    <style>
      .audit-layout { display: grid; grid-template-columns: 280px 1fr; gap: 18px; }
      .engagement-list { display: flex; flex-direction: column; gap: 8px; }
      .engagement-card {
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 150ms ease;
      }
      .engagement-card:hover { border-color: var(--accent-color); }
      .engagement-card.selected {
        border-color: var(--accent-color);
        background: var(--hover-bg);
      }
      .engagement-card .client { font-weight: 500; }
      .engagement-card .meta { font-size: 12px; color: var(--muted-color); margin-top: 4px; }
      .progress-bar {
        height: 4px;
        background: var(--border-color);
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }
      .progress-bar .fill {
        height: 100%;
        background: var(--accent-color);
        transition: width 200ms ease;
      }
      .wp-ref { font-family: monospace; font-size: 12px; color: var(--muted-color); }
      .pbc-overdue { color: var(--error-color); }
      @media (max-width: 800px) {
        .audit-layout { grid-template-columns: 1fr; }
      }
    </style>

    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">📋 Audit Working Papers</div>
          <div class="card-sub">PBC tracking and working paper management.</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn secondary" @click=${() => props.onRefresh()}>Refresh</button>
        </div>
      </div>
    </section>

    ${props.loading ? html`
      <section class="card" style="margin-top: 18px;">
        <div class="loading-skeleton"></div>
      </section>
    ` : html`
      <div class="audit-layout" style="margin-top: 18px;">
        <section class="card">
          <div class="card-title" style="font-size: 14px; margin-bottom: 12px;">Engagements</div>
          ${props.engagements.length === 0 ? html`
            <div class="callout">No audit engagements found.</div>
          ` : html`
            <div class="engagement-list">
              ${props.engagements.map(eng => {
        const progress = eng.workpaperCount > 0
            ? (eng.completedCount / eng.workpaperCount) * 100
            : 0;
        return html`
                  <div 
                    class="engagement-card ${eng.id === props.selectedEngagementId ? "selected" : ""}"
                    @click=${() => props.onSelectEngagement(eng.id)}
                  >
                    <div class="client">${eng.clientName}</div>
                    <div class="meta">
                      Period: ${formatDate(eng.periodEnd)}
                      ${eng.pbcPendingCount > 0 ? html`
                        <span class="warn"> · ${eng.pbcPendingCount} PBC pending</span>
                      ` : nothing}
                    </div>
                    <div class="progress-bar">
                      <div class="fill" style="width: ${progress}%;"></div>
                    </div>
                  </div>
                `;
    })}
            </div>
          `}
        </section>

        <section class="card">
          ${selectedEngagement ? html`
            <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <div class="card-title" style="font-size: 16px;">${selectedEngagement.clientName}</div>
                <div class="muted">Period ending ${formatDate(selectedEngagement.periodEnd)}</div>
              </div>
              <span class="badge ${selectedEngagement.status === "completed" ? "success" : "info"}">
                ${selectedEngagement.status}
              </span>
            </div>

            <div class="card-title" style="font-size: 14px; margin-bottom: 10px;">
              Working Papers (${props.workpapers.filter(w => w.status === "completed").length}/${props.workpapers.length})
            </div>
            
            ${props.workpapers.length === 0 ? html`
              <div class="callout">No working papers for this engagement.</div>
            ` : html`
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Prepared</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  ${props.workpapers.map(wp => html`
                    <tr>
                      <td class="wp-ref">${wp.reference}</td>
                      <td>${wp.title}</td>
                      <td>
                        <span class="badge ${wpStatusConfig[wp.status].color}">
                          ${wpStatusConfig[wp.status].label}
                        </span>
                      </td>
                      <td>${wp.preparedBy || "—"}</td>
                      <td><span class="badge">${wp.evidenceCount}</span></td>
                    </tr>
                  `)}
                </tbody>
              </table>
            `}

            <div class="row" style="justify-content: space-between; align-items: center; margin-top: 20px; margin-bottom: 10px;">
              <div class="card-title" style="font-size: 14px;">PBC Items</div>
              <button class="btn small" @click=${() => props.onAddPbcItem()}>+ Add PBC</button>
            </div>

            ${props.pbcItems.length === 0 ? html`
              <div class="callout">No PBC items tracked for this engagement.</div>
            ` : html`
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>From</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${props.pbcItems.map(pbc => {
        const days = daysUntil(pbc.dueDate);
        const isOverdue = days < 0 && pbc.status === "pending";
        return html`
                      <tr>
                        <td>${pbc.description}</td>
                        <td>${pbc.requestedFrom}</td>
                        <td class="${isOverdue ? "pbc-overdue" : ""}">
                          ${formatDate(pbc.dueDate)}
                          ${isOverdue ? " (overdue)" : ""}
                        </td>
                        <td>
                          <span class="badge ${pbcStatusConfig[pbc.status].color}">
                            ${pbcStatusConfig[pbc.status].label}
                          </span>
                        </td>
                      </tr>
                    `;
    })}
                </tbody>
              </table>
            `}
          ` : html`
            <div class="callout">Select an engagement to view details.</div>
          `}
        </section>
      </div>
    `}
  `;
}
