CREATE TABLE `automationJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`scheduleCronTaskUid` varchar(65),
	`status` enum('draft','paused','active','failed') NOT NULL DEFAULT 'draft',
	`lastRunAt` timestamp,
	`lastStatus` varchar(40),
	`lastError` text,
	`idempotencyKey` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automationJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `automationJobs_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
