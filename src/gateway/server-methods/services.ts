/**
 * FirmOS Services Gateway Handlers
 *
 * Gateway WebSocket handlers for service catalog operations.
 * Self-contained with inlined service data to avoid cross-package import issues.
 */

import type { GatewayRequestHandlers } from "./types.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateServicesListParams,
  validateServicesGetParams,
  validateServicesRouteParams,
  validateServicesValidateParams,
} from "../protocol/index.js";

// =============================================================================
// INLINED SERVICE CATALOG DATA
// =============================================================================

/**
 * Minimal service summary for gateway responses
 */
interface ServiceSummary {
  id: string;
  name: string;
  scope: "global" | "malta" | "rwanda";
  strictPack: string | null;
  phaseCount: number;
  taskCount: number;
}

/**
 * Service definition (minimal structure for gateway)
 */
interface ServiceDefinition {
  id: string;
  name: string;
  scope: "global" | "malta" | "rwanda";
  strictPack: string | null;
  includesMandatory: boolean;
  phases: { id: string; name: string }[];
  taskCount: number;
  escalationTriggers: string[];
  externalActions: string[];
}

/**
 * Complete service catalog
 */
const SERVICE_CATALOG: {
  version: string;
  global: ServiceDefinition[];
  malta: ServiceDefinition[];
  rwanda: ServiceDefinition[];
} = {
  version: "0.1.0",
  global: [
    {
      id: "svc_audit_assurance",
      name: "Audit & Assurance",
      scope: "global",
      strictPack: null,
      includesMandatory: true,
      phases: [
        { id: "planning", name: "Engagement Planning" },
        { id: "risk_assessment", name: "Risk Assessment" },
        { id: "testing", name: "Substantive Testing" },
        { id: "completion", name: "Audit Completion" },
        { id: "reporting", name: "Final Reporting" },
      ],
      taskCount: 12,
      escalationTriggers: ["material_misstatement", "going_concern", "scope_limitation"],
      externalActions: ["sign_opinion", "submit_regulator"],
    },
    {
      id: "svc_accounting_fin_reporting",
      name: "Accounting & Financial Reporting",
      scope: "global",
      strictPack: null,
      includesMandatory: true,
      phases: [
        { id: "data_collection", name: "Data Collection" },
        { id: "processing", name: "Transaction Processing" },
        { id: "reconciliation", name: "Account Reconciliation" },
        { id: "reporting", name: "Financial Statement Prep" },
        { id: "review", name: "Review & Finalization" },
      ],
      taskCount: 10,
      escalationTriggers: ["data_inconsistency", "material_error"],
      externalActions: ["submit_financials", "sign_statements"],
    },
    {
      id: "svc_advisory_consulting",
      name: "Advisory & Consulting",
      scope: "global",
      strictPack: null,
      includesMandatory: false,
      phases: [
        { id: "discovery", name: "Discovery & Scoping" },
        { id: "analysis", name: "Analysis" },
        { id: "recommendations", name: "Recommendations" },
        { id: "delivery", name: "Deliverable Production" },
      ],
      taskCount: 8,
      escalationTriggers: ["scope_change", "conflict_of_interest"],
      externalActions: ["deliver_report"],
    },
    {
      id: "svc_risk_controls_internal_audit",
      name: "Risk Management, Controls & Internal Audit",
      scope: "global",
      strictPack: null,
      includesMandatory: true,
      phases: [
        { id: "risk_identification", name: "Risk Identification" },
        { id: "control_design", name: "Control Design Review" },
        { id: "testing", name: "Control Testing" },
        { id: "reporting", name: "Internal Audit Reporting" },
      ],
      taskCount: 9,
      escalationTriggers: ["control_deficiency", "fraud_indicator"],
      externalActions: ["submit_internal_audit_report"],
    },
  ],
  malta: [
    {
      id: "svc_mt_tax",
      name: "Malta Tax Services",
      scope: "malta",
      strictPack: "MT_TAX",
      includesMandatory: true,
      phases: [
        { id: "data_gathering", name: "Tax Data Gathering" },
        { id: "computation", name: "Tax Computation" },
        { id: "review", name: "Partner Review" },
        { id: "filing", name: "Tax Filing" },
      ],
      taskCount: 10,
      escalationTriggers: ["complex_transaction", "uncertain_position", "penalty_risk"],
      externalActions: ["file_vat_return", "file_income_tax", "submit_cfr"],
    },
    {
      id: "svc_mt_csp_mbr",
      name: "Malta CSP/MBR Corporate Services",
      scope: "malta",
      strictPack: "MT_CSP_MBR",
      includesMandatory: true,
      phases: [
        { id: "client_onboarding", name: "Client Onboarding & KYC" },
        { id: "corporate_maintenance", name: "Corporate Maintenance" },
        { id: "mbr_compliance", name: "MBR Compliance" },
        { id: "annual_compliance", name: "Annual Compliance" },
      ],
      taskCount: 11,
      escalationTriggers: ["kyc_red_flag", "beneficial_owner_change", "regulatory_query"],
      externalActions: ["file_mbr_return", "submit_roc", "sign_resolution"],
    },
  ],
  rwanda: [
    {
      id: "svc_rw_tax",
      name: "Rwanda Tax Services",
      scope: "rwanda",
      strictPack: "RW_TAX",
      includesMandatory: true,
      phases: [
        { id: "data_gathering", name: "Tax Data Gathering" },
        { id: "computation", name: "Tax Computation" },
        { id: "review", name: "Review" },
        { id: "filing", name: "RRA Filing" },
      ],
      taskCount: 9,
      escalationTriggers: ["complex_transaction", "rra_query"],
      externalActions: ["file_vat_rra", "file_paye_rra", "file_cit_rra"],
    },
    {
      id: "svc_rw_private_notary",
      name: "Rwanda Private Notary Services",
      scope: "rwanda",
      strictPack: "RW_NOTARY",
      includesMandatory: true,
      phases: [
        { id: "document_review", name: "Document Review" },
        { id: "verification", name: "Identity Verification" },
        { id: "execution", name: "Notarial Execution" },
        { id: "registration", name: "Registration" },
      ],
      taskCount: 8,
      escalationTriggers: ["document_irregularity", "identity_mismatch"],
      externalActions: ["notarize_document", "register_rdb"],
    },
  ],
};

