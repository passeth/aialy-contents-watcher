import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
export function createStore(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS content(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY,username TEXT UNIQUE COLLATE NOCASE NOT NULL,label TEXT NOT NULL,kind TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,interval_hours INTEGER NOT NULL DEFAULT 6,next_run TEXT,last_success TEXT,last_error TEXT,profile TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS source_content(source_id TEXT REFERENCES sources(id) ON DELETE CASCADE,content_id TEXT REFERENCES content(id) ON DELETE CASCADE,PRIMARY KEY(source_id,content_id));
    CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,started_at TEXT NOT NULL,finished_at TEXT,status TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,message TEXT,has_more INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS metrics(id INTEGER PRIMARY KEY,content_id TEXT REFERENCES content(id) ON DELETE CASCADE,run_id TEXT REFERENCES runs(id),at TEXT NOT NULL,likes INTEGER,comments INTEGER,UNIQUE(content_id,run_id));
    CREATE TABLE IF NOT EXISTS boards(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bookmarks(content_id TEXT PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,board_id TEXT REFERENCES boards(id) ON DELETE SET NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS favorites(id TEXT PRIMARY KEY);`);
  const content = () =>
    db
      .prepare("SELECT payload FROM content ORDER BY rowid DESC")
      .all()
      .map((r) => JSON.parse(r.payload));
  const sources = () =>
    db
      .prepare("SELECT * FROM sources ORDER BY created_at DESC")
      .all()
      .map((r) => ({
        id: r.id,
        username: r.username,
        label: r.label,
        kind: r.kind,
        enabled: !!r.enabled,
        intervalHours: r.interval_hours,
        nextRun: r.next_run,
        lastSuccess: r.last_success,
        lastError: r.last_error,
        profile: r.profile ? JSON.parse(r.profile) : null,
        contentIds: db
          .prepare("SELECT content_id FROM source_content WHERE source_id=?")
          .all(r.id)
          .map((x) => x.content_id),
      }));
  const state = () => ({
    content: content(),
    sources: sources(),
    boards: db
      .prepare(
        "SELECT id,name,created_at AS createdAt FROM boards ORDER BY created_at DESC",
      )
      .all(),
    bookmarks: db
      .prepare(
        "SELECT content_id AS contentId,board_id AS boardId,note,created_at AS createdAt FROM bookmarks ORDER BY created_at DESC",
      )
      .all(),
    favorites: db
      .prepare("SELECT id FROM favorites")
      .all()
      .map((r) => r.id),
    runs: db
      .prepare(
        "SELECT r.*,s.username FROM runs r LEFT JOIN sources s ON s.id=r.source_id ORDER BY started_at DESC LIMIT 50",
      )
      .all(),
  });
  return {
    db,
    state,
    sources,
    recover() {
      db.prepare(
        "UPDATE runs SET status='interrupted',finished_at=?,message='서버가 종료되어 수집이 중단되었습니다. 다시 수집해 주세요.' WHERE status='running'",
      ).run(new Date().toISOString());
    },
    addSource({ username, label, kind, intervalHours }) {
      const id = randomUUID();
      db.prepare(
        "INSERT INTO sources(id,username,label,kind,interval_hours,created_at) VALUES(?,?,?,?,?,?)",
      ).run(
        id,
        username.toLowerCase(),
        label,
        kind,
        intervalHours,
        new Date().toISOString(),
      );
      return id;
    },
    updateSource(id, { enabled, intervalHours }) {
      return db
        .prepare(
          "UPDATE sources SET enabled=?,interval_hours=?,next_run=? WHERE id=?",
        )
        .run(
          Number(enabled),
          intervalHours,
          new Date(Date.now() + intervalHours * 3600000).toISOString(),
          id,
        ).changes;
    },
    deleteSource(id) {
      return db.prepare("DELETE FROM sources WHERE id=?").run(id).changes;
    },
    beginRun(sourceId) {
      const id = randomUUID();
      db.prepare(
        "INSERT INTO runs(id,source_id,started_at,status) VALUES(?,?,?,'running')",
      ).run(id, sourceId, new Date().toISOString());
      return id;
    },
    finishRun(source, run, result) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const at = new Date().toISOString();
        for (const item of result.items) {
          db.prepare(
            "INSERT INTO content VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
          ).run(item.id, JSON.stringify(item));
          db.prepare("INSERT OR IGNORE INTO source_content VALUES(?,?)").run(
            source.id,
            item.id,
          );
          db.prepare(
            "INSERT INTO metrics(content_id,run_id,at,likes,comments) VALUES(?,?,?,?,?)",
          ).run(item.id, run, at, item.likes, item.comments);
        }
        db.prepare(
          "UPDATE sources SET last_success=?,last_error=NULL,profile=?,next_run=? WHERE id=?",
        ).run(
          at,
          JSON.stringify(result.profile),
          new Date(Date.now() + source.intervalHours * 3600000).toISOString(),
          source.id,
        );
        db.prepare(
          "UPDATE runs SET status='success',finished_at=?,count=?,message=?,has_more=? WHERE id=?",
        ).run(
          at,
          result.items.length,
          result.scope,
          Number(result.hasMore),
          run,
        );
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    failRun(source, run, message) {
      const at = new Date().toISOString();
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare(
          "UPDATE runs SET status='failed',finished_at=?,message=? WHERE id=?",
        ).run(at, message, run);
        db.prepare("UPDATE sources SET last_error=?,next_run=? WHERE id=?").run(
          message,
          new Date(Date.now() + source.intervalHours * 3600000).toISOString(),
          source.id,
        );
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    history(id) {
      return db
        .prepare(
          "SELECT at,likes,comments FROM metrics WHERE content_id=? ORDER BY at DESC LIMIT 30",
        )
        .all(id);
    },
    createBoard(name) {
      const board = {
        id: randomUUID(),
        name,
        createdAt: new Date().toISOString(),
      };
      db.prepare("INSERT INTO boards VALUES(?,?,?)").run(
        board.id,
        board.name,
        board.createdAt,
      );
      return board;
    },
    renameBoard(id, name) {
      return db.prepare("UPDATE boards SET name=? WHERE id=?").run(name, id)
        .changes;
    },
    deleteBoard(id) {
      return db.prepare("DELETE FROM boards WHERE id=?").run(id).changes;
    },
    saveBookmark(id, boardId, note) {
      if (!db.prepare("SELECT id FROM content WHERE id=?").get(id))
        throw new Error("콘텐츠를 찾을 수 없습니다.");
      if (
        boardId &&
        !db.prepare("SELECT id FROM boards WHERE id=?").get(boardId)
      )
        throw new Error("보드를 찾을 수 없습니다.");
      db.prepare(
        "INSERT INTO bookmarks VALUES(?,?,?,?) ON CONFLICT(content_id) DO UPDATE SET board_id=excluded.board_id,note=excluded.note",
      ).run(id, boardId, note, new Date().toISOString());
    },
    removeBookmark(id) {
      db.prepare("DELETE FROM bookmarks WHERE content_id=?").run(id);
    },
    favorite(id, on) {
      if (on) db.prepare("INSERT OR IGNORE INTO favorites VALUES(?)").run(id);
      else db.prepare("DELETE FROM favorites WHERE id=?").run(id);
    },
  };
}
