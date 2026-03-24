import { Request, Response } from "express";
import * as subscriberService from "./subscriber.repo.js";

const ensureString = (value: string | string[]): string => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export const createSubscriber = async (req: Request, res: Response) => {
  const pipelineId = ensureString(req.body.pipelineId);
  const url = ensureString(req.body.url);

  const sub = await subscriberService.createSubscriber(pipelineId, url);
  res.json(sub);
};

export const listSubscribers = async (req: Request, res: Response) => {
  const pipelineId = ensureString(req.params.pipelineId);

  const subs = await subscriberService.getSubscribersByPipeline(pipelineId);
  res.json(subs);
};

export const getSubscriber = async (req: Request, res: Response) => {
  const id = ensureString(req.params.id);

  const sub = await subscriberService.getSubscriber(id);
  res.json(sub);
};

export const updateSubscriber = async (req: Request, res: Response) => {
  const id = ensureString(req.params.id);
  const url = ensureString(req.body.url);

  const sub = await subscriberService.updateSubscriber(id, url);
  res.json(sub);
};

export const deleteSubscriber = async (req: Request, res: Response) => {
  const id = ensureString(req.params.id);

  await subscriberService.deleteSubscriber(id);
  res.json({ deleted: true });
};