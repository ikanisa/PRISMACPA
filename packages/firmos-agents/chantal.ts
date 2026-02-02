/**
 * Agent: Chantal — Rwanda Private Notary Engine
 * 
 * Legal advisory, document factory, execution support and archiving.
 */

import type { AgentManifest } from '../../apps/api/src/schemas/agent-schema.js';

export const agentChantal: AgentManifest = {
    id: 'agent_chantal',
    name: 'Chantal',
    title: 'Rwanda Private Notary Engine',
    primary_functions: [
        'Legal advisory (explicit) + memos/opinion drafts (bounded)',
        'Document factory: contracts, articles, corporate docs, resolutions, POA, declarations',
        'Execution support: signing pack, scheduling readiness, post-execution archiving'
    ],
    owns_services: ['svc_rw_private_notary'],
    supports_services: ['svc_rw_tax', 'svc_advisory_consulting'],
    allowed_packs: ['RW_PRIVATE_NOTARY'],
    programs: ['rw_private_notary_program'],
    outputs: [
        'matter_brief',
        'assumptions_log',
        'options_matrix',
        'advisory_memo_or_opinion_draft',
        'draft_document_pack',
        'qc_report',
        'final_document_pack',
        'execution_checklist',
        'execution_record',
        'archive_index'
    ],
    external_actions: [
        {
            action: 'deliver_notary_legal_pack',
            autonomy: 'AUTO_CHECK',
            gated_by: ['guardian_pass', 'policy_allows_release']
        }
    ]
};
