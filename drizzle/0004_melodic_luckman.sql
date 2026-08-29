CREATE TABLE `automationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`executionKey` varchar(180) NOT NULL,
	`status` enum('started','completed','failed','duplicate') NOT NULL DEFAULT 'started',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`error` text,
	CONSTRAINT `automationRuns_id` PRIMARY KEY(`id`),
	CONSTRAINT `automationRuns_executionKey_unique` UNIQUE(`executionKey`)
);
