ALTER TABLE "events" ADD COLUMN "recurrence_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_all_day" boolean DEFAULT false NOT NULL;