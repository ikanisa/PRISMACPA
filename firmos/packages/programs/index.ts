/**
 * FirmOS Programs Package
 * 
 * Exports service catalog, routing, validation, service programs, template factory, and type definitions.
 */

export * from './service-catalog.js';
export * from './routing.js';
export * from './validation.js';
export * from './template-factory.js';

// Service programs (selective exports to avoid AutonomyTier conflict)
export {
    // Types (unique to service-programs)
    type JurisdictionPack,
    type EvidenceType,
    type ProgramTask,
    type ProgramPhase,
    type ServiceProgram,
    type UniversalGate,
    type NoveltyScoring,
    type ArithmeticIntegrityChecks,
    type PackMismatchBlock,
    type GovernanceDefaults,
    // Constants
    AUTONOMY_TIER_DESCRIPTIONS,
    UNIVERSAL_GATES,
    EVIDENCE_MINIMUMS_BY_SERVICE,
    GOVERNANCE_DEFAULTS,
    // Programs
    PROGRAM_AUDIT_ASSURANCE,
    PROGRAM_ACCOUNTING_FIN_REPORTING,
    PROGRAM_ADVISORY_CONSULTING,
    PROGRAM_RISK_CONTROLS_INTERNAL_AUDIT,
    PROGRAM_MT_TAX,
    PROGRAM_MT_CSP_MBR,
    PROGRAM_RW_TAX,
    PROGRAM_RW_PRIVATE_NOTARY,
    ALL_SERVICE_PROGRAMS,
    SERVICE_PROGRAM_INDEX,
    // Helper functions
    getServiceProgram,
    getAllTasks,
    getTask,
    getPhaseForTask,
    requiresDianePass,
    requiresMarcoRelease,
    getEvidenceMinimums,
    countTasksByAutonomy
} from './service-programs.js';

