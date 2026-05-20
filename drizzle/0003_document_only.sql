PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `markup_sessions__new` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`document` text NOT NULL,
	`thumbnail_path` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `markup_sessions__new` (`id`, `project_id`, `title`, `document`, `thumbnail_path`, `created_at`, `updated_at`)
SELECT `id`, `project_id`, `title`, `document`, `thumbnail_path`, `created_at`, `updated_at`
FROM `markup_sessions`
WHERE `document` IS NOT NULL;
--> statement-breakpoint
DROP TABLE `markup_sessions`;
--> statement-breakpoint
ALTER TABLE `markup_sessions__new` RENAME TO `markup_sessions`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
