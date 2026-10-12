import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../server/store.mjs";
import { normalizeMedia } from "../server/instagram.mjs";
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "aialy-browser-"));
process.env.PORT = "14317";
process.env.NODE_ENV = "production";
const store = createStore(join(process.env.DATA_DIR, "instagram.sqlite"));
for (let a = 0; a < 3; a++) {
  const username = ["test_skincare", "test_creator", "test_beauty"][a];
  const id = store.addSource({
    username,
    label: [
      "스킨케어 테스트 브랜드",
      "테스트 크리에이터",
      "뷰티 테스트 브랜드",
    ][a],
    kind: a === 1 ? "creator" : "brand",
    intervalHours: 6,
  });
  const source = store.sources().find((s) => s.id === id);
  const items = [];
  for (let i = 0; i < 4; i++) {
    const n = a * 4 + i;
    const profile = {
      id: String(10000 + a),
      username,
      name: ["SKIN LAB", "CREATOR STUDIO", "BEAUTY ARCHIVE"][a],
    };
    const data = {
      id: String(100 + n),
      caption: [
        `수분 세럼으로 시작하는 아침 루틴 ${n} 수분크림 ${a === 1 ? "비교 브랜드 A 수부지" : "다른브랜드"}`,
        `가을 메이크업, 부드러운 톤의 발견 ${n} ${a === 1 ? "수부지 탄력탱탱 장벽케어" : ""}`,
        `일상 속 새로운 뷰티 인사이트 ${n}`,
        `꾸준한 스킨케어의 기록 ${n}`,
      ][i],
      media_type: i === 1 ? "VIDEO" : i === 2 ? "CAROUSEL_ALBUM" : "IMAGE",
      permalink: `https://www.instagram.com/p/test${n}/`,
      timestamp: new Date(Date.now() - n * 86400000).toISOString(),
      like_count: n === 3 ? undefined : 1280 + n * 173,
      comments_count: 12 + n * 5,
    };
    const content = normalizeMedia(data, profile);
    const color = ["#e9d6c4", "#c9d3be", "#dec8c2", "#c7d4cc"][i];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="600" height="750" fill="${color}"/><circle cx="300" cy="385" r="220" fill="#ffffff" opacity=".16"/><rect x="235" y="280" width="130" height="240" rx="22" fill="#f9f7f0"/><rect x="251" y="235" width="98" height="55" rx="8" fill="#a4ae91"/><text x="300" y="375" text-anchor="middle" fill="#7e896e" font-size="18" font-family="serif">STUDIO</text><text x="300" y="401" text-anchor="middle" fill="#a0aa8f" font-size="11" font-family="sans-serif">TEST FIXTURE</text><text x="40" y="685" fill="#ffffff" font-size="16" font-family="sans-serif">FOR AUTOMATED TESTS ONLY</text></svg>`;
    content.thumbnail =
      "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
    items.push(content);
  }
  const run = store.beginRun(source.id);
  store.finishRun(source, run, {
    profile: {
      id: String(10000 + a),
      username,
      name: source.label,
      followers: 10000 * (a + 1),
      mediaCount: 100 + a,
      biography: "테스트 데이터입니다.",
      avatar: null,
    },
    items,
    hasMore: false,
    scope: "Synthetic browser-test fixture, not live Instagram evidence.",
  });
}
store.db.close();
await import("../server/index.mjs");
