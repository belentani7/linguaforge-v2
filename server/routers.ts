import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAutomationJobDraft,
  getDueSrsCards,
  getGrowthSummary,
  getLanguageCatalog,
  getLanguagePaths,
  getLearningModules,
  getProgressSummary,
  getPublishedMediaAssets,
  getRandomExercises,
  getUserTargetLanguageCodes,
  listAutomationJobs,
  recordDiagnosticAttempt,
  recordLessonProgress,
  replaceUserTargetLanguages,
  reviewSrsCard,
  setAutomationJobStatus,
  submitUserFeedback,
  upsertUser,
} from "./db";
import {
  LANGUAGE_CATALOG,
  CEFR_LEVELS,
  buildBidirectionalPaths,
} from "../shared/languages";

const languageCode = z
  .string()
  .regex(/^[a-z]{2,3}$/, "language code must be 2-3 lowercase letters");
const displayName = z
  .string()
  .trim()
  .regex(/^[\p{L}\p{N} ._'\-]{1,120}$/u, "name contains invalid characters");
const skillScores = z.object({
  vocabulary: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  comprehension: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
});
const cefrCode = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  growth: router({
    summary: protectedProcedure.query(({ ctx }) =>
      getGrowthSummary(ctx.user.id),
    ),
    feedback: protectedProcedure
      .input(
        z.object({
          category: z.enum([
            "lesson",
            "exercise",
            "accessibility",
            "content",
            "general",
          ]),
          message: z.string().trim().min(8).max(2000),
        }),
      )
      .mutation(({ ctx, input }) =>
        submitUserFeedback(ctx.user.id, input.category, input.message),
      ),
  }),
  automation: router({
    list: protectedProcedure.query(({ ctx }) =>
      listAutomationJobs(ctx.user.id),
    ),
    createDraft: protectedProcedure
      .input(
        z.object({
          name: displayName,
          description: z.string().trim().max(500).optional(),
          idempotencyKey: z.string().trim().min(8).max(160),
        }),
      )
      .mutation(({ ctx, input }) =>
        createAutomationJobDraft(
          ctx.user.id,
          input.name,
          input.description,
          input.idempotencyKey,
        ),
      ),
    pause: protectedProcedure
      .input(z.object({ jobId: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        setAutomationJobStatus(ctx.user.id, input.jobId, "paused"),
      ),
    resume: protectedProcedure
      .input(z.object({ jobId: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        setAutomationJobStatus(ctx.user.id, input.jobId, "active"),
      ),
  }),
  media: router({
    published: publicProcedure
      .input(z.object({ languageCode: languageCode.optional() }).optional())
      .query(({ input }) => getPublishedMediaAssets(input?.languageCode)),
  }),
  learning: router({
    modules: publicProcedure
      .input(
        z.object({
          targetLanguageCode: languageCode,
          sourceLanguageCode: languageCode.optional(),
          level: cefrCode.optional(),
        }),
      )
      .query(({ input }) =>
        getLearningModules(
          input.targetLanguageCode,
          input.level,
          input.sourceLanguageCode,
        ),
      ),
  }),
  languages: router({
    list: publicProcedure.query(async () => {
      const rows = await getLanguageCatalog();
      return rows.length ? rows : LANGUAGE_CATALOG;
    }),
    paths: publicProcedure
      .input(
        z
          .object({
            sourceCode: languageCode.optional(),
            targetCode: languageCode.optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const rows = await getLanguagePaths(
          input?.sourceCode,
          input?.targetCode,
        );
        return rows.length
          ? rows
          : buildBidirectionalPaths()
              .filter(
                (path) =>
                  (!input?.sourceCode ||
                    path.sourceLanguage === input.sourceCode) &&
                  (!input?.targetCode ||
                    path.targetLanguage === input.targetCode),
              )
              .map((path) => ({
                id: 0,
                sourceCode: path.sourceLanguage,
                sourceName: path.sourceLanguage,
                targetCode: path.targetLanguage,
                targetName: path.targetLanguage,
                entryCount: 0,
              }));
      }),
    levels: publicProcedure.query(() => CEFR_LEVELS),
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => ({
      ...ctx.user,
      targetLanguageCodes: await getUserTargetLanguageCodes(ctx.user.id),
    })),
    update: protectedProcedure
      .input(
        z.object({
          name: displayName.optional(),
          nativeLanguageCode: languageCode.optional(),
          targetLanguageCodes: z.array(languageCode).max(9).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await upsertUser({
          openId: ctx.user.openId,
          name: input.name,
          nativeLanguageCode: input.nativeLanguageCode,
        });
        const targetLanguageCodes =
          input.targetLanguageCodes === undefined
            ? await getUserTargetLanguageCodes(ctx.user.id)
            : await replaceUserTargetLanguages(
                ctx.user.id,
                input.targetLanguageCodes,
              );
        return { success: true, targetLanguageCodes } as const;
      }),
  }),
  diagnostic: router({
    start: protectedProcedure
      .input(z.object({ targetLanguageCode: languageCode }))
      .mutation(({ input }) => ({
        targetLanguageCode: input.targetLanguageCode,
        totalQuestions: 8,
        estimatedMinutes: 4,
      })),
    complete: protectedProcedure
      .input(
        z.object({ targetLanguageCode: languageCode, scores: skillScores }),
      )
      .mutation(async ({ ctx, input }) => {
        const average =
          Object.values(input.scores).reduce((sum, score) => sum + score, 0) /
          4;
        const recommendedLevel =
          average >= 85
            ? "C1"
            : average >= 70
              ? "B2"
              : average >= 55
                ? "B1"
                : average >= 40
                  ? "A2"
                  : "A1";
        await recordDiagnosticAttempt(
          ctx.user.id,
          input.targetLanguageCode,
          recommendedLevel,
          input.scores,
        );
        return {
          targetLanguageCode: input.targetLanguageCode,
          recommendedLevel,
          scores: input.scores,
        };
      }),
  }),
  practice: router({
    random: protectedProcedure
      .input(
        z.object({
          targetLanguageCode: languageCode,
          level: cefrCode,
          limit: z.number().int().min(1).max(20).default(10),
        }),
      )
      .query(({ ctx, input }) =>
        getRandomExercises(
          ctx.user.id,
          input.targetLanguageCode,
          input.level,
          input.limit,
        ),
      ),
  }),
  progress: router({
    summary: protectedProcedure
      .input(z.object({ targetLanguageCode: languageCode }))
      .query(({ ctx, input }) =>
        getProgressSummary(ctx.user.id, input.targetLanguageCode),
      ),
    recordLesson: protectedProcedure
      .input(
        z.object({
          lessonId: z.number().int().positive(),
          targetLanguageCode: languageCode,
          score: z.number().min(0).max(100),
          xp: z.number().int().min(0),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await recordLessonProgress(
          ctx.user.id,
          input.lessonId,
          input.score,
          input.xp,
          input.targetLanguageCode,
        );
        return { success: true, ...input };
      }),
  }),
  srs: router({
    queue: protectedProcedure
      .input(
        z.object({
          targetLanguageCode: languageCode,
          limit: z.number().int().min(1).max(50).default(24),
        }),
      )
      .query(async ({ ctx, input }) => {
        const cards = await getDueSrsCards(
          ctx.user.id,
          input.targetLanguageCode,
          input.limit,
        );
        return {
          targetLanguageCode: input.targetLanguageCode,
          dueCount: cards.length,
          cards,
        };
      }),
    review: protectedProcedure
      .input(
        z.object({
          cardId: z.number().int().positive(),
          rating: z.enum(["again", "hard", "good", "easy"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await reviewSrsCard(ctx.user.id, input.cardId, input.rating);
        return { success: true, nextRating: input.rating };
      }),
  }),
});

export type AppRouter = typeof appRouter;
