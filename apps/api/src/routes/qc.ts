/**
 * QC Routes
 * 
 * API endpoints for quality control gate operations.
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient, QCResultInsert } from '../db/client.js';
import { z } from 'zod';

export const qcRouter: Router = Router();

// =============================================================================
// SCHEMAS
// =============================================================================

const ExecuteQCSchema = z.object({
    workpaper_id: z.string().uuid(),
    workstream_id: z.string().uuid().optional(),
    gate_type: z.string().min(1),
    gate_version: z.string().optional(),
    executed_by: z.string().min(1),
    checks: z.array(z.object({
        name: z.string(),
        passed: z.boolean(),
        message: z.string().optional(),
        severity: z.enum(['info', 'warning', 'error']).optional(),
    })),
    findings: z.array(z.unknown()).optional(),
    recommendations: z.array(z.unknown()).optional(),
});

const ListQCHistorySchema = z.object({
    workpaper_id: z.string().uuid().optional(),
    workstream_id: z.string().uuid().optional(),
    passed: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/v1/qc/execute
 * Execute a QC gate
 */
qcRouter.post('/execute', async (req: Request, res: Response) => {
    const parseResult = ExecuteQCSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const data = parseResult.data;
    const client = getSupabaseClient();

    // Calculate results
    const checksPassed = data.checks.filter(c => c.passed).length;
    const checksFailed = data.checks.filter(c => !c.passed && c.severity === 'error').length;
    const checksWarnings = data.checks.filter(c => !c.passed && c.severity === 'warning').length;
    const passed = checksFailed === 0;
    const score = data.checks.length > 0
        ? Math.round((checksPassed / data.checks.length) * 100)
        : 0;

    const insertData: QCResultInsert = {
        workpaper_id: data.workpaper_id,
        workstream_id: data.workstream_id,
        gate_type: data.gate_type,
        gate_version: data.gate_version,
        passed,
        score,
        checks_performed: data.checks,
        checks_passed: checksPassed,
        checks_failed: checksFailed,
        checks_warnings: checksWarnings,
        findings: data.findings || [],
        recommendations: data.recommendations || [],
        executed_by: data.executed_by,
    };

    const { data: qcResult, error } = await client
        .from('qc_results')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('QC execute error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'qc_gate_executed',
        actor: data.executed_by,
        actor_type: 'agent',
        resource_type: 'workpaper',
        resource_id: data.workpaper_id,
        details: {
            gate_type: data.gate_type,
            passed,
            score,
            checks_passed: checksPassed,
            checks_failed: checksFailed,
        },
        new_state: qcResult as unknown as Record<string, unknown>,
    });

    res.status(201).json(qcResult);
});

/**
 * GET /api/v1/qc/history
 * Get QC history
 */
qcRouter.get('/history', async (req: Request, res: Response) => {
    const parseResult = ListQCHistorySchema.safeParse(req.query);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const filters = parseResult.data;
    const client = getSupabaseClient();

    let query = client
        .from('qc_results')
        .select('*', { count: 'exact' })
        .order('executed_at', { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.workpaper_id) {
        query = query.eq('workpaper_id', filters.workpaper_id);
    }
    if (filters.workstream_id) {
        query = query.eq('workstream_id', filters.workstream_id);
    }
    if (filters.passed !== undefined) {
        query = query.eq('passed', filters.passed);
    }

    const { data: results, error, count } = await query;

    if (error) {
        console.error('QC history query error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        results: results || [],
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
    });
});

/**
 * GET /api/v1/qc/workpaper/:workpaperId
 * Get QC history for a specific workpaper
 */
qcRouter.get('/workpaper/:workpaperId', async (req: Request, res: Response) => {
    const { workpaperId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const client = getSupabaseClient();

    const { data: results, error } = await client
        .from('qc_results')
        .select('*')
        .eq('workpaper_id', workpaperId)
        .order('executed_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('QC workpaper query error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        workpaper_id: workpaperId,
        history: results || [],
        latest: results?.[0] || null,
    });
});

/**
 * GET /api/v1/qc/:id
 * Get a specific QC result
 */
qcRouter.get('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const client = getSupabaseClient();

    const { data: result, error } = await client
        .from('qc_results')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            res.status(404).json({
                error: 'Not Found',
                message: `QC result ${id} not found`,
            });
            return;
        }
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json(result);
});
