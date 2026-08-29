import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAutomationJobDraft: vi.fn(
    async (
      _owner: number,
      _name: string,
      _description: string | undefined,
      idempotencyKey: string,
    ) => ({ status: "draft" as const, idempotencyKey }),
  ),
  listAutomationJobs: vi.fn(async () => []),
  setAutomationJobStatus: vi.fn(
    async (
      _owner: number,
      jobId: number,
      status: "draft" | "paused" | "active" | "failed",
    ) => ({ success: true, jobId, status }),
  ),
  getGrowthSummary: vi.fn(async () => ({
    diagnosticsCompleted: 2,
    lessonsCompleted: 5,
    feedbackSubmitted: 1,
  })),
  submitUserFeedback: vi.fn(
    async (_user: number, _category: string, _message: string) => ({
      success: true,
    }),
  ),
}));

vi.mock("./db", () => ({
  createAutomationJobDraft: mocks.createAutomationJobDraft,
  listAutomationJobs: mocks.listAutomationJobs,
  setAutomationJobStatus: mocks.setAutomationJobStatus,
  getGrowthSummary: mocks.getGrowthSummary,
  submitUserFeedback: mocks.submitUserFeedback,
  getDueSrsCards: vi.fn(async () => []),
  getLanguageCatalog: vi.fn(async () => []),
  getLanguagePaths: vi.fn(async () => []),
  getProgressSummary: vi.fn(async () => ({
    targetLanguageCode: "es",
    streakDays: 0,
    xp: 0,
    lessonsCompleted: 0,
    currentLevel: "A1",
  })),
  getPublishedMediaAssets: vi.fn(async () => []),
  getRandomExercises: vi.fn(async () => []),
  recordDiagnosticAttempt: vi.fn(async () => undefined),
  recordLessonProgress: vi.fn(async () => undefined),
  reviewSrsCard: vi.fn(async () => undefined),
  upsertUser: vi.fn(async () => undefined),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  const now = new Date();
  return {
    user: {
      id: 42,
      openId: "owner-test",
      name: "Owner",
      email: "owner@example.com",
      loginMethod: "test",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("automation procedures", () => {
  it("creates an idempotent draft for the authenticated owner", async () => {
    const caller = appRouter.createCaller(createContext());
    const input = {
      name: "Preparar resumen",
      description: "Solo borrador",
      idempotencyKey: "summary-owner-42",
    };
    await caller.automation.createDraft(input);
    await caller.automation.createDraft(input);
    expect(mocks.createAutomationJobDraft).toHaveBeenNthCalledWith(
      1,
      42,
      input.name,
      input.description,
      input.idempotencyKey,
    );
    expect(mocks.createAutomationJobDraft).toHaveBeenNthCalledWith(
      2,
      42,
      input.name,
      input.description,
      input.idempotencyKey,
    );
  });

  it("pauses a job using the authenticated owner id", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.automation.pause({ jobId: 7 });
    expect(mocks.setAutomationJobStatus).toHaveBeenCalledWith(42, 7, "paused");
  });

  it("resumes a job using the authenticated owner id", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.automation.resume({ jobId: 7 });
    expect(mocks.setAutomationJobStatus).toHaveBeenCalledWith(42, 7, "active");
  });

  it("returns aggregated growth metrics for the authenticated owner", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.growth.summary()).resolves.toEqual({
      diagnosticsCompleted: 2,
      lessonsCompleted: 5,
      feedbackSubmitted: 1,
    });
    expect(mocks.getGrowthSummary).toHaveBeenCalledWith(42);
  });

  it("stores feedback under the authenticated owner", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.growth.feedback({
      category: "exercise",
      message: "El ejercicio necesita una explicación más clara.",
    });
    expect(mocks.submitUserFeedback).toHaveBeenCalledWith(
      42,
      "exercise",
      "El ejercicio necesita una explicación más clara.",
    );
  });
});
