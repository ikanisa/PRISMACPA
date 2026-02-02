/**
 * FirmOS Routing Module
 *
 * Provides agent routing and service program dispatch.
 * Re-exports from service programs and catalogs.
 */

// Re-export service program types
export {
    ServiceProgram,
    ProgramTask,
    ProgramPhase,
    AutonomyTier,
    JurisdictionPack,
    EvidenceType,
    AUTONOMY_TIER_DESCRIPTIONS,
    UNIVERSAL_GATES,
    EVIDENCE_MINIMUMS_BY_SERVICE,
    GOVERNANCE_DEFAULTS,
    PROGRAM_AUDIT_ASSURANCE,
} from '../../packages/programs/service-programs.js';

// Routing types
export interface RoutingRequest {
    jurisdiction: 'malta' | 'rwanda' | 'global';
    service_type: string;
    client_id?: string;
    context?: Record<string, unknown>;
}

export interface RoutingDecision {
    service_id: string;
    owner_agent: string;
    pack_id: string;
    program: string;
    confidence: number;
}

/**
 * Route a request to the appropriate service and agent
 */
export function routeRequest(request: RoutingRequest): RoutingDecision {
    // Simple routing based on jurisdiction and service type
    const routingTable: Record<string, { service_id: string; owner_agent: string; pack_id: string }> = {
        'malta:tax': { service_id: 'svc_mt_tax', owner_agent: 'agent_matthew', pack_id: 'MT_TAX' },
        'malta:csp': { service_id: 'svc_mt_csp_mbr', owner_agent: 'agent_claire', pack_id: 'MT_CSP_MBR' },
        'rwanda:tax': { service_id: 'svc_rw_tax', owner_agent: 'agent_emmanuel', pack_id: 'RW_TAX' },
        'rwanda:private_notary': { service_id: 'svc_rw_private_notary', owner_agent: 'agent_chantal', pack_id: 'RW_PRIVATE_NOTARY' },
        'global:audit': { service_id: 'svc_audit_assurance', owner_agent: 'agent_patrick', pack_id: 'GLOBAL' },
        'global:accounting': { service_id: 'svc_accounting_fin_reporting', owner_agent: 'agent_sofia', pack_id: 'GLOBAL' },
        'global:advisory': { service_id: 'svc_advisory_consulting', owner_agent: 'agent_james', pack_id: 'GLOBAL' },
        'global:risk': { service_id: 'svc_risk_controls_internal_audit', owner_agent: 'agent_fatima', pack_id: 'GLOBAL' },
    };

    const key = `${request.jurisdiction}:${request.service_type}`;
    const route = routingTable[key];

    if (!route) {
        throw new Error(`No route found for ${key}`);
    }

    return {
        ...route,
        program: route.service_id,
        confidence: 1.0,
    };
}
