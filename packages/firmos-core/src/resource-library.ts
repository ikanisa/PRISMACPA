/**
 * FirmOS Core — Resource Library
 * 
 * Reference library with global standards and jurisdiction-specific resources.
 * Agents reference these when citing authoritative sources.
 */

export type ResourceScope = 'global' | 'malta' | 'rwanda';

export interface Resource {
    id: string;
    name: string;
    url: string;
    description?: string;
}

// =============================================================================
// GLOBAL STANDARDS
// =============================================================================

export const GLOBAL_STANDARDS: Record<string, Resource> = {
    IAASB_HANDBOOK: {
        id: 'IAASB_HANDBOOK',
        name: 'IAASB Handbook (ISAs + Quality Mgmt)',
        url: 'https://www.iaasb.org/publications/2025-handbook-international-quality-management-auditing-review-other-assurance-and-related-services',
        description: 'International Standards on Auditing and Quality Management'
    },
    IFAC_ISA_SME_GUIDE: {
        id: 'IFAC_ISA_SME_GUIDE',
        name: 'IFAC Guide to Using ISAs (SME audits)',
        url: 'https://www.ifac.org/knowledge-gateway/audit-assurance/publications/guide-using-international-standards-auditing-audits-small-and-medium-sized-entities',
        description: 'Practical application for SME audits'
    },
    IFRS_STANDARDS_LIST: {
        id: 'IFRS_STANDARDS_LIST',
        name: 'IFRS Standards list / navigator',
        url: 'https://www.ifrs.org/issued-standards/list-of-standards/',
        description: 'Complete list of IFRS accounting standards'
    },
    IESBA_CODE: {
        id: 'IESBA_CODE',
        name: 'IESBA International Code of Ethics',
        url: 'https://www.ethicsboard.org/iesba-code',
        description: 'International Code of Ethics including Independence Standards'
    },
    COSO_INTERNAL_CONTROL: {
        id: 'COSO_INTERNAL_CONTROL',
        name: 'COSO Internal Control — Integrated Framework',
        url: 'https://www.coso.org/guidance-on-ic',
        description: 'Framework for internal control design and assessment'
    },
    ISO_31000: {
        id: 'ISO_31000',
        name: 'ISO 31000:2018 Risk Management — Guidelines',
        url: 'https://www.iso.org/standard/65694.html',
        description: 'International risk management principles and guidelines'
    },
    COBIT: {
        id: 'COBIT',
        name: 'ISACA COBIT',
        url: 'https://www.isaca.org/resources/cobit',
        description: 'Governance and management of enterprise IT'
    },
    FATF_RECS: {
        id: 'FATF_RECS',
        name: 'FATF Recommendations (AML/CFT/CPF)',
        url: 'https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Fatf-recommendations.html',
        description: 'Global AML/CFT/CPF standard'
    },
    OECD_TPG_2022: {
        id: 'OECD_TPG_2022',
        name: 'OECD Transfer Pricing Guidelines (2022)',
        url: 'https://www.oecd.org/en/publications/2022/01/oecd-transfer-pricing-guidelines-for-multinational-enterprises-and-tax-administrations-2022_57104b3a.html',
        description: 'Transfer pricing guidelines for MNEs and tax administrations'
    }
};

// =============================================================================
// MALTA RESOURCES
// =============================================================================

export const MALTA_RESOURCES: Record<string, Resource> = {
    MBR_ANNUAL_RETURNS: {
        id: 'MBR_ANNUAL_RETURNS',
        name: 'Malta Business Registry — Annual Returns guidance',
        url: 'https://mbr.mt/annual-returns/',
        description: 'MBR guidance on annual return filing'
    },
    MFSA_CSP_RULEBOOK: {
        id: 'MFSA_CSP_RULEBOOK',
        name: 'MFSA — Company Service Providers Rulebook',
        url: 'https://www.mfsa.mt/wp-content/uploads/2021/03/Company-Service-Providers-Rulebook.pdf',
        description: 'MFSA CSP regulatory rulebook (PDF)'
    },
    MALTA_CSP_ACT_CAP529: {
        id: 'MALTA_CSP_ACT_CAP529',
        name: 'Company Service Providers Act (Cap. 529)',
        url: 'https://legislation.mt/eli/cap/529/eng/pdf',
        description: 'Primary legislation governing CSPs in Malta'
    },
    MFSA_CSP_FAQS: {
        id: 'MFSA_CSP_FAQS',
        name: 'MFSA CSP FAQs',
        url: 'https://www.mfsa.mt/wp-content/uploads/2021/04/MFSA_Company-Service-Providers-FAQs.pdf',
        description: 'Frequently asked questions on CSP regulation'
    },
    FIAU_IMPL_PROCS: {
        id: 'FIAU_IMPL_PROCS',
        name: 'FIAU Implementing Procedures / Guidance',
        url: 'https://fiaumalta.org/procedures-guidance-2/implementing-procedures/',
        description: 'AML/CFT implementing procedures for Malta'
    }
};

// =============================================================================
// RWANDA RESOURCES
// =============================================================================

export const RWANDA_RESOURCES: Record<string, Resource> = {
    RW_LAW_NOTARY_RWANDALII: {
        id: 'RW_LAW_NOTARY_RWANDALII',
        name: 'RwandaLII — Law governing the Office of the Notary (13bis/2014)',
        url: 'https://rwandalii.org/akn/rw/act/law/2014/13bis/eng%402014-05-29',
        description: 'Primary notary law via RwandaLII'
    },
    RW_LAW_NOTARY_MINIJUST_PDF: {
        id: 'RW_LAW_NOTARY_MINIJUST_PDF',
        name: 'MINIJUST — Law governing the Office of Notary (PDF)',
        url: 'https://www.minijust.gov.rw/fileadmin/user_upload/Minijust/Publications/Laws/Law_Office_of_Notary_2014.pdf',
        description: 'MINIJUST PDF version of notary law'
    },
    RW_NOTARY_AMEND_2023_PDF: {
        id: 'RW_NOTARY_AMEND_2023_PDF',
        name: 'Amended Notary Law (2023)',
        url: 'https://kifc.rw/wp-content/uploads/2023/04/Amended-Notary-Law.pdf',
        description: '2023 amendments to the notary law'
    }
};

// =============================================================================
// COMBINED LIBRARY
// =============================================================================

export const RESOURCE_LIBRARY = {
    global: GLOBAL_STANDARDS,
    malta: MALTA_RESOURCES,
    rwanda: RWANDA_RESOURCES
} as const;

/**
 * Get all resources for a given scope
 */
export function getResourcesByScope(scope: ResourceScope): Record<string, Resource> {
    return RESOURCE_LIBRARY[scope];
}

/**
 * Get a specific resource by ID (searches all scopes)
 */
export function getResource(id: string): Resource | undefined {
    for (const scope of Object.values(RESOURCE_LIBRARY)) {
        if (id in scope) {
            return scope[id as keyof typeof scope];
        }
    }
    return undefined;
}

/**
 * Get all resource IDs for a list of scopes
 */
export function getResourceIdsForScopes(scopes: ResourceScope[]): string[] {
    return scopes.flatMap(scope => Object.keys(RESOURCE_LIBRARY[scope]));
}
