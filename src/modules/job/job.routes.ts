import { Router } from "express";
import * as controller from "./job.controller.js";

const router = Router();

router.get("/", controller.getJobs);
router.get("/:id", controller.getJobById);
router.delete("/:id", controller.deleteJob);
router.post("/:id/retry", controller.retryJob);

export default router;