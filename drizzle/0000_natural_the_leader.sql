CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`service` text NOT NULL,
	`consent` integer NOT NULL,
	`created_at` integer NOT NULL
);
