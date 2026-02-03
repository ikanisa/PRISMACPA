/**
 * FirmOS API Server
 * 
 * Express-based REST API for FirmOS backend operations.
 * Provides endpoints for cases, audit log, incidents, releases, and more.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { checkDatabaseHealth } from './db/client.js';

// Import route handlers
import { casesRouter } from './routes/cases.js';
import { auditLogRouter } from './routes/audit-log.js';
import { incidentsRouter } from './routes/incidents.js';
import { releasesRouter } from './routes/releases.js';
import { delegationsRouter } from './routes/delegations.js';
import { templatesRouter } from './routes/templates.js';
import { qcRouter } from './routes/qc.js';

import { requireAuth } from './middleware/auth.js';

export const VERSION = '1.0.0';

/**
 * Create and configure the Express application
 */
export function createApp(): Express {
    const app = express();

    // ==========================================================================
    // MIDDLEWARE
    // ==========================================================================

    // Parse JSON bodies
    app.use(express.json({ limit: '10mb' }));

    // CORS headers (permissive for development)
    app.use((req: Request, res: Response, next: NextFunction) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');

        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
            return;
        }

        next();
    });

    // Request logging
    app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        });
        next();
    });

    // ==========================================================================
    // HEALTH CHECK
    // ==========================================================================

    app.get('/health', async (_req: Request, res: Response) => {
        const dbHealth = await checkDatabaseHealth();

        const health = {
            status: dbHealth.connected ? 'healthy' : 'degraded',
            version: VERSION,
            uptime: process.uptime(),
            database: {
                connected: dbHealth.connected,
                latencyMs: dbHealth.latencyMs,
                error: dbHealth.error,
            },
            timestamp: new Date().toISOString(),
        };

        res.status(dbHealth.connected ? 200 : 503).json(health);
    });

    // ==========================================================================
    // API ROUTES
    // ==========================================================================

    // Apply authentication middleware to all API routes
    app.use('/api/v1', requireAuth);

    // Mount route handlers
    app.use('/api/v1/cases', casesRouter);
    app.use('/api/v1/audit-log', auditLogRouter);
    app.use('/api/v1/incidents', incidentsRouter);
    app.use('/api/v1/releases', releasesRouter);
    app.use('/api/v1/delegations', delegationsRouter);
    app.use('/api/v1/templates', templatesRouter);
    app.use('/api/v1/qc', qcRouter);

    // ==========================================================================
    // ERROR HANDLING
    // ==========================================================================

    // 404 handler
    app.use((_req: Request, res: Response) => {
        res.status(404).json({
            error: 'Not Found',
            message: 'The requested endpoint does not exist',
        });
    });

    // Error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error('API Error:', err);

        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        });
    });

    return app;
}

/**
 * Start the API server
 */
export async function startServer(port: number = 3000): Promise<void> {
    const app = createApp();

    app.listen(port, () => {
        console.log(`FirmOS API v${VERSION} starting...`);
        console.log(`Server listening on http://localhost:${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        console.log('11-Agent System Ready');
    });
}
