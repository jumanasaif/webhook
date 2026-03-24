import { Router } from "express";
import * as subscriberController from "./subscriber.controller.js";

const router = Router();

router.post("/", subscriberController.createSubscriber);
router.get("/:pipelineId", subscriberController.listSubscribers);
router.get("/subscriber/:id", subscriberController.getSubscriber);
router.put("/:id", subscriberController.updateSubscriber);
router.delete("/:id", subscriberController.deleteSubscriber);

export default router;