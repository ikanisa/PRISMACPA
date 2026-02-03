
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                aud: string;
                exp: number;
                iat: number;
                iss: string;
                sub: string;
                email?: string;
                phone?: string;
                app_metadata?: {
                    provider?: string;
                    [key: string]: any;
                };
                user_metadata?: {
                    [key: string]: any;
                };
                role?: string;
            };
        }
    }
}

/**
 * Middleware to validate Supabase JWT
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Unauthorized', message: 'No authorization header provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization header format' });
        return;
    }

    try {
        // Strategy 1: Local verification with JWT Secret (Fastest)
        if (process.env.SUPABASE_JWT_SECRET) {
            const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET) as Express.Request['user'];
            req.user = decoded;
            next();
            return;
        }

        // Strategy 2: Remote verification with Supabase Client (Robust, no secret needed)
        // Importing dynamically to avoid potential circular dependencies if any
        const { getSupabaseClient } = await import('../db/client.js');
        const supabase = getSupabaseClient();

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            // console.error('Supabase Auth verification failed:', error?.message);
            res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
            return;
        }

        // Map Supabase user to Express request user
        req.user = {
            aud: user.aud,
            exp: Math.floor(Date.now() / 1000) + 3600, // Approximate since we don't have the claim
            iat: Math.floor(Date.now() / 1000),
            iss: 'supabase',
            sub: user.id,
            email: user.email,
            phone: user.phone,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata,
            role: user.role
        };

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(401).json({ error: 'Unauthorized', message: 'Authentication failed' });
        return;
    }
};
