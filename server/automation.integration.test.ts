import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  automationJobs,
  automationRuns,
  languagePaths,
  languages,
  lessonProgress,
  lessons,
  modules,
  userLanguages,
  userTargetLanguages,
} from "../drizzle/schema";
import {
  createAutomationJobDraft,
  getDb,
  getGrowthSummary,
  getProgressSummary,
  getUserTargetLanguageCodes,
  recordLessonProgress,
  replaceUserTargetLanguages,
} from "./db";
import { handleAutomationHeartbeat } from "./scheduled";

const enabled =
  process.env.LINGUAFORGE_RUN_DB_INTEGRATION === "1" &&
  Boolean(process.env.DATABASE_URL);
const progressEnabled =
  enabled && process.env.LINGUAFORGE_RUN_PROGRESS_INTEGRATION === "1";
const targetLanguageEnabled =
  enabled && process.env.LINGUAFORGE_RUN_TARGET_LANGUAGE_INTEGRATION === "1";
const routerProgressEnabled =
  enabled && process.env.LINGUAFORGE_RUN_ROUTER_PROGRESS_INTEGRATION === "1";
const exerciseEnabled =
  enabled && process.env.LINGUAFORGE_RUN_EXERCISE_INTEGRATION === "1";
const pathEnabled =
  enabled && process.env.LINGUAFORGE_RUN_PATH_INTEGRATION === "1";

