/**
 * FirmOS Core — Evidence Taxonomy
 *
 * 7 evidence types that define acceptable evidence across the firm.
 * Guardian (Diane) uses this taxonomy to validate evidence sufficiency.
 */
export declare const EVIDENCE_TAXONOMY: {
    readonly CLIENT_INSTRUCTION: {
        readonly id: "CLIENT_INSTRUCTION";
        readonly name: "Client Instruction";
        readonly description: "Authorization and instructions from the client";
        readonly examples: readonly ["email/letter", "signed engagement letter", "call notes approved by client"];
    };
    readonly IDENTITY_AUTHORITY: {
        readonly id: "IDENTITY_AUTHORITY";
        readonly name: "Identity & Authority";
        readonly description: "Evidence of identity and authority to act";
        readonly examples: readonly ["IDs/passports", "board resolutions", "powers of attorney", "signatory lists"];
    };
    readonly FINANCIAL_RECORDS: {
        readonly id: "FINANCIAL_RECORDS";
        readonly name: "Financial Records";
        readonly description: "Core accounting records";
        readonly examples: readonly ["trial balance", "general ledger", "bank statements", "reconciliation schedules"];
    };
    readonly SOURCE_DOCUMENTS: {
        readonly id: "SOURCE_DOCUMENTS";
        readonly name: "Source Documents";
        readonly description: "Original transaction evidence";
        readonly examples: readonly ["invoices", "contracts", "delivery notes", "payroll summaries", "lease agreements"];
    };
    readonly REGISTRY_EXTRACTS: {
        readonly id: "REGISTRY_EXTRACTS";
        readonly name: "Registry Extracts";
        readonly description: "Official registry and filing evidence";
        readonly examples: readonly ["MBR extracts/receipts", "corporate registers", "official filings outcomes"];
    };
    readonly LEGAL_SOURCES: {
        readonly id: "LEGAL_SOURCES";
        readonly name: "Legal Sources";
        readonly description: "Authoritative legal and regulatory references";
        readonly examples: readonly ["applicable laws/regulations", "official guidance", "standard references from library"];
    };
    readonly WORKPAPER_TRAIL: {
        readonly id: "WORKPAPER_TRAIL";
        readonly name: "Workpaper Trail";
        readonly description: "Working papers and audit trail";
        readonly examples: readonly ["calculation sheets", "sampling logs", "testing results", "review notes + closure"];
    };
};
export type EvidenceType = keyof typeof EVIDENCE_TAXONOMY;
export type EvidenceTaxonomy = typeof EVIDENCE_TAXONOMY;
/**
 * All evidence type IDs
 */
export declare const EVIDENCE_TYPES: EvidenceType[];
/**
 * Get evidence definition by type
 */
export declare function getEvidenceDefinition(type: EvidenceType): {
    readonly id: "CLIENT_INSTRUCTION";
    readonly name: "Client Instruction";
    readonly description: "Authorization and instructions from the client";
    readonly examples: readonly ["email/letter", "signed engagement letter", "call notes approved by client"];
} | {
    readonly id: "IDENTITY_AUTHORITY";
    readonly name: "Identity & Authority";
    readonly description: "Evidence of identity and authority to act";
    readonly examples: readonly ["IDs/passports", "board resolutions", "powers of attorney", "signatory lists"];
} | {
    readonly id: "FINANCIAL_RECORDS";
    readonly name: "Financial Records";
    readonly description: "Core accounting records";
    readonly examples: readonly ["trial balance", "general ledger", "bank statements", "reconciliation schedules"];
} | {
    readonly id: "SOURCE_DOCUMENTS";
    readonly name: "Source Documents";
    readonly description: "Original transaction evidence";
    readonly examples: readonly ["invoices", "contracts", "delivery notes", "payroll summaries", "lease agreements"];
} | {
    readonly id: "REGISTRY_EXTRACTS";
    readonly name: "Registry Extracts";
    readonly description: "Official registry and filing evidence";
    readonly examples: readonly ["MBR extracts/receipts", "corporate registers", "official filings outcomes"];
} | {
    readonly id: "LEGAL_SOURCES";
    readonly name: "Legal Sources";
    readonly description: "Authoritative legal and regulatory references";
    readonly examples: readonly ["applicable laws/regulations", "official guidance", "standard references from library"];
} | {
    readonly id: "WORKPAPER_TRAIL";
    readonly name: "Workpaper Trail";
    readonly description: "Working papers and audit trail";
    readonly examples: readonly ["calculation sheets", "sampling logs", "testing results", "review notes + closure"];
};
/**
 * Check if a set of evidence types satisfies a required minimum
 */
export declare function evidenceSatisfiesMinimum(linkedEvidence: EvidenceType[], requiredMinimum: EvidenceType[]): {
    satisfied: boolean;
    missing: EvidenceType[];
};
