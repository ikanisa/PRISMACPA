
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeQCGate, getQCHistory, QCRequest } from './index.js';
import { logAction } from '../audit_log/index.js';

// Mock dependencies
vi.mock('../lib/db', () => ({
    getSupabaseClient: vi.fn()
}));

vi.mock('../audit_log/index.js', () => ({
    logAction: vi.fn()
}));

// Mock @firmos/core
vi.mock('@firmos/core', () => ({
    loadFirmOSConfig: vi.fn(() => ({
        policies: {
            gates: {
                qc_gate: {
                    required_checks: ['syntax_check', 'policy_check']
                }
            }
        }
    })),
    requiresQCGate: vi.fn(() => true),
    getQCGateOwner: vi.fn(() => 'diane'),
    getAgentById: vi.fn()
}));

import { getSupabaseClient } from '../lib/db.js';

describe('QC Gates Module', () => {
    const mockInsert = vi.fn();
    const mockSelect = vi.fn();
    const mockEq = vi.fn();
    const mockSingle = vi.fn();
    const mockOrder = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup Supabase mock chain
        (getSupabaseClient as any).mockReturnValue({
            from: vi.fn().mockReturnValue({
                insert: mockInsert.mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: mockSingle
                    })
                }),
                select: mockSelect.mockReturnValue({
                    eq: mockEq.mockReturnValue({
                        order: mockOrder
                    })
                })
            })
        });
    });

    describe('executeQCGate', () => {
        const request: QCRequest = {
            workpaperId: 'wp-123',
            serviceType: 'tax_return',
            agentId: 'agent-007',
            submittedBy: 'agent-007'
        };

        it('should execute checks and record PASS result', async () => {
            // Mock DB return
            mockSingle.mockResolvedValue({
                data: {
                    id: 'qc-result-uuid',
                    workpaper_id: request.workpaperId,
                    outcome: 'PASS',
                    reviewed_by: 'diane',
                    reviewed_at: new Date().toISOString(),
                    findings: [],
                    metadata: {}
                },
                error: null
            });

            const result = await executeQCGate(request);

            expect(result.id).toBe('qc-result-uuid');
            expect(result.outcome).toBe('PASS');
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                workpaper_id: 'wp-123',
                agent_id: 'agent-007'
            }));
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'qc_gate_executed',
                resourceId: 'qc-result-uuid'
            }));
        });

        it('should throw error on DB failure', async () => {
            mockSingle.mockResolvedValue({
                data: null,
                error: { message: 'DB Error' }
            });

            await expect(executeQCGate(request)).rejects.toThrow('Failed to record QC result');
        });
    });

    describe('getQCHistory', () => {
        it('should return list of QC results', async () => {
            mockOrder.mockResolvedValue({
                data: [
                    {
                        id: 'qc-1',
                        workpaper_id: 'wp-123',
                        outcome: 'FAIL',
                        reviewed_at: new Date().toISOString()
                    },
                    {
                        id: 'qc-2',
                        workpaper_id: 'wp-123',
                        outcome: 'PASS',
                        reviewed_at: new Date().toISOString()
                    }
                ],
                error: null
            });

            const history = await getQCHistory('wp-123');

            expect(history).toHaveLength(2);
            expect(history[0].id).toBe('qc-1');
            expect(history[1].outcome).toBe('PASS');
        });
    });
});
