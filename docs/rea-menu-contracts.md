# 메뉴별 설계 조사 계약과 증거

조사일: 2026-10-13. 범위: 사용자 요청의 10개 메뉴. 원본의 화면·업무 흐름을 기준선으로 독립 구현하며, 원본 서버 API를 우리 서비스의 수집기로 사용하지 않는다. 이 문서는 구현 완료 보고가 아니라 원본에서 확인한 계약과 미확인 항목이다.

## 증거의 구분과 한계

- **REA 정적 분석**: `docs/rea-evidence.json`, `.research/rea-analysis.json`. REA 저장소 commit `7711b0000592aa80c7b0412004150313f78feabc`, Evidence `ev_ea2ba4fe1f8706f6fb1eab58dbdd8363616f3161c668160b1eafc657a3fb4e78`. 12개 선택 번들/755,749 bytes, 파싱 실패 0. 8개 파일의 semantic graph가 결과 예산 한도에 걸렸으므로 전체 호출 연결 복원은 **partial**이다.
- **직접 정적 확인**: `.research/captured`의 이미 확보된 배포 JS를 문자열 검색 후 주변 함수까지 읽었다. 아래 E01–E23은 이번 조사에서 생성한 파일 SHA-256/UTF-8 0-based byte offset 증거다. REA가 복원한 사실인 것처럼 섞어 쓰지 않는다.
- **저장된 화면 관찰**: `.research/contents.txt`, `brands.txt`, `creators.txt`, `bookmarks.txt`의 accessibility snapshot. 첫 4개 메뉴에만 존재하며 이번 작업에서 새로 브라우저를 실행하거나 원본 API를 호출하지 않았다. 카드 숫자·계정은 해당 스냅샷의 상태일 뿐 현재 시장 지표로 재사용하지 않는다.
- **배포된 설명문**: `a42d6d5e2f88450c.js`의 feature catalog와 `c83cc18336300f30.js`의 공개 기능 설명. 제품이 주장하는 기능이며 모든 조작·수집 성공을 입증하지 않는다. 특히 feature mock의 데이터는 실제 수집 자료가 아니다.
- **확인하지 않은 것**: 원본 서버 코드, 수집 계약/공급자, 전체 플랫폼 커버리지, 업데이트 SLA, 권한 검사·원자성·스케줄 실제 실행, 1년 소급 수집의 완전성. 클라이언트 함수/URL에 `els`, `unipile` 등이 보이더라도 현재 수집 공급자를 확정하지 않는다.

REA 결과를 사람이 검토해야 하는 사례: 그래프의 `endpoint`에는 URLSearchParams의 `get("email")`, `get("returnTo")` 같은 후보가 들어가고 `preload:"auto"/"metadata"`도 `electron-preload` 후보가 된다. 이 후보만으로 네트워크 연결이나 Electron 구조를 주장하면 안 된다. 반면 `fetch("/api/meta-ads/keyword-collect", …)`는 REA 노드 `jag_node_287e4ac5af502a989b486a10064203793bc1eccb34ce29c424bfc16e351cad26`의 AST source range `2b47d45e8ded889c.js` 1:12461–1:12616에서 직접 확인된다. 이것도 호출 성공/공급자 증거는 아니다.

## 전체 업무 흐름

원본은 **Discover에서 넓게 발견 → Research에서 같은 조건으로 수치·목록을 조사 → 관심 대상을 추적 등록 → 멘션/자사 계정으로 계속 관찰 → 북마크로 레퍼런스를 정리**하는 구조다. 이것은 아래 화면·라우트·scope builder를 종합한 해석이며 새로 설계한 메뉴 체계가 아니다.

컨텐츠 허브는 동일 검색어의 광고/소셜/상품을 섞어 보여 주지만, 소셜 게시물 Research는 조건에 해당하는 자료의 집계·내보내기를 강조한다. 브랜드 허브는 브랜드를, 크리에이터 허브는 계정을 비교하는 별도의 투영이다. 추적 관리에서 등록한 자사 계정은 브랜드 멘션에서 제외하는 기준이면서 자사 성과 메뉴에서는 포함 대상이 된다.

## 10개 메뉴 계약

### 1. 컨텐츠 허브 — `/service/discover/contents`

**관찰**: 검색창, 이미지 검색, 전체/META광고/소셜포스팅/상품정보 탭, 기간·채널·필터, 혼합 카드, 북마크, 상세 보기. 소셜 카드에는 작성자·상대 게시일·팔로워·채널·본문 발췌·조회/좋아요/댓글·협찬 표식이 나타난다. 광고는 집행기간/CTA/랜딩, 상품은 판매처/순위/가격을 사용한다. 카드 중간에 동일 검색어로 Research 진입을 제안한다. `contents.txt` 및 E01–E03.

