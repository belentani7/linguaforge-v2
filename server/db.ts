import { and, count, eq, inArray, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  automationJobs,
  automationRuns,
  cefrLevels,
  diagnosticAttempts,
  exercises,
  languagePaths,
  languages,
  lessonProgress,
  lessons,
  mediaAssets,
  modules,
  srsCards,
  userFeedback,
  userLanguages,
  userTargetLanguages,
  users,
  vocabularyEntries,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserTargetLanguageCodes(userId: number) {
  const db = await getDb();
  if (!db) return [] as string[];
  const rows = await db
    .select({ code: languages.code })
    .from(userTargetLanguages)
    .innerJoin(
      languages,
      eq(userTargetLanguages.targetLanguageId, languages.id),
    )
    .where(eq(userTargetLanguages.userId, userId));
  return rows.map((row) => row.code);
}

export async function replaceUserTargetLanguages(
  userId: number,
  targetCodes: string[],
) {
  const db = await getDb();
  if (!db) return [] as string[];
  const normalizedCodes = Array.from(new Set(targetCodes)).filter(Boolean);
  const languageRows = normalizedCodes.length
    ? await db
        .select({ id: languages.id, code: languages.code })
        .from(languages)
        .where(inArray(languages.code, normalizedCodes))
    : [];
  await db
    .delete(userTargetLanguages)
    .where(eq(userTargetLanguages.userId, userId));
  if (languageRows.length) {
    await db
      .insert(userTargetLanguages)
      .values(
        languageRows.map((language) => ({
          userId,
          targetLanguageId: language.id,
        })),
      );
  }
  return languageRows.map((language) => language.code);
}

export async function getGrowthSummary(userId: number) {
  const db = await getDb();
  if (!db)
    return {
      diagnosticsCompleted: 0,
      lessonsCompleted: 0,
      feedbackSubmitted: 0,
    };
  const [diagnostics, lessons, feedback] = await Promise.all([
    db
      .select({ value: count() })
      .from(diagnosticAttempts)
      .where(eq(diagnosticAttempts.userId, userId)),
    db
      .select({ value: count() })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.status, "completed"),
        ),
      ),
    db
      .select({ value: count() })
      .from(userFeedback)
      .where(eq(userFeedback.userId, userId)),
  ]);
  return {
    diagnosticsCompleted: diagnostics[0]?.value ?? 0,
    lessonsCompleted: lessons[0]?.value ?? 0,
    feedbackSubmitted: feedback[0]?.value ?? 0,
  };
}

export async function submitUserFeedback(
  userId: number,
  category: "lesson" | "exercise" | "accessibility" | "content" | "general",
  message: string,
) {
  const db = await getDb();
  if (!db) return { success: false };
  await db
    .insert(userFeedback)
    .values({ userId, category, message, status: "new" });
  return { success: true };
}

export async function getProgressSummary(userId: number, targetCode: string) {
  const db = await getDb();
  if (!db)
    return {
      targetLanguageCode: targetCode,
      streakDays: 0,
      xp: 0,
      lessonsCompleted: 0,
      currentLevel: "A1" as const,
    };
  const rows = await db
    .select({
      targetLanguageCode: languages.code,
      streakDays: userLanguages.streakDays,
      xp: userLanguages.xp,
      lessonsCompleted: userLanguages.lessonsCompleted,
      currentLevel: userLanguages.currentLevel,
    })
    .from(userLanguages)
    .innerJoin(languages, eq(userLanguages.targetLanguageId, languages.id))
    .where(
      and(eq(userLanguages.userId, userId), eq(languages.code, targetCode)),
    )
    .limit(1);
  return (
    rows[0] ?? {
      targetLanguageCode: targetCode,
      streakDays: 0,
      xp: 0,
      lessonsCompleted: 0,
      currentLevel: "A1" as const,
    }
  );
}

export function levelForCompletedLessons(
  lessonsCompleted: number,
): "A1" | "A2" | "B1" | "B2" | "C1" | "C2" {
  if (lessonsCompleted >= 55) return "C2";
  if (lessonsCompleted >= 35) return "C1";
  if (lessonsCompleted >= 20) return "B2";
  if (lessonsCompleted >= 10) return "B1";
  if (lessonsCompleted >= 5) return "A2";
  return "A1";
}

