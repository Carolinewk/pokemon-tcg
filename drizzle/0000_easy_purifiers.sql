CREATE TABLE `room_posts` (
	`room` text NOT NULL,
	`post_index` integer NOT NULL,
	`post_name` text NOT NULL,
	`server_time` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`room`, `post_index`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `room_posts_name` ON `room_posts` (`room`,`post_name`);