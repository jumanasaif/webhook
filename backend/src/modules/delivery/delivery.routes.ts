import { Router } from "express";
import * as deliveryController from "./delivery.controller.js";

const router = Router();

router.get("/job/:jobId", deliveryController.listDeliveries);
router.get("/:id", deliveryController.getDelivery);

export default router;