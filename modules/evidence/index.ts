/**
 * Evidence Module
 * 
 * Handles evidence collection, linking, and scoring.
 * Will be extracted from packages/firmos-core/src/evidence-taxonomy.ts
 */

// Types
export type EvidenceType =
    | "source_document"
    | "confirmation"
    | "analytical_procedure"
    | "calculation_workpaper"
    | "regulatory_form"
    | "reconciliation"
    | "analysis_memo"
    | "supporting_data";

export interface EvidenceItem {
    id: string;
    type: EvidenceType;
    filename: string;
    uploadedAt: Date;
    uploadedBy: string;
    linkedWorkpaper?: string;
    score?: number;
}

export interface EvidenceRequirements {
    serviceType: string;
    requiredTypes: EvidenceType[];
    minItems: number;
    retentionYears: number;
}

// Public API (stubs for now)
export async function attachEvidence(
    _workpaperId: string,
    _evidence: Omit<EvidenceItem, "id" | "uploadedAt">
): Promise<EvidenceItem> {
    throw new Error("Not implemented - pending extraction");
}

export function scoreEvidence(_items: EvidenceItem[]): number {
    throw new Error("Not implemented - pending extraction");
}

export function validateEvidenceSufficiency(
    _items: EvidenceItem[],
    _requirements: EvidenceRequirements
): { sufficient: boolean; missing: EvidenceType[] } {
    throw new Error("Not implemented - pending extraction");
}
