
/**
 * Template Factory Module
 * 
 * Re-exports template factory from @firmos/programs.
 * Integrates with FirmOS config for jurisdiction-aware templates.
 * In v2027+, implementations will live here directly.
 */

import { getSupabaseClient } from '../lib/db.js';
import { logAction } from '../audit_log/index.js';
import { executeQCGate } from '../qc_gates/index.js';

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
    metadata?: Record<string, unknown>;
}

export interface TemplateSearchParamsSimple {
    pack?: TemplateSimple["pack"];
    status?: TemplateStatusSimple;
    query?: string;
    limit?: number;
}

/**
 * Get available jurisdiction packs for templates (from config)
 */
export function getAvailablePacks(): string[] {
    return getEnabledJurisdictions().map(j => j.code.toLowerCase());
}

/**
 * Search Templates (Persisted)
 */
export async function searchTemplatesSimple(params: TemplateSearchParamsSimple): Promise<TemplateSimple[]> {
    const supabase = getSupabaseClient();

    let builder = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (params.pack) builder = builder.eq('pack', params.pack);
    if (params.status) builder = builder.eq('status', params.status);
    if (params.query) builder = builder.ilike('name', `%${params.query}%`);
    if (params.limit) builder = builder.limit(params.limit);

    const { data, error } = await builder;

    if (error) {
        throw new Error(`Failed to search templates: ${error.message}`);
    }

    return (data || []).map(mapDbToTemplate);
}

/**
 * Create Template Draft (Persisted)
 */
export async function createDraft(
    template: Omit<TemplateSimple, "id" | "status" | "createdAt" | "version">
): Promise<TemplateSimple> {
    const supabase = getSupabaseClient();

    const dbEntry = {
        name: template.name,
        pack: template.pack,
        version: '1.0.0', // Initial version
        status: 'draft',
        created_by: template.createdBy,
        content: template.content,
        metadata: template.metadata || {}
    };

    const { data, error } = await supabase
        .from('templates')
        .insert(dbEntry)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create template draft: ${error.message}`);
    }

    const created = mapDbToTemplate(data);

    await logAction({
        action: 'template_created',
        actor: template.createdBy,
        resourceType: 'template',
        resourceId: created.id,
        details: { name: template.name, pack: template.pack }
    });

    return created;
}

/**
 * Submit Template for QC (State Transition)
 */
export async function submitForQC(templateId: string, actor: string): Promise<TemplateSimple> {
    const supabase = getSupabaseClient();

    // Verify current status is draft
    const current = await getTemplateById(templateId);
    if (!current || current.status !== 'draft') {
        throw new Error("Cannot submit for QC: Template is not in draft status.");
    }

    // Execute QC Gate
    const qcResult = await executeQCGate({
        workpaperId: templateId,
        serviceType: 'template',
        agentId: actor,
        submittedBy: actor
    });

    const newStatus: TemplateStatusSimple = qcResult.outcome === 'PASS' ? 'approved' : 'pending_qc';

    const { data, error } = await supabase
        .from('templates')
        .update({ status: newStatus })
        .eq('id', templateId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to submit for QC: ${error.message}`);
    }

    const updated = mapDbToTemplate(data);

    await logAction({
        action: 'qc_submitted',
        actor,
        resourceType: 'template',
        resourceId: templateId,
        details: { outcome: qcResult.outcome }
    });

    return updated;
}

/**
 * Publish Template (State Transition)
 */
export async function publishTemplateSimple(templateId: string, actor: string): Promise<TemplateSimple> {
    const supabase = getSupabaseClient();

    // Verify current status is approved
    const current = await getTemplateById(templateId);
    if (!current || current.status !== 'approved') {
        throw new Error("Cannot publish: Template has not been approved.");
    }

    const { data, error } = await supabase
        .from('templates')
        .update({ status: 'published' })
        .eq('id', templateId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to publish template: ${error.message}`);
    }

    const published = mapDbToTemplate(data);

    await logAction({
        action: 'template_published',
        actor,
        resourceType: 'template',
        resourceId: templateId,
        details: {}
    });

    return published;
}

/**
 * Log Template Usage (Audit)
 */
export async function logTemplateUsage(templateId: string, context: string, actor: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('template_usage')
        .insert({
            template_id: templateId,
            context,
            used_by: actor
        });

    if (error) {
        throw new Error(`Failed to log template usage: ${error.message}`);
    }
}

// Helpers

async function getTemplateById(id: string): Promise<TemplateSimple | null> {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('templates').select('*').eq('id', id).single();
    return data ? mapDbToTemplate(data) : null;
}

function mapDbToTemplate(row: any): TemplateSimple {
    return {
        id: row.id,
        name: row.name,
        pack: row.pack,
        version: row.version,
        status: row.status,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        content: row.content,
        metadata: row.metadata || {}
    };
}