**정적 계약**: URL은 `q`, `tab`, `days`를 전달한다. organic scope는 `screen:search`, 기간, keyword, `matchMode:expanded`, `searchFields:[body,account,author]`, platforms, 선택 brands/categoryTerms/hashtags/countries/languages/formats. `sort`는 소셜에서 recent→latest, popular→popular, views→view, likes→like, comments→comment로 매핑된다. 광고는 기본 active만, recent/popular를 recent/duration으로 변환한다. likes/views/comments 정렬이면 광고 lane을 빼고, oldest/longest면 소셜 lane을 뺀다. 국가/언어/형식 등의 필터가 있을 때 상품 lane을 숨기는 조건도 있다(E02).

**독립 구현 기준**: 카드 유형별 필드를 보존하고 검색 상태를 상세 닫기/뒤로 가기 후 복원한다. 선택한 필터가 적용되지 않는 자료 유형을 무조건 섞어 넣지 않는다. 이미지·유사도 검색은 실제 검색 구현 전에는 준비 상태를 표시한다. 원본의 일시적 검색 결과를 우리 데이터로 저장하지 않는다.

**미확인**: 이미지 임베딩/중복 유사도 모델, 검색 관련도 공식, 인기 정렬 가중치, 원본 infinite scroll의 완전한 실패/재시도 UX.

### 2. 브랜드 허브 — `/service/discover/brands`

**관찰**: 브랜드 이름 Enter 검색, 기간, 제품군, 필터, 언급순 정렬, 전체/즐겨찾기, 표의 브랜드·언급·도달·인기 글, 페이지 이동. 반복 문구를 여러 계정이 올린 브랜드를 순위에서 제외했다는 문구도 실제 저장 화면에 있다. `brands.txt`, E04–E06.

**정적 계약**: 상세 딥링크는 `?brand=<name>&scope=all`. 브랜드 계정 조회는 동일 period/brand/channel/country/categoryTerms, size 10을 전달한다. rank scan 상수는 200, overview 카드 4, sample 12. 품질 보정 helper는 현재 30일에만 조건부로 중복문구 기준 수치를 표시하며 `copyPosts/posts >= 0.1`을 쓰는 코드가 있다. 이것은 완전한 부정행위 판정 모델이 아니다.

**독립 구현 기준**: 목록 → 브랜드 상세에서 언급 추이/연관 계정/광고/상품으로 이어지게 한다. 원본 favorites는 컨텐츠 폴더 북마크와 별도 `brands[]` 모델이다. 브랜드 별칭·공식 계정은 근거와 함께 관리하고 집계 조건을 표/상세에서 일치시킨다. 중복/자동 게시 의심 제거는 원본의 임계값을 곧바로 사실 판정으로 복제하지 말고 보정 적용 여부와 원시 건수를 함께 남긴다.

**미확인**: 브랜드 canonical dictionary 원본 데이터, reach의 원본 집계 의미와 중복 제거 단위, 실제 품질 분류 파이프라인.

### 3. 크리에이터 허브 — `/service/discover/creators`

**관찰**: 키워드·계정 ID·닉네임 입력 후 Space로 칩, 발굴/채널/필터, 최소 포스팅 수, 최근 30일 총반응순, Excel, 전체/즐겨찾기. 표는 팔로워·30일 평균 조회·팔로워당 반응·포스팅·최근 글. `creators.txt`, E07–E09.

**정적 계약**: 딥링크 `channel`+`account`, 또는 `sort`, `keyword`. filter builder는 channels, markets, min/maxFollower, genders, ageRanges, statRanges, createdSinceMs를 전달한다. 뷰는 stats30d와 beautyProfile, monthlyPostCounts/topBrands를 사용한다. 즐겨찾기 key는 정규화한 platform+account이며 브랜드/크리에이터 favorites 각각 최대 200개.

**지표**: 팔로워당 반응 = 최근 30일 `(likes+comments+shares+saves)/postCount/followerCount*100`. 글수 또는 팔로워가 양수가 아니면 null. 저장된 engagementRate를 읽을 때도 postCount>0 조건이 있다. 이는 게시물 반응률 `(likes+comments)/views*100`과 다르며 두 이름/분모를 섞으면 안 된다. 후자는 views<=0이면 null(E08, E20).

