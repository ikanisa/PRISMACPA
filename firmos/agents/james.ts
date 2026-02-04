/**
 * Agent: James — Advisory & Consulting Engine (CFO/Transformation)
 * 
 * Virtual CFO, finance transformation, investment case modeling.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentJames: AgentManifest = {
    id: 'agent_james',
    name: 'James',
    title: 'Advisory & Consulting Engine (CFO/Transformation)',
    primary_functions: [
        'Virtual CFO (budget/forecast/runway/board packs)',
        'Finance transformation (process redesign, close optimization)',
        'Investment case and scenario modeling'
    ],
    owns_services: ['svc_advisory_consulting'],
    supports_services: ['svc_risk_controls_internal_audit'],
    allowed_packs: ['GLOBAL'],
    programs: ['advisory_cfo_program'],
    outputs: [
        'scope_brief',
        'diagnostic_summary',
        'scenario_model',
        'recommendation_memo',
        'implementation_roadmap',
        'board_pack',
        'sop_pack'
    ],
    external_actions: [
        {
            action: 'deliver_advisory_pack',
            autonomy: 'AUTO_CHECK',
            gated_by: ['guardian_pass', 'policy_allows_release']
        }
    ]
};
