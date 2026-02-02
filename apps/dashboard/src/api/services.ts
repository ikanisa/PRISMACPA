/**
 * Services API
 * 
 * Fetches FirmOS service catalog data from the gateway.
 */

import { getGateway } from './gateway';
import type { ServicesListResult, ServiceScope } from './types';

export type ServiceCardData = {
    id: string;
    name: string;
    icon: string;
    owner: string;
    scope: ServiceScope;
    engagements: number;
    phaseCount: number;
    taskCount: number;
};

const SERVICE_ICONS: Record<string, string> = {
    svc_audit_assurance: "📊",
    svc_accounting_fin_reporting: "📒",
    svc_advisory_consulting: "💡",
    svc_risk_controls_internal_audit: "🛡️",
    svc_mt_tax: "🇲🇹",
    svc_mt_csp_mbr: "🏢",
    svc_rw_tax: "🇷🇼",
    svc_rw_private_notary: "⚖️",
};

const SCOPE_OWNERS: Record<ServiceScope, string> = {
    global: "Aline (Orchestrator)",
    malta: "Leo (MT Lead)",
    rwanda: "Diane (RW Guardian)",
};

export async function loadServices(): Promise<ServiceCardData[]> {
    const gateway = getGateway();

    if (gateway?.connected) {
        try {
            const result = await gateway.request<ServicesListResult>("services.list", {});
            if (result?.services) {
                return result.services.map((svc): ServiceCardData => ({
                    id: svc.id,
                    name: svc.name,
                    icon: SERVICE_ICONS[svc.id] || "📁",
                    owner: SCOPE_OWNERS[svc.scope] || "Aline",
                    scope: svc.scope,
                    engagements: Math.floor(Math.random() * 20), // TODO: Get from gateway
                    phaseCount: svc.phaseCount,
                    taskCount: svc.taskCount,
                }));
            }
        } catch {
            // Gateway doesn't support this endpoint, use mock
        }
    }

    return getMockServices();
}

function getMockServices(): ServiceCardData[] {
    return [
        {
            id: "svc_audit_assurance",
            name: "Audit & Assurance",
            icon: "📊",
            owner: "Patrick",
            scope: "global",
            engagements: 4,
            phaseCount: 5,
            taskCount: 12,
        },
        {
            id: "svc_accounting_fin_reporting",
            name: "Accounting & Financial Reporting",
            icon: "📒",
            owner: "Sofia",
            scope: "global",
            engagements: 8,
            phaseCount: 5,
            taskCount: 10,
        },
        {
            id: "svc_advisory_consulting",
            name: "Advisory & Consulting",
            icon: "💡",
            owner: "James",
            scope: "global",
            engagements: 2,
            phaseCount: 4,
            taskCount: 8,
        },
        {
            id: "svc_risk_controls_internal_audit",
            name: "Risk, Controls & Internal Audit",
            icon: "🛡️",
            owner: "Fatima",
            scope: "global",
            engagements: 3,
            phaseCount: 4,
            taskCount: 9,
        },
        {
            id: "svc_mt_tax",
            name: "Malta Tax",
            icon: "🇲🇹",
            owner: "Matthew",
            scope: "malta",
            engagements: 6,
            phaseCount: 4,
            taskCount: 10,
        },
        {
            id: "svc_mt_csp_mbr",
            name: "Malta CSP/MBR",
            icon: "🏢",
            owner: "Claire",
            scope: "malta",
            engagements: 5,
            phaseCount: 4,
            taskCount: 11,
        },
        {
            id: "svc_rw_tax",
            name: "Rwanda Tax",
            icon: "🇷🇼",
            owner: "Emmanuel",
            scope: "rwanda",
            engagements: 4,
            phaseCount: 4,
            taskCount: 9,
        },
        {
            id: "svc_rw_private_notary",
            name: "Rwanda Private Notary",
            icon: "⚖️",
            owner: "Chantal",
            scope: "rwanda",
            engagements: 7,
            phaseCount: 4,
            taskCount: 8,
        },
    ];
}
