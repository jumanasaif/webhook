import { Worker } from "bullmq";
import { db } from "../db/index.js";
import {
  pipelines,
  jobs,
  subscribers,
  deliveries,
} from "../db/schema.js";
import { executeAction } from "../modules/action/action.factory.js";
import { eq, sql } from "drizzle-orm";

import { env } from "../config/env.js";
import { jobQueue } from "../modules/job/job.queue.js";


const connection = {
  host: env.REDIS_HOST || "127.0.0.1",
  port: env.REDIS_PORT,
};

const worker = new Worker(
  "jobs",
  async (job) => {
    const { jobId, pipelineId, payload } = job.data;

    console.log("=========================================");
    console.log("Processing job:", jobId);
    console.log("Pipeline ID:", pipelineId);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
      await db.update(jobs)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(jobs.id, jobId));
      console.log("✓ Job status updated to processing");

      const pipeline = await db.query.pipelines.findFirst({
        where: eq(pipelines.id, pipelineId),
      });

      if (!pipeline) {
        console.error("✗ Pipeline not found:", pipelineId);
        await db.update(jobs)
          .set({
            status: "failed",
            error: "Pipeline not found",
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, jobId));
        throw new Error("Pipeline not found");
      }
      console.log("✓ Pipeline found:", pipeline.name);
      console.log("Action type:", pipeline.actionType);
      console.log("Action config:", pipeline.actionConfig);

 let result;
try {
  result = await executeAction(
    pipeline.actionType,
    payload,
    pipeline.actionConfig
  );
  console.log("Action executed successfully");
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (err: any) {
  console.error("Action execution failed:", err.message);
  await db.update(jobs)
    .set({
      status: "failed",
      error: err.message,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));
  throw err;
}

      if (!result) {
        console.log("Filter returned null, no delivery needed");
        await db.update(jobs)
          .set({ 
            status: "completed", 
            result: null,
            updatedAt: new Date() 
          })
          .where(eq(jobs.id, jobId));
        return;
      }

      await db.update(pipelines)
        .set({
          totalJobs: sql`${pipelines.totalJobs} + 1`,
        })
        .where(eq(pipelines.id, pipelineId));
      console.log("Pipeline stats updated");

      const subs = await db.query.subscribers.findMany({
        where: eq(subscribers.pipelineId, pipelineId),
      });
      console.log(`Found ${subs.length} subscribers`);

      for (const sub of subs) {
        console.log(`Sending to subscriber: ${sub.url}`);
        let deliverySuccess = false;
        let lastError: string | null = null;
        let attemptsMade = 0; 
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          attemptsMade = attempt; 
          try {
            console.log(`Attempt ${attempt}/${maxAttempts}...`);
            const response = await fetch(sub.url, {
              method: "POST",
              body: JSON.stringify(result),
              headers: { "Content-Type": "application/json" },
            });
            
            if (response.ok) {
              console.log(` Delivery successful on attempt ${attempt}`);
              deliverySuccess = true;
              break;  
            } else {
              lastError = `HTTP ${response.status}: ${response.statusText}`;
              console.log(`Attempt ${attempt} failed: ${lastError}`);
              
              if (attempt < maxAttempts) {
                const delay = Math.pow(2, attempt) * 1000; 
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          } catch (err: any) {
            lastError = err.message;
            console.log(`✗ Attempt ${attempt} failed: ${lastError}`);
            
            if (attempt < maxAttempts) {
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        try {
          const deliveryStatus: "success" | "failed" = deliverySuccess ? "success" : "failed";
          
          const deliveryData = {
            jobId: jobId,
            subscriberId: sub.id,
            attempts: attemptsMade, 
            status: deliveryStatus,
            lastError: lastError,
            lastAttemptAt: new Date(),
          };
          
          console.log("Creating delivery with data:", deliveryData);
          
          const [delivery] = await db.insert(deliveries).values(deliveryData).returning();
          
          if (deliverySuccess) {
            console.log(`Delivery recorded as success after ${attemptsMade} attempt(s) (ID: ${delivery.id})`);
          } else {
            console.log(` Delivery recorded as failed after ${attemptsMade} attempts (ID: ${delivery.id})`);
          }
        } catch (err: any) {
          console.error(" Failed to create delivery record:", err.message);
          console.error("Delivery data:", { jobId, subscriberId: sub.id, status: deliverySuccess ? "success" : "failed" });
        }
      }

      if (pipeline.nextPipelineId) {
        console.log(`Chaining to next pipeline: ${pipeline.nextPipelineId}`);
        
        const [nextJob] = await db.insert(jobs).values({
          pipelineId: pipeline.nextPipelineId,
          payload: result,
          status: "pending",
        }).returning();
        
        await jobQueue.add("process-job", {
          jobId: nextJob.id,
          pipelineId: pipeline.nextPipelineId,
          payload: result,
        });
        console.log(` Created chained job: ${nextJob.id}`);
      }

      await db.update(jobs)
        .set({
          status: "completed",
          result: result,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));
      console.log(" Job marked as completed");

      await db.update(pipelines)
        .set({
          successJobs: sql`${pipelines.successJobs} + 1`,
        })
        .where(eq(pipelines.id, pipelineId));
      
      console.log("=========================================");
      console.log("✅ Job completed successfully!");
      console.log("=========================================");

    } catch (err: any) {
      console.error("=========================================");
      console.error("❌ Job failed:", err.message);
      console.error("Stack trace:", err.stack);
      console.error("=========================================");
      throw err; 
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(` Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(` Job ${job?.id} failed:`, err.message);
});

console.log(" Worker started, listening for jobs...");