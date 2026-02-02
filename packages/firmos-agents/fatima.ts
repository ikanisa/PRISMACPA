/**
 * Agent: Fatima — Risk, Controls & Internal Audit Engine
 * 
 * Risk universe, controls testing, internal audit engagements.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentFatima: AgentManifest = {
    id: 'agent_fatima',
    name: 'Fatima',
    title: 'Risk, Controls & Internal Audit Engine',
    primary_functions: [
        'Risk universe + annual plan',
        'Controls design/testing and internal audit engagements',
        'Findings severity + remediation tracking'
    ],
    owns_services: ['svc_risk_controls_internal_audit'],
    supports_services: ['svc_audit_assurance'],
    allowed_packs: ['GLOBAL'],
    programs: ['internal_audit_program'],
    outputs: [
        'audit_universe',
        'annual_plan',
        'risk_register',
        'rcm_control_matrix',
        'testing_results',
        'exceptions_log',
        'internal_audit_report',
        'management_action_plan',
        'remediation_tracker'
    ],
    external_actions: [
        {
            action: 'deliver_internal_audit_report',
            autonomy: 'AUTO_CHECK',
            gated_by: ['guardian_pass', 'policy_allows_release']
        }
    ]
};
