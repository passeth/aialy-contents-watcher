import { randomUUID } from "node:crypto";
import { z } from "zod";

const DAY = 86400000;
const COLLECTION_MODE = "registered-account-subset";
const NOTES = [
  "등록 계정에서 직접 수집한 게시물만 분석합니다. Instagram 전체 검색·키워드 발견 수집기는 연결되지 않았습니다.",
  "추적 세트는 저장된 검색 조건입니다. 저장만으로 새로운 계정이나 게시물 수집이 시작되지 않습니다.",
  "최근 최대 100개씩 수집한 관측 자료이며 전체 이력·삭제 여부·누락 여부는 확인하지 않습니다.",
];

// Literal matching only: user input is never evaluated as a regex, SQL, or code.
export const normalizeTerm = (value) =>
  String(value ?? "").normalize("NFKC").toLowerCase()
    .replace(/ß/g, "ss").replace(/ς/g, "σ").trim().replace(/\s+/g, " ");
const accountName = (value) => normalizeTerm(value).replace(/^@/, "");
const unique = (values, normalize = normalizeTerm) =>
  [...new Set(values.map(normalize).filter(Boolean))].sort();
const ruleList = z.array(z.string().trim().min(1).max(120)).max(100);
const rulesSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["brand", "target"]),
  keywords: ruleList.default([]),
  required: ruleList.default([]),
  excluded: ruleList.default([]),
  accounts: z.array(z.string().trim().regex(/^@?[a-zA-Z0-9._]{1,30}$/)).max(100).default([]),
}).strict().transform((v) => ({
  ...v,
  keywords: unique(v.keywords),
  required: unique(v.required),
  excluded: unique(v.excluded),
  accounts: unique(v.accounts, accountName),
})).refine((v) => v.keywords.length > 0 || v.accounts.length > 0, {
  message: "키워드 또는 계정을 하나 이상 입력해 주세요.",
});
const brandSchema = z.object({
  name: z.string().trim().min(1).max(80),
  aliases: ruleList.min(1),
}).strict().transform((value) => ({ ...value, aliases: unique(value.aliases) }));
const analysisSchema = z.object({
  q: z.string().max(2000).default(""),
  mode: z.enum(["or", "and"]).default("or"),
  setId: z.string().max(100).optional(),
  days: z.enum(["7", "30", "90", "365"]).default("30"),
  persona: z.enum(["all", "owned", "external", "disclosed"]).default("all"),
  view: z.enum(["social", "brand", "target", "owned"]).default("social"),
  sourceId: z.string().max(100).optional(),
  brandId: z.string().max(100).optional(),
}).strict();
const textOf = (item) => normalizeTerm(`${item.title || ""}\n${item.caption || ""}`);
const authorOf = (item) => accountName(item.author) || null;

export function matchesRules(item, rules, mode = "or") {
  const text = textOf(item);
  const keywords = unique(rules.keywords || []);
  const accounts = unique(rules.accounts || [], accountName);
  const keywordMatch = keywords.length > 0 && (mode === "and"
    ? keywords.every((term) => text.includes(term))
    : keywords.some((term) => text.includes(term)));
  const accountMatch = accounts.includes(authorOf(item));
  return (keywordMatch || accountMatch)
    && unique(rules.required || []).every((term) => text.includes(term))
    && !unique(rules.excluded || []).some((term) => text.includes(term));
}

