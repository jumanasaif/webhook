import { Request, Response, NextFunction } from "express";
import { handleWebhook } from "./webhook.service.js";

export const receiveWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { pipelineId } = req.params;
    if (Array.isArray(pipelineId)) {
      pipelineId = pipelineId[0];
    }

    if (!pipelineId) {
      return res.status(400).json({ error: "Missing pipelineId param" });
    }

    let signature = req.headers["x-signature"];
    if (Array.isArray(signature)) {
      signature = signature[0]; 
    }

    if (!signature) {
      return res.status(400).json({ error: "Missing signature header" });
      
    }

    const job = await handleWebhook(pipelineId, req.body, signature);

    res.json({ job });
  } catch (err) {
    next(err);
  }
};