import { Router } from "express";
import { getMetrics } from "../metrics";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

healthRouter.get("/metrics", (_req, res) => {
  res.status(200).json(getMetrics());
});
