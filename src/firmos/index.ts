/**
 * FirmOS Backend Module
 *
 * Main entry point for FirmOS backend logic.
 * Exports all engines and utilities.
 */

// Database client and types
export * as db from "./db.js";

// Routing engine
export * from "./routing-engine.js";

// Handoff manager
export * from "./handoff-manager.js";

// QC workflow
export * from "./qc-workflow.js";

// Specialist Engines
export * from "./engines/accounting.js";
export * from "./engines/tax.js";
export * from "./engines/audit.js";
export * from "./engines/advisory.js";
export * from "./engines/risk.js";
export * from "./engines/csp.js";
export * from "./engines/notary.js";

// Deadline Engine
export * from "./deadline-engine.js";

// Portal Stubs
export * from "./portals/base.js";
export * from "./portals/mbr.js";
export * from "./portals/cfr.js";
export * from "./portals/rdb.js";
export * from "./portals/rra.js";
