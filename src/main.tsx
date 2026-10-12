import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Folder,
  Heart,
  Camera as Instagram,
  Layers,
  Link2,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  Unplug,
  Play,
  Image as ImageIcon,
  BarChart3,
  Loader2,
  Power,
  PenLine,
} from "lucide-react";
import {
  api,
  date,
  number,
  exportCsv,
  type Content,
  type Workspace,
  type Source,
  type Board,
  type WorkspaceInfo,
} from "./model";
import "./styles.css";
import { WorkspacePicker } from "./Workspaces";
import { Research, type ResearchPage } from "./Research";
import "./research.css";
import "./theme.css";
type Page =
  "discover" | "brands" | "creators" | "bookmarks" | "sources" | ResearchPage;
type Modal =
  | { kind: "connection" }
  | { kind: "source" }
  | { kind: "board"; board?: Board }
  | { kind: "deleteBoard"; board: Board }
  | { kind: "deleteSource"; source: Source }
  | { kind: "detail"; content: Content }
  | { kind: "profile"; source: Source }
  | { kind: "guide" }
  | { kind: "compare" }
  | null;
const empty: Workspace = {
  content: [],
  sources: [],
  boards: [],
  bookmarks: [],
  favorites: [],
  runs: [],
  connection: { connected: false },
  running: [],
};
const nav = [
  {
    id: "discover" as Page,
    name: "컨텐츠 허브",
    icon: Compass,
    group: "DISCOVER",
  },
  {
    id: "brands" as Page,
    name: "브랜드 허브",
    icon: Building2,
    group: "DISCOVER",
  },
  {
    id: "creators" as Page,
    name: "크리에이터 허브",
    icon: Users,
    group: "DISCOVER",
  },
  {
    id: "bookmarks" as Page,
    name: "북마크",
    icon: Bookmark,
    group: "DISCOVER",
  },
  {
    id: "social" as Page,
    name: "소셜 게시물",
    icon: Instagram,
    group: "RESEARCH",
  },
  { id: "ads" as Page, name: "메타 광고", icon: Layers, group: "RESEARCH" },
  {
    id: "tracking" as Page,
    name: "추적 관리",
    icon: Settings2,
    group: "TRACKING",
  },
  {
    id: "brand-mentions" as Page,
    name: "브랜드 멘션 추적",
    icon: MessageCircle,
    group: "TRACKING",
  },
  {
    id: "target-mentions" as Page,
    name: "타겟 멘션 추적",
    icon: Search,
    group: "TRACKING",
  },
  {
    id: "owned" as Page,
    name: "자사 계정 관리",
    icon: BarChart3,
    group: "OPERATIONS",
  },
];
const titles: Record<Page, string> = {
  discover: "컨텐츠 허브",
  brands: "브랜드 허브",
  creators: "크리에이터 허브",
  bookmarks: "북마크",
  social: "소셜 게시물",
  ads: "메타 광고",
  tracking: "추적 관리",
  "brand-mentions": "브랜드 멘션 추적",
  "target-mentions": "타겟 멘션 추적",
  owned: "자사 계정 관리",
  sources: "소스 연결",
};
function App() {
  const [ws, setWs] = useState<Workspace>(empty),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const initial = new URLSearchParams(location.search);
  const workspaceId = initial.get("workspace") || "default";
  const [spaces, setSpaces] = useState<WorkspaceInfo[]>([]);
  const [workspacePicker, setWorkspacePicker] = useState(false);
  const [page, setPage] = useState<Page>(
    ([...nav.map((n) => n.id), "sources"].includes(initial.get("page") || "")
      ? initial.get("page")
      : "discover") as Page,
  );
  const [query, setQuery] = useState(initial.get("q") || ""),
    [kind, setKind] = useState("all"),
    [sort, setSort] = useState("recent"),
    [days, setDays] = useState("all"),
    [minLikes, setMinLikes] = useState(""),
    [account, setAccount] = useState("all"),
    [filters, setFilters] = useState(false),
    [favorites, setFavorites] = useState(false),
    [board, setBoard] = useState("all"),
    [limit, setLimit] = useState(24),
    [selected, setSelected] = useState<string[]>([]),
    [modal, setModal] = useState<Modal>(null),
    [sidebar, setSidebar] = useState(false),
    [busy, setBusy] = useState<string[]>([]);
  async function refresh() {
    try {
      const [state, choices] = await Promise.all([api<Workspace>("/workspace"), api<WorkspaceInfo[]>("/workspaces")]);
      setWs(state);
      setSpaces(choices);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 10000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const params = new URLSearchParams({ page, workspace: workspaceId });
    if (query) params.set("q", query);
    history.replaceState(null, "", "?" + params);
  }, [page, query]);
  useEffect(
    () => setLimit(24),
    [query, kind, days, minLikes, account, page, board, sort],
  );
  function go(p: Page) {
    setPage(p);
    setQuery("");
    setAccount("all");
    setKind("all");
    setSort("recent");
    setDays("all");
    setMinLikes("");
    setFavorites(false);
    setSelected([]);
    setSidebar(false);
  }
  async function mutate(
    path: string,
    method: string,
    body: unknown,
    message?: string,
  ) {
    try {
      await api(path, method, body);
      await refresh();
      if (message) setToast(message);
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    }
  }
  async function collect(source: Source) {
    setBusy((b) => [...b, source.id]);
    try {
      const r = await api<{ count: number }>(
        `/sources/${source.id}/collect`,
        "POST",
        {},
      );
      setToast(`@${source.username} · ${r.count}개 게시물을 갱신했습니다.`);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy((b) => b.filter((id) => id !== source.id));
      await refresh();
    }
  }
  function isSaved(id: string) {
    return ws.bookmarks.some((b) => b.contentId === id);
  }
  async function toggleBookmark(c: Content) {
    await mutate(
      `/bookmarks/${encodeURIComponent(c.id)}`,
      isSaved(c.id) ? "DELETE" : "PUT",
      { boardId: board === "all" || board === "none" ? null : board, note: "" },
      isSaved(c.id)
        ? "보드에서 저장을 해제했습니다."
        : "내 보드에 저장했습니다.",
    );
  }
  const contents = useMemo(
    () =>
      ws.content
        .filter((c) => {
          const b = ws.bookmarks.find((b) => b.contentId === c.id);
          return (
            (page !== "bookmarks" ||
              (!!b &&
                (board === "all" ||
                  (board === "none"
                    ? b.boardId === null
                    : b.boardId === board)))) &&
            (kind === "all" || c.kind === kind) &&
            (account === "all" || c.author === account) &&
            (!query ||
              [c.caption, c.author, c.authorName, b?.note || ""]
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (days === "all" ||
              Date.now() - Date.parse(c.publishedAt) <=
                Number(days) * 86400000) &&
            (!minLikes || (c.likes !== null && c.likes >= Number(minLikes)))
          );
        })
        .sort((a, b) =>
          sort === "likes"
            ? (b.likes ?? -1) - (a.likes ?? -1)
            : sort === "comments"
              ? (b.comments ?? -1) - (a.comments ?? -1)
              : Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
        ),
    [ws, page, board, kind, account, query, days, minLikes, sort],
  );
  const hub = useMemo(
    () =>
      ws.sources
        .filter(
          (s) =>
            s.kind === (page === "brands" ? "brand" : "creator") &&
            (!favorites || ws.favorites.includes(s.id)) &&
            [s.username, s.label, s.profile?.name || ""]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "followers"
            ? (b.profile?.followers ?? -1) - (a.profile?.followers ?? -1)
            : b.contentIds.length - a.contentIds.length,
        ),
    [ws, page, favorites, query, sort],
  );
  const filterCount = [
    kind !== "all",
    days !== "all",
    minLikes !== "",
    account !== "all",
  ].filter(Boolean).length;
  const currentBoard = ws.boards.find((b) => b.id === board);
  return (
    <div className="app-shell">
      {sidebar && (
        <button
          className="sidebar-scrim"
          aria-label="메뉴 닫기"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={"sidebar " + (sidebar ? "open" : "")}>
        <a
          className="logo"
          href={"?" + new URLSearchParams({ page: "discover", workspace: workspaceId })}
          onClick={(e) => {
            e.preventDefault();
            go("discover");
          }}
        >
          <span className="logo-mark">
            <Sparkles size={21} />
          </span>
          <span className="logo-wordmark">
            <strong>Aialy</strong>
            <small>Contents Watcher</small>
          </span>
        </a>
        <button className="workspace" aria-label="워크스페이스 전환" onClick={() => setWorkspacePicker(true)}>
          <span className="workspace-avatar">{(spaces.find((space) => space.id === workspaceId)?.name || "A").slice(0, 1)}</span>
          <div>
            <strong>{spaces.find((space) => space.id === workspaceId)?.name || "워크스페이스"}</strong>
            <small>조사 공간 전환 · 추가</small>
          </div>
          <ChevronDown size={15} />
        </button>
        <nav>
          {nav.map((n, i) => (
            <React.Fragment key={n.id}>
              {(i === 0 || nav[i - 1].group !== n.group) && (
                <p className="nav-label">{n.group}</p>
              )}
              <button
                key={n.id}
                className={page === n.id ? "nav-item active" : "nav-item"}
                onClick={() => {
                  go(n.id);
                  setBoard("all");
                }}
              >
                <n.icon size={19} />
                {n.name}
                {n.id === "bookmarks" && (
                  <span className="nav-count">{ws.bookmarks.length}</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="board-label">
          <p className="nav-label">MY BOARDS</p>
          <button
            className="icon-btn"
            aria-label="보드 만들기"
            onClick={() => setModal({ kind: "board" })}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="sidebar-boards">
          {ws.boards.map((b) => (
            <button
              key={b.id}
              className={
                "board-nav " +
                (page === "bookmarks" && board === b.id ? "selected" : "")
              }
              onClick={() => {
                go("bookmarks");
                setBoard(b.id);
              }}
            >
              <span className="board-dot" />
              {b.name}
              <small>
                {ws.bookmarks.filter((x) => x.boardId === b.id).length}
              </small>
            </button>
          ))}
          {!ws.boards.length && (
            <button
              className="create-board"
              onClick={() => setModal({ kind: "board" })}
            >
              <Plus size={15} />첫 보드 만들기
            </button>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="connection-hint">
            <span
              className={"status-dot " + (ws.connection.connected ? "on" : "")}
            />
            <strong>
              {ws.connection.connected
                ? "Instagram 연결됨"
                : "첫 번째 소스를 연결하세요"}
            </strong>
            <p>
              {ws.connection.connected
                ? "좋은 콘텐츠를 꾸준히 모아보세요."
                : "브랜드와 크리에이터의 새로운 순간을 한곳에 모아보세요."}
            </p>
            <button onClick={() => go("sources")}>
              {ws.connection.connected ? "수집 관리하기" : "소스 연결하기"}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className={"nav-item " + (page === "sources" ? "active" : "")}
            onClick={() => go("sources")}
          >
            <Link2 size={18} />
            소스 연결{!ws.connection.connected && <span className="tiny-dot" />}
          </button>
          <button
            className="nav-item"
            onClick={() => setModal({ kind: "guide" })}
          >
            <CircleHelp size={18} />
            사용 가이드
          </button>
          <div className="account">
            <span>A</span>
            <div>
              <strong>개인 워크스페이스</strong>
              <small>Local workspace</small>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-btn mobile-menu"
              aria-label="메뉴 열기"
              onClick={() => setSidebar(true)}
            >
              <Menu size={19} />
            </button>
            <span>{spaces.find((space) => space.id === workspaceId)?.name || "워크스페이스"}</span>
            <ChevronRight size={13} />
            <strong>{titles[page]}</strong>
          </div>
          <div className="top-actions">
            <span className="local-badge">
              <span />
              LOCAL
            </span>
            <button
              className="icon-btn"
              aria-label="사용 가이드"
              onClick={() => setModal({ kind: "guide" })}
            >
              <CircleHelp size={19} />
            </button>
            <div className="profile-dot">A</div>
          </div>
        </header>
        <main>
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} />
              {error}
              <button onClick={() => void refresh()}>다시 시도</button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "sources"
                  ? "YOUR CONNECTIONS"
                  : page === "bookmarks"
                    ? "YOUR INSPIRATION, ORGANIZED"
                    : "DISCOVER YOUR NEXT MOMENT"}
                <span />
              </div>
              <h1>
                {page === "bookmarks" && currentBoard
                  ? currentBoard.name
                  : titles[page]}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {page === "discover"
                  ? "흩어진 콘텐츠를 모아, 다음 아이디어를 발견하세요."
                  : page === "brands"
                    ? "눈여겨보는 브랜드의 콘텐츠와 움직임을 한눈에."
                    : page === "creators"
                      ? "우리 브랜드와 닿아 있는 크리에이터를 찾아보세요."
                      : page === "bookmarks"
                        ? "다시 꺼내 보고 싶은 순간, 보드에 차곡차곡."
                        : page === "sources"
                          ? "Instagram에서 직접 수집하고, 새로운 콘텐츠를 꾸준히 만나세요."
                          : "탐색한 콘텐츠를 추적 조건과 분석으로 연결합니다."}
              </p>
            </div>
            <div className="heading-actions">
              {page === "sources" ? (
                <button
                  className="primary"
                  onClick={() => setModal({ kind: "source" })}
                >
                  <Plus size={17} />
                  계정 추가
                </button>
              ) : page === "bookmarks" ? (
                <>
                  <button
                    className="secondary"
                    onClick={() => setModal({ kind: "board" })}
                  >
                    <Plus size={16} />새 보드
                  </button>
                  {currentBoard && (
                    <>
                      <button
                        className="icon-btn bordered"
                        aria-label="보드 이름 변경"
                        onClick={() =>
                          setModal({ kind: "board", board: currentBoard })
                        }
                      >
                        <PenLine size={17} />
                      </button>
                      <button
                        className="icon-btn bordered"
                        aria-label="보드 삭제"
                        onClick={() =>
                          setModal({ kind: "deleteBoard", board: currentBoard })
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button className="secondary" onClick={() => go("sources")}>
                  <Link2 size={16} />
                  수집 소스 관리
                  <ArrowUpRight size={15} />
                </button>
              )}
            </div>
          </div>
          {!["discover", "brands", "creators", "bookmarks", "sources"].includes(
            page,
          ) ? (
            <Research
              key={page}
              initialQuery={query}
              onNewSearch={(term) => {
                setPage("social");
                setQuery(term);
                setSidebar(false);
              }}
              page={page as ResearchPage}
              ws={ws}
              open={(content) => setModal({ kind: "detail", content })}
              save={toggleBookmark}
              addSource={() => setModal({ kind: "source" })}
            />
          ) : page === "sources" ? (
            <Sources
              ws={ws}
              busy={busy}
              connect={() => setModal({ kind: "connection" })}
              add={() => setModal({ kind: "source" })}
              remove={(source) => setModal({ kind: "deleteSource", source })}
              collect={collect}
              mutate={mutate}
            />
          ) : (
            <>
              {page === "discover" && (
                <div className="discovery-banner">
                  <div className="banner-icon">
                    <Sparkles size={25} />
                  </div>
                  <div>
                    <strong>
                      수집한 콘텐츠에서 브랜드와 크리에이터를 발견하세요.
                    </strong>
                    <p>
                      등록 계정에서 수집한 게시물을 검색합니다. 새로운 계정을
                      찾는 키워드 발견 수집은 아직 연결되지 않았습니다.
                    </p>
                  </div>
                  <button onClick={() => go("sources")}>
                    관심 계정 연결
                    <ArrowRight size={17} />
                  </button>
                  <span className="banner-orbit" />
                </div>
              )}
              <div className="search-row">
                <div className="searchbox">
                  <Search size={20} />
                  <input
                    aria-label="콘텐츠 검색"
                    placeholder={
                      page === "brands"
                        ? "브랜드 이름 또는 계정으로 검색"
                        : page === "creators"
                          ? "크리에이터 이름 또는 계정으로 검색"
                          : "키워드, 계정, 저장한 메모로 검색해 보세요"
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query ? (
                    <button
                      className="icon-btn"
                      aria-label="검색어 지우기"
                      onClick={() => setQuery("")}
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <kbd>검색</kbd>
                  )}
                </div>
                <button
                  className={
                    "secondary filter-btn " + (filters ? "pressed" : "")
                  }
                  onClick={() => setFilters(!filters)}
                  aria-expanded={filters}
                >
                  <SlidersHorizontal size={17} />
                  필터
                  {filterCount > 0 && (
                    <span className="filter-count">{filterCount}</span>
                  )}
                </button>
              </div>
              {page === "brands" || page === "creators" ? (
                <>
                  <div className="list-toolbar">
                    <div className="tabs">
                      <button
                        className={!favorites ? "selected" : ""}
                        onClick={() => setFavorites(false)}
                      >
                        전체 계정{" "}
                        <span>
                          {
                            ws.sources.filter(
                              (s) =>
                                s.kind ===
                                (page === "brands" ? "brand" : "creator"),
                            ).length
                          }
                        </span>
                      </button>
                      <button
                        className={favorites ? "selected" : ""}
                        onClick={() => setFavorites(true)}
                      >
                        <Star size={14} />
                        즐겨찾기
                      </button>
                    </div>
                    <label className="sort">
                      <ArrowDownUp size={14} />
                      <select
                        aria-label="허브 정렬"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="recent">수집 게시물 많은 순</option>
                        <option value="followers">팔로워 많은 순</option>
                      </select>
                    </label>
                  </div>
                  {filters && (
                    <div className="filter-panel">
                      <p>
                        계정 이름으로 검색하고, 즐겨찾기 또는 팔로워 수로 정렬할
                        수 있습니다. 지표는 마지막 수집 시점 기준입니다.
                      </p>
                    </div>
                  )}
                  {hub.length ? (
                    <div className="hub-table">
                      <div className="hub-table-header">
                        <span>#</span>
                        <span>
                          {page === "brands" ? "브랜드" : "크리에이터"}
                        </span>
                        <span>팔로워</span>
                        <span>수집 게시물</span>
                        <span>마지막 업데이트</span>
                        <span />
                      </div>
                      {hub.map((s, i) => (
                        <div className="hub-row" key={s.id}>
                          <span className="rank">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <button
                            className="hub-identity"
                            onClick={() =>
                              setModal({ kind: "profile", source: s })
                            }
                          >
                            <Avatar
                              image={s.profile?.avatar}
                              name={s.label || s.username}
                            />
                            <div>
                              <strong>
                                {s.label || s.profile?.name || s.username}
                              </strong>
                              <small>
                                <Instagram size={12} />@{s.username}
                              </small>
                            </div>
                          </button>
                          <strong>
                            {number(s.profile?.followers ?? null)}
                          </strong>
                          <span>
                            {s.contentIds.length}
                            <small>개</small>
                          </span>
                          <span className="muted">{date(s.lastSuccess)}</span>
                          <button
                            className={
                              "icon-btn " +
                              (ws.favorites.includes(s.id) ? "favorited" : "")
                            }
                            aria-label={`${s.username} 즐겨찾기`}
                            aria-pressed={ws.favorites.includes(s.id)}
                            onClick={() =>
                              void mutate(`/favorites/${s.id}`, "PUT", {
                                on: !ws.favorites.includes(s.id),
                              })
                            }
                          >
                            <Star size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon="accounts"
                      title={
                        query || favorites
                          ? "조건에 맞는 계정이 없어요"
                          : "눈여겨볼 계정을 추가해 보세요"
                      }
                      description="브랜드와 크리에이터를 직접 등록하면, 수집한 게시물과 계정 지표를 한곳에서 볼 수 있어요."
                      action="계정 추가하기"
                      onClick={() => setModal({ kind: "source" })}
                    />
                  )}
                </>
              ) : (
                <>
                  {filters && (
                    <div className="filter-panel">
                      <label>
                        게시 기간
                        <select
                          value={days}
                          onChange={(e) => setDays(e.target.value)}
                        >
                          <option value="all">전체 기간</option>
                          <option value="7">최근 7일</option>
                          <option value="30">최근 30일</option>
                          <option value="90">최근 90일</option>
                        </select>
                      </label>
                      <label>
                        계정
                        <select
                          value={account}
                          onChange={(e) => setAccount(e.target.value)}
                        >
                          <option value="all">전체 계정</option>
                          {[...new Set(ws.content.map((c) => c.author))].map(
                            (a) => (
                              <option key={a} value={a}>
                                @{a}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <label>
                        좋아요 최소
                        <input
                          aria-label="좋아요 최소"
                          type="number"
                          min="0"
                          value={minLikes}
                          onChange={(e) => setMinLikes(e.target.value)}
                          placeholder="제한 없음"
                        />
                      </label>
                      <button
                        className="text-btn"
                        onClick={() => {
                          setDays("all");
                          setAccount("all");
                          setMinLikes("");
                          setKind("all");
                        }}
                      >
                        초기화
                      </button>
                    </div>
                  )}
                  {page === "bookmarks" && (
                    <div className="board-tabs">
                      <button
                        className={board === "all" ? "selected" : ""}
                        onClick={() => setBoard("all")}
                      >
                        모든 저장 <span>{ws.bookmarks.length}</span>
                      </button>
                      <button
                        className={board === "none" ? "selected" : ""}
                        onClick={() => setBoard("none")}
                      >
                        미분류
                      </button>
                      {ws.boards.map((b) => (
                        <button
                          key={b.id}
                          className={board === b.id ? "selected" : ""}
                          onClick={() => setBoard(b.id)}
                        >
                          <Folder size={14} />
                          {b.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="list-toolbar">
                    <div className="tabs">
                      {[
                        ["all", "전체", Layers],
                        ["image", "이미지", ImageIcon],
                        ["video", "동영상", Play],
                        ["carousel", "캐러셀", Layers],
                      ].map(([id, label, Icon]) => (
                        <button
                          key={id as string}
                          className={kind === id ? "selected" : ""}
                          onClick={() => setKind(id as string)}
                        >
                          {React.createElement(Icon as typeof Layers, {
                            size: 15,
                          })}
                          {label as string}
                          {id === "all" && <span>{contents.length}</span>}
                        </button>
                      ))}
                    </div>
                    <div className="list-actions">
                      {page === "discover" && (
                        <button
                          className="text-btn"
                          onClick={() => {
                            setPage("social");
                            setSidebar(false);
                          }}
                        >
                          이 키워드로 Research
                          <ArrowRight size={14} />
                        </button>
                      )}
                      <label className="sort">
                        <ArrowDownUp size={14} />
                        <select
                          aria-label="콘텐츠 정렬"
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                        >
                          <option value="recent">최신 게시순</option>
                          <option value="likes">좋아요 많은 순</option>
                          <option value="comments">댓글 많은 순</option>
                        </select>
                      </label>
                      <button
                        className="icon-btn"
                        aria-label="검색 결과 CSV 다운로드"
                        disabled={!contents.length}
                        onClick={() => exportCsv(contents)}
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="results-meta">
                    <span>
                      {query ? (
                        <>
                          <strong>“{query}”</strong> 검색 결과 ·{" "}
                        </>
                      ) : null}
                      <strong>{contents.length}</strong>개의 콘텐츠
                    </span>
                    <span>
                      <span className="status-dot on" />
                      Instagram 직접 수집 · 저장된 게시물 기준
                    </span>
                  </div>
                  {loading ? (
                    <div className="loading">
                      <Loader2 className="spin" />
                      워크스페이스를 불러오는 중
                    </div>
                  ) : contents.length ? (
                    <>
                      <div className="content-grid">
                        {contents.slice(0, limit).map((c) => (
                          <ContentCard
                            key={c.id}
                            content={c}
                            saved={isSaved(c.id)}
                            selected={selected.includes(c.id)}
                            onSelect={() =>
                              setSelected((ids) =>
                                ids.includes(c.id)
                                  ? ids.filter((i) => i !== c.id)
                                  : ids.length < 4
                                    ? [...ids, c.id]
                                    : ids,
                              )
                            }
                            onOpen={() =>
                              setModal({ kind: "detail", content: c })
                            }
                            onSave={() => void toggleBookmark(c)}
                          />
                        ))}
                      </div>
                      {limit < contents.length && (
                        <button
                          className="load-more secondary"
                          onClick={() => setLimit(limit + 24)}
                        >
                          더 보기 <ChevronDown size={16} />
                        </button>
                      )}
                    </>
                  ) : (
                    <Empty
                      icon={page === "bookmarks" ? "board" : "content"}
                      title={
                        ws.content.length
                          ? "아직 이곳에 모인 콘텐츠가 없어요"
                          : "첫 번째 발견을 기다리고 있어요"
                      }
                      description={
                        ws.content.length
                          ? "다른 검색 조건을 선택하거나, 마음에 드는 콘텐츠를 보드에 저장해 보세요."
                          : "Instagram을 연결하고 관심 계정을 등록하세요. 직접 수집한 콘텐츠가 이곳에 차곡차곡 모입니다."
                      }
                      action={
                        ws.content.length
                          ? "전체 콘텐츠 보기"
                          : "Instagram 연결하기"
                      }
                      onClick={() => {
                        if (ws.content.length) {
                          go("discover");
                        } else {
                          go("sources");
                          if (!ws.connection.connected)
                            setModal({ kind: "connection" });
                        }
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
          <footer>
            <span>Aialy Contents Watcher</span>
            <span>매일의 발견이, 내일의 아이디어로.</span>
            <span>Instagram 원천 연결 · 개인 워크스페이스</span>
          </footer>
        </main>
      </div>
      {selected.length > 0 && (
        <div className="selection-bar">
          <strong>{selected.length}개 선택</strong>
          <span>최대 4개까지 비교할 수 있어요</span>
          <button
            className="primary"
            disabled={selected.length < 2}
            onClick={() => setModal({ kind: "compare" })}
          >
            <BarChart3 size={16} />
            비교하기
          </button>
          <button
            className="icon-btn"
            aria-label="선택 해제"
            onClick={() => setSelected([])}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            className="icon-btn"
            aria-label="알림 닫기"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {workspacePicker && <WorkspacePicker spaces={spaces} current={workspaceId} close={() => setWorkspacePicker(false)} />}
      {modal && (
        <ModalView
          key={modal.kind === "detail" ? modal.content.id : modal.kind}
          modal={modal}
          close={() => setModal(null)}
          ws={ws}
          mutate={mutate}
          refresh={refresh}
          notify={setToast}
          selected={ws.content.filter((c) => selected.includes(c.id))}
          explore={(author) => {
            go("discover");
            setAccount(author);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
function Avatar({ image, name }: { image?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="avatar">
      {image && !failed ? (
        <img
          src={image}
          alt=""
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
function Media({ content }: { content: Content }) {
  const [failed, setFailed] = useState(false);
  return content.thumbnail && !failed ? (
    <img
      className="media-image"
      src={content.thumbnail}
      alt={content.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="media-fallback">
      <Instagram size={36} />
      <span>
        {content.thumbnail
          ? "미리보기 기간이 만료되었어요"
          : "미리보기가 제공되지 않아요"}
      </span>
      <small>상세에서 원문을 열어보세요</small>
    </div>
  );
}
function ContentCard({
  content: c,
  saved,
  selected,
  onSelect,
  onOpen,
  onSave,
}: {
  content: Content;
  saved: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onSave: () => void;
}) {
  return (
    <article className={"content-card " + (selected ? "is-selected" : "")}>
      <div className="card-media">
        <button
          className="media-open"
          aria-label={`${c.author} 콘텐츠 상세 보기`}
          onClick={onOpen}
        >
          <Media content={c} />
        </button>
        <div className="card-type">
          {c.kind === "video" ? (
            <Play size={12} />
          ) : c.kind === "carousel" ? (
            <Layers size={12} />
          ) : (
            <ImageIcon size={12} />
          )}
          {c.kind === "video"
            ? "동영상"
            : c.kind === "carousel"
              ? "캐러셀"
              : "이미지"}
        </div>
        <label className="select-card">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            aria-label={`${c.author} 콘텐츠 비교 선택`}
          />
          <span>{selected && <Check size={13} />}</span>
        </label>
        <span className="platform-icon">
          <Instagram size={15} />
        </span>
      </div>
      <div className="card-body">
        <div className="card-author">
          <Avatar image={c.avatar} name={c.author} />
          <div>
            <strong>{c.authorName}</strong>
            <small>@{c.author}</small>
          </div>
          <button
            className={"icon-btn bookmark-btn " + (saved ? "saved" : "")}
            aria-label={saved ? "북마크 해제" : "북마크 저장"}
            aria-pressed={saved}
            onClick={onSave}
          >
            <Bookmark size={19} />
          </button>
        </div>
        <button className="card-caption" onClick={onOpen}>
          {c.caption || c.title}
        </button>
        <div className="card-stats">
          <span>
            <Heart size={13} />
            {number(c.likes)}
          </span>
          <span>
            <MessageCircle size={13} />
            {number(c.comments)}
          </span>
          <time>
            {new Date(c.publishedAt).toLocaleDateString("ko-KR", {
              month: "numeric",
              day: "numeric",
            })}
          </time>
        </div>
      </div>
    </article>
  );
}
function Empty({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-art">
        <div className="art-card back" />
        <div className="art-card front">
          <span className="art-image">
            {icon === "accounts" ? (
              <Users size={28} />
            ) : icon === "board" ? (
              <Bookmark size={28} />
            ) : (
              <Sparkles size={28} />
            )}
          </span>
          <i />
          <i />
        </div>
        <span className="art-spark">
          <Plus size={19} />
        </span>
        <span className="art-dot" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="primary" onClick={onClick}>
        {action}
        <ArrowRight size={16} />
      </button>
      {icon === "content" && (
        <div className="onboarding-steps">
          <span>
            <b>01</b> 소스 연결
          </span>
          <ChevronRight size={13} />
          <span>
            <b>02</b> 관심 계정 등록
          </span>
          <ChevronRight size={13} />
          <span>
            <b>03</b> 콘텐츠 발견
          </span>
        </div>
      )}
    </div>
  );
}
function Sources({
  ws,
  busy,
  connect,
  add,
  remove,
  collect,
  mutate,
}: {
  ws: Workspace;
  busy: string[];
  connect: () => void;
  add: () => void;
  remove: (s: Source) => void;
  collect: (s: Source) => Promise<void>;
  mutate: (
    path: string,
    method: string,
    body: unknown,
    message?: string,
  ) => Promise<boolean>;
}) {
  return (
    <div className="sources-view">
      <section className="connection-card">
        <div className="instagram-mark">
          <Instagram size={30} />
        </div>
        <div>
          <div className="connection-title">
            <h2>Instagram</h2>
            <span className={"pill " + (ws.connection.connected ? "mint" : "")}>
              {ws.connection.connected ? "연결됨" : "연결 필요"}
            </span>
          </div>
          <p>
            {ws.connection.connected
              ? `@${ws.connection.username} · ${ws.connection.version} · 연결 확인 ${date(ws.connection.verifiedAt || null)}`
              : "브랜드·크리에이터의 공개 프로페셔널 계정과 연결합니다."}
          </p>
          <small>Facebook Login · Business Discovery</small>
        </div>
        <button
          className={ws.connection.connected ? "secondary" : "primary"}
          onClick={connect}
        >
          {ws.connection.connected ? "연결 설정" : "Instagram 연결"}
          <ArrowUpRight size={16} />
        </button>
      </section>
      <div className="source-notice">
        <CircleHelp size={17} />
        <p>
          등록한 계정의 최근 최대 100개 게시물과 공개 지표를 갱신합니다. 자동
          수집은 계정별로 켤 수 있으며, 이 앱의 서버가 실행 중일 때 동작합니다.
          다른 계정의 조회·도달 수는 제공되지 않습니다.
        </p>
      </div>
      <div className="section-title">
        <h2>
          관심 계정 <span>{ws.sources.length}</span>
        </h2>
        <button className="text-btn" onClick={add}>
          <Plus size={16} />
          계정 추가
        </button>
      </div>
      {ws.sources.length ? (
        <div className="source-list">
          {ws.sources.map((s) => (
            <div className="source-row" key={s.id}>
              <div className="source-main">
                <Avatar
                  image={s.profile?.avatar}
                  name={s.label || s.username}
                />
                <div>
                  <strong>{s.label || s.profile?.name || s.username}</strong>
                  <small>
                    @{s.username}{" "}
                    <span>
                      ·{" "}
                      {s.kind === "owned"
                        ? "자사 계정"
                        : s.kind === "brand"
                          ? "브랜드"
                          : "크리에이터"}
                    </span>
                  </small>
                </div>
                <span
                  className={
                    "pill " +
                    (s.lastError ? "red" : s.lastSuccess ? "mint" : "")
                  }
                >
                  {busy.includes(s.id) || ws.running.includes(s.id)
                    ? "수집 중"
                    : s.lastError
                      ? "확인 필요"
                      : s.lastSuccess
                        ? "수집 완료"
                        : "첫 수집 전"}
                </span>
              </div>
              <div className="source-meta">
                <span>{s.contentIds.length}개 게시물</span>
                <small>최근 성공 {date(s.lastSuccess)}</small>
                {s.enabled && <small>다음 예정 {date(s.nextRun)}</small>}
                {s.lastError && <p className="inline-error">{s.lastError}</p>}
              </div>
              <div className="source-controls">
                <label className="interval-label">
                  <select
                    aria-label={`${s.username} 갱신 주기`}
                    value={s.intervalHours}
                    onChange={(e) =>
                      void mutate(`/sources/${s.id}`, "PATCH", {
                        enabled: s.enabled,
                        intervalHours: Number(e.target.value),
                      })
                    }
                  >
                    {[1, 6, 12, 24, 48, 168].map((h) => (
                      <option key={h} value={h}>
                        {h}시간마다
                      </option>
                    ))}
                  </select>
                </label>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    disabled={!ws.connection.connected}
                    onChange={(e) =>
                      void mutate(
                        `/sources/${s.id}`,
                        "PATCH",
                        {
                          enabled: e.target.checked,
                          intervalHours: s.intervalHours,
                        },
                        e.target.checked
                          ? "자동 수집을 켰습니다."
                          : "자동 수집을 껐습니다.",
                      )
                    }
                  />
                  <span className="toggle" />
                  자동 갱신
                </label>
                <button
                  className="secondary"
                  disabled={
                    !ws.connection.connected ||
                    busy.includes(s.id) ||
                    ws.running.includes(s.id)
                  }
                  onClick={() => void collect(s)}
                >
                  <RefreshCw
                    size={15}
                    className={busy.includes(s.id) ? "spin" : ""}
                  />
                  지금 수집
                </button>
                <button
                  className="icon-btn"
                  aria-label={`${s.username} 수집 대상 삭제`}
                  disabled={busy.includes(s.id) || ws.running.includes(s.id)}
                  onClick={() => remove(s)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon="accounts"
          title="어떤 계정이 궁금한가요?"
          description="분석할 브랜드나 크리에이터의 Instagram 사용자 이름을 등록하세요. 계정 추가만으로는 자동 수집이 시작되지 않습니다."
          action="첫 계정 추가하기"
          onClick={add}
        />
      )}
      <div className="section-title">
        <h2>수집 기록</h2>
        <span className="muted">최근 50회</span>
      </div>
      <div className="run-list">
        {ws.runs.length ? (
          ws.runs.map((r) => (
            <div className="run-row" key={r.id}>
              {r.status === "success" ? (
                <CheckCircle2 size={18} className="green" />
              ) : r.status === "running" ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <AlertCircle size={18} className="error-text" />
              )}
              <div>
                <strong>@{r.username || "삭제된 계정"}</strong>
                <p>
                  {r.status === "success"
                    ? `${r.count}개 갱신${r.has_more ? " · 추가 게시물 있음" : ""}`
                    : r.status === "running"
                      ? "수집 중"
                      : r.message}
                </p>
              </div>
              <time>{date(r.started_at)}</time>
            </div>
          ))
        ) : (
          <p className="no-runs">
            아직 수집 기록이 없습니다. 계정을 등록하고 ‘지금 수집’을 눌러보세요.
          </p>
        )}
      </div>
    </div>
  );
}
function ModalView({
  modal,
  close,
  ws,
  mutate,
  refresh,
  notify,
  selected,
  explore,
}: {
  modal: NonNullable<Modal>;
  close: () => void;
  ws: Workspace;
  mutate: (p: string, m: string, b: unknown, msg?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  notify: (m: string) => void;
  selected: Content[];
  explore: (author: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(
      modal.kind === "board" ? modal.board?.name || "" : "",
    ),
    [username, setUsername] = useState(""),
    [type, setType] = useState<"brand" | "creator" | "owned">("brand"),
    [token, setToken] = useState(""),
    [accountId, setAccountId] = useState(""),
    [version, setVersion] = useState(ws.connection.version || "v26.0"),
    [working, setWorking] = useState(false),
    [formError, setFormError] = useState("");
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    ref.current?.showModal();
    const handler = (e: Event) => {
      e.preventDefault();
      close();
    };
    ref.current?.addEventListener("cancel", handler);
    return () => {
      prev?.focus();
    };
  }, []);
  const title =
    modal.kind === "connection"
      ? "Instagram 연결"
      : modal.kind === "source"
        ? "관심 계정 추가"
        : modal.kind === "board"
          ? modal.board
            ? "보드 이름 변경"
            : "새 보드 만들기"
          : modal.kind === "deleteSource"
            ? "수집 대상을 삭제할까요?"
            : modal.kind === "deleteBoard"
              ? "보드를 삭제할까요?"
              : modal.kind === "guide"
                ? "Aialy Contents Watcher 사용 가이드"
                : modal.kind === "compare"
                  ? "콘텐츠 비교"
                  : modal.kind === "profile"
                    ? "계정 인사이트"
                    : "콘텐츠 상세";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setWorking(true);
    try {
      if (modal.kind === "connection") {
        await api("/connection", "POST", { token, accountId, version });
        setToken("");
        notify("Instagram 연결을 확인했습니다.");
      } else if (modal.kind === "source") {
        await api("/sources", "POST", {
          username,
          label: name,
          kind: type,
          intervalHours: 6,
        });
        notify("계정을 등록했습니다. ‘지금 수집’으로 첫 콘텐츠를 가져오세요.");
      } else if (modal.kind === "board") {
        await api(
          modal.board ? `/boards/${modal.board.id}` : "/boards",
          modal.board ? "PATCH" : "POST",
          { name },
        );
        notify("보드를 저장했습니다.");
      } else if (modal.kind === "deleteSource") {
        await api(`/sources/${modal.source.id}`, "DELETE", {});
        notify("수집 대상을 삭제했습니다. 기존 콘텐츠와 북마크는 유지됩니다.");
      } else if (modal.kind === "deleteBoard") {
        await api(`/boards/${modal.board.id}`, "DELETE", {});
        notify("보드를 삭제했습니다. 북마크는 미분류에 남아 있습니다.");
      }
      await refresh();
      close();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  return (
    <dialog
      className={
        "modal " +
        (["detail", "compare", "profile"].includes(modal.kind) ? "wide" : "")
      }
      ref={ref}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-header">
        <div>
          <span className="eyebrow">CATCH THE MOMENT</span>
          <h2 id="modal-title">{title}</h2>
        </div>
        <button className="icon-btn" aria-label="닫기" onClick={close}>
          <X size={21} />
        </button>
      </div>
      {modal.kind === "detail" ? (
        <Detail
          content={modal.content}
          ws={ws}
          mutate={mutate}
          explore={explore}
        />
      ) : modal.kind === "profile" ? (
        <div className="profile-modal">
          <div className="profile-header">
            <Avatar
              image={modal.source.profile?.avatar}
              name={modal.source.username}
            />
            <div>
              <h2>
                {modal.source.label ||
                  modal.source.profile?.name ||
                  modal.source.username}
              </h2>
              <p>@{modal.source.username}</p>
            </div>
            <a
              className="secondary"
              href={`https://www.instagram.com/${encodeURIComponent(modal.source.username)}/`}
              target="_blank"
              rel="noreferrer"
            >
              Instagram
              <ExternalLink size={15} />
            </a>
          </div>
          <p>
            {modal.source.profile?.biography ||
              "수집을 완료하면 계정 소개와 공개 지표를 확인할 수 있습니다."}
          </p>
          <div className="metric-grid">
            <div>
              <small>팔로워</small>
              <strong>{number(modal.source.profile?.followers ?? null)}</strong>
            </div>
            <div>
              <small>전체 게시물 (API)</small>
              <strong>
                {number(modal.source.profile?.mediaCount ?? null)}
              </strong>
            </div>
            <div>
              <small>우리 앱에 수집됨</small>
              <strong>{modal.source.contentIds.length}</strong>
            </div>
          </div>
          <p className="muted">
            마지막 성공 {date(modal.source.lastSuccess)} · 팔로워 수는 수집
            시점의 값입니다.
          </p>
          <button
            className="primary"
            onClick={() => explore(modal.source.username)}
          >
            이 계정의 콘텐츠 탐색
            <ArrowRight size={16} />
          </button>
        </div>
      ) : modal.kind === "compare" ? (
        <div className="compare-grid">
          {selected.map((c) => (
            <div className="compare-column" key={c.id}>
              <div className="compare-media">
                <Media content={c} />
              </div>
              <h3>@{c.author}</h3>
              <p>{c.title}</p>
              <dl>
                <dt>좋아요</dt>
                <dd>{number(c.likes)}</dd>
                <dt>댓글</dt>
                <dd>{number(c.comments)}</dd>
                <dt>조회수</dt>
                <dd>미제공</dd>
                <dt>게시일</dt>
                <dd>{date(c.publishedAt)}</dd>
                <dt>수집일</dt>
                <dd>{date(c.collectedAt)}</dd>
              </dl>
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-btn"
              >
                원문 보기
                <ArrowUpRight size={14} />
              </a>
            </div>
          ))}
        </div>
      ) : modal.kind === "guide" ? (
        <div className="guide">
          <p>
            Aialy Contents Watcher는 Instagram에서 직접 수집한 콘텐츠를
            탐색하고, 브랜드와 크리에이터를 관리하는 개인 워크스페이스입니다.
          </p>
          <ol>
            <li>
              <strong>소스를 연결하세요.</strong>
              <p>
                Meta 개발자 앱에서 Facebook Login 경로의 Instagram 권한을
                설정하고 액세스 토큰과 연결된 Instagram 계정 ID를 입력합니다.
              </p>
            </li>
            <li>
              <strong>관심 계정을 등록하세요.</strong>
              <p>
                공개 비즈니스·크리에이터 계정의 사용자 이름을 추가하고 ‘지금
                수집’을 누릅니다. 최근 최대 100개 게시물을 갱신하며, 더 오래된
                전체 이력은 수집 범위 밖입니다.
              </p>
            </li>
            <li>
              <strong>발견하고 정리하세요.</strong>
              <p>
                키워드·유형·기간으로 검색하고, 북마크에 보드와 메모를 남기세요.
                콘텐츠를 최대 4개 선택해 비교할 수 있습니다.
              </p>
            </li>
            <li>
              <strong>필요한 계정만 자동 갱신하세요.</strong>
              <p>
                계정별 자동 갱신을 켜면 서버가 켜져 있는 동안 정해진 주기로
                업데이트합니다. 토큰 만료나 API 제한은 수집 기록에 표시됩니다.
              </p>
            </li>
          </ol>
          <div className="source-notice">
            <CircleHelp size={17} />
            <p>
              일반 개인 계정, 비공개 콘텐츠, 다른 계정의 조회·도달 수는 이
              연결에서 제공되지 않습니다. 수집되지 않은 게시물의 존재나 삭제
              여부를 추정하지 않습니다.
            </p>
          </div>
        </div>
      ) : (
        <form className="modal-form" onSubmit={(e) => void submit(e)}>
          {modal.kind === "connection" ? (
            <>
              {ws.connection.connected && (
                <div className="connected-summary">
                  <CheckCircle2 size={19} />@{ws.connection.username} 연결됨
                  <button
                    type="button"
                    className="text-btn"
                    onClick={async () => {
                      if (
                        await mutate(
                          "/connection",
                          "DELETE",
                          {},
                          "연결을 해제했습니다. 저장된 콘텐츠는 유지됩니다.",
                        )
                      )
                        close();
                    }}
                  >
                    <Unplug size={15} />
                    연결 해제
                  </button>
                </div>
              )}
              <p className="form-description">
                Facebook 페이지에 연결된 Instagram 프로페셔널 계정으로
                인증합니다. 토큰은 이 컴퓨터의 서버에만 저장되며 다시 표시하지
                않습니다.
              </p>
              <div className="setup-steps">
                <span>
                  01{" "}
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Meta 앱 설정
                    <ArrowUpRight size={13} />
                  </a>
                </span>
                <span>
                  02{" "}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    읽기 권한 토큰 발급
                    <ArrowUpRight size={13} />
                  </a>
                </span>
                <span>03 연결 확인</span>
              </div>
              <label>
                Instagram 계정 ID
                <input
                  required
                  autoComplete="off"
                  inputMode="numeric"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="숫자로 된 연결 계정 ID"
                />
                <small>
                  사용자 이름이 아닌, Facebook 페이지에 연결된 Instagram 계정의
                  ID입니다.
                </small>
              </label>
              <label>
                액세스 토큰
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Meta에서 발급한 토큰을 입력하세요"
                />
              </label>
              <label>
                Graph API 버전
                <input
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v26.0"
                />
                <small>Meta 앱에서 사용하는 지원 버전을 입력하세요.</small>
              </label>
              <details>
                <summary>어떤 권한이 필요한가요?</summary>
                <p>
                  Business Discovery용 Facebook User Access Token에
                  instagram_basic, instagram_manage_insights,
                  pages_read_engagement 권한이 필요합니다. 페이지 목록 조회에는
                  pages_show_list를 사용합니다. 앱 접근 수준·페이지 역할에 따라
                  추가 요건이 있을 수 있습니다.
                </p>
                <p>
                  <a
                    href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Meta 공식 Business Discovery 안내 ↗
                  </a>
                </p>
              </details>
            </>
          ) : modal.kind === "source" ? (
            <>
              <p className="form-description">
                공개 비즈니스 또는 크리에이터 계정을 등록하세요. 계정 추가 후
                수집을 직접 시작할 수 있습니다.
              </p>
              <label>
                Instagram 사용자 이름
                <input
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  maxLength={31}
                />
              </label>
              <label>
                표시 이름 <span className="muted">선택</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="알아보기 쉬운 계정 이름"
                  maxLength={60}
                />
              </label>
              <fieldset>
                <legend>어느 허브에서 관리할까요?</legend>
                <div className="type-options">
                  <label className={type === "brand" ? "chosen" : ""}>
                    <input
                      type="radio"
                      name="source-type"
                      value="brand"
                      checked={type === "brand"}
                      onChange={() => setType("brand")}
                    />
                    <Building2 size={20} />
                    브랜드 허브
                  </label>
                  <label className={type === "creator" ? "chosen" : ""}>
                    <input
                      type="radio"
                      name="source-type"
                      value="creator"
                      checked={type === "creator"}
                      onChange={() => setType("creator")}
                    />
                    <Users size={20} />
                    크리에이터 허브
                  </label>
                  <label className={type === "owned" ? "chosen" : ""}>
                    <input
                      type="radio"
                      name="source-type"
                      value="owned"
                      checked={type === "owned"}
                      onChange={() => setType("owned")}
                    />
                    <BarChart3 size={20} />
                    자사 계정
                  </label>
                </div>
              </fieldset>
              <p className="muted">자동 갱신은 기본으로 꺼져 있습니다.</p>
            </>
          ) : modal.kind === "board" ? (
            <>
              <p className="form-description">
                프로젝트별로 콘텐츠를 모아 나만의 레퍼런스 보드를 만들어보세요.
              </p>
              <label>
                보드 이름
                <input
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 가을 캠페인 레퍼런스"
                  maxLength={60}
                />
              </label>
            </>
          ) : modal.kind === "deleteSource" ? (
            <p>
              <strong>@{modal.source.username}</strong> 계정의 수집과 자동
              갱신을 중단하고 목록에서 삭제합니다. 기존 콘텐츠, 북마크, 수집
              기록은 유지됩니다.
            </p>
          ) : (
            <p>
              <strong>{modal.board.name}</strong> 보드를 삭제합니다. 저장된
              콘텐츠와 메모는 ‘미분류’로 옮겨집니다.
            </p>
          )}
          {formError && (
            <p className="inline-error" role="alert">
              {formError}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>
              취소
            </button>
            <button
              className={
                ["deleteBoard", "deleteSource"].includes(modal.kind)
                  ? "danger"
                  : "primary"
              }
              disabled={working}
            >
              {working ? <Loader2 size={16} className="spin" /> : null}
              {modal.kind === "connection"
                ? "연결 확인 후 저장"
                : modal.kind === "source"
                  ? "계정 추가"
                  : modal.kind === "deleteSource"
                    ? "수집 대상 삭제"
                    : modal.kind === "deleteBoard"
                      ? "보드 삭제"
                      : "저장하기"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
function Detail({
  content: c,
  ws,
  mutate,
  explore,
}: {
  content: Content;
  ws: Workspace;
  mutate: (p: string, m: string, b: unknown, msg?: string) => Promise<boolean>;
  explore: (author: string) => void;
}) {
  const bookmark = ws.bookmarks.find((b) => b.contentId === c.id);
  const [boardId, setBoardId] = useState(bookmark?.boardId || ""),
    [note, setNote] = useState(bookmark?.note || ""),
    [working, setWorking] = useState(false),
    [mediaIndex, setMediaIndex] = useState(0),
    [historyData, setHistoryData] = useState<
      { at: string; likes: number | null; comments: number | null }[]
    >([]),
    [historyError, setHistoryError] = useState("");
  useEffect(() => {
    api<typeof historyData>(`/content/${encodeURIComponent(c.id)}/history`)
      .then(setHistoryData)
      .catch(() => setHistoryError("갱신 이력을 불러오지 못했습니다."));
  }, [c.id]);
  const child = c.children[mediaIndex];
  const video = child?.videoUrl || c.videoUrl;
  return (
    <div className="detail-layout">
      <div className="detail-media">
        {video ? (
          <video
            controls
            preload="none"
            poster={child?.thumbnail || c.thumbnail || undefined}
            src={video}
          >
            <a href={c.sourceUrl}>Instagram 원문 보기</a>
          </video>
        ) : child?.thumbnail ? (
          <img
            src={child.thumbnail}
            alt={`${c.title} ${mediaIndex + 1}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <Media content={c} />
        )}
        {c.children.length > 1 && (
          <div className="carousel-controls">
            <button
              className="icon-btn"
              aria-label="이전 이미지"
              disabled={mediaIndex === 0}
              onClick={() => setMediaIndex((i) => i - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {mediaIndex + 1} / {c.children.length}
            </span>
            <button
              className="icon-btn"
              aria-label="다음 이미지"
              disabled={mediaIndex === c.children.length - 1}
              onClick={() => setMediaIndex((i) => i + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        <a
          className="media-original"
          href={c.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Instagram 원문 열기
          <ExternalLink size={15} />
        </a>
      </div>
      <div className="detail-info">
        <button className="hub-identity" onClick={() => explore(c.author)}>
          <Avatar image={c.avatar} name={c.author} />
          <div>
            <strong>{c.authorName}</strong>
            <small>
              @{c.author}
              <ArrowUpRight size={12} />
            </small>
          </div>
        </button>
        <div className="detail-caption">
          {c.caption || "본문이 제공되지 않은 게시물입니다."}
        </div>
        <div className="metric-grid">
          <div>
            <small>좋아요</small>
            <strong>{number(c.likes)}</strong>
          </div>
          <div>
            <small>댓글</small>
            <strong>{number(c.comments)}</strong>
          </div>
          <div>
            <small>조회수</small>
            <strong className="unavailable">미제공</strong>
          </div>
        </div>
        <div className="provenance">
          <span>
            <Clock size={13} />
            게시 {date(c.publishedAt)}
          </span>
          <span>마지막 수집 {date(c.collectedAt)}</span>
        </div>
        <div className="detail-save">
          <h3>
            <Bookmark size={16} />
            나의 레퍼런스로 저장
          </h3>
          <label>
            보드
            <select
              aria-label="저장할 보드"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
            >
              <option value="">미분류</option>
              {ws.boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            메모
            <textarea
              aria-label="콘텐츠 메모"
              rows={3}
              maxLength={5000}
              placeholder="이 콘텐츠에서 발견한 인사이트를 남겨보세요."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="detail-save-actions">
            {bookmark && (
              <button
                className="text-btn"
                onClick={() =>
                  void mutate(
                    `/bookmarks/${encodeURIComponent(c.id)}`,
                    "DELETE",
                    {},
                    "저장을 해제했습니다.",
                  )
                }
              >
                저장 해제
              </button>
            )}
            <button
              className="primary"
              disabled={working}
              onClick={async () => {
                setWorking(true);
                await mutate(
                  `/bookmarks/${encodeURIComponent(c.id)}`,
                  "PUT",
                  { boardId: boardId || null, note },
                  "보드와 메모를 저장했습니다.",
                );
                setWorking(false);
              }}
            >
              {working ? (
                <Loader2 className="spin" size={15} />
              ) : (
                <Bookmark size={15} />
              )}
              저장하기
            </button>
          </div>
        </div>
        <details className="metric-history">
          <summary>지표 갱신 이력 ({historyData.length})</summary>
          {historyError ? (
            <p>{historyError}</p>
          ) : (
            historyData.map((h, i) => (
              <div key={i}>
                <time>{date(h.at)}</time>
                <span>♡ {number(h.likes)}</span>
                <span>댓글 {number(h.comments)}</span>
              </div>
            ))
          )}
        </details>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
