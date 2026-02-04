/**
 * FirmOS Service Catalog — Programs + Outputs + Evidence + Autonomy (MT/RW)
 * 
 * v1.0 - Big Four-level service catalog for OpenClaw / Antigravity implementation.
 * 
 * Each service includes:
 * - Process phases
 * - Task graph with outputs and evidence
 * - Default autonomy (AUTO / AUTO_CHECK / ESCALATE)
 * - Escalation triggers
 * 
 * Country-specific pillars:
 * - Malta: Tax + CSP/MBR Corporate Services
 * - Rwanda: Tax + Private Notary (legal advisory + document preparation + execution support)
 */

// =============================================================================
// TYPE DEFINITIONS (Inline for package self-containment)
// =============================================================================

export type AutonomyTier = 'AUTO' | 'AUTO_CHECK' | 'ESCALATE';
export type ServiceScope = 'global' | 'malta' | 'rwanda';

export interface ServicePhase {
    id: string;
    name: string;
}

export interface TaskNode {
    key: string;
    autonomy: AutonomyTier;
    outputs: string[];
    evidence: string[];
}

export interface ExternalAction {
    action: string;
    requires: string[];
    defaultAutonomy: AutonomyTier;
}

export interface ServiceDefinition {
    id: string;
    name: string;
    scope: ServiceScope;
    strictPack?: string;
    includesMandatory?: string[];
    standardProcess: {
        phases: ServicePhase[];
    };
    taskGraph: TaskNode[];
    escalationTriggers: string[];
    externalActions: ExternalAction[];
}

export interface GlobalQualityRules {
    requiredForAllServices: string[];
    guardianPassConditions: string[];
    universalEscalationTriggers: string[];
}

export interface ServiceCatalog {
    version: string;
    name: string;
    mode: string;
    goal: string;
    autonomyTiers: Record<string, string>;
    globalQualityRules: GlobalQualityRules;
    services: ServiceDefinition[];
    integrationNotes: {
        routingRules: string[];
        releaseControls: string[];
    };
}
// =============================================================================
// GLOBAL QUALITY RULES
// =============================================================================

export const globalQualityRules: GlobalQualityRules = {
    requiredForAllServices: [
        'All deliverables must be versioned (draft -> final) and evidence-linked',
        'All key facts must have a source (client instruction, evidence file, registry extract, ledger)',
        'No cross-country logic leakage (MT pack cannot be used for RW workflows and vice versa)',
        'Contradictions (names/dates/amounts/IDs) must be resolved or escalated'
    ],
    guardianPassConditions: [
        'Required outputs present',
        'Required evidence present',
        'Consistency checks pass',
        'Country pack matches engagement jurisdiction'
    ],
    universalEscalationTriggers: [
        'Dispute / litigation / threat language',
        'Regulatory breach allegation or enforcement risk',
        'Identity uncertainty (party names/IDs mismatch)',
        'Novel terms outside clause policy (novelty score high)',
        'Irreversible external action blocked by policy'
    ]
};

// =============================================================================
// GLOBAL SERVICES
// =============================================================================