**독립 구현 기준**: 폴더 북마크와 계정 즐겨찾기를 분리한다. 계정 상세에서 최근 글/반응/추세/언급 브랜드를 확인하고 추적 등록으로 연결한다. 없어진 지표·공급되지 않는 팔로워는 0으로 만들어 순위를 왜곡하지 않는다.

**미확인**: 팔로워 최신성, 국가·성별·나이 추정의 근거/정확성, 유사 크리에이터 추천 방식, Excel 전체 컬럼과 플랜별 범위.

### 4. 북마크 — `/service/discover/bookmarks`, `/<folderId>`

**관찰**: 새 폴더, 컨텐츠보드/비교리포트, 보드 검색, 최근 활동순, 폴더 카드. 저장 화면은 빈 폴더여서 실제 이동·복사·공유 성공은 미검증. `bookmarks.txt`, E10–E11.

**정적 계약**: `/api/fs/bookmark/folder-create|folder-update|folder-delete|post-add|post-remove`의 클라이언트 래퍼 존재. 폴더 생성은 workspaceId/title/createdBy, 수정은 folderId/title/updatedBy, 항목 추가는 workspaceId/folderId/postId/updatedBy를 검증한다. `isAdBookmarkDoc`, `isPostBookmarkDoc`, `isProductBookmarkDoc`으로 유형을 구분한다. 공개 feature 설명은 폴더 이동·복사/외부 공유를 명시한다.

**독립 구현 기준**: 원본 링크와 콘텐츠 ID를 가진 폴더 항목, 폴더 이름/설명·종류·활동일, 삭제/이동/복사, 기본 비교보드를 영속 저장한다. 로컬 UI 즐겨찾기만으로 이 메뉴를 대체하지 않는다. 공유 링크는 우리 서버의 실제 접근 범위를 설계한 후 제공한다.

**미확인**: 폴더 공유 권한/링크 만료·회수, 서버 원자성, 비교리포트 상세 구성, 원본의 항목 이동이 복사+삭제인지 여부.

### 5. 소셜 게시물 — `/service/research/social`

**관찰 범위**: 별도 실화면 snapshot 없음. 배포 feature 설명은 언급수·도달·반응률·채널 비중, 브랜드/성분/피부고민/제품군 추천, 도달순/최신순, 선택 열 Excel을 명시한다(E12). 컨텐츠 허브의 Research 링크는 저장된 실제 화면에서 확인했다.

**정적 계약**: 공통 `/api/els/moments` proxy에 `feed.page`, `dashboard.stats`, `collection.count`, `collection.dailyCount`, `ranking.rawField` 등 op를 보내는 함수가 있다(E13). feed는 posts 배열을 확인하며, dailyCount는 날짜별 수/채널별 수를 읽는다. 페이지 상수 40, 필터 debounce 400ms, 결과 창 10,000, 일반 documentLimit 6,000이 있다(E14). 이는 DB/전체 자료 크기 증거가 아니다.

**독립 구현 기준**: 검색 조건을 하나의 scope로 만들어 집계·목록·내보내기에서 공유한다. 표본으로 계산한 합계와 전체 조건 집계를 구분한다. 해시태그뿐 아니라 body/account/author 등 어디서 일치했는지 보존한다. 집계는 우리가 수집한 자료 범위를 표시한다.

**미확인**: 전체 Research 필터 UI, 추천 사전·다국어 확장 규칙, reach 산식, export 상한/서버 pagination 실제 동작.

### 6. 메타 광고 — `/service/research/ads`

**관찰 범위**: 별도 실화면 snapshot 없음. 허브의 실제 광고 카드와 배포 설명을 확인. 설명은 브랜드·카피 검색, 이미지/영상·집행상태, 소재 나란히 비교, 카피/CTA/랜딩/집행기간을 명시한다(E12).

**정적 계약**: metaKeys는 ad-list/ad-facets/ad-detail 캐시 키를 분리한다. 상세는 adId로 읽고 응답 creative.id 일치를 확인한다. `/api/meta-ads/keyword-collect` POST는 keyword collection의 streaming 또는 JSON 응답을 처리하며 `configured:false`를 별도 unconfigured 상태로 돌려준다. 유사 광고 요청에는 adId/phash/imageUrl/maxDist/sigMaxDist/template/clip/activeOnly/beautyOnly 등이 있다(E15–E16). 공급자/모델은 미확정이다.

