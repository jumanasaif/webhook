import { db } from "../../db/index.js";
import { deliveries, jobs, pipelines, subscribers } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

export const createPipeline = async (data: any) => {
  const [pipeline] = await db.insert(pipelines).values(data).returning();
  return pipeline;
};

export const getUserPipelines = async (userId: string) => {
  return db.query.pipelines.findMany({
    where: (p, { eq }) => eq(p.userId, userId),
  });
};

export const getPipelineById = async (id: string, userId: string) => {
  return db.query.pipelines.findFirst({
    where: (p, { eq, and }) =>
      and(eq(p.id, id), eq(p.userId, userId)),
  });
};

export const updatePipeline = async (
  id: string,
  userId: string,
  data: any
) => {
  const [updated] = await db
    .update(pipelines)
    .set(data)
    .where(
      and(
        eq(pipelines.id, id),
        eq(pipelines.userId, userId)
      )
    )
    .returning();

  return updated;
};

export const deletePipeline = async (id: string, userId: string) => {
  return await db.transaction(async (tx) => {
    const pipelineJobs = await tx.select().from(jobs).where(eq(jobs.pipelineId, id));
    for (const job of pipelineJobs) {
        await tx.delete(deliveries).where(eq(deliveries.jobId, job.id));
     }
    await tx.delete(jobs).where(eq(jobs.pipelineId, id));
    
    await tx.delete(subscribers).where(eq(subscribers.pipelineId, id));
    
    const result = await tx
      .delete(pipelines)
      .where(
        and(
          eq(pipelines.id, id),
          eq(pipelines.userId, userId)
        )
      )
      .returning();
    
    return result;
  });
};