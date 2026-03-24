import { Queue } from "bullmq";
import { env } from "src/config/env.js";

const connection = {
  host: env.REDIS_HOST || "127.0.0.1",
  port: env.REDIS_PORT ,
};

export const jobQueue = new Queue("jobs", { connection,defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  }, });


