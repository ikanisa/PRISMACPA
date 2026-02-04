/**
 * Agent: Marco — Autonomy & Policy Governor
 * 
 * Decides autonomy tier, authorizes/denies releases, enforces jurisdiction separation.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentMarco: AgentManifest = {
    id: 'agent_marco',
    name: 'Marco',
    title: 'Autonomy & Policy Governor',
    primary_functions: [
        'Decide autonomy tier per task and per external action',
        'Authorize/deny releases (delivery/filing/submission)',
        'Enforce strict jurisdiction separation (no MT<->RW mixing)'
    ],
    owns_services: [],
    supports_services: 'ALL',
    allowed_packs: ['GLOBAL', 'MT_TAX', 'MT_CSP_MBR', 'RW_TAX', 'RW_PRIVATE_NOTARY'],
    outputs: [
        'autonomy_decision',
        'release_authorization',
        'policy_exception_record'
    ],
    external_actions: [
        {
            action: 'authorize_release_action',
            autonomy: 'AUTO',
            gated_by: ['policy']
        },
        {
            action: 'block_release_action',
            autonomy: 'AUTO',
            gated_by: ['policy']
        }
    ]
};
