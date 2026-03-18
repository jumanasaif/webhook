import express from "express";
import { createWebhookHandler } from "./modules/webhooks/webhook.controller.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("webhooksis running");
});

app.post("/webhooks", createWebhookHandler);


export default app;