/**
 * FirmOS API Entry Point
 * 
 * This is the main entry point for the FirmOS API server.
 * Run with: bun run src/index.ts (development) or node dist/index.js (production)
 */

import { startServer, VERSION } from './server.js';

// Export for programmatic use
export { VERSION };
export { createApp, startServer } from './server.js';
export { getSupabaseClient, checkDatabaseHealth } from './db/client.js';

// Only start server if this is the main module
const isMain = import.meta.url.endsWith(process.argv[1]) ||
    process.argv[1]?.endsWith('index.ts') ||
    process.argv[1]?.endsWith('index.js');

if (isMain) {
    const port = parseInt(process.env.PORT || '3000', 10);

    startServer(port).catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}