export async function recordLessonProgress(
  userId: number,
  lessonId: number,
  score: number,
  xpReward: number,
  targetCode: string,
) {
  const db = await getDb();
  if (!db) return;
  const lessonPath = await db
    .select({ targetLanguageId: languagePaths.targetLanguageId })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(languagePaths, eq(modules.pathId, languagePaths.id))
    .innerJoin(languages, eq(languagePaths.targetLanguageId, languages.id))
    .where(and(eq(lessons.id, lessonId), eq(languages.code, targetCode)))
    .limit(1);
  const path = lessonPath[0];
  if (!path)
    throw new Error(
      "Lesson is not associated with the selected target language",
    );
  const now = new Date();
  await db
    .insert(lessonProgress)
    .values({ userId, lessonId, score, status: "completed", completedAt: now });
  const existing = await db
    .select()
    .from(userLanguages)
    .where(
      and(
        eq(userLanguages.userId, userId),
        eq(userLanguages.targetLanguageId, path.targetLanguageId),
      ),
    )
    .limit(1);
  const previous = existing[0];
  if (!previous) {
    await db
      .insert(userLanguages)
      .values({
        userId,
        targetLanguageId: path.targetLanguageId,
        currentLevel: levelForCompletedLessons(1),
        xp: xpReward,
        lessonsCompleted: 1,
        streakDays: 1,
        lastStudyDate: now,
      });
    return;
  }
  const sameDay =
    previous.lastStudyDate &&
    previous.lastStudyDate.toDateString() === now.toDateString();
  const lessonsCompleted = previous.lessonsCompleted + 1;
  await db
    .update(userLanguages)
    .set({
      currentLevel: levelForCompletedLessons(lessonsCompleted),
      xp: previous.xp + xpReward,
      lessonsCompleted,
      streakDays: sameDay ? previous.streakDays : previous.streakDays + 1,
      lastStudyDate: now,
    })
    .where(eq(userLanguages.id, previous.id));
}

export async function recordDiagnosticAttempt(
  userId: number,
  targetCode: string,
  recommendedLevel: string,
  skillScores: Record<string, number>,
) {
  const db = await getDb();
  if (!db) return;
  const language = await db
    .select({ id: languages.id })
    .from(languages)
    .where(eq(languages.code, targetCode))
    .limit(1);
  if (!language[0]) return;
  await db
    .insert(diagnosticAttempts)
    .values({
      userId,
      targetLanguageId: language[0].id,
      recommendedLevel,
      skillScores,
      completedAt: new Date(),
    });
}

export async function getRandomExercises(
  userId: number,
  targetCode: string,
  level: string,
  limit: number,
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: exercises.id,
      kind: exercises.kind,
      prompt: exercises.prompt,
      answer: exercises.answer,
      options: exercises.options,
      explanation: exercises.explanation,
    })
    .from(exercises)
    .innerJoin(lessons, eq(exercises.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(cefrLevels, eq(modules.levelId, cefrLevels.id))
    .innerJoin(languagePaths, eq(modules.pathId, languagePaths.id))
    .innerJoin(languages, eq(languagePaths.targetLanguageId, languages.id))
    .where(
      and(
        eq(languages.code, targetCode),
        eq(cefrLevels.code, level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"),
      ),
    )
    .limit(limit);
}

export async function getDueSrsCards(
  userId: number,
  targetCode: string,
  limit: number,
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: srsCards.id,
      sourceText: vocabularyEntries.sourceText,
      targetText: vocabularyEntries.targetText,
      dueAt: srsCards.dueAt,
      intervalDays: srsCards.intervalDays,
    })
    .from(srsCards)
    .innerJoin(
      vocabularyEntries,
      eq(srsCards.vocabularyEntryId, vocabularyEntries.id),
    )
    .innerJoin(languagePaths, eq(vocabularyEntries.pathId, languagePaths.id))
    .innerJoin(languages, eq(languagePaths.targetLanguageId, languages.id))
    .where(
      and(
        eq(srsCards.userId, userId),
        eq(languages.code, targetCode),
        lte(srsCards.dueAt, new Date()),
      ),
    )
    .limit(limit);
}

export async function reviewSrsCard(
  userId: number,
  cardId: number,
  rating: "again" | "hard" | "good" | "easy",
) {
  const db = await getDb();
  if (!db) return;
  const intervalDays =
    rating === "again" ? 0 : rating === "hard" ? 1 : rating === "good" ? 3 : 7;
  const dueAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
  await db
    .update(srsCards)
    .set({
      state: rating === "again" ? "learning" : "review",
      intervalDays,
      dueAt,
    })
    .where(and(eq(srsCards.id, cardId), eq(srsCards.userId, userId)));
}

export async function startAutomationRun(jobId: number, executionKey: string) {
  const db = await getDb();
  if (!db) return true;
  try {
    await db
      .insert(automationRuns)
      .values({ jobId, executionKey, status: "started" });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return false;
    throw error;
  }
}

export async function finishAutomationRun(
  executionKey: string,
  status: "completed" | "failed" | "duplicate",
  error: string | null = null,
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(automationRuns)
    .set({ status, error, completedAt: new Date() })
    .where(eq(automationRuns.executionKey, executionKey));
}