**독립 구현 기준**: 광고 소재와 소셜 게시물을 분리 저장하고 실행기간·active/unknown·CTA/랜딩을 보여준다. 수집 미구성/실행중/실패를 성공·0건으로 표시하지 않는다. 광고가 오래 집행됐다는 사실을 ROAS/전환 성과로 번역하지 않는다.

**미확인**: 원본 광고 데이터 공급자, 수집 비용/지역 범위, 실제 스트리밍 상태 필드 전체, 지출·성과 자료 가용성.

### 7. 추적 관리 — `/service/tracking`

**정적 계약**: 3개 그룹 `brandKeyword`(우리 브랜드 키워드), `brandAccount`(자사 계정), `targetKeyword`(경쟁사/시장 키워드·계정 SET). `useStatusGroupsModel`이 별도 rows/used/limit/locked/capacity/registerInitial을 구성한다. 등록 intent는 `add`, `q`, `ch`, `ac`, `nm`; brandKeyword→type brand, brandAccount→type account/accountOwner own, username이 있는 target→accountOwner other, 나머지 keyword. 관리 URL은 kind/editSet/exclude/link를 받는다(E17–E18).

**독립 구현 기준**: 검색 결과에서 추적하기를 누르면 대상과 소유구분이 채워진 등록 UI로 진입한다. 등록 상태와 수집 상태를 분리하고 키워드 SET과 단일 자사 브랜드/계정을 다른 레코드로 저장한다. 수집량·최종 수집시각·에러·갱신 이력을 보여준다. 자체 운영에 원본 판매 플랜 gating을 복제할 필요는 없지만 자원 한도/상태 모델은 구현 결정으로 명시한다.

**미확인**: 등록 시 백필·주기 수집 job 생성의 서버 트랜잭션, retry/idempotency, 원본 삭제 시 데이터 보존, 수집 주기. 공개 설명의 1년 백필/매일 갱신은 독립 공급자 계약으로 검증해야 한다.

### 8. 브랜드 멘션 추적 — `/service/tracking/brand-mentions`

**정적 계약**: `buildBrandScope`는 keywords+taggedAccounts+optional link text, topicKeywords/canonicalBrands, period/platforms/countries/languages, persona(adsEval/officialOnly), excludeAccounts/keywords, metricMin/refineText/refineFields, story branch, negativeMention을 갖는다. ownAccountPairs는 excludeAccounts로 전달한다. username 변경 이력도 검색어/태그 계정 확장에 포함된다(E19).

**배포 설명**: 언급추이·채널/국가·브랜드 랭킹, 최근 24시간 부정 반응, Slack/이메일 조건·주기, 보고 있는 조건으로 Excel. 실제 화면/알림 실행은 미검증(E21).

**독립 구현 기준**: Fraijour/프레쥬 등 자사 키워드·계정·과거 사용자명을 명시적으로 관리하고 외부 언급과 자사 글을 분리한다. 부정 판정에는 원문·근거 구절·분류 시각·검토 여부를 남긴다. Slack/이메일은 별도 발송 승인/설정 후 구현하며 현 조사에서 발송하지 않는다.

**미확인**: 감성·뷰티·협찬 분류 모델, 링크 본문 수집 범위, 원본 알림 dedupe·재발송 계약, Story 가용성.

### 9. 타겟 멘션 추적 — `/service/tracking/target-mentions`, `/<setId>`

**정적 계약**: `buildKeywordScope`는 campaignKeywords/campaignAccountPairs, 선택 chipKeywords/chipAccountKeys, mandatoryKeywords/excludeKeywords, beauty filter, persona/국가/언어/채널·서브타입·수치/본문 조건을 만든다. keyword 칩을 고르면 전체 계정 리스트가 아닌 선택 키워드 scope를, account 칩을 고르면 선택 계정 scope를 사용한다. keyword-campaign create-many/update/delete 래퍼도 있다(E19, E22).

**독립 구현 기준**: 경쟁 브랜드/성분/피부고민/제품유형별 SET에 키워드와 계정을 함께 묶고 SET 전체 또는 칩 하나의 집계/포스팅을 탐색한다. 포함어·필수어·제외어는 서로 다른 필드다. SET 이름 변경/조건 변경/삭제를 영속화하고 변경 후 새 자료의 일치 근거를 재현할 수 있게 한다.

**미확인**: include/mandatory 다중 키워드의 서버 AND/OR·언어 정규화 정확한 규칙, 과거 조건 변경 시 백필/재분류 동작, SET 한도의 서버 강제.

### 10. 자사 계정 관리 — `/service/operations/accounts`

