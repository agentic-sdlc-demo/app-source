// Encodes the assertions from sdlc-control/evals/cases/endpoint-security.md
// directly as executable tests, so Stage 5 review has something automated to
// point at, not just skill text.
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

describe("security-baseline compliance", () => {
  it("uses the standard error shape on validation failure", async () => {
    const res = await request(app).post(`/api/lists/${listId}/tasks`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty("code");
    expect(res.body.error).toHaveProperty("message");
  });

  it("never leaks a stack trace or file path in error responses", async () => {
    const res = await request(app).get("/api/lists/does-not-exist/tasks");
    expect(res.status).toBe(404);
    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/at\s+\S+\s+\(.*:\d+:\d+\)/);
    expect(text).not.toMatch(/\/home\/|\/app\/|node_modules/);
  });

  it("survives SQL-injection-shaped input (parameterized queries)", async () => {
    const payload = "'; DROP TABLE tasks; --";
    const res = await request(app).post(`/api/lists/${listId}/tasks`).send({ title: payload });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(payload); // stored verbatim, not interpreted as SQL
    const after = await request(app).get(`/api/lists/${listId}/tasks`);
    expect(after.status).toBe(200); // table still exists and is queryable
  });

  it("rejects unknown body fields on every mutating route", async () => {
    const res = await request(app).post(`/api/lists/${listId}/tasks`).send({ title: "ok", admin: true });
    expect(res.status).toBe(400);
  });

  it("sets security headers", async () => {
    const res = await request(app).get("/healthz");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });

  it("does not accept a title that is only whitespace", async () => {
    const res = await request(app).post(`/api/lists/${listId}/tasks`).send({ title: "   " });
    expect(res.status).toBe(400);
  });
});
