/**
 * Agent: Aline — Firm Orchestrator
 * 
 * Orchestrates intake classification, dispatches to engine agents, monitors execution.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentAline: AgentManifest = {
    id: 'agent_aline',
    name: 'Aline',
    title: 'Firm Orchestrator',
    primary_functions: [
        'Intake classification: jurisdiction + service + urgency',
        'Instantiate program task graphs from the service catalog',
        'Dispatch tasks to engine agents',
        'Monitor execution, retries, and consolidate status'
    ],
    owns_services: [],
    supports_services: [
        'svc_audit_assurance',
        'svc_accounting_fin_reporting',
        'svc_advisory_consulting',
        'svc_risk_controls_internal_audit',
        'svc_mt_tax',
        'svc_mt_csp_mbr',
        'svc_rw_tax',
        'svc_rw_private_notary'
    ],
    allowed_packs: ['GLOBAL', 'MT_TAX', 'MT_CSP_MBR', 'RW_TAX', 'RW_PRIVATE_NOTARY'],
    outputs: [
        'engagement_profile',
        'workstream_plan',
        'task_graph_instance',
        'execution_status_summary'
    ],
    external_actions: [
        {
            action: 'create_engagement_workstream_tasks',
            autonomy: 'AUTO',
            gated_by: ['policy']
        },
        {
            action: 'dispatch_to_engine',
            autonomy: 'AUTO',
            gated_by: ['policy']
        }
    ]
};
