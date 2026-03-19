import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../utils/jwt.js";

export function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = verifyToken(token);
    (req as any).user = user; 
    next();
  } catch (err) {
    console.error("JWT verification error:", err); 
    res.status(401).json({ error: "Invalid token" });
  }
}