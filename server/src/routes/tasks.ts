import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { audit } from "../middleware/audit";
import { AppError } from "../middleware/errors";
import { rateLimit } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";

export const tasksRouter = Router();

const priorityEnum = z.enum(["low", "medium", "high"]);
const dateShape = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO-8601 date (YYYY-MM-DD)");

const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    priority: priorityEnum.optional(),
    dueDate: dateShape.optional(),
  })
  .strict();

const patchTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    priority: priorityEnum.optional(),
    dueDate: dateShape.nullable().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: "at least one field required" });

interface TaskRow {
  id: string;
  listId: string;
  title: string;
  status: "open" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

function requireList(listId: string): void {
  const list = db.prepare("SELECT id FROM lists WHERE id = ?").get(listId);
  if (!list) throw new AppError(404, "not_found", "List not found");
}

function requireTask(id: string): TaskRow {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
  if (!task) throw new AppError(404, "not_found", "Task not found");
  return task;
}

const VALID_STATUS = ["open", "done"];
const VALID_PRIORITY = ["low", "medium", "high"];

tasksRouter.get("/lists/:listId/tasks", (req, res) => {
  requireList(req.params.listId);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  const clauses = ["listId = ?"];
  const params: unknown[] = [req.params.listId];

  if (req.query.status !== undefined) {
    if (!VALID_STATUS.includes(String(req.query.status))) {
      throw new AppError(400, "validation_error", "status must be 'open' or 'done'");
    }
    clauses.push("status = ?");
    params.push(req.query.status);
  }
  if (req.query.priority !== undefined) {
    if (!VALID_PRIORITY.includes(String(req.query.priority))) {
      throw new AppError(400, "validation_error", "priority must be low, medium, or high");
    }
    clauses.push("priority = ?");
    params.push(req.query.priority);
  }
  if (req.query.dueBefore !== undefined) {
    clauses.push("dueDate IS NOT NULL AND dueDate < ?");
    params.push(String(req.query.dueBefore));
  }

  const where = clauses.join(" AND ");
  const total = (db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE ${where}`).get(...params) as { c: number })
    .c;
  const items = db
    .prepare(`SELECT * FROM tasks WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  res.json({ items, total });
});

tasksRouter.post("/lists/:listId/tasks", rateLimit, validateBody(createTaskSchema), (req, res) => {
  requireList(req.params.listId);
  const id = randomUUID();
  const now = new Date().toISOString();
  const priority = req.body.priority ?? "medium";
  const dueDate = req.body.dueDate ?? null;
  db.prepare(
    `INSERT INTO tasks (id, listId, title, status, priority, dueDate, createdAt, updatedAt, completedAt)
     VALUES (?, ?, ?, 'open', ?, ?, ?, ?, NULL)`,
  ).run(id, req.params.listId, req.body.title, priority, dueDate, now, now);
  audit("task.create", id);
  res.status(201).location(`/api/tasks/${id}`).json(requireTask(id));
});

tasksRouter.patch("/tasks/:id", rateLimit, validateBody(patchTaskSchema), (req, res) => {
  requireTask(req.params.id);
  const now = new Date().toISOString();
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const key of ["title", "priority", "dueDate"] as const) {
    if (key in req.body) {
      fields.push(`${key} = ?`);
      params.push(req.body[key] ?? null);
    }
  }
  fields.push("updatedAt = ?");
  params.push(now, req.params.id);
  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  audit("task.update", req.params.id);
  res.json(requireTask(req.params.id));
});

tasksRouter.post("/tasks/:id/complete", rateLimit, (req, res) => {
  const task = requireTask(req.params.id);
  if (task.status === "done") throw new AppError(409, "already_done", "Task is already complete");
  const now = new Date().toISOString();
  db.prepare("UPDATE tasks SET status = 'done', completedAt = ?, updatedAt = ? WHERE id = ?").run(
    now,
    now,
    req.params.id,
  );
  audit("task.complete", req.params.id);
  res.json(requireTask(req.params.id));
});

tasksRouter.post("/tasks/:id/reopen", rateLimit, (req, res) => {
  const task = requireTask(req.params.id);
  if (task.status === "open") throw new AppError(409, "already_open", "Task is already open");
  const now = new Date().toISOString();
  db.prepare("UPDATE tasks SET status = 'open', completedAt = NULL, updatedAt = ? WHERE id = ?").run(
    now,
    req.params.id,
  );
  audit("task.reopen", req.params.id);
  res.json(requireTask(req.params.id));
});

tasksRouter.delete("/tasks/:id", rateLimit, (req, res) => {
  requireTask(req.params.id);
  db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  audit("task.delete", req.params.id);
  res.status(204).end();
});
