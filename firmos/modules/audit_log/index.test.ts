
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAction, queryAuditLog, AuditAction } from './index.js';

// Chainable mocks
const mockBuilder: any = {
    then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve)
};

// Add methods to the builder
mockBuilder.select = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.insert = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.single = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.order = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.eq = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.gte = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.lte = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.limit = vi.fn().mockReturnValue(mockBuilder);

const mockSupabase = {
    from: vi.fn(() => mockBuilder),
};

vi.mock('../lib/db.js', () => ({
    getSupabaseClient: () => mockSupabase,
}));

describe('Audit Log Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default then implementation
        mockBuilder.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
    });

    it('should log an action', async () => {
        const mockData = {
            id: '123',
            timestamp: new Date().toISOString(),
            action: 'case_created',
            actor: 'sofia',
            resource_type: 'case',
            resource_id: 'c1',
            details: {},
        };

        // Mock the resolved value for this test
        mockBuilder.then = (resolve: any) => Promise.resolve({ data: mockData, error: null }).then(resolve);

        const result = await logAction({
            action: 'case_created',
            actor: 'sofia',
            resourceType: 'case',
            resourceId: 'c1',
            details: {},
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_log');
        expect(mockBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
            action: 'case_created',
            actor: 'sofia',
            resource_type: 'case',
            resource_id: 'c1',
        }));
        expect(result.id).toBe('123');
    });

    it('should query audit logs', async () => {
        const mockData = [{
            id: '123',
            timestamp: new Date().toISOString(),
            action: 'case_created',
            actor: 'sofia',
            resource_type: 'case',
            resource_id: 'c1',
            details: {},
        }];

        mockBuilder.then = (resolve: any) => Promise.resolve({ data: mockData, error: null }).then(resolve);

        await queryAuditLog({ action: 'case_created' });

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_log');
        expect(mockBuilder.order).toHaveBeenCalledWith('timestamp', { ascending: false });
        expect(mockBuilder.eq).toHaveBeenCalledWith('action', 'case_created');
    });
});
