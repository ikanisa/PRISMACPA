/**
 * FirmOS Routing Engine
 *
 * Routes incoming requests to the appropriate FirmOS agent
 * based on keywords, jurisdiction, and service type.
 */

import type { Jurisdiction } from "./db.js";

// =============================================================================
// TYPES
// =============================================================================

export interface RoutingRequest {
  request: string;
  entityId?: string;
  jurisdiction?: Jurisdiction;
  serviceType?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export interface RoutingDecision {
  primaryAgent: string;
  backupAgent?: string;
  confidence: number;
  reasoning: string;
  suggestedTaskType?: string;
}

// =============================================================================
// AGENT REGISTRY
// =============================================================================

export const FIRMOS_AGENTS = {
  // Orchestrator
  aline: {
    id: "firmos-orchestrator",
    name: "Aline",
    role: "Orchestrator",
    services: ["routing", "handoff", "workflow"],
  },

  // Specialists
  sofia: {
    id: "firmos-accounting",
    name: "Sofia",
    role: "Accounting & Financial Reporting",
    services: ["accounting", "bookkeeping", "financial_statements"],
    keywords: [
      "journal",
      "ledger",
      "trial balance",
      "reconcile",
      "close",
      "accounts",
      "financial statements",
    ],
  },
  matthew: {
    id: "firmos-tax",
    name: "Matthew",
    role: "Tax - Malta",
    services: ["tax_mt", "vat_mt", "cit_mt"],
    keywords: ["vat", "tax", "cit", "cfr", "ird", "withholding"],
    jurisdiction: "MT" as Jurisdiction,
  },
  emmanuel: {
    id: "firmos-tax-rw",
    name: "Emmanuel",
    role: "Tax - Rwanda",
    services: ["tax_rw", "vat_rw", "paye_rw"],
    keywords: ["vat", "tax", "rra", "paye", "withholding"],
    jurisdiction: "RW" as Jurisdiction,
  },
  patrick: {
    id: "firmos-audit",
    name: "Patrick",
    role: "Audit & Assurance",
    services: ["audit", "assurance", "review"],
    keywords: [
      "audit",
      "assurance",
      "review",
      "engagement",
      "risk assessment",
      "workpaper",
      "evidence",
    ],
  },
  james: {
    id: "firmos-advisory",
    name: "James",
    role: "Advisory & Consulting",
    services: ["advisory", "consulting", "valuation"],
    keywords: ["valuation", "advisory", "consulting", "forecast", "model", "kpi", "due diligence"],
  },
  fatima: {
    id: "firmos-risk",
    name: "Fatima",
    role: "Risk & Internal Audit",
    services: ["risk", "internal_audit", "controls"],
    keywords: ["risk", "control", "internal audit", "soc", "compliance", "assessment"],
  },
  claire: {
    id: "firmos-csp",
    name: "Claire",
    role: "Corporate Services - Malta",
    services: ["csp_mt", "mbr", "secretarial"],
    keywords: ["mbr", "annual return", "board", "resolution", "corporate", "secretary", "register"],
    jurisdiction: "MT" as Jurisdiction,
  },
  chantal: {
    id: "firmos-notary",
    name: "Chantal",
    role: "Notary & Registration - Rwanda",
    services: ["notary_rw", "rdb", "registration"],
    keywords: ["rdb", "notary", "registration", "certify", "authentication", "legalization"],
    jurisdiction: "RW" as Jurisdiction,
  },

  // Quality & Governance
  diane: {
    id: "firmos-qc",
    name: "Diane",
    role: "QC Guardian",
    services: ["qc", "review", "approval"],
    keywords: ["qc", "quality", "review", "check", "approve", "reject"],
  },
  marco: {
    id: "firmos-governance",
    name: "Marco",
    role: "Governor",
    services: ["governance", "policy", "escalation"],
    keywords: ["policy", "escalate", "release", "authority", "override", "governance"],
  },

  // Technical
  yves: {
    id: "firmos-fullstack",
    name: "Yves",
    role: "Fullstack Developer",
    services: ["development", "maintenance", "integration"],
    keywords: ["code", "bug", "feature", "deploy", "github", "maintenance"],
  },
} as const;

export type AgentKey = keyof typeof FIRMOS_AGENTS;

// =============================================================================
// KEYWORD EXTRACTION
// =============================================================================

function extractKeywords(text: string): Set<string> {
  const normalized = text.toLowerCase();
  const words = new Set<string>();

  // Extract individual words
  for (const word of normalized.split(/\s+/)) {
    words.add(word.replace(/[^\w]/g, ""));
  }

  // Extract common phrases
  const phrases = [
    "trial balance",
    "financial statements",
    "risk assessment",
    "internal audit",
    "annual return",
    "due diligence",
    "board resolution",
  ];

  for (const phrase of phrases) {
    if (normalized.includes(phrase)) {
      words.add(phrase);
    }
  }

  return words;
}

// =============================================================================
// ROUTING LOGIC
// =============================================================================

export function routeRequest(req: RoutingRequest): RoutingDecision {
  const keywords = extractKeywords(req.request);
  const scores: Array<{ agent: AgentKey; score: number; matchedKeywords: string[] }> = [];

  // Score each agent based on keyword matches
  for (const [key, agent] of Object.entries(FIRMOS_AGENTS)) {
    if (!("keywords" in agent)) continue;

    const agentKeywords = agent.keywords as readonly string[];
    const matched: string[] = [];
    let score = 0;

    for (const kw of agentKeywords) {
      if (keywords.has(kw)) {
        matched.push(kw);
        score += 1;
      }
      // Partial match bonus
      for (const word of keywords) {
        if (word.includes(kw) || kw.includes(word)) {
          score += 0.5;
        }
      }
    }

    // Jurisdiction bonus
    if ("jurisdiction" in agent && req.jurisdiction && agent.jurisdiction === req.jurisdiction) {
      score += 2;
    }

    // Service type exact match
    if (req.serviceType && (agent.services as readonly string[]).includes(req.serviceType)) {
      score += 3;
    }

    if (score > 0) {
      scores.push({ agent: key as AgentKey, score, matchedKeywords: matched });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    // Default to Aline for unknown requests
    return {
      primaryAgent: "firmos-orchestrator",
      confidence: 0.3,
      reasoning: "No keyword matches found, routing to orchestrator for triage",
    };
  }

  const best = scores[0];
  const agent = FIRMOS_AGENTS[best.agent];
  const confidence = Math.min(best.score / 5, 1);

  return {
    primaryAgent: agent.id,
    backupAgent: scores.length > 1 ? FIRMOS_AGENTS[scores[1].agent].id : undefined,
    confidence,
    reasoning: `Matched keywords: ${best.matchedKeywords.join(", ")} (score: ${best.score.toFixed(1)})`,
    suggestedTaskType: guesTaskType(best.matchedKeywords, req),
  };
}

// =============================================================================
// TASK TYPE INFERENCE
// =============================================================================

function guesTaskType(keywords: string[], req: RoutingRequest): string | undefined {
  const kw = keywords.join(" ").toLowerCase();

  if (kw.includes("vat")) return "vat_return";
  if (kw.includes("journal")) return "journal_entry";
  if (kw.includes("reconcile")) return "bank_reconciliation";
  if (kw.includes("audit") && kw.includes("engage")) return "audit_engagement";
  if (kw.includes("mbr") || kw.includes("annual return")) return "mbr_filing";
  if (kw.includes("rdb") || kw.includes("register")) return "rdb_registration";
  if (kw.includes("qc") || kw.includes("review")) return "qc_review";
  if (kw.includes("valuation")) return "valuation";
  if (kw.includes("risk")) return "risk_assessment";

  return undefined;
}

// =============================================================================
// AGENT LOOKUP
// =============================================================================

export function getAgentById(id: string): (typeof FIRMOS_AGENTS)[AgentKey] | undefined {
  for (const agent of Object.values(FIRMOS_AGENTS)) {
    if (agent.id === id) return agent;
  }
  return undefined;
}

export function getAgentByName(name: string): (typeof FIRMOS_AGENTS)[AgentKey] | undefined {
  const normalized = name.toLowerCase();
  for (const agent of Object.values(FIRMOS_AGENTS)) {
    if (agent.name.toLowerCase() === normalized) return agent;
  }
  return undefined;
}

export function listAgentsForJurisdiction(
  jurisdiction: Jurisdiction,
): Array<(typeof FIRMOS_AGENTS)[AgentKey]> {
  const result = [];
  for (const agent of Object.values(FIRMOS_AGENTS)) {
    if (!("jurisdiction" in agent) || agent.jurisdiction === jurisdiction) {
      result.push(agent);
    }
  }
  return result;
}
