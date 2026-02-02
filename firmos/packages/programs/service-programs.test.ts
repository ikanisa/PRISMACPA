/**
 * FirmOS Service Programs Tests
 * 
 * Tests for service program validation, integrity, and helper functions.
 */

import { describe, it, expect } from 'vitest';
import {
    ServiceProgramSchema,
    ProgramTaskSchema,
    ProgramPhaseSchema,
    UniversalGateSchema,
    GovernanceDefaultsSchema
} from './validation.js';
import {
    ALL_SERVICE_PROGRAMS,
    UNIVERSAL_GATES,
    GOVERNANCE_DEFAULTS,
    getServiceProgram,
    getAllTasks,
    getTask,
    getPhaseForTask,
    requiresDianePass,
    requiresMarcoRelease,
    getEvidenceMinimums,
    countTasksByAutonomy,
    PROGRAM_AUDIT_ASSURANCE,
    PROGRAM_MT_TAX
} from './service-programs.js';

// =============================================================================
// SCHEMA VALIDATION TESTS
// =============================================================================

describe('ServiceProgramSchema', () => {
    it('validates all 8 service programs', () => {
        for (const program of ALL_SERVICE_PROGRAMS) {
            const result = ServiceProgramSchema.safeParse(program);
            expect(result.success).toBe(true);
        }
    });

    it('rejects program without svc_ prefix', () => {
        const invalid = { ...PROGRAM_AUDIT_ASSURANCE, service_id: 'invalid_audit' };
        const result = ServiceProgramSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it('rejects program without phases', () => {
        const invalid = { ...PROGRAM_AUDIT_ASSURANCE, phases: [] };
        const result = ServiceProgramSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});

describe('ProgramTaskSchema', () => {
    it('validates task with correct format', () => {
        const task = PROGRAM_AUDIT_ASSURANCE.phases[0].tasks[0];
        const result = ProgramTaskSchema.safeParse(task);
        expect(result.success).toBe(true);
    });

    it('rejects task with wrong ID format', () => {
        const invalid = {
            task_id: 'invalid_task',
            agent: 'Patrick',
            autonomy: 'AUTO',
            required_outputs: ['output'],
            required_evidence: ['CLIENT_INSTRUCTION'],
            qc_triggers: [],
            escalation_triggers: []
        };
        const result = ProgramTaskSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it('rejects task without outputs', () => {
        const invalid = {
            task_id: 'TST_T01_test',
            agent: 'Patrick',
            autonomy: 'AUTO',
            required_outputs: [],
            required_evidence: ['CLIENT_INSTRUCTION'],
            qc_triggers: [],
            escalation_triggers: []
        };
        const result = ProgramTaskSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});

describe('ProgramPhaseSchema', () => {
    it('validates phase with correct format', () => {
        const phase = PROGRAM_AUDIT_ASSURANCE.phases[0];
        const result = ProgramPhaseSchema.safeParse(phase);
        expect(result.success).toBe(true);
    });

    it('rejects phase with wrong ID format', () => {
        const invalid = {
            phase_id: 'invalid_phase',
            tasks: PROGRAM_AUDIT_ASSURANCE.phases[0].tasks
        };
        const result = ProgramPhaseSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});

describe('UniversalGateSchema', () => {
    it('validates all universal gates', () => {
        for (const gate of UNIVERSAL_GATES) {
            const result = UniversalGateSchema.safeParse(gate);
            expect(result.success).toBe(true);
        }
    });

    it('rejects gate with wrong ID format', () => {
        const invalid = { id: 'invalid_gate', trigger: 'test', enforced_by: 'Diane' };
        const result = UniversalGateSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});

describe('GovernanceDefaultsSchema', () => {
    it('validates governance defaults', () => {
        const result = GovernanceDefaultsSchema.safeParse(GOVERNANCE_DEFAULTS);
        expect(result.success).toBe(true);
    });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('getServiceProgram', () => {
    it('returns program by ID', () => {
        const program = getServiceProgram('svc_audit_assurance');
        expect(program).toBeDefined();
        expect(program?.owner_agent).toBe('Patrick');
    });

    it('returns undefined for unknown ID', () => {
        const program = getServiceProgram('svc_unknown');
        expect(program).toBeUndefined();
    });
});

describe('getAllTasks', () => {
    it('returns all tasks for audit program', () => {
        const tasks = getAllTasks(PROGRAM_AUDIT_ASSURANCE);
        expect(tasks.length).toBe(8);
    });

    it('returns all tasks for MT tax program', () => {
        const tasks = getAllTasks(PROGRAM_MT_TAX);
        expect(tasks.length).toBe(6);
    });
});

describe('getTask', () => {
    it('finds task by ID', () => {
        const task = getTask(PROGRAM_AUDIT_ASSURANCE, 'AUD_T01_acceptance_continuance');
        expect(task).toBeDefined();
        expect(task?.agent).toBe('Patrick');
    });

    it('returns undefined for unknown task', () => {
        const task = getTask(PROGRAM_AUDIT_ASSURANCE, 'AUD_T99_unknown');
        expect(task).toBeUndefined();
    });
});

describe('getPhaseForTask', () => {
    it('finds phase containing task', () => {
        const phase = getPhaseForTask(PROGRAM_AUDIT_ASSURANCE, 'AUD_T01_acceptance_continuance');
        expect(phase).toBeDefined();
        expect(phase?.phase_id).toBe('AUD_P1_acceptance');
    });

    it('returns undefined for unknown task', () => {
        const phase = getPhaseForTask(PROGRAM_AUDIT_ASSURANCE, 'AUD_T99_unknown');
        expect(phase).toBeUndefined();
    });
});

describe('requiresDianePass', () => {
    it('returns true for AUTO_CHECK tasks with G1 gate', () => {
        const task = getTask(PROGRAM_AUDIT_ASSURANCE, 'AUD_T01_acceptance_continuance')!;
        expect(requiresDianePass(task)).toBe(true);
    });

    it('returns false for AUTO tasks without G1 gate', () => {
        const task = getTask(PROGRAM_AUDIT_ASSURANCE, 'AUD_T02_engagement_setup')!;
        expect(requiresDianePass(task)).toBe(false);
    });
});

describe('requiresMarcoRelease', () => {
    it('returns true for release tasks with G2 gate', () => {
        const task = getTask(PROGRAM_MT_TAX, 'MTT_T06_request_submission_release')!;
        expect(requiresMarcoRelease(task)).toBe(true);
    });

    it('returns false for non-release tasks', () => {
        const task = getTask(PROGRAM_MT_TAX, 'MTT_T01_profile_data_request')!;
        expect(requiresMarcoRelease(task)).toBe(false);
    });
});

describe('getEvidenceMinimums', () => {
    it('returns evidence minimums for audit service', () => {
        const minimums = getEvidenceMinimums('svc_audit_assurance');
        expect(minimums).toContain('CLIENT_INSTRUCTION');
        expect(minimums).toContain('FINANCIAL_RECORDS');
        expect(minimums).toContain('WORKPAPER_TRAIL');
    });

    it('returns empty array for unknown service', () => {
        const minimums = getEvidenceMinimums('svc_unknown');
        expect(minimums).toEqual([]);
    });
});

describe('countTasksByAutonomy', () => {
    it('counts tasks by autonomy tier for audit program', () => {
        const counts = countTasksByAutonomy(PROGRAM_AUDIT_ASSURANCE);
        expect(counts.AUTO).toBe(2);
        expect(counts.AUTO_CHECK).toBe(6);
        expect(counts.ESCALATE).toBe(0);
    });

    it('counts tasks by autonomy tier for MT tax program', () => {
        const counts = countTasksByAutonomy(PROGRAM_MT_TAX);
        expect(counts.AUTO).toBe(1);
        expect(counts.AUTO_CHECK).toBe(3);
        expect(counts.ESCALATE).toBe(2);
    });
});

// =============================================================================
// INTEGRITY CHECKS
// =============================================================================

describe('Service Programs Integrity', () => {
    it('has exactly 8 service programs', () => {
        expect(ALL_SERVICE_PROGRAMS.length).toBe(8);
    });

    it('has unique service IDs', () => {
        const ids = ALL_SERVICE_PROGRAMS.map(p => p.service_id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('all programs have Aline as orchestrator', () => {
        for (const program of ALL_SERVICE_PROGRAMS) {
            expect(program.orchestrator_agent).toBe('Aline');
        }
    });

    it('all task IDs within a program are unique', () => {
        for (const program of ALL_SERVICE_PROGRAMS) {
            const allTasks = getAllTasks(program);
            const ids = allTasks.map(t => t.task_id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        }
    });

    it('has exactly 2 universal gates', () => {
        expect(UNIVERSAL_GATES.length).toBe(2);
    });

    it('G2 gate has G1 as prerequisite', () => {
        const g2 = UNIVERSAL_GATES.find(g => g.id === 'GATE_G2_MARCO_FOR_RELEASES');
        expect(g2?.prerequisite).toBe('Diane PASS');
    });
});
