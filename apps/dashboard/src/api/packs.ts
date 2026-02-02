/**
 * Packs API
 * 
 * Fetches FirmOS jurisdiction pack data from the gateway.
 */

import { getGateway } from './gateway';
import type { Pack, PacksListResult, PackScope } from './types';

export type { Pack, PackScope };

export async function loadPacks(): Promise<Pack[]> {
    const gateway = getGateway();

    if (gateway?.connected) {
        try {
            const result = await gateway.request<PacksListResult>("firmos.packs.list", {});
            if (result?.packs) {
                return result.packs;
            }
        } catch {
            // Gateway doesn't support this endpoint, use mock
        }
    }

    return getMockPacks();
}

function getMockPacks(): Pack[] {
    return [
        {
            id: 'MT_TAX',
            name: 'Malta Tax Pack',
            scope: 'MT',
            description: 'Tax compliance resources for Malta jurisdiction',
            resourceCount: 45,
            lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'MT_CSP',
            name: 'Malta CSP/MBR Pack',
            scope: 'MT',
            description: 'Company service provider and Malta Business Registry resources',
            resourceCount: 38,
            lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'RW_TAX',
            name: 'Rwanda Tax Pack',
            scope: 'RW',
            description: 'Tax compliance resources for Rwanda jurisdiction',
            resourceCount: 32,
            lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'RW_NOTARY',
            name: 'Rwanda Private Notary Pack',
            scope: 'RW',
            description: 'Private notary and authentication resources for Rwanda',
            resourceCount: 28,
            lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'GLOBAL_AUDIT',
            name: 'Global Audit Pack',
            scope: 'MT', // Global packs default to MT
            description: 'Cross-jurisdiction audit standards and procedures',
            resourceCount: 52,
            lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];
}
