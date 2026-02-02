/**
 * FirmOS Audit Log Module
 *
 * Provides audit trail and incident logging functionality.
 * Re-exports from firmos/packages/policies for a clean module interface.
 */

// Re-export from policies package
export {
    Incident,
    IncidentType,
    IncidentSeverity,
    IncidentSchema,
    logIncident,
    logPackLeakage,
    logGateBypassAttempt,
    logUnauthorizedToolAccess,
    resolveIncident,
    getIncidents,
    getUnresolvedIncidents,
    getCriticalIncidents,
    getIncidentCount,
    hasBlockingIncidents,
} from '../../packages/policies/src/incident-log.js';

// Module-specific types
export interface AuditEvent {
    id: string;
    timestamp: Date;
    actor_agent: string;
    action: string;
    target_type: 'case' | 'task' | 'document' | 'evidence' | 'config';
    target_id: string;
    pack_id?: string;
    metadata?: Record<string, unknown>;
}

export interface AuditLogConfig {
    retention_days: number;
    include_metadata: boolean;
    redact_pii: boolean;
}

// Note: Full implementation would go here
// For now, this module provides the interface and re-exports

