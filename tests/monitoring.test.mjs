import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { z } from "zod";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../server/store.mjs";
import { analyzeMonitoring, installMonitoring, matchesRules, normalizeTerm } from "../server/monitoring.mjs";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const item = (id, changes = {}) => ({
  id, caption: "Housebrand #세라마이드 #보습", title: "", author: "reviewer",
  publishedAt: "2026-10-12T12:00:00.000Z", likes: null, comments: null, views: null, ...changes,
});
const brand = { id: "brand", name: "우리브랜드", kind: "brand", keywords: ["housebrand", "우리브랜드"], required: [], excluded: [], accounts: [] };
const source = (id, kind, username, contentIds = []) => ({ id, kind, username, contentIds });

test("literal normalized rules implement alternatives, ALL requirements and ANY exclusions", () => {
  assert.equal(normalizeTerm(" ＨＯＵＳＥＢＲＡＮＤ  Straße "), "housebrand strasse");
  const rules = { keywords: ["housebrand", "우리브랜드"], required: ["보습", "세라마이드"], excluded: ["판매종료", "중고"], accounts: ["@Creator"] };
  assert.equal(matchesRules(item("a"), rules), true);
  assert.equal(matchesRules(item("a"), rules, "and"), false);
  assert.equal(matchesRules(item("a", { caption: "보습 세라마이드", author: "creator" }), rules, "and"), true);
  assert.equal(matchesRules(item("a", { caption: "Housebrand 보습 세라마이드 중고" }), rules), false);
  assert.equal(matchesRules(item("a", { caption: "Housebrand 보습" }), rules), false);
  assert.equal(matchesRules(item("a"), { keywords: [".*"] }), false);
  assert.equal(matchesRules(item("a"), { keywords: ["' OR 1=1; --"] }), false);
});

test("brand mentions exclude owned source membership and owned author aliases", () => {
  const content = [item("owned", { author: "HOUSEBRAND" }), item("member"), item("external")];
  const sources = [source("o", "owned", "housebrand", ["member"]), source("c", "creator", "reviewer", ["external"])];
  const result = analyzeMonitoring(content, sources, [brand], { view: "brand", days: "7" }, NOW);
  assert.deepEqual(result.items.map((row) => row.id), ["external"]);
  assert.equal(result.summary.mentions, 1);
  const own = analyzeMonitoring(content, sources, [brand], { view: "owned", days: "7" }, NOW);
  assert.deepEqual(own.items.map((row) => row.id), ["owned", "member"]);
  assert.equal(result.scope.partial, true);
  assert.equal(result.scope.collectionMode, "registered-account-subset");
});

test("known-only metrics preserve zero versus unavailable and unknown authors", () => {
  const result = analyzeMonitoring([item("a", { likes: 0, comments: 2 }), item("b", { likes: 4, author: null }), item("c")], [], [], {}, NOW);
  assert.deepEqual(result.summary, {
    mentions: 3, authors: 1, likes: 4, comments: 2, views: null, engagementRate: null,
    metricCoverage: { likes: 2, comments: 1, views: 0 }, previousMentions: 0, growth: null,
  });
  assert.deepEqual(result.accounts, [{ username: "reviewer", count: 2, likes: 0 }]);
  assert.equal(result.scope.notes.some((note) => note.includes("작성자 미상")), true);
  const unknown = analyzeMonitoring([item("a", { likes: -1, comments: NaN, views: Infinity })], [], [], {}, NOW);
  assert.equal(unknown.summary.likes, null);
  assert.equal(unknown.summary.comments, null);
  assert.equal(unknown.summary.views, null);
});

test("comparison uses exact preceding equal window and daily UTC buckets", () => {
  const rows = [
    item("start", { publishedAt: "2026-10-06T12:00:00.000Z" }),
    item("end", { publishedAt: "2026-10-13T12:00:00.000Z" }),
    item("previous-end", { publishedAt: "2026-10-06T11:59:59.999Z" }),
    item("previous-start", { publishedAt: "2026-09-29T12:00:00.000Z" }),
    item("older", { publishedAt: "2026-09-29T11:59:59.999Z" }),
    item("future", { publishedAt: "2026-10-13T12:00:00.001Z" }),
    item("invalid", { publishedAt: "unknown" }),
  ];
  const result = analyzeMonitoring(rows, [], [], { days: "7" }, NOW);
  assert.deepEqual(result.items.map((row) => row.id), ["end", "start"]);
  assert.equal(result.summary.previousMentions, 2);
  assert.equal(result.summary.growth, 0);
  assert.equal(result.daily.reduce((count, day) => count + day.count, 0), 2);
  assert.deepEqual(result.daily[0], { date: "2026-10-06", count: 1 });
  assert.deepEqual(result.daily.at(-1), { date: "2026-10-13", count: 1 });
  assert.equal(result.scope.from, "2026-10-06T12:00:00.000Z");
  const term = result.keywords.find((row) => row.term === "세라마이드");
  assert.deepEqual(term, { term: "세라마이드", count: 2, previous: 2, growth: 0, authors: 1 });
});