/** Audit & Assurance Service */
export const svcAuditAssurance: ServiceDefinition = {
    id: 'svc_audit_assurance',
    name: 'Audit & Assurance',
    scope: 'global',
    standardProcess: {
        phases: [
            { id: 'aud_01_acceptance', name: 'Acceptance & Scope' },
            { id: 'aud_02_planning', name: 'Planning' },
            { id: 'aud_03_risk', name: 'Risk Assessment' },
            { id: 'aud_04_pbc', name: 'PBC & Data Intake' },
            { id: 'aud_05_controls', name: 'Controls Work (if applicable)' },
            { id: 'aud_06_substantive', name: 'Substantive Procedures' },
            { id: 'aud_07_completion', name: 'Completion' },
            { id: 'aud_08_reporting', name: 'Reporting' }
        ]
    },
    taskGraph: [
        {
            key: 'aud_T01_create_engagement_profile',
            autonomy: 'AUTO',
            outputs: ['engagement_profile'],
            evidence: ['client_instruction', 'entity_profile_docs']
        },
        {
            key: 'aud_T02_acceptance_checks',
            autonomy: 'AUTO_CHECK',
            outputs: ['acceptance_check_log'],
            evidence: ['conflicts_declaration', 'independence_check_inputs']
        },
        {
            key: 'aud_T03_audit_strategy_and_plan',
            autonomy: 'AUTO_CHECK',
            outputs: ['audit_plan_memo', 'materiality_working'],
            evidence: ['prior_year_fs_if_any', 'current_year_trial_balance', 'business_overview']
        },
        {
            key: 'aud_T04_risk_assessment_pack',
            autonomy: 'AUTO_CHECK',
            outputs: ['risk_map', 'significant_risks_register', 'fraud_risk_notes'],
            evidence: ['process_walkthrough_notes', 'policies_procedures', 'system_overview']
        },
        {
            key: 'aud_T05_generate_pbc_list',
            autonomy: 'AUTO',
            outputs: ['pbc_request_list'],
            evidence: ['risk_map', 'industry_profile', 'trial_balance']
        },
        {
            key: 'aud_T06_pbc_tracker_and_chasing',
            autonomy: 'AUTO',
            outputs: ['pbc_tracker'],
            evidence: ['received_evidence_index']
        },
        {
            key: 'aud_T07_controls_testing_plan',
            autonomy: 'AUTO_CHECK',
            outputs: ['controls_test_plan'],
            evidence: ['controls_documentation', 'risk_map']
        },
        {
            key: 'aud_T08_controls_testing_execution',
            autonomy: 'AUTO_CHECK',
            outputs: ['controls_test_results', 'exceptions_log'],
            evidence: ['walkthrough_evidence', 'sample_selections', 'control_artifacts']
        },
        {
            key: 'aud_T09_substantive_test_plan',
            autonomy: 'AUTO_CHECK',
            outputs: ['substantive_procedures_plan'],
            evidence: ['risk_map', 'trial_balance', 'controls_results_if_any']
        },
        {
            key: 'aud_T10_substantive_testing_execution',
            autonomy: 'AUTO_CHECK',
            outputs: ['substantive_workpapers', 'misstatements_summary'],
            evidence: ['bank_confirmations_or_statements', 'invoices_contracts', 'reconciliations', 'supporting_schedules']
        },
        {
            key: 'aud_T11_completion_procedures',
            autonomy: 'AUTO_CHECK',
            outputs: ['completion_memo', 'subsequent_events_check', 'going_concern_assessment'],
            evidence: ['management_representations_inputs', 'post_period_transactions', 'cashflow_forecast_if_any']
        },
        {
            key: 'aud_T12_reporting_pack',
            autonomy: 'AUTO_CHECK',
            outputs: ['audit_report_support_pack', 'management_letter_draft'],
            evidence: ['completion_memo', 'final_fs_pack', 'misstatements_summary']
        }
    ],
    escalationTriggers: [
        'Fraud indicators or suspected management override',
        'Going concern uncertainty not supported by evidence',
        'Unresolved material misstatements or scope limitation',
        'Client dispute or refusal to provide critical evidence'
    ],
    externalActions: [
        {
            action: 'deliver_audit_pack',
            requires: ['guardian_pass', 'policy_allows_release'],
            defaultAutonomy: 'AUTO_CHECK'
        }
    ]
};

