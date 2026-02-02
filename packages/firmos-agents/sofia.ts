/**
 * Agent: Sofia — Accounting & Financial Reporting Engine
 * 
 * Bookkeeping, reconciliations, close cycles, and financial statements.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentSofia: AgentManifest = {
    id: 'agent_sofia',
    name: 'Sofia',
    title: 'Accounting & Financial Reporting Engine',
    primary_functions: [
        'Bookkeeping/GL, reconciliations, close cycles',
        'Financial statements and management reporting packs',
        'Accounting position memos (bounded)'
    ],
    owns_services: ['svc_accounting_fin_reporting'],
    supports_services: [],
    allowed_packs: ['GLOBAL'],
    programs: ['accounting_close_program'],
    outputs: [
        'close_checklist',
        'reconciliations_pack',
        'je_log',
        'fs_pack_pl_bs_cf',
        'notes_pack',
        'management_accounts_pack',
        'variance_analysis'
    ],
    external_actions: [
        {
            action: 'deliver_management_accounts',
            autonomy: 'AUTO_CHECK',
            gated_by: ['guardian_pass', 'policy_allows_release']
        }
    ]
};
