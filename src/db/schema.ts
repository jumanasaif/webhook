import { pgTable, uuid, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
});

export const pipelines = pgTable("pipelines", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  name: text("name"),
  webhookPath: text("webhook_path"),
  secret: text("secret"),
  actionType: text("action_type"),
  actionConfig: jsonb("action_config"),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipelineId: uuid("pipeline_id"),
  payload: jsonb("payload"),
  status: text("status"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipelineId: uuid("pipeline_id"),
  url: text("url"),
});

export const deliveries = pgTable("deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id"),
  subscriberId: uuid("subscriber_id"),
  attempts: integer("attempts").default(0),
  status: text("status"),
});