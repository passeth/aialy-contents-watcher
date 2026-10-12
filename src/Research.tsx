import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  ExternalLink,
  Bookmark,
  Download,
  PenLine,
  Trash2,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import {
  api,
  number,
  date,
  exportCsv,
  type Workspace,
  type Content,
} from "./model";
export type ResearchPage =
  | "social"
  | "ads"
  | "tracking"
  | "brand-mentions"
  | "target-mentions"
  | "owned";
type Rule = {
  id: string;
  name: string;
  kind: "brand" | "target";
  keywords: string[];
  required: string[];
  excluded: string[];
  accounts: string[];
};
type Analysis = {
  items: Content[];
  summary: {
    mentions: number;
    authors: number;
    likes: number | null;
    comments: number | null;
    views: number | null;
    previousMentions: number;
    growth: number | null;
    metricCoverage: { likes: number; comments: number; views: number };
  };
  daily: { date: string; count: number }[];
  keywords: {
    term: string;
    count: number;
    previous: number;
    growth: number | null;
    authors: number;
  }[];
  brands: { id: string; name: string; count: number }[];
  accounts: { username: string; count: number; likes: number | null }[];
  scope: { from: string; to: string; sourceCount: number; notes: string[] };
};
type Brand = { id: string; name: string; aliases: string[] };
type Step = {
  label: string;
  q: string;
  brandId: string;
  sourceId: string;
  setId: string;
  mode: string;
  days: string;
  persona: string;
  tab: string;
};
type Props = {
  initialQuery?: string;
  onNewSearch: (term: string) => void;
  page: ResearchPage;
  ws: Workspace;
  open: (c: Content) => void;
  save: (c: Content) => void;
  addSource: () => void;
};
const split = (s: string) => [
  ...new Set(
    s
      .split(/[,\n]/)
      .map((x) => x.trim())
      .filter(Boolean),
  ),
];
const draftRule = (): Rule => ({
  id: "",
  name: "",
  kind: "target",
  keywords: [],
  required: [],
  excluded: [],
  accounts: [],
});
const descriptions: Record<ResearchPage, string> = {
  social: "키워드별 게시물, 작성자와 반응을 같은 조건으로 살펴보세요.",
  ads: "브랜드의 광고 카피와 소재를 모아 비교하세요.",
  tracking: "우리 브랜드와 관심 주제의 추적 조건을 관리하세요.",
  "brand-mentions": "자사 계정을 제외한 외부 언급을 살펴보세요.",
  "target-mentions": "경쟁 브랜드·성분·제품군별로 저장한 조건을 비교하세요.",
  owned: "자사 계정의 활동과 게시물 반응을 확인하세요.",
};
export function Research({
  page,
  ws,
  open,
  save,
  addSource,
  initialQuery = "",
  onNewSearch,
}: Props) {
  const [sets, setSets] = useState<Rule[]>([]),
    [setId, setSetId] = useState(""),
    [query, setQuery] = useState(initialQuery),
    [applied, setApplied] = useState(initialQuery),
    [brands, setBrands] = useState<Brand[]>([]),
    [brandId, setBrandId] = useState(""),
    [trail, setTrail] = useState<Step[]>([]),
    [pivot, setPivot] = useState(""),
    [dictionary, setDictionary] = useState(false),
    [mode, setMode] = useState("or"),
    [days, setDays] = useState("30"),
    [persona, setPersona] = useState("all"),
    [sourceId, setSourceId] = useState(""),
    [tab, setTab] = useState("dashboard"),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [revision, setRevision] = useState(0),
    [editing, setEditing] = useState<Rule | null>(null),
    [deleting, setDeleting] = useState<Rule | null>(null),
    [saving, setSaving] = useState(false),
    [ruleKind, setRuleKind] = useState("all"),
    [limit, setLimit] = useState(40);
  useEffect(() => {
    if (editing)
      document
        .querySelector(".inline-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editing]);
  const refreshSets = () =>
    api<{ sets: Rule[]; brands: Brand[] }>("/monitoring").then((r) => {
      setSets(r.sets);
      setBrands(r.brands);
    });
  useEffect(() => {
    refreshSets().catch((e) => setError(e.message));
  }, [revision]);
  const view =
    page === "brand-mentions"
      ? "brand"
      : page === "target-mentions"
        ? "target"
        : page === "owned"
          ? "owned"
          : "social";
  useEffect(() => {
    if (page === "ads" || page === "tracking") return;
    let active = true;
    setLoading(true);
    setError("");
    setAnalysis(null);
    setLimit(40);
    const p = new URLSearchParams({ q: applied, mode, days, persona, view });
    if (setId) p.set("setId", setId);
    if (sourceId) p.set("sourceId", sourceId);
    if (brandId) p.set("brandId", brandId);
    api<Analysis>("/monitoring/analysis?" + p)
      .then((r) => {
        if (active) setAnalysis(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    page,
    applied,
    mode,
    days,
    persona,
    setId,
    sourceId,
    brandId,
    revision,
    ws.content,
  ]);
  async function saveRule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    try {
      await api(
        "/monitoring/sets" + (editing.id ? "/" + editing.id : ""),
        editing.id ? "PATCH" : "POST",
        {
          name: f.get("name"),
          kind: f.get("kind"),
          keywords: split(String(f.get("keywords"))),
          required: split(String(f.get("required"))),
          excluded: split(String(f.get("excluded"))),
          accounts: split(String(f.get("accounts"))),
        },
      );
      setEditing(null);
      setRevision((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const visibleSets = sets.filter((s) =>
    page === "brand-mentions"
      ? s.kind === "brand"
      : page === "target-mentions"
        ? s.kind === "target"
        : ruleKind === "all" || s.kind === ruleKind,
  );
  const selectedSet = sets.find((s) => s.id === setId);
  function checkpoint(label: string) {
    const current = {
      label,
      q: applied,
      brandId,
      sourceId,
      setId,
      mode,
      days,
      persona,
      tab,
    };
    setTrail((t) => [...t, current].slice(-20));
  }
  function restore(step: Step, index: number) {
    setQuery(step.q);
    setApplied(step.q);
    setBrandId(step.brandId);
    setSourceId(step.sourceId);
    setSetId(step.setId);
    setMode(step.mode);
    setDays(step.days);
    setPersona(step.persona);
    setTab(step.tab);
    setPivot("");
    setTrail((t) => t.slice(0, index));
  }
  function contextLabel() {
    return [
      applied || "전체 게시물",
      brands.find((b) => b.id === brandId)?.name,
      ws.sources.find((s) => s.id === sourceId)?.username,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  function drill(term: string) {
    setPivot(term);
  }
  function exploreKeyword(term: string, within: boolean) {
    if (!within && page !== "social") {
      onNewSearch(term);
      return;
    }
    checkpoint(contextLabel());
    const q = within
      ? [...new Set([...split(applied), term])].join(", ")
      : term;
    setQuery(q);
    setApplied(q);
    setMode(within ? "and" : "or");
    if (!within) {
      setBrandId("");
      setSourceId("");
      setSetId("");
      setPersona("all");
    }
    setPivot("");
    setTab("dashboard");
  }
  function exploreBrand(id: string) {
    checkpoint(contextLabel());
    setBrandId(id);
    setPivot("");
    setTab("dashboard");
  }
  function exploreAccount(username: string, all: boolean) {
    const source = ws.sources.find((s) => s.username === username);
    if (!source) return;
    checkpoint(contextLabel());
    setSourceId(source.id);
    setPivot("");
    if (all) {
      setQuery("");
      setApplied("");
      setBrandId("");
      setSetId("");
      setPersona("all");
      setTab("analysis");
    } else setTab("posts");
  }
  if (page === "ads") return <Ads />;
  return (
    <section className="research-page">
      <p className="research-intro">{descriptions[page]}</p>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="coverage-strip">
        <span className="scope-pill">등록 계정 내 분석</span>
        <span>
          {ws.sources.filter((s) => s.lastSuccess).length}개 계정 수집됨 ·
          키워드 발견 수집 미연결
        </span>
        <details>
          <summary>분석 범위</summary>
          <p>
            저장한 조건은 현재 수집된 게시물에 적용됩니다. 아직 모르는 계정의 새
            언급을 찾는 검색 수집은 별도 연결이 필요합니다. 키워드 저장만으로
            수집이 시작되지는 않습니다.
          </p>
          <p>
            Instagram·Meta 광고를 우선 연결하고 YouTube를 다음 단계로
            확장합니다.
          </p>
        </details>
      </div>
      {page === "tracking" ? (
        <>
          <div className="research-toolbar">
            <div className="tabs">
              {[
                ["all", "전체"],
                ["brand", "우리 브랜드"],
                ["target", "타겟 SET"],
              ].map(([v, n]) => (
                <button
                  key={v}
                  className={ruleKind === v ? "selected" : ""}
                  onClick={() => setRuleKind(v)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button className="primary" onClick={() => setEditing(draftRule())}>
              <Plus size={16} />
              추적 조건 추가
            </button>
          </div>
          {!sets.length && (
            <div className="seed-suggestion">
              <strong>Fraijour 외부 언급부터 시작하세요</strong>
              <p>
                영문·국문 브랜드명을 하나의 조건으로 묶고, 잘못 일치한 결과를
                보며 제외어를 보완합니다.
              </p>
              <button
                className="secondary"
                onClick={() =>
                  setEditing({
                    ...draftRule(),
                    name: "Fraijour 외부 언급",
                    kind: "brand",
                    keywords: ["fraijour", "프레쥬"],
                  })
                }
              >
                Fraijour 조건 작성
              </button>
            </div>
          )}
          <div className="rule-list">
            {visibleSets.map((s) => (
              <article key={s.id} className="rule-card">
                <div>
                  <span className="scope-pill">
                    {s.kind === "brand" ? "우리 브랜드" : "타겟 SET"}
                  </span>
                  <h3>{s.name}</h3>
                  <p>
                    {s.keywords.join(" · ") || "계정 조건"}
                    {s.accounts.length > 0
                      ? " / " + s.accounts.map((a) => "@" + a).join(", ")
                      : ""}
                  </p>
                  <small>
                    필수어 {s.required.join(", ") || "없음"} · 제외어{" "}
                    {s.excluded.join(", ") || "없음"}
                  </small>
                </div>
                <div className="rule-actions">
                  <span className="muted">조건 저장됨</span>
                  <button
                    className="icon-btn bordered"
                    aria-label={`${s.name} 수정`}
                    onClick={() => setEditing(s)}
                  >
                    <PenLine size={16} />
                  </button>
                  <button
                    className="icon-btn bordered"
                    aria-label={`${s.name} 삭제`}
                    onClick={() => setDeleting(s)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="panel">
            <div className="panel-heading">
              <h3>자사 계정 · 계정 수집 상태</h3>
              <button className="text-btn" onClick={addSource}>
                계정 추가
                <Plus size={15} />
              </button>
            </div>
            <AccountTable ws={ws} />
          </div>
        </>
      ) : (
        <>
          <form
            className="research-search"
            onSubmit={(e) => {
              e.preventDefault();
              checkpoint(contextLabel());
              setBrandId("");
              setSourceId("");
              setPivot("");
              setApplied(query);
            }}
          >
            <div className="searchbox">
              <Search size={19} />
              <input
                aria-label="분석 키워드"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="브랜드, 성분, 제품 키워드 · 쉼표로 구분"
              />
            </div>
            <select
              aria-label="키워드 결합"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="or">OR · 하나 이상</option>
              <option value="and">AND · 모두 포함</option>
            </select>
            <button className="primary" type="submit">
              검색
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setEditing({
                  ...draftRule(),
                  name: applied || query,
                  keywords: split(applied || query),
                  kind: view === "brand" ? "brand" : "target",
                })
              }
            >
              추적 조건 저장
            </button>
          </form>
          <div className="research-filters">
            <label>
              기간
              <select value={days} onChange={(e) => setDays(e.target.value)}>
                <option value="7">최근 7일</option>
                <option value="30">최근 30일</option>
                <option value="90">최근 90일</option>
                <option value="365">최근 1년</option>
              </select>
            </label>
            <label>
              브랜드
              <select
                aria-label="분석 브랜드"
                value={brandId}
                onChange={(e) => {
                  checkpoint(contextLabel());
                  setBrandId(e.target.value);
                }}
              >
                <option value="">전체 브랜드</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="text-btn"
              onClick={() => setDictionary(!dictionary)}
            >
              브랜드 사전
            </button>
            {page !== "owned" && (
              <label>
                추적 SET
                <select
                  aria-label="분석 추적 SET"
                  value={setId}
                  onChange={(e) => {
                    setSetId(e.target.value);
                    setQuery("");
                    setApplied("");
                  }}
                >
                  <option value="">전체 조건</option>
                  {visibleSets.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              작성자
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
              >
                <option value="all">전체</option>
                <option value="external">외부 계정</option>
                <option value="owned">자사 계정</option>
                <option value="disclosed">광고·협찬 명시</option>
              </select>
            </label>
            <label>
              계정
              <select
                aria-label="분석 계정"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">전체 계정</option>
                {ws.sources
                  .filter((s) => page !== "owned" || s.kind === "owned")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      @{s.username}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="text-btn"
              onClick={() => {
                setQuery("");
                setApplied("");
                setSourceId("");
                setSetId("");
                setPersona("all");
                setDays("30");
                setMode("or");
                setBrandId("");
                setPivot("");
              }}
            >
              초기화
            </button>
          </div>
          {trail.length > 0 && (
            <nav className="exploration-trail" aria-label="탐색 경로">
              <span>탐색 경로</span>
              {trail.map((step, i) => (
                <React.Fragment key={i}>
                  <button onClick={() => restore(step, i)}>{step.label}</button>
                  <ArrowRight size={12} />
                </React.Fragment>
              ))}
              <strong>{contextLabel()}</strong>
            </nav>
          )}
          {sourceId && (
            <div className="account-context">
              <span>
                @{ws.sources.find((s) => s.id === sourceId)?.username}의{" "}
                {applied ? `‘${applied}’ 관련 글` : "최근 수집 콘텐츠"}를 보고
                있습니다.
              </span>
              {applied && (
                <button
                  className="text-btn"
                  onClick={() =>
                    exploreAccount(
                      ws.sources.find((s) => s.id === sourceId)?.username || "",
                      true,
                    )
                  }
                >
                  이 계정의 다른 표현 보기
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
          {pivot && (
            <div className="pivot-panel">
              <div>
                <strong>‘{pivot}’로 이어서 탐색</strong>
                <p>
                  현재 조건 안에서 더 좁히거나, 브랜드·계정 조건을 풀고 이
                  키워드를 새로 살펴보세요.
                </p>
              </div>
              <button
                className="secondary"
                onClick={() => exploreKeyword(pivot, true)}
              >
                현재 결과에서 좁히기
              </button>
              <button
                className="primary"
                onClick={() => exploreKeyword(pivot, false)}
              >
                키워드로 새 탐색
              </button>
              <button className="text-btn" onClick={() => setPivot("")}>
                닫기
              </button>
            </div>
          )}
          {dictionary && (
            <BrandDictionary
              brands={brands}
              changed={() => setRevision((x) => x + 1)}
              close={() => setDictionary(false)}
            />
          )}
          {selectedSet && (
            <div className="keyword-chips">
              {selectedSet.keywords.map((k) => (
                <button
                  className={applied === k ? "active" : ""}
                  key={k}
                  onClick={() => {
                    setQuery(k);
                    setApplied(k);
                  }}
                >
                  {k}
                </button>
              ))}
              <small>
                필수어: {selectedSet.required.join(", ") || "없음"} / 제외어:{" "}
                {selectedSet.excluded.join(", ") || "없음"}
              </small>
            </div>
          )}
          <div className="research-toolbar">
            <div className="tabs">
              {[
                ["dashboard", "대시보드"],
                ["posts", "포스팅"],
                ["analysis", "콘텐츠 분석"],
              ].map(([v, n]) => (
                <button
                  key={v}
                  className={tab === v ? "selected" : ""}
                  onClick={() => setTab(v)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              className="secondary"
              disabled={!analysis?.items.length || loading}
              onClick={() => analysis && exportCsv(analysis.items)}
            >
              <Download size={15} />
              CSV 내보내기
            </button>
          </div>
          {loading ? (
            <div className="analysis-empty">
              조건에 맞는 자료를 분석하고 있습니다…
            </div>
          ) : analysis ? (
            <>
              {tab === "dashboard" && (
                <>
                  <div className="metric-grid">
                    <Metric
                      label="언급 게시물"
                      value={analysis.summary.mentions}
                      note={
                        analysis.summary.growth === null
                          ? "이전 기간 " +
                            analysis.summary.previousMentions +
                            "건 · 증감률 미산출"
                          : `이전 동일 기간 대비 ${analysis.summary.growth > 0 ? "+" : ""}${analysis.summary.growth.toFixed(1)}%`
                      }
                    />
                    <Metric
                      label="작성 계정"
                      value={analysis.summary.authors}
                      note="작성자 식별 가능한 계정"
                    />
                    <Metric
                      label="좋아요"
                      value={analysis.summary.likes}
                      note={`${analysis.summary.metricCoverage.likes}개 글에서 제공`}
                    />
                    <Metric
                      label="조회수"
                      value={analysis.summary.views}
                      note={`${analysis.summary.metricCoverage.views}개 글에서 제공 · 도달과 다름`}
                    />
                  </div>
                  <div className="panel">
                    <div className="panel-heading">
                      <h3>언급 추이</h3>
                      <small>게시일 기준 · UTC · {days}일</small>
                    </div>
                    <Trend values={analysis.daily} />
                  </div>
                  <div className="panel">
                    <div className="panel-heading">
                      <h3>이 주제와 함께 등장한 브랜드</h3>
                      <button
                        className="text-btn"
                        onClick={() => setDictionary(true)}
                      >
                        브랜드 사전 관리
                      </button>
                    </div>
                    <p className="muted brand-scope-note">
                      등록한 별칭의 본문 일치 · 브랜드가 직접 배포한 글인지
                      여부는 원문에서 확인하세요.
                    </p>
                    <div className="brand-ranks">
                      {analysis.brands.map((b) => (
                        <button key={b.id} onClick={() => exploreBrand(b.id)}>
                          <strong>{b.name}</strong>
                          <span>{b.count}개 게시물</span>
                          <ArrowRight size={15} />
                        </button>
                      ))}
                    </div>
                    {!analysis.brands.length && (
                      <p className="no-data">
                        현재 조건과 일치하는 등록 브랜드가 없습니다. 브랜드
                        사전에 이름과 영문·국문 별칭을 추가해 주세요.
                      </p>
                    )}
                  </div>
                  <div className="analysis-columns">
                    <div className="panel">
                      <div className="panel-heading">
                        <h3>많이 언급한 계정</h3>
                        <small>현재 조건 내</small>
                      </div>
                      {analysis.accounts.slice(0, 8).map((a, i) => (
                        <div
                          className="ranking-row account-rank"
                          key={a.username}
                        >
                          <span>{i + 1}</span>
                          <button
                            className="text-btn"
                            onClick={() => exploreAccount(a.username, false)}
                          >
                            @{a.username}
                          </button>
                          <span>{a.count}건</span>
                          <button
                            className="text-btn"
                            onClick={() => exploreAccount(a.username, true)}
                            aria-label={`${a.username} 계정의 다른 표현 보기`}
                          >
                            계정의 다른 표현
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      ))}
                      {!analysis.accounts.length && (
                        <p className="no-data">
                          관측한 외부 언급이 아직 없습니다.
                        </p>
                      )}
                    </div>
                    <div className="panel">
                      <div className="panel-heading">
                        <h3>관련 키워드</h3>
                        <small>수집한 글에서 추출</small>
                      </div>
                      <div className="keyword-cloud">
                        {analysis.keywords.slice(0, 16).map((k) => (
                          <button key={k.term} onClick={() => drill(k.term)}>
                            {k.term}
                            <span>
                              {k.count}건 · {k.authors}계정
                            </span>
                          </button>
                        ))}
                      </div>
                      {!analysis.keywords.length && (
                        <p className="no-data">
                          분석할 게시물이 아직 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                  {page === "owned" && (
                    <div className="panel">
                      <div className="panel-heading">
                        <h3>자사 계정</h3>
                        <button className="text-btn" onClick={addSource}>
                          계정 추가
                          <Plus size={15} />
                        </button>
                      </div>
                      <AccountTable ws={ws} owned />
                    </div>
                  )}
                </>
              )}
              {tab === "posts" && (
                <>
                  <div className="result-caption">
                    {analysis.items.length}개 게시물 · 최신순
                  </div>
                  <div className="research-post-grid">
                    {analysis.items.slice(0, limit).map((c) => (
                      <article className="research-post" key={c.id}>
                        <button
                          className="research-thumb"
                          onClick={() => open(c)}
                        >
                          {c.thumbnail ? (
                            <img
                              src={c.thumbnail}
                              alt={c.title}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <BarChart3 size={30} />
                          )}
                        </button>
                        <div>
                          <div className="post-byline">
                            <strong>@{c.author || "작성자 미상"}</strong>
                            <button
                              className="icon-btn"
                              aria-label={`${c.author} 북마크`}
                              onClick={() => save(c)}
                            >
                              <Bookmark
                                size={17}
                                fill={
                                  ws.bookmarks.some((b) => b.contentId === c.id)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          </div>
                          <button className="post-text" onClick={() => open(c)}>
                            {c.caption || c.title || "내용 미제공"}
                          </button>
                          <small>
                            {date(c.publishedAt)} · 좋아요 {number(c.likes)} ·
                            댓글 {number(c.comments)}
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                  {analysis.items.length > limit && (
                    <button
                      className="secondary"
                      onClick={() => setLimit((x) => x + 40)}
                    >
                      40개 더 보기
                    </button>
                  )}
                  {!analysis.items.length && (
                    <div className="analysis-empty">
                      <Search size={28} />
                      <h3>현재 조건에 맞는 수집 자료가 없습니다</h3>
                      <p>
                        기간과 추적 조건을 확인해 주세요. 이 결과는 Instagram
                        전체 검색 결과가 아닙니다.
                      </p>
                    </div>
                  )}
                </>
              )}
              {tab === "analysis" && (
                <>
                  <div className="panel">
                    <div className="panel-heading">
                      <h3>키워드 변화</h3>
                      <small>
                        이전 동일 기간과 비교 · 시장 전체 유행 순위가 아닙니다
                      </small>
                    </div>
                    <div className="table-scroll">
                      <table className="analysis-table">
                        <thead>
                          <tr>
                            <th>키워드</th>
                            <th>언급</th>
                            <th>이전</th>
                            <th>변화</th>
                            <th>작성자</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.keywords.map((k) => (
                            <tr key={k.term}>
                              <td>{k.term}</td>
                              <td>{k.count}</td>
                              <td>{k.previous}</td>
                              <td>
                                {k.growth === null
                                  ? "비교 기준 없음"
                                  : `${k.growth.toFixed(1)}%`}
                              </td>
                              <td>{k.authors}</td>
                              <td>
                                <button
                                  className="text-btn"
                                  onClick={() => drill(k.term)}
                                >
                                  글 보기
                                  <ArrowRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!analysis.keywords.length && (
                      <p className="no-data">분석할 키워드가 없습니다.</p>
                    )}
                  </div>
                  <div className="panel">
                    <h3>함께 등장한 브랜드</h3>
                    <p className="muted">
                      등록한 브랜드 키워드 사전과 본문이 일치한 결과입니다.
                    </p>
                    {analysis.brands.map((b) => (
                      <button
                        className="ranking-row"
                        key={b.id}
                        onClick={() => exploreBrand(b.id)}
                      >
                        <strong>{b.name}</strong>
                        <span>{b.count}건</span>
                        <ArrowRight size={14} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              <details className="method-note">
                <summary>지표 정의와 수집 범위</summary>
                {analysis.scope.notes.map((n) => (
                  <p key={n}>{n}</p>
                ))}
              </details>
            </>
          ) : null}
        </>
      )}
      {editing && (
        <div className="inline-editor panel">
          <div className="panel-heading">
            <h3>{editing.id ? "추적 조건 수정" : "추적 조건 등록"}</h3>
            <button className="text-btn" onClick={() => setEditing(null)}>
              닫기
            </button>
          </div>
          <form onSubmit={saveRule} key={editing.id || "new"}>
            <div className="editor-grid">
              <label>
                이름
                <input
                  name="name"
                  required
                  maxLength={80}
                  defaultValue={editing.name}
                />
              </label>
              <label>
                구분
                <select name="kind" defaultValue={editing.kind}>
                  <option value="brand">우리 브랜드</option>
                  <option value="target">타겟 SET</option>
                </select>
              </label>
              <label>
                포함 키워드
                <textarea
                  name="keywords"
                  defaultValue={editing.keywords.join(", ")}
                  placeholder="fraijour, 프레쥬"
                />
              </label>
              <label>
                계정
                <textarea
                  name="accounts"
                  defaultValue={editing.accounts.join(", ")}
                  placeholder="username, 다른계정"
                />
              </label>
              <label>
                필수어
                <textarea
                  name="required"
                  defaultValue={editing.required.join(", ")}
                  placeholder="모두 포함해야 하는 단어"
                />
              </label>
              <label>
                제외어
                <textarea
                  name="excluded"
                  defaultValue={editing.excluded.join(", ")}
                  placeholder="하나라도 있으면 제외"
                />
              </label>
            </div>
            <p className="muted">
              여러 값은 쉼표 또는 줄바꿈으로 구분합니다. 별칭은 OR로 묶어
              조회하세요. 저장은 수집 시작과 별개입니다.
            </p>
            <button className="primary" disabled={saving} type="submit">
              {saving ? "저장 중…" : "추적 조건 저장하기"}
            </button>
          </form>
        </div>
      )}
      {deleting && (
        <div className="panel delete-rule">
          <h3>‘{deleting.name}’ 조건을 삭제할까요?</h3>
          <p>이미 수집한 게시물과 북마크는 보존됩니다.</p>
          <button className="secondary" onClick={() => setDeleting(null)}>
            취소
          </button>
          <button
            className="primary"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await api("/monitoring/sets/" + deleting.id, "DELETE", {});
                if (setId === deleting.id) setSetId("");
                setDeleting(null);
                setRevision((x) => x + 1);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            조건 삭제 확인
          </button>
        </div>
      )}
    </section>
  );
}
function BrandDictionary({
  brands,
  changed,
  close,
}: {
  brands: Brand[];
  changed: () => void;
  close: () => void;
}) {
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  return (
    <div className="panel">
      <div className="panel-heading">
        <h3>브랜드 이름과 별칭</h3>
        <button className="text-btn" onClick={close}>
          닫기
        </button>
      </div>
      <p className="muted brand-scope-note">
        같은 브랜드의 표기를 묶어 수집한 본문에서 찾습니다. 경쟁 브랜드 등록은
        자사 계정이나 우리 브랜드 추적 등록과 별개입니다.
      </p>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          setSaving(true);
          try {
            await api("/monitoring/brands", "POST", {
              name: f.get("brandName"),
              aliases: split(String(f.get("aliases"))),
            });
            changed();
            form.reset();
            setError("");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="editor-grid">
          <label>
            브랜드 이름
            <input
              name="brandName"
              required
              maxLength={80}
              placeholder="라운드랩"
            />
          </label>
          <label>
            브랜드 별칭
            <input
              name="aliases"
              required
              maxLength={2000}
              placeholder="라운드랩, 라운드 랩, roundlab, round lab"
            />
          </label>
        </div>
        <button className="secondary" disabled={saving}>
          브랜드 사전 등록
        </button>
      </form>
      <div className="brand-dictionary-list">
        {brands.map((b) => (
          <div className="ranking-row" key={b.id}>
            <strong>{b.name}</strong>
            <span>{b.aliases.join(", ")}</span>
            <button
              className="text-btn"
              disabled={saving}
              aria-label={`${b.name} 사전에서 제거`}
              onClick={async () => {
                setSaving(true);
                try {
                  await api("/monitoring/brands/" + b.id, "DELETE", {});
                  changed();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setSaving(false);
                }
              }}
            >
              제거
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: number | null;
  note: string;
}) {
  return (
    <div className="metric-card">
      <small>{label}</small>
      <strong>{number(value)}</strong>
      <p>{note}</p>
    </div>
  );
}
function Trend({ values }: { values: Analysis["daily"] }) {
  const max = Math.max(1, ...values.map((d) => d.count));
  const width = 900,
    height = 160;
  return (
    <div className="trend-chart">
      <svg
        viewBox={`0 0 ${width} ${height + 25}`}
        role="img"
        aria-label="일별 언급 수 추이"
      >
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line
              x1="28"
              x2={width}
              y1={10 + y * (height - 20)}
              y2={10 + y * (height - 20)}
              stroke="#e8edf4"
            />
            <text x="0" y={14 + y * (height - 20)} fill="#8994a5" fontSize="11">
              {Math.round(max * (1 - y))}
            </text>
          </g>
        ))}
        {values.map((d, i) => {
          const w = (width - 32) / values.length;
          const h = (d.count / max) * (height - 20);
          return (
            <rect
              key={d.date}
              x={30 + i * w}
              y={height - 10 - h}
              width={Math.max(1, w * 0.65)}
              height={h}
              rx="2"
              fill="#4677e8"
            >
              <title>
                {d.date}: {d.count}건
              </title>
            </rect>
          );
        })}
        <text x="30" y={height + 20} fontSize="11" fill="#8994a5">
          {values[0]?.date}
        </text>
        <text
          x={width}
          y={height + 20}
          textAnchor="end"
          fontSize="11"
          fill="#8994a5"
        >
          {values.at(-1)?.date}
        </text>
      </svg>
    </div>
  );
}
function AccountTable({
  ws,
  owned = false,
}: {
  ws: Workspace;
  owned?: boolean;
}) {
  const sources = ws.sources.filter((s) => !owned || s.kind === "owned");
  return (
    <div className="table-scroll">
      <table className="analysis-table">
        <thead>
          <tr>
            <th>계정</th>
            <th>구분</th>
            <th>팔로워</th>
            <th>수집 글</th>
            <th>최근 수집</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <td>@{s.username}</td>
              <td>
                {s.kind === "owned"
                  ? "자사"
                  : s.kind === "brand"
                    ? "브랜드"
                    : "크리에이터"}
              </td>
              <td>{number(s.profile?.followers ?? null)}</td>
              <td>{s.contentIds.length}</td>
              <td>{date(s.lastSuccess)}</td>
              <td>
                {s.lastError
                  ? "수집 오류"
                  : s.enabled
                    ? "자동 갱신 켜짐"
                    : s.lastSuccess
                      ? "수동 갱신"
                      : "수집 전"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!sources.length && (
        <p className="no-data">등록된 {owned ? "자사 " : ""}계정이 없습니다.</p>
      )}
    </div>
  );
}
type Ad = {
  id: string;
  brand: string;
  caption: string;
  format: string;
  status: string;
  startDate: string | null;
  libraryUrl: string;
  note: string;
  observedAt: string;
};
function Ads() {
  const [ads, setAds] = useState<Ad[]>([]),
    [query, setQuery] = useState(""),
    [format, setFormat] = useState("all"),
    [status, setStatus] = useState("all"),
    [editing, setEditing] = useState<Partial<Ad> | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [compare, setCompare] = useState(false);
  const refresh = () =>
    api<{ items: Ad[] }>("/ads").then((r) => setAds(r.items));
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  const filtered = ads.filter(
    (a) =>
      [a.brand, a.caption, a.note]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (format === "all" || a.format === format) &&
      (status === "all" || a.status === status),
  );
  return (
    <section className="research-page">
      <p className="research-intro">
        브랜드별 광고 카피·형식·확인 시점을 기록하고 나란히 비교하세요.
      </p>
      <div className="coverage-strip">
        <span className="scope-pill">수동 저장</span>
        <span>자동 광고 검색·집행 상태 갱신 미연결</span>
        <a
          className="text-btn"
          href={
            "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=" +
            encodeURIComponent(query || "fraijour")
          }
          target="_blank"
          rel="noreferrer"
        >
          Meta 광고 라이브러리 열기
          <ExternalLink size={14} />
        </a>
      </div>
      {error && (
        <div role="alert" className="error-banner">
          {error}
        </div>
      )}
      <div className="research-search">
        <div className="searchbox">
          <Search size={18} />
          <input
            aria-label="광고 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="브랜드, 광고 카피, 메모 검색"
          />
        </div>
        <button className="primary" onClick={() => setEditing({})}>
          <Plus size={16} />
          광고 참고 저장
        </button>
      </div>
      <div className="research-filters">
        <label>
          형식
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="all">전체</option>
            <option value="image">이미지</option>
            <option value="video">동영상</option>
            <option value="unknown">미확인</option>
          </select>
        </label>
        <label>
          확인 당시 상태
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">전체</option>
            <option value="active">집행 중</option>
            <option value="inactive">집행 종료</option>
            <option value="unknown">미확인</option>
          </select>
        </label>
        <span>{filtered.length}개 광고</span>
        <button
          className="secondary"
          disabled={selected.length < 2}
          onClick={() => setCompare(!compare)}
        >
          {compare ? "전체 보기" : `선택 광고 비교 (${selected.length}/4)`}
        </button>
      </div>
      <div className="ad-grid">
        {(compare ? ads.filter((a) => selected.includes(a.id)) : filtered).map(
          (a) => (
            <article className="panel ad-card" key={a.id}>
              <div className="panel-heading">
                <strong>{a.brand}</strong>
                <input
                  type="checkbox"
                  aria-label={`${a.brand} 광고 ${a.id} 비교 선택`}
                  checked={selected.includes(a.id)}
                  disabled={!selected.includes(a.id) && selected.length >= 4}
                  onChange={() =>
                    setSelected((s) =>
                      s.includes(a.id)
                        ? s.filter((id) => id !== a.id)
                        : [...s, a.id],
                    )
                  }
                />
              </div>
              <span className="scope-pill">
                {a.format === "video"
                  ? "영상"
                  : a.format === "image"
                    ? "이미지"
                    : "형식 미확인"}
              </span>
              <p className="ad-copy">{a.caption || "광고 카피 미입력"}</p>
              <dl>
                <dt>확인 당시 집행 상태</dt>
                <dd>
                  {a.status === "active"
                    ? "집행 중"
                    : a.status === "inactive"
                      ? "집행 종료"
                      : "미확인"}
                </dd>
                <dt>시작일</dt>
                <dd>{a.startDate || "미확인"}</dd>
                <dt>직접 확인한 시각</dt>
                <dd>{date(a.observedAt)}</dd>
              </dl>
              <p className="muted">{a.note}</p>
              <div className="panel-heading">
                <a
                  className="text-btn"
                  href={a.libraryUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  원본 소재 보기
                  <ExternalLink size={14} />
                </a>
                <button className="text-btn" onClick={() => setEditing(a)}>
                  수정
                </button>
              </div>
            </article>
          ),
        )}
      </div>
      {!filtered.length && !compare && (
        <div className="analysis-empty">
          <Search size={28} />
          <h3>저장한 광고 참고 자료가 없습니다</h3>
          <p>
            라이브러리에서 확인한 광고의 링크와 카피를 저장할 수 있습니다. 자동
            광고 모니터링은 아직 연결되지 않았습니다.
          </p>
        </div>
      )}
      {editing && (
        <div className="panel inline-editor">
          <div className="panel-heading">
            <h3>광고 참고 저장</h3>
            <button className="text-btn" onClick={() => setEditing(null)}>
              닫기
            </button>
          </div>
          <form
            key={editing.id || "new"}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setSaving(true);
              setError("");
              try {
                await api("/ads", "POST", {
                  libraryUrl: f.get("libraryUrl"),
                  brand: f.get("brand"),
                  caption: f.get("caption"),
                  note: f.get("note"),
                  format: f.get("format"),
                  status: f.get("status"),
                  startDate: f.get("startDate") || null,
                });
                await refresh();
                setEditing(null);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="editor-grid">
              <label>
                광고 라이브러리 링크
                <input
                  name="libraryUrl"
                  type="url"
                  required
                  defaultValue={editing.libraryUrl}
                  placeholder="https://www.facebook.com/ads/library/?id=..."
                />
              </label>
              <label>
                브랜드
                <input
                  name="brand"
                  required
                  maxLength={120}
                  defaultValue={editing.brand}
                />
              </label>
              <label>
                광고 카피
                <textarea
                  name="caption"
                  defaultValue={editing.caption}
                  maxLength={10000}
                />
              </label>
              <label>
                메모
                <textarea
                  name="note"
                  defaultValue={editing.note}
                  maxLength={5000}
                />
              </label>
              <label>
                형식
                <select
                  name="format"
                  defaultValue={editing.format || "unknown"}
                >
                  <option value="unknown">미확인</option>
                  <option value="image">이미지</option>
                  <option value="video">동영상</option>
                </select>
              </label>
              <label>
                집행 상태
                <select
                  name="status"
                  defaultValue={editing.status || "unknown"}
                >
                  <option value="unknown">미확인</option>
                  <option value="active">집행 중</option>
                  <option value="inactive">집행 종료</option>
                </select>
              </label>
              <label>
                시작일
                <input
                  type="date"
                  name="startDate"
                  defaultValue={editing.startDate || ""}
                />
              </label>
            </div>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "저장 중…" : "광고 저장하기"}
            </button>
            {editing.id && (
              <button
                type="button"
                className="text-btn"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await api("/ads/" + editing.id, "DELETE", {});
                    setSelected((s) => s.filter((id) => id !== editing.id));
                    await refresh();
                    setEditing(null);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                저장 해제
              </button>
            )}
          </form>
        </div>
      )}
      <p className="method-note">
        집행 기간·광고 수는 활동 지표입니다. 지출·매출·전환 성과는 알 수 없으며,
        저장한 상태는 현재 상태와 다를 수 있습니다.
      </p>
    </section>
  );
}
