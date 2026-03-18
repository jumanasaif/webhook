import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const webhooks = pgTable("webhooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  url: text("url").notNull(),
  event: text("event").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const deliveries = pgTable("deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  webhookId: uuid("webhook_id").notNull(),
  eventId: uuid("event_id").notNull(),
  status: text("status").notNull(), 
  attempt: text("attempt").notNull(),
  responseCode: text("response_code"),
  createdAt: timestamp("created_at").defaultNow(),
});