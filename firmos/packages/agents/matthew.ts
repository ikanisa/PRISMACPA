/**
 * Agent: Matthew — Malta Tax Engine
 * 
 * MT tax compliance pack preparation and advisory memos.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentMatthew: AgentManifest = {
    id: 'agent_matthew',
    name: 'Matthew',
    title: 'Malta Tax Engine',
    primary_functions: [
        'MT tax compliance pack preparation',
        'MT tax advisory memos (bounded)',
        'Maintain MT tax templates/checklists within pack'
    ],
    owns_services: ['svc_mt_tax'],
    supports_services: ['svc_accounting_fin_reporting', 'svc_advisory_consulting'],
    allowed_packs: ['MT_TAX'],
    programs: ['mt_tax_program'],
    outputs: [
        'mt_tax_profile',
        'tax_bridge',
        'schedules_pack',
        'mt_filing_pack',
        'client_confirmation_pack',
        'evidence_map',
        'positions_memo_if_needed'
    ],
    external_actions: [
        {
            action: 'submit_mt_tax_pack',
            autonomy: 'ESCALATE',
            gated_by: ['guardian_pass', 'policy_allows_release']
        }
    ]
};
