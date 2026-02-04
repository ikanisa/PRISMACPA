/**
 * FirmOS Deadline Engine
 *
 * Handles regulatory deadline tracking, alerting, and timeline management.
 */

import { createSessionsSendTool } from "../../src/agents/tools/sessions-send-tool.js";
import { listUpcomingDeadlines, getSupabaseClient } from "./db.js";

// =============================================================================
// TYPES
// =============================================================================

export interface DeadlineAlert {
  id: string;
  deadlineId: string;
  recipientAgent: string;
  message: string;
  sentAt: string;
  severity: "info" | "warning" | "critical";
}

// =============================================================================
// DEADLINE OPERATIONS
// =============================================================================

/**
 * Check for upcoming deadlines and generate alerts
 */
export async function checkAndAlertDeadlines(daysAhead: number = 7): Promise<{
  deadlines: any[];
  alerts: DeadlineAlert[];
}> {
  console.log(`[DeadlineEngine] Checking for deadlines falling within next ${daysAhead} days...`);

  // 1. Fetch deadlines
  const deadlines = await listUpcomingDeadlines({ daysAhead });

  if (deadlines.length === 0) {
    console.log("[DeadlineEngine] No upcoming deadlines found.");
    return { deadlines: [], alerts: [] };
  }

  // 2. Generate alerts
  const alerts: DeadlineAlert[] = deadlines.map((d) => {
    const daysRemaining = Math.ceil(
      (new Date(d.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    let severity: DeadlineAlert["severity"] = "info";
    if (daysRemaining <= 1) severity = "critical";
    else if (daysRemaining <= 3) severity = "warning";

    return {
      id: `alert-${Date.now()}-${d.id}`,
      deadlineId: d.id,
      recipientAgent: d.assigned_agent || "firmos-orchestrator",
      message: `DEADLINE ALERT: "${d.title}" is due in ${daysRemaining} days (Severity: ${severity.toUpperCase()})`,
      sentAt: new Date().toISOString(),
      severity,
    };
  });

  // 3. "Send" alerts via sessions_send tool
  console.log(`[DeadlineEngine] Generated ${alerts.length} alerts.`);

  // Instantiate the tool (no strict session context needed for system alerts)
  const senderTool = createSessionsSendTool({ sandboxed: false });

  for (const alert of alerts) {
    console.log(`  -> [${alert.recipientAgent}] Sending: ${alert.message}`);

    try {
      // Use the tool to send the message
      // We use 'agentId' to let the tool resolve the target session
      await senderTool.execute(`alert-${alert.id}`, {
        agentId: alert.recipientAgent,
        message: alert.message,
        timeoutSeconds: 5,
      });
    } catch (err) {
      console.error(`     [Error] Failed to send alert to ${alert.recipientAgent}:`, err);
    }
  }

  return { deadlines, alerts };
}

/**
 * Execute the daily deadline cron job logic
 */
export async function runDailyDeadlineCheck(): Promise<boolean> {
  try {
    console.log("=== STARTING DAILY DEADLINE CHECK ===");
    const { alerts } = await checkAndAlertDeadlines(14); // Check 2 weeks ahead

    // Log simplified report
    const critical = alerts.filter((a) => a.severity === "critical").length;
    const warning = alerts.filter((a) => a.severity === "warning").length;

    console.log(`=== DEADLINE CHECK COMPLETE: ${critical} Critical, ${warning} Warnings ===`);
    return true;
  } catch (error) {
    console.error("Failed to run daily deadline check:", error);
    return false;
  }
}
