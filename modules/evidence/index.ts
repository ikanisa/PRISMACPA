
/**
 * Evidence Module
 * 
 * Handles evidence collection, linking, and scoring.
 */

import { getSupabaseClient } from '../lib/db.js';
import { logAction } from '../audit_log/index.js';

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
    storagePath: string;
    uploadedAt: Date;
    uploadedBy: string;
    workpaperId?: string;
    score?: number;
    metadata: Record<string, unknown>;
}

export interface EvidenceRequirements {
    serviceType: string;
    requiredTypes: EvidenceType[];
    minItems: number;
    retentionYears: number;
}

export interface EvidenceUploadOps {
    workpaperId?: string;
    type: EvidenceType;
    filename: string;
    fileContent: ArrayBuffer | Buffer; // Logic to handle upload
    metadata?: Record<string, unknown>;
}

/**
 * Attach evidence to a workpaper (Upload + DB Record)
 */
export async function attachEvidence(
    ops: EvidenceUploadOps,
    actor: string
): Promise<EvidenceItem> {
    const supabase = getSupabaseClient();

    // 1. Upload to Storage
    const path = `${ops.workpaperId || 'unassigned'}/${Date.now()}_${ops.filename}`;
    const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(path, ops.fileContent, {
            contentType: 'application/octet-stream',
            upsert: false
        });

    if (uploadError) {
        throw new Error(`Failed to upload evidence: ${uploadError.message}`);
    }

    // 2. Insert Record
    const dbEntry = {
        workpaper_id: ops.workpaperId || null,
        type: ops.type,
        filename: ops.filename,
        storage_path: path,
        uploaded_by: actor,
        score: calculateBaseScore(ops.type),
        metadata: ops.metadata || {}
    };

    const { data, error } = await supabase
        .from('evidence')
        .insert(dbEntry)
        .select()
        .single();

    if (error) {
        // Rollback upload if DB insert fails (optional but good practice)
        await supabase.storage.from('evidence').remove([path]);
        throw new Error(`Failed to record evidence metadata: ${error.message}`);
    }

    const item = mapDbToEvidence(data);

    // 3. Audit Log
    await logAction({
        action: 'evidence_attached',
        actor: actor,
        resourceType: 'evidence',
        resourceId: item.id,
        details: {
            filename: ops.filename,
            type: ops.type,
            workpaperId: ops.workpaperId
        }
    });

    return item;
}

/**
 * List evidence for workpaper
 */
export async function listEvidence(workpaperId: string): Promise<EvidenceItem[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .eq('workpaper_id', workpaperId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to list evidence: ${error.message}`);
    }

    return (data || []).map(mapDbToEvidence);
}

/**
 * Validate evidence sufficiency against requirements
 */
export function validateEvidenceSufficiency(
    items: EvidenceItem[],
    requirements: EvidenceRequirements
): { sufficient: boolean; missing: EvidenceType[]; score: number } {
    const presentTypes = new Set(items.map(i => i.type));
    const missing = requirements.requiredTypes.filter(t => !presentTypes.has(t));

    const countSufficient = items.length >= requirements.minItems;
    const typesSufficient = missing.length === 0;

    // Calculate aggregated score (0-100)
    // 50% based on types presence, 50% based on item count
    const typeScore = ((requirements.requiredTypes.length - missing.length) / (requirements.requiredTypes.length || 1)) * 50;
    const countScore = Math.min((items.length / (requirements.minItems || 1)), 1) * 50;

    return {
        sufficient: countSufficient && typesSufficient,
        missing,
        score: Math.round(typeScore + countScore)
    };
}

/**
 * Score a set of evidence items (Aggregate quality)
 */
export function scoreEvidence(items: EvidenceItem[]): number {
    if (items.length === 0) return 0;

    const total = items.reduce((acc, item) => acc + (item.score || 0), 0);
    return Math.round(total / items.length);
}


// Internal Helpers

function calculateBaseScore(type: EvidenceType): number {
    // Arbitrary quality baseline based on evidentiary weight
    switch (type) {
        case 'regulatory_form': return 100;
        case 'confirmation': return 90;
        case 'source_document': return 85;
        case 'reconciliation': return 80;
        case 'calculation_workpaper': return 75;
        case 'analysis_memo': return 70;
        case 'analytical_procedure': return 60;
        case 'supporting_data': return 40;
        default: return 50;
    }
}

function mapDbToEvidence(row: any): EvidenceItem {
    return {
        id: row.id,
        type: row.type,
        filename: row.filename,
        storagePath: row.storage_path,
        uploadedAt: new Date(row.uploaded_at),
        uploadedBy: row.uploaded_by,
        workpaperId: row.workpaper_id,
        score: row.score,
        metadata: row.metadata || {}
    };
}
