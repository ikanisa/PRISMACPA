import { routeRequest } from "../src/firmos/routing-engine.js";
import { createHandoff, acceptHandoff, getPendingHandoffsForAgent } from "../src/firmos/handoff-manager.js";
import { listWorkstreams, listUpcomingDeadlines, getTowerStats } from "../src/firmos/db.js";
import { submitForQC, transitionQC, listPendingQCReviews } from "../src/firmos/qc-workflow.js";
import { postJournalEntry, reconcileAccount } from "../src/firmos/engines/accounting.js";
import { prepareVATReturn, computeTaxLiability } from "../src/firmos/engines/tax.js";
import { createAuditEngagement, recordEvidence } from "../src/firmos/engines/audit.js";
import { buildFinancialModel } from "../src/firmos/engines/advisory.js";
import { createRiskRegister, assessRisk } from "../src/firmos/engines/risk.js";
import { prepareBoardMinutes, submitMBRFiling } from "../src/firmos/engines/csp.js";
import { certifyDocument, registerCompany } from "../src/firmos/engines/notary.js";
import { checkAndAlertDeadlines } from "../src/firmos/deadline-engine.js";
import { MBRPortal } from "../src/firmos/portals/mbr.js";
import { CFRPortal } from "../src/firmos/portals/cfr.js";
import { RDBPortal } from "../src/firmos/portals/rdb.js";
import { RRAPortal } from "../src/firmos/portals/rra.js";

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    console.error("Usage: firmos <command> [args...]");
    process.exit(1);
}

// Ensure DB environment variables are present
if (!process.env.SUPABASE_URL) {
    console.warn("WARNING: SUPABASE_URL not set. Database operations may fail.");
}