**정적 계약**: 등록 계정은 platform/username/url/accountHistory로 정규화한다. collection-account helper는 계정과 과거 이름을 사용하며, account activity/post count/posts/top posts 등의 독립 읽기 함수가 있다. 연결 상태 라벨은 broken/unlinked/connected. 배포 설명은 팔로워/조회/반응 변화, 계정 비교, 최근 7일 도달 상승 콘텐츠, 연동 후 Story·태그된 글을 명시한다(E23).

**독립 구현 기준**: 자사 계정 목록, 연결 상태·수집 상태, 게시물 목록, 기간별 지표, snapshot 이력, 비교 계정 선택을 제공한다. 자사 인증으로만 제공되는 private insights와 공개 경쟁계정 지표를 구분한다. 연결했다고 과거 Story까지 보장하지 않는다.

**미확인**: 원본 연결 provider/토큰 수명/재연결 계약, 도달 변화 계산 방식, 계정 비교 기준, 연결에 필요한 실제 scope.

## 우리 구현의 공통 데이터 계약 (원본 서버의 사실이 아닌 구현 권고)

`Content`는 source/platform/nativeId/url/kind(authoritative ad, social, product)/author/publishedAt/body/media/capturedAt를 가진다. `MetricSnapshot`은 contentId/observedAt/각 nullable metric/source를 가진다. `Brand`는 canonicalName/aliases/officialAccounts; `Creator`는 platform+nativeAccountId/usernameHistory; `TrackingSet`은 kind/name/keywords/mandatory/excluded/accounts/active; `TrackingMatch`는 setId/contentId/matchField/matchText/version; `BookmarkFolder`와 `BookmarkItem`은 workspace 단위; `CollectionRun`은 connector/scope/start/end/status/cursor/error/coverage를 가진다.

같은 자료로 허브·Research·추적 결과를 투영하면 원본의 화면 간 연속성을 살릴 수 있다. 게시물 ID 중복 제거와 metric snapshot 누적은 별개다. 추적 등록, 폴더 변경 등 사용자 작업은 서버 검증/원자성/idempotency를 우리 구현에서 정의해야 한다. 원본 정적 클라이언트만 보고 이미 보장된 것으로 가정하지 않는다.

## 완료/잔여 체크리스트

| 질문 | 현재 상태 | 다음 검증 |
|---|---|---|
| 10개 메뉴 역할·라우트 | 정적 근거로 확인 | 각 페이지 실제 route/뒤로가기 |
| Discover 4개 화면의 목록 구성 | 저장된 실행 관찰 있음 | 필터·상세·빈 결과·저장 동작 |
| Research/추적/자사계정 상세 UX | 부분 확인 | 로그인 브라우저에서 각 메뉴 읽기·상세 탐색 |
| 팔로워당 반응/게시물 반응률 | 정적 공식 확인 | 실제 지표 source와 null 표시 |
| bookmark/SET/owned 모델 구분 | 정적 확인 | 쓰기 API는 우리 서비스에서 구현·검증 |
| 원본 소스 공급자·수집 범위 | 미확인 | 원본에 의존하지 않는 자체 connector 계약 |
| 자체 서비스 지속 업데이트 | 이 문서로 검증 안 됨 | 직접 소스 연결, 최초 실제 수집, 재실행·중복·실패 복구 |
| 원본 모든 기능 재현 완료 | 아님 | 화면별 동작과 우리 데이터 연결을 별도 수용 기준으로 검증 |

## 재현 가능한 정적 증거 색인

아래 offset은 파일 UTF-8 bytes의 0-based 위치다. 파일 내용이 바뀌면 SHA-256으로 재확인한다. 짧은 검색 문자열을 앵커로 사용했으며 의미 해석은 앵커 앞뒤 함수까지 읽은 결과다.

