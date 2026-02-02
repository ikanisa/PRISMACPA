/**
 * Template Factory Module
 * 
 * Re-exports template factory from @firmos/programs.
 * Integrates with FirmOS config for jurisdiction-aware templates.
 * In v2027+, implementations will live here directly.
 */

// Re-export main types
export {
    type EvidenceType,
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
    TEMPLATE_FACTORY_AGENT_RULES
} from "@firmos/programs/template-factory.js";

// Config integration
import { getEnabledJurisdictions } from "@firmos/core";

// Re-export functions
export {
    searchTemplates,
    PackMismatchError,
    checkPackEnforcement,
    generateTemplateId,
    generateInstanceId,
    createTemplateDraft,
    canPublish,
    publishTemplate,
    instantiateTemplate,
    logDeviation
} from "@firmos/programs/template-factory.js";

// Module-specific simplified types (future API)
export type TemplateStatusSimple = "draft" | "pending_qc" | "approved" | "published" | "deprecated";

export interface TemplateSimple {
    id: string;
    name: string;
    pack: "malta" | "rwanda" | "global";
    version: string;
    status: TemplateStatusSimple;
    createdBy: string;
    createdAt: Date;
    content: string;
}

export interface TemplateSearchParamsSimple {
    pack?: TemplateSimple["pack"];
    status?: TemplateStatusSimple;
    query?: string;
}

// Future API stubs
export async function searchTemplatesSimple(_params: TemplateSearchParamsSimple): Promise<TemplateSimple[]> {
    throw new Error("Not implemented - use searchTemplates() from @firmos/programs for now");
}

export async function createDraft(
    _template: Omit<TemplateSimple, "id" | "status" | "createdAt" | "version">
): Promise<TemplateSimple> {
    throw new Error("Not implemented - use createTemplateDraft() from @firmos/programs for now");
}

export async function submitForQC(_templateId: string): Promise<void> {
    throw new Error("Not implemented - pending extraction");
}

export async function publishTemplateSimple(_templateId: string): Promise<TemplateSimple> {
    throw new Error("Not implemented - use publishTemplate() from @firmos/programs for now");
}

export async function logTemplateUsage(_templateId: string, _context: string): Promise<void> {
    throw new Error("Not implemented - pending extraction");
}

/**
 * Get available jurisdiction packs for templates (from config)
 */
export function getAvailablePacks(): string[] {
    return getEnabledJurisdictions().map(j => j.code.toLowerCase());
}
