import bcrypt from "bcrypt";
import * as repo from "./auth.repo.js";
import { signToken } from "../../utils/jwt.js";

export const register = async (email: string, password: string) => {
  const hashed = await bcrypt.hash(password, 10);

  const user = await repo.createUser({
    email,
    password: hashed,
  });


  return { user};
};

export const login = async (email: string, password: string) => {
  const user = await repo.findUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = signToken({ userId: user.id });

  return { user, token };
};