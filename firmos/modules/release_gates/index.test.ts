
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestRelease, authorizeReleaseSimple, ReleaseRequestSimple } from './index.js';
import { logAction } from '../audit_log/index.js';
import { getQCHistory } from '../qc_gates/index.js';

// Mock dependencies
vi.mock('../lib/db', () => ({
    getSupabaseClient: vi.fn()
}));

vi.mock('../audit_log/index.js', () => ({
    logAction: vi.fn()
}));

vi.mock('../qc_gates/index.js', () => ({
    getQCHistory: vi.fn()
}));

vi.mock('@firmos/core', () => ({
    loadFirmOSConfig: vi.fn(() => ({})),
    requiresReleaseGate: vi.fn(() => true),
    getReleaseGateOwner: vi.fn(() => 'marco'),
    getAgentById: vi.fn()
}));

import { getSupabaseClient } from '../lib/db.js';

describe('Release Gates Module', () => {
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();
    const mockSelect = vi.fn();
    const mockSingle = vi.fn();
    const mockEq = vi.fn();

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
                update: mockUpdate.mockReturnValue({
                    eq: mockEq.mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: mockSingle
                        })
                    })
                }),
                select: mockSelect
            })
        });
    });

    describe('requestRelease', () => {
        const req: ReleaseRequestSimple = {
            workpaperId: 'wp-100',
            requestedBy: 'agent-007',
            description: 'Ready for production'
        };

        it('should throw if QC failed', async () => {
            (getQCHistory as any).mockResolvedValue([
                { id: 'qc-1', outcome: 'FAIL' }
            ]);

            await expect(requestRelease(req)).rejects.toThrow('Workpaper has not passed QC');
        });

        it('should create release request if QC passed', async () => {
            (getQCHistory as any).mockResolvedValue([
                { id: 'qc-1', outcome: 'PASS' }
            ]);

            mockSingle.mockResolvedValue({
                data: {
                    id: 'rel-1',
                    workpaper_id: 'wp-100',
                    status: 'pending_authorization',
                    requested_by: 'agent-007',
                    requested_at: new Date().toISOString(),
                    metadata: {}
                },
                error: null
            });

            const result = await requestRelease(req);

            expect(result.status).toBe('pending_authorization');
            expect(mockInsert).toHaveBeenCalled();
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'release_requested'
            }));
        });
    });

    describe('authorizeReleaseSimple', () => {
        it('should update status to authorized', async () => {
            mockSingle.mockResolvedValue({
                data: {
                    id: 'rel-1',
                    status: 'authorized',
                    authorized_by: 'marco',
                    authorized_at: new Date().toISOString(),
                    metadata: {}
                },
                error: null
            });

            const result = await authorizeReleaseSimple('rel-1', 'authorized', 'marco');

            expect(result.status).toBe('authorized');
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                status: 'authorized'
            }));
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'release_authorized'
            }));
        });
    });
});
