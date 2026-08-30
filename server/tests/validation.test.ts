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

describe("field validation", () => {
  it("rejects an invalid priority value", async () => {
    const res = await request(app).post(`/api/lists/${listId}/tasks`).send({ title: "x", priority: "urgent" });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed dueDate", async () => {
    const res = await request(app)
      .post(`/api/lists/${listId}/tasks`)
      .send({ title: "x", dueDate: "not-a-date" });
    expect(res.status).toBe(400);
  });

  it("accepts a valid dueDate", async () => {
    const res = await request(app)
      .post(`/api/lists/${listId}/tasks`)
      .send({ title: "x", dueDate: "2026-09-01" });
    expect(res.status).toBe(201);
    expect(res.body.dueDate).toBe("2026-09-01");
  });

  it("400s on an invalid status filter", async () => {
    const res = await request(app).get(`/api/lists/${listId}/tasks?status=maybe`);
    expect(res.status).toBe(400);
  });

  it("requires at least one field on PATCH", async () => {
    const create = await request(app).post(`/api/lists/${listId}/tasks`).send({ title: "x" });
    const res = await request(app).patch(`/api/tasks/${create.body.id}`).send({});
    expect(res.status).toBe(400);
  });
});
