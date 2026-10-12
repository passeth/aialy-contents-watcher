// Public documentation screenshots: isolated synthetic data, no tokens or platform calls.
// Run npm run build, then node scripts/capture-ui.mjs.
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { chromium, expect } from "@playwright/test";
import { createStore } from "../server/store.mjs";
import { normalizeMedia } from "../server/instagram.mjs";
import { createWorkspaceApp } from "../server/workspaces.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "docs/screenshots");
const dataDir = mkdtempSync(join(tmpdir(), "aialy-docs-"));
mkdirSync(output, { recursive: true });
const store = createStore(join(dataDir, "instagram.sqlite"));
const accounts = [
  ["demo_our_brand", "우리 브랜드 · 예시", "owned"],
  ["demo_reference_a", "비교 브랜드 A · 예시", "brand"],
  ["demo_reference_b", "비교 브랜드 B · 예시", "brand"],
  ["demo_creator_a", "스킨케어 노트 · 예시", "creator"],
  ["demo_creator_b", "뷰티 루틴 · 예시", "creator"],
];
const captions = [
  "수분크림, 수부지의 아침 루틴. 끈적임보다 촉촉한 사용감을 먼저 살펴봐요. #수분크림 #수부지",
  "수부지 장벽케어 기록. 탄력탱탱 사용감은 어떨까? 성분과 바르는 순서를 함께 확인해요. #장벽케어",
  "수분크림을 고를 때, 보습과 산뜻함 중 어떤 표현에 눈길이 가나요? #보습 #산뜻함",
  "탄력탱탱 저녁 루틴. 피부 고민에서 시작하는 제품 선택. #탄력탱탱 #수부지",
];
const colors = ["#e2f6d5", "#e8ebe6", "#e6d9c9", "#dce8eb"];
function thumbnail(index) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700">
  <rect width="600" height="700" fill="${colors[index % 4]}"/>
  <text x="42" y="64" font-family="sans-serif" font-size="16" letter-spacing="4" fill="#163300">SKINCARE / DEMO</text>
  <circle cx="300" cy="340" r="180" fill="#fff" opacity=".45"/>
  <rect x="208" y="243" width="184" height="244" rx="24" fill="#fff"/>
  <rect x="214" y="208" width="172" height="65" rx="14" fill="#163300"/>
  <text x="300" y="348" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="24" fill="#163300">${["MOISTURE", "BARRIER", "DAILY", "ROUTINE"][index % 4]}</text>
  <text x="300" y="378" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#6a6c6a">ILLUSTRATIVE SAMPLE</text>
  <text x="42" y="645" font-family="sans-serif" font-size="15" fill="#163300">AIALY CONTENTS WATCHER — UI EXAMPLE</text></svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}
const allItems = [];
for (const [a, [username, label, kind]] of accounts.entries()) {
  const id = store.addSource({ username, label, kind, intervalHours: 24 });
  const source = store.sources().find((s) => s.id === id);
  const profile = { id: String(90000 + a), username, name: label,
    followers: 1200 + a * 350, mediaCount: 40 + a * 8,
    biography: "화면 설명을 위한 가상 계정입니다.", avatar: null };
  const items = Array.from({ length: 4 }, (_, i) => {
    const item = normalizeMedia({
      id: String(900000 + a * 4 + i),
      caption: `${a > 2 ? "우리 브랜드 · 비교 브랜드 A " : ""}${captions[i]}\n[화면 설명용 가상 게시물]`,
      media_type: i === 1 ? "VIDEO" : i === 2 ? "CAROUSEL_ALBUM" : "IMAGE",
      permalink: "https://example.invalid/demo-post",
      timestamp: new Date(Date.now() - (a + i * 3 + 1) * 86400000).toISOString(),
      like_count: i === 3 ? undefined : 120 + a * 43 + i * 21,
      comments_count: 8 + a * 3 + i,
    }, profile);
    item.thumbnail = thumbnail(a + i);
    return item;
  });
  store.finishRun(source, store.beginRun(id), { profile, items, hasMore: false,
    scope: "가상 예시 데이터 — 실제 Instagram 수집 결과가 아닙니다." });
  allItems.push(...items);
}
const board = store.createBoard("수분크림 메시지 연구");
for (const item of allItems.slice(12, 15)) store.saveBookmark(item.id, board.id,
  "관찰: 사용감과 피부 고민을 함께 설명한다.\n해석: 산뜻함을 먼저 전달하는 메시지를 시험해 볼 수 있다.\n다음 행동: 다른 작성자의 원문에서도 반복되는지 확인한다. (가상 예시)");
store.db.close();

const workspaces = createWorkspaceApp(dataDir, { defaultName: "스킨케어 · 예시" });
workspaces.app.use(express.static(resolve(root, "dist")));
const server = workspaces.app.listen(0, "127.0.0.1");
await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  const post = async (path, data) => {
    const r = await fetch(base + "/api" + path, { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
    return r.json();
  };
  for (const name of ["바디케어 · 예시", "헤어케어 · 예시"]) await post("/workspaces", { name });
  await post("/monitoring/brands", { name: "비교 브랜드 A", aliases: ["비교 브랜드 A", "reference a"] });
  await post("/monitoring/sets", { name: "우리 브랜드 외부 언급", kind: "brand", keywords: ["우리 브랜드"], excluded: ["품절"] });
  await post("/monitoring/sets", { name: "수부지 · 수분크림 탐색", kind: "target", keywords: ["수부지", "수분크림"], excluded: ["공동구매"] });
  for (let i = 0; i < 2; i++) await post("/ads", {
    libraryUrl: `https://www.facebook.com/ads/library/?id=90000000000000${i}`,
    brand: `비교 브랜드 ${i ? "B" : "A"} · 가상 예시`,
    caption: i ? "하루의 끝, 촉촉한 장벽케어 루틴." : "수분은 충분하게, 마무리는 산뜻하게. 수부지의 아침 수분크림.",
    format: i ? "video" : "image", status: "unknown", startDate: null,
    note: "기능 설명용 가상 광고입니다. 실제 광고 ID나 집행 결과가 아닙니다.",
  });
  browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_BUNDLED_CHROMIUM === "1" ? undefined :
      process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.origin === base || ["data:", "blob:"].includes(u.protocol) ? route.continue() : route.abort();
  });
  async function capture(name) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].filter((img) => img.getBoundingClientRect().top < innerHeight)
        .map((img) => img.decode().catch(() => {})));
    });
    await page.screenshot({ path: join(output, `${name}.png`), animations: "disabled" });
    console.log(`Captured ${name}`);
  }
  for (const [name, selector] of [
    ["discover", ".content-card"], ["brands", ".hub-row"], ["creators", ".hub-row"],
    ["bookmarks", ".content-card"], ["social", ".metric-card"], ["tracking", ".rule-card"],
    ["brand-mentions", ".metric-card"], ["target-mentions", ".metric-card"],
    ["owned", ".metric-card"], ["ads", ".ad-card"], ["sources", ".source-main"],
  ]) {
    await page.goto(`${base}/?page=${name}`);
    await expect(page.locator(selector).first()).toBeVisible();
    if (name === "social") {
      await page.getByLabel("분석 키워드").fill("수분크림");
      await page.getByRole("button", { name: "검색", exact: true }).click();
      await expect(page.getByRole("navigation", { name: "탐색 경로" })).toContainText("수분크림");
    }
    await capture(name);
    if (name === "social") {
      await page.getByRole("heading", { name: "이 주제와 함께 등장한 브랜드" }).scrollIntoViewIfNeeded();
      await page.locator(".analysis-columns").first().scrollIntoViewIfNeeded();
      await capture("social-explore");
    }
  }
  await page.goto(`${base}/?page=bookmarks`);
  await page.locator(".media-open").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture("detail");
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByLabel("워크스페이스 전환").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture("workspaces");
  if (errors.length) throw new Error(errors.join("\n"));
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  workspaces.close();
  rmSync(dataDir, { recursive: true, force: true });
}
