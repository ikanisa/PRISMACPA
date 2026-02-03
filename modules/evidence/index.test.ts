
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachEvidence, validateEvidenceSufficiency, scoreEvidence, EvidenceUploadOps } from './index.js';
import { logAction } from '../audit_log/index.js';

// Mock dependencies
vi.mock('../audit_log/index.js', () => ({
    logAction: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}));

// Supabase Mock
const mockUpload = vi.fn();
const mockRemove = vi.fn();

const mockBuilder: any = {
    then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve)
};

// Add methods
mockBuilder.select = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.insert = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.single = vi.fn().mockReturnValue(mockBuilder);
mockBuilder.from = vi.fn().mockReturnValue(mockBuilder); // For chaining if needed

const mockStorage = {
    from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
    })),
};

const mockSupabase = {
    from: vi.fn(() => mockBuilder),
    storage: mockStorage,
};

vi.mock('../lib/db.js', () => ({
    getSupabaseClient: () => mockSupabase,
}));

describe('Evidence Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default then implementation
        mockBuilder.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
        mockUpload.mockResolvedValue({ data: { path: 'uploaded/path' }, error: null });
    });

    it('should attach evidence (upload + db)', async () => {
        const mockDbEntry = {
            id: 'ev-1',
            type: 'source_document',
            filename: 'test.pdf',
            storage_path: 'wp-1/123_test.pdf',
            uploaded_at: new Date().toISOString(),
            uploaded_by: 'user-1',
            workpaper_id: 'wp-1',
            score: 85,
            metadata: {},
        };

        mockBuilder.then = (resolve: any) => Promise.resolve({ data: mockDbEntry, error: null }).then(resolve);

        const ops: EvidenceUploadOps = {
            workpaperId: 'wp-1',
            type: 'source_document',
            filename: 'test.pdf',
            fileContent: Buffer.from('fake content'),
        };

        const result = await attachEvidence(ops, 'user-1');

        // Verify Storage Upload
        expect(mockStorage.from).toHaveBeenCalledWith('evidence');
        expect(mockUpload).toHaveBeenCalledWith(
            expect.stringContaining('wp-1/'),
            ops.fileContent,
            expect.objectContaining({ upsert: false })
        );

        // Verify DB Insert
        expect(mockSupabase.from).toHaveBeenCalledWith('evidence');
        expect(mockBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
            workpaper_id: 'wp-1',
            type: 'source_document',
        }));

        // Verify Audit Log
        expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
            action: 'evidence_attached',
            resourceId: 'ev-1',
        }));

        expect(result.id).toBe('ev-1');
    });

    it('should validate evidence sufficiency', () => {
        const items: any[] = [
            { type: 'source_document', score: 85 },
            { type: 'confirmation', score: 90 },
        ];

        const reqs = {
            serviceType: 'audit',
            requiredTypes: ['source_document', 'confirmation'] as any[],
            minItems: 2,
            retentionYears: 7
        };

        const result = validateEvidenceSufficiency(items, reqs);
        expect(result.sufficient).toBe(true);
        expect(result.missing).toHaveLength(0);
        expect(result.score).toBe(100);
    });

    it('should fail sufficiency if missing types', () => {
        const items: any[] = [
            { type: 'source_document', score: 85 },
        ];

        const reqs = {
            serviceType: 'audit',
            requiredTypes: ['source_document', 'confirmation'] as any[],
            minItems: 2,
            retentionYears: 7
        };

        const result = validateEvidenceSufficiency(items, reqs);
        expect(result.sufficient).toBe(false);
        expect(result.missing).toContain('confirmation');
        expect(result.score).toBeLessThan(100);
    });

    it('should audit score calculation', () => {
        const items: any[] = [
            { score: 80 },
            { score: 100 },
        ];
        const score = scoreEvidence(items);
        expect(score).toBe(90);
    });
});
