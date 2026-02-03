import { describe, it, expect } from "vitest";
import {
    detectMentionTrigger,
    filterAgentsForMention,
    insertMention,
} from "./mention-autocomplete";
import type { GatewayAgentRow } from "../types";

describe("mention-autocomplete", () => {
    describe("detectMentionTrigger", () => {
        it("returns query after @ at start of text", () => {
            expect(detectMentionTrigger("@Sof", 4)).toBe("Sof");
        });

        it("returns query after @ preceded by space", () => {
            expect(detectMentionTrigger("Hello @Sof", 10)).toBe("Sof");
        });

        it("returns empty string for just @", () => {
            expect(detectMentionTrigger("@", 1)).toBe("");
        });

        it("returns null when no @ before cursor", () => {
            expect(detectMentionTrigger("Hello world", 11)).toBeNull();
        });

        it("returns null when @ not preceded by space", () => {
            expect(detectMentionTrigger("email@test", 10)).toBeNull();
        });

        it("returns null when cursor is before @", () => {
            expect(detectMentionTrigger("@Sofia", 0)).toBeNull();
        });
    });

    describe("filterAgentsForMention", () => {
        const agents: GatewayAgentRow[] = [
            { id: "sofia", name: "Sofia", identity: { name: "Sofia", emoji: "👩‍💼" } },
            { id: "yves", name: "Yves", identity: { name: "Yves", emoji: "👨‍💻" } },
            { id: "marie", name: "Marie", identity: { name: "Marie", emoji: "👩‍🔬" } },
        ] as any;

        it("returns all agents for empty query", () => {
            expect(filterAgentsForMention(agents, "")).toHaveLength(3);
        });

        it("filters by name (case insensitive)", () => {
            const result = filterAgentsForMention(agents, "sof");
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("sofia");
        });

        it("filters by id", () => {
            const result = filterAgentsForMention(agents, "yves");
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("yves");
        });

        it("returns empty array when no match", () => {
            expect(filterAgentsForMention(agents, "xyz")).toHaveLength(0);
        });
    });

    describe("insertMention", () => {
        it("replaces @query with @AgentName + space", () => {
            const { newText, newCursorPosition } = insertMention("Hello @Sof", 10, "Sofia");
            expect(newText).toBe("Hello @Sofia ");
            expect(newCursorPosition).toBe(13);
        });

        it("handles @ at start of text", () => {
            const { newText, newCursorPosition } = insertMention("@Y", 2, "Yves");
            expect(newText).toBe("@Yves ");
            expect(newCursorPosition).toBe(6);
        });

        it("preserves text after cursor", () => {
            const { newText } = insertMention("Hello @Sof world", 10, "Sofia");
            expect(newText).toBe("Hello @Sofia  world");
        });

        it("returns original text when no @ found", () => {
            const { newText, newCursorPosition } = insertMention("Hello", 5, "Sofia");
            expect(newText).toBe("Hello");
            expect(newCursorPosition).toBe(5);
        });
    });
});
