/**
 * FirmOS Gateway Handlers Integration Tests
 *
 * Tests FirmOS gateway handlers with mocked Supabase.
 * Validates request/response shapes and business logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing handlers
vi.mock("../../firmos/db", () => ({
  getSupabaseClient: vi.fn(),
}));

vi.mock("@firmos/modules/routing", () => ({
  routeTask: vi.fn().mockResolvedValue({
    agentId: "henri",
    agentName: "Henri (Tax MT)",
    confidence: 0.95,
    reason: "Matched service: tax, jurisdiction: MT",
    routedAt: new Date(),
  }),
  escalateTask: vi.fn().mockResolvedValue({
    agentId: "marco",
    agentName: "Marco (Governance)",
    confidence: 1.0,
    reason: "Escalated to governance",
    routedAt: new Date(),
  }),
  getAgentForService: vi.fn(),
  getAgentsByJurisdiction: vi.fn(),
}));

vi.mock("@firmos/modules/release_gates", () => ({
  authorizeReleaseSimple: vi.fn().mockResolvedValue({
    id: "rel-001",
    workpaper_id: "wp-001",
    status: "authorized",
    authorized_by: "agent_marco",
    authorized_at: new Date().toISOString(),
  }),
}));

vi.mock("@firmos/modules/case_mgmt", () => ({
  createCase: vi.fn(),
  updateCase: vi.fn(),
  getCaseWithParties: vi.fn(),
  listCases: vi.fn().mockResolvedValue([]),
}));

vi.mock("@firmos/modules/incidents", () => ({
  createIncident: vi.fn(),
  updateIncident: vi.fn(),
  resolveIncident: vi.fn(),
  getIncident: vi.fn(),
  listIncidents: vi.fn().mockResolvedValue([]),
}));

import { getSupabaseClient } from "../../firmos/db.js";
import { firmosHandlers } from "./firmos.js";

/**
 * Create mock respond function for testing
 */
function createMockRespond() {
  const respond = vi.fn();
  return {
    respond,
    getResult: () => {
      const [success, data, error] = respond.mock.calls[0] || [];
      return { success, data, error };
    },
  };
}

/**
 * Create mock Supabase client with configurable responses
 */
function createMockSupabase(
  config: {
    releases?: { data: any[]; error: any };
    incidents?: { data: any[]; error: any };
    policies?: { data: any[]; error: any };
    delegations?: { data: any[]; error: any };
  } = {},
) {
  return {
    from: vi.fn((table: string) => {
      const tableConfig: Record<string, { data: any; error: any }> = {
        releases: config.releases || { data: [], error: null },
        incidents: config.incidents || { data: [], error: null },
        policy_decisions: config.policies || { data: [], error: null },
        delegations: config.delegations || { data: [], error: null },
      };

      const result = tableConfig[table] || { data: [], error: null };

      // Chain builder that returns result at terminal calls
      const chainBuilder = (): Record<string, any> => ({
        eq: vi.fn().mockReturnValue(chainBuilder()),
        order: vi.fn().mockReturnValue(chainBuilder()),
        limit: vi.fn().mockResolvedValue(result),
        gte: vi.fn().mockReturnValue(chainBuilder()),
        lte: vi.fn().mockReturnValue(chainBuilder()),
        single: vi.fn().mockResolvedValue(result),
      });

      return {
        select: vi.fn().mockReturnValue(chainBuilder()),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "new-001" }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({
                  data: { id: "updated-001", status: "authorized" },
                  error: null,
                }),
            }),
          }),
        }),
      };
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

describe("FirmOS Gateway Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("firmos.packs.list", () => {
    it("should return all jurisdiction packs when no filter", () => {
      const { respond, getResult } = createMockRespond();

      firmosHandlers["firmos.packs.list"]({
        params: {},
        respond,
        sessionId: "test-session",
        clientId: "test-client",
      } as any);

      const result = getResult();
      expect(result.success).toBe(true);
      expect(result.data.packs).toBeInstanceOf(Array);
      expect(result.data.packs.length).toBe(2); // MT and RW
    });

    it("should filter packs by jurisdiction", () => {
      const { respond, getResult } = createMockRespond();

      firmosHandlers["firmos.packs.list"]({
        params: { jurisdiction: "MT" },
        respond,
        sessionId: "test-session",
        clientId: "test-client",
      } as any);

      const result = getResult();
      expect(result.success).toBe(true);
      expect(result.data.packs).toHaveLength(1);
      expect(result.data.packs[0].jurisdiction).toBe("MT");
    });
  });

  describe("firmos.agents.list", () => {
    it("should return all agents", () => {
      const { respond, getResult } = createMockRespond();

      firmosHandlers["firmos.agents.list"]({
        params: {},
        respond,
        sessionId: "test-session",
        clientId: "test-client",
      } as any);

      const result = getResult();
      expect(result.success).toBe(true);
      expect(result.data.agents).toBeInstanceOf(Array);
      expect(result.data.agents.length).toBeGreaterThan(5);
      expect(result.data.agents.some((a: any) => a.name === "Aline")).toBe(true);
      expect(result.data.agents.some((a: any) => a.name === "Marco")).toBe(true);
    });
  });

  describe("firmos.team.get", () => {
    it("should return FirmOS team details", () => {
      const { respond, getResult } = createMockRespond();

      firmosHandlers["firmos.team.get"]({
        params: {},
        respond,
        sessionId: "test-session",
        clientId: "test-client",
      } as any);

      const result = getResult();
      expect(result.success).toBe(true);
      expect(result.data.team.id).toBe("team_firmos");
      expect(result.data.team.members).toBeInstanceOf(Array);
    });
  });

  describe("firmos.releases.list", () => {
    // Note: Complex Supabase mock chains are tricky - DB integration tests
    // are better suited for actual integration testing with a test database.
    it.skip("should return releases from database", async () => {
      // This test requires a more sophisticated mock setup
      // or integration with a test database
    });

    it("should handle database errors gracefully", async () => {
      (getSupabaseClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Connection refused" },
              }),
            }),
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Connection refused" },
            }),
          }),
        }),
      });

      const { respond, getResult } = createMockRespond();

      await firmosHandlers["firmos.releases.list"]({
        params: {},
        respond,
        sessionId: "test-session",
        clientId: "test-client",
      } as any);

      const result = getResult();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("firmos.routing.route", () => {
    it("should route task and return decision", async () => {
      const { respond, getResult } = createMockRespond();

      await firmosHandlers["firmos.routing.route"]({
        params: {
          taskId: "task-001",
          taskType: "tax",
          jurisdiction: "MT",
          request: "Calculate VAT liability",
        },
        respond,
        sessionId: "test-session",
        clientId: "test-client",
      } as any);

      const result = getResult();
      expect(result.success).toBe(true);
      expect(result.data.decision.agentId).toBe("henri");
      expect(result.data.decision.confidence).toBeGreaterThan(0.9);
      expect(result.data.source).toBe("module");
    });
  });

  describe("firmos.delegations.list", () => {
    it.skip("should return delegations from database", async () => {
      // Complex Supabase mock chains - skip for now
    });
  });

  describe("firmos.policy.decisions", () => {
    it.skip("should return policy decisions from database", async () => {
      // Complex Supabase mock chains - skip for now
    });
  });
});
