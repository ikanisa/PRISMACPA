/**
 * FirmOS Core — Barrel Export
 * 
 * Re-exports all core type definitions for easy consumption.
 */

// Proficiency scale
export {
    type ProficiencyLevel,
    type Skill,
    PROFICIENCY_SCALE,
    type ProficiencyScale,
    getProficiency,
    proficiencyAtLeast
} from './proficiency.js';

// Evidence taxonomy
export {
    EVIDENCE_TAXONOMY,
    type EvidenceType,
    type EvidenceTaxonomy,
    EVIDENCE_TYPES,
    getEvidenceDefinition,
    evidenceSatisfiesMinimum
} from './evidence-taxonomy.js';

// Resource library
export {
    type ResourceScope,
    type Resource,
    GLOBAL_STANDARDS,
    MALTA_RESOURCES,
    RWANDA_RESOURCES,
    RESOURCE_LIBRARY,
    getResourcesByScope,
    getResource,
    getResourceIdsForScopes
} from './resource-library.js';

// Tool access model
export {
    TOOL_GROUPS,
    type ToolGroupId,
    type ToolGroups,
    type ToolName,
    getToolsForGroups,
    isToolInGroup,
    isReleaseGatedTool,
    getToolGroup,
    AGENT_TOOL_ACCESS,
    canAgentAccessTool
} from './tool-access-model.js';

// Validation rules
export {
    type ValidationRuleId,
    type ValidationRule,
    VALIDATION_RULES,
    type PackSeparationContext,
    type EvidenceMinimumContext,
    type GuardianPassContext,
    type ReleaseGateContext,
    type ValidationResult,
    type ValidationReport,
    validatePackSeparation,
    validateEvidenceMinimum,
    validateGuardianPass,
    validateReleaseGate,
    runAllValidations
} from './validation-rules.js';

// Template QC (Diane checks)
export {
    type Template as TemplateForQC,
    type CheckStatus,
    type CheckResult,
    type TemplateQCResult,
    runTemplateQC,
    getQCSummary
} from './template-qc.js';

// FirmOS Configuration (loads from firmos/ directory)
export * from './firmos-config.js';
