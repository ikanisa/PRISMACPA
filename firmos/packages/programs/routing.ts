/**
 * FirmOS Service Routing
 * 
 * Routes requests to the correct service based on jurisdiction and service type.
 */

import type { ServiceDefinition } from './service-catalog.js';
import { ALL_SERVICES } from './service-catalog.js';

// =============================================================================
// TYPES
// =============================================================================

export type Jurisdiction = 'malta' | 'rwanda' | 'global';
export type ServiceKey =
    | 'audit'
    | 'accounting'
    | 'advisory'
    | 'risk_internal_audit'
    | 'tax'
    | 'csp'
    | 'private_notary';

export interface RouteQuery {
    jurisdiction?: Jurisdiction;
    service: ServiceKey;
}

export interface RouteResult {
    service: ServiceDefinition | null;
    serviceId: string | null;
    error?: string;
}

// =============================================================================
// ROUTING RULES
// =============================================================================

/**
 * Routing rules mapping jurisdiction + service to service ID.
 * Order matters: more specific rules should come first.
 */
const ROUTING_RULES: Array<{
    condition: (query: RouteQuery) => boolean;
    serviceId: string;
}> = [
        // Malta-specific
        {
            condition: (q) => q.jurisdiction === 'malta' && q.service === 'tax',
            serviceId: 'svc_mt_tax'
        },
        {
            condition: (q) => q.jurisdiction === 'malta' && q.service === 'csp',
            serviceId: 'svc_mt_csp_mbr'
        },

        // Rwanda-specific
        {
            condition: (q) => q.jurisdiction === 'rwanda' && q.service === 'tax',
            serviceId: 'svc_rw_tax'
        },
        {
            condition: (q) => q.jurisdiction === 'rwanda' && q.service === 'private_notary',
            serviceId: 'svc_rw_private_notary'
        },

        // Global services (no jurisdiction required)
        {
            condition: (q) => q.service === 'audit',
            serviceId: 'svc_audit_assurance'
        },
        {
            condition: (q) => q.service === 'accounting',
            serviceId: 'svc_accounting_fin_reporting'
        },
        {
            condition: (q) => q.service === 'advisory',
            serviceId: 'svc_advisory_consulting'
        },
        {
            condition: (q) => q.service === 'risk_internal_audit',
            serviceId: 'svc_risk_controls_internal_audit'
        }
    ];

// =============================================================================
// SERVICE INDEX
// =============================================================================

/** Map of service ID to service definition */
const SERVICE_INDEX = new Map<string, ServiceDefinition>(
    ALL_SERVICES.map(svc => [svc.id, svc])
);

// =============================================================================
// ROUTING FUNCTIONS
// =============================================================================

/**
 * Route a query to the appropriate service.
 * 
 * @example
 * // Malta tax
 * routeService({ jurisdiction: 'malta', service: 'tax' })
 * // → { service: svcMtTax, serviceId: 'svc_mt_tax' }
 * 
 * @example
 * // Global audit
 * routeService({ service: 'audit' })
 * // → { service: svcAuditAssurance, serviceId: 'svc_audit_assurance' }
 */
export function routeService(query: RouteQuery): RouteResult {
    // Find matching rule
    const rule = ROUTING_RULES.find(r => r.condition(query));

    if (!rule) {
        return {
            service: null,
            serviceId: null,
            error: `No service found for query: ${JSON.stringify(query)}`
        };
    }

    const service = SERVICE_INDEX.get(rule.serviceId);

    if (!service) {
        return {
            service: null,
            serviceId: rule.serviceId,
            error: `Service ${rule.serviceId} not found in catalog`
        };
    }

    return {
        service,
        serviceId: rule.serviceId
    };
}

/**
 * Get a service by its ID directly.
 */
export function getServiceById(serviceId: string): ServiceDefinition | undefined {
    return SERVICE_INDEX.get(serviceId);
}

/**
 * Get all services for a specific jurisdiction.
 */
export function getServicesByJurisdiction(jurisdiction: Jurisdiction): ServiceDefinition[] {
    if (jurisdiction === 'global') {
        return ALL_SERVICES.filter(s => s.scope === 'global');
    }
    return ALL_SERVICES.filter(s => s.scope === jurisdiction || s.scope === 'global');
}

/**
 * Get service IDs available for a jurisdiction.
 */
export function getAvailableServiceIds(jurisdiction?: Jurisdiction): string[] {
    if (!jurisdiction) {
        return ALL_SERVICES.map(s => s.id);
    }
    return getServicesByJurisdiction(jurisdiction).map(s => s.id);
}

// =============================================================================
// RELEASE CONTROL HELPERS
// =============================================================================

/**
 * Check if an external action requires escalation.
 * External submissions/filings default to ESCALATE unless policy explicitly enables auto-release.
 */
export function requiresEscalation(
    service: ServiceDefinition,
    actionName: string
): boolean {
    const action = service.externalActions.find(a => a.action === actionName);
    if (!action) {
        // Unknown action - escalate by default
        return true;
    }
    return action.defaultAutonomy === 'ESCALATE';
}

/**
 * Check if an action requires Guardian pass.
 * All client-facing delivery requires Guardian PASS.
 */
export function requiresGuardianPass(
    service: ServiceDefinition,
    actionName: string
): boolean {
    const action = service.externalActions.find(a => a.action === actionName);
    if (!action) {
        // Unknown action - require guardian by default
        return true;
    }
    return action.requires.includes('guardian_pass');
}
