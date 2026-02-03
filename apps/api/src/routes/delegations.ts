/**
 * Delegations Routes
 * 
 * API endpoints for agent-to-agent delegations.
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient, DelegationInsert, DelegationUpdate } from '../db/client.js';
import { z } from 'zod';

export const delegationsRouter: Router = Router();

// =============================================================================
// SCHEMAS
// =============================================================================

const CreateDelegationSchema = z.object({
    from_agent: z.string().min(1),
    to_agent: z.string().min(1),
    task_type: z.string().min(1),
    task_description: z.string().optional(),
    workstream_id: z.string().uuid().optional(),
    engagement_id: z.string().uuid().optional(),
    client_name: z.string().optional(),
    due_date: z.string().datetime().optional(),
    delegation_reason: z.string().optional(),
});

const ListDelegationsSchema = z.object({
    from_agent: z.string().optional(),
    to_agent: z.string().optional(),
    status: z.enum(['pending', 'active', 'completed', 'cancelled']).optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/v1/delegations
 * Create a new delegation
 */
delegationsRouter.post('/', async (req: Request, res: Response) => {
    const parseResult = CreateDelegationSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const data = parseResult.data;
    const client = getSupabaseClient();

    const insertData: DelegationInsert = {
        from_agent: data.from_agent,
        to_agent: data.to_agent,
        task_type: data.task_type,
        task_description: data.task_description,
        status: 'pending',
        workstream_id: data.workstream_id,
        engagement_id: data.engagement_id,
        client_name: data.client_name,
        due_date: data.due_date,
        delegation_reason: data.delegation_reason,
    };

    const { data: delegation, error } = await client
        .from('delegations')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Delegation insert error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'delegation_created',
        actor: data.from_agent,
        actor_type: 'agent',
        resource_type: 'delegation',
        resource_id: delegation.id,
        details: { to_agent: data.to_agent, task_type: data.task_type },
        new_state: delegation as unknown as Record<string, unknown>,
    });

    res.status(201).json(delegation);
});

/**
 * GET /api/v1/delegations
 * List delegations with filtering
 */
delegationsRouter.get('/', async (req: Request, res: Response) => {
    const parseResult = ListDelegationsSchema.safeParse(req.query);

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
        .from('delegations')
        .select('*', { count: 'exact' })
        .order('delegated_at', { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.from_agent) {
        query = query.eq('from_agent', filters.from_agent);
    }
    if (filters.to_agent) {
        query = query.eq('to_agent', filters.to_agent);
    }
    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    const { data: delegations, error, count } = await query;

    if (error) {
        console.error('Delegations query error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        delegations: delegations || [],
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
    });
});

/**
 * POST /api/v1/delegations/:id/accept
 * Accept a delegation
 */
delegationsRouter.post('/:id/accept', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const client = getSupabaseClient();

    const { data: previousState } = await client
        .from('delegations')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Delegation ${id} not found`,
        });
        return;
    }

    if (previousState.status !== 'pending') {
        res.status(400).json({
            error: 'Invalid State',
            message: `Delegation is already ${previousState.status}`,
        });
        return;
    }

    const updateData: DelegationUpdate = {
        status: 'active',
        accepted_at: new Date().toISOString(),
    };

    const { data: delegation, error } = await client
        .from('delegations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Delegation accept error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'delegation_accepted',
        actor: previousState.to_agent,
        actor_type: 'agent',
        resource_type: 'delegation',
        resource_id: id,
        previous_state: previousState as unknown as Record<string, unknown>,
        new_state: delegation as unknown as Record<string, unknown>,
    });

    res.json(delegation);
});

/**
 * POST /api/v1/delegations/:id/complete
 * Complete a delegation
 */
delegationsRouter.post('/:id/complete', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { completion_notes } = req.body;
    const client = getSupabaseClient();

    const { data: previousState } = await client
        .from('delegations')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Delegation ${id} not found`,
        });
        return;
    }

    if (previousState.status !== 'active') {
        res.status(400).json({
            error: 'Invalid State',
            message: 'Delegation must be active to complete',
        });
        return;
    }

    const updateData: DelegationUpdate = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completion_notes || null,
    };

    const { data: delegation, error } = await client
        .from('delegations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Delegation complete error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'delegation_completed',
        actor: previousState.to_agent,
        actor_type: 'agent',
        resource_type: 'delegation',
        resource_id: id,
        details: { completion_notes },
        previous_state: previousState as unknown as Record<string, unknown>,
        new_state: delegation as unknown as Record<string, unknown>,
    });

    res.json(delegation);
});
