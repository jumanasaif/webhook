import { Request, Response } from "express";
import { db } from "../../db/index.js";
import { jobs, deliveries } from "../../db/schema.js";
import { eq } from "drizzle-orm";
const { jobQueue } = await import("./job.queue.js");

export const getJobs = async (_req: any, res: Response) => {
  try {
    const data = await db.select().from(jobs);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idString = Array.isArray(id) ? id[0] : id;

    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, idString),
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const deliveryData = await db.query.deliveries.findMany({
      where: (d, { eq }) => eq(d.jobId, idString),
    });

    res.json({
      job,
      deliveries: deliveryData,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idString = Array.isArray(id) ? id[0] : id;
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, idString),
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    await db.delete(deliveries).where(eq(deliveries.jobId, idString));
    
    await db.delete(jobs).where(eq(jobs.id, idString));

    res.json({ message: "Job deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: error.message });
  }
};

export const retryJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idString = Array.isArray(id) ? id[0] : id;
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, idString),
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== 'failed') {
      return res.status(400).json({ error: "Only failed jobs can be retried" });
    }

    const [newJob] = await db.insert(jobs).values({
      pipelineId: job.pipelineId,
      payload: job.payload,
      status: "pending",
    }).returning();

    
    await jobQueue.add("process-job", {
      jobId: newJob.id,
      pipelineId: job.pipelineId,
      payload: job.payload,
    });

    res.json({ message: "Job retry initiated", job: newJob });
  } catch (error: any) {
    console.error("Error retrying job:", error);
    res.status(500).json({ error: error.message });
  }
};