// Build complete list
const ALL_SERVICES: ServiceDefinition[] = [
  ...SERVICE_CATALOG.global,
  ...SERVICE_CATALOG.malta,
  ...SERVICE_CATALOG.rwanda,
];

// =============================================================================
// ROUTING FUNCTIONS
// =============================================================================

type Jurisdiction = "global" | "malta" | "rwanda";
type ServiceKey =
  | "audit"
  | "accounting"
  | "advisory"
  | "risk_internal_audit"
  | "tax"
  | "csp"
  | "private_notary";

/**
 * Service ID mapping for routing
 */
const SERVICE_ROUTING: Record<string, Record<string, string>> = {
  global: {
    audit: "svc_audit_assurance",
    accounting: "svc_accounting_fin_reporting",
    advisory: "svc_advisory_consulting",
    risk_internal_audit: "svc_risk_controls_internal_audit",
  },
  malta: {
    tax: "svc_mt_tax",
    csp: "svc_mt_csp_mbr",
  },
  rwanda: {
    tax: "svc_rw_tax",
    private_notary: "svc_rw_private_notary",
  },
};

function getServiceById(id: string): ServiceDefinition | undefined {
  return ALL_SERVICES.find((s) => s.id === id);
}

function getServicesByJurisdiction(jurisdiction: Jurisdiction): ServiceDefinition[] {
  switch (jurisdiction) {
    case "global":
      return SERVICE_CATALOG.global;
    case "malta":
      return SERVICE_CATALOG.malta;
    case "rwanda":
      return SERVICE_CATALOG.rwanda;
    default:
      return [];
  }
}

function getAvailableServiceIds(): string[] {
  return ALL_SERVICES.map((s) => s.id);
}

function routeService(opts: { jurisdiction?: "malta" | "rwanda"; service: ServiceKey }): {
  serviceId: string | null;
  service: ServiceDefinition | null;
  error?: string;
} {
  const { jurisdiction, service } = opts;

  // Try jurisdiction-specific first
  if (jurisdiction) {
    const jRoutes = SERVICE_ROUTING[jurisdiction];
    if (jRoutes?.[service]) {
      const svc = getServiceById(jRoutes[service]);
      if (svc) {
        return { serviceId: jRoutes[service], service: svc };
      }
    }
  }

  // Fallback to global
  const globalRoutes = SERVICE_ROUTING.global;
  if (globalRoutes[service]) {
    const svc = getServiceById(globalRoutes[service]);
    if (svc) {
      return { serviceId: globalRoutes[service], service: svc };
    }
  }

  return { serviceId: null, service: null, error: `No service found for: ${service}` };
}

