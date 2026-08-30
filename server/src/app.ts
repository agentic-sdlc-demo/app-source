import path from "node:path";
import express, { Express } from "express";
import { errorHandler, notFound } from "./middleware/errors";
import { recordRequest } from "./metrics";
import { healthRouter } from "./routes/health";
import { listsRouter } from "./routes/lists";
import { tasksRouter } from "./routes/tasks";

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  // security-baseline: restrictive headers on every response.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    next();
  });

  app.use((_req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      recordRequest(Date.now() - start, res.statusCode >= 500);
    });
    next();
  });

  app.use(healthRouter);
  app.use("/api", listsRouter);
  app.use("/api", tasksRouter);

  const webDist = path.join(__dirname, "..", "..", "web", "dist");
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (_req, res, next) => {
    res.sendFile(path.join(webDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
