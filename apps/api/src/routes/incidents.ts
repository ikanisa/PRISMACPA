/**
 * Incidents Routes
 * 
 * API endpoints for incident management.
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient, IncidentInsert, IncidentUpdate } from '../db/client.js';
import { z } from 'zod';

export const incidentsRouter: Router = Router();

// =============================================================================
// SCHEMAS
// =============================================================================

const CreateIncidentSchema = z.object({
    type: z.enum(['security', 'compliance', 'operational', 'policy']),
    title: z.string().min(1),
    description: z.string().optional(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    reporter: z.string().min(1),
    affected_clients: z.number().int().min(0).optional(),
    affected_workstreams: z.array(z.string().uuid()).optional(),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
});

const UpdateIncidentSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
    affected_clients: z.number().int().min(0).optional(),
    resolution: z.string().optional(),
    resolved_by: z.string().optional(),
    root_cause: z.string().optional(),
    preventive_actions: z.array(z.unknown()).optional(),
});

const ListIncidentsSchema = z.object({
    type: z.enum(['security', 'compliance', 'operational', 'policy']).optional(),
    severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/v1/incidents
 * Create a new incident
 */
incidentsRouter.post('/', async (req: Request, res: Response) => {
    const parseResult = CreateIncidentSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const data = parseResult.data;
    const client = getSupabaseClient();

    const insertData: IncidentInsert = {
        type: data.type,
        title: data.title,
        description: data.description,
        severity: data.severity,
        reporter: data.reporter,
        status: 'open',
        affected_clients: data.affected_clients || 0,
        affected_workstreams: data.affected_workstreams || [],
        jurisdiction: data.jurisdiction || null,
    };

    const { data: incident, error } = await client
        .from('incidents')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Incident insert error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'incident_created',
        actor: data.reporter,
        actor_type: 'agent',
        resource_type: 'incident',
        resource_id: incident.id,
        details: { severity: data.severity, type: data.type },
        new_state: incident as unknown as Record<string, unknown>,
    });

    res.status(201).json(incident);
});

/**
 * GET /api/v1/incidents
 * List incidents with filtering
 */
incidentsRouter.get('/', async (req: Request, res: Response) => {
    const parseResult = ListIncidentsSchema.safeParse(req.query);

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
        .from('incidents')
        .select('*', { count: 'exact' })
        .order('reported_at', { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

    // Apply filters
    if (filters.type) {
        query = query.eq('type', filters.type);
    }
    if (filters.severity) {
        query = query.eq('severity', filters.severity);
    }
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
    }

    const { data: incidents, error, count } = await query;

    if (error) {
        console.error('Incidents query error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        incidents: incidents || [],
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
    });
});

/**
 * GET /api/v1/incidents/:id
 * Get a specific incident
 */
incidentsRouter.get('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const client = getSupabaseClient();

    const { data: incident, error } = await client
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            res.status(404).json({
                error: 'Not Found',
                message: `Incident ${id} not found`,
            });
            return;
        }
        console.error('Incident get error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json(incident);
});

/**
 * PATCH /api/v1/incidents/:id
 * Update an incident
 */
incidentsRouter.patch('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const parseResult = UpdateIncidentSchema.safeParse(req.body);

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
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Incident ${id} not found`,
        });
        return;
    }

    const updateData: IncidentUpdate = { ...updates };

    // Auto-set resolved_at if status changed to resolved
    if (updates.status === 'resolved' && previousState.status !== 'resolved') {
        updateData.resolved_at = new Date().toISOString();
    }

    const { data: incident, error } = await client
        .from('incidents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Incident update error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log status changes
    if (updates.status && updates.status !== previousState.status) {
        await client.from('audit_log').insert({
            action: updates.status === 'resolved' ? 'incident_resolved' : 'incident_status_changed',
            actor: updates.resolved_by || 'system',
            actor_type: updates.resolved_by ? 'operator' : 'system',
            resource_type: 'incident',
            resource_id: id,
            details: { from: previousState.status, to: updates.status },
            previous_state: previousState as unknown as Record<string, unknown>,
            new_state: incident as unknown as Record<string, unknown>,
        });
    }

    res.json(incident);
});

/**
 * POST /api/v1/incidents/:id/resolve
 * Resolve an incident
 */
incidentsRouter.post('/:id/resolve', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { resolution, resolved_by, root_cause, preventive_actions } = req.body;

    if (!resolution || !resolved_by) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'resolution and resolved_by are required',
        });
        return;
    }

    const client = getSupabaseClient();

    // Get current state
    const { data: previousState } = await client
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Incident ${id} not found`,
        });
        return;
    }

    if (previousState.status === 'resolved' || previousState.status === 'closed') {
        res.status(400).json({
            error: 'Invalid State',
            message: 'Incident is already resolved or closed',
        });
        return;
    }

    const { data: incident, error } = await client
        .from('incidents')
        .update({
            status: 'resolved',
            resolution,
            resolved_by,
            resolved_at: new Date().toISOString(),
            root_cause: root_cause || null,
            preventive_actions: preventive_actions || [],
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Incident resolve error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'incident_resolved',
        actor: resolved_by,
        actor_type: 'operator',
        resource_type: 'incident',
        resource_id: id,
        details: { resolution, root_cause },
        previous_state: previousState as unknown as Record<string, unknown>,
        new_state: incident as unknown as Record<string, unknown>,
    });

    res.json(incident);
});
