ALTER TABLE "jobs" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "pipelines" ADD COLUMN "action_config" jsonb;