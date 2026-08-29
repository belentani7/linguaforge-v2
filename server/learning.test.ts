import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { levelForCompletedLessons } from "./db";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "learner-7",
      email: "learner@example.com",
      name: "Learner",
      loginMethod: "test",
      nativeLanguageCode: "es",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("learning procedures", () => {
  it("derives the CEFR level from completed lessons", () => {
    expect(
      [0, 4, 5, 9, 10, 19, 20, 34, 35, 54, 55].map(levelForCompletedLessons),
    ).toEqual([
      "A1",
      "A1",
      "A2",
      "A2",
      "B1",
      "B1",
      "B2",
      "B2",
      "C1",
      "C1",
      "C2",
    ]);
  });
  it("recommends a CEFR level from diagnostic skill scores", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.diagnostic.complete({
      targetLanguageCode: "es",
      scores: {
        vocabulary: 80,
        grammar: 75,
        comprehension: 72,
        communication: 73,
      },
    });
    expect(result.recommendedLevel).toBe("B2");
    expect(result.targetLanguageCode).toBe("es");
  });

  it("returns the progress contract for a protected learner", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.progress.summary({ targetLanguageCode: "pt" });
    expect(result).toMatchObject({
      targetLanguageCode: "pt",
      streakDays: 0,
      xp: 0,
      lessonsCompleted: 0,
      currentLevel: "A1",
    });
  });

  // Requires a seeded database (see docs/content-import.md). Without DATABASE_URL
  // there are no fixtures, so the assertion would fail on an empty result set.
  it.skipIf(!process.env.DATABASE_URL)(
    "returns the persisted typed practice queue for the seeded A1 English path",
    async () => {
      const caller = appRouter.createCaller(createContext());
      const result = await caller.practice.random({
        targetLanguageCode: "en",
        level: "A1",
        limit: 10,
      });
      expect(new Set(result.map((exercise) => exercise.kind))).toEqual(
        new Set(["fill_blank", "matching", "translation", "multiple_choice"]),
      );
      expect(
        result.every(
          (exercise) =>
            typeof exercise.prompt === "string" &&
            typeof exercise.answer === "string",
        ),
      ).toBe(true);
    },
  );

  it("creates an empty but typed SRS queue until cards are imported", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.srs.queue({
      targetLanguageCode: "en",
      limit: 12,
    });
    expect(result).toEqual({
      targetLanguageCode: "en",
      dueCount: 0,
      cards: [],
    });
  });
});
