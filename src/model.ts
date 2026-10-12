export type Content = {
  id: string;
  platform: string;
  platformId: string;
  author: string;
  authorName: string;
  authorId: string;
  avatar: string | null;
  title: string;
  caption: string;
  kind: "video" | "image" | "carousel";
  thumbnail: string | null;
  videoUrl: string | null;
  sourceUrl: string;
  publishedAt: string;
  collectedAt: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  children: {
    id: string;
    kind: string;
    thumbnail: string | null;
    videoUrl: string | null;
  }[];
};
export type Source = {
  id: string;
  username: string;
  label: string;
  kind: "brand" | "creator" | "owned";
  enabled: boolean;
  intervalHours: number;
  nextRun: string | null;
  lastSuccess: string | null;
  lastError: string | null;
  profile: {
    id: string;
    username: string;
    name: string;
    biography: string;
    avatar: string | null;
    followers: number | null;
    mediaCount: number | null;
    website: string | null;
  } | null;
  contentIds: string[];
};
export type Board = { id: string; name: string; createdAt: string };
export type Bookmark = {
  contentId: string;
  boardId: string | null;
  note: string;
  createdAt: string;
};
export type Run = {
  id: string;
  source_id: string | null;
  username: string | null;
  started_at: string;
  finished_at: string | null;
  status: string;
  count: number;
  message: string | null;
  has_more: number;
};
export type WorkspaceInfo = { id: string; name: string; createdAt: string };
export type Workspace = {
  content: Content[];
  sources: Source[];
  boards: Board[];
  bookmarks: Bookmark[];
  favorites: string[];
  runs: Run[];
  connection: {
    connected: boolean;
    username?: string;
    version?: string;
    verifiedAt?: string;
  };
  running: string[];
};
export const number = (value: number | null) =>
  value === null
    ? "미제공"
    : new Intl.NumberFormat("ko-KR", {
        notation: value >= 10000 ? "compact" : "standard",
        maximumFractionDigits: 1,
      }).format(value);
export const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "아직 없음";
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json", "X-Workspace-Id": new URLSearchParams(location.search).get("workspace") || "default" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data;
}
export function exportCsv(items: Content[]) {
  const cell = (v: unknown) =>
    `"${String(v ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  const rows = [
    ["플랫폼", "계정", "내용", "게시일", "좋아요", "댓글", "원문", "수집일"],
    ...items.map((c) => [
      c.platform,
      c.author,
      c.caption,
      c.publishedAt,
      c.likes,
      c.comments,
      c.sourceUrl,
      c.collectedAt,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `aialy-contents-watcher-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
