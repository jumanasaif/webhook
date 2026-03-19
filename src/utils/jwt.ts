import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signToken(payload: any) {
  return jwt.sign(payload, env.JWT_SECRET!);
}

export function verifyToken(token: string) {
  return jwt.verify(token,env.JWT_SECRET);
}