import { render } from "lit";
import { describe, expect, it, vi } from "vitest";
import type { GatewayAgentRow } from "../types";
import { renderAgentSelector, type AgentSelectorProps } from "./agent-selector";

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

function createProps(overrides: Partial<AgentSelectorProps> = {}): AgentSelectorProps {
    return {
        connected: true,
        agents: [],
        currentAgentId: null,
        isGroupChat: false,
        onAgentSelect: () => undefined,
        onGroupChatSelect: () => undefined,
        ...overrides,
    };
}

describe("agent-selector view", () => {
    it("returns nothing when not connected", () => {
        const container = document.createElement("div");
        render(renderAgentSelector(createProps({ connected: false })), container);
        // Lit's 'nothing' renders as an HTML comment
        expect(container.querySelector(".agent-selector")).toBeNull();
    });

    it("returns nothing when no agents", () => {
        const container = document.createElement("div");
        render(renderAgentSelector(createProps({ agents: [] })), container);
        // Lit's 'nothing' renders as an HTML comment
        expect(container.querySelector(".agent-selector")).toBeNull();
    });

    it("renders agent pills for each agent", () => {
        const container = document.createElement("div");
        const agents = [
            createAgent("agent-1", { identity: { name: "Tax Agent", emoji: "📊" } }),
            createAgent("agent-2", { identity: { name: "Audit Agent", emoji: "🔍" } }),
        ];
        render(renderAgentSelector(createProps({ agents })), container);

        expect(container.textContent).toContain("Tax Agent");
        expect(container.textContent).toContain("Audit Agent");
        expect(container.querySelectorAll(".agent-pill").length).toBeGreaterThanOrEqual(3); // 2 agents + group
    });

    it("calls onAgentSelect when agent pill is clicked", () => {
        const container = document.createElement("div");
        const onAgentSelect = vi.fn();
        const agents = [createAgent("test-agent")];
        render(renderAgentSelector(createProps({ agents, onAgentSelect })), container);

        const pills = container.querySelectorAll(".agent-pill:not(.agent-pill--group)");
        expect(pills.length).toBeGreaterThan(0);
        pills[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(onAgentSelect).toHaveBeenCalledWith("test-agent");
    });

    it("calls onGroupChatSelect when group pill is clicked", () => {
        const container = document.createElement("div");
        const onGroupChatSelect = vi.fn();
        const agents = [createAgent("test-agent")];
        render(renderAgentSelector(createProps({ agents, onGroupChatSelect })), container);

        const groupPill = container.querySelector(".agent-pill--group");
        expect(groupPill).not.toBeNull();
        groupPill?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(onGroupChatSelect).toHaveBeenCalledTimes(1);
    });

    it("highlights selected agent pill", () => {
        const container = document.createElement("div");
        const agents = [createAgent("agent-1"), createAgent("agent-2")];
        render(
            renderAgentSelector(createProps({ agents, currentAgentId: "agent-1", isGroupChat: false })),
            container,
        );

        const pills = container.querySelectorAll(".agent-pill:not(.agent-pill--group)");
        expect(pills[0]?.classList.contains("agent-pill--selected")).toBe(true);
        expect(pills[1]?.classList.contains("agent-pill--selected")).toBe(false);
    });

    it("highlights group pill when isGroupChat is true", () => {
        const container = document.createElement("div");
        const agents = [createAgent("agent-1")];
        render(
            renderAgentSelector(createProps({ agents, isGroupChat: true })),
            container,
        );

        const groupPill = container.querySelector(".agent-pill--group");
        expect(groupPill?.classList.contains("agent-pill--selected")).toBe(true);
    });

    it("shows overflow badge when agents exceed maxVisiblePills", () => {
        const container = document.createElement("div");
        const agents = [
            createAgent("agent-1"),
            createAgent("agent-2"),
            createAgent("agent-3"),
            createAgent("agent-4"),
            createAgent("agent-5"),
        ];
        render(
            renderAgentSelector(createProps({ agents, maxVisiblePills: 3 })),
            container,
        );

        const overflow = container.querySelector(".agent-pill--overflow");
        expect(overflow).not.toBeNull();
        expect(overflow?.textContent).toContain("+2");
    });
});
