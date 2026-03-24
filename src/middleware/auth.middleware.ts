import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;

  if (!auth) return res.status(401).json({ message: "Unauthorized" });

  const token = auth.split(" ")[1];

  try {
    const decoded: any = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};