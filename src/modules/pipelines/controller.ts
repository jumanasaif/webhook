import { Request, Response } from "express";
import { db } from "../../db/index.js";
import { pipelines } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

type NewPipeline = typeof pipelines.$inferInsert;
type UpdatePipeline = Partial<NewPipeline>;


export async function createPipeline(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const newPipeline: NewPipeline = {
      name: req.body.name,
      userId: user.id,
      webhookPath: crypto.randomUUID(),
      secret: crypto.randomBytes(8).toString("hex"),
      actionType: req.body.actionType,
      actionConfig: req.body.actionConfig || {},
    };

    const result = await db
      .insert(pipelines)
      .values(newPipeline)
      .returning();

    res.status(201).json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create pipeline" });
  }
}



export async function getPipelines(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const data = await db.query.pipelines.findMany({
      where: (p, { eq }) => eq(p.userId, user.id),
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pipelines" });
  }
}



export async function getPipelineById(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;

    const pipeline = await db.query.pipelines.findFirst({
      where: (p, { eq, and }) =>
        and(eq(p.id, id), eq(p.userId, user.id)),
    });

    if (!pipeline) {
      return res.status(404).json({ error: "Pipeline not found" });
    }

    res.json(pipeline);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
}




export async function updatePipeline(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;

    const updateData: UpdatePipeline = {
      name: req.body.name,
      actionType: req.body.actionType,
      actionConfig: req.body.actionConfig,
    };

    const result = await db
      .update(pipelines)
      .set(updateData)
      .where(and(eq(pipelines.id, id), eq(pipelines.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Pipeline not found" });
    }

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update pipeline" });
  }
}



export async function deletePipeline(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;

    const result = await db
      .delete(pipelines)
      .where(and(eq(pipelines.id, id), eq(pipelines.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Pipeline not found" });
    }

    res.json({ message: "Pipeline deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete pipeline" });
  }
}