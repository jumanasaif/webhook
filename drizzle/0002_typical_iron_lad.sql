CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "job_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "subscriber_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."delivery_status";--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "status" SET DATA TYPE "public"."delivery_status" USING "status"::"public"."delivery_status";--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "pipeline_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "payload" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."job_status";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "status" SET DATA TYPE "public"."job_status" USING "status"::"public"."job_status";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "webhook_path" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "action_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "action_config" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "subscribers" ALTER COLUMN "pipeline_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribers" ALTER COLUMN "url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "last_attempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "error" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "pipelines" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deliveries_job_idx" ON "deliveries" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "deliveries_subscriber_idx" ON "deliveries" USING btree ("subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_job_subscriber" ON "deliveries" USING btree ("job_id","subscriber_id");--> statement-breakpoint
CREATE INDEX "jobs_pipeline_idx" ON "jobs" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_webhook_path_unique" UNIQUE("webhook_path");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");