import { Router } from "express";
import * as controller from "./pipeline.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, controller.createPipeline);
router.get("/", authMiddleware, controller.getPipelines);
router.get("/:id", authMiddleware, controller.getPipeline);
router.get("/:id/stats", authMiddleware, controller.getPipelineStats);
router.put("/:id", authMiddleware, controller.updatePipeline);
router.delete("/:id", authMiddleware, controller.deletePipeline);

export default router;