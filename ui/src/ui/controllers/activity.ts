import type { ActivityEvent, ActivityEventType } from "../views/activity";

export type ActivityState = {
    events: ActivityEvent[];
    loading: boolean;
    error: string | null;
    filterType: ActivityEventType | null;
    filterAgentId: string | null;
};

/**
 * Create initial activity state
 */
export function createActivityState(): ActivityState {
    return {
        events: [],
        loading: false,
        error: null,
        filterType: null,
        filterAgentId: null,
    };
}

/**
 * Add an event to the activity stream
 */
export function addActivityEvent(
    state: ActivityState,
    event: Omit<ActivityEvent, "id" | "timestamp">,
): ActivityState {
    const newEvent: ActivityEvent = {
        ...event,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };

    return {
        ...state,
        events: [newEvent, ...state.events].slice(0, 100), // Keep last 100 events
    };
}

/**
 * Set the filter for event type
 */
export function setActivityFilter(
    state: ActivityState,
    filterType: ActivityEventType | null,
    filterAgentId: string | null,
): ActivityState {
    return {
        ...state,
        filterType,
        filterAgentId,
    };
}

/**
 * Clear all events
 */
export function clearActivityEvents(state: ActivityState): ActivityState {
    return {
        ...state,
        events: [],
    };
}

/**
 * Set loading state
 */
export function setActivityLoading(
    state: ActivityState,
    loading: boolean,
): ActivityState {
    return {
        ...state,
        loading,
    };
}

/**
 * Set error state
 */
export function setActivityError(
    state: ActivityState,
    error: string | null,
): ActivityState {
    return {
        ...state,
        error,
        loading: false,
    };
}

/**
 * Create a sample event for testing/demo purposes
 */
export function createSampleEvent(
    type: ActivityEventType,
    agentId?: string,
    agentName?: string,
    agentEmoji?: string,
): ActivityEvent {
    const messages: Record<ActivityEventType, string> = {
        agent_task_start: "Started processing user request",
        agent_task_complete: "Completed task successfully",
        agent_task_error: "Task failed with an error",
        user_message: "Sent a message to the agent",
        system_event: "System configuration updated",
        session_start: "New session started",
        session_end: "Session ended",
    };

    return {
        id: crypto.randomUUID(),
        type,
        timestamp: Date.now(),
        agentId,
        agentName,
        agentEmoji,
        message: messages[type] ?? "Unknown event",
    };
}
