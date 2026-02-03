/**
 * Audit Log Routes
 * 
 * API endpoints for the immutable audit log.
 * Supports creating log entries and querying history.
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient, AuditLogInsert } from '../db/client.js';
import { z } from 'zod';

export const auditLogRouter: Router = Router();

// =============================================================================
// SCHEMAS
// =============================================================================

const CreateAuditLogSchema = z.object({
    action: z.string().min(1),
    actor: z.string().min(1),
    actor_type: z.enum(['agent', 'operator', 'system']),
    resource_type: z.string().min(1),
    resource_id: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
    previous_state: z.record(z.string(), z.unknown()).optional(),
    new_state: z.record(z.string(), z.unknown()).optional(),
    session_id: z.string().uuid().optional(),
    workstream_id: z.string().uuid().optional(),
    engagement_id: z.string().uuid().optional(),
});

const QueryAuditLogSchema = z.object({
    actor: z.string().optional(),
    action: z.string().optional(),
    resource_type: z.string().optional(),
    resource_id: z.string().optional(),
    workstream_id: z.string().uuid().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/v1/audit-log
 * Create a new audit log entry
 */
auditLogRouter.post('/', async (req: Request, res: Response) => {
    const parseResult = CreateAuditLogSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const data = parseResult.data;
    const client = getSupabaseClient();

    const insertData: AuditLogInsert = {
        action: data.action,
        actor: data.actor,
        actor_type: data.actor_type,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        details: data.details || {},
        previous_state: data.previous_state || null,
        new_state: data.new_state || null,
        session_id: data.session_id || null,
        workstream_id: data.workstream_id || null,
        engagement_id: data.engagement_id || null,
        ip_address: req.ip || null,
        user_agent: req.get('User-Agent') || null,
    };

    const { data: entry, error } = await client
        .from('audit_log')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Audit log insert error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.status(201).json(entry);
});

/**
 * GET /api/v1/audit-log
 * Query audit log entries with filtering
 */
auditLogRouter.get('/', async (req: Request, res: Response) => {
    const parseResult = QueryAuditLogSchema.safeParse(req.query);

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
        .from('audit_log')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

    // Apply filters
    if (filters.actor) {
        query = query.eq('actor', filters.actor);
    }
    if (filters.action) {
        query = query.eq('action', filters.action);
    }
    if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
    }
    if (filters.resource_id) {
        query = query.eq('resource_id', filters.resource_id);
    }
    if (filters.workstream_id) {
        query = query.eq('workstream_id', filters.workstream_id);
    }
    if (filters.from) {
        query = query.gte('timestamp', filters.from);
    }
    if (filters.to) {
        query = query.lte('timestamp', filters.to);
    }

    const { data: entries, error, count } = await query;

    if (error) {
        console.error('Audit log query error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        entries: entries || [],
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
    });
});

/**
 * GET /api/v1/audit-log/resource/:resourceType/:resourceId
 * Get history for a specific resource
 */
auditLogRouter.get('/resource/:resourceType/:resourceId', async (req: Request, res: Response) => {
    const { resourceType, resourceId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const client = getSupabaseClient();

    const { data: entries, error } = await client
        .from('audit_log')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Audit log resource query error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        resource: { type: resourceType, id: resourceId },
        history: entries || [],
    });
});
