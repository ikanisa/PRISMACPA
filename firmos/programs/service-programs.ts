/**
 * FirmOS Service Programs — Task Graphs, Autonomy Tiers, Evidence Minimums
 * 
 * v1.0 - Defines executable service programs as deterministic task graphs.
 * Each task has: owner agent, autonomy tier, required outputs, required evidence types,
 * QC gate triggers, and escalation triggers.
 * 
 * Orchestrated by Aline, instantiated into cases for execution.
 */

// Local type definitions (avoid circular dependency with agents package)
export type JurisdictionPack = 'GLOBAL' | 'MT_TAX' | 'MT_CSP_MBR' | 'RW_TAX' | 'RW_PRIVATE_NOTARY';

export type EvidenceType =
    | 'CLIENT_INSTRUCTION'
    | 'IDENTITY_AUTHORITY'
    | 'FINANCIAL_RECORDS'
    | 'SOURCE_DOCUMENTS'
    | 'REGISTRY_EXTRACTS'
    | 'LEGAL_SOURCES'
    | 'WORKPAPER_TRAIL';


// =============================================================================
// AUTONOMY TIERS
// =============================================================================

export type AutonomyTier = 'AUTO' | 'AUTO_CHECK' | 'ESCALATE';

export const AUTONOMY_TIER_DESCRIPTIONS: Record<AutonomyTier, string> = {
    AUTO: 'Agent completes without operator sign-off (still logged).',
    AUTO_CHECK: 'Agent completes, then requires Diane PASS before status=final.',
    ESCALATE: 'Requires operator involvement (or explicit Marco authorization for releases).'
};

// =============================================================================
// UNIVERSAL GATES
// =============================================================================

export interface UniversalGate {
    id: string;
    trigger: string;
    enforced_by: string;
    prerequisite?: string;
}

export const UNIVERSAL_GATES: UniversalGate[] = [
    {
        id: 'GATE_G1_DIANE_PASS_FOR_FINALS',
        trigger: 'artifact.status -> final OR client_facing_delivery_requested',
        enforced_by: 'Diane'
    },
    {
        id: 'GATE_G2_MARCO_FOR_RELEASES',
        trigger: 'any_external_filing_or_submission',
        enforced_by: 'Marco',
        prerequisite: 'Diane PASS'
    }
];

// =============================================================================
// EVIDENCE MINIMUMS BY SERVICE
// =============================================================================

