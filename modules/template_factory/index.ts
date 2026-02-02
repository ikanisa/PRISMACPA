/**
 * Template Factory Module
 * 
 * Pack-scoped template management with versioning and QC integration.
 * Will be extracted from packages/firmos-programs/template-factory.ts
 */

// Types
export type TemplateStatus = "draft" | "pending_qc" | "approved" | "published" | "deprecated";

export interface Template {
    id: string;
    name: string;
    pack: "malta" | "rwanda" | "global";
    version: string;
    status: TemplateStatus;
    createdBy: string;
    createdAt: Date;
    content: string;
}

export interface TemplateSearchParams {
    pack?: Template["pack"];
    status?: TemplateStatus;
    query?: string;
}

// Public API (stubs for now)
export async function searchTemplates(_params: TemplateSearchParams): Promise<Template[]> {
    throw new Error("Not implemented - pending extraction from firmos-programs");
}

export async function createDraft(
    _template: Omit<Template, "id" | "status" | "createdAt" | "version">
): Promise<Template> {
    throw new Error("Not implemented - pending extraction");
}

export async function submitForQC(_templateId: string): Promise<void> {
    throw new Error("Not implemented - pending extraction");
}

export async function publishTemplate(_templateId: string): Promise<Template> {
    throw new Error("Not implemented - pending extraction");
}

export async function logTemplateUsage(_templateId: string, _context: string): Promise<void> {
    throw new Error("Not implemented - pending extraction");
}
