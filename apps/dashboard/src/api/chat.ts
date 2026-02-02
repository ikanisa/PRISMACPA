/**
 * Chat API
 * 
 * Helpers for chat-related gateway RPCs.
 */

import { getGateway } from './gateway';
import type { ChatHistoryResult, ChatSendResult, SessionsListResult, AgentsListResult } from './types';

export type ChatSendOptions = {
    sessionKey: string;
    message: string;
    thinking?: string;
    timeoutMs?: number;
};

/**
 * Send a chat message to the gateway.
 */
export async function sendChatMessage(options: ChatSendOptions): Promise<ChatSendResult> {
    const gateway = getGateway();
    if (!gateway?.connected) {
        throw new Error('Gateway not connected');
    }

    const idempotencyKey = crypto.randomUUID();
    return gateway.request<ChatSendResult>('chat.send', {
        sessionKey: options.sessionKey,
        message: options.message,
        thinking: options.thinking,
        timeoutMs: options.timeoutMs,
        idempotencyKey,
    });
}

/**
 * Load chat history for a session.
 */
export async function loadChatHistory(sessionKey: string, limit = 100): Promise<ChatHistoryResult> {
    const gateway = getGateway();
    if (!gateway?.connected) {
        throw new Error('Gateway not connected');
    }

    return gateway.request<ChatHistoryResult>('chat.history', {
        sessionKey,
        limit,
    });
}

/**
 * Abort a running chat request.
 */
export async function abortChatRun(sessionKey: string, runId?: string): Promise<{ ok: boolean; aborted: boolean }> {
    const gateway = getGateway();
    if (!gateway?.connected) {
        throw new Error('Gateway not connected');
    }

    return gateway.request<{ ok: boolean; aborted: boolean }>('chat.abort', {
        sessionKey,
        runId,
    });
}

/**
 * List available sessions.
 */
export async function listSessions(options?: {
    limit?: number;
    activeMinutes?: number;
    agentId?: string;
}): Promise<SessionsListResult> {
    const gateway = getGateway();
    if (!gateway?.connected) {
        throw new Error('Gateway not connected');
    }

    return gateway.request<SessionsListResult>('sessions.list', {
        limit: options?.limit ?? 50,
        activeMinutes: options?.activeMinutes,
        agentId: options?.agentId,
        includeDerivedTitles: true,
        includeLastMessage: true,
    });
}

/**
 * List available agents.
 */
export async function listAgents(): Promise<AgentsListResult> {
    const gateway = getGateway();
    if (!gateway?.connected) {
        throw new Error('Gateway not connected');
    }

    return gateway.request<AgentsListResult>('agents.list', {});
}
