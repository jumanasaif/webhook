import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("FlowForge API is running 🚀");
});

export default app;