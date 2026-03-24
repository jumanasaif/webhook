import { webhookLimiter } from "src/middleware/rateLimit.js";
import { receiveWebhook } from "./webhook.controller.js";
import { Router } from "express";

const router = Router();
router.post("/:pipelineId", webhookLimiter, receiveWebhook);
export default router;