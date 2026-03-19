import express from "express";
import authRoutes from "./modules/auth/auth.route.js";

const app = express();

app.use(express.json());


app.get("/", (req, res) => {
  res.send("webhooksis running");
});


app.use("/auth", authRoutes);

export default app;