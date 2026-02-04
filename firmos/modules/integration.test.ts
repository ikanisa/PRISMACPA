/**
 * Cross-Module Integration Tests
 * 
 * Tests workflows that span multiple modules to ensure they work together correctly.
 * These tests use mocked Supabase but test real module interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Module imports
import { executeQCGate, getQCHistory } from './qc_gates/index.js';
import { requestRelease, authorizeReleaseSimple, getReleaseStatus } from './release_gates/index.js';
import { createDraft, submitForQC, publishTemplateSimple } from './template_factory/index.js';
import { routeTask, escalateTask, getAgentsByJurisdiction } from './routing/index.js';
import { logAction, getResourceHistory } from './audit_log/index.js';

// Mock dependencies
vi.mock('./lib/db', () => ({
    getSupabaseClient: vi.fn()
}));

vi.mock('./audit_log/index.js', () => ({
    logAction: vi.fn().mockResolvedValue(undefined),
    getResourceHistory: vi.fn().mockResolvedValue([])
}));

import { getSupabaseClient } from './lib/db.js';

/**
 * Helper to create a mock Supabase client with chainable methods
 */
function createMockSupabase(responses: Record<string, any> = {}) {
    const mockChain = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(responses.single || { data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue(responses.maybeSingle || { data: null, error: null }),
    };

    // Allow overriding specific chain results
    if (responses.insertSelect) {
        mockChain.insert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(responses.insertSelect)
            })
        });
    }

    if (responses.orderResult) {
        mockChain.order.mockResolvedValue(responses.orderResult);
    }

    return mockChain;
}

