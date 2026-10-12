import { z } from "zod";

export class ProviderError extends Error {
  constructor(message, retryable = false, status = 502) {
    super(message);
    this.retryable = retryable;
    this.status = status;
  }
}
const httpsUrl = z
  .string()
  .url()
  .refine((v) => new URL(v).protocol === "https:")
  .nullable();
const mediaSchema = z.object({
  id: z.string(),
  caption: z.string().optional(),
  media_type: z.string(),
  media_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  permalink: z.string().url(),
  timestamp: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/,
    )
    .refine((v) => Number.isFinite(Date.parse(v))),
  like_count: z.number().nonnegative().optional(),
  comments_count: z.number().nonnegative().optional(),
  children: z
    .object({
      data: z.array(
        z.object({
          id: z.string(),
          media_type: z.string(),
          media_url: z.string().optional(),
          thumbnail_url: z.string().optional(),
        }),
      ),
    })
    .optional(),
});
const mediaFields =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}";
const imageUrl = (v) => {
  const r = httpsUrl.safeParse(v || null);
  return r.success ? r.data : null;
};
export function normalizeMedia(input, profile, at = new Date().toISOString()) {
  const m = mediaSchema.parse(input);
  return {
    id: `instagram:${m.id}`,
    platform: "Instagram",
    platformId: m.id,
    author: profile.username,
    authorName: profile.name || profile.username,
    authorId: profile.id,
    avatar: imageUrl(profile.profile_picture_url),
    title: m.caption?.split("\n")[0] || `${profile.username}의 게시물`,
    caption: m.caption || "",
    kind:
      m.media_type === "VIDEO"
        ? "video"
        : m.media_type === "CAROUSEL_ALBUM"
          ? "carousel"
          : "image",
    thumbnail: imageUrl(
      m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
    ),
    videoUrl: m.media_type === "VIDEO" ? imageUrl(m.media_url) : null,
    sourceUrl: m.permalink,
    publishedAt: m.timestamp,
    collectedAt: at,
    views: null,
    likes: m.like_count ?? null,
    comments: m.comments_count ?? null,
    children: (m.children?.data || []).map((c) => ({
      id: c.id,
      kind: c.media_type,
      thumbnail: imageUrl(
        c.media_type === "VIDEO" ? c.thumbnail_url : c.media_url,
      ),
      videoUrl: c.media_type === "VIDEO" ? imageUrl(c.media_url) : null,
    })),
  };
}
export function createInstagramClient(
  config,
  {
    fetchImpl = fetch,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  } = {},
) {
  const c = z
    .object({
      token: z.string().min(10),
      accountId: z.string().regex(/^\d+$/),
      version: z.string().regex(/^v\d+\.0$/),
    })
    .parse(config);
  async function request(fields) {
    const url = new URL(
      `https://graph.facebook.com/${c.version}/${c.accountId}`,
    );
    url.searchParams.set("fields", fields);
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try {
        response = await fetchImpl(url, {
          headers: { Authorization: `Bearer ${c.token}` },
          signal: AbortSignal.timeout(20000),
          redirect: "error",
        });
      } catch {
        if (attempt < 2) {
          await sleep(1000 * 2 ** attempt);
          continue;
        }
        throw new ProviderError(
          "Meta 연결 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
          true,
        );
      }
      let body;
      try {
        body = await response.json();
      } catch {
        throw new ProviderError("Meta 응답 형식을 확인할 수 없습니다.");
      }
      if (response.ok && !body.error) return body;
      const code = body.error?.code;
      if (code === 190)
        throw new ProviderError(
          "Instagram 연결이 만료되었거나 토큰이 유효하지 않습니다. 다시 연결해 주세요.",
          false,
          401,
        );
      if ([10, 200].includes(code))
        throw new ProviderError(
          "Business Discovery 조회 권한이 없습니다. Meta 앱 권한과 계정 연결을 확인해 주세요.",
          false,
          403,
        );
      const retryable =
        response.status === 429 ||
        response.status >= 500 ||
        [4, 17, 32, 613].includes(code);
      if (retryable && attempt < 2) {
        const wait = Number(response.headers.get("retry-after"));
        await sleep(
          Number.isFinite(wait) && wait > 0
            ? Math.min(wait * 1000, 30000)
            : 1000 * 2 ** attempt,
        );
        continue;
      }
      throw new ProviderError(
        retryable
          ? "Meta 요청 한도 또는 일시 오류입니다. 다음 수집에서 재시도합니다."
          : "계정을 조회할 수 없습니다. 사용자 이름, 공개 프로페셔널 계정 여부와 앱 권한을 확인해 주세요.",
        retryable,
      );
    }
  }
  return {
    async verify() {
      const r = await request("id,username");
      if (!r.id || !r.username)
        throw new ProviderError(
          "Instagram 프로페셔널 계정 ID를 확인해 주세요.",
        );
      return { id: String(r.id), username: r.username };
    },
    async collect(username) {
      if (!/^[a-zA-Z0-9._]{1,30}$/.test(username))
        throw new ProviderError("Instagram 사용자 이름을 확인해 주세요.");
      let cursor = null,
        profile = null,
        items = [],
        hasMore = false;
      for (let page = 0; page < 4; page++) {
        const after = cursor ? `.after(${cursor})` : "";
        const data = await request(
          `business_discovery.username(${username}){id,username,name,biography,profile_picture_url,followers_count,media_count,website,media.limit(25)${after}{${mediaFields}}}`,
        );
        const p = data.business_discovery;
        if (!p?.id || !p?.username || !Array.isArray(p.media?.data))
          throw new ProviderError(
            "이 계정의 게시물을 조회할 수 없습니다. 공개 프로페셔널 계정인지 확인해 주세요.",
          );
        profile = {
          id: String(p.id),
          username: p.username,
          name: p.name || p.username,
          biography: p.biography || "",
          avatar: imageUrl(p.profile_picture_url),
          followers: p.followers_count ?? null,
          mediaCount: p.media_count ?? null,
          website: imageUrl(p.website),
        };
        items.push(...p.media.data.map((m) => normalizeMedia(m, p)));
        const previousCursor = cursor;
        cursor = p.media.paging?.cursors?.after;
        // Nested Business Discovery edges may return only cursors, without a next URL.
        hasMore =
          p.media.data.length > 0 && Boolean(cursor || p.media.paging?.next);
        if (hasMore && cursor === previousCursor)
          throw new ProviderError(
            "페이지가 진행되지 않아 수집을 중단했습니다. 기존 데이터는 유지됩니다.",
          );
        if (!hasMore) break;
        if (!cursor || !/^[a-zA-Z0-9_=\-]+$/.test(cursor))
          throw new ProviderError(
            "다음 페이지 커서를 확인할 수 없습니다. 기존 데이터는 유지됩니다.",
          );
      }
      return {
        profile,
        items: [...new Map(items.map((i) => [i.id, i])).values()],
        hasMore,
        scope:
          "최근 최대 100개 게시물. 전체 이력과 삭제 여부는 확인하지 않습니다.",
      };
    },
  };
}
