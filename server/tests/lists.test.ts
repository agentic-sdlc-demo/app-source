import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let app: Express;

beforeAll(async () => {
  process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "tasklist-")), "test.db");
  const mod = await import("../src/app");
  app = mod.createApp();
});

describe("GET /api/lists", () => {
  it("returns the seeded default list", async () => {
    const res = await request(app).get("/api/lists");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0]).toHaveProperty("name");
  });
});

describe("POST /api/lists", () => {
  it("creates a list and returns 201 with Location", async () => {
    const res = await request(app).post("/api/lists").send({ name: "Groceries" });
    expect(res.status).toBe(201);
    expect(res.headers.location).toMatch(/^\/api\/lists\//);
    expect(res.body.name).toBe("Groceries");
  });

  it("rejects an empty name", async () => {
    const res = await request(app).post("/api/lists").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("rejects unknown fields", async () => {
    const res = await request(app).post("/api/lists").send({ name: "X", extra: "nope" });
    expect(res.status).toBe(400);
  });
});
