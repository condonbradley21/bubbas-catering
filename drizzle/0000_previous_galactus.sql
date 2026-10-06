CREATE TABLE `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_activity_order` ON `activity` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`payload_hash` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`location` text NOT NULL,
	`preferred_date` text NOT NULL,
	`guest_count` text NOT NULL,
	`event_type` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`cancellation_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_key_unique` ON `orders` (`request_key`);--> statement-breakpoint
CREATE INDEX `idx_orders_created` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`mode` text NOT NULL,
	`refund_key` text,
	`refund_id` text,
	`refund_status` text DEFAULT 'none' NOT NULL,
	`refund_started_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payments_provider_id` ON `payments` (`provider`,`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_order` ON `payments` (`order_id`);