import express from "express";
import { installMonitoring } from "./monitoring.mjs";
import { installAds } from "./ads.mjs";
import { z } from "zod";
import { createInstagramClient, ProviderError } from "./instagram.mjs";
export function createApp(
  store,
  credentials,
  collector,
  { clientFactory = createInstagramClient } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    if (!["127.0.0.1", "localhost", "[::1]"].includes(req.hostname))
      return res.status(403).json({ error: "로컬 접속만 허용됩니다." });
    const origin = req.get("origin");
    if (origin && origin !== `${req.protocol}://${req.get("host")}`)
      return res
        .status(403)
        .json({ error: "다른 사이트의 요청은 허용되지 않습니다." });
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !req.is("application/json")
    )
      return res.status(415).json({ error: "JSON 요청만 허용됩니다." });
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.path.startsWith("/api/"))
      res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/workspace", (_req, res) =>
    res.json({
      ...store.state(),
      connection: credentials.status(),
      running: [...collector.running],
    }),
  );
  app.post("/api/connection", async (req, res) => {
    if (collector.running.size)
      throw new ProviderError("수집 완료 후 연결을 변경해 주세요.", false, 409);
    const config = z
      .object({
        token: z
          .string()
          .trim()
          .min(10, "액세스 토큰을 입력해 주세요.")
          .max(4096),
        accountId: z
          .string()
          .trim()
          .regex(/^\d{5,30}$/, "Instagram 계정 ID는 숫자입니다."),
        version: z.string().regex(/^v\d{2}\.0$/),
      })
      .parse(req.body);
    const profile = await clientFactory(config).verify();
    credentials.save({
      ...config,
      username: profile.username,
      verifiedAt: new Date().toISOString(),
    });
    res.json(credentials.status());
  });
  app.delete("/api/connection", (_req, res) => {
    if (collector.running.size)
      throw new ProviderError("수집 완료 후 연결을 해제해 주세요.", false, 409);
    credentials.clear();
    res.json({ ok: true });
  });
  const sourceSchema = z.object({
    username: z
      .string()
      .trim()
      .transform((v) => v.replace(/^@/, ""))
      .pipe(
        z
          .string()
          .regex(
            /^[a-zA-Z0-9._]{1,30}$/,
            "@를 제외한 Instagram 사용자 이름을 입력해 주세요.",
          ),
      ),
    label: z.string().trim().max(60),
    kind: z.enum(["brand", "creator", "owned"]),
    intervalHours: z.number().int().min(1).max(168),
  });
  app.post("/api/sources", (req, res) => {
    const source = sourceSchema.parse(req.body);
    if (
      store
        .sources()
        .some((s) => s.username.toLowerCase() === source.username.toLowerCase())
    )
      return res.status(409).json({ error: "이미 등록한 계정입니다." });
    const id = store.addSource(source);
    res.status(201).json({ id });
  });
  app.patch("/api/sources/:id", (req, res) => {
    const body = z
      .object({
        enabled: z.boolean(),
        intervalHours: z.number().int().min(1).max(168),
      })
      .parse(req.body);
    if (body.enabled && !credentials.read())
      throw new ProviderError(
        "Instagram 연결 후 자동 수집을 켜 주세요.",
        false,
        400,
      );
    if (!store.updateSource(req.params.id, body))
      return res.status(404).json({ error: "계정을 찾을 수 없습니다." });
    res.json({ ok: true });
  });
  app.delete("/api/sources/:id", (req, res) => {
    if (collector.running.has(req.params.id))
      throw new ProviderError("수집 완료 후 계정을 삭제해 주세요.", false, 409);
    store.deleteSource(req.params.id);
    res.json({ ok: true });
  });
  app.post("/api/sources/:id/collect", async (req, res) =>
    res.json(await collector.run(req.params.id)),
  );
  app.get("/api/content/:id/history", (req, res) =>
    res.json(store.history(req.params.id)),
  );
  const name = z.object({
    name: z
      .string()
      .trim()
      .min(1, "이름을 입력해 주세요.")
      .max(60, "이름은 60자 이내로 입력해 주세요."),
  });
  app.post("/api/boards", (req, res) =>
    res.status(201).json(store.createBoard(name.parse(req.body).name)),
  );
  app.patch("/api/boards/:id", (req, res) => {
    if (!store.renameBoard(req.params.id, name.parse(req.body).name))
      return res.status(404).json({ error: "보드를 찾을 수 없습니다." });
    res.json({ ok: true });
  });
  app.delete("/api/boards/:id", (req, res) => {
    store.deleteBoard(req.params.id);
    res.json({ ok: true });
  });
  app.put("/api/bookmarks/:id", (req, res) => {
    const b = z
      .object({
        boardId: z.string().uuid().nullable(),
        note: z.string().max(5000),
      })
      .parse(req.body);
    store.saveBookmark(req.params.id, b.boardId, b.note);
    res.json({ ok: true });
  });
  app.delete("/api/bookmarks/:id", (req, res) => {
    store.removeBookmark(req.params.id);
    res.json({ ok: true });
  });
  app.put("/api/favorites/:id", (req, res) => {
    const { on } = z.object({ on: z.boolean() }).parse(req.body);
    if (!store.sources().some((s) => s.id === req.params.id))
      return res.status(404).json({ error: "계정을 찾을 수 없습니다." });
    store.favorite(req.params.id, on);
    res.json({ ok: true });
  });
  installMonitoring(app, store);
  installAds(app, store);
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "요청한 기능을 찾을 수 없습니다." }),
  );
  app.use((err, _req, res, _next) =>
    res
      .status(
        err instanceof z.ZodError || err instanceof SyntaxError
          ? 400
          : err instanceof ProviderError
            ? err.status
            : 500,
      )
      .json({
        error:
          err instanceof z.ZodError
            ? err.issues[0].message
            : err instanceof ProviderError
              ? err.message
              : "요청을 처리하지 못했습니다. 다시 시도해 주세요.",
      }),
  );
  return app;
}
