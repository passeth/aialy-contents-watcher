import express from "express";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createStore } from "./store.mjs";
import { credentials } from "./credentials.mjs";
import { createCollector } from "./collector.mjs";
import { createApp } from "./app.mjs";

// Each space owns a separate database and connection. The legacy files stay in place.
export function createWorkspaceApp(dataDir, options = {}) {
  mkdirSync(dataDir, { recursive: true });
  const registry = new DatabaseSync(join(dataDir, "workspaces.sqlite"));
  registry.exec(`CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL
  )`);
  registry.prepare("INSERT OR IGNORE INTO workspaces VALUES (?,?,?)")
    .run("default", "Fraijour", new Date().toISOString());
  const list = () => registry.prepare("SELECT id,name,created_at AS createdAt FROM workspaces ORDER BY created_at,id").all();
  const contexts = new Map();
  let started = false;
  function context(id) {
    if (contexts.has(id)) return contexts.get(id);
    const row = registry.prepare("SELECT id FROM workspaces WHERE id=?").get(id);
    if (!row) return null;
    const dir = id === "default" ? dataDir : join(dataDir, "workspaces", id);
    const store = createStore(join(dir, "instagram.sqlite"));
    store.recover();
    const secrets = credentials(join(dir, "connection.json"));
    const collector = createCollector(store, secrets, options);
    const app = createApp(store, secrets, collector, options);
    const value = { store, collector, app };
    contexts.set(id, value);
    if (started) collector.start();
    return value;
  }
  const app = express();
  app.disable("x-powered-by");
  app.use("/api", (req, res, next) => {
    if (!["127.0.0.1", "localhost", "[::1]"].includes(req.hostname))
      return res.status(403).json({ error: "로컬 접속만 허용됩니다." });
    const origin = req.get("origin");
    if (origin && origin !== `${req.protocol}://${req.get("host")}`)
      return res.status(403).json({ error: "다른 사이트의 요청은 허용되지 않습니다." });
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !req.is("application/json"))
      return res.status(415).json({ error: "JSON 요청만 허용됩니다." });
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/workspaces", (_req, res) => res.json(list()));
  app.post("/api/workspaces", (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.normalize("NFKC").trim() : "";
    if (!name || name.length > 60 || /[\u0000-\u001f\u007f]/u.test(name))
      return res.status(400).json({ error: "워크스페이스 이름을 1~60자로 입력해 주세요." });
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    try {
      registry.prepare("INSERT INTO workspaces VALUES (?,?,?)").run(id, name, createdAt);
    } catch (e) {
      if (e.code === "ERR_SQLITE_ERROR" && /UNIQUE/.test(e.message))
        return res.status(409).json({ error: "같은 이름의 워크스페이스가 있습니다." });
      throw e;
    }
    res.status(201).json({ id, name, createdAt });
  });
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api/")) return next();
    const id = req.get("x-workspace-id") || "default";
    // Reject path-shaped IDs before any filesystem access; only registry IDs resolve.
    if (id !== "default" && !/^[a-f0-9-]{36}$/.test(id))
      return res.status(404).json({ error: "워크스페이스를 찾을 수 없습니다." });
    const selected = context(id);
    if (!selected) return res.status(404).json({ error: "워크스페이스를 찾을 수 없습니다." });
    selected.app(req, res, next);
  });
  app.use((error, _req, res, _next) => {
    res.status(error.status === 400 ? 400 : 500).json({ error: "요청을 처리하지 못했습니다." });
  });
  return {
    app,
    start() {
      if (started) return;
      started = true;
      for (const space of list()) context(space.id);
      // Contexts opened before start also need their timers.
      for (const value of contexts.values()) {
        value.collector.stop();
        value.collector.start();
      }
    },
    close() {
      for (const { store, collector } of contexts.values()) {
        collector.stop();
        store.db.close();
      }
      registry.close();
    },
  };
}
