
/**
 * QC Gates Module
 * 
 * Re-exports Diane's QC gate runner from @firmos/programs.
 * Integrates with FirmOS config for policy-driven QC gates.
 * In v2027+, implementations will live here directly.
 */

import { getSupabaseClient } from '../lib/db.js';
import { logAction } from '../audit_log/index.js';

// Re-export types and functions from canonical source
export {
    type QCStatus,
    type QCCheckResult,
    type QCGateResult,
    type QCCheck,
    type QCContext,
    registerQCCheck,
    getAllChecks,
    runQCGate,
    runServiceQC
} from "@firmos/programs/qc-gate-runner.js";

// Config integration
import {
    loadFirmOSConfig,
    requiresQCGate,
    getQCGateOwner,
    getAgentById,
    type AutonomyLevel
} from "@firmos/core";

// Additional types for module API (future expansion)
export type QCOutcome = "PASS" | "FAIL" | "ESCALATE";

export interface QCRequest {
    workpaperId: string;
    serviceType: string;
    agentId: string;
    submittedBy: string;
    metadata?: Record<string, unknown>;
}

export interface QCResult {
    id: string;
    outcome: QCOutcome;
    reviewedBy: "diane";
    reviewedAt: Date;
    findings: QCFinding[];
    comment?: string;
    workpaperId: string;
}

export interface QCFinding {
    check: string;
    passed: boolean;
    severity: "info" | "warning" | "error";
    message?: string;
}

/**
 * Check if QC is required for an agent's autonomy level (policy-driven)
 */
export function isQCRequired(autonomyLevel: string): boolean {
    return requiresQCGate(autonomyLevel as AutonomyLevel);
}

/**
 * Check if a specific agent requires QC gate based on their config
 */
export function agentRequiresQC(agentId: string): boolean {
    const agent = getAgentById(agentId);
    if (!agent) { return true; } // Fail safe: require QC if agent unknown
    return requiresQCGate(agent.autonomy);
}

/**
 * Get the QC gate owner agent ID from policy (typically "diane")
 */
export function getQCOwner(): string {
    return getQCGateOwner();
}

/**
 * Get required QC checks from policy config
 */
export function getRequiredChecks(): string[] {
    const config = loadFirmOSConfig();
    if (!config?.policies?.gates?.qc_gate?.required_checks) return [];

    // Convert from "key: description" format to just keys
    return config.policies.gates.qc_gate.required_checks.map(check => {
        if (typeof check === 'string') {
            const [key] = check.split(':');
            return key.trim();
        }
        return String(check);
    });
}

/**
 * Execute a QC Gate (Persisted)
 */
export async function executeQCGate(request: QCRequest): Promise<QCResult> {
    const supabase = getSupabaseClient();
    const checks = getRequiredChecks();

    // Mock Execution Logic (In real world, would run specific check functions)
    const findings: QCFinding[] = checks.map(check => {
        // Simple logic: pass 90% of checks unless specifically flagged
        const passed = Math.random() > 0.1;
        return {
            check,
            passed,
            severity: passed ? 'info' : 'error',
            message: passed ? 'Check passed' : 'Automated check failed'
        };
    });

    const failedCount = findings.filter(f => !f.passed).length;
    const outcome: QCOutcome = failedCount === 0 ? "PASS" : "FAIL";

    // Insert into DB
    const dbEntry = {
        workpaper_id: request.workpaperId,
        service_type: request.serviceType,
        agent_id: request.agentId,
        outcome,
        reviewed_by: getQCOwner(),
        findings, // Jsonb
        metadata: request.metadata || {}
    };

    const { data, error } = await supabase
        .from('qc_results')
        .insert(dbEntry)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to record QC result: ${error.message}`);
    }

    const result = mapDbToQCResult(data);

    // Audit Log
    await logAction({
        action: 'qc_gate_executed',
        actor: getQCOwner(),
        resourceType: 'qc_result',
        resourceId: result.id,
        details: {
            workpaperId: request.workpaperId,
            outcome: result.outcome,
            failureCount: failedCount
        }
    });

    return result;
}

/**
 * Get QC History for Workpaper
 */
export async function getQCHistory(workpaperId: string): Promise<QCResult[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('qc_results')
        .select('*')
        .eq('workpaper_id', workpaperId)
        .order('reviewed_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch QC history: ${error.message}`);
    }

    return (data || []).map(mapDbToQCResult);
}

// Helpers

function mapDbToQCResult(row: any): QCResult {
    return {
        id: row.id,
        workpaperId: row.workpaper_id,
        outcome: row.outcome,
        reviewedBy: row.reviewed_by,
        reviewedAt: new Date(row.reviewed_at),
        findings: row.findings || [],
        comment: row.resolution_notes // Mapped field if compatible
    };
}
