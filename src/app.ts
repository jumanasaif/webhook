import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.route.js";
import pipelineRoutes from "./modules/pipelines/pipeline.routes.js";
import subscriberRoutes from "./modules/subscriber/subscriber.routes.js";
import webhookRoutes from "./modules/webhook/webhook.routes.js";
import deliveryRoutes from "./modules/delivery/delivery.routes.js";
import jobRoutes from "./modules/job/job.routes.js";

const app = express();

app.use(cors({
  origin: '*', // كل الـ origins مسموح
  credentials: true // ⚠️ لو بتستخدم cookies، لازم تحددي origin بالضبط
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("webhooks is running");
});

app.use("/auth", authRoutes);
app.use("/subscribers", subscriberRoutes);
app.use("/deliveries", deliveryRoutes);
app.use("/pipelines", pipelineRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/jobs", jobRoutes);

export default app;