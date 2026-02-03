import { render } from "lit";
import { describe, expect, it, vi } from "vitest";
import type { GatewayAgentRow } from "../types";
import { renderAgents, type AgentsProps } from "./agents";

function createAgent(id: string, overrides: Partial<GatewayAgentRow> = {}): GatewayAgentRow {
    return {
        id,
        name: id,
        identity: {
            name: id.charAt(0).toUpperCase() + id.slice(1),
            emoji: "🤖",
        },
        ...overrides,
    };
}

function createProps(overrides: Partial<AgentsProps> = {}): AgentsProps {
    return {
        connected: true,
        agents: [],
        selectedAgentId: null,
        loading: false,
        error: null,
        onAgentSelect: () => undefined,
        onRefresh: () => undefined,
        ...overrides,
    };
}

describe("agents view", () => {
    it("shows not connected message when disconnected", () => {
        const container = document.createElement("div");
        render(renderAgents(createProps({ connected: false })), container);

        expect(container.textContent).toContain("Not connected");
        expect(container.textContent).toContain("Connect to the gateway");
    });

    it("shows empty state when no agents", () => {
        const container = document.createElement("div");
        render(renderAgents(createProps({ connected: true, agents: [] })), container);

        expect(container.textContent).toContain("No agents configured");
        expect(container.textContent).toContain("firmos.json");
    });

    it("renders agent cards for each agent", () => {
        const container = document.createElement("div");
        const agents = [
            createAgent("agent-1", { identity: { name: "Tax Agent", emoji: "📊" } }),
            createAgent("agent-2", { identity: { name: "Audit Agent", emoji: "🔍" } }),
        ];
        render(renderAgents(createProps({ agents })), container);

        expect(container.textContent).toContain("Tax Agent");
        expect(container.textContent).toContain("Audit Agent");
        expect(container.querySelectorAll(".agent-card").length).toBe(2);
    });

    it("calls onAgentSelect when chat button is clicked", () => {
        const container = document.createElement("div");
        const onAgentSelect = vi.fn();
        const agents = [createAgent("test-agent")];
        render(renderAgents(createProps({ agents, onAgentSelect })), container);

        const chatButton = container.querySelector(".agent-card button");
        expect(chatButton).not.toBeNull();
        chatButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(onAgentSelect).toHaveBeenCalledWith("test-agent");
    });

    it("calls onRefresh when refresh button is clicked", () => {
        const container = document.createElement("div");
        const onRefresh = vi.fn();
        render(renderAgents(createProps({ onRefresh })), container);

        const refreshButton = Array.from(container.querySelectorAll("button")).find(
            (btn) => btn.textContent?.includes("Refresh"),
        );
        expect(refreshButton).not.toBeUndefined();
        refreshButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("shows loading state on refresh button", () => {
        const container = document.createElement("div");
        render(renderAgents(createProps({ loading: true })), container);

        expect(container.textContent).toContain("Loading…");
    });

    it("displays error message when error is set", () => {
        const container = document.createElement("div");
        render(renderAgents(createProps({ error: "Failed to load agents" })), container);

        expect(container.textContent).toContain("Failed to load agents");
    });

    it("highlights selected agent card", () => {
        const container = document.createElement("div");
        const agents = [createAgent("agent-1"), createAgent("agent-2")];
        render(renderAgents(createProps({ agents, selectedAgentId: "agent-1" })), container);

        const cards = container.querySelectorAll(".agent-card");
        expect(cards[0]?.classList.contains("agent-card--selected")).toBe(true);
        expect(cards[1]?.classList.contains("agent-card--selected")).toBe(false);
    });

    it("shows metrics when available", () => {
        const container = document.createElement("div");
        const agents = [
            createAgent("agent-1", {
                metrics: {
                    queueDepth: 5,
                    activeSessions: 3,
                },
            }),
        ];
        render(renderAgents(createProps({ agents })), container);

        // New card format shows TASKS label with value in stat box
        expect(container.textContent).toContain("TASKS");
        expect(container.textContent).toContain("5");
    });
});
