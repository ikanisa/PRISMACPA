/**
 * FirmOS Template Factory Module
 *
 * Provides template management with pack-scoped versioning and QC gating.
 * Re-exports from template-factory implementation.
 */

// Re-export from template factory implementation
export {
    Template,
    TemplateInstance,
    TemplateStatus,
    TemplateInstanceStatus,
    JurisdictionPack,
    TemplatePlaceholder,
    ChangeLogEntry,
    DeviationNote,
    TemplateApproval,
    RiskClassification,
    AgentId,
} from '../../packages/programs/template-factory.js';

// Additional module types
export interface TemplateSearchQuery {
    pack_id?: string;
    status?: string;
    author_agent?: string;
    tags?: string[];
    query?: string;
}

export interface TemplateFactoryConfig {
    require_qc_for_publish: boolean;
    allow_cross_pack_search: boolean;
    version_format: 'semver' | 'date' | 'incremental';
}

// Default config
export const DEFAULT_CONFIG: TemplateFactoryConfig = {
    require_qc_for_publish: true,
    allow_cross_pack_search: false,
    version_format: 'semver',
};
