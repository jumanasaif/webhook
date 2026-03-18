import { db } from "../../db/index.js";
import { webhooks } from "../../db/schema.js";

export const createWebhook = async (data: {
  userId: string;
  url: string;
  event: string;
}) => {
  const result = await db.insert(webhooks).values(data).returning();
  return result[0];
};