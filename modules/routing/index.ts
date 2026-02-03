
/**
 * Routing Module
 * 
 * Re-exports from @firmos/programs for backward compatibility.
 * In v2027+, implementations will live here directly.
 */

import { getSupabaseClient } from '../lib/db.js';
import { logAction } from '../audit_log/index.js';

// Re-export types and functions from the canonical source
export {
    type Jurisdiction,
    type ServiceKey,
    type RouteQuery,
    type RouteResult,
    routeService,
    getServiceById,
    getServicesByJurisdiction,
    getAvailableServiceIds,
    requiresEscalation,
    requiresGuardianPass
} from "@firmos/programs/routing.js";

// Additional types for module API
export interface RoutingRequest {
    taskId: string;
    taskType: string;
    jurisdiction?: "MT" | "RW";
    priority?: "low" | "medium" | "high" | "urgent";
    payload: Record<string, unknown>;
}

export interface RoutingDecision {
    agentId: string;
    agentName: string;
    confidence: number;
    reason: string;
    routedAt: Date;
}

export interface ServiceCatalogEntry {
    id: string;
    serviceId: string;
    agentId: string;
    agentName: string;
    jurisdiction: "MT" | "RW" | "global";
    priority: number;
    isActive: boolean;
}

/**
 * Route Task to Agent (Persisted)
 */
export async function routeTask(request: RoutingRequest): Promise<RoutingDecision> {
    const supabase = getSupabaseClient();

    // 1. Find applicable agents from service catalog
    let builder = supabase
        .from('service_catalog')
        .select('*')
        .eq('is_active', true)
        .eq('service_id', request.taskType);

    if (request.jurisdiction) {
        builder = builder.or(`jurisdiction.eq.${request.jurisdiction},jurisdiction.eq.global`);
    }

    const { data: candidates, error } = await builder.order('priority', { ascending: true });

    if (error) {
        throw new Error(`Failed to query service catalog: ${error.message}`);
    }

    if (!candidates || candidates.length === 0) {
        // Fallback to orchestrator
        return {
            agentId: 'aline',
            agentName: 'Aline (Orchestrator)',
            confidence: 0.5,
            reason: 'No matching service agents found; defaulting to Orchestrator',
            routedAt: new Date()
        };
    }

    // 2. Select best candidate (first by priority)
    const selected = candidates[0];
    const confidence = calculateConfidence(request, selected);

    const decision: RoutingDecision = {
        agentId: selected.agent_id,
        agentName: selected.agent_name,
        confidence,
        reason: `Matched service ${request.taskType} in ${selected.jurisdiction}`,
        routedAt: new Date()
    };

    // 3. Record routing decision
    await supabase.from('routing_decisions').insert({
        task_id: request.taskId,
        task_type: request.taskType,
        jurisdiction: request.jurisdiction,
        priority: request.priority,
        agent_id: decision.agentId,
        confidence: decision.confidence,
        reason: decision.reason
    });

    // 4. Audit Log
    await logAction({
        action: 'task_routed',
        actor: 'system',
        resourceType: 'task',
        resourceId: request.taskId,
        details: {
            agentId: decision.agentId,
            taskType: request.taskType,
            confidence: decision.confidence
        }
    });

    return decision;
}

/**
 * Get Agent for Service (from catalog)
 */
export async function getAgentForService(serviceId: string, jurisdiction?: "MT" | "RW"): Promise<string | null> {
    const supabase = getSupabaseClient();

    let builder = supabase
        .from('service_catalog')
        .select('agent_id')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1);

    if (jurisdiction) {
        builder = builder.or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.global`);
    }

    const { data, error } = await builder.single();

    if (error && error.code !== 'PGRST116') { // Not row-not-found
        throw new Error(`Failed to query service catalog: ${error.message}`);
    }

    return data?.agent_id ?? null;
}

/**
 * Get Agents by Jurisdiction
 */
export async function getAgentsByJurisdiction(jurisdiction: "MT" | "RW"): Promise<string[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('service_catalog')
        .select('agent_id')
        .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.global`)
        .eq('is_active', true);

    if (error) {
        throw new Error(`Failed to query service catalog: ${error.message}`);
    }

    // Deduplicate
    return [...new Set((data || []).map(r => r.agent_id))];
}

/**
 * Escalate Task (transfer to higher authority)
 */
export async function escalateTask(
    taskId: string,
    fromAgent: string,
    reason: string
): Promise<RoutingDecision> {
    const supabase = getSupabaseClient();

    // Escalation target is typically Marco (governance)
    const escalationTarget = 'marco';

    await supabase.from('routing_decisions').insert({
        task_id: taskId,
        task_type: 'escalation',
        agent_id: escalationTarget,
        confidence: 1.0,
        reason: `Escalated by ${fromAgent}: ${reason}`
    });

    await logAction({
        action: 'escalation_triggered',
        actor: fromAgent,
        resourceType: 'task',
        resourceId: taskId,
        details: { reason, escalatedTo: escalationTarget }
    });

    return {
        agentId: escalationTarget,
        agentName: 'Marco (Governance)',
        confidence: 1.0,
        reason: `Escalated: ${reason}`,
        routedAt: new Date()
    };
}

// Helpers

function calculateConfidence(request: RoutingRequest, entry: any): number {
    let conf = 0.8;

    // Boost if jurisdiction matches exactly
    if (entry.jurisdiction === request.jurisdiction) {
        conf += 0.1;
    }

    // Priority agents get slight boost
    if (entry.priority === 1) {
        conf += 0.05;
    }

    return Math.min(conf, 1.0);
}