/** Accounting & Financial Reporting Service */
export const svcAccountingFinReporting: ServiceDefinition = {
    id: 'svc_accounting_fin_reporting',
    name: 'Accounting & Financial Reporting',
    scope: 'global',
    standardProcess: {
        phases: [
            { id: 'acc_01_setup', name: 'Setup & Chart of Accounts Alignment' },
            { id: 'acc_02_close', name: 'Monthly/Period Close' },
            { id: 'acc_03_qc', name: 'Quality Control & Tie-outs' },
            { id: 'acc_04_fs', name: 'Financial Statements & Notes' },
            { id: 'acc_05_mgmt_reporting', name: 'Management Reporting' }
        ]
    },
    taskGraph: [
        {
            key: 'acc_T01_coa_mapping_and_policies',
            autonomy: 'AUTO_CHECK',
            outputs: ['coa_mapping', 'accounting_policies_summary'],
            evidence: ['trial_balance', 'historical_fs_if_any', 'client_policy_inputs']
        },
        {
            key: 'acc_T02_close_checklist_generation',
            autonomy: 'AUTO',
            outputs: ['close_checklist'],
            evidence: ['coa_mapping', 'period_calendar']
        },
        {
            key: 'acc_T03_reconciliations_pack',
            autonomy: 'AUTO_CHECK',
            outputs: ['bank_recs', 'ap_ar_recs', 'fixed_asset_schedule', 'inventory_rollforward_if_any'],
            evidence: ['bank_statements', 'ledgers', 'supporting_schedules', 'asset_register_if_any']
        },
        {
            key: 'acc_T04_adjusting_entries_log',
            autonomy: 'AUTO_CHECK',
            outputs: ['je_log', 'accruals_prepaids_working'],
            evidence: ['invoices_contracts', 'payroll_summaries_if_any', 'reconciliations_pack']
        },
        {
            key: 'acc_T05_fs_pack_generation',
            autonomy: 'AUTO_CHECK',
            outputs: ['fs_pack_pl_bs_cf', 'notes_pack', 'disclosures_checklist'],
            evidence: ['final_trial_balance', 'je_log', 'supporting_schedules']
        },
        {
            key: 'acc_T06_variance_and_reasonability',
            autonomy: 'AUTO_CHECK',
            outputs: ['variance_analysis', 'management_accounts_pack'],
            evidence: ['prior_periods', 'budget_if_any', 'fs_pack']
        }
    ],
    escalationTriggers: [
        'Material policy choice or non-routine transaction without support',
        'Significant unexplained variances',
        'Evidence contradictions (e.g., bank vs ledger mismatch) unresolved'
    ],
    externalActions: [
        {
            action: 'deliver_management_accounts',
            requires: ['guardian_pass', 'policy_allows_release'],
            defaultAutonomy: 'AUTO_CHECK'
        }
    ]
};

/** Advisory & Consulting Service */
export const svcAdvisoryConsulting: ServiceDefinition = {
    id: 'svc_advisory_consulting',
    name: 'Advisory & Consulting (CFO / Transformation)',
    scope: 'global',
    standardProcess: {
        phases: [
            { id: 'adv_01_framing', name: 'Problem Framing' },
            { id: 'adv_02_diagnostics', name: 'Diagnostics' },
            { id: 'adv_03_options_model', name: 'Options & Modeling' },
            { id: 'adv_04_recommend', name: 'Recommendation Pack' },
            { id: 'adv_05_execution_support', name: 'Execution Support' }
        ]
    },
    taskGraph: [
        {
            key: 'adv_T01_define_objective_and_scope',
            autonomy: 'AUTO',
            outputs: ['scope_brief', 'assumptions_log'],
            evidence: ['client_instruction', 'baseline_data_inventory']
        },
        {
            key: 'adv_T02_current_state_analysis',
            autonomy: 'AUTO_CHECK',
            outputs: ['diagnostic_summary', 'kpi_baseline'],
            evidence: ['financials', 'process_docs_if_any', 'interviews_notes_if_any']
        },
        {
            key: 'adv_T03_scenario_models',
            autonomy: 'AUTO_CHECK',
            outputs: ['scenario_model', 'sensitivity_table', 'key_drivers_list'],
            evidence: ['assumptions_log', 'historicals', 'market_inputs_if_any']
        },
        {
            key: 'adv_T04_recommendation_memo',
            autonomy: 'AUTO_CHECK',
            outputs: ['recommendation_memo', 'implementation_roadmap', 'success_metrics'],
            evidence: ['diagnostic_summary', 'scenario_model']
        },
        {
            key: 'adv_T05_templates_and_sops',
            autonomy: 'AUTO',
            outputs: ['sop_pack', 'tracking_dashboard_spec'],
            evidence: ['roadmap']
        }
    ],
    escalationTriggers: [
        'High-stakes strategic recommendation with weak evidence',
        'Regulatory exposure or disputed facts',
        'Client requests formal legal/tax opinion (route to correct country pillar)'
    ],
    externalActions: [
        {
            action: 'deliver_advisory_pack',
            requires: ['guardian_pass', 'policy_allows_release'],
            defaultAutonomy: 'AUTO_CHECK'
        }
    ]
};

