
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDraft, submitForQC, publishTemplateSimple, TemplateSimple } from './index.js';
import { logAction } from '../audit_log/index.js';
import { executeQCGate } from '../qc_gates/index.js';

// Mock dependencies
vi.mock('../lib/db', () => ({
    getSupabaseClient: vi.fn()
}));

vi.mock('../audit_log/index.js', () => ({
    logAction: vi.fn()
}));

vi.mock('../qc_gates/index.js', () => ({
    executeQCGate: vi.fn()
}));

vi.mock('@firmos/core', () => ({
    getEnabledJurisdictions: vi.fn(() => [{ code: 'MT' }, { code: 'RW' }])
}));

import { getSupabaseClient } from '../lib/db.js';

describe('Template Factory Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createDraft', () => {
        it('should create a new template draft', async () => {
            const mockSingle = vi.fn().mockResolvedValue({
                data: {
                    id: 'tpl-1',
                    name: 'VAT Return',
                    pack: 'malta',
                    version: '1.0.0',
                    status: 'draft',
                    created_by: 'agent-sofia',
                    created_at: new Date().toISOString(),
                    content: '{}',
                    metadata: {}
                },
                error: null
            });

            (getSupabaseClient as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: mockSingle
                        })
                    })
                })
            });

            const result = await createDraft({
                name: 'VAT Return',
                pack: 'malta',
                createdBy: 'agent-sofia',
                content: '{}'
            });

            expect(result.status).toBe('draft');
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'template_created'
            }));
        });
    });

    describe('submitForQC', () => {
        it('should transition to approved if QC passes', async () => {
            const mockSelectSingle = vi.fn().mockResolvedValue({
                data: { id: 'tpl-1', status: 'draft', created_at: new Date().toISOString() },
                error: null
            });
            const mockUpdateSingle = vi.fn().mockResolvedValue({
                data: {
                    id: 'tpl-1',
                    status: 'approved',
                    created_at: new Date().toISOString()
                },
                error: null
            });

            (executeQCGate as any).mockResolvedValue({ outcome: 'PASS' });

            (getSupabaseClient as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: mockSelectSingle
                        })
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: mockUpdateSingle
                            })
                        })
                    })
                })
            });

            const result = await submitForQC('tpl-1', 'agent-diane');

            expect(result.status).toBe('approved');
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'qc_submitted'
            }));
        });
    });

    describe('publishTemplateSimple', () => {
        it('should throw if template not approved', async () => {
            const mockSelectSingle = vi.fn().mockResolvedValue({
                data: { id: 'tpl-1', status: 'draft', created_at: new Date().toISOString() },
                error: null
            });

            (getSupabaseClient as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: mockSelectSingle
                        })
                    })
                })
            });

            await expect(publishTemplateSimple('tpl-1', 'agent-marco')).rejects.toThrow('Template has not been approved');
        });

        it('should publish an approved template', async () => {
            const mockSelectSingle = vi.fn().mockResolvedValue({
                data: { id: 'tpl-1', status: 'approved', created_at: new Date().toISOString() },
                error: null
            });
            const mockUpdateSingle = vi.fn().mockResolvedValue({
                data: {
                    id: 'tpl-1',
                    status: 'published',
                    created_at: new Date().toISOString()
                },
                error: null
            });

            (getSupabaseClient as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: mockSelectSingle
                        })
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: mockUpdateSingle
                            })
                        })
                    })
                })
            });

            const result = await publishTemplateSimple('tpl-1', 'agent-marco');

            expect(result.status).toBe('published');
            expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
                action: 'template_published'
            }));
        });
    });
});
