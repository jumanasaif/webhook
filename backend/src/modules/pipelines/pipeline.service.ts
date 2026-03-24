import * as repo from "./pipeline.repo.js";
import crypto from "crypto";
import { db } from "../../db/index.js";
import { jobs } from "../../db/schema.js";
import { eq, count } from "drizzle-orm";

export const createPipelineService = async (data: any) => {
  const pipelineData: any = {
    userId: data.userId,
    name: data.name,
    webhookPath: crypto.randomBytes(16).toString("hex"),
    secret: crypto.randomBytes(32).toString("hex"),
    actionType: data.actionType,
    actionConfig: data.actionConfig || {},
  };

  if (data.nextPipelineId) {
    pipelineData.nextPipelineId = data.nextPipelineId;
  }

  console.log("Pipeline Data to Insert:", pipelineData);

  const pipeline = await repo.createPipeline(pipelineData);
  
  return pipeline;
};


export const getUserPipelinesService = async (userId: string) => {
  const pipelines = await repo.getUserPipelines(userId);
  
  return pipelines.map(p => ({
    ...p,
    secret: p.secret ? p.secret.substring(0, 16) + '...' : null
  }));
};


export const getPipelineByIdService = async (
  id: string,
  userId: string
) => {
  const pipeline = await repo.getPipelineById(id, userId);
  
  return pipeline;
};


export const updatePipelineService = async (
  id: string,
  userId: string,
  data: any
) => {
  return repo.updatePipeline(id, userId, data);
};


export const deletePipelineService = async (
  id: string,
  userId: string
) => {
  try {
    const result = await repo.deletePipeline(id, userId);
    if (!result || result.length === 0) {
      throw new Error("Pipeline not found or not authorized");
    }
    return result;
  } catch (error: any) {
    console.error("Error deleting pipeline:", error.message);
    throw new Error(`Failed to delete pipeline: ${error.message}`);
  }
};


export const getPipelineStatsService = async (
  id: string,
  userId: string
) => {
  const pipeline = await repo.getPipelineById(id, userId);
  if (!pipeline) throw new Error("Pipeline not found");

  const jobsStats = await db
    .select({
      status: jobs.status,
      count: count(),
    })
    .from(jobs)
    .where(eq(jobs.pipelineId, id))
    .groupBy(jobs.status);

  const recentJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.pipelineId, id))
    .orderBy(jobs.createdAt)
    .limit(10);

  return {
    pipeline: {
      id: pipeline.id,
      name: pipeline.name,
      totalJobs: pipeline.totalJobs,
      successJobs: pipeline.successJobs,
      failedJobs: pipeline.failedJobs,
      secret: pipeline.secret,
      webhookPath: pipeline.webhookPath
    },
    jobsStats,
    recentJobs,
  };
};