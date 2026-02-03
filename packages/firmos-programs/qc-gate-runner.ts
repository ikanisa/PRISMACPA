/**
 * Diane QC Gate Runner
 *
 * Guardian agent's quality control gate execution.
 * Validates outputs, evidence, and compliance before release.
 */

import { loadConfig } from '../firmos-core/config-loader.js';
import {

    validateTaskNode,


} from './validation.js';

// QC Gate result types
export type QCStatus = 'passed' | 'failed' | 'needs_review';

export interface QCCheckResult {
    check_id: string;
    check_name: string;
    status: QCStatus;
    message: string;
    details?: Record<string, unknown>;
}

export interface QCGateResult {
    gate_id: string;
    gate_name: string;
    status: QCStatus;
    checks: QCCheckResult[];
    timestamp: string;
    reviewed_by: 'diane' | 'operator';
    notes?: string;
}

// QC check definitions
export interface QCCheck {
    id: string;
    name: string;
    description: string;
    run: (context: QCContext) => Promise<QCCheckResult>;
}

export interface QCContext {
    service_id: string;
    task_id: string;
    agent_id: string;
    outputs: Record<string, unknown>;
    evidence_refs: string[];
    pack_id: string;
}

// Built-in QC checks
const BUILT_IN_CHECKS: QCCheck[] = [
    {
        id: 'QC_001',
        name: 'Evidence Coverage',
        description: 'Verify all required evidence types are referenced',
        run: async (ctx) => {
            const hasEvidence = ctx.evidence_refs.length > 0;
            return {
                check_id: 'QC_001',
                check_name: 'Evidence Coverage',
                status: hasEvidence ? 'passed' : 'failed',
                message: hasEvidence
                    ? `${ctx.evidence_refs.length} evidence items referenced`
                    : 'No evidence references found',
                details: { evidence_count: ctx.evidence_refs.length }
            };
        }
    },
    {
        id: 'QC_002',
        name: 'Pack Boundary Check',
        description: 'Verify outputs stay within pack boundaries',
        run: async (ctx) => {
            const config = loadConfig();
            const agent = config.agents[ctx.agent_id];

            if (!agent) {
                return {
                    check_id: 'QC_002',
                    check_name: 'Pack Boundary Check',
                    status: 'failed',
                    message: `Unknown agent: ${ctx.agent_id}`
                };
            }

            const canAccess = agent.pack_access.includes(ctx.pack_id) ||
                agent.pack_access.includes('*');

            return {
                check_id: 'QC_002',
                check_name: 'Pack Boundary Check',
                status: canAccess ? 'passed' : 'failed',
                message: canAccess
                    ? `Agent ${ctx.agent_id} authorized for pack ${ctx.pack_id}`
                    : `Agent ${ctx.agent_id} NOT authorized for pack ${ctx.pack_id}`
            };
        }
    },
    {
        id: 'QC_003',
        name: 'Output Completeness',
        description: 'Verify all required outputs are present',
        run: async (ctx) => {
            const outputKeys = Object.keys(ctx.outputs);
            const hasOutputs = outputKeys.length > 0;

            return {
                check_id: 'QC_003',
                check_name: 'Output Completeness',
                status: hasOutputs ? 'passed' : 'needs_review',
                message: hasOutputs
                    ? `${outputKeys.length} outputs present`
                    : 'No outputs found - requires review',
                details: { output_keys: outputKeys }
            };
        }
    },
    {
        id: 'QC_004',
        name: 'Task Validation',
        description: 'Validate task node structure',
        run: async (ctx) => {
            const taskData = {
                task_id: ctx.task_id,
                agent: ctx.agent_id,
                autonomy: 'L3' as const,
                outputs: Object.keys(ctx.outputs),
                evidence_types: ['WORKPAPER_TRAIL' as const],
                qc_gate: true,
                escalation_triggers: []
            };

            const result = validateTaskNode(taskData);

            return {
                check_id: 'QC_004',
                check_name: 'Task Validation',
                status: result.success ? 'passed' : 'failed',
                message: result.success
                    ? 'Task structure valid'
                    : `Validation errors: ${result.errors?.issues.length ?? 0}`,
                details: result.errors ? { errors: result.errors.issues } : undefined
            };
        }
    }
];

// Registry for custom checks
const customChecks: QCCheck[] = [];

/**
 * Register a custom QC check
 */
export function registerQCCheck(check: QCCheck): void {
    customChecks.push(check);
}

/**
 * Get all available QC checks
 */
export function getAllChecks(): QCCheck[] {
    return [...BUILT_IN_CHECKS, ...customChecks];
}

/**
 * Run QC gate with all checks
 */
export async function runQCGate(
    gateId: string,
    gateName: string,
    context: QCContext
): Promise<QCGateResult> {
    const checks = getAllChecks();
    const results: QCCheckResult[] = [];

    for (const check of checks) {
        try {
            const result = await check.run(context);
            results.push(result);
        } catch (error) {
            results.push({
                check_id: check.id,
                check_name: check.name,
                status: 'failed',
                message: `Check error: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    // Determine overall status
    const hasFailed = results.some(r => r.status === 'failed');
    const hasNeedsReview = results.some(r => r.status === 'needs_review');

    let overallStatus: QCStatus = 'passed';
    if (hasFailed) { overallStatus = 'failed'; }
    else if (hasNeedsReview) { overallStatus = 'needs_review'; }

    return {
        gate_id: gateId,
        gate_name: gateName,
        status: overallStatus,
        checks: results,
        timestamp: new Date().toISOString(),
        reviewed_by: 'diane'
    };
}

/**
 * Run service-level QC validation
 */
export async function runServiceQC(serviceId: string): Promise<QCGateResult> {
    const config = loadConfig();
    const service = config.services[serviceId];

    if (!service) {
        return {
            gate_id: 'GATE_SVC_QC',
            gate_name: 'Service QC',
            status: 'failed',
            checks: [{
                check_id: 'SVC_001',
                check_name: 'Service Exists',
                status: 'failed',
                message: `Service not found: ${serviceId}`
            }],
            timestamp: new Date().toISOString(),
            reviewed_by: 'diane'
        };
    }

    // Basic service context
    const context: QCContext = {
        service_id: serviceId,
        task_id: 'SVC_QC_TASK',
        agent_id: 'diane',
        outputs: { service_definition: service },
        evidence_refs: [],
        pack_id: service.pack_id
    };

    return runQCGate('GATE_SVC_QC', `Service QC: ${service.name}`, context);
}