| ID | 파일 `.research/captured/` | byte offset | 문자열 앵커 | SHA-256 |
|---|---|---:|---|---|
| E01 | `187c3da7dabfbd46.js` | 8253 | `contents:` | `9b9484a3aee3ddfee4a907e6d6c6b142691df5f23269538eda346ecf59d2cf5f` |
| E02 | `5cebf18f36467c50.js` | 36496 | `toMediaOrganicScope` | `7e865e7cfbbfa68b7be030e12d14efa57ffc0f1a08aa12ac0d147d5b72bffad4` |
| E03 | `d4d55e648cf8e516.js` | 21609 | `SearchAllView` | `6213fda67c82a6227bcb7a4c1ace3fef44aad2d8565420d9a3fb0c82a7069f6c` |
| E04 | `187c3da7dabfbd46.js` | 8531 | `brandFresh:` | `9b9484a3aee3ddfee4a907e6d6c6b142691df5f23269538eda346ecf59d2cf5f` |
| E05 | `5cebf18f36467c50.js` | 42322 | `brandHubAccountsRequest` | `7e865e7cfbbfa68b7be030e12d14efa57ffc0f1a08aa12ac0d147d5b72bffad4` |
| E06 | `9b364c3adbbd9b69.js` | 25453 | `uniqueMentionsHint` | `4e302e3599634459346b8bb94c4069c5881c8bf7ac8a65b34fe1efa58f977763` |
| E07 | `9b364c3adbbd9b69.js` | 29023 | `createdSinceMs:c` | `4e302e3599634459346b8bb94c4069c5881c8bf7ac8a65b34fe1efa58f977763` |
| E08 | `5cebf18f36467c50.js` | 13003 | `FOLLOWER_ENGAGEMENT_FORMULA` | `7e865e7cfbbfa68b7be030e12d14efa57ffc0f1a08aa12ac0d147d5b72bffad4` |
| E09 | `5cebf18f36467c50.js` | 19870 | `HUB_BOOKMARK_MAX` | `7e865e7cfbbfa68b7be030e12d14efa57ffc0f1a08aa12ac0d147d5b72bffad4` |
| E10 | `9b364c3adbbd9b69.js` | 81359 | `/api/fs/bookmark/post-add` | `4e302e3599634459346b8bb94c4069c5881c8bf7ac8a65b34fe1efa58f977763` |
| E11 | `81729943ac8d4ecd.js` | 69320 | `isAdBookmarkDoc` | `cdd5cddaf13b1e39b88ca31dce2788de189261f23bbe9a9ada93ffe7746320fc` |
| E12 | `a42d6d5e2f88450c.js` | 43056 | `id:"social"` | `8a5c76c2d4fcea4dc1402d60a248489764c2b96cb18ac340e6f1ce8a2dcc46fd` |
| E13 | `468c1f8c0e0f3f22.js` | 4934 | `/api/els/moments` | `845f498c3cf20b027bfd69b95c5837187350e56a1c798af400a6d0a5bd6594a0` |
| E14 | `2b47d45e8ded889c.js` | 10775 | `MOMENT_FEED_PAGE_SIZE` | `d5de50fdab4d1581e1269a238e72f4c783dc6b736729f2d22ab8a722dd45e2ce` |
| E15 | `2b47d45e8ded889c.js` | 12516 | `/api/meta-ads/keyword-collect` | `d5de50fdab4d1581e1269a238e72f4c783dc6b736729f2d22ab8a722dd45e2ce` |
| E16 | `abcf4a73eeb7a0d1.js` | 75485 | `metaKeys` | `5ad50fbac5423644f058100cadab865c09f603a38fa8dd9d63968fb7ba2d62c2` |
| E17 | `5cebf18f36467c50.js` | 34145 | `useStatusGroupsModel` | `7e865e7cfbbfa68b7be030e12d14efa57ffc0f1a08aa12ac0d147d5b72bffad4` |
| E18 | `06bcdea56e7bb864.js` | 15537 | `toTrackRegisterInitial` | `0dfafa04ecb338ec871d0bc3d9758581044b1e1cfacc8e312098cc75f4e2b532` |
| E19 | `85ed745c6e2cf02c.js` | 37381 | `buildKeywordScope` | `16acc3f880d804606cd036ed3247936ffe9c7c5a435a52dc301f049db6d94c2e` |
| E20 | `81729943ac8d4ecd.js` | 65905 | `ENGAGEMENT_RATE_FORMULA` | `cdd5cddaf13b1e39b88ca31dce2788de189261f23bbe9a9ada93ffe7746320fc` |
| E21 | `a42d6d5e2f88450c.js` | 45042 | `id:"mention"` | `8a5c76c2d4fcea4dc1402d60a248489764c2b96cb18ac340e6f1ce8a2dcc46fd` |
| E22 | `9b364c3adbbd9b69.js` | 44065 | `/api/fs/keyword-campaign/create-many` | `4e302e3599634459346b8bb94c4069c5881c8bf7ac8a65b34fe1efa58f977763` |
| E23 | `5cebf18f36467c50.js` | 22489 | `연동 끊김` | `7e865e7cfbbfa68b7be030e12d14efa57ffc0f1a08aa12ac0d147d5b72bffad4` |
