import { NextFunction, Request, Response } from "express";
import { AppError } from "./errors";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const hits = new Map<string, number[]>();

export function rateLimit(req: Request, _res: Response, next: NextFunction): void {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) {
    next(new AppError(429, "rate_limited", "Too many requests — try again shortly"));
    return;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  next();
}
