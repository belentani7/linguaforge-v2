import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  nativeLanguageCode: varchar("nativeLanguageCode", { length: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const languages = mysqlTable("languages", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  iso639_2: varchar("iso639_2", { length: 8 }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  nativeName: varchar("nativeName", { length: 120 }).notNull(),
  script: varchar("script", { length: 80 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export const languagePaths = mysqlTable("languagePaths", {
  id: int("id").autoincrement().primaryKey(),
  sourceLanguageId: int("sourceLanguageId").notNull(),
  targetLanguageId: int("targetLanguageId").notNull(),
  contentVersion: varchar("contentVersion", { length: 32 })
    .default("0.1.0")
    .notNull(),
  entryCount: int("entryCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export const cefrLevels = mysqlTable("cefrLevels", {
  id: int("id").autoincrement().primaryKey(),
  code: mysqlEnum("code", ["A1", "A2", "B1", "B2", "C1", "C2"])
    .notNull()
    .unique(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull(),
  sortOrder: int("sortOrder").notNull(),
});

export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  pathId: int("pathId").notNull(),
  levelId: int("levelId").notNull(),
  type: mysqlEnum("type", [
    "vocabulary",
    "grammar",
    "pronunciation",
    "conversation",
  ]).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  sortOrder: int("sortOrder").notNull(),
});

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  summary: text("summary").notNull(),
  estimatedMinutes: int("estimatedMinutes").default(10).notNull(),
  xpReward: int("xpReward").default(20).notNull(),
  sortOrder: int("sortOrder").notNull(),
});

export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  kind: mysqlEnum("kind", [
    "fill_blank",
    "matching",
    "translation",
    "multiple_choice",
  ]).notNull(),
  prompt: text("prompt").notNull(),
  answer: text("answer").notNull(),
  options: json("options"),
  explanation: text("explanation"),
  sortOrder: int("sortOrder").notNull(),
});

export const vocabularyEntries = mysqlTable("vocabularyEntries", {
  id: int("id").autoincrement().primaryKey(),
  pathId: int("pathId").notNull(),
  levelId: int("levelId").notNull(),
  topic: varchar("topic", { length: 80 }).notNull(),
  sourceText: text("sourceText").notNull(),
  targetText: text("targetText").notNull(),
  exampleSource: text("exampleSource").notNull(),
  exampleTarget: text("exampleTarget").notNull(),
  pronunciation: text("pronunciation"),
  license: varchar("license", { length: 160 }).notNull(),
  sourceUrl: text("sourceUrl"),
});

export const userLanguages = mysqlTable("userLanguages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetLanguageId: int("targetLanguageId").notNull(),
  diagnosticLevel: varchar("diagnosticLevel", { length: 2 }),
  currentLevel: varchar("currentLevel", { length: 2 }).default("A1").notNull(),
  xp: int("xp").default(0).notNull(),
  lessonsCompleted: int("lessonsCompleted").default(0).notNull(),
  streakDays: int("streakDays").default(0).notNull(),
  lastStudyDate: timestamp("lastStudyDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userTargetLanguages = mysqlTable(
  "userTargetLanguages",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    targetLanguageId: int("targetLanguageId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userTargetLanguageUnique: uniqueIndex("userTargetLanguageUnique").on(
      table.userId,
      table.targetLanguageId,
    ),
  }),
);
export const lessonProgress = mysqlTable("lessonProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  status: mysqlEnum("status", ["started", "completed"])
    .default("started")
    .notNull(),
  score: int("score").default(0).notNull(),
  completedAt: timestamp("completedAt"),
});

export const diagnosticAttempts = mysqlTable("diagnosticAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetLanguageId: int("targetLanguageId").notNull(),
  recommendedLevel: varchar("recommendedLevel", { length: 2 }),
  skillScores: json("skillScores"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userFeedback = mysqlTable("userFeedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", [
    "lesson",
    "exercise",
    "accessibility",
    "content",
    "general",
  ]).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "reviewed", "resolved"])
    .default("new")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const automationRuns = mysqlTable("automationRuns", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  executionKey: varchar("executionKey", { length: 180 }).notNull().unique(),
  status: mysqlEnum("status", ["started", "completed", "failed", "duplicate"])
    .default("started")
    .notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  error: text("error"),
});

export const automationJobs = mysqlTable("automationJobs", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  status: mysqlEnum("status", ["draft", "paused", "active", "failed"])
    .default("draft")
    .notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastStatus: varchar("lastStatus", { length: 40 }),
  lastError: text("lastError"),
  lastResult: text("lastResult"),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mediaAssets = mysqlTable("mediaAssets", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId"),
  kind: mysqlEnum("kind", ["audio", "voice", "video", "image"]).notNull(),
  languageCode: varchar("languageCode", { length: 8 }),
  title: varchar("title", { length: 180 }).notNull(),
  storageKey: text("storageKey").notNull(),
  publicUrl: text("publicUrl").notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  license: varchar("license", { length: 160 }).notNull(),
  sourceUrl: text("sourceUrl"),
  consentStatus: mysqlEnum("consentStatus", [
    "not_required",
    "pending",
    "verified",
    "revoked",
  ])
    .default("pending")
    .notNull(),
  status: mysqlEnum("status", [
    "draft",
    "reviewed",
    "published",
    "blocked",
    "revoked",
  ])
    .default("draft")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const srsCards = mysqlTable("srsCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  vocabularyEntryId: int("vocabularyEntryId").notNull(),
  state: mysqlEnum("state", ["new", "learning", "review"])
    .default("new")
    .notNull(),
  easeFactor: int("easeFactor").default(250).notNull(),
  intervalDays: int("intervalDays").default(0).notNull(),
  repetitions: int("repetitions").default(0).notNull(),
  lapses: int("lapses").default(0).notNull(),
  dueAt: timestamp("dueAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Language = typeof languages.$inferSelect;
export type CEFLevel = typeof cefrLevels.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type VocabularyEntry = typeof vocabularyEntries.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type AutomationJob = typeof automationJobs.$inferSelect;
export type UserFeedback = typeof userFeedback.$inferSelect;
