import { db } from "../../db/index.js";
import { pipelines } from "../../db/schema.js";
import { jobQueue } from "../../worker/queue.js";
import { Request, Response } from "express";

export async function webhookHandler(req: Request, res: Response) {
  const { path } = req.body.webhookPath;

  const pipeline = await db.query.pipelines.findFirst({
    where: (p, { eq }) => eq(p.webhookPath, path),
  });

  if (!pipeline) return res.status(404).send("Not found");

  if (req.headers["x-secret"] !== pipeline.secret) {
    return res.status(403).send("Forbidden");
  }

  const job = await jobQueue.add("process", {
    pipelineId: pipeline.id,
    payload: req.body,
  });

  res.json({ queued: true, jobId: job.id });
}