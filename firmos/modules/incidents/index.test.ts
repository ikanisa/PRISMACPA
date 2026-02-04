
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportIncident, resolveIncident, listIncidents } from './index.js';
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

const mockSupabase = {
    from: vi.fn(() => mockBuilder),
};

vi.mock('../lib/db.js', () => ({
    getSupabaseClient: () => mockSupabase,
}));

describe('Incident Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default then implementation
        mockBuilder.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
    });

    it('should report an incident', async () => {
        const mockIncident = {
            id: 'inc-1',
            description: 'Test Incident',
            severity: 'high',
            status: 'open',
            reported_by: 'user-1',
            detected_at: new Date().toISOString(),
            metadata: {},
        };

        mockBuilder.then = (resolve: any) => Promise.resolve({ data: mockIncident, error: null }).then(resolve);

        const result = await reportIncident({
            description: 'Test Incident',
            severity: 'high',
            reportedBy: 'user-1',
        });

        // Verify DB Insert
        expect(mockSupabase.from).toHaveBeenCalledWith('incidents');
        expect(mockBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
            description: 'Test Incident',
            severity: 'high',
            status: 'open',
            reported_by: 'user-1',
        }));

        // Verify Audit Log
        expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
            action: 'incident_reported',
            resourceType: 'incident',
            resourceId: 'inc-1',
        }));

        expect(result.id).toBe('inc-1');
    });

    it('should resolve an incident', async () => {
        const mockIncident = {
            id: 'inc-1',
            description: 'Test Incident',
            severity: 'high',
            status: 'resolved',
            reported_by: 'user-1',
            detected_at: new Date().toISOString(),
            resolved_at: new Date().toISOString(),
            resolution_notes: 'Fixed it',
        };

        mockBuilder.then = (resolve: any) => Promise.resolve({ data: mockIncident, error: null }).then(resolve);

        const result = await resolveIncident('inc-1', 'Fixed it', 'user-2');

        // Verify DB Update
        expect(mockSupabase.from).toHaveBeenCalledWith('incidents');
        expect(mockBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
            status: 'resolved',
            resolution_notes: 'Fixed it',
        }));
        expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'inc-1');

        // Verify Audit Log
        expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
            action: 'incident_resolved',
            resourceId: 'inc-1',
            actor: 'user-2',
        }));

        expect(result.status).toBe('resolved');
    });

    it('should list incidents with filters', async () => {
        const mockData = [{
            id: 'inc-1',
            severity: 'critical',
            status: 'open',
            detected_at: new Date().toISOString(),
        }];

        mockBuilder.then = (resolve: any) => Promise.resolve({ data: mockData, error: null }).then(resolve);

        const results = await listIncidents({ severity: 'critical' });

        expect(mockBuilder.eq).toHaveBeenCalledWith('severity', 'critical');
        expect(results).toHaveLength(1);
    });
});
