import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../server/store.mjs";
import { createInstagramClient, normalizeMedia } from "../server/instagram.mjs";
import { credentials } from "../server/credentials.mjs";
import { createCollector } from "../server/collector.mjs";
import { createApp } from "../server/app.mjs";
const media = (id = "1") => ({
  id,
  caption: "피부를 위한 아침 루틴",
  media_type: "IMAGE",
  permalink: `https://www.instagram.com/p/${id}/`,
  media_url: "https://cdn.example.com/1.jpg",
  timestamp: "2026-10-01T01:00:00+0000",
});
const profile = { id: "12345", username: "test_brand", name: "테스트 브랜드" };
const config = {
  token: "TEST_TOKEN_NEVER_LOG",
  accountId: "123456789",
  version: "v26.0",
};
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "aialy-test-"));
  const store = createStore(join(dir, "test.sqlite"));
  const secrets = credentials(join(dir, "connection.json"));
  const id = store.addSource({
    username: "test_brand",
    label: "테스트",
    kind: "brand",
    intervalHours: 6,
  });
  const source = store.sources()[0];
  t.after(() => {
    store.db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { dir, store, secrets, id, source };
}
const result = (items) => ({
  profile,
  items,
  hasMore: false,
  scope: "test fixture",
});
test("unknown metrics remain null and published timestamp is preserved", () => {
  const c = normalizeMedia(media(), profile);
  assert.equal(c.likes, null);
  assert.equal(c.views, null);
  assert.equal(c.comments, null);
  assert.equal(c.id, "instagram:1");
  assert.equal(c.publishedAt, media().timestamp);
});
test("token is only sent in authorization header and pagination stays on the fixed Graph host", async () => {
  const calls = [];
  const client = createInstagramClient(config, {
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      const page = calls.length;
      return new Response(
        JSON.stringify({
          business_discovery: {
            ...profile,
            media: {
              data: [{ ...media(String(page)), like_count: page }],
              paging:
                page === 1
                  ? {
                      next: "https://evil.example/token",
                      cursors: { after: "CURSOR123" },
                    }
                  : {},
            },
          },
        }),
      );
    },
  });
  const r = await client.collect("test_brand");
  assert.equal(r.items.length, 2);
  assert.ok(calls[1].url.includes("after%28CURSOR123%29"));
  assert.ok(
    calls.every(
      (c) =>
        new URL(c.url).hostname === "graph.facebook.com" &&
        !c.url.includes(config.token),
    ),
  );
  assert.equal(
    calls[0].options.headers.Authorization,
    `Bearer ${config.token}`,
  );
});
test("expired credentials fail without retrying or leaking provider message", async () => {
  let calls = 0;
  const client = createInstagramClient(config, {
    fetchImpl: async () => {
      calls++;
      return new Response(
        JSON.stringify({ error: { code: 190, message: config.token } }),
        { status: 400 },
      );
    },
  });
  await assert.rejects(
    client.collect("test_brand"),
    (e) => !e.message.includes(config.token) && e.status === 401,
  );
  assert.equal(calls, 1);
});
test("rate limits have bounded retries", async () => {
  let calls = 0;
  const sleeps = [];
  const client = createInstagramClient(config, {
    sleep: async (ms) => sleeps.push(ms),
    fetchImpl: async () => {
      calls++;
      return new Response(JSON.stringify({ error: { code: 4 } }), {
        status: 429,
        headers: { "retry-after": "9999" },
      });
    },
  });
  await assert.rejects(client.collect("test_brand"));
  assert.equal(calls, 3);
  assert.deepEqual(sleeps, [30000, 30000]);
});
test("deduplicated updates preserve bookmarks and notes while adding metric history", (t) => {
  const { store, source } = fixture(t);
  let run = store.beginRun(source.id);
  store.finishRun(source, run, result([normalizeMedia(media(), profile)]));
  const board = store.createBoard("리서치");
  store.saveBookmark("instagram:1", board.id, "반드시 유지할 메모");
  run = store.beginRun(source.id);
  store.finishRun(
    source,
    run,
    result([normalizeMedia({ ...media(), like_count: 82 }, profile)]),
  );
  assert.equal(store.state().content.length, 1);
  assert.equal(store.state().content[0].likes, 82);
  assert.equal(store.state().bookmarks[0].note, "반드시 유지할 메모");
  assert.equal(store.history("instagram:1").length, 2);
  store.deleteBoard(board.id);
  assert.equal(store.state().bookmarks[0].boardId, null);
  assert.equal(store.state().bookmarks[0].note, "반드시 유지할 메모");
});
test("transaction rollback leaves content unchanged on partial database failure", (t) => {
  const { store, source } = fixture(t);
  const run = store.beginRun(source.id);
  assert.throws(() =>
    store.finishRun(
      source,
      run,
      result([normalizeMedia(media(), profile), { id: null }]),
    ),
  );
  assert.equal(store.state().content.length, 0);
  assert.equal(store.history("instagram:1").length, 0);
});
test("collector keeps old data on API failure and blocks overlapping collection", async (t) => {
  const { store, secrets, source } = fixture(t);
  secrets.save(config);
  let release;
  const waiting = new Promise((r) => {
    release = r;
  });
  const collector = createCollector(store, secrets, {
    clientFactory: () => ({
      collect: async () => {
        await waiting;
        throw new Error("sensitive token " + config.token);
      },
    }),
  });
  const first = collector.run(source.id);
  await assert.rejects(collector.run(source.id), (e) => e.status === 409);
  release();
  await assert.rejects(first, (e) => !e.message.includes(config.token));
  assert.equal(store.state().runs[0].status, "failed");
  assert.equal(collector.running.size, 0);
});
test("connection status excludes secrets and files have private permissions", (t) => {
  const { secrets, dir } = fixture(t);
  secrets.save({ ...config, username: "test_brand" });
  assert.equal(statSync(join(dir, "connection.json")).mode & 0o777, 0o600);
  assert.equal(JSON.stringify(secrets.status()).includes(config.token), false);
  secrets.clear();
  assert.deepEqual(secrets.status(), { connected: false });
});
test("API rejects cross-origin mutations and tokens never appear in workspace", async (t) => {
  const { store, secrets } = fixture(t);
  secrets.save(config);
  const collector = createCollector(store, secrets);
  const app = createApp(store, secrets, collector);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const r = await fetch(base + "/api/boards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://other.example",
    },
    body: JSON.stringify({ name: "bad" }),
  });
  assert.equal(r.status, 403);
  const w = await fetch(base + "/api/workspace");
  assert.ok(!(await w.text()).includes(config.token));
  const empty = await fetch(base + "/api/boards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "   " }),
  });
  assert.equal(empty.status, 400);
});
test("ad references are canonical, idempotent, manual and never accept arbitrary hosts", async (t) => {
  const { store, secrets } = fixture(t);
  const collector = createCollector(store, secrets);
  const app = createApp(store, secrets, collector);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const save = (body) =>
    fetch(base + "/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const body = {
    libraryUrl:
      "https://www.facebook.com/ads/library/?id=123456789&tracking=ignored",
    brand: "Test",
    caption: "Example",
    status: "unknown",
  };
  assert.equal(
    (
      await save({
        ...body,
        libraryUrl: "https://evil.example/ads/library/?id=123456789",
      })
    ).status,
    400,
  );
  assert.equal((await save({ ...body, startDate: "2026-02-31" })).status, 400);
  assert.equal((await save(body)).status, 201);
  assert.equal((await save({ ...body, caption: "Updated" })).status, 200);
  const data = await (await fetch(base + "/api/ads")).json();
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].caption, "Updated");
  assert.equal(
    data.items[0].libraryUrl,
    "https://www.facebook.com/ads/library/?id=123456789",
  );
  assert.equal(data.coverage.connected, false);
  assert.equal(data.coverage.mode, "manual-library-reference");
});
test("cursor-only nested Graph pagination reads four pages and discloses its bound", async () => {
  let calls = 0;
  const client = createInstagramClient(config, {
    fetchImpl: async () => {
      calls++;
      return new Response(
        JSON.stringify({
          business_discovery: {
            ...profile,
            media: {
              data: Array.from({ length: 25 }, (_, i) =>
                media(String(calls * 100 + i)),
              ),
              paging: { cursors: { after: "CURSOR" + calls } },
            },
          },
        }),
      );
    },
  });
  const r = await client.collect("test_brand");
  assert.equal(calls, 4);
  assert.equal(r.items.length, 100);
  assert.equal(r.hasMore, true);
});
test("repeated nested cursor fails instead of presenting a truncated success", async () => {
  let calls = 0;
  const client = createInstagramClient(config, {
    fetchImpl: async () => {
      calls++;
      return new Response(
        JSON.stringify({
          business_discovery: {
            ...profile,
            media: { data: [media()], paging: { cursors: { after: "SAME" } } },
          },
        }),
      );
    },
  });
  await assert.rejects(client.collect("test_brand"), /진행되지/);
  assert.equal(calls, 2);
});
