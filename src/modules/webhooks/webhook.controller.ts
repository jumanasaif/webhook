import { Request, Response } from "express";
import { createWebhook } from "./webhook.service.js";

export const createWebhookHandler = async (req: Request, res: Response) => {
  try {
    const { userId, url, event } = req.body;
    const webhook = await createWebhook({ userId, url, event });
    res.status(201).json(webhook);
  } catch (error: any) {
    console.error(error); 
    res.status(500).json({ error: error.message });
  }
};