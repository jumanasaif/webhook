import { Router } from "express";
import {
  createPipeline,
  getPipelines,
  getPipelineById,
  updatePipeline,
  deletePipeline,
} from "./controller.js";
import { auth } from "../auth/middleware.js";

const router = Router();

router.post("/", auth, createPipeline);
router.get("/", auth, getPipelines);
router.get("/:id", auth, getPipelineById);
router.put("/:id", auth, updatePipeline);
router.delete("/:id", auth, deletePipeline);

export default router;