describe.skipIf(!enabled)("automation persistence integration", () => {
  it("keeps one draft for a repeated idempotency key", async () => {
    const db = await getDb();
    if (!db)
      throw new Error(
        "DATABASE_URL was provided but the database client is unavailable",
      );
    const idempotencyKey = `integration-draft-${randomUUID()}`;
    const ownerUserId = 1;

    try {
      await createAutomationJobDraft(
        ownerUserId,
        "Integration draft",
        "Safe cleanup test",
        idempotencyKey,
      );
      await createAutomationJobDraft(
        ownerUserId,
        "Integration draft updated",
        "Same key",
        idempotencyKey,
      );
      const rows = await db
        .select()
        .from(automationJobs)
        .where(eq(automationJobs.idempotencyKey, idempotencyKey));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.name).toBe("Integration draft updated");
    } finally {
      await db
        .delete(automationJobs)
        .where(eq(automationJobs.idempotencyKey, idempotencyKey));
    }
  });

  it.skipIf(!targetLanguageEnabled)(
    "persists and reads multiple target languages without duplicates",
    async () => {
      const db = await getDb();
      if (!db)
        throw new Error(
          "DATABASE_URL was provided but the database client is unavailable",
        );
      const userId = 910000 + Math.floor(Math.random() * 9999);
      try {
        const selected = await replaceUserTargetLanguages(userId, [
          "es",
          "pt",
          "es",
        ]);
        expect(selected).toEqual(["es", "pt"]);
        expect(await getUserTargetLanguageCodes(userId)).toEqual(["es", "pt"]);
        await replaceUserTargetLanguages(userId, ["fr"]);
        expect(await getUserTargetLanguageCodes(userId)).toEqual(["fr"]);
      } finally {
        await db
          .delete(userTargetLanguages)
          .where(eq(userTargetLanguages.userId, userId));
      }
    },
  );

  it.skipIf(!exerciseEnabled)(
    "returns all persisted exercise kinds through the tRPC practice procedure",
    async () => {
      const context: TrpcContext = {
        user: {
          id: 930000 + Math.floor(Math.random() * 9999),
          openId: "exercise-integration",
          email: null,
          name: "Exercise learner",
          loginMethod: "integration",
          nativeLanguageCode: "es",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(context);
      const exercises = await caller.practice.random({
        targetLanguageCode: "en",
        level: "A1",
        limit: 10,
      });
      expect(new Set(exercises.map((exercise) => exercise.kind))).toEqual(
        new Set(["fill_blank", "matching", "translation", "multiple_choice"]),
      );
      expect(
        exercises.every(
          (exercise) =>
            typeof exercise.prompt === "string" &&
            typeof exercise.answer === "string",
        ),
      ).toBe(true);
    },
  );

  it.skipIf(!pathEnabled)(
    "returns only the persisted Portuguese-to-English modules through tRPC",
    async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });
      const modules = await caller.learning.modules({
        sourceLanguageCode: "pt",
        targetLanguageCode: "en",
        level: "A1",
      });
      expect(modules.length).toBeGreaterThan(0);
      expect(
        modules.some(
          (module) => module.lessonTitle === "Perguntas e reações básicas",
        ),
      ).toBe(true);
    },
  );

  it.skipIf(!routerProgressEnabled)(
    "persists progress through the tRPC recordLesson and summary procedures",
    async () => {
      const db = await getDb();
      if (!db)
        throw new Error(
          "DATABASE_URL was provided but the database client is unavailable",
        );
      const userId = 920000 + Math.floor(Math.random() * 9999);
      const lessonRows = await db
        .select({ lessonId: lessons.id })
        .from(lessons)
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .innerJoin(languagePaths, eq(modules.pathId, languagePaths.id))
        .innerJoin(languages, eq(languagePaths.targetLanguageId, languages.id))
        .where(eq(languages.code, "es"))
        .limit(1);
      const lesson = lessonRows[0];
      if (!lesson) {
        console.warn(
          "[integration] Skipping router progress assertion because no Spanish lesson fixture is imported",
        );
        return;
      }
      const context: TrpcContext = {
        user: {
          id: userId,
          openId: `router-progress-${userId}`,
          email: null,
          name: "Integration learner",
          loginMethod: "integration",
          nativeLanguageCode: "pt",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      try {
        const caller = appRouter.createCaller(context);
        await caller.progress.recordLesson({
          lessonId: lesson.lessonId,
          targetLanguageCode: "es",
          score: 94,
          xp: 40,
        });
        await expect(
          caller.progress.summary({ targetLanguageCode: "es" }),
        ).resolves.toMatchObject({
          targetLanguageCode: "es",
          streakDays: 1,
          xp: 40,
          lessonsCompleted: 1,
          currentLevel: "A1",
        });
      } finally {
        await db
          .delete(lessonProgress)
          .where(eq(lessonProgress.userId, userId));
        await db.delete(userLanguages).where(eq(userLanguages.userId, userId));
      }
    },
  );

  it.skipIf(!progressEnabled)(
    "persists lesson progress and returns the updated summary",
    async () => {
      const db = await getDb();
      if (!db)
        throw new Error(
          "DATABASE_URL was provided but the database client is unavailable",
        );
      const userId = 900000 + Math.floor(Math.random() * 9999);
      const lessonRows = await db
        .select({ lessonId: lessons.id, targetLanguageId: languages.id })
        .from(lessons)
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .innerJoin(languagePaths, eq(modules.pathId, languagePaths.id))
        .innerJoin(languages, eq(languagePaths.targetLanguageId, languages.id))
        .where(eq(languages.code, "es"))
        .limit(1);
      const lesson = lessonRows[0];
      if (!lesson)
        throw new Error(
          "The seeded Spanish lesson is required for this integration test",
        );

      try {
        await recordLessonProgress(userId, lesson.lessonId, 92, 35, "es");
        const summary = await getProgressSummary(userId, "es");
        expect(summary).toMatchObject({
          targetLanguageCode: "es",
          streakDays: 1,
          xp: 35,
          lessonsCompleted: 1,
          currentLevel: "A1",
        });
      } finally {
        await db
          .delete(lessonProgress)
          .where(eq(lessonProgress.userId, userId));
        await db.delete(userLanguages).where(eq(userLanguages.userId, userId));
      }
    },
  );

  it("persists heartbeat status, result and run completion", async () => {
    const db = await getDb();
    if (!db)
      throw new Error(
        "DATABASE_URL was provided but the database client is unavailable",
      );
    const taskUid = `integration-task-${randomUUID()}`;
    const executionKey = `integration-run-${randomUUID()}`;
    const ownerUserId = 1;
    let jobId: number | undefined;

    try {
      const draft = await db
        .insert(automationJobs)
        .values({
          ownerUserId,
          name: "Integration heartbeat",
          scheduleCronTaskUid: taskUid,
          status: "active",
          idempotencyKey: `integration-job-${randomUUID()}`,
        });
      jobId = Number(draft[0].insertId);
      const req = {
        header: (name: string) =>
          name === "x-manus-run-uid" ? executionKey : undefined,
      } as never;
      const response = {
        statusCode: 200,
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(payload: unknown) {
          this.payload = payload;
          return this;
        },
        payload: undefined as unknown,
      } as {
        statusCode: number;
        payload?: unknown;
        status(code: number): unknown;
        json(payload: unknown): unknown;
      };

      await handleAutomationHeartbeat(req, response as never, {
        authenticate: async () => ({ isCron: true, taskUid }),
        getJob: async (uid) => {
          const rows = await db
            .select()
            .from(automationJobs)
            .where(eq(automationJobs.scheduleCronTaskUid, uid));
          const row = rows[0];
          return row
            ? { id: row.id, ownerUserId: row.ownerUserId, status: row.status }
            : undefined;
        },
        startRun: async (id, key) => {
          try {
            await db
              .insert(automationRuns)
              .values({ jobId: id, executionKey: key, status: "started" });
            return true;
          } catch (error) {
            if ((error as { code?: string }).code === "ER_DUP_ENTRY")
              return false;
            throw error;
          }
        },
        updateRun: async (uid, status, error = null, result = null) => {
          await db
            .update(automationJobs)
            .set({
              lastRunAt: new Date(),
              lastStatus: status,
              lastError: error,
              lastResult: result,
            })
            .where(eq(automationJobs.scheduleCronTaskUid, uid));
        },
        finishRun: async (key, status, error = null) => {
          await db
            .update(automationRuns)
            .set({ status, error, completedAt: new Date() })
            .where(eq(automationRuns.executionKey, key));
        },
        growthSummary: getGrowthSummary,
      });

      const [job] = await db
        .select()
        .from(automationJobs)
        .where(eq(automationJobs.scheduleCronTaskUid, taskUid));
      const [run] = await db
        .select()
        .from(automationRuns)
        .where(eq(automationRuns.executionKey, executionKey));
      expect(response.statusCode).toBe(200);
      expect(job?.lastStatus).toBe("completed");
      expect(job?.lastError).toBeNull();
      expect(job?.lastResult).toContain("diagnosticsCompleted");
      expect(job?.lastRunAt).toBeInstanceOf(Date);
      expect(run?.status).toBe("completed");
      expect(run?.completedAt).toBeInstanceOf(Date);
    } finally {
      if (jobId)
        await db.delete(automationRuns).where(eq(automationRuns.jobId, jobId));
      await db
        .delete(automationJobs)
        .where(
          and(
            eq(automationJobs.scheduleCronTaskUid, taskUid),
            eq(automationJobs.ownerUserId, ownerUserId),
          ),
        );
    }
  });
});
