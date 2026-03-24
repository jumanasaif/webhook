import { db } from "../../db/index.js";
import { subscribers } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export const createSubscriber = async (pipelineId: string, url: string) => {
  const [sub] = await db.insert(subscribers)
    .values({ pipelineId, url })
    .returning();
  return sub;
};

export const getSubscribersByPipeline = async (pipelineId: string) => {
  return db.query.subscribers.findMany({
    where: eq(subscribers.pipelineId, pipelineId),
  });
};

export const getSubscriber = async (id: string) => {
  return db.query.subscribers.findFirst({
    where: eq(subscribers.id, id),
  });
};

export const updateSubscriber = async (id: string, url: string) => {
  const [sub] = await db.update(subscribers)
    .set({ url })
    .where(eq(subscribers.id, id))
    .returning();
  return sub;
};

export const deleteSubscriber = async (id: string) => {
  return db.delete(subscribers)
    .where(eq(subscribers.id, id));
};