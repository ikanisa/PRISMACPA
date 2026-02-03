
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCase, updateCaseStatus, assignAgent, listCases } from './index.js';
import { logAction } from '../audit_log/index.js';

// Mock dependencies
vi.mock('../audit_log/index.js', () => ({
    logAction: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}));

// Supabase Mock
const mockBuilder: any = {
    then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve)
};

// Add methods
mockBuilder.select = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.insert = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.update = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.single = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.order = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.eq = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.gte = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.lte = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.limit = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.range = vi.fn().mockReturnValue(mockBuilder);

const mockSupabase = {
    from: vi.fn(() => mockBuilder),
};

vi.mock('../lib/db.js', () => ({
    getSupabaseClient: () => mockSupabase,
}));

describe('Case Management Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default then implementation
        mockBuilder.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
    });

    it('should create a case', async () => {
        const mockCase = {
            id: 'case-1',
            client_id: 'client-1',
            client_name: 'Acme Corp',
            jurisdiction: 'MT',
            service_type: 'tax_filing',
            status: 'intake',
            created_at: new Date().toISOString(),
            metadata: {},
        };

        mockBuilder.then = (resolve: any) => Promise.resolve({ data: mockCase, error: null }).then(resolve);

        const result = await createCase({
            clientId: 'client-1',
            clientName: 'Acme Corp',
            jurisdiction: 'MT',
            serviceType: 'tax_filing',
        });

        // Verify DB Insert
        expect(mockSupabase.from).toHaveBeenCalledWith('cases');
        expect(mockBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
            client_id: 'client-1',
            jurisdiction: 'MT',
            status: 'intake',
        }));

        // Verify Audit Log
        expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
            action: 'case_created',
            resourceType: 'case',
            resourceId: 'case-1',
        }));

        expect(result.id).toBe('case-1');
    });

    it('should update case status', async () => {
        const mockCase = {
            id: 'case-1',
            status: 'active',
            created_at: new Date().toISOString(),
        };

        // Mock getCase first, then update
        mockBuilder.then = vi.fn()
            .mockImplementationOnce((resolve) => Promise.resolve({ data: { ...mockCase, status: 'intake' }, error: null }).then(resolve)) // current
            .mockImplementationOnce((resolve) => Promise.resolve({ data: mockCase, error: null }).then(resolve)); // updated

        const result = await updateCaseStatus('case-1', 'active');

        // Verify DB Update
        expect(mockSupabase.from).toHaveBeenCalledWith('cases');
        expect(mockBuilder.update).toHaveBeenCalledWith({ status: 'active' });
        expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'case-1');

        // Verify Audit Log
        expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
            action: 'case_status_changed',
            resourceId: 'case-1',
            details: expect.objectContaining({ from: 'intake', to: 'active' })
        }));

        expect(result.status).toBe('active');
    });

    it('should assign an agent', async () => {
        const mockCase = {
            id: 'case-1',
            assigned_agent: 'agent-1',
            created_at: new Date().toISOString(),
        };

        // Mock getCase first, then update
        mockBuilder.then = vi.fn()
            .mockImplementationOnce((resolve) => Promise.resolve({ data: { ...mockCase, assigned_agent: null }, error: null }).then(resolve)) // current
            .mockImplementationOnce((resolve) => Promise.resolve({ data: mockCase, error: null }).then(resolve)); // updated

        const result = await assignAgent('case-1', 'agent-1');

        expect(mockBuilder.update).toHaveBeenCalledWith({ assigned_agent: 'agent-1' });
        expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
            action: 'agent_assigned',
            details: expect.objectContaining({ agentId: 'agent-1' })
        }));

        expect(result.assignedAgent).toBe('agent-1');
    });
});
