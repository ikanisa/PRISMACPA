
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeTask, getAgentForService, getAgentsByJurisdiction, escalateTask, RoutingRequest } from './index.js';
import { logAction } from '../audit_log/index.js';

// Mock dependencies
vi.mock('../lib/db', () => ({
    getSupabaseClient: vi.fn()
}));

vi.mock('../audit_log/index.js', () => ({
    logAction: vi.fn()
}));

import { getSupabaseClient } from '../lib/db.js';

describe('Routing Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('routeTask', () => {
        it('should route to matching agent from catalog', async () => {
            const mockOrder = vi.fn().mockResolvedValue({
                data: [{
                    agent_id: 'sofia',
                    agent_name: 'Sofia (Accounting)',
                    jurisdiction: 'MT',
                    priority: 1
                }],
                error: null
            });

            (getSupabaseClient as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                or: vi.fn().mockReturnValue({
                                    order: mockOrder
                                })
                            })
                        })
                    }),
                    insert: vi.fn().mockResolvedValue({ error: null })
                })
            });

            const request: RoutingRequest = {
                taskId: 'task-1',
                taskType: 'accounting',
                jurisdiction: 'MT',
                payload: {}
            };

            const result = await routeTask(request);

            expect(result.agentId).toBe('sofia');
            expect(result.confidence).toBeGreaterThan(0.8);
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'task_routed'
            }));
        });

        it('should fallback to orchestrator when no agents match', async () => {
            const mockOrder = vi.fn().mockResolvedValue({
                data: [],
                error: null
            });

            (getSupabaseClient as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                order: mockOrder, // When no jurisdiction
                                or: vi.fn().mockReturnValue({
                                    order: mockOrder // When jurisdiction provided
                                })
                            })
                        })
                    })
                })
            });

            const request: RoutingRequest = {
                taskId: 'task-2',
                taskType: 'unknown_service',
                payload: {}
            };

            const result = await routeTask(request);

            expect(result.agentId).toBe('aline');
            expect(result.confidence).toBe(0.5);
        });
    });

    describe('getAgentsByJurisdiction', () => {
        it('should return unique agent IDs for jurisdiction', async () => {
            (getSupabaseClient as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        or: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({
                                data: [
                                    { agent_id: 'sofia' },
                                    { agent_id: 'luke' },
                                    { agent_id: 'sofia' } // Duplicate
                                ],
                                error: null
                            })
                        })
                    })
                })
            });

            const agents = await getAgentsByJurisdiction('MT');

            expect(agents).toHaveLength(2);
            expect(agents).toContain('sofia');
            expect(agents).toContain('luke');
        });
    });

    describe('escalateTask', () => {
        it('should escalate to Marco with audit log', async () => {
            (getSupabaseClient as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    insert: vi.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await escalateTask('task-3', 'sofia', 'Complex case needs governance review');

            expect(result.agentId).toBe('marco');
            expect(result.confidence).toBe(1.0);
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'escalation_triggered',
                actor: 'sofia'
            }));
        });
    });
});
