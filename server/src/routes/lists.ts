import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { audit } from "../middleware/audit";
import { rateLimit } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";

export const listsRouter = Router();

const createListSchema = z.object({ name: z.string().trim().min(1).max(100) }).strict();

listsRouter.get("/lists", (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const total = (db.prepare("SELECT COUNT(*) as c FROM lists").get() as { c: number }).c;
  const items = db.prepare("SELECT * FROM lists ORDER BY createdAt LIMIT ? OFFSET ?").all(limit, offset);
  res.json({ items, total });
});

listsRouter.post("/lists", rateLimit, validateBody(createListSchema), (req, res) => {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO lists (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)").run(
    id,
    req.body.name,
    now,
    now,
  );
  audit("list.create", id);
  res.status(201).location(`/api/lists/${id}`).json({ id, name: req.body.name, createdAt: now, updatedAt: now });
});
