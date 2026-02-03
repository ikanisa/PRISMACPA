/**
 * Releases Routes
 * 
 * API endpoints for release management.
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient, ReleaseInsert, ReleaseUpdate } from '../db/client.js';
import { z } from 'zod';

export const releasesRouter: Router = Router();

// =============================================================================
// SCHEMAS
// =============================================================================

const CreateReleaseSchema = z.object({
    type: z.enum(['template', 'policy', 'workflow', 'service']),
    name: z.string().min(1),
    version: z.string().min(1),
    requested_by: z.string().min(1),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
    target_pack: z.string().optional(),
    priority: z.enum(['critical', 'high', 'normal']).optional(),
    change_log: z.string().optional(),
    affected_components: z.array(z.unknown()).optional(),
});

const ListReleasesSchema = z.object({
    type: z.enum(['template', 'policy', 'workflow', 'service']).optional(),
    status: z.enum(['pending', 'approved', 'denied', 'deployed']).optional(),
    priority: z.enum(['critical', 'high', 'normal']).optional(),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/v1/releases
 * Create a new release request
 */
releasesRouter.post('/', async (req: Request, res: Response) => {
    const parseResult = CreateReleaseSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const data = parseResult.data;
    const client = getSupabaseClient();

    const insertData: ReleaseInsert = {
        type: data.type,
        name: data.name,
        version: data.version,
        requested_by: data.requested_by,
        jurisdiction: data.jurisdiction || null,
        target_pack: data.target_pack,
        priority: data.priority || 'normal',
        status: 'pending',
        change_log: data.change_log,
        affected_components: data.affected_components || [],
    };

    const { data: release, error } = await client
        .from('releases')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Release insert error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'release_requested',
        actor: data.requested_by,
        actor_type: 'agent',
        resource_type: 'release',
        resource_id: release.id,
        details: { type: data.type, version: data.version, priority: release.priority },
        new_state: release as unknown as Record<string, unknown>,
    });

    res.status(201).json(release);
});

/**
 * GET /api/v1/releases
 * List releases with filtering
 */
releasesRouter.get('/', async (req: Request, res: Response) => {
    const parseResult = ListReleasesSchema.safeParse(req.query);

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
        .from('releases')
        .select('*', { count: 'exact' })
        .order('requested_at', { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.type) {
        query = query.eq('type', filters.type);
    }
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.priority) {
        query = query.eq('priority', filters.priority);
    }
    if (filters.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
    }

    const { data: releases, error, count } = await query;

    if (error) {
        console.error('Releases query error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        releases: releases || [],
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
    });
});

/**
 * GET /api/v1/releases/:id
 * Get a specific release
 */
releasesRouter.get('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const client = getSupabaseClient();

    const { data: release, error } = await client
        .from('releases')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            res.status(404).json({
                error: 'Not Found',
                message: `Release ${id} not found`,
            });
            return;
        }
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json(release);
});

/**
 * POST /api/v1/releases/:id/authorize
 * Authorize a release
 */
releasesRouter.post('/:id/authorize', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { authorized_by, notes } = req.body;

    if (!authorized_by) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'authorized_by is required',
        });
        return;
    }

    const client = getSupabaseClient();

    // Get current state
    const { data: previousState } = await client
        .from('releases')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Release ${id} not found`,
        });
        return;
    }

    if (previousState.status !== 'pending') {
        res.status(400).json({
            error: 'Invalid State',
            message: `Release is already ${previousState.status}`,
        });
        return;
    }

    // Check QC passed
    if (!previousState.qc_passed) {
        res.status(400).json({
            error: 'QC Required',
            message: 'Release must pass QC before authorization',
        });
        return;
    }

    const updateData: ReleaseUpdate = {
        status: 'approved',
        authorized_by,
        authorized_at: new Date().toISOString(),
        authorization_notes: notes || null,
    };

    const { data: release, error } = await client
        .from('releases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Release authorize error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'release_authorized',
        actor: authorized_by,
        actor_type: 'operator',
        resource_type: 'release',
        resource_id: id,
        details: { notes },
        previous_state: previousState as unknown as Record<string, unknown>,
        new_state: release as unknown as Record<string, unknown>,
    });

    res.json(release);
});

/**
 * POST /api/v1/releases/:id/deny
 * Deny a release
 */
releasesRouter.post('/:id/deny', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { denied_by, reason } = req.body;

    if (!denied_by || !reason) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'denied_by and reason are required',
        });
        return;
    }

    const client = getSupabaseClient();

    // Get current state
    const { data: previousState } = await client
        .from('releases')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Release ${id} not found`,
        });
        return;
    }

    if (previousState.status !== 'pending') {
        res.status(400).json({
            error: 'Invalid State',
            message: `Release is already ${previousState.status}`,
        });
        return;
    }

    const { data: release, error } = await client
        .from('releases')
        .update({
            status: 'denied',
            authorized_by: denied_by,
            authorized_at: new Date().toISOString(),
            authorization_notes: reason,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Release deny error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'release_denied',
        actor: denied_by,
        actor_type: 'operator',
        resource_type: 'release',
        resource_id: id,
        details: { reason },
        previous_state: previousState as unknown as Record<string, unknown>,
        new_state: release as unknown as Record<string, unknown>,
    });

    res.json(release);
});