async function main() {
    try {
        switch (command) {
            case "orch:route": await handleRoute(args.slice(1)); break;
            case "orch:handoff": await handleHandoff(args.slice(1)); break;
            case "orch:status": await handleStatus(); break;
            case "orch:tower": await handleTower(); break;
            case "orch:timeline": await handleTimeline(args.slice(1)); break;

            case "portal:test": await handlePortal("test", args.slice(1)); break;

            case "qc:review": await handleQC("review", args.slice(1)); break;
            case "qc:approve": await handleQC("approve", args.slice(1)); break;
            case "qc:reject": await handleQC("reject", args.slice(1)); break;
            case "qc:escalate": await handleQC("escalate", args.slice(1)); break;
            case "qc:status": await handleQC("status", args.slice(1)); break;

            case "acc:journal": await handleAcc("journal", args.slice(1)); break;
            case "tax:vat": await handleTax("vat", args.slice(1)); break;

            case "audit:create": await handleAudit("create", args.slice(1)); break;
            case "audit:evidence": await handleAudit("evidence", args.slice(1)); break;

            case "adv:model": await handleAdv("model", args.slice(1)); break;

            case "risk:register": await handleRisk("register", args.slice(1)); break;
            case "risk:assess": await handleRisk("assess", args.slice(1)); break;

            case "csp:minutes": await handleCSP("minutes", args.slice(1)); break;
            case "notary:certify": await handleNotary("certify", args.slice(1)); break;

            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

// ... (Existing handlers for Route, Handoff, QC, Tower) ...

async function handleAcc(action: string, args: string[]) {
    if (action === "journal") {
        const [entityId, desc, amount] = args;
        if (!entityId || !desc || !amount) {
            console.error("Usage: firmos acc:journal <entity_id> <description> <amount>");
            return;
        }
        console.log(`Posting journal for ${entityId}...`);
        const result = await postJournalEntry({
            entityId,
            date: new Date().toISOString(),
            description: desc,
            status: "draft",
            lines: [{ accountId: "acc-1", debit: parseFloat(amount) }, { accountId: "acc-2", credit: parseFloat(amount) }]
        });
        console.log(result.success ? `Journal ${result.id} posted.` : `Error: ${result.error}`);
    } else if (action === "reconcile") {
        const [accountId] = args;
        if (!accountId) {
            console.error("Usage: firmos acc:reconcile <account_id>");
            return;
        }
        console.log(`Reconciling account ${accountId}...`);
        // Mock bank balance for CLI demo
        const result = await reconcileAccount(accountId, new Date().toISOString(), 1000);
        console.log(`Reconciliation ${result.id}: ${result.status.toUpperCase()} (Diff: ${result.difference})`);
    } else if (action === "close") {
        const [entityId, period] = args;
        if (!entityId || !period) {
            console.error("Usage: firmos acc:close <entity_id> <period>");
            return;
        }
        // Ideally export executePeriodClose from accounting.ts
        const { executePeriodClose } = await import("../src/firmos/engines/accounting.js");
        const result = await executePeriodClose(entityId, period);
        console.log(result.success ? `Period ${period} closed for ${entityId}.` : `Close failed: ${result.issues.join(", ")}`);
    }
}

async function handleTax(action: string, args: string[]) {
    if (action === "vat") {
        const [entityId, period, jurisdiction] = args;
        if (!entityId || !period || !jurisdiction) {
            console.error("Usage: firmos tax:vat <entity_id> <period> <MT|RW>");
            return;
        }
        console.log("Preparing VAT return...");
        const result = await prepareVATReturn(entityId, period, jurisdiction as "MT" | "RW");
        console.log(`VAT Return ${result.id} prepared (Liability: ${result.liability})`);
    } else if (action === "compute") {
        const [entityId, year] = args;
        if (!entityId || !year) {
            console.error("Usage: firmos tax:compute <entity_id> <year>");
            return;
        }
        console.log(`Computing tax liability for ${entityId} (${year})...`);
        const result = await computeTaxLiability(entityId, parseInt(year), "MT");
        console.log(`Estimated Liability: ${result.amount} ${result.currency}`);
    }
}

async function handleAudit(action: string, args: string[]) {
    if (action === "create") {
        const [clientEntityId, yearEnding] = args;
        if (!clientEntityId || !yearEnding) {
            console.error("Usage: firmos audit:create <client_entity_id> <year_ending>");
            return;
        }
        console.log(`Creating audit engagement for ${clientEntityId}...`);
        const result = await createAuditEngagement({
            clientEntityId,
            yearEnding,
            auditStandard: "ISA",
            partnerInCharge: "Patrick",
            managerInCharge: "Mgr1",
            materiality: 50000
        });
        console.log(result.success ? `Engagement ${result.engagement?.id} created.` : `Error: ${result.error}`);
    } else if (action === "evidence") {
        const [engagementId, desc, type] = args;
        if (!engagementId || !desc || !type) {
            console.error("Usage: firmos audit:evidence <engagement_id> <description> <type>");
            return;
        }
        await recordEvidence(engagementId, desc, type as any, "cli-user");
        console.log("Evidence recorded.");
    }
}

async function handleAdv(action: string, args: string[]) {
    if (action === "model") {
        const [entityId, type] = args;
        if (!entityId || !type) {
            console.error("Usage: firmos adv:model <entity_id> <type>");
            return;
        }
        console.log(`Building ${type} model...`);
        const result = await buildFinancialModel(entityId, type as any);
        console.log(result.success ? `Model ${result.model?.id} created.` : "Failed.");
    }
}

async function handleRisk(action: string, args: string[]) {
    if (action === "register") {
        const [entityId, scope] = args;
        if (!entityId || !scope) {
            console.error("Usage: firmos risk:register <entity_id> <scope>");
            return;
        }
        console.log(`Creating risk register...`);
        const result = await createRiskRegister(entityId, scope);
        console.log(result.success ? `Risk Register ${result.register?.id} created.` : "Failed.");
    } else if (action === "assess") {
        const [desc, impact, likelihood] = args;
        if (!desc || !impact || !likelihood) {
            console.error("Usage: firmos risk:assess <description> <impact> <likelihood>");
            return;
        }
        const result = await assessRisk({
            category: "operational",
            description: desc,
            impact: parseInt(impact) as any,
            likelihood: parseInt(likelihood) as any,
            mitigationStrategy: "Monitor"
        });
        console.log(`Risk Assessed: Score ${result.inherentRiskScore} (Residual: ${result.residualRiskScore})`);
    }
}

async function handleCSP(action: string, args: string[]) {
    if (action === "minutes") {
        const [entityId, date] = args;
        if (!entityId || !date) {
            console.error("Usage: firmos csp:minutes <entity_id> <date>");
            return;
        }
        await prepareBoardMinutes(entityId, date, ["Approval of Accounts", "Dividend Declaration"]);
    }
}

async function handleNotary(action: string, args: string[]) {
    if (action === "certify") {
        const [docRef] = args;
        if (!docRef) {
            console.error("Usage: firmos notary:certify <doc_ref>");
            return;
        }
        await certifyDocument(docRef, 3);
    }
}

// Re-add helper functions that were replaced
async function handleRoute(args: string[]) {
    const request = args.join(" ");
    if (!request) {
        console.error("Usage: firmos orch:route <request text>");
        return;
    }

    console.log(`Analyzing request: "${request}"...`);
    const decision = routeRequest({ request });

    console.log("\nRouting Decision:");
    console.log(`  Primary Agent: ${decision.primaryAgent}`);
    if (decision.backupAgent) {
        console.log(`  Backup Agent:  ${decision.backupAgent}`);
    }
    console.log(`  Confidence:    ${(decision.confidence * 100).toFixed(1)}%`);
    console.log(`  Reasoning:     ${decision.reasoning}`);
    if (decision.suggestedTaskType) {
        console.log(`  Suggested Task: ${decision.suggestedTaskType}`);
    }
}

async function handleHandoff(args: string[]) {
    const [subcmd, ...rest] = args;

    if (subcmd === "create") {
        const [from, to, ...reasonParts] = rest;
        const reason = reasonParts.join(" ");

        if (!from || !to || !reason) {
            console.error("Usage: firmos orch:handoff create <from_agent> <to_agent> <reason>");
            return;
        }

        console.log(`Creating handoff from ${from} to ${to}...`);
        const result = await createHandoff({
            fromAgent: from,
            toAgent: to,
            reason,
        });

        if (result.success) {
            console.log(`Handoff created! ID: ${result.handoff?.id}`);
        } else {
            console.error(`Failed to create handoff: ${result.error}`);
        }
    } else if (subcmd === "list") {
        const agent = rest[0];
        if (!agent) {
            console.error("Usage: firmos orch:handoff list <agent_id>");
            return;
        }

        const handoffs = await getPendingHandoffsForAgent(agent);
        console.log(`\nPending Handoffs for ${agent}:`);
        if (handoffs.length === 0) {
            console.log("  (No pending handoffs)");
        } else {
            handoffs.forEach(h => {
                console.log(`  [${h.id}] From: ${h.from_agent} | Reason: ${h.reason} | Created: ${h.created_at}`);
            });
        }
    } else if (subcmd === "accept") {
        const [id, agent] = rest;
        if (!id || !agent) {
            console.error("Usage: firmos orch:handoff accept <handoff_id> <agent_id>");
            return;
        }

        const result = await acceptHandoff(id, agent);
        if (result.success) {
            console.log(`Handoff ${id} accepted by ${agent}.`);
        } else {
            console.error(`Failed to accept handoff: ${result.error}`);
        }
    } else {
        console.error("Unknown handoff subcommand. Use: create, list, accept");
    }
}

async function handleStatus() {
    console.log("Fetching active workstreams...");
    const workstreams = await listWorkstreams({ status: "in_progress", limit: 10 });

    console.log("\nActive Workstreams:");
    if (workstreams.length === 0) {
        console.log("  (No active workstreams)");
    } else {
        workstreams.forEach(w => {
            console.log(`  [${w.id}] ${w.title} (${w.assigned_agent}) - ${w.status}`);
        });
    }

    console.log("\nUpcoming Deadlines (next 7 days):");
    const deadlines = await listUpcomingDeadlines({ daysAhead: 7 });
    if (deadlines.length === 0) {
        console.log("  (No upcoming deadlines)");
    } else {
        deadlines.forEach(d => {
            console.log(`  [${d.due_date}] ${d.title} (${d.assigned_agent})`);
        });
    }
}



async function handleTower() {
    const stats = await getTowerStats();
    console.log("\nFirmOS Control Tower Stats:");
    console.log("===========================");
    console.log(`Active Entities:    ${stats.activeEntities}`);
    console.log(`Active Workstreams: ${stats.activeWorkstreams}`);
    console.log(`Pending QC Reviews: ${stats.pendingQC}`);
    console.log(`Open Incidents:     ${stats.openIncidents}`);
    console.log(`Upcoming Deadlines: ${stats.upcomingDeadlines}`);
    console.log("\nAgent Utilization:");
    Object.entries(stats.agentUtilization).forEach(([agent, count]) => {
        console.log(`  ${agent}: ${count}`);
    });
}

async function handleTimeline(args: string[]) {
    const [daysStr] = args;
    const days = parseInt(daysStr || "14", 10);

    console.log(`Generating timeline for next ${days} days...`);

    const { deadlines, alerts } = await checkAndAlertDeadlines(days);

    console.log("\nRegulatory Deadline Timeline:");
    if (deadlines.length === 0) {
        console.log("  (No deadlines found)");
    } else {
        deadlines.forEach(d => {
            console.log(`  [${d.due_date}] ${d.title} (${d.assigned_agent}) - ${d.jurisdiction}`);
        });
    }

    if (alerts.length > 0) {
        console.log("\n!!! ALERTS GENERATED !!!");
        alerts.forEach(a => {
            console.log(`  [${a.severity.toUpperCase()}] ${a.message} => Sent to ${a.recipientAgent}`);
        });
    }
}

async function handlePortal(action: string, args: string[]) {
    if (action === "test") {
        const [portalName] = args;

        let portal;
        switch (portalName?.toLowerCase()) {
            case "mbr": portal = new MBRPortal({ username: "test" }); break;
            case "cfr": portal = new CFRPortal({ username: "test" }); break;
            case "rdb": portal = new RDBPortal({ username: "test" }); break;
            case "rra": portal = new RRAPortal({ username: "test" }); break;
            default:
                console.error("Usage: firmos portal:test <mbr|cfr|rdb|rra>");
                return;
        }

        console.log(`[CLI] Testing ${portalName.toUpperCase()} integration...`);
        const login = await portal.login();
        console.log(` Login: ${login.success ? "OK" : "FAILED"}`);

        const health = await portal.healthCheck();
        console.log(` Health: ${health ? "OK" : "DOWN"}`);

        await portal.logout();
        console.log(" Logout: OK");
    }
}

async function handleQC(action: string, args: string[]) {
    if (action === "status") {
        // List pending QC
        const reviews = await listPendingQCReviews();
        console.log("\nPending QC Reviews:");
        if (reviews.length === 0) {
            console.log("  (No pending reviews)");
        } else {
            reviews.forEach(r => {
                const title = (r as any).workstreams?.title || "Unknown Task";
                const agent = (r as any).workstreams?.assigned_agent || "Unknown Agent";
                console.log(`  [${r.id}] ${title} (${agent}) - ${r.status}`);
            });
        }
        return;
    }

    if (action === "review") {
        const [workstreamId] = args;
        if (!workstreamId) {
            console.error("Usage: firmos qc:review <workstream_id>");
            return;
        }
        console.log(`Submitting workstream ${workstreamId} for QC...`);
        const result = await submitForQC(workstreamId, "cli-user");
        if (result.success) {
            console.log(`QC Review created! ID: ${result.review?.id}`);
        } else {
            console.error(`Failed to submit: ${result.error}`);
        }
        return;
    }

    // Handle actions: approve (pass), reject (revise), escalate
    const [reviewId, ...notesParts] = args;
    const comments = notesParts.join(" ");

    if (!reviewId) {
        console.error(`Usage: firmos qc:${action} <review_id> [comments]`);
        return;
    }

    let mappedAction: "pass" | "revise" | "escalate";
    switch (action) {
        case "approve": mappedAction = "pass"; break;
        case "reject": mappedAction = "revise"; break;
        case "escalate": mappedAction = "escalate"; break;
        default: return;
    }

    console.log(`Transitioning review ${reviewId} to ${mappedAction}...`);
    const result = await transitionQC(reviewId, mappedAction, "firmos-qc", comments || "Action via CLI");

    if (result.success) {
        console.log(`QC Review updated: ${result.review?.status}`);
    } else {
        console.error(`Failed to update review: ${result.error}`);
    }
}

main();
