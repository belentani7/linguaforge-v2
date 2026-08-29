CREATE TABLE `cefrLevels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` enum('A1','A2','B1','B2','C1','C2') NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`sortOrder` int NOT NULL,
	CONSTRAINT `cefrLevels_id` PRIMARY KEY(`id`),
	CONSTRAINT `cefrLevels_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `diagnosticAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetLanguageId` int NOT NULL,
	`recommendedLevel` varchar(2),
	`skillScores` json,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnosticAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`kind` enum('fill_blank','matching','translation','multiple_choice') NOT NULL,
	`prompt` text NOT NULL,
	`answer` text NOT NULL,
	`options` json,
	`explanation` text,
	`sortOrder` int NOT NULL,
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `languagePaths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceLanguageId` int NOT NULL,
	`targetLanguageId` int NOT NULL,
	`contentVersion` varchar(32) NOT NULL DEFAULT '0.1.0',
	`entryCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `languagePaths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `languages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(8) NOT NULL,
	`iso639_2` varchar(8) NOT NULL,
	`name` varchar(80) NOT NULL,
	`nativeName` varchar(120) NOT NULL,
	`script` varchar(80) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `languages_id` PRIMARY KEY(`id`),
	CONSTRAINT `languages_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `lessonProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`status` enum('started','completed') NOT NULL DEFAULT 'started',
	`score` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	CONSTRAINT `lessonProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`summary` text NOT NULL,
	`estimatedMinutes` int NOT NULL DEFAULT 10,
	`xpReward` int NOT NULL DEFAULT 20,
	`sortOrder` int NOT NULL,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pathId` int NOT NULL,
	`levelId` int NOT NULL,
	`type` enum('vocabulary','grammar','pronunciation','conversation') NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`sortOrder` int NOT NULL,
	CONSTRAINT `modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srsCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`vocabularyEntryId` int NOT NULL,
	`state` enum('new','learning','review') NOT NULL DEFAULT 'new',
	`easeFactor` int NOT NULL DEFAULT 250,
	`intervalDays` int NOT NULL DEFAULT 0,
	`repetitions` int NOT NULL DEFAULT 0,
	`lapses` int NOT NULL DEFAULT 0,
	`dueAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `srsCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userLanguages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetLanguageId` int NOT NULL,
	`diagnosticLevel` varchar(2),
	`currentLevel` varchar(2) NOT NULL DEFAULT 'A1',
	`xp` int NOT NULL DEFAULT 0,
	`lessonsCompleted` int NOT NULL DEFAULT 0,
	`streakDays` int NOT NULL DEFAULT 0,
	`lastStudyDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userLanguages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vocabularyEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pathId` int NOT NULL,
	`levelId` int NOT NULL,
	`topic` varchar(80) NOT NULL,
	`sourceText` text NOT NULL,
	`targetText` text NOT NULL,
	`exampleSource` text NOT NULL,
	`exampleTarget` text NOT NULL,
	`pronunciation` text,
	`license` varchar(160) NOT NULL,
	`sourceUrl` text,
	CONSTRAINT `vocabularyEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `nativeLanguageCode` varchar(8);