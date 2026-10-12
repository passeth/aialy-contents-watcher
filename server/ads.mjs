import { z } from "zod";
const schema = z
  .object({
    libraryUrl: z
      .string()
      .url()
      .max(2000)
      .refine((value) => {
        const u = new URL(value);
        return (
          u.protocol === "https:" &&
          ["www.facebook.com", "facebook.com"].includes(u.hostname) &&
          u.pathname === "/ads/library/" &&
          /^\d{5,30}$/.test(u.searchParams.get("id") || "")
        );
      }, "광고 ID가 있는 Meta 광고 라이브러리 링크를 입력해 주세요."),
    brand: z.string().trim().min(1).max(120),
    caption: z.string().max(10000).default(""),
    format: z.enum(["image", "video", "unknown"]).default("unknown"),
    status: z.enum(["active", "inactive", "unknown"]).default("unknown"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .default(null)
      .refine(
        (v) =>
          v === null ||
          (Number.isFinite(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v),
        "유효한 날짜를 입력해 주세요.",
      ),
    note: z.string().max(5000).default(""),
  })
  .strict();
export function installAds(app, store) {
  store.db.exec(
    "CREATE TABLE IF NOT EXISTS saved_ads(id TEXT PRIMARY KEY,payload TEXT NOT NULL)",
  );
  app.get("/api/ads", (_req, res) =>
    res.json({
      items: store.db
        .prepare("SELECT payload FROM saved_ads ORDER BY rowid DESC")
        .all()
        .map((r) => JSON.parse(r.payload)),
      coverage: {
        connected: false,
        mode: "manual-library-reference",
        notes: [
          "직접 저장한 광고 라이브러리 참고 자료입니다. 자동 검색·집행 상태 갱신은 연결되지 않았습니다.",
          "입력한 집행 상태는 확인 시점 기준이며 지출·전환·ROAS는 제공되지 않습니다.",
        ],
      },
    }),
  );
  app.post("/api/ads", (req, res) => {
    const body = schema.parse(req.body),
      id = new URL(body.libraryUrl).searchParams.get("id");
    const prior = store.db
      .prepare("SELECT payload FROM saved_ads WHERE id=?")
      .get(id);
    const item = {
      ...body,
      id,
      libraryUrl: `https://www.facebook.com/ads/library/?id=${id}`,
      source: "manual-library-reference",
      observedAt: new Date().toISOString(),
      createdAt: prior
        ? JSON.parse(prior.payload).createdAt
        : new Date().toISOString(),
    };
    store.db
      .prepare(
        "INSERT INTO saved_ads VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
      )
      .run(id, JSON.stringify(item));
    res.status(prior ? 200 : 201).json(item);
  });
  app.delete("/api/ads/:id", (req, res) => {
    store.db.prepare("DELETE FROM saved_ads WHERE id=?").run(req.params.id);
    res.json({ ok: true });
  });
}
