ALTER TABLE "pipelines" ALTER COLUMN "secret" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_secret_unique" UNIQUE("secret");