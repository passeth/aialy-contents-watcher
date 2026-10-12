import { resolve } from "node:path";
import { createStore } from "./store.mjs";
import { createApp } from "./app.mjs";
import { credentials } from "./credentials.mjs";
import { createCollector } from "./collector.mjs";
import express from "express";
const dataDir = resolve(process.env.DATA_DIR || ".data");
const store = createStore(resolve(dataDir, "instagram.sqlite"));
store.recover();
const secrets = credentials(resolve(dataDir, "connection.json"));
const collector = createCollector(store, secrets);
const app = createApp(store, secrets, collector);
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 14316);
const server = app.listen(port, "127.0.0.1", (error) => {
  if (error) {
    console.error(`서버 시작 실패: ${error.code}`);
    process.exit(1);
  }
  collector.start();
  console.log(`CatchMoment: http://127.0.0.1:${port}`);
});
function stop() {
  collector.stop();
  server.close(() => {
    store.db.close();
    process.exit(0);
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
