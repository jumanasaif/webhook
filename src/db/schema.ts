import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";



export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "success",
  "failed",
]);



export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const pipelines = pgTable("pipelines", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  webhookPath: text("webhook_path").notNull().unique(),
  secret: text("secret"),
  actionType: text("action_type").notNull(),
  actionConfig: jsonb("action_config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});


export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id),

    payload: jsonb("payload").notNull(),

    status: jobStatusEnum("status").notNull().default("pending"),

    result: jsonb("result"),

    attempts: integer("attempts").default(0),

    error: text("error"),

    createdAt: timestamp("created_at").defaultNow(),
    nextPipelineId: uuid("next_pipeline_id").references(() => pipelines.id),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    pipelineIdx: index("jobs_pipeline_idx").on(table.pipelineId),
    statusIdx: index("jobs_status_idx").on(table.status),
  })
);



export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),

  pipelineId: uuid("pipeline_id")
    .notNull()
    .references(() => pipelines.id),

  url: text("url").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});



export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),

    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscribers.id),

    attempts: integer("attempts").default(0),

    status: deliveryStatusEnum("status").notNull().default("pending"),

    lastError: text("last_error"),

    lastAttemptAt: timestamp("last_attempt_at"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    jobIdx: index("deliveries_job_idx").on(table.jobId),
    subscriberIdx: index("deliveries_subscriber_idx").on(table.subscriberId),
    uniqueJobSubscriber: uniqueIndex("unique_job_subscriber").on(
      table.jobId,
      table.subscriberId
    ),
  })
);