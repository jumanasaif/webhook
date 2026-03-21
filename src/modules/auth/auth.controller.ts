import { Request, Response } from "express";
import * as service from "./auth.service.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await service.register(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await service.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