export const EVIDENCE_MINIMUMS_BY_SERVICE: Record<string, EvidenceType[]> = {
    svc_audit_assurance: ['CLIENT_INSTRUCTION', 'FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
    svc_accounting_fin_reporting: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL'],
    svc_advisory_consulting: ['CLIENT_INSTRUCTION', 'FINANCIAL_RECORDS', 'WORKPAPER_TRAIL'],
    svc_risk_controls_internal_audit: ['CLIENT_INSTRUCTION', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
    svc_mt_tax: ['CLIENT_INSTRUCTION', 'FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
    svc_mt_csp_mbr: ['CLIENT_INSTRUCTION', 'IDENTITY_AUTHORITY', 'REGISTRY_EXTRACTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
    svc_rw_tax: ['CLIENT_INSTRUCTION', 'FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
    svc_rw_private_notary: ['CLIENT_INSTRUCTION', 'IDENTITY_AUTHORITY', 'LEGAL_SOURCES', 'WORKPAPER_TRAIL']
};

// =============================================================================
// PROGRAM TYPES
// =============================================================================

export interface ProgramTask {
    task_id: string;
    agent: string;
    autonomy: AutonomyTier;
    required_outputs: string[];
    required_evidence: EvidenceType[];
    qc_triggers: string[];
    escalation_triggers: string[];
}

export interface ProgramPhase {
    phase_id: string;
    tasks: ProgramTask[];
}

export interface ServiceProgram {
    service_id: string;
    jurisdiction_pack: JurisdictionPack;
    owner_agent: string;
    orchestrator_agent: string;
    phases: ProgramPhase[];
}

// =============================================================================
// GOVERNANCE DEFAULTS
// =============================================================================

export interface NoveltyScoring {
    enabled: boolean;
    threshold_actions: Record<string, string>;
}

export interface ArithmeticIntegrityChecks {
    enabled: boolean;
    owner: string;
}

export interface PackMismatchBlock {
    enabled: boolean;
    severity: string;
    owner: string;
}

export interface GovernanceDefaults {
    novelty_scoring: NoveltyScoring;
    arithmetic_integrity_checks: ArithmeticIntegrityChecks;
    pack_mismatch_block: PackMismatchBlock;
}

export const GOVERNANCE_DEFAULTS: GovernanceDefaults = {
    novelty_scoring: {
        enabled: true,
        threshold_actions: {
            low: 'AUTO (allowed clause set)',
            medium: 'AUTO_CHECK (requires Diane attention)',
            high: 'ESCALATE (operator + Marco policy review if release-related)'
        }
    },
    arithmetic_integrity_checks: {
        enabled: true,
        owner: 'Diane'
    },
    pack_mismatch_block: {
        enabled: true,
        severity: 'critical',
        owner: 'Marco'
    }
};

// =============================================================================
// SERVICE PROGRAMS
// =============================================================================

/** Audit & Assurance Program (Patrick) */
export const PROGRAM_AUDIT_ASSURANCE: ServiceProgram = {
    service_id: 'svc_audit_assurance',
    jurisdiction_pack: 'GLOBAL',
    owner_agent: 'Patrick',
    orchestrator_agent: 'Aline',
    phases: [
        {
            phase_id: 'AUD_P1_acceptance',
            tasks: [
                {
                    task_id: 'AUD_T01_acceptance_continuance',
                    agent: 'Patrick',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['acceptance_memo', 'independence_assessment', 'engagement_letter_draft'],
                    required_evidence: ['CLIENT_INSTRUCTION', 'LEGAL_SOURCES', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['independence_threat_unresolved', 'scope_ambiguous_after_one_clarification']
                },
                {
                    task_id: 'AUD_T02_engagement_setup',
                    agent: 'Aline',
                    autonomy: 'AUTO',
                    required_outputs: ['workstream_plan', 'task_graph_instance', 'deadline_calendar'],
                    required_evidence: ['CLIENT_INSTRUCTION'],
                    qc_triggers: [],
                    escalation_triggers: ['deadline_under_48h_and_missing_evidence']
                }
            ]
        },
        {
            phase_id: 'AUD_P2_planning_risk',
            tasks: [
                {
                    task_id: 'AUD_T03_planning_strategy',
                    agent: 'Patrick',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['audit_plan_memo', 'materiality_workpaper', 'risk_map'],
                    required_evidence: ['FINANCIAL_RECORDS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['fraud_indicators', 'going_concern_flags']
                },
                {
                    task_id: 'AUD_T04_pbc_list_tracker',
                    agent: 'Patrick',
                    autonomy: 'AUTO',
                    required_outputs: ['pbc_list', 'pbc_tracker'],
                    required_evidence: ['CLIENT_INSTRUCTION', 'WORKPAPER_TRAIL'],
                    qc_triggers: [],
                    escalation_triggers: []
                }
            ]
        },
        {
            phase_id: 'AUD_P3_testing',
            tasks: [
                {
                    task_id: 'AUD_T05_controls_testing',
                    agent: 'Patrick',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['rcm', 'controls_test_plan', 'controls_test_results_or_rationale'],
                    required_evidence: ['SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['critical_control_failure', 'suspected_fraud']
                },
                {
                    task_id: 'AUD_T06_substantive_testing',
                    agent: 'Patrick',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['sampling_log', 'substantive_workpapers', 'misstatement_summary'],
                    required_evidence: ['SOURCE_DOCUMENTS', 'FINANCIAL_RECORDS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['material_misstatement_unresolved', 'scope_limitation']
                }
            ]
        },
        {
            phase_id: 'AUD_P4_completion_reporting',
            tasks: [
                {
                    task_id: 'AUD_T07_completion',
                    agent: 'Patrick',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['going_concern_memo', 'subsequent_events_checklist', 'completion_memo'],
                    required_evidence: ['FINANCIAL_RECORDS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['going_concern_uncertainty', 'fraud_indicators']
                },
                {
                    task_id: 'AUD_T08_reporting_pack',
                    agent: 'Patrick',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['audit_report_support_pack', 'management_letter_draft', 'mgmt_rep_letter_draft'],
                    required_evidence: ['WORKPAPER_TRAIL', 'CLIENT_INSTRUCTION'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['reporting_basis_unclear']
                }
            ]
        }
    ]
};

/** Accounting & Financial Reporting Program (Sofia) */
export const PROGRAM_ACCOUNTING_FIN_REPORTING: ServiceProgram = {
    service_id: 'svc_accounting_fin_reporting',
    jurisdiction_pack: 'GLOBAL',
    owner_agent: 'Sofia',
    orchestrator_agent: 'Aline',
    phases: [
        {
            phase_id: 'ACC_P1_intake_close',
            tasks: [
                {
                    task_id: 'ACC_T01_close_plan',
                    agent: 'Sofia',
                    autonomy: 'AUTO',
                    required_outputs: ['close_checklist', 'data_request_pack'],
                    required_evidence: ['CLIENT_INSTRUCTION'],
                    qc_triggers: [],
                    escalation_triggers: []
                },
                {
                    task_id: 'ACC_T02_reconciliations',
                    agent: 'Sofia',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['reconciliations_pack', 'breaks_log'],
                    required_evidence: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['material_recon_break_unresolved']
                },
                {
                    task_id: 'ACC_T03_journals',
                    agent: 'Sofia',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['je_log', 'je_support_pack'],
                    required_evidence: ['SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['material_estimate_without_support']
                }
            ]
        },
        {
            phase_id: 'ACC_P2_reporting',
            tasks: [
                {
                    task_id: 'ACC_T04_fs_pack',
                    agent: 'Sofia',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['fs_pack_pl_bs_cf', 'notes_pack', 'tieout_sheet'],
                    required_evidence: ['FINANCIAL_RECORDS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['policy_choice_without_authority']
                },
                {
                    task_id: 'ACC_T05_management_accounts',
                    agent: 'Sofia',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['management_accounts_pack', 'variance_analysis', 'mgmt_narrative'],
                    required_evidence: ['FINANCIAL_RECORDS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['large_unexplained_variance']
                }
            ]
        }
    ]
};

/** Advisory & Consulting Program (James) */
export const PROGRAM_ADVISORY_CONSULTING: ServiceProgram = {
    service_id: 'svc_advisory_consulting',
    jurisdiction_pack: 'GLOBAL',
    owner_agent: 'James',
    orchestrator_agent: 'Aline',
    phases: [
        {
            phase_id: 'ADV_P1_diagnose',
            tasks: [
                {
                    task_id: 'ADV_T01_problem_framing',
                    agent: 'James',
                    autonomy: 'AUTO',
                    required_outputs: ['scope_brief', 'success_metrics'],
                    required_evidence: ['CLIENT_INSTRUCTION'],
                    qc_triggers: [],
                    escalation_triggers: []
                },
                {
                    task_id: 'ADV_T02_diagnostic',
                    agent: 'James',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['diagnostic_summary', 'current_state_map'],
                    required_evidence: ['FINANCIAL_RECORDS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['data_insufficient_for_high_stakes_decision']
                }
            ]
        },
        {
            phase_id: 'ADV_P2_model_recommend',
            tasks: [
                {
                    task_id: 'ADV_T03_scenario_model',
                    agent: 'James',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['scenario_model', 'assumptions_register', 'sensitivity_pack'],
                    required_evidence: ['FINANCIAL_RECORDS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['critical_assumption_unverifiable']
                },
                {
                    task_id: 'ADV_T04_recommendations',
                    agent: 'James',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['options_matrix', 'recommendation_memo', 'risk_tradeoff_register'],
                    required_evidence: ['WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['recommendation_impacts_regulatory_or_tax_position']
                }
            ]
        },
        {
            phase_id: 'ADV_P3_implement',
            tasks: [
                {
                    task_id: 'ADV_T05_roadmap',
                    agent: 'James',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['implementation_roadmap', 'governance_plan', 'sop_pack_index'],
                    required_evidence: ['WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: []
                },
                {
                    task_id: 'ADV_T06_board_pack',
                    agent: 'James',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['board_pack'],
                    required_evidence: ['WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: []
                }
            ]
        }
    ]
};

/** Risk Management, Controls & Internal Audit Program (Fatima) */
export const PROGRAM_RISK_CONTROLS_INTERNAL_AUDIT: ServiceProgram = {
    service_id: 'svc_risk_controls_internal_audit',
    jurisdiction_pack: 'GLOBAL',
    owner_agent: 'Fatima',
    orchestrator_agent: 'Aline',
    phases: [
        {
            phase_id: 'RIA_P1_plan',
            tasks: [
                {
                    task_id: 'RIA_T01_universe_annual_plan',
                    agent: 'Fatima',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['audit_universe', 'annual_plan', 'prioritization_scorecard'],
                    required_evidence: ['CLIENT_INSTRUCTION', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: []
                }
            ]
        },
        {
            phase_id: 'RIA_P2_execute',
            tasks: [
                {
                    task_id: 'RIA_T02_rcm_controls',
                    agent: 'Fatima',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['risk_register', 'rcm_control_matrix', 'test_program'],
                    required_evidence: ['SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: []
                },
                {
                    task_id: 'RIA_T03_testing',
                    agent: 'Fatima',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['testing_results', 'exceptions_log'],
                    required_evidence: ['SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['suspected_fraud', 'critical_control_failure']
                }
            ]
        },
        {
            phase_id: 'RIA_P3_report_followup',
            tasks: [
                {
                    task_id: 'RIA_T04_report',
                    agent: 'Fatima',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['internal_audit_report', 'management_action_plan'],
                    required_evidence: ['WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['critical_findings']
                },
                {
                    task_id: 'RIA_T05_followup',
                    agent: 'Fatima',
                    autonomy: 'AUTO',
                    required_outputs: ['remediation_tracker', 'closure_evidence_index'],
                    required_evidence: ['WORKPAPER_TRAIL'],
                    qc_triggers: [],
                    escalation_triggers: ['repeat_findings_no_action']
                }
            ]
        }
    ]
};

/** Malta Tax Program (Matthew) */
export const PROGRAM_MT_TAX: ServiceProgram = {
    service_id: 'svc_mt_tax',
    jurisdiction_pack: 'MT_TAX',
    owner_agent: 'Matthew',
    orchestrator_agent: 'Aline',
    phases: [
        {
            phase_id: 'MTT_P1_intake',
            tasks: [
                {
                    task_id: 'MTT_T01_profile_data_request',
                    agent: 'Matthew',
                    autonomy: 'AUTO',
                    required_outputs: ['mt_tax_profile', 'data_request_pack', 'deadline_calendar'],
                    required_evidence: ['CLIENT_INSTRUCTION'],
                    qc_triggers: [],
                    escalation_triggers: []
                },
                {
                    task_id: 'MTT_T02_validate_data',
                    agent: 'Matthew',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['data_validation_report', 'issues_log'],
                    required_evidence: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['material_gaps_in_support']
                }
            ]
        },
        {
            phase_id: 'MTT_P2_compute',
            tasks: [
                {
                    task_id: 'MTT_T03_compute_schedules',
                    agent: 'Matthew',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['tax_bridge', 'tax_computation_pack', 'schedules_pack', 'evidence_map'],
                    required_evidence: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['contentious_position']
                },
                {
                    task_id: 'MTT_T04_positions_memo_if_needed',
                    agent: 'Matthew',
                    autonomy: 'ESCALATE',
                    required_outputs: ['positions_memo_if_needed'],
                    required_evidence: ['LEGAL_SOURCES', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['always_escalate_for_uncertain_position']
                }
            ]
        },
        {
            phase_id: 'MTT_P3_pack_release',
            tasks: [
                {
                    task_id: 'MTT_T05_filing_bundle',
                    agent: 'Matthew',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['mt_filing_pack', 'client_confirmation_pack', 'archive_index'],
                    required_evidence: ['WORKPAPER_TRAIL', 'CLIENT_INSTRUCTION'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: []
                },
                {
                    task_id: 'MTT_T06_request_submission_release',
                    agent: 'Matthew',
                    autonomy: 'ESCALATE',
                    required_outputs: ['release_request'],
                    required_evidence: ['WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G2_MARCO_FOR_RELEASES'],
                    escalation_triggers: ['always_hold_for_submission']
                }
            ]
        }
    ]
};

/** Malta CSP/MBR Program (Claire) */
export const PROGRAM_MT_CSP_MBR: ServiceProgram = {
    service_id: 'svc_mt_csp_mbr',
    jurisdiction_pack: 'MT_CSP_MBR',
    owner_agent: 'Claire',
    orchestrator_agent: 'Aline',
    phases: [
        {
            phase_id: 'MTC_P1_baseline',
            tasks: [
                {
                    task_id: 'MTC_T01_company_profile_registers',
                    agent: 'Claire',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['company_profile', 'registers_baseline', 'data_request_pack'],
                    required_evidence: ['CLIENT_INSTRUCTION', 'IDENTITY_AUTHORITY', 'REGISTRY_EXTRACTS'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['ownership_inconsistency']
                }
            ]
        },
        {
            phase_id: 'MTC_P2_action_pack',
            tasks: [
                {
                    task_id: 'MTC_T02_draft_action_pack',
                    agent: 'Claire',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['resolutions_minutes_pack', 'action_pack_index', 'updated_registers_pack'],
                    required_evidence: ['IDENTITY_AUTHORITY', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['authority_unclear']
                },
                {
                    task_id: 'MTC_T03_prepare_mbr_filing',
                    agent: 'Claire',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['mbr_filing_pack', 'submission_tracker', 'archive_index'],
                    required_evidence: ['REGISTRY_EXTRACTS', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: []
                }
            ]
        },
        {
            phase_id: 'MTC_P3_release',
            tasks: [
                {
                    task_id: 'MTC_T04_request_filing_release',
                    agent: 'Claire',
                    autonomy: 'ESCALATE',
                    required_outputs: ['release_request'],
                    required_evidence: ['WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G2_MARCO_FOR_RELEASES'],
                    escalation_triggers: ['always_hold_for_filing']
                }
            ]
        }
    ]
};

/** Rwanda Tax Program (Emmanuel) */
export const PROGRAM_RW_TAX: ServiceProgram = {
    service_id: 'svc_rw_tax',
    jurisdiction_pack: 'RW_TAX',
    owner_agent: 'Emmanuel',
    orchestrator_agent: 'Aline',
    phases: [
        {
            phase_id: 'RWT_P1_intake_integrity',
            tasks: [
                {
                    task_id: 'RWT_T01_profile_data_request',
                    agent: 'Emmanuel',
                    autonomy: 'AUTO',
                    required_outputs: ['rw_tax_profile', 'data_request_pack', 'deadline_calendar'],
                    required_evidence: ['CLIENT_INSTRUCTION'],
                    qc_triggers: [],
                    escalation_triggers: []
                },
                {
                    task_id: 'RWT_T02_bank_ledger_integrity',
                    agent: 'Emmanuel',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['integrity_check_report', 'issues_log'],
                    required_evidence: ['FINANCIAL_RECORDS'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['material_mismatch_unresolved']
                }
            ]
        },
        {
            phase_id: 'RWT_P2_compute_pack',
            tasks: [
                {
                    task_id: 'RWT_T03_compute_schedules',
                    agent: 'Emmanuel',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['rw_tax_computation_pack', 'schedules_pack', 'evidence_map', 'risk_flags_log'],
                    required_evidence: ['FINANCIAL_RECORDS', 'SOURCE_DOCUMENTS', 'WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['contentious_position', 'penalty_exposure_material']
                },
                {
                    task_id: 'RWT_T04_positions_memo_if_needed',
                    agent: 'Emmanuel',
                    autonomy: 'ESCALATE',
                    required_outputs: ['positions_memo_if_needed'],
                    required_evidence: ['LEGAL_SOURCES', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['always_escalate_for_uncertain_position']
                }
            ]
        },
        {
            phase_id: 'RWT_P3_release',
            tasks: [
                {
                    task_id: 'RWT_T05_filing_bundle',
                    agent: 'Emmanuel',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['rw_filing_pack', 'client_confirmation_pack', 'archive_index'],
                    required_evidence: ['WORKPAPER_TRAIL', 'CLIENT_INSTRUCTION'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: []
                },
                {
                    task_id: 'RWT_T06_request_submission_release',
                    agent: 'Emmanuel',
                    autonomy: 'ESCALATE',
                    required_outputs: ['release_request'],
                    required_evidence: ['WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G2_MARCO_FOR_RELEASES'],
                    escalation_triggers: ['always_hold_for_submission']
                }
            ]
        }
    ]
};

/** Rwanda Private Notary Program (Chantal) */
export const PROGRAM_RW_PRIVATE_NOTARY: ServiceProgram = {
    service_id: 'svc_rw_private_notary',
    jurisdiction_pack: 'RW_PRIVATE_NOTARY',
    owner_agent: 'Chantal',
    orchestrator_agent: 'Aline',
    phases: [
        {
            phase_id: 'RWN_P1_intake_advisory',
            tasks: [
                {
                    task_id: 'RWN_T01_intake_identity_authority',
                    agent: 'Chantal',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['matter_brief', 'identity_authority_report', 'assumptions_log'],
                    required_evidence: ['CLIENT_INSTRUCTION', 'IDENTITY_AUTHORITY', 'LEGAL_SOURCES'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['identity_or_capacity_uncertain']
                },
                {
                    task_id: 'RWN_T02_advisory_if_needed',
                    agent: 'Chantal',
                    autonomy: 'ESCALATE',
                    required_outputs: ['options_matrix', 'advisory_memo_or_opinion_draft', 'risk_register'],
                    required_evidence: ['LEGAL_SOURCES', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['dispute_or_litigation_threat', 'novel_issue_high_impact']
                }
            ]
        },
        {
            phase_id: 'RWN_P2_document_factory',
            tasks: [
                {
                    task_id: 'RWN_T03_draft_documents',
                    agent: 'Chantal',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['draft_document_pack', 'definitions_schedule', 'annex_index', 'change_log'],
                    required_evidence: ['CLIENT_INSTRUCTION', 'IDENTITY_AUTHORITY', 'WORKPAPER_TRAIL'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['novel_clause_beyond_policy']
                },
                {
                    task_id: 'RWN_T04_finalize_pack',
                    agent: 'Chantal',
                    autonomy: 'AUTO_CHECK',
                    required_outputs: ['final_document_pack', 'qc_report', 'archive_index'],
                    required_evidence: ['WORKPAPER_TRAIL', 'LEGAL_SOURCES'],
                    qc_triggers: ['GATE_G1_DIANE_PASS_FOR_FINALS'],
                    escalation_triggers: ['contradictions_unresolved']
                }
            ]
        },
        {
            phase_id: 'RWN_P3_execution_support',
            tasks: [
                {
                    task_id: 'RWN_T05_execution_pack',
                    agent: 'Chantal',
                    autonomy: 'AUTO',
                    required_outputs: ['execution_checklist', 'signing_pack', 'execution_record_template'],
                    required_evidence: ['IDENTITY_AUTHORITY', 'WORKPAPER_TRAIL'],
                    qc_triggers: [],
                    escalation_triggers: ['cross_border_legalization_complexity']
                }
            ]
        }
    ]
};

// =============================================================================
// ALL PROGRAMS INDEX
// =============================================================================

export const ALL_SERVICE_PROGRAMS: ServiceProgram[] = [
    PROGRAM_AUDIT_ASSURANCE,
    PROGRAM_ACCOUNTING_FIN_REPORTING,
    PROGRAM_ADVISORY_CONSULTING,
    PROGRAM_RISK_CONTROLS_INTERNAL_AUDIT,
    PROGRAM_MT_TAX,
    PROGRAM_MT_CSP_MBR,
    PROGRAM_RW_TAX,
    PROGRAM_RW_PRIVATE_NOTARY
];

/** Map of service ID to program */
export const SERVICE_PROGRAM_INDEX = new Map<string, ServiceProgram>(
    ALL_SERVICE_PROGRAMS.map(p => [p.service_id, p])
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a service program by ID
 */
export function getServiceProgram(serviceId: string): ServiceProgram | undefined {
    return SERVICE_PROGRAM_INDEX.get(serviceId);
}

/**
 * Get all tasks for a service program
 */
export function getAllTasks(program: ServiceProgram): ProgramTask[] {
    return program.phases.flatMap(phase => phase.tasks);
}

/**
 * Get a specific task by ID
 */
export function getTask(program: ServiceProgram, taskId: string): ProgramTask | undefined {
    for (const phase of program.phases) {
        const task = phase.tasks.find(t => t.task_id === taskId);
        if (task) { return task; }
    }
    return undefined;
}

/**
 * Get the phase containing a task
 */
export function getPhaseForTask(program: ServiceProgram, taskId: string): ProgramPhase | undefined {
    for (const phase of program.phases) {
        if (phase.tasks.some(t => t.task_id === taskId)) {
            return phase;
        }
    }
    return undefined;
}

/**
 * Check if a task requires Diane QC pass
 */
export function requiresDianePass(task: ProgramTask): boolean {
    return task.qc_triggers.includes('GATE_G1_DIANE_PASS_FOR_FINALS');
}

/**
 * Check if a task requires Marco release authorization
 */
export function requiresMarcoRelease(task: ProgramTask): boolean {
    return task.qc_triggers.includes('GATE_G2_MARCO_FOR_RELEASES');
}

/**
 * Get evidence minimums for a service
 */
export function getEvidenceMinimums(serviceId: string): EvidenceType[] {
    return EVIDENCE_MINIMUMS_BY_SERVICE[serviceId] || [];
}

/**
 * Count tasks by autonomy tier for a program
 */
export function countTasksByAutonomy(program: ServiceProgram): Record<AutonomyTier, number> {
    const counts: Record<AutonomyTier, number> = { AUTO: 0, AUTO_CHECK: 0, ESCALATE: 0 };
    for (const phase of program.phases) {
        for (const task of phase.tasks) {
            counts[task.autonomy]++;
        }
    }
    return counts;
}
