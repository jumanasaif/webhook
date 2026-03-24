import { db } from "../../db/index.js";
import { deliveries } from "../../db/schema.js";
import { sql, eq } from "drizzle-orm";

export const createDelivery = async (jobId: string, subscriberId: string, status: "pending" | "success" | "failed", error?: string) => {
  const [del] = await db.insert(deliveries).values({
    jobId,
    subscriberId,
    status,
    lastError: error,
    lastAttemptAt: new Date(),
    attempts: 1,
  }).returning();
  return del;
};

export const updateDelivery = async (deliveryId: string, status: "pending" | "success" | "failed", error?: string) => {
  const [del] = await db.update(deliveries)
    .set({
      status,
      lastError: error,
      lastAttemptAt: new Date(),
      attempts: sql`attempts + 1`
    })
    .where(eq(deliveries.id, deliveryId))
    .returning();
  return del;
};

export const getDeliveriesByJob = async (jobId: string) => {
  return db.query.deliveries.findMany({
    where: eq(deliveries.jobId, jobId),
  });
};

export const getDeliveryById = async (id: string) => {
  return db.query.deliveries.findFirst({
    where: eq(deliveries.id, id),
  });
};