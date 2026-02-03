import { render } from "lit";
import { describe, expect, it, vi } from "vitest";
import type { GatewayAgentRow } from "../types";
import { renderActivity, type ActivityProps, type ActivityEvent } from "./activity";

function createEvent(
    id: string,
    overrides: Partial<ActivityEvent> = {},
): ActivityEvent {
    return {
        id,
        type: "agent_task_complete",
        timestamp: Date.now(),
        message: "Test event message",
        ...overrides,
    };
}

function createProps(overrides: Partial<ActivityProps> = {}): ActivityProps {
    return {
        connected: true,
        events: [],
        agents: [],
        loading: false,
        error: null,
        filterType: null,
        filterAgentId: null,
        onFilterChange: () => undefined,
        onRefresh: () => undefined,
        ...overrides,
    };
}

describe("activity view", () => {
    it("shows not connected message when disconnected", () => {
        const container = document.createElement("div");
        render(renderActivity(createProps({ connected: false })), container);

        expect(container.textContent).toContain("Not connected");
        expect(container.textContent).toContain("Connect to the gateway");
    });

    it("shows empty state when no events", () => {
        const container = document.createElement("div");
        render(renderActivity(createProps({ events: [] })), container);

        expect(container.textContent).toContain("No activity events yet");
        expect(container.textContent).toContain("Events will appear here");
    });

    it("renders events list", () => {
        const container = document.createElement("div");
        const events = [
            createEvent("event-1", { message: "First event" }),
            createEvent("event-2", { message: "Second event" }),
        ];
        render(renderActivity(createProps({ events })), container);

        expect(container.textContent).toContain("First event");
        expect(container.textContent).toContain("Second event");
        expect(container.querySelectorAll(".activity-event").length).toBe(2);
    });

    it("shows agent info when provided", () => {
        const container = document.createElement("div");
        const events = [
            createEvent("event-1", {
                agentId: "agent-1",
                agentName: "Tax Agent",
                agentEmoji: "📊",
                message: "Processing tax return",
            }),
        ];
        render(renderActivity(createProps({ events })), container);

        expect(container.textContent).toContain("Tax Agent");
        expect(container.textContent).toContain("📊");
    });

    it("calls onRefresh when refresh button is clicked", () => {
        const container = document.createElement("div");
        const onRefresh = vi.fn();
        render(renderActivity(createProps({ onRefresh })), container);

        const refreshBtn = container.querySelector(".btn");
        expect(refreshBtn).not.toBeNull();
        refreshBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("shows loading state on refresh button", () => {
        const container = document.createElement("div");
        render(renderActivity(createProps({ loading: true })), container);

        const refreshBtn = container.querySelector(".btn");
        expect(refreshBtn?.textContent?.trim()).toBe("Loading…");
        expect(refreshBtn?.hasAttribute("disabled")).toBe(true);
    });

    it("shows error message when error is set", () => {
        const container = document.createElement("div");
        render(
            renderActivity(createProps({ error: "Failed to load events" })),
            container,
        );

        expect(container.textContent).toContain("Failed to load events");
        expect(container.querySelector(".callout.danger")).not.toBeNull();
    });

    it("renders filter dropdowns", () => {
        const container = document.createElement("div");
        const agents: GatewayAgentRow[] = [
            { id: "agent-1", identity: { name: "Agent One" } },
        ];
        render(renderActivity(createProps({ agents })), container);

        const selects = container.querySelectorAll(".activity-filters__select");
        expect(selects.length).toBe(2); // Type filter + Agent filter
    });
});
