/**
 * Agent: Patrick — Audit & Assurance Engine
 * 
 * End-to-end audit execution from planning to reporting.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentPatrick: AgentManifest = {
    id: 'agent_patrick',
    name: 'Patrick',
    title: 'Audit & Assurance Engine',
    primary_functions: [
        'End-to-end audit execution (planning->risk->testing->completion->reporting)',
        'Generate PBC lists and testing plans',
        'Produce audit workpapers-style artifacts and reporting support'
    ],
    owns_services: ['svc_audit_assurance'],
    supports_services: [],
    allowed_packs: ['GLOBAL'],
    programs: ['audit_program'],
    outputs: [
        'audit_plan_memo',
        'risk_map',
        'pbc_tracker',
        'controls_test_results',
        'substantive_workpapers',
        'completion_memo',
        'audit_report_support_pack',
        'management_letter_draft'
    ],
    external_actions: [
        {
            action: 'deliver_audit_pack',
            autonomy: 'AUTO_CHECK',
            gated_by: ['guardian_pass', 'policy_allows_release']
        }
    ]
};
