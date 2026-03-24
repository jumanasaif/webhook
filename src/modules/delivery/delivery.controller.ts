import { Request, Response } from "express";
import * as deliveryService from "./delivery.repo.js";

export const listDeliveries = async (req: Request, res: Response) => {
  let { jobId } = req.params;
  if (Array.isArray(jobId)) {
    jobId = jobId[0];
  }

  const deliveries = await deliveryService.getDeliveriesByJob(jobId);
  res.json(deliveries);
};

export const getDelivery = async (req: Request, res: Response) => {
  let { id } = req.params;
  if (Array.isArray(id)) {
    id = id[0];
  }

  const delivery = await deliveryService.getDeliveryById(id);
  res.json(delivery);
};