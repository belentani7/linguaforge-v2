CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int,
	`kind` enum('audio','voice','video','image') NOT NULL,
	`languageCode` varchar(8),
	`title` varchar(180) NOT NULL,
	`storageKey` text NOT NULL,
	`publicUrl` text NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`license` varchar(160) NOT NULL,
	`sourceUrl` text,
	`consentStatus` enum('not_required','pending','verified','revoked') NOT NULL DEFAULT 'pending',
	`status` enum('draft','reviewed','published','blocked','revoked') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`)
);
