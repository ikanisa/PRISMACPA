/**
 * FirmOS Gateway Handlers
 *
 * Gateway WebSocket handlers for FirmOS dashboard operations:
 * - Control Tower stats
 * - Jurisdiction Packs
 * - Release Queue (Marco)
 * - Incidents (Diane)
 * - Policy Decisions (Aline)
 */

import type { GatewayRequestHandlers } from "./types.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface SystemStats {
  activeAgents: number;
  totalAgents: number;
  activeWorkstreams: number;
  completedToday: number;
  pendingEscalations: number;
  avgResponseTime: number;
}

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  dueIn: string;
  severity: "critical" | "warning" | "info";
  client: string;
  assignee: string;
}

interface Escalation {
  id: string;
  title: string;
  from: string;
  to: string;
  severity: "critical" | "high" | "medium";
  timestamp: string;
  reason: string;
}

interface JurisdictionPack {
  id: string;
  jurisdiction: "MT" | "RW";
  name: string;
  version: string;
  lastUpdated: string;
  status: "active" | "pending" | "deprecated";
  services: string[];
  templates: number;
  policies: number;
  workflows: Array<{
    id: string;
    name: string;
    steps: number;
    tasks: number;
  }>;
}

interface ReleaseRequest {
  id: string;
  type: "template" | "policy" | "workflow" | "service";
  name: string;
  version: string;
  requestedBy: string;
  requestedAt: string;
  jurisdiction: "MT" | "RW" | "GLOBAL";
  status: "pending" | "approved" | "denied";
  priority: "critical" | "high" | "normal";
  qcPassed: boolean;
  changeLog: string;
}

interface Incident {
  id: string;
  type: "security" | "compliance" | "operational" | "policy";
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  reporter: string;
  reportedAt: string;
  status: "open" | "investigating" | "resolved" | "closed";
  affectedClients: number;
  jurisdiction: "MT" | "RW" | "GLOBAL";
  resolution: string | null;
}

