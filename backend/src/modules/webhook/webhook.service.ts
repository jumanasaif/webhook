import { db } from "../../db/index.js";
import { jobs } from "../../db/schema.js";
import crypto from "crypto";
import { jobQueue } from "../job/job.queue.js";

export const handleWebhook = async (
  pipelineId: string,
  payload: any,
  signature: string
) => {
  const pipeline = await db.query.pipelines.findFirst({
    where: (p, { eq }) => eq(p.id, pipelineId),
  });

  if (!pipeline) throw new Error("Pipeline not found");


  if (pipeline.secret) {
    const expected = crypto
      .createHmac("sha256", pipeline.secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (expected !== signature) {
      throw new Error("Invalid signature");
    }
  }

  const [job] = await db.insert(jobs).values({
    pipelineId,
    payload,
  }).returning();

  await jobQueue.add("process-job", {
    jobId: job.id,
    pipelineId,
    payload,
  });

  return job;
};