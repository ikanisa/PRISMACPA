import { html, nothing } from "lit";

/**
 * Evidence Ledger View
 * Document intake table with OCR status, hash verification, and pack assignment.
 */

export type EvidenceStatus = "pending" | "extracting" | "extracted" | "verified" | "rejected";
export type EvidenceSource = "upload" | "email" | "scan" | "api";

export type EvidenceEntry = {
    id: string;
    filename: string;
    fileHash: string;
    mimeType: string;
    fileSizeBytes: number;
    source: EvidenceSource;
    documentType?: string;
    vendorName?: string;
    documentDate?: string;
    grossAmount?: number;
    vatAmount?: number;
    status: EvidenceStatus;
    ocrConfidence?: number;
    vatPeriodId?: string;
    packId?: string;
    createdAt: string;
};

export type EvidenceStats = {
    total: number;
    pending: number;
    extracting: number;
    extracted: number;
    verified: number;
    rejected: number;
};

export type EvidenceLedgerProps = {
    connected: boolean;
    entries: EvidenceEntry[];
    stats: EvidenceStats;
    loading: boolean;
    filter: EvidenceStatus | "all";
    onFilterChange: (filter: EvidenceStatus | "all") => void;
    onVerify: (id: string) => void;
    onReject: (id: string) => void;
    onUpload: () => void;
    onRefresh: () => void;
};

const statusConfig: Record<EvidenceStatus, { color: string; label: string; icon: string }> = {
    pending: { color: "info", label: "Pending", icon: "⏳" },
    extracting: { color: "warn", label: "Extracting", icon: "🔄" },
    extracted: { color: "ok", label: "Extracted", icon: "📝" },
    verified: { color: "success", label: "Verified", icon: "✓" },
    rejected: { color: "error", label: "Rejected", icon: "✗" },
};

const sourceIcons: Record<EvidenceSource, string> = {
    upload: "📤",
    email: "📧",
    scan: "📄",
    api: "🔗",
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatEur(amount: number | undefined): string {
    if (amount === undefined) return "—";
    return new Intl.NumberFormat("en-MT", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-MT", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function renderConfidenceBadge(confidence: number | undefined) {
    if (confidence === undefined) return nothing;
    const pct = Math.round(confidence * 100);
    const color = pct >= 90 ? "success" : pct >= 70 ? "ok" : pct >= 50 ? "warn" : "error";
    return html`<span class="badge ${color}" title="OCR Confidence">${pct}%</span>`;
}

export function renderEvidenceLedger(props: EvidenceLedgerProps) {
    if (!props.connected) {
        return html`
      <section class="card">
        <div class="card-title">Evidence Ledger</div>
        <div class="card-sub">Connect to gateway to view document intake.</div>
        <div class="callout info" style="margin-top: 14px;">
          Disconnected from gateway. Configure connection in Overview.
        </div>
      </section>
    `;
    }

    const filteredEntries = props.filter === "all"
        ? props.entries
        : props.entries.filter(e => e.status === props.filter);

    return html`
    <style>
      .evidence-filters { display: flex; gap: 6px; flex-wrap: wrap; }
      .evidence-filters button { 
        padding: 6px 12px; 
        border-radius: 4px; 
        font-size: 12px;
        cursor: pointer;
        border: 1px solid var(--border-color);
        background: transparent;
      }
      .evidence-filters button.active { 
        background: var(--accent-color); 
        color: white;
        border-color: var(--accent-color);
      }
      .hash-col { font-family: monospace; font-size: 11px; color: var(--muted-color); }
      .action-btns { display: flex; gap: 4px; }
      .action-btns button { font-size: 11px; padding: 3px 8px; }
    </style>

    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Evidence Ledger</div>
          <div class="card-sub">Document intake with OCR extraction and verification.</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn" @click=${() => props.onUpload()}>+ Upload</button>
          <button class="btn secondary" @click=${() => props.onRefresh()}>Refresh</button>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="stat-grid">
        <div class="stat">
          <div class="stat-label">Total</div>
          <div class="stat-value">${props.stats.total}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Pending</div>
          <div class="stat-value ${props.stats.pending > 0 ? "warn" : ""}">${props.stats.pending}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Extracting</div>
          <div class="stat-value">${props.stats.extracting}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Extracted</div>
          <div class="stat-value">${props.stats.extracted}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Verified</div>
          <div class="stat-value ok">${props.stats.verified}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Rejected</div>
          <div class="stat-value ${props.stats.rejected > 0 ? "error" : ""}">${props.stats.rejected}</div>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div class="card-title" style="font-size: 14px;">Documents</div>
        <div class="evidence-filters">
          <button 
            class="${props.filter === "all" ? "active" : ""}"
            @click=${() => props.onFilterChange("all")}
          >All</button>
          ${(Object.keys(statusConfig) as EvidenceStatus[]).map(status => html`
            <button 
              class="${props.filter === status ? "active" : ""}"
              @click=${() => props.onFilterChange(status)}
            >${statusConfig[status].label}</button>
          `)}
        </div>
      </div>

      ${props.loading ? html`
        <div class="loading-skeleton"></div>
      ` : filteredEntries.length === 0 ? html`
        <div class="callout">No documents found. Upload evidence to get started.</div>
      ` : html`
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 24px;"></th>
              <th>Filename</th>
              <th>Vendor</th>
              <th>Date</th>
              <th style="text-align: right;">Amount</th>
              <th>Status</th>
              <th>Confidence</th>
              <th style="width: 80px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEntries.map(entry => html`
              <tr>
                <td>${sourceIcons[entry.source]}</td>
                <td>
                  <div>${entry.filename}</div>
                  <div class="hash-col" title="${entry.fileHash}">
                    ${entry.fileHash.slice(0, 12)}...
                  </div>
                </td>
                <td>${entry.vendorName || "—"}</td>
                <td>${entry.documentDate ? formatDate(entry.documentDate) : "—"}</td>
                <td style="text-align: right;">${formatEur(entry.grossAmount)}</td>
                <td>
                  <span class="badge ${statusConfig[entry.status].color}">
                    ${statusConfig[entry.status].icon} ${statusConfig[entry.status].label}
                  </span>
                </td>
                <td>${renderConfidenceBadge(entry.ocrConfidence)}</td>
                <td>
                  ${entry.status === "extracted" ? html`
                    <div class="action-btns">
                      <button class="btn small" @click=${() => props.onVerify(entry.id)}>✓</button>
                      <button class="btn small secondary" @click=${() => props.onReject(entry.id)}>✗</button>
                    </div>
                  ` : nothing}
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      `}
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title" style="font-size: 13px;">Document Integrity</div>
      <div class="muted" style="font-size: 12px; margin-top: 6px;">
        All documents are SHA-256 hashed on upload for deduplication and audit trail integrity.
        Hashes are immutable and cannot be modified after creation.
      </div>
    </section>
  `;
}
