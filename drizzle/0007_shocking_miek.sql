CREATE TABLE `userTargetLanguages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetLanguageId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userTargetLanguages_id` PRIMARY KEY(`id`),
	CONSTRAINT `userTargetLanguageUnique` UNIQUE(`userId`,`targetLanguageId`)
);
