/**
 * FirmOS Core — Evidence Taxonomy
 *
 * 7 evidence types that define acceptable evidence across the firm.
 * Guardian (Diane) uses this taxonomy to validate evidence sufficiency.
 */
export const EVIDENCE_TAXONOMY = {
    CLIENT_INSTRUCTION: {
        id: 'CLIENT_INSTRUCTION',
        name: 'Client Instruction',
        description: 'Authorization and instructions from the client',
        examples: [
            'email/letter',
            'signed engagement letter',
            'call notes approved by client'
        ]
    },
    IDENTITY_AUTHORITY: {
        id: 'IDENTITY_AUTHORITY',
        name: 'Identity & Authority',
        description: 'Evidence of identity and authority to act',
        examples: [
            'IDs/passports',
            'board resolutions',
            'powers of attorney',
            'signatory lists'
        ]
    },
    FINANCIAL_RECORDS: {
        id: 'FINANCIAL_RECORDS',
        name: 'Financial Records',
        description: 'Core accounting records',
        examples: [
            'trial balance',
            'general ledger',
            'bank statements',
            'reconciliation schedules'
        ]
    },
    SOURCE_DOCUMENTS: {
        id: 'SOURCE_DOCUMENTS',
        name: 'Source Documents',
        description: 'Original transaction evidence',
        examples: [
            'invoices',
            'contracts',
            'delivery notes',
            'payroll summaries',
            'lease agreements'
        ]
    },
    REGISTRY_EXTRACTS: {
        id: 'REGISTRY_EXTRACTS',
        name: 'Registry Extracts',
        description: 'Official registry and filing evidence',
        examples: [
            'MBR extracts/receipts',
            'corporate registers',
            'official filings outcomes'
        ]
    },
    LEGAL_SOURCES: {
        id: 'LEGAL_SOURCES',
        name: 'Legal Sources',
        description: 'Authoritative legal and regulatory references',
        examples: [
            'applicable laws/regulations',
            'official guidance',
            'standard references from library'
        ]
    },
    WORKPAPER_TRAIL: {
        id: 'WORKPAPER_TRAIL',
        name: 'Workpaper Trail',
        description: 'Working papers and audit trail',
        examples: [
            'calculation sheets',
            'sampling logs',
            'testing results',
            'review notes + closure'
        ]
    }
};
/**
 * All evidence type IDs
 */
export const EVIDENCE_TYPES = Object.keys(EVIDENCE_TAXONOMY);
/**
 * Get evidence definition by type
 */
export function getEvidenceDefinition(type) {
    return EVIDENCE_TAXONOMY[type];
}
/**
 * Check if a set of evidence types satisfies a required minimum
 */
export function evidenceSatisfiesMinimum(linkedEvidence, requiredMinimum) {
    const linkedSet = new Set(linkedEvidence);
    const missing = requiredMinimum.filter(type => !linkedSet.has(type));
    return {
        satisfied: missing.length === 0,
        missing
    };
}