const isKnownMetric = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const metric = (items, key) => {
  const known = items.map((item) => item[key]).filter(isKnownMetric);
  return { total: known.length ? known.reduce((a, b) => a + b, 0) : null, count: known.length };
};
const growth = (current, previous) => previous > 0 ? (current - previous) / previous * 100 : null;
const authors = (items) => new Set(items.map(authorOf).filter(Boolean)).size;
const STOP_WORDS = new Set("the and for with this that from your you are our new more to of in on at is it as a an by be or not all we us https http www com instagram instagood post posts reel reels ad ads 광고 협찬 제공 제품 오늘 이번 정말 너무 하는 있는 있어요 입니다 그리고 하지만 통해 대한 위한 사용 함께 피부 뷰티 beauty skincare skin".split(" "));
function candidates(item) {
  const text = textOf(item).replace(/https?:\/\/\S+/g, " ").replace(/@[\p{L}\p{N}_.]+/gu, " ");
  return new Set((text.match(/#?[\p{L}\p{N}][\p{L}\p{N}_]{1,39}/gu) || [])
    .map((term) => term.replace(/^#/, ""))
    .filter((term) => !STOP_WORDS.has(term) && !/^\d+$/.test(term)));
}
function termCounts(items) {
  const result = new Map();
  for (const item of items) for (const term of candidates(item)) {
    const entry = result.get(term) || { count: 0, authors: new Set() };
    entry.count++;
    if (authorOf(item)) entry.authors.add(authorOf(item));
    result.set(term, entry);
  }
  return result;
}
const disclosed = (item) => /(?:^|[^\p{L}\p{N}_])#(?:ad|ads|advertisement|sponsored|광고|협찬|제품제공)(?=$|[^\p{L}\p{N}_])/u.test(textOf(item));
const sourceHas = (source, item) =>
  (source.contentIds || []).includes(item.id) || Boolean(authorOf(item) && authorOf(item) === accountName(source.username));

export function analyzeMonitoring(content, sources, sets, input = {}, now = new Date(), brandEntities = []) {
  const options = analysisSchema.parse(input);
  const selected = options.setId ? sets.find((set) => set.id === options.setId) : null;
  const selectedBrand = options.brandId ? brandEntities.find((brand) => brand.id === options.brandId) : null;
  const to = new Date(now).getTime();
  if (!Number.isFinite(to)) throw new Error("Invalid analysis clock");
  const from = to - Number(options.days) * DAY;
  const previousFrom = from - Number(options.days) * DAY;
  const sourceScope = options.sourceId ? sources.filter((source) => source.id === options.sourceId) : sources;
  const owned = sources.filter((source) => source.kind === "owned");
  const query = unique(options.q.split(/[,\n]+/));
  const viewSets = sets.filter((set) => set.kind === options.view);
  const unknownSelectedSet = Boolean(options.setId && !selected);
  const filtered = content.filter((item) => {
    if (unknownSelectedSet) return false;
    if (options.brandId && (!selectedBrand || !matchesRules(item, { keywords: selectedBrand.aliases }))) return false;
    if (options.sourceId && !sourceScope.some((source) => sourceHas(source, item))) return false;
    const isOwned = owned.some((source) => sourceHas(source, item));
    if ((options.view === "owned" || options.persona === "owned") && !isOwned) return false;
    if ((options.view === "brand" || options.persona === "external") && isOwned) return false;
    if (options.persona === "disclosed" && !disclosed(item)) return false;
    if (query.length && !matchesRules(item, { keywords: query }, options.mode)) return false;
    if (selected && !matchesRules(item, selected, options.mode)) return false;
    if (["brand", "target"].includes(options.view) && !viewSets.some((set) => matchesRules(item, set, options.mode))) return false;
    return true;
  });
  const items = filtered.filter((item) => {
    const published = Date.parse(item.publishedAt);
    return published >= from && published <= to;
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const previous = filtered.filter((item) => {
    const published = Date.parse(item.publishedAt);
    return published >= previousFrom && published < from;
  });
  const likes = metric(items, "likes"), comments = metric(items, "comments"), views = metric(items, "views");
  const dailyCounts = new Map();
  for (let date = Math.floor(from / DAY) * DAY; date <= to; date += DAY)
    dailyCounts.set(new Date(date).toISOString().slice(0, 10), 0);
  for (const item of items) {
    const date = new Date(item.publishedAt).toISOString().slice(0, 10);
    dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
  }
  const currentTerms = termCounts(items), previousTerms = termCounts(previous);
  const keywords = [...currentTerms].map(([term, value]) => ({
    term, count: value.count, previous: previousTerms.get(term)?.count || 0,
    growth: growth(value.count, previousTerms.get(term)?.count || 0), authors: value.authors.size,
  })).sort((a, b) => b.count - a.count || a.term.localeCompare(b.term)).slice(0, 30);
  // This is a user-declared dictionary, independent of owned/competitor status or tracking sets.
  // A matching post is evidence of a textual mention, not proof of brand sponsorship or authorship.
  const brands = brandEntities.map((brand) => ({
    id: brand.id, name: brand.name,
    count: items.filter((item) => matchesRules(item, { keywords: brand.aliases })).length,
  })).filter((brand) => brand.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const accountGroups = new Map();
  for (const item of items) {
    const author = authorOf(item);
    if (!author) continue;
    const group = accountGroups.get(author) || [];
    group.push(item);
    accountGroups.set(author, group);
  }
  const accounts = [...accountGroups].map(([username, group]) => ({ username, count: group.length, likes: metric(group, "likes").total }))
    .sort((a, b) => b.count - a.count || a.username.localeCompare(b.username));
  const notes = [
    ...NOTES,
    "기간은 현재 시각 기준으로 직전 동일 길이 구간과 비교하며 일별 버킷은 UTC입니다. 수집 누락으로 증감률이 왜곡될 수 있습니다.",
    "좋아요·댓글·조회수는 알려진 값만 합산합니다. 도달 및 참여율은 제공되지 않아 추정하지 않습니다.",
    "키워드는 관측 게시물의 해시태그·단어 후보입니다. 뷰티 시장 전체의 유행을 대표하지 않습니다.",
    "브랜드 연관은 사용자가 독립 브랜드 사전에 등록한 별칭의 본문 일치입니다. 자동 브랜드 판별이나 해당 브랜드의 게시·협찬 여부를 뜻하지 않습니다.",
    "광고 표기 필터는 명시적인 광고·협찬 해시태그만 확인합니다. 표기가 없으면 광고 여부는 미상이며 언어로 국가를 추정하지 않습니다.",
  ];
  if (items.some((item) => !authorOf(item))) notes.push("작성자 미상 게시물은 언급 수에 포함되며 작성자·계정 집계에서는 제외합니다.");
  if (filtered.some((item) => !Number.isFinite(Date.parse(item.publishedAt)))) notes.push("게시 시각 미상 게시물은 기간별 집계에서 제외합니다.");
  if (["brand", "target"].includes(options.view) && !viewSets.length) notes.push("이 메뉴의 추적 세트가 없습니다. 키워드 또는 계정 조건을 먼저 저장해 주세요.");
  if (unknownSelectedSet) notes.push("요청한 추적 세트를 찾을 수 없습니다.");
  if (options.brandId && !selectedBrand) notes.push("요청한 브랜드 사전 항목을 찾을 수 없습니다.");
  if (!brandEntities.length) notes.push("브랜드 사전이 비어 있습니다. 탐색할 브랜드명과 별칭을 등록하면 관측 게시물의 브랜드 연관을 집계합니다.");
  if (options.sourceId && !sourceScope.length) notes.push("요청한 수집 계정을 찾을 수 없습니다.");
  return {
    items,
    summary: {
      mentions: items.length, authors: authors(items), likes: likes.total, comments: comments.total,
      views: views.total, engagementRate: null,
      metricCoverage: { likes: likes.count, comments: comments.count, views: views.count },
      previousMentions: previous.length, growth: growth(items.length, previous.length),
    },
    daily: [...dailyCounts].map(([date, count]) => ({ date, count })), keywords,
    brands,
    accounts,
    scope: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), sourceCount: sourceScope.length, collectionMode: COLLECTION_MODE, partial: true, notes },
  };
}

export function installMonitoring(app, store, { now = () => new Date() } = {}) {
  store.db.exec(`CREATE TABLE IF NOT EXISTS tracking_sets(
    id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('brand','target')),
    rules_json TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS brand_entities(
    id TEXT PRIMARY KEY, name TEXT NOT NULL, aliases_json TEXT NOT NULL
  )`);
  const decode = (row) => row && ({ id: row.id, name: row.name, kind: row.kind, ...JSON.parse(row.rules_json), createdAt: row.created_at });
  const sets = () => store.db.prepare("SELECT * FROM tracking_sets ORDER BY created_at DESC, id").all().map(decode);
  const brands = () => store.db.prepare("SELECT * FROM brand_entities ORDER BY name,id").all().map((row) => ({
    id: row.id, name: row.name, aliases: JSON.parse(row.aliases_json), provenance: "user-defined",
  }));
  const encodeRules = (body) => JSON.stringify({ keywords: body.keywords, required: body.required, excluded: body.excluded, accounts: body.accounts });
  app.get("/api/monitoring", (_req, res) => {
    const sources = store.sources();
    res.json({ sets: sets(), brands: brands(), coverage: {
      collectionMode: COLLECTION_MODE, keywordDiscoveryConnected: false, partial: true,
      sourceCount: sources.length, collectedSourceCount: sources.filter((source) => source.lastSuccess).length,
      sources: sources.map((source) => ({ id: source.id, username: source.username, kind: source.kind, enabled: source.enabled, lastSuccess: source.lastSuccess, lastError: source.lastError, contentCount: source.contentIds.length })),
      notes: NOTES,
    } });
  });
  app.get("/api/monitoring/brands", (_req, res) => res.json({ brands: brands() }));
  app.post("/api/monitoring/brands", (req, res) => {
    const body = brandSchema.parse(req.body);
    const existing = brands().find((brand) => normalizeTerm(brand.name) === normalizeTerm(body.name));
    if (existing) {
      if (JSON.stringify(existing.aliases) === JSON.stringify(body.aliases)) return res.json(existing);
      return res.status(409).json({ error: "이미 등록한 브랜드명입니다. 기존 항목을 삭제한 뒤 별칭을 다시 등록해 주세요." });
    }
    const id = randomUUID();
    store.db.prepare("INSERT INTO brand_entities(id,name,aliases_json) VALUES(?,?,?)").run(id, body.name, JSON.stringify(body.aliases));
    res.status(201).json({ id, ...body, provenance: "user-defined" });
  });
  app.delete("/api/monitoring/brands/:id", (req, res) => {
    store.db.prepare("DELETE FROM brand_entities WHERE id=?").run(req.params.id);
    res.json({ ok: true });
  });
  app.post("/api/monitoring/sets", (req, res) => {
    const body = rulesSchema.parse(req.body);
    const rules = encodeRules(body);
    const existing = sets().find((set) => normalizeTerm(set.name) === normalizeTerm(body.name) && set.kind === body.kind && encodeRules(set) === rules);
    if (existing) return res.json(existing);
    const id = randomUUID(), createdAt = new Date(now()).toISOString();
    store.db.prepare("INSERT INTO tracking_sets(id,name,kind,rules_json,created_at) VALUES(?,?,?,?,?)").run(id, body.name, body.kind, rules, createdAt);
    res.status(201).json({ id, ...body, createdAt });
  });
  app.patch("/api/monitoring/sets/:id", (req, res) => {
    const body = rulesSchema.parse(req.body);
    const existing = store.db.prepare("SELECT * FROM tracking_sets WHERE id=?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "추적 세트를 찾을 수 없습니다." });
    store.db.prepare("UPDATE tracking_sets SET name=?,kind=?,rules_json=? WHERE id=?").run(body.name, body.kind, encodeRules(body), req.params.id);
    res.json({ id: existing.id, ...body, createdAt: existing.created_at });
  });
  app.delete("/api/monitoring/sets/:id", (req, res) => {
    store.db.prepare("DELETE FROM tracking_sets WHERE id=?").run(req.params.id);
    res.json({ ok: true });
  });
  app.get("/api/monitoring/analysis", (req, res) => {
    const options = analysisSchema.parse(req.query);
    if (options.setId && !sets().some((set) => set.id === options.setId))
      return res.status(404).json({ error: "추적 세트를 찾을 수 없습니다." });
    if (options.sourceId && !store.sources().some((source) => source.id === options.sourceId))
      return res.status(404).json({ error: "수집 계정을 찾을 수 없습니다." });
    if (options.brandId && !brands().some((brand) => brand.id === options.brandId))
      return res.status(404).json({ error: "브랜드 사전 항목을 찾을 수 없습니다." });
    res.json(analyzeMonitoring(store.state().content, store.sources(), sets(), options, now(), brands()));
  });
}
