import { describe, expect, it } from "vitest";
import { buildExecutionKey, handleAutomationHeartbeat } from "./scheduled";

describe("scheduled execution keys", () => {
  it("prefers the scheduler run identifier when present", () => {
    expect(buildExecutionKey("task-1", "run-abc", 1_700_000_000_000)).toBe(
      "run-abc",
    );
  });

  it("creates a stable minute bucket when the scheduler omits a run identifier", () => {
    const first = buildExecutionKey("task-1", undefined, 1_700_000_000_000);
    const retry = buildExecutionKey("task-1", undefined, 1_700_000_030_000);
    const nextWindow = buildExecutionKey(
      "task-1",
      undefined,
      1_700_000_060_000,
    );

    expect(first).toBe(retry);
    expect(nextWindow).not.toBe(first);
  });

  it("keeps task namespaces isolated", () => {
    expect(buildExecutionKey("task-1", undefined, 1_700_000_000_000)).not.toBe(
      buildExecutionKey("task-2", undefined, 1_700_000_000_000),
    );
  });
});

describe("handleAutomationHeartbeat", () => {
  function createRequest(headers: Record<string, string> = {}) {
    return { header: (name: string) => headers[name.toLowerCase()] } as any;
  }

  function createResponse() {
    const response = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        response.statusCode = code;
        return response;
      },
      json(body: unknown) {
        response.body = body;
        return response;
      },
    };
    return response;
  }

  function deps(overrides: Record<string, unknown> = {}) {
    return {
      authenticate: async () => ({ isCron: true, taskUid: "task-1" }),
      getJob: async () => ({
        id: 7,
        ownerUserId: 42,
        status: "active" as const,
      }),
      startRun: async () => true,
      updateRun: async () => undefined,
      finishRun: async () => undefined,
      growthSummary: async () => ({
        diagnosticsCompleted: 1,
        lessonsCompleted: 2,
        feedbackSubmitted: 0,
      }),
      ...overrides,
    } as any;
  }

  it("acknowledges an active job and records completion", async () => {
    const updates: unknown[] = [];
    const finishes: unknown[] = [];
    const response = createResponse();
    await handleAutomationHeartbeat(
      createRequest({ "x-run-uid": "run-1" }),
      response,
      deps({
        updateRun: async (...args: unknown[]) => updates.push(args),
        finishRun: async (...args: unknown[]) => finishes.push(args),
      }),
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      jobId: 7,
      status: "completed",
      executionKey: "run-1",
      report: {
        diagnosticsCompleted: 1,
        lessonsCompleted: 2,
        feedbackSubmitted: 0,
      },
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toContain(
      JSON.stringify({
        diagnosticsCompleted: 1,
        lessonsCompleted: 2,
        feedbackSubmitted: 0,
      }),
    );
    expect(finishes).toHaveLength(1);
  });

  it("skips paused jobs", async () => {
    const updates: unknown[] = [];
    const response = createResponse();
    await handleAutomationHeartbeat(
      createRequest(),
      response,
      deps({
        getJob: async () => ({
          id: 7,
          ownerUserId: 42,
          status: "paused" as const,
        }),
        updateRun: async (...args: unknown[]) => updates.push(args),
      }),
    );
    expect(response.body).toMatchObject({ ok: true, skipped: "paused" });
    expect(updates[0]).toContain("skipped-paused");
  });

  it("skips orphan task UIDs without writing a run", async () => {
    let started = false;
    const response = createResponse();
    await handleAutomationHeartbeat(
      createRequest(),
      response,
      deps({
        getJob: async () => undefined,
        startRun: async () => {
          started = true;
          return true;
        },
      }),
    );
    expect(response.body).toEqual({ ok: true, skipped: "orphan" });
    expect(started).toBe(false);
  });

  it("recognizes duplicate execution keys", async () => {
    const response = createResponse();
    await handleAutomationHeartbeat(
      createRequest({ "x-run-uid": "same-run" }),
      response,
      deps({ startRun: async () => false }),
    );
    expect(response.body).toMatchObject({
      ok: true,
      duplicate: true,
      executionKey: "same-run",
    });
  });

  it("records failures and returns a bounded error response", async () => {
    const failures: unknown[] = [];
    const response = createResponse();
    await handleAutomationHeartbeat(
      createRequest(),
      response,
      deps({
        getJob: async () => {
          throw new Error("database unavailable");
        },
        updateRun: async (...args: unknown[]) => failures.push(args),
      }),
    );
    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({ error: "database unavailable" });
    expect(failures[0]).toContain("failed");
  });
});
