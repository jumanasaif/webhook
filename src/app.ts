import express from "express";
import authRoutes from "./modules/auth/auth.route.js";
import pipelineRoutes from "./modules/pipelines/routes.js";


const app = express();

app.use(express.json());


app.get("/", (req, res) => {
  res.send("webhooks is running");
});

app.use("/pipelines", pipelineRoutes);


app.use("/auth", authRoutes);

export default app;