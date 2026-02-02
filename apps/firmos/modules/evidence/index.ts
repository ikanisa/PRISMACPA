/**
 * FirmOS Evidence Module
 *
 * Provides evidence collection, linking, and validation.
 */

export type EvidenceType =
    | 'CLIENT_INSTRUCTION'
    | 'FINANCIAL_RECORDS'
    | 'SOURCE_DOCUMENTS'
    | 'WORKPAPER_TRAIL'
    | 'LEGAL_SOURCES'
    | 'EXTERNAL_DATA'
    | 'COMPUTATION'
    | 'CORRESPONDENCE';

export interface EvidenceItem {
    id: string;
    type: EvidenceType;
    label: string;
    hash: string;
    created_at: Date;
    created_by: string;
    pack_id: string;
    source_url?: string;
    metadata?: Record<string, unknown>;
}

export interface EvidenceLink {
    evidence_id: string;
    target_type: 'task' | 'output' | 'document';
    target_id: string;
    linked_at: Date;
    linked_by: string;
}

export interface EvidenceMap {
    task_id: string;
    required: EvidenceType[];
    linked: EvidenceItem[];
    completeness: number;
}

/**
 * Calculate evidence completeness for a task
 */
export function calculateCompleteness(required: EvidenceType[], linked: EvidenceItem[]): number {
    if (required.length === 0) {
        return 1.0;
    }

    const linkedTypes = new Set(linked.map((e) => e.type));
    const presentCount = required.filter((t) => linkedTypes.has(t)).length;

    return presentCount / required.length;
}

/**
 * Validate evidence hash integrity
 */
export function validateHash(item: EvidenceItem, expectedHash: string): boolean {
    return item.hash === expectedHash;
}

/**
 * Check if evidence pack matches jurisdiction
 */
export function validatePackMatch(item: EvidenceItem, expectedPack: string): boolean {
    // GLOBAL pack can be used anywhere
    if (item.pack_id === 'GLOBAL') {
        return true;
    }

    // Malta packs only for Malta
    if (expectedPack.startsWith('MT_') && item.pack_id.startsWith('MT_')) {
        return true;
    }

    // Rwanda packs only for Rwanda
    if (expectedPack.startsWith('RW_') && item.pack_id.startsWith('RW_')) {
        return true;
    }

    // Exact match
    return item.pack_id === expectedPack;
}
