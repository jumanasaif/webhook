import { Response } from "express";
import * as service from "./pipeline.service.js";

export const createPipeline = async (req: any, res: Response) => {
  try {
    const pipeline = await service.createPipelineService({
      ...req.body,
      userId: req.user.userId,
    });
    res.json(pipeline);
  } catch (error: any) {
    console.error("Error creating pipeline:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getPipelines = async (req: any, res: Response) => {
  try {
    const pipelines = await service.getUserPipelinesService(
      req.user.userId
    );
    res.json(pipelines);
  } catch (error: any) {
    console.error("Error getting pipelines:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getPipeline = async (req: any, res: Response) => {
  try {
    const pipeline = await service.getPipelineByIdService(
      req.params.id,
      req.user.userId
    );
    if (!pipeline) {
      return res.status(404).json({ message: "Pipeline not found" });
    }
    console.log("Returning pipeline:", pipeline);
    res.json(pipeline);
  } catch (error: any) {
    console.error("Error getting pipeline:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updatePipeline = async (req: any, res: Response) => {
  try {
    const pipeline = await service.updatePipelineService(
      req.params.id,
      req.user.userId,
      req.body
    );
    if (!pipeline) {
      return res.status(404).json({ message: "Pipeline not found" });
    }
    res.json(pipeline);
  } catch (error: any) {
    console.error("Error updating pipeline:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePipeline = async (req: any, res: Response) => {
  try {
    await service.deletePipelineService(
      req.params.id,
      req.user.userId
    );
    res.json({ message: "Pipeline and all associated data deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting pipeline:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getPipelineStats = async (req: any, res: Response) => {
  try {
    const stats = await service.getPipelineStatsService(
      req.params.id,
      req.user.userId
    );
    res.json(stats);
  } catch (error: any) {
    console.error("Error getting pipeline stats:", error);
    res.status(500).json({ message: error.message });
  }
};