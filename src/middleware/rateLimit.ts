import rateLimit from "express-rate-limit";

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});