export async function getAutomationJobByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(automationJobs)
    .where(eq(automationJobs.scheduleCronTaskUid, taskUid))
    .limit(1);
  return rows[0];
}

export async function updateAutomationJobRun(
  taskUid: string,
  lastStatus: string,
  lastError: string | null = null,
  lastResult: string | null = null,
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(automationJobs)
    .set({ lastRunAt: new Date(), lastStatus, lastError, lastResult })
    .where(eq(automationJobs.scheduleCronTaskUid, taskUid));
}

export async function listAutomationJobs(ownerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(automationJobs)
    .where(eq(automationJobs.ownerUserId, ownerUserId))
    .orderBy(automationJobs.createdAt);
}

export async function setAutomationJobStatus(
  ownerUserId: number,
  jobId: number,
  status: "draft" | "paused" | "active" | "failed",
) {
  const db = await getDb();
  if (!db) return { success: false, jobId, status };
  await db
    .update(automationJobs)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(automationJobs.id, jobId),
        eq(automationJobs.ownerUserId, ownerUserId),
      ),
    );
  return { success: true, jobId, status };
}

export async function createAutomationJobDraft(
  ownerUserId: number,
  name: string,
  description: string | undefined,
  idempotencyKey: string,
) {
  const db = await getDb();
  if (!db) return { status: "draft" as const, idempotencyKey };
  await db
    .insert(automationJobs)
    .values({ ownerUserId, name, description, idempotencyKey, status: "draft" })
    .onDuplicateKeyUpdate({
      set: { name, description, updatedAt: new Date() },
    });
  return { status: "draft" as const, idempotencyKey };
}

export async function getPublishedMediaAssets(languageCode?: string) {
  const db = await getDb();
  if (!db) return [];
  const filters = [
    eq(mediaAssets.status, "published" as const),
    eq(mediaAssets.consentStatus, "verified" as const),
  ];
  if (languageCode) filters.push(eq(mediaAssets.languageCode, languageCode));
  return db
    .select({
      id: mediaAssets.id,
      kind: mediaAssets.kind,
      languageCode: mediaAssets.languageCode,
      title: mediaAssets.title,
      publicUrl: mediaAssets.publicUrl,
      mimeType: mediaAssets.mimeType,
      license: mediaAssets.license,
      sourceUrl: mediaAssets.sourceUrl,
    })
    .from(mediaAssets)
    .where(and(...filters))
    .orderBy(mediaAssets.createdAt);
}

export async function getLanguageCatalog() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(languages).orderBy(languages.name);
}

export async function getLearningModules(
  targetCode: string,
  levelCode?: string,
  sourceCode?: string,
) {
  const db = await getDb();
  if (!db) return [];
  const source = alias(languages, "learning_source");
  const target = alias(languages, "learning_target");
  const filters: ReturnType<typeof eq>[] = [eq(target.code, targetCode)];
  if (sourceCode) filters.push(eq(source.code, sourceCode));
  if (levelCode)
    filters.push(
      eq(cefrLevels.code, levelCode as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"),
    );
  return db
    .select({
      moduleId: modules.id,
      moduleType: modules.type,
      moduleTitle: modules.title,
      moduleDescription: modules.description,
      levelCode: cefrLevels.code,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      lessonSummary: lessons.summary,
      estimatedMinutes: lessons.estimatedMinutes,
      xpReward: lessons.xpReward,
    })
    .from(modules)
    .innerJoin(languagePaths, eq(modules.pathId, languagePaths.id))
    .innerJoin(source, eq(languagePaths.sourceLanguageId, source.id))
    .innerJoin(target, eq(languagePaths.targetLanguageId, target.id))
    .innerJoin(cefrLevels, eq(modules.levelId, cefrLevels.id))
    .leftJoin(lessons, eq(lessons.moduleId, modules.id))
    .where(and(...filters))
    .orderBy(modules.sortOrder, lessons.sortOrder);
}

export async function getLanguagePaths(
  sourceCode?: string,
  targetCode?: string,
) {
  const db = await getDb();
  if (!db) return [];
  const source = alias(languages, "source");
  const target = alias(languages, "target");
  const filters: ReturnType<typeof eq>[] = [];
  if (sourceCode) filters.push(eq(source.code, sourceCode));
  if (targetCode) filters.push(eq(target.code, targetCode));
  return db
    .select({
      id: languagePaths.id,
      sourceCode: source.code,
      sourceName: source.nativeName,
      targetCode: target.code,
      targetName: target.nativeName,
      entryCount: languagePaths.entryCount,
    })
    .from(languagePaths)
    .innerJoin(source, eq(languagePaths.sourceLanguageId, source.id))
    .innerJoin(target, eq(languagePaths.targetLanguageId, target.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(source.name, target.name);
}
