import { Request, Response } from "express";
import { db } from "../../db/index.js";
import { jobQueue } from "../../worker/queue.js";

export async function webhookHandler(req: Request, res: Response) {
  try {
   const path = String(req.params.path);

    const pipeline = await db.query.pipelines.findFirst({
      where: (p, { eq }) => eq(p.webhookPath, path),
    });

    if (!pipeline) {
      return res.status(404).json({ error: "Pipeline not found" });
    }

    if (req.headers["x-secret"] !== pipeline.secret) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const job = await jobQueue.add("process", {
      pipelineId: pipeline.id,
      payload: req.body,
    });

    res.json({
      queued: true,
      jobId: job.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Webhook failed" });
  }
}