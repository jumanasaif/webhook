import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import bcrypt from "bcrypt";
import { signToken } from "../../utils/jwt.js";
import { Request, Response } from "express";


export async function register(req: Request, res: Response) {
  const hashed = await bcrypt.hash(req.body.password, 10);

  const user = await db.insert(users).values({
    email: req.body.email,
    password: hashed,
  }).returning();

  res.json(user[0]);
}

export async function login(req: Request, res: Response) {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, req.body.email),
  });

  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(req.body.password, user.password);

  if (!valid) return res.status(400).json({ error: "Invalid credentials" });
  const token = signToken({ id: user.id });

  res.json({ token });
}