interface PolicyDecision {
  id: string;
  policyId: string;
  policyName: string;
  decision: "allow" | "deny" | "escalate" | "review";
  tier: string;
  requestor: string;
  timestamp: string;
  context: string;
  reasoning: string;
  overrideBy: string | null;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_STATS: SystemStats = {
  activeAgents: 8,
  totalAgents: 11,
  activeWorkstreams: 23,
  completedToday: 47,
  pendingEscalations: 3,
  avgResponseTime: 1.2,
};

const MOCK_DEADLINES: Deadline[] = [
  {
    id: "dl-1",
    title: "Q4 VAT Return - Acme Corp",
    dueDate: "2026-01-15",
    dueIn: "3 days",
    severity: "critical",
    client: "Acme Corp",
    assignee: "agent_matthew",
  },
  {
    id: "dl-2",
    title: "Annual Accounts - Beta Ltd",
    dueDate: "2026-01-20",
    dueIn: "8 days",
    severity: "warning",
    client: "Beta Ltd",
    assignee: "agent_julien",
  },
];

const MOCK_ESCALATIONS: Escalation[] = [
  {
    id: "esc-1",
    title: "High-risk PEP identification",
    from: "agent_caroline",
    to: "agent_diane",
    severity: "critical",
    timestamp: "2026-01-12T09:30:00Z",
    reason: "Automatic escalation: PEP match confidence > 85%",
  },
];

const MOCK_PACKS: JurisdictionPack[] = [
  {
    id: "pack-mt",
    jurisdiction: "MT",
    name: "Malta Jurisdiction Pack",
    version: "2.1.0",
    lastUpdated: "2026-01-10",
    status: "active",
    services: ["CSP", "Tax", "Audit", "AML"],
    templates: 45,
    policies: 23,
    workflows: [
      { id: "wf-1", name: "Company Formation", steps: 8, tasks: 24 },
      { id: "wf-2", name: "VAT Return", steps: 5, tasks: 12 },
    ],
  },
  {
    id: "pack-rw",
    jurisdiction: "RW",
    name: "Rwanda Jurisdiction Pack",
    version: "1.8.0",
    lastUpdated: "2026-01-08",
    status: "active",
    services: ["Tax", "Audit", "Notary"],
    templates: 32,
    policies: 18,
    workflows: [
      { id: "wf-3", name: "RRA Tax Filing", steps: 6, tasks: 18 },
      { id: "wf-4", name: "Land Registration", steps: 4, tasks: 10 },
    ],
  },
];

const MOCK_RELEASES: ReleaseRequest[] = [
  {
    id: "rel-1",
    type: "template",
    name: "Annual Return Form v3",
    version: "3.0.0",
    requestedBy: "agent_claire",
    requestedAt: "2026-01-11T14:00:00Z",
    jurisdiction: "MT",
    status: "pending",
    priority: "high",
    qcPassed: true,
    changeLog: "Updated for 2026 MFSA requirements",
  },
  {
    id: "rel-2",
    type: "policy",
    name: "PEP Screening Threshold",
    version: "1.2.0",
    requestedBy: "agent_diane",
    requestedAt: "2026-01-10T11:00:00Z",
    jurisdiction: "GLOBAL",
    status: "pending",
    priority: "critical",
    qcPassed: true,
    changeLog: "Lowered threshold from 85% to 80% confidence",
  },
];

const MOCK_INCIDENTS: Incident[] = [
  {
    id: "inc-1",
    type: "security",
    title: "Unauthorized access attempt detected",
    severity: "high",
    reporter: "agent_diane",
    reportedAt: "2026-01-12T08:15:00Z",
    status: "investigating",
    affectedClients: 0,
    jurisdiction: "GLOBAL",
    resolution: null,
  },
  {
    id: "inc-2",
    type: "compliance",
    title: "Missed STR filing deadline",
    severity: "critical",
    reporter: "agent_caroline",
    reportedAt: "2026-01-11T16:30:00Z",
    status: "open",
    affectedClients: 1,
    jurisdiction: "MT",
    resolution: null,
  },
];

const MOCK_DECISIONS: PolicyDecision[] = [
  {
    id: "dec-1",
    policyId: "pol-aml-001",
    policyName: "High-Value Transaction Review",
    decision: "escalate",
    tier: "L3",
    requestor: "agent_caroline",
    timestamp: "2026-01-12T10:45:00Z",
    context: "Transaction > €50,000 to high-risk jurisdiction",
    reasoning: "Automatic escalation per AML policy P-001",
    overrideBy: null,
  },
  {
    id: "dec-2",
    policyId: "pol-qc-002",
    policyName: "Template Release Gate",
    decision: "allow",
    tier: "L2",
    requestor: "agent_claire",
    timestamp: "2026-01-12T09:30:00Z",
    context: "Annual Return Form v3 release request",
    reasoning: "All QC checks passed, dual-review completed",
    overrideBy: null,
  },
];

// =============================================================================
// GATEWAY HANDLERS
// =============================================================================

export const firmosHandlers: GatewayRequestHandlers = {
  /**
   * Get Control Tower statistics
   */
  "firmos.tower.get": ({ respond }) => {
    try {
      respond(true, {
        stats: MOCK_STATS,
        deadlines: MOCK_DEADLINES,
        escalations: MOCK_ESCALATIONS,
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * List jurisdiction packs
   */
  "firmos.packs.list": ({ params, respond }) => {
    try {
      const p = params as { jurisdiction?: "MT" | "RW" } | undefined;

      let packs = MOCK_PACKS;
      if (p?.jurisdiction) {
        packs = packs.filter((pack) => pack.jurisdiction === p.jurisdiction);
      }

      respond(true, {
        packs,
        totalCount: packs.length,
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * List release requests (Marco's queue)
   */
  "firmos.releases.list": ({ params, respond }) => {
    try {
      const p = params as { status?: "pending" | "approved" | "denied" } | undefined;

      let releases = MOCK_RELEASES;
      if (p?.status) {
        releases = releases.filter((rel) => rel.status === p.status);
      }

      respond(true, {
        releases,
        totalCount: releases.length,
        pendingCount: MOCK_RELEASES.filter((r) => r.status === "pending").length,
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * Authorize a release (Marco action)
   */
  "firmos.releases.authorize": ({ params, respond }) => {
    try {
      const p = params as { releaseId: string } | undefined;
      if (!p?.releaseId) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "releaseId is required"));
        return;
      }

      // In production, this would update the release status
      respond(true, {
        releaseId: p.releaseId,
        status: "approved",
        authorizedAt: new Date().toISOString(),
        authorizedBy: "agent_marco",
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * List incidents (Diane's queue)
   */
  "firmos.incidents.list": ({ params, respond }) => {
    try {
      const p = params as
        | {
            status?: "open" | "investigating" | "resolved" | "closed";
            severity?: "critical" | "high" | "medium" | "low";
          }
        | undefined;

      let incidents = MOCK_INCIDENTS;
      if (p?.status) {
        incidents = incidents.filter((inc) => inc.status === p.status);
      }
      if (p?.severity) {
        incidents = incidents.filter((inc) => inc.severity === p.severity);
      }

      respond(true, {
        incidents,
        totalCount: incidents.length,
        openCount: MOCK_INCIDENTS.filter((i) => i.status === "open" || i.status === "investigating")
          .length,
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * Resolve an incident
   */
  "firmos.incidents.resolve": ({ params, respond }) => {
    try {
      const p = params as { incidentId: string; resolution: string } | undefined;
      if (!p?.incidentId) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "incidentId is required"));
        return;
      }
      if (!p?.resolution) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "resolution is required"));
        return;
      }

      respond(true, {
        incidentId: p.incidentId,
        status: "resolved",
        resolution: p.resolution,
        resolvedAt: new Date().toISOString(),
        resolvedBy: "agent_diane",
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * List policy decisions (Aline's log)
   */
  "firmos.policy.decisions": ({ params, respond }) => {
    try {
      const p = params as
        | { decision?: "allow" | "deny" | "escalate" | "review"; limit?: number }
        | undefined;

      let decisions = MOCK_DECISIONS;
      if (p?.decision) {
        decisions = decisions.filter((dec) => dec.decision === p.decision);
      }

      const limit = p?.limit ?? 50;
      decisions = decisions.slice(0, limit);

      respond(true, {
        decisions,
        totalCount: decisions.length,
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * List FirmOS agents with L5 enrichment data
   */
  "firmos.agents.list": ({ respond }) => {
    try {
      const L5_AGENTS = [
        {
          id: "agent_aline",
          name: "Aline",
          title: "Firm Orchestrator",
          jurisdiction: "GLOBAL",
          status: "online",
          skillCount: 12,
          persona: "Managing Partner of Operations",
        },
        {
          id: "agent_marco",
          name: "Marco",
          title: "Autonomy & Policy Governor",
          jurisdiction: "GLOBAL",
          status: "online",
          skillCount: 11,
          persona: "Chief Risk & Ethics Officer",
        },
        {
          id: "agent_diane",
          name: "Diane",
          title: "Quality, Risk & Evidence Guardian",
          jurisdiction: "GLOBAL",
          status: "online",
          skillCount: 11,
          persona: "Chief Quality Officer",
        },
        {
          id: "agent_patrick",
          name: "Patrick",
          title: "Audit & Assurance Engine",
          jurisdiction: "GLOBAL",
          status: "online",
          skillCount: 15,
          persona: "Senior Audit Partner",
        },
        {
          id: "agent_sofia",
          name: "Sofia",
          title: "Accounting & Financial Reporting Engine",
          jurisdiction: "GLOBAL",
          status: "online",
          skillCount: 12,
          persona: "Chief Accounting Officer",
        },
        {
          id: "agent_james",
          name: "James",
          title: "Advisory & Consulting Engine",
          jurisdiction: "GLOBAL",
          status: "online",
          skillCount: 11,
          persona: "Managing Director, Advisory",
        },
        {
          id: "agent_fatima",
          name: "Fatima",
          title: "Risk, Controls & Internal Audit Engine",
          jurisdiction: "GLOBAL",
          status: "online",
          skillCount: 10,
          persona: "Chief Internal Audit Executive",
        },
        {
          id: "agent_matthew",
          name: "Matthew",
          title: "Malta Tax Engine",
          jurisdiction: "MT",
          status: "online",
          skillCount: 8,
          persona: "Malta Tax Partner",
        },
        {
          id: "agent_claire",
          name: "Claire",
          title: "Malta CSP / MBR Corporate Services Engine",
          jurisdiction: "MT",
          status: "online",
          skillCount: 9,
          persona: "Malta Corporate Services Partner",
        },
        {
          id: "agent_emmanuel",
          name: "Emmanuel",
          title: "Rwanda Tax Engine",
          jurisdiction: "RW",
          status: "online",
          skillCount: 7,
          persona: "Rwanda Tax Partner",
        },
        {
          id: "agent_chantal",
          name: "Chantal",
          title: "Rwanda Private Notary Engine",
          jurisdiction: "RW",
          status: "online",
          skillCount: 11,
          persona: "Rwanda Private Notary Partner",
        },
      ];

      respond(true, {
        agents: L5_AGENTS,
        totalCount: L5_AGENTS.length,
        byJurisdiction: { GLOBAL: 7, MT: 2, RW: 2 },
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * Subscribe to real-time agent status updates
   * Returns current status and starts broadcasting changes
   */
  "firmos.agents.subscribe": ({ respond, context }) => {
    try {
      const AGENT_STATUSES = [
        { id: "agent_aline", status: "online", activeWorkstreams: 3, lastActiveAt: Date.now() },
        {
          id: "agent_marco",
          status: "online",
          activeWorkstreams: 1,
          lastActiveAt: Date.now() - 60000,
        },
        {
          id: "agent_diane",
          status: "online",
          activeWorkstreams: 2,
          lastActiveAt: Date.now() - 30000,
        },
        { id: "agent_patrick", status: "busy", activeWorkstreams: 4, lastActiveAt: Date.now() },
        {
          id: "agent_sofia",
          status: "online",
          activeWorkstreams: 2,
          lastActiveAt: Date.now() - 120000,
        },
        {
          id: "agent_james",
          status: "online",
          activeWorkstreams: 1,
          lastActiveAt: Date.now() - 180000,
        },
        {
          id: "agent_fatima",
          status: "online",
          activeWorkstreams: 0,
          lastActiveAt: Date.now() - 300000,
        },
        { id: "agent_matthew", status: "busy", activeWorkstreams: 3, lastActiveAt: Date.now() },
        {
          id: "agent_claire",
          status: "online",
          activeWorkstreams: 2,
          lastActiveAt: Date.now() - 45000,
        },
        {
          id: "agent_emmanuel",
          status: "online",
          activeWorkstreams: 1,
          lastActiveAt: Date.now() - 90000,
        },
        {
          id: "agent_chantal",
          status: "online",
          activeWorkstreams: 1,
          lastActiveAt: Date.now() - 150000,
        },
      ];

      respond(true, {
        statuses: AGENT_STATUSES,
        subscribedAt: new Date().toISOString(),
      });

      // Simulate a status change broadcast after 5 seconds (in production, this would be event-driven)
      setTimeout(() => {
        context.broadcast("firmos.agent.status", {
          agentId: "agent_patrick",
          status: "online",
          activeWorkstreams: 3,
          changedAt: new Date().toISOString(),
        });
      }, 5000);
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * Get pre-configured FirmOS Team for group chat
   */
  "firmos.team.get": ({ respond }) => {
    try {
      const FIRMOS_TEAM = {
        id: "team_firmos",
        name: "FirmOS Team",
        description: "All 11 FirmOS agents for firm-wide coordination",
        emoji: "🏢",
        theme: "#3b82f6",
        members: [
          { id: "agent_aline", name: "Aline", emoji: "👩‍💼", role: "Orchestrator" },
          { id: "agent_marco", name: "Marco", emoji: "⚖️", role: "Governor" },
          { id: "agent_diane", name: "Diane", emoji: "🔍", role: "Guardian" },
          { id: "agent_patrick", name: "Patrick", emoji: "📊", role: "Audit" },
          { id: "agent_sofia", name: "Sofia", emoji: "📈", role: "Accounting" },
          { id: "agent_james", name: "James", emoji: "💡", role: "Advisory" },
          { id: "agent_fatima", name: "Fatima", emoji: "🛡️", role: "Risk & Controls" },
          { id: "agent_matthew", name: "Matthew", emoji: "🇲🇹", role: "Malta Tax" },
          { id: "agent_claire", name: "Claire", emoji: "🏛️", role: "Malta CSP" },
          { id: "agent_emmanuel", name: "Emmanuel", emoji: "🇷🇼", role: "Rwanda Tax" },
          { id: "agent_chantal", name: "Chantal", emoji: "📜", role: "Rwanda Notary" },
        ],
      };

      respond(true, { team: FIRMOS_TEAM });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * List agent-to-agent delegations
   */
  "firmos.delegations.list": ({ params, respond }) => {
    try {
      const p = params as { status?: "active" | "pending" | "completed" | "cancelled" } | undefined;

      const DELEGATIONS = [
        {
          id: "del-1",
          fromAgentId: "agent_aline",
          fromAgentName: "Aline",
          toAgentId: "agent_patrick",
          toAgentName: "Patrick",
          taskType: "Audit Engagement",
          taskDescription: "Q4 statutory audit for Acme Corp",
          status: "active",
          priority: "high",
          createdAt: "2026-02-01T09:00:00Z",
          dueAt: "2026-02-15T17:00:00Z",
        },
        {
          id: "del-2",
          fromAgentId: "agent_aline",
          fromAgentName: "Aline",
          toAgentId: "agent_sofia",
          toAgentName: "Sofia",
          taskType: "Financial Reporting",
          taskDescription: "Year-end close for Beta Ltd",
          status: "active",
          priority: "normal",
          createdAt: "2026-02-01T10:30:00Z",
          dueAt: "2026-02-20T17:00:00Z",
        },
        {
          id: "del-3",
          fromAgentId: "agent_patrick",
          fromAgentName: "Patrick",
          toAgentId: "agent_diane",
          toAgentName: "Diane",
          taskType: "Quality Review",
          taskDescription: "Audit file QC review",
          status: "pending",
          priority: "high",
          createdAt: "2026-02-02T08:00:00Z",
        },
        {
          id: "del-4",
          fromAgentId: "agent_aline",
          fromAgentName: "Aline",
          toAgentId: "agent_matthew",
          toAgentName: "Matthew",
          taskType: "Tax Compliance",
          taskDescription: "VAT return preparation",
          status: "completed",
          priority: "normal",
          createdAt: "2026-01-28T14:00:00Z",
          completedAt: "2026-02-01T16:30:00Z",
        },
      ];

      let delegations = DELEGATIONS;
      if (p?.status) {
        delegations = delegations.filter((d) => d.status === p.status);
      }

      respond(true, {
        delegations,
        totalCount: delegations.length,
        activeCount: DELEGATIONS.filter((d) => d.status === "active" || d.status === "pending")
          .length,
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },
};
