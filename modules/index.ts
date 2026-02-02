/**
 * @firmos/modules
 * 
 * Runtime modules for FirmOS - extracted from firmos-programs
 * for better separation of concerns.
 * 
 * Note: Use explicit imports from submodules to avoid naming conflicts.
 */

// Routing - task routing and service selection
export * from "./routing/index.js";

// Evidence - evidence collection and scoring
// Uses local EvidenceType definition (simple types)
export * from "./evidence/index.js";

// QC Gates - Diane's quality control gate execution
export * from "./qc_gates/index.js";

// Release Gates - Marco's release authorization
export * from "./release_gates/index.js";

// Template Factory - agent-generated templates
// NOTE: Has its own EvidenceType from @firmos/programs (detailed taxonomy)
// Import from template_factory submodule directly to avoid conflicts with evidence module
export {
    // Re-export template factory types (except EvidenceType to avoid conflict)
    type JurisdictionPack,
    type TemplateStatus,
    type TemplateInstanceStatus,
    type RiskClassification,
    type AgentId,
    type TemplatePlaceholder,
    type ChangeLogEntry,
    type DeviationNote,
    type TemplateApproval,
    type Template,
    type TemplateInstance,
    type TemplateSearchParams,
    type TemplateSearchResult,
    RISK_CLASSIFICATION,
    TEMPLATE_TRIGGERS,
    TEMPLATE_FACTORY_AGENT_RULES,
    searchTemplates,
    PackMismatchError,
    checkPackEnforcement,
    generateTemplateId,
    generateInstanceId,
    createTemplateDraft,
    canPublish,
    publishTemplate,
    instantiateTemplate,
    logDeviation,
    // Future API
    type TemplateStatusSimple,
    type TemplateSimple,
    type TemplateSearchParamsSimple,
    searchTemplatesSimple,
    createDraft,
    submitForQC,
    publishTemplateSimple,
    logTemplateUsage
} from "./template_factory/index.js";

// Audit Log - immutable operation tracking
export * from "./audit_log/index.js";

// Case Management - client case lifecycle
export * from "./case_mgmt/index.js";

// Config Loader - runtime YAML config loading and validation
export * from "./config/index.js";
