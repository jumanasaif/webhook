import express from "express";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("FlowForge API is running 🚀");
});

app.get("/test-db", async (req, res) => {
  const result = await db.select().from(users);
  res.json(result);
});

export default app;