ALTER TABLE "jobs" DROP CONSTRAINT "jobs_next_pipeline_id_pipelines_id_fk";
--> statement-breakpoint
ALTER TABLE "pipelines" ADD COLUMN "next_pipeline_id" uuid;--> statement-breakpoint
ALTER TABLE "pipelines" ADD COLUMN "total_jobs" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pipelines" ADD COLUMN "success_jobs" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pipelines" ADD COLUMN "failed_jobs" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "next_pipeline_id";