test("trend candidates deduplicate per post, filter stop words and retain zero-baseline unknown growth", () => {
  const result = analyzeMonitoring([
    item("a", { caption: "#장벽 #장벽 장벽 the and #광고 https://example.com/hidden @notkeyword", author: null }),
    item("b", { caption: "#장벽", author: "creator2" }),
  ], [], [], {}, NOW);
  assert.deepEqual(result.keywords, [{ term: "장벽", count: 2, previous: 0, growth: null, authors: 1 }]);
});

test("brand dictionary associations require text and disclose filters never label ordinary posts unpaid", () => {
  const accountOnly = { ...brand, keywords: [], accounts: ["reviewer"] };
  const result = analyzeMonitoring([item("a", { caption: "#보습 #ad" }), item("b", { caption: "Housebrand 보습" }), item("c", { caption: "#advice" })], [], [brand, accountOnly], {}, NOW, [{ id: "housebrand", name: "우리브랜드", aliases: ["housebrand", "우리브랜드"] }]);
  assert.deepEqual(result.brands, [{ id: "housebrand", name: "우리브랜드", count: 1 }]);
  const ads = analyzeMonitoring(result.items, [], [], { persona: "disclosed" }, NOW);
  assert.deepEqual(ads.items.map((row) => row.id), ["a"]);
  assert.equal("paid" in result.items[1], false);
});

test("independent dictionary supports moisturizer to ReferenceA to 수부지 exploration while retaining the broad query", () => {
  const dictionary = [
    { id: "referencea", name: "비교 브랜드 A", aliases: ["비교 브랜드 A", "referencea", "reference a"] },
    { id: "housebrand", name: "우리브랜드", aliases: ["housebrand", "우리브랜드"] },
  ];
  const content = [
    item("round-moisture", { caption: "비교 브랜드 A 보습 #수부지 #수부지", author: "referencea" }),
    item("round-review", { caption: "REFERENCE A 보습 추천 #수부지", author: "reviewer" }),
    item("housebrand-moisture", { caption: "Housebrand 보습 #장벽", author: "housebrand" }),
    item("round-sun", { caption: "ReferenceA 선크림 #수부지", author: "creator" }),
    item("other-sun", { caption: "선크림 #수부지", author: "other" }),
  ];
  const sources = [source("r", "brand", "referencea"), source("f", "owned", "housebrand")];
  const broad = analyzeMonitoring(content, sources, [], { q: "보습" }, NOW, dictionary);
  assert.deepEqual(broad.brands, [{ id: "referencea", name: "비교 브랜드 A", count: 2 }, { id: "housebrand", name: "우리브랜드", count: 1 }]);
  const referencea = analyzeMonitoring(content, sources, [], { q: "보습", brandId: broad.brands[0].id }, NOW, dictionary);
  assert.deepEqual(referencea.items.map((row) => row.id), ["round-moisture", "round-review"]);
  assert.deepEqual(referencea.keywords.find((row) => row.term === "수부지"), { term: "수부지", count: 2, previous: 0, growth: null, authors: 2 });
  const newKeywordSearch = analyzeMonitoring(content, sources, [], { q: "수부지" }, NOW, dictionary);
  assert.equal(newKeywordSearch.summary.mentions, 4);
  assert.deepEqual(newKeywordSearch.brands, [{ id: "referencea", name: "비교 브랜드 A", count: 3 }]);
  assert.equal(analyzeMonitoring(content, sources, [], { q: "보습", brandId: "missing" }, NOW, dictionary).summary.mentions, 0);
  assert.deepEqual(analyzeMonitoring(content, sources, [brand], { q: "보습" }, NOW).brands, []);
  assert.equal(sources[0].kind, "brand");
});

test("query, saved set and source restrictions compose without discovery", () => {
  const content = [item("a", { caption: "Housebrand 우리브랜드 세라마이드 보습" }), item("b", { caption: "우리브랜드 보습", author: "other" }), item("c", { caption: "competitor 세라마이드" })];
  const sources = [source("one", "creator", "reviewer", ["a", "c"]), source("two", "creator", "other", ["b"])];
  const result = analyzeMonitoring(content, sources, [brand], { q: "housebrand,세라마이드", mode: "and", setId: "brand", sourceId: "one" }, NOW);
  assert.deepEqual(result.items.map((row) => row.id), ["a"]);
  assert.equal(result.scope.sourceCount, 1);
  assert.equal(analyzeMonitoring(content, sources, [], { view: "brand" }, NOW).items.length, 0);
  assert.equal(analyzeMonitoring(content, sources, [brand], { setId: "missing" }, NOW).items.length, 0);
  assert.equal(analyzeMonitoring(content, sources, [brand], { sourceId: "missing" }, NOW).items.length, 0);
});

test("saved rules API is idempotent, validates input, reports coverage, and preserves collected content", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "monitoring-test-"));
  const store = createStore(join(dir, "monitor.sqlite"));
  store.db.prepare("INSERT INTO content VALUES(?,?)").run("a", JSON.stringify(item("a")));
  store.addSource({ username: "reviewer", label: "Reviewer", kind: "creator", intervalHours: 6 });
  const app = express();
  app.use(express.json());
  installMonitoring(app, store, { now: () => NOW });
  app.use((error, _req, res, _next) => res.status(error instanceof z.ZodError ? 400 : 500).json({ error: "invalid" }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    store.db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}/api/monitoring`;
  const request = (path, method, body) => fetch(base + path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const config = { name: "우리브랜드", kind: "brand", keywords: ["ＨＯＵＳＥＢＲＡＮＤ", "housebrand", "우리브랜드"], required: [], excluded: [], accounts: [] };
  const created = await request("/sets", "POST", config);
  assert.equal(created.status, 201);
  const set = await created.json();
  assert.equal(set.keywords.length, 2);
  const repeated = await request("/sets", "POST", { ...config, keywords: ["우리브랜드", "housebrand"] });
  assert.equal(repeated.status, 200);
  assert.equal((await repeated.json()).id, set.id);
  const coverage = await (await fetch(base)).json();
  assert.equal(coverage.sets.length, 1);
  assert.equal(coverage.coverage.keywordDiscoveryConnected, false);
  assert.equal(coverage.coverage.collectedSourceCount, 0);
  assert.equal(coverage.coverage.sourceCount, 1);
  assert.equal(store.sources()[0].enabled, false);
  assert.equal((await request("/sets", "POST", { name: "empty", kind: "brand" })).status, 400);
  assert.equal((await fetch(base + "/analysis?days=1")).status, 400);
  assert.equal((await fetch(base + "/analysis?setId=missing")).status, 404);
  assert.equal((await fetch(base + "/analysis?sourceId=missing")).status, 404);
  assert.equal((await fetch(base + "/analysis?brandId=missing")).status, 404);
  const brandConfig = { name: "우리브랜드", aliases: ["housebrand", "ＨＯＵＳＥＢＲＡＮＤ", "우리브랜드"] };
  const createdBrand = await request("/brands", "POST", brandConfig);
  assert.equal(createdBrand.status, 201);
  const entity = await createdBrand.json();
  assert.deepEqual(entity.aliases, ["housebrand", "우리브랜드"]);
  assert.equal(entity.provenance, "user-defined");
  const repeatedBrand = await request("/brands", "POST", { ...brandConfig, aliases: ["우리브랜드", "housebrand"] });
  assert.equal(repeatedBrand.status, 200);
  assert.equal((await repeatedBrand.json()).id, entity.id);
  assert.equal((await request("/brands", "POST", { ...brandConfig, aliases: [] })).status, 400);
  assert.equal((await request("/brands", "POST", { ...brandConfig, aliases: ["different"] })).status, 409);
  assert.deepEqual((await (await fetch(base + "/brands")).json()).brands, [entity]);
  assert.deepEqual((await (await fetch(base)).json()).brands, [entity]);
  const brandAnalysis = await (await fetch(base + "/analysis?q=" + encodeURIComponent("보습") + "&brandId=" + entity.id)).json();
  assert.deepEqual(brandAnalysis.brands, [{ id: entity.id, name: "우리브랜드", count: 1 }]);
  assert.equal(brandAnalysis.summary.mentions, 1);
  const injection = await (await fetch(base + "/analysis?q=" + encodeURIComponent("' OR 1=1; --"))).json();
  assert.equal(injection.items.length, 0);
  const patch = await request(`/sets/${set.id}`, "PATCH", { ...config, required: ["보습"] });
  assert.equal(patch.status, 200);
  assert.deepEqual((await patch.json()).required, ["보습"]);
  assert.equal((await request(`/sets/${set.id}`, "DELETE")).status, 200);
  assert.equal((await (await fetch(base)).json()).sets.length, 0);
  assert.equal((await request(`/brands/${entity.id}`, "DELETE")).status, 200);
  assert.deepEqual((await (await fetch(base + "/brands")).json()).brands, []);
  assert.equal(store.state().content.length, 1);
});
