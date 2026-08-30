import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let app: Express;
let listId: string;

beforeAll(async () => {
  process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "tasklist-")), "test.db");
  const mod = await import("../src/app");
  app = mod.createApp();
  const res = await request(app).get("/api/lists");
  listId = res.body.items[0].id;
});

describe("task lifecycle", () => {
  it("creates, completes, and reopens a task", async () => {
    const create = await request(app).post(`/api/lists/${listId}/tasks`).send({ title: "Buy milk" });
    expect(create.status).toBe(201);
    const id = create.body.id;
    expect(create.body.status).toBe("open");

    const complete = await request(app).post(`/api/tasks/${id}/complete`);
    expect(complete.status).toBe(200);
    expect(complete.body.status).toBe("done");
    expect(complete.body.completedAt).not.toBeNull();

    const conflict = await request(app).post(`/api/tasks/${id}/complete`);
    expect(conflict.status).toBe(409);

    const reopen = await request(app).post(`/api/tasks/${id}/reopen`);
    expect(reopen.status).toBe(200);
    expect(reopen.body.status).toBe("open");
    expect(reopen.body.completedAt).toBeNull();
  });

  it("filters by status and priority together (AND, not OR)", async () => {
    await request(app).post(`/api/lists/${listId}/tasks`).send({ title: "Low prio", priority: "low" });
    await request(app).post(`/api/lists/${listId}/tasks`).send({ title: "High prio", priority: "high" });
    const res = await request(app).get(`/api/lists/${listId}/tasks?status=open&priority=high`);
    expect(res.status).toBe(200);
    expect(
      res.body.items.every((t: { status: string; priority: string }) => t.status === "open" && t.priority === "high"),
    ).toBe(true);
  });

  it("deletes a task", async () => {
    const create = await request(app).post(`/api/lists/${listId}/tasks`).send({ title: "Temp" });
    const id = create.body.id;
    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);
    const patch = await request(app).patch(`/api/tasks/${id}`).send({ title: "x" });
    expect(patch.status).toBe(404);
  });

  it("returns 400 for a title over 200 chars", async () => {
    const res = await request(app)
      .post(`/api/lists/${listId}/tasks`)
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });

  it("404s for an unknown list", async () => {
    const res = await request(app).get("/api/lists/does-not-exist/tasks");
    expect(res.status).toBe(404);
  });
});
