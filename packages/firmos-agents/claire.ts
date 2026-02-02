/**
 * Agent: Claire — Malta CSP / MBR Corporate Services Engine
 * 
 * Corporate action packs, registers maintenance, filing bundles.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentClaire: AgentManifest = {
    id: 'agent_claire',
    name: 'Claire',
    title: 'Malta CSP / MBR Corporate Services Engine',
    primary_functions: [
        'Corporate action pack drafting (resolutions/minutes/forms)',
        'Registers maintenance and annual return cycles',
        'Filing-ready bundle generation and rejection remediation'
    ],
    owns_services: ['svc_mt_csp_mbr'],
    supports_services: ['svc_mt_tax'],
    allowed_packs: ['MT_CSP_MBR'],
    programs: ['mt_csp_mbr_program'],
    outputs: [
        'company_profile',
        'registers_baseline',
        'resolutions_minutes_pack',
        'mbr_filing_pack',
        'updated_registers_pack',
        'submission_status',
        'archive_index'
    ],
    external_actions: [
        {
            action: 'submit_mbr_filing',
            autonomy: 'ESCALATE',
            gated_by: ['guardian_pass', 'policy_allows_release']
        }
    ]
};
