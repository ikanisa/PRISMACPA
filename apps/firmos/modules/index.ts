/**
 * FirmOS Modules
 *
 * Barrel export for all FirmOS runtime modules.
 * Import from `@firmos/modules` or specific submodules.
 */

// Audit & Incident Logging
export * as auditLog from './audit_log/index.js';

// Case/Engagement Management
export * as caseMgmt from './case_mgmt/index.js';

// Evidence Collection & Validation
export * as evidence from './evidence/index.js';

// QC Gates (Diane Guardian)
export * as qcGates from './qc_gates/index.js';

// Release Gates (Marco Governor)
export * as releaseGates from './release_gates/index.js';

// Agent Routing & Service Dispatch
export * as routing from './routing/index.js';

// Template Factory
export * as templateFactory from './template_factory/index.js';
