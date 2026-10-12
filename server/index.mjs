import { resolve } from "node:path";
import { createWorkspaceApp } from "./workspaces.mjs";
import express from "express";
const dataDir = resolve(process.env.DATA_DIR || ".data");
const workspaces = createWorkspaceApp(dataDir);
const app = workspaces.app;
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true, watch: { ignored: ["**/docs/media/**", "**/.research/**", "**/.data/**"] } },
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
  workspaces.start();
  console.log(`Aialy Contents Watcher: http://127.0.0.1:${port}`);
});
function stop() {
  server.close(() => {
    workspaces.close();
    process.exit(0);
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
