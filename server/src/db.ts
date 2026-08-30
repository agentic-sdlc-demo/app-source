import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "tasklist.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

function seedDefaultList(): void {
  const existing = db.prepare("SELECT id FROM lists LIMIT 1").get();
  if (existing) return;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO lists (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)").run(
    id,
    "My Tasks",
    now,
    now,
  );
}

seedDefaultList();