/** Risk Management, Controls & Internal Audit Service */
export const svcRiskControlsInternalAudit: ServiceDefinition = {
    id: 'svc_risk_controls_internal_audit',
    name: 'Risk Management, Controls & Internal Audit',
    scope: 'global',
    standardProcess: {
        phases: [
            { id: 'ria_01_plan', name: 'Audit Universe & Annual Plan' },
            { id: 'ria_02_scope', name: 'Engagement Scoping' },
            { id: 'ria_03_fieldwork', name: 'Fieldwork & Testing' },
            { id: 'ria_04_reporting', name: 'Reporting' },
            { id: 'ria_05_followup', name: 'Remediation & Follow-up' }
        ]
    },
    taskGraph: [
        {
            key: 'ria_T01_risk_universe_and_plan',
            autonomy: 'AUTO_CHECK',
            outputs: ['audit_universe', 'annual_plan'],
            evidence: ['org_structure', 'process_list', 'prior_findings_if_any']
        },
        {
            key: 'ria_T02_rcm_build',
            autonomy: 'AUTO_CHECK',
            outputs: ['risk_register', 'rcm_control_matrix'],
            evidence: ['process_walkthroughs', 'policies_procedures']
        },
        {
            key: 'ria_T03_test_scripts_and_sampling',
            autonomy: 'AUTO_CHECK',
            outputs: ['test_scripts', 'sample_plan'],
            evidence: ['rcm_control_matrix']
        },
        {
            key: 'ria_T04_execute_testing',
            autonomy: 'AUTO_CHECK',
            outputs: ['testing_results', 'exceptions_log'],
            evidence: ['control_artifacts', 'transaction_samples', 'system_extracts_if_any']
        },
        {
            key: 'ria_T05_findings_and_report',
            autonomy: 'AUTO_CHECK',
            outputs: ['internal_audit_report', 'management_action_plan'],
            evidence: ['testing_results', 'exceptions_log']
        },
        {
            key: 'ria_T06_followup_and_retest',
            autonomy: 'AUTO',
            outputs: ['remediation_tracker', 'retest_results'],
            evidence: ['management_action_plan', 'remediation_evidence']
        }
    ],
    escalationTriggers: [
        'Critical control failures',
        'Suspected fraud indicators',
        'Serious compliance breach exposure'
    ],
    externalActions: [
        {
            action: 'deliver_internal_audit_report',
            requires: ['guardian_pass', 'policy_allows_release'],
            defaultAutonomy: 'AUTO_CHECK'
        }
    ]
};

// =============================================================================
// MALTA SERVICES
// =============================================================================

/** Malta Tax Services */
export const svcMtTax: ServiceDefinition = {
    id: 'svc_mt_tax',
    name: 'Malta Tax Services (Country Pack)',
    scope: 'malta',
    strictPack: 'MT_TAX',
    standardProcess: {
        phases: [
            { id: 'mtt_01_profile', name: 'Onboarding & Tax Profile' },
            { id: 'mtt_02_data', name: 'Data Request & Validation' },
            { id: 'mtt_03_compute', name: 'Computation & Schedules' },
            { id: 'mtt_04_review', name: 'Review & Risk Scan' },
            { id: 'mtt_05_pack', name: 'Filing Pack Generation' },
            { id: 'mtt_06_archive', name: 'Post-filing Archive' }
        ]
    },
    taskGraph: [
        {
            key: 'mtt_T01_entity_tax_profile',
            autonomy: 'AUTO',
            outputs: ['mt_tax_profile'],
            evidence: ['entity_docs', 'prior_filings_if_any']
        },
        {
            key: 'mtt_T02_data_intake_and_checks',
            autonomy: 'AUTO_CHECK',
            outputs: ['data_completeness_log'],
            evidence: ['trial_balance', 'vat_reports_if_any', 'contracts_ledgers']
        },
        {
            key: 'mtt_T03_book_to_tax_bridge',
            autonomy: 'AUTO_CHECK',
            outputs: ['tax_bridge', 'schedules_pack'],
            evidence: ['trial_balance', 'fs_pack_if_any', 'supporting_schedules']
        },
        {
            key: 'mtt_T04_positions_and_documentation',
            autonomy: 'AUTO_CHECK',
            outputs: ['positions_memo_if_needed', 'risk_flags_log'],
            evidence: ['supporting_authority_or_guidance_refs', 'client_fact_statements']
        },
        {
            key: 'mtt_T05_filing_bundle',
            autonomy: 'AUTO_CHECK',
            outputs: ['mt_filing_pack', 'client_confirmation_pack', 'evidence_map'],
            evidence: ['tax_bridge', 'schedules_pack', 'data_completeness_log']
        },
        {
            key: 'mtt_T06_archive_and_learnings',
            autonomy: 'AUTO',
            outputs: ['archive_index', 'lessons_learned'],
            evidence: ['final_pack', 'submission_receipts_if_any']
        }
    ],
    escalationTriggers: [
        'Contentious/uncertain tax position',
        'Treaty/refund/complex cross-border treatment needing human judgment',
        'Missing support for key assumptions'
    ],
    externalActions: [
        {
            action: 'submit_mt_tax_pack',
            requires: ['guardian_pass', 'policy_allows_release'],
            defaultAutonomy: 'ESCALATE'
        }
    ]
};

