/**
 * FirmOS QC Gates Module
 *
 * Provides Diane Guardian QC gate runner functionality.
 * Re-exports from validation and QC gate runner packages.
 */

// Re-export validation schemas and functions
export {
    ValidationResult,
    validateServiceDefinition,
    validateServiceCatalog,
    validateTaskNode,
    validateGlobalQualityRules,
    checkUniqueServiceIds,
    checkUniqueTaskKeys,
    checkMaltaPackConsistency,
    checkRwandaPackConsistency,
    runAllIntegrityChecks,
} from '../../packages/programs/validation.js';

// Re-export QC gate runner
export {
    type QCStatus,
    type QCCheckResult,
    type QCGateResult,
    type QCCheck,
    type QCContext,
    registerQCCheck,
    getAllChecks,
    runQCGate,
    runServiceQC
} from '../../packages/programs/qc-gate-runner.js';
