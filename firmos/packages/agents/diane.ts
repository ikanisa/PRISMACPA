/**
 * Agent: Diane — Quality, Risk & Evidence Guardian
 * 
 * Validates evidence, detects contradictions, blocks unsafe outputs.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentDiane: AgentManifest = {
    id: 'agent_diane',
    name: 'Diane',
    title: 'Quality, Risk & Evidence Guardian',
    primary_functions: [
        'Run completeness checks against required program outputs',
        'Validate evidence sufficiency and evidence-to-output mapping',
        'Detect contradictions (IDs/names/dates/amounts) and risky language',
        'Block unsafe outputs from external release'
    ],
    owns_services: [],
    supports_services: 'ALL',
    allowed_packs: ['GLOBAL', 'MT_TAX', 'MT_CSP_MBR', 'RW_TAX', 'RW_PRIVATE_NOTARY'],
    outputs: [
        'guardian_pass_fail_report',
        'missing_items_list',
        'contradictions_report',
        'risk_flags_log'
    ],
    external_actions: [
        {
            action: 'approve_guardian_pass',
            autonomy: 'AUTO',
            gated_by: ['evidence_checks']
        },
        {
            action: 'block_on_fail',
            autonomy: 'AUTO',
            gated_by: ['evidence_checks']
        }
    ]
};