/** Malta CSP/MBR Corporate Services */
export const svcMtCspMbr: ServiceDefinition = {
    id: 'svc_mt_csp_mbr',
    name: 'Malta CSP / MBR Corporate Services (Country Pack)',
    scope: 'malta',
    strictPack: 'MT_CSP_MBR',
    standardProcess: {
        phases: [
            { id: 'mtc_01_intake', name: 'Instruction Intake & Baseline Registers' },
            { id: 'mtc_02_draft', name: 'Draft Corporate Action Pack' },
            { id: 'mtc_03_validate', name: 'Validate Completeness & Consistency' },
            { id: 'mtc_04_pack', name: 'Filing-ready Bundle' },
            { id: 'mtc_05_outcome', name: 'Submission Outcome & Remediation' },
            { id: 'mtc_06_update', name: 'Update Registers & Archive' }
        ]
    },
    taskGraph: [
        {
            key: 'mtc_T01_corporate_profile_and_registers',
            autonomy: 'AUTO_CHECK',
            outputs: ['company_profile', 'registers_baseline'],
            evidence: ['incorporation_docs', 'current_registers_if_any', 'client_instruction']
        },
        {
            key: 'mtc_T02_action_pack_drafting',
            autonomy: 'AUTO_CHECK',
            outputs: ['resolutions_minutes_pack', 'forms_support_pack'],
            evidence: ['instruction_details', 'party_id_docs_if_needed']
        },
        {
            key: 'mtc_T03_internal_validation',
            autonomy: 'AUTO_CHECK',
            outputs: ['validation_report'],
            evidence: ['registers_baseline', 'draft_pack']
        },
        {
            key: 'mtc_T04_filing_bundle_generation',
            autonomy: 'AUTO_CHECK',
            outputs: ['mbr_filing_pack', 'signature_checklist', 'evidence_map'],
            evidence: ['validated_pack', 'id_docs_if_needed']
        },
        {
            key: 'mtc_T05_outcome_tracking_and_fix_loop',
            autonomy: 'AUTO',
            outputs: ['submission_status', 'rejection_fix_plan_if_any'],
            evidence: ['submission_receipts_or_errors']
        },
        {
            key: 'mtc_T06_register_updates_and_archive',
            autonomy: 'AUTO_CHECK',
            outputs: ['updated_registers_pack', 'archive_index'],
            evidence: ['accepted_outcome', 'final_filing_pack']
        }
    ],
    escalationTriggers: [
        'Rejected filings requiring non-routine remediation',
        'Inconsistent corporate records (shareholding/directors) not resolvable',
        'Late deadlines with penalty or exceptional risk'
    ],
    externalActions: [
        {
            action: 'submit_mbr_filing',
            requires: ['guardian_pass', 'policy_allows_release'],
            defaultAutonomy: 'ESCALATE'
        }
    ]
};

// =============================================================================
// RWANDA SERVICES
// =============================================================================