// =============================================================================
// GATEWAY HANDLERS
// =============================================================================

/**
 * Services gateway handlers
 */
export const servicesHandlers: GatewayRequestHandlers = {
  /**
   * List all services, optionally filtered by jurisdiction
   */
  "services.list": ({ params, respond }) => {
    if (!validateServicesListParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid services.list params: ${formatValidationErrors(validateServicesListParams.errors)}`,
        ),
      );
      return;
    }

    const p = params as { jurisdiction?: Jurisdiction };

    try {
      const services = p.jurisdiction ? getServicesByJurisdiction(p.jurisdiction) : ALL_SERVICES;

      const summaries: ServiceSummary[] = services.map((s) => ({
        id: s.id,
        name: s.name,
        scope: s.scope,
        strictPack: s.strictPack,
        phaseCount: s.phases.length,
        taskCount: s.taskCount,
      }));

      respond(true, {
        services: summaries,
        totalCount: services.length,
        catalogVersion: SERVICE_CATALOG.version,
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * Get a specific service by ID
   */
  "services.get": ({ params, respond }) => {
    if (!validateServicesGetParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid services.get params: ${formatValidationErrors(validateServicesGetParams.errors)}`,
        ),
      );
      return;
    }

    const p = params as { serviceId: string };

    try {
      const service = getServiceById(p.serviceId);

      if (!service) {
        respond(true, {
          found: false,
          service: null,
          availableServiceIds: getAvailableServiceIds(),
        });
        return;
      }

      respond(true, {
        found: true,
        service: {
          id: service.id,
          name: service.name,
          scope: service.scope,
          strictPack: service.strictPack,
          includesMandatory: service.includesMandatory,
          phases: service.phases,
          taskCount: service.taskCount,
          escalationTriggers: service.escalationTriggers,
          externalActions: service.externalActions,
        },
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * Route a query to the appropriate service
   */
  "services.route": ({ params, respond }) => {
    if (!validateServicesRouteParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid services.route params: ${formatValidationErrors(validateServicesRouteParams.errors)}`,
        ),
      );
      return;
    }

    const p = params as { jurisdiction?: "malta" | "rwanda"; service: string };

    try {
      const result = routeService({
        jurisdiction: p.jurisdiction,
        service: p.service as ServiceKey,
      });

      if (result.error || !result.service) {
        respond(true, {
          found: false,
          serviceId: null,
          error: result.error || "No matching service found",
          availableRoutes: [
            { jurisdiction: "malta", services: ["tax", "csp"] },
            { jurisdiction: "rwanda", services: ["tax", "private_notary"] },
            { services: ["audit", "accounting", "advisory", "risk_internal_audit"] },
          ],
        });
        return;
      }

      respond(true, {
        found: true,
        serviceId: result.serviceId,
        service: {
          id: result.service.id,
          name: result.service.name,
          scope: result.service.scope,
          strictPack: result.service.strictPack,
        },
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },

  /**
   * Validate the service catalog integrity
   */
  "services.validate": ({ params, respond }) => {
    if (!validateServicesValidateParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid services.validate params: ${formatValidationErrors(validateServicesValidateParams.errors)}`,
        ),
      );
      return;
    }

    try {
      // Basic integrity checks
      const serviceIds = ALL_SERVICES.map((s) => s.id);
      const uniqueIds = new Set(serviceIds);
      const hasUniqueIds = uniqueIds.size === serviceIds.length;

      const hasRequiredPhases = ALL_SERVICES.every((s) => s.phases.length > 0);
      const hasValidScopes = ALL_SERVICES.every((s) =>
        ["global", "malta", "rwanda"].includes(s.scope),
      );

      const integrityValid = hasUniqueIds && hasRequiredPhases && hasValidScopes;

      respond(true, {
        valid: integrityValid,
        checks: {
          uniqueServiceIds: { passed: hasUniqueIds, count: serviceIds.length },
          allHavePhases: { passed: hasRequiredPhases },
          validScopes: { passed: hasValidScopes },
        },
        catalogVersion: SERVICE_CATALOG.version,
        serviceCount: ALL_SERVICES.length,
        byScope: {
          global: SERVICE_CATALOG.global.length,
          malta: SERVICE_CATALOG.malta.length,
          rwanda: SERVICE_CATALOG.rwanda.length,
        },
      });
    } catch (error) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(error)));
    }
  },
};