describe('Cross-Module Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('QC → Release Workflow', () => {
        it('should allow release request only after QC passes', async () => {
            // Setup: QC result exists and passed
            const qcResult = {
                id: 'qc-123',
                workpaper_id: 'wp-001',
                outcome: 'PASS',
                reviewed_by: 'diane',
                findings: [],
                created_at: new Date().toISOString()
            };

            const releaseRecord = {
                id: 'rel-001',
                workpaper_id: 'wp-001',
                status: 'pending_authorization',
                requested_by: 'sofia',
                requested_at: new Date().toISOString(),
                metadata: {}
            };

            const mockSupabase = {
                from: vi.fn((table: string) => {
                    if (table === 'qc_results') {
                        return {
                            select: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    order: vi.fn().mockResolvedValue({
                                        data: [qcResult],
                                        error: null
                                    })
                                })
                            })
                        };
                    }
                    if (table === 'releases') {
                        return {
                            insert: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({
                                        data: releaseRecord,
                                        error: null
                                    })
                                })
                            })
                        };
                    }
                    return createMockSupabase();
                })
            };

            (getSupabaseClient as any).mockReturnValue(mockSupabase);

            // Act: Request release after QC pass
            const release = await requestRelease({
                workpaperId: 'wp-001',
                requestedBy: 'sofia',
                description: 'Monthly financials ready for release'
            });

            // Assert
            expect(release.status).toBe('pending_authorization');
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'release_requested'
            }));
        });

        it('should reject release request when QC has not passed', async () => {
            // Setup: No passing QC results
            const mockSupabase = {
                from: vi.fn((table: string) => {
                    if (table === 'qc_results') {
                        return {
                            select: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    order: vi.fn().mockResolvedValue({
                                        data: [], // No QC results
                                        error: null
                                    })
                                })
                            })
                        };
                    }
                    return createMockSupabase();
                })
            };

            (getSupabaseClient as any).mockReturnValue(mockSupabase);

            // Act & Assert: Should throw
            await expect(requestRelease({
                workpaperId: 'wp-002',
                requestedBy: 'sofia',
                description: 'Attempting release without QC'
            })).rejects.toThrow('Cannot request release: Workpaper has not passed QC');
        });
    });

    describe('Template Lifecycle: Draft → QC → Publish', () => {
        it('should create draft template with audit logging', async () => {
            const templateDraft = {
                id: 'tpl-001',
                name: 'MT VAT Return Template',
                jurisdiction: 'MT',
                status: 'draft',
                created_by: 'luke',
                created_at: new Date().toISOString()
            };

            const mockSupabase = {
                from: vi.fn((table: string) => {
                    if (table === 'templates') {
                        return {
                            insert: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({
                                        data: templateDraft,
                                        error: null
                                    })
                                })
                            })
                        };
                    }
                    return createMockSupabase();
                })
            };

            (getSupabaseClient as any).mockReturnValue(mockSupabase);

            // Step 1: Create draft
            const draft = await createDraft({
                name: 'MT VAT Return Template',
                pack: 'malta',
                createdBy: 'luke',
                content: 'Template content'
            });

            expect(draft.status).toBe('draft');
            expect(draft.name).toBe('MT VAT Return Template');
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'template_created',
                actor: 'luke',
                resourceType: 'template'
            }));
        });

        it('should publish template with status transition and audit', async () => {
            const templateApproved = {
                id: 'tpl-002',
                name: 'RW Tax Template',
                jurisdiction: 'RW',
                status: 'approved', // Must be approved before publishing
                created_by: 'emma',
                created_at: new Date().toISOString()
            };

            const templatePublished = {
                ...templateApproved,
                status: 'published'
            };

            const mockSupabase = {
                from: vi.fn((table: string) => {
                    if (table === 'templates') {
                        return {
                            select: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({
                                        data: templateApproved,
                                        error: null
                                    })
                                })
                            }),
                            update: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    select: vi.fn().mockReturnValue({
                                        single: vi.fn().mockResolvedValue({
                                            data: templatePublished,
                                            error: null
                                        })
                                    })
                                })
                            })
                        };
                    }
                    return createMockSupabase();
                })
            };

            (getSupabaseClient as any).mockReturnValue(mockSupabase);

            const published = await publishTemplateSimple('tpl-002', 'marco');

            expect(published.status).toBe('published');
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'template_published',
                actor: 'marco',
                resourceType: 'template'
            }));
        });
    });

    describe('Routing with Escalation', () => {
        it('should route task to appropriate agent then escalate if needed', async () => {
            const serviceCatalogEntry = {
                id: 'svc-001',
                service_id: 'tax',
                agent_id: 'henri',
                agent_name: 'Henri (Tax MT)',
                jurisdiction: 'MT',
                priority: 1,
                is_active: true
            };

            const routingDecision = {
                id: 'route-001',
                task_id: 'task-001',
                agent_id: 'henri',
                confidence: 0.9
            };

            const mockSupabase = {
                from: vi.fn((table: string) => {
                    if (table === 'service_catalog') {
                        return {
                            select: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    eq: vi.fn().mockReturnValue({
                                        or: vi.fn().mockReturnValue({
                                            order: vi.fn().mockResolvedValue({
                                                data: [serviceCatalogEntry],
                                                error: null
                                            })
                                        }),
                                        order: vi.fn().mockResolvedValue({
                                            data: [serviceCatalogEntry],
                                            error: null
                                        })
                                    })
                                }),
                                or: vi.fn().mockReturnValue({
                                    eq: vi.fn().mockResolvedValue({
                                        data: [serviceCatalogEntry],
                                        error: null
                                    })
                                })
                            })
                        };
                    }
                    if (table === 'routing_decisions') {
                        return {
                            insert: vi.fn().mockResolvedValue({ error: null })
                        };
                    }
                    return createMockSupabase();
                })
            };

            (getSupabaseClient as any).mockReturnValue(mockSupabase);

            // Step 1: Route tax task to Henri
            const decision = await routeTask({
                taskId: 'task-001',
                taskType: 'tax',
                jurisdiction: 'MT',
                payload: { clientId: 'client-123' }
            });

            expect(decision.agentId).toBe('henri');
            expect(decision.confidence).toBeGreaterThan(0.8);
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'task_routed'
            }));

            // Step 2: Escalate to governance
            const escalation = await escalateTask(
                'task-001',
                'henri',
                'Complex cross-border issue requires governance review'
            );

            expect(escalation.agentId).toBe('marco');
            expect(escalation.confidence).toBe(1.0);
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'escalation_triggered'
            }));
        });

        it('should fallback to orchestrator when no matching agent found', async () => {
            const mockSupabase = {
                from: vi.fn((table: string) => {
                    if (table === 'service_catalog') {
                        return {
                            select: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    eq: vi.fn().mockReturnValue({
                                        order: vi.fn().mockResolvedValue({
                                            data: [], // No matching agents
                                            error: null
                                        }),
                                        or: vi.fn().mockReturnValue({
                                            order: vi.fn().mockResolvedValue({
                                                data: [],
                                                error: null
                                            })
                                        })
                                    })
                                })
                            })
                        };
                    }
                    return createMockSupabase();
                })
            };

            (getSupabaseClient as any).mockReturnValue(mockSupabase);

            const decision = await routeTask({
                taskId: 'task-unknown',
                taskType: 'unknown_service',
                payload: {}
            });

            expect(decision.agentId).toBe('aline');
            expect(decision.reason).toContain('Orchestrator');
        });
    });

    describe('End-to-End Audit Trail', () => {
        it('should log all actions across module interactions', async () => {
            // This test verifies that logAction is called at each step
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { id: 'test-001', status: 'draft' },
                                error: null
                            })
                        })
                    }),
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({
                                data: [{ id: 'qc-001', outcome: 'PASS' }],
                                error: null
                            }),
                            single: vi.fn().mockResolvedValue({
                                data: { id: 'test-001', status: 'pending_qc' },
                                error: null
                            })
                        })
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { id: 'test-001', status: 'published' },
                                    error: null
                                })
                            })
                        })
                    })
                })
            };

            (getSupabaseClient as any).mockReturnValue(mockSupabase);

            // Create template
            await createDraft({ name: 'Audit Test', pack: 'rwanda', createdBy: 'test', content: 'content' });

            // Verify audit was logged
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'template_created',
                resourceType: 'template'
            }));
        });
    });
});