/** Rwanda Tax Services */
export const svcRwTax: ServiceDefinition = {
    id: 'svc_rw_tax',
    name: 'Rwanda Tax Services (Country Pack)',
    scope: 'rwanda',
    strictPack: 'RW_TAX',
    standardProcess: {
        phases: [
            { id: 'rwt_01_profile', name: 'Onboarding & Tax Profile' },
            { id: 'rwt_02_data', name: 'Data Request & Validation' },
            { id: 'rwt_03_compute', name: 'Computation (CIT/VAT/WHT as applicable)' },
            { id: 'rwt_04_review', name: 'Review & Penalty-Risk Scan' },
            { id: 'rwt_05_pack', name: 'Filing Pack Generation' },
            { id: 'rwt_06_archive', name: 'Post-filing Archive' }
        ]
    },
    taskGraph: [
        {
            key: 'rwt_T01_entity_tax_profile',
            autonomy: 'AUTO',
            outputs: ['rw_tax_profile'],
            evidence: ['entity_docs', 'prior_filings_if_any']
        },
        {
            key: 'rwt_T02_data_intake_and_checks',
            autonomy: 'AUTO_CHECK',
            outputs: ['data_completeness_log'],
            evidence: ['trial_balance', 'sales_purchase_ledgers', 'vat_wht_records_if_any', 'bank_statements']
        },
        {
            key: 'rwt_T03_computation_and_schedules',
            autonomy: 'AUTO_CHECK',
            outputs: ['rw_tax_computation_pack', 'schedules_pack'],
            evidence: ['validated_ledgers', 'trial_balance', 'supporting_schedules']
        },
        {
            key: 'rwt_T04_positions_and_penalty_scan',
            autonomy: 'AUTO_CHECK',
            outputs: ['risk_flags_log', 'positions_memo_if_needed'],
            evidence: ['client_fact_statements', 'supporting_authority_or_guidance_refs']
        },
        {
            key: 'rwt_T05_filing_bundle',
            autonomy: 'AUTO_CHECK',
            outputs: ['rw_filing_pack', 'client_confirmation_pack', 'evidence_map'],
            evidence: ['computation_pack', 'data_completeness_log']
        },
        {
            key: 'rwt_T06_archive_and_learnings',
            autonomy: 'AUTO',
            outputs: ['archive_index', 'lessons_learned'],
            evidence: ['final_pack', 'submission_receipts_if_any']
        }
    ],
    escalationTriggers: [
        'Penalty exposure or contentious position',
        'Missing/contradictory invoices/ledger vs bank inconsistencies',
        'Uncertainty requiring explicit human judgment'
    ],
    externalActions: [
        {
            action: 'submit_rw_tax_pack',
            requires: ['guardian_pass', 'policy_allows_release'],
            defaultAutonomy: 'ESCALATE'
        }
    ]
};

/** Rwanda Private Notary Services */
export const svcRwPrivateNotary: ServiceDefinition = {
    id: 'svc_rw_private_notary',
    name: 'Rwanda Private Notary Services (Country Pack)',
    scope: 'rwanda',
    strictPack: 'RW_PRIVATE_NOTARY',
    includesMandatory: [
        'Legal advisory (explicit)',
        'Document preparation (contracts/articles/corporate docs)',
        'Execution support + archiving'
    ],
    standardProcess: {
        phases: [
            { id: 'rwn_01_intake', name: 'Legal Intake & Facts' },
            { id: 'rwn_02_advisory', name: 'Legal Advisory (when requested/needed)' },
            { id: 'rwn_03_drafting', name: 'Document Preparation Factory' },
            { id: 'rwn_04_qc', name: 'Clause + Consistency Quality Checks' },
            { id: 'rwn_05_finalize', name: 'Finalization & Signing Pack' },
            { id: 'rwn_06_execution', name: 'Execution Support' },
            { id: 'rwn_07_archive', name: 'Post-execution Archive & Precedent Capture' }
        ]
    },
    taskGraph: [
        {
            key: 'rwn_T01_capture_facts_and_objective',
            autonomy: 'AUTO',
            outputs: ['matter_brief', 'assumptions_log', 'missing_info_questions_if_any'],
            evidence: ['client_instruction', 'party_id_docs_if_any', 'supporting_docs_if_any']
        },
        {
            key: 'rwn_T02_advisory_options_matrix',
            autonomy: 'AUTO_CHECK',
            outputs: ['options_matrix', 'risk_notes', 'recommended_path'],
            evidence: ['matter_brief', 'supporting_docs']
        },
        {
            key: 'rwn_T03_advisory_memo_or_opinion',
            autonomy: 'AUTO_CHECK',
            outputs: ['advisory_memo_or_opinion_draft'],
            evidence: ['options_matrix', 'facts_evidence_map']
        },
        {
            key: 'rwn_T04_generate_draft_documents',
            autonomy: 'AUTO_CHECK',
            outputs: ['draft_document_pack', 'definitions_schedule', 'annexes_list'],
            evidence: ['matter_brief', 'clause_library_refs', 'party_details']
        },
        {
            key: 'rwn_T05_quality_checks',
            autonomy: 'AUTO_CHECK',
            outputs: ['qc_report', 'novelty_score', 'contradictions_report'],
            evidence: ['draft_document_pack', 'evidence_index']
        },
        {
            key: 'rwn_T06_finalize_documents',
            autonomy: 'AUTO_CHECK',
            outputs: ['final_document_pack', 'change_log'],
            evidence: ['qc_report', 'client_confirmations_if_any']
        },
        {
            key: 'rwn_T07_signing_and_execution_pack',
            autonomy: 'AUTO',
            outputs: ['execution_checklist', 'signing_pack', 'appointment_readiness_notes'],
            evidence: ['final_document_pack', 'party_id_docs', 'supporting_evidence']
        },
        {
            key: 'rwn_T08_execution_tracking',
            autonomy: 'AUTO',
            outputs: ['execution_record', 'post_execution_actions_list'],
            evidence: ['signed_docs_or_execution_proofs']
        },
        {
            key: 'rwn_T09_archive_and_precedent_capture',
            autonomy: 'AUTO',
            outputs: ['archive_index', 'precedent_candidate_tags'],
            evidence: ['final_signed_pack', 'execution_record']
        }
    ],
    escalationTriggers: [
        'Dispute/litigation threat or adversarial negotiation stance',
        'Regulatory exposure, allegations, or criminal/fraud signals',
        'Novel clauses beyond policy boundaries',
        'Identity contradictions or authority/capacity uncertainty',
        'Cross-border legalization complexity'
    ],
    externalActions: [
        {
            action: 'deliver_notary_legal_pack',
            requires: ['guardian_pass', 'policy_allows_release'],
            defaultAutonomy: 'AUTO_CHECK'
        }
    ]
};

