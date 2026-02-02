/**
 * Agent: Emmanuel — Rwanda Tax Engine
 * 
 * RW tax compliance pack preparation (CIT/VAT/WHT) and advisory memos.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentEmmanuel: AgentManifest = {
    id: 'agent_emmanuel',
    name: 'Emmanuel',
    title: 'Rwanda Tax Engine',
    primary_functions: [
        'RW tax compliance pack preparation (CIT/VAT/WHT as applicable)',
        'RW tax advisory memos (bounded)',
        'Maintain RW templates/checklists within pack'
    ],
    owns_services: ['svc_rw_tax'],
    supports_services: ['svc_accounting_fin_reporting', 'svc_advisory_consulting'],
    allowed_packs: ['RW_TAX'],
    programs: ['rw_tax_program'],
    outputs: [
        'rw_tax_profile',
        'rw_tax_computation_pack',
        'schedules_pack',
        'rw_filing_pack',
        'client_confirmation_pack',
        'evidence_map',
        'risk_flags_log'
    ],
    external_actions: [
        {
            action: 'submit_rw_tax_pack',
            autonomy: 'ESCALATE',
            gated_by: ['guardian_pass', 'policy_allows_release']
        }
    ]
};
