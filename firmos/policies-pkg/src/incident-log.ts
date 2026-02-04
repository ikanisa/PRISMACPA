/**
 * FirmOS Incident Log — Security & Compliance Incident Tracking
 *
 * Tracks critical incidents:
 * - Pack leakage attempts (MT/RW separation violations)
 * - Gate bypass attempts
 * - Repeated contradictions
 * - Missing evidence patterns
 * - Release bypass attempts
 */

import { z } from 'zod';

// =============================================================================
// TYPES
// =============================================================================

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentType =
    | 'PACK_LEAKAGE'
    | 'GATE_BYPASS_ATTEMPT'
    | 'RELEASE_BYPASS_ATTEMPT'
    | 'EVIDENCE_MISSING_PATTERN'
    | 'REPEATED_CONTRADICTION'
    | 'UNAUTHORIZED_TOOL_ACCESS'
    | 'POLICY_VIOLATION';

export interface Incident {
    id: string;
    type: IncidentType;
    severity: IncidentSeverity;
    description: string;
    workstreamId?: string;
    agentId: string;
    packId?: string;
    details: Record<string, unknown>;
    createdAt: Date;
    resolvedAt?: Date;
    resolution?: string;
}

// =============================================================================
// SCHEMAS
// =============================================================================

export const IncidentSchema = z.object({
    id: z.string().uuid(),
    type: z.enum([
        'PACK_LEAKAGE',
        'GATE_BYPASS_ATTEMPT',
        'RELEASE_BYPASS_ATTEMPT',
        'EVIDENCE_MISSING_PATTERN',
        'REPEATED_CONTRADICTION',
        'UNAUTHORIZED_TOOL_ACCESS',
        'POLICY_VIOLATION'
    ]),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    description: z.string().min(1),
    workstreamId: z.string().optional(),
    agentId: z.string(),
    packId: z.string().optional(),
    details: z.record(z.string(), z.unknown()),
    createdAt: z.coerce.date(),
    resolvedAt: z.coerce.date().optional(),
    resolution: z.string().optional()
});

// =============================================================================
// INCIDENT LOG STATE
// =============================================================================

const incidents: Incident[] = [];

// =============================================================================
// SEVERITY RULES
// =============================================================================

const SEVERITY_BY_TYPE: Record<IncidentType, IncidentSeverity> = {
    PACK_LEAKAGE: 'CRITICAL',
    GATE_BYPASS_ATTEMPT: 'HIGH',
    RELEASE_BYPASS_ATTEMPT: 'HIGH',
    EVIDENCE_MISSING_PATTERN: 'MEDIUM',
    REPEATED_CONTRADICTION: 'MEDIUM',
    UNAUTHORIZED_TOOL_ACCESS: 'HIGH',
    POLICY_VIOLATION: 'MEDIUM'
};

// =============================================================================
// LOGGING FUNCTIONS
// =============================================================================

/**
 * Log an incident.
 */
export function logIncident(
    type: IncidentType,
    description: string,
    agentId: string,
    details: Record<string, unknown> = {},
    workstreamId?: string,
    packId?: string,
    severityOverride?: IncidentSeverity
): Incident {
    const incident: Incident = {
        id: crypto.randomUUID(),
        type,
        severity: severityOverride || SEVERITY_BY_TYPE[type],
        description,
        workstreamId,
        agentId,
        packId,
        details,
        createdAt: new Date()
    };

    // Validate
    IncidentSchema.parse(incident);

    // Store
    incidents.push(incident);

    // Log to console for critical/high
    if (incident.severity === 'CRITICAL' || incident.severity === 'HIGH') {
        console.error(`[INCIDENT][${incident.severity}] ${incident.type}: ${description}`, details);
    }

    return incident;
}

/**
 * Log a pack leakage attempt (CRITICAL severity).
 */
export function logPackLeakage(
    agentId: string,
    attemptedPack: string,
    allowedPacks: string[],
    workstreamId?: string
): Incident {
    return logIncident(
        'PACK_LEAKAGE',
        `Agent ${agentId} attempted to access pack ${attemptedPack} but is only allowed: ${allowedPacks.join(', ')}`,
        agentId,
        { attemptedPack, allowedPacks },
        workstreamId,
        attemptedPack
    );
}

/**
 * Log a gate bypass attempt.
 */
export function logGateBypassAttempt(
    agentId: string,
    gateType: 'GUARDIAN' | 'RELEASE',
    reason: string,
    workstreamId?: string
): Incident {
    const type = gateType === 'RELEASE' ? 'RELEASE_BYPASS_ATTEMPT' : 'GATE_BYPASS_ATTEMPT';
    return logIncident(
        type,
        `Agent ${agentId} attempted to bypass ${gateType} gate: ${reason}`,
        agentId,
        { gateType, reason },
        workstreamId
    );
}

/**
 * Log unauthorized tool access attempt.
 */
export function logUnauthorizedToolAccess(
    agentId: string,
    toolName: string,
    requiredToolGroup: string
): Incident {
    return logIncident(
        'UNAUTHORIZED_TOOL_ACCESS',
        `Agent ${agentId} attempted to use ${toolName} without ${requiredToolGroup} permission`,
        agentId,
        { toolName, requiredToolGroup }
    );
}

/**
 * Resolve an incident.
 */
export function resolveIncident(incidentId: string, resolution: string): Incident | null {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) { return null; }

    incident.resolvedAt = new Date();
    incident.resolution = resolution;

    return incident;
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

export function getIncidents(filter?: {
    type?: IncidentType;
    severity?: IncidentSeverity;
    resolved?: boolean;
    agentId?: string;
    workstreamId?: string;
}): Incident[] {
    let result = [...incidents];

    if (filter?.type) {
        result = result.filter(i => i.type === filter.type);
    }
    if (filter?.severity) {
        result = result.filter(i => i.severity === filter.severity);
    }
    if (filter?.resolved !== undefined) {
        result = result.filter(i => (filter.resolved ? i.resolvedAt : !i.resolvedAt));
    }
    if (filter?.agentId) {
        result = result.filter(i => i.agentId === filter.agentId);
    }
    if (filter?.workstreamId) {
        result = result.filter(i => i.workstreamId === filter.workstreamId);
    }

    return result;
}

export function getUnresolvedIncidents(): Incident[] {
    return incidents.filter(i => !i.resolvedAt);
}

export function getCriticalIncidents(): Incident[] {
    return incidents.filter(i => i.severity === 'CRITICAL');
}

export function getIncidentCount(): { total: number; byType: Record<IncidentType, number>; bySeverity: Record<IncidentSeverity, number> } {
    const byType = {} as Record<IncidentType, number>;
    const bySeverity = {} as Record<IncidentSeverity, number>;

    for (const incident of incidents) {
        byType[incident.type] = (byType[incident.type] || 0) + 1;
        bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
    }

    return { total: incidents.length, byType, bySeverity };
}

/**
 * Check if there are any unresolved critical incidents (blocks releases).
 */
export function hasBlockingIncidents(): boolean {
    return incidents.some(i => i.severity === 'CRITICAL' && !i.resolvedAt);
}