// =============================================================================
// COMPLETE SERVICE CATALOG
// =============================================================================

/** All services */
export const ALL_SERVICES: ServiceDefinition[] = [
    // Global
    svcAuditAssurance,
    svcAccountingFinReporting,
    svcAdvisoryConsulting,
    svcRiskControlsInternalAudit,
    // Malta
    svcMtTax,
    svcMtCspMbr,
    // Rwanda
    svcRwTax,
    svcRwPrivateNotary
];

/** Complete FirmOS Service Catalog */
export const SERVICE_CATALOG: ServiceCatalog = {
    version: '1.0',
    name: 'FirmOS Service Catalog — Programs + Outputs + Evidence + Autonomy (MT/RW)',
    mode: 'additive_only',
    goal: `Provide a complete Big Four-level service catalog for OpenClaw / Antigravity implementation.
Each service includes: process phases, task graph, required outputs, required evidence, default
autonomy (AUTO / AUTO+CHECK / ESCALATE), and escalation triggers. Country-specific pillars:
Malta: Tax + CSP/MBR Corporate Services
Rwanda: Tax + Private Notary (legal advisory + document preparation + execution support)`,
    autonomyTiers: {
        AUTO: 'Agent completes without operator',
        AUTO_CHECK: 'Agent completes; Guardian must PASS before release/external use',
        ESCALATE: 'Requires operator attention (exception/high-risk/irreversible)'
    },
    globalQualityRules,
    services: ALL_SERVICES,
    integrationNotes: {
        routingRules: [
            'If jurisdiction=malta and service=tax -> svc_mt_tax',
            'If jurisdiction=malta and service=csp -> svc_mt_csp_mbr',
            'If jurisdiction=rwanda and service=tax -> svc_rw_tax',
            'If jurisdiction=rwanda and service=private_notary -> svc_rw_private_notary',
            'If service=audit -> svc_audit_assurance (apply local overlays if needed)',
            'If service=accounting -> svc_accounting_fin_reporting (apply local overlays if needed)',
            'If service=advisory -> svc_advisory_consulting (apply local overlays if needed)',
            'If service=risk_internal_audit -> svc_risk_controls_internal_audit'
        ],
        releaseControls: [
            'External submissions/filings default to ESCALATE unless policy explicitly enables auto-release',
            'All client-facing delivery requires Guardian PASS'
        ]
    }
};
