/**
 * Cases Routes
 * 
 * API endpoints for case management.
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient, CaseInsert, CaseUpdate } from '../db/client.js';
import { z } from 'zod';

export const casesRouter: Router = Router();

// =============================================================================
// SCHEMAS
// =============================================================================

const CreateCaseSchema = z.object({
    client_id: z.string().uuid(),
    client_name: z.string().min(1),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
    service_type: z.string().min(1),
    assigned_agent: z.string().min(1),
    due_date: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

const UpdateCaseSchema = z.object({
    client_name: z.string().min(1).optional(),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
    service_type: z.string().min(1).optional(),
    status: z.enum(['intake', 'active', 'in_progress', 'pending_review', 'completed', 'archived']).optional(),
    assigned_agent: z.string().min(1).optional(),
    due_date: z.string().datetime().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

const ListCasesSchema = z.object({
    status: z.enum(['intake', 'active', 'in_progress', 'pending_review', 'completed', 'archived']).optional(),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
    assigned_agent: z.string().optional(),
    client_id: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// HELPER: Log to audit log
// =============================================================================

async function logToAudit(
    action: string,
    actor: string,
    resourceId: string,
    details?: Record<string, unknown>,
    previousState?: Record<string, unknown> | null,
    newState?: Record<string, unknown> | null
): Promise<void> {
    const client = getSupabaseClient();
    await client.from('audit_log').insert({
        action,
        actor,
        actor_type: 'system',
        resource_type: 'case',
        resource_id: resourceId,
        details: details || {},
        previous_state: previousState || null,
        new_state: newState || null,
    });
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/v1/cases
 * Create a new case
 */
casesRouter.post('/', async (req: Request, res: Response) => {
    const parseResult = CreateCaseSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const data = parseResult.data;
    const client = getSupabaseClient();

    const insertData: CaseInsert = {
        client_id: data.client_id,
        client_name: data.client_name,
        jurisdiction: data.jurisdiction || null,
        service_type: data.service_type,
        assigned_agent: data.assigned_agent,
        status: 'intake',
        due_date: data.due_date || null,
        metadata: data.metadata || {},
    };

    const { data: caseRecord, error } = await client
        .from('cases')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Case insert error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await logToAudit('case_created', 'system', caseRecord.id, {}, null, caseRecord as unknown as Record<string, unknown>);

    res.status(201).json(caseRecord);
});

/**
 * GET /api/v1/cases
 * List cases with filtering
 */
casesRouter.get('/', async (req: Request, res: Response) => {
    const parseResult = ListCasesSchema.safeParse(req.query);

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
        .from('cases')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

    // Apply filters
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
    }
    if (filters.assigned_agent) {
        query = query.eq('assigned_agent', filters.assigned_agent);
    }
    if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
    }

    const { data: cases, error, count } = await query;

    if (error) {
        console.error('Cases query error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        cases: cases || [],
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
    });
});

/**
 * GET /api/v1/cases/:id
 * Get a specific case
 */
casesRouter.get('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const client = getSupabaseClient();

    const { data: caseRecord, error } = await client
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            res.status(404).json({
                error: 'Not Found',
                message: `Case ${id} not found`,
            });
            return;
        }
        console.error('Case get error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json(caseRecord);
});

/**
 * PATCH /api/v1/cases/:id
 * Update a case
 */
casesRouter.patch('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const parseResult = UpdateCaseSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const updates = parseResult.data;
    const client = getSupabaseClient();

    // Get current state for audit
    const { data: previousState } = await client
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Case ${id} not found`,
        });
        return;
    }

    const updateData: CaseUpdate = {};
    if (updates.client_name !== undefined) updateData.client_name = updates.client_name;
    if (updates.jurisdiction !== undefined) updateData.jurisdiction = updates.jurisdiction;
    if (updates.service_type !== undefined) updateData.service_type = updates.service_type;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.assigned_agent !== undefined) updateData.assigned_agent = updates.assigned_agent;
    if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data: caseRecord, error } = await client
        .from('cases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Case update error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log status change specifically
    if (updates.status && updates.status !== previousState.status) {
        await logToAudit(
            'case_status_changed',
            'system',
            id,
            { from: previousState.status, to: updates.status },
            previousState as unknown as Record<string, unknown>,
            caseRecord as unknown as Record<string, unknown>
        );
    }

    // Log agent reassignment
    if (updates.assigned_agent && updates.assigned_agent !== previousState.assigned_agent) {
        await logToAudit(
            'case_agent_assigned',
            'system',
            id,
            { from: previousState.assigned_agent, to: updates.assigned_agent },
            previousState as unknown as Record<string, unknown>,
            caseRecord as unknown as Record<string, unknown>
        );
    }

    res.json(caseRecord);
});

/**
 * PATCH /api/v1/cases/:id/status
 * Update only the case status
 */
casesRouter.patch('/:id/status', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['intake', 'active', 'in_progress', 'pending_review', 'completed', 'archived'];
    if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
            error: 'Validation Error',
            message: `status must be one of: ${validStatuses.join(', ')}`,
        });
        return;
    }

    const client = getSupabaseClient();

    // Get current state
    const { data: previousState } = await client
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Case ${id} not found`,
        });
        return;
    }

    const { data: caseRecord, error } = await client
        .from('cases')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Case status update error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await logToAudit(
        'case_status_changed',
        'system',
        id,
        { from: previousState.status, to: status },
        previousState as unknown as Record<string, unknown>,
        caseRecord as unknown as Record<string, unknown>
    );

    res.json(caseRecord);
});

/**
 * PATCH /api/v1/cases/:id/assign
 * Assign agent to case
 */
casesRouter.patch('/:id/assign', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { assigned_agent } = req.body;

    if (!assigned_agent || typeof assigned_agent !== 'string') {
        res.status(400).json({
            error: 'Validation Error',
            message: 'assigned_agent is required',
        });
        return;
    }

    const client = getSupabaseClient();

    // Get current state
    const { data: previousState } = await client
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Case ${id} not found`,
        });
        return;
    }

    const { data: caseRecord, error } = await client
        .from('cases')
        .update({ assigned_agent })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Case assign error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await logToAudit(
        'case_agent_assigned',
        'system',
        id,
        { from: previousState.assigned_agent, to: assigned_agent },
        previousState as unknown as Record<string, unknown>,
        caseRecord as unknown as Record<string, unknown>
    );

    res.json(caseRecord);
});
