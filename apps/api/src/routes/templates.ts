/**
 * Templates Routes
 * 
 * API endpoints for template management.
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient, TemplateInsert, TemplateUpdate } from '../db/client.js';
import { z } from 'zod';

export const templatesRouter: Router = Router();

// =============================================================================
// SCHEMAS
// =============================================================================

const CreateTemplateSchema = z.object({
    template_id: z.string().min(1),
    version: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string().min(1),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
    pack: z.string().optional(),
    content_path: z.string().min(1),
    content_hash: z.string().min(1),
    created_by: z.string().min(1),
});

const SearchTemplatesSchema = z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    pack: z.string().optional(),
    status: z.enum(['draft', 'pending_qc', 'published', 'deprecated']).optional(),
    jurisdiction: z.enum(['MT', 'RW']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/v1/templates
 * Create a new template (draft)
 */
templatesRouter.post('/', async (req: Request, res: Response) => {
    const parseResult = CreateTemplateSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Validation Error',
            details: parseResult.error.flatten(),
        });
        return;
    }

    const data = parseResult.data;
    const client = getSupabaseClient();

    const insertData: TemplateInsert = {
        template_id: data.template_id,
        version: data.version,
        name: data.name,
        description: data.description,
        category: data.category,
        jurisdiction: data.jurisdiction || null,
        pack: data.pack,
        content_path: data.content_path,
        content_hash: data.content_hash,
        status: 'draft',
        created_by: data.created_by,
    };

    const { data: template, error } = await client
        .from('templates')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Template insert error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'template_draft_created',
        actor: data.created_by,
        actor_type: 'agent',
        resource_type: 'template',
        resource_id: template.id,
        details: { template_id: data.template_id, version: data.version },
        new_state: template as unknown as Record<string, unknown>,
    });

    res.status(201).json(template);
});

/**
 * GET /api/v1/templates/search
 * Search templates
 */
templatesRouter.get('/search', async (req: Request, res: Response) => {
    const parseResult = SearchTemplatesSchema.safeParse(req.query);

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
        .from('templates')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

    // Text search
    if (filters.query) {
        query = query.textSearch('name', filters.query);
    }

    if (filters.category) {
        query = query.eq('category', filters.category);
    }
    if (filters.pack) {
        query = query.eq('pack', filters.pack);
    }
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
    }

    const { data: templates, error, count } = await query;

    if (error) {
        console.error('Templates search error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json({
        templates: templates || [],
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
    });
});

/**
 * GET /api/v1/templates/:id
 * Get a specific template
 */
templatesRouter.get('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const client = getSupabaseClient();

    const { data: template, error } = await client
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            res.status(404).json({
                error: 'Not Found',
                message: `Template ${id} not found`,
            });
            return;
        }
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    res.json(template);
});

/**
 * POST /api/v1/templates/:id/submit-qc
 * Submit template for QC
 */
templatesRouter.post('/:id/submit-qc', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const client = getSupabaseClient();

    const { data: previousState } = await client
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Template ${id} not found`,
        });
        return;
    }

    if (previousState.status !== 'draft') {
        res.status(400).json({
            error: 'Invalid State',
            message: 'Only draft templates can be submitted for QC',
        });
        return;
    }

    const updateData: TemplateUpdate = {
        status: 'pending_qc',
    };

    const { data: template, error } = await client
        .from('templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Template submit-qc error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'template_submitted_for_qc',
        actor: previousState.created_by,
        actor_type: 'agent',
        resource_type: 'template',
        resource_id: id,
        previous_state: previousState as unknown as Record<string, unknown>,
        new_state: template as unknown as Record<string, unknown>,
    });

    res.json(template);
});

/**
 * POST /api/v1/templates/:id/publish
 * Publish a template
 */
templatesRouter.post('/:id/publish', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { published_by } = req.body;

    if (!published_by) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'published_by is required',
        });
        return;
    }

    const client = getSupabaseClient();

    const { data: previousState } = await client
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

    if (!previousState) {
        res.status(404).json({
            error: 'Not Found',
            message: `Template ${id} not found`,
        });
        return;
    }

    if (!previousState.qc_passed) {
        res.status(400).json({
            error: 'QC Required',
            message: 'Template must pass QC before publishing',
        });
        return;
    }

    const updateData: TemplateUpdate = {
        status: 'published',
        published_by,
        published_at: new Date().toISOString(),
    };

    const { data: template, error } = await client
        .from('templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Template publish error:', error);
        res.status(500).json({
            error: 'Database Error',
            message: error.message,
        });
        return;
    }

    // Log to audit
    await client.from('audit_log').insert({
        action: 'template_published',
        actor: published_by,
        actor_type: 'operator',
        resource_type: 'template',
        resource_id: id,
        previous_state: previousState as unknown as Record<string, unknown>,
        new_state: template as unknown as Record<string, unknown>,
    });

    res.json(template);
});

/**
 * POST /api/v1/templates/:id/log-usage
 * Log template usage
 */
templatesRouter.post('/:id/log-usage', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { used_by, workstream_id, engagement_id, document_id } = req.body;

    if (!used_by) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'used_by is required',
        });
        return;
    }

    const client = getSupabaseClient();

    // Insert usage record
    const { error: usageError } = await client
        .from('template_usage')
        .insert({
            template_id: id,
            used_by,
            workstream_id: workstream_id || null,
            engagement_id: engagement_id || null,
            document_id: document_id || null,
        });

    if (usageError) {
        console.error('Template usage insert error:', usageError);
        res.status(500).json({
            error: 'Database Error',
            message: usageError.message,
        });
        return;
    }

    // Update usage count
    const { error: updateError } = await client.rpc('increment_template_usage', {
        template_uuid: id,
    });

    if (updateError) {
        // Non-critical, just log
        console.warn('Template usage count update failed:', updateError);
    }

    res.json({ logged: true });
});
