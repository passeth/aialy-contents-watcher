---
format: 1920x1080
duration: 89s
message: "콘텐츠 모니터링은 한 번의 검색이 아니라, 고객의 표현을 따라가며 검증하고 작게 실험하는 반복 습관이다"
arc: how-to-process (12 steps on one consistent stage) → loop → honest scope note
audience: 브랜드 마케팅을 배우는 화장품 제조사 실무자
mode: autonomous
music: none
narration: ko · ElevenLabs `seulki` voice · SCRIPT.md
---

## Video direction

- **Readable without sound, narrated on request.** The film was built silent, and each frame's
  on-screen headline plus one supporting line still carries the whole lesson. After the first
  delivery the user asked for narration, so each frame now has one short Korean line in the
  ElevenLabs `seulki` voice (`SCRIPT.md`, `assets/voice/NN.mp3`). Each line is timed to finish
  before the next transition. Frame timing and reveals did not change. There is still no BGM and
  no SFX (`music: none`, no `sfx:`).
- **Palette (frame.md):** paper ground + forest ink for step frames; forest ground for gravity
  frames (01 hook, 10 hypothesis, 13 scope). Lime = the single accent (active pill, highlighter,
  travelling dot). Fog = card surface.
- **Consistent stage:** every step frame (02–12) carries the same topbar — forest step pill
  (`NN / 12 · 단계명`), a 12-segment progress rail, and the fog `교육용 예시` pill on the right.
  Same pixels in every frame, so crossfades keep the chrome still and only the step changes.
  Headline sits top-left at y≈150; the visual owns y 330–880.
- **Motion grammar:** power3.out entrances, staggered pill pops (scale 0.85→1 + fade), SVG flow
  lines that draw on (stroke-dashoffset), lime highlighter sweeps (scaleX from left), a single
  travelling lime dot on the loop. Reveals follow reading order across each frame; the last ~1.5s
  of every frame is a held read. No bounce, no floating/breathing loops, no exits (except 13).
- **Rhythm:** held/breather frames are 09 (bookmark, short and calm) and 13 (scope, a still read).
  The densest builds are 06–08, where the method actually happens.
- **Honesty layer:** every keyword/brand/creator is a hypothetical example and is labeled. No
  counts, percentages, charts with values or growth arrows. Creator links are "함께 언급됨"
  observations, never sponsorship claims. The search UI is a generic illustration, not an app
  screenshot. The closing frame states what the current app does (reads registered professional
  Instagram accounts) and what is not connected yet (global keyword discovery, automatic Meta
  ads collection).
- **Negative list:** shadows, gradients, glow, purple "AI" bokeh, stock icons, real logos, real
  screenshots, numbers that read as data, slideshow front-loading, screensaver drift.

## Frame 1 — Hook

- scene: Forest ground; heavy headline "콘텐츠 모니터링, 어디서부터?" builds word by word while customer-language pills drift into a lane below
- voiceover: "콘텐츠 모니터링, 어디서부터 시작할까요? 고객이 쓰는 말에서 출발합니다."
- duration: 5.5s
- poster: 4.5s
- transition_in: cut
- status: animated
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Question hook + curiosity gap
- beat: curiosity
- blueprint: kinetic-type-beats (Adapt)
- focal: the two-line headline
- roles: headline = foreground subject · drifting language pills = supporting · forest field = background

narrativeRole: Names the skill being taught and the audience (제조사) in one glance.
keyMessage: 고객이 쓰는 말 속에 다음 제품의 단서가 있다 — 그 말을 찾는 방법을 배운다.

Adapt: keep the statement-builds-in-beats signature; payoff is a lime pill row instead of a logo.
Scene 1 (0.0–1.6s): eyebrow pill "화장품 제조사를 위한 브랜드 마케팅 기초" pops top-left; headline line 1 "콘텐츠 모니터링," rises word-by-word.
Scene 2 (1.6–3.0s): line 2 "어디서부터 시작할까?" rises; lime highlighter sweeps under "모니터링".
Scene 3 (3.0–4.4s): a lane of customer-language pills ("촉촉한데 가벼운", "속당김", "끈적임 없이", "흡수 빠른") slides in from the right below the headline — generic phrases, no brand.
Scene 4 (4.4–5.5s): subline "고객이 쓰는 말에서 다음 제품의 단서를 찾는 법" fades in; hold.

## Frame 2 — Workspace and question

- scene: Three category pills; 스킨케어 turns lime; then a question card types in
- voiceover: "먼저 우리 제품군을 고르고, 시장에 질문을 던집니다. 결론이 아니라, 확인할 질문부터요."
- duration: 8s
- poster: 7s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/02-workspace-question.html
- type: feature_showcase
- persuasion: Narrowing (start small) → Question-first framing
- beat: orientation
- blueprint: grid-card-assemble (Adapt)
- focal: the question card
- roles: category pills = foreground (phase 1) · question card = foreground (phase 2) · topbar = supporting

narrativeRole: Steps 01–02. Start inside one product category, then turn curiosity into a checkable question.
keyMessage: 넓게 보지 말고 우리 제품군에서, 답이 아니라 질문으로 시작한다.

Scene 1 (0.0–1.0s): topbar enters (step pill "01 / 12 · 워크스페이스"); headline "우리 제품군부터 고른다".
Scene 2 (1.0–2.6s): three big pills cascade in left→right: 스킨케어 · 바디케어 · 헤어케어, each with a simple line glyph.
Scene 3 (2.6–3.8s): 스킨케어 fills lime and scales up slightly; the other two dim to fog.
Scene 4 (3.8–5.2s): step pill swaps to "02 / 12 · 질문"; headline swaps to "시장에 질문을 던진다"; pills slide up and shrink into a breadcrumb chip "스킨케어".
Scene 5 (5.2–8.0s): a fog question card grows in; the question types in two lines "요즘 수분크림을 고르는 사람들은 / 어떤 말로 이야기할까?"; a small forest note "결론 말고, 확인할 질문부터"; hold.

## Frame 3 — Search

- scene: Generic search bar types 수분크림; post cards waterfall in below
- voiceover: "그다음, 수분크림 같은 제품 단어로 검색해 봅니다."
- duration: 6.5s
- poster: 5.5s
- transition_in: crossfade
- status: animated
- src: compositions/frames/03-search.html
- type: feature_showcase
- persuasion: Concrete demonstration
- beat: momentum
- blueprint: prompt-type-submit-generate (Adapt)
- focal: the search bar with "수분크림"
- roles: search bar = foreground subject · post cards = supporting · "예시 화면" tag = supporting

narrativeRole: Step 03. Shows the first concrete move — search the product word customers would use.
keyMessage: 제품 카테고리 단어로 먼저 검색해 본다.

Scene 1 (0.0–1.2s): topbar "03 / 12 · 검색"; headline "제품 단어로 검색한다".
Scene 2 (1.2–2.8s): wide paper search bar with forest outline; caret types "수분크림" syllable by syllable; lime search button pops.
Scene 3 (2.8–5.0s): six abstract post cards (fog, image block + text lines, no real content) waterfall in under the bar in two rows.
Scene 4 (5.0–6.5s): small tag "예시 화면 · 실제 앱 화면 아님" fades in at the bar's right; hold.

## Frame 4 — Observe brands

- scene: Brand pills light up on the post cards; 비교 브랜드 A (Reference A, fictional) highlighted; two judgment questions appear
- voiceover: "어떤 브랜드가 보이는지, 누가 올린 글인지 살펴봅니다."
- duration: 6.5s
- poster: 5.6s
- transition_in: crossfade
- status: animated
- src: compositions/frames/04-brands.html
- type: feature_showcase
- persuasion: Observation before interpretation
- beat: noticing
- blueprint: grid-card-assemble (Adapt)
- focal: the 비교 브랜드 A pill
- roles: post cards = supporting · brand pills = foreground · question rail = supporting

narrativeRole: Step 04. Teach to look at who appears around the product word, and who posted it.
keyMessage: 어떤 브랜드가 보이는지, 누가 올린 글인지 관찰한다.

Scene 1 (0.0–1.0s): topbar "04 / 12 · 브랜드 관찰"; headline "어떤 브랜드가 보이는지 본다"; the six cards sit left (carried from frame 3, smaller).
Scene 2 (1.0–2.8s): brand pills pop onto cards: "비교 브랜드 A", "브랜드 B", "브랜드 C", "비교 브랜드 A".
Scene 3 (2.8–4.0s): 비교 브랜드 A pills turn lime; a flow line draws from them to a large "비교 브랜드 A · 예시" pill on the right.
Scene 4 (4.0–6.5s): right rail reveals two check questions: "브랜드가 직접 올린 글인가?" · "외부 계정의 언급인가?"; hold.

## Frame 5 — Discover an expression

- scene: Zoom into a post caption; 수부지 gets a lime highlighter; the word lifts out as a hero pill with its meaning
- voiceover: "글 속에서 고객이 쓰는 표현을 찾습니다. 수부지, 수분 부족형 지성 피부라는 뜻이죠."
- duration: 7s
- poster: 6s
- transition_in: crossfade
- status: animated
- src: compositions/frames/05-expression.html
- type: product_intro
- persuasion: Name the concept (coined customer term)
- beat: discovery
- blueprint: compose
- focal: the 수부지 hero word
- roles: caption card = supporting · highlighter = supporting · 수부지 hero = foreground subject

narrativeRole: Step 05. The pivot of the method — the customer's own word, not the brand's.
keyMessage: 브랜드가 아니라 고객이 쓰는 표현을 발견한다.

Scene 1 (0.0–1.0s): topbar "05 / 12 · 표현 발견"; headline "고객이 쓰는 말을 발견한다".
Scene 2 (1.0–2.6s): a post card (left) shows three caption lines; line 2 reads "…수부지라서 가벼운 게 좋아요…" (example text).
Scene 3 (2.6–3.6s): lime highlighter sweeps behind "수부지".
Scene 4 (3.6–5.2s): "수부지" lifts out to the right as a hero word in a lime pill, with a flow line from the card.
Scene 5 (5.2–7.0s): definition fades in under it: "수분 부족형 지성 피부를 줄여 부르는 말"; small note "이 표현이 우리 제품과 맞닿아 있는가?"; hold.

## Frame 6 — Search the expression on its own

- scene: Breadcrumb 수분크림 + 비교 브랜드 A un-ticks; new query 수부지; results reveal 탄력탱탱 and three creators
- voiceover: "처음 조건을 풀고, 수부지만으로 다시 검색합니다. 함께 쓰인 표현과 작성자가 보이죠."
- duration: 7.5s
- poster: 6.6s
- transition_in: crossfade
- status: animated
- src: compositions/frames/06-research-expression.html
- type: feature_showcase
- persuasion: Re-framing (drop the original filter)
- beat: momentum
- blueprint: compose
- focal: the new 탄력탱탱 pill
- roles: old filter chips = supporting · new query = foreground · creator avatars = supporting

narrativeRole: Step 06. Teach the key move — take the discovered word as a new, independent query.
keyMessage: 처음 조건을 풀고, 발견한 표현으로 다시 검색한다.

Scene 1 (0.0–1.0s): topbar "06 / 12 · 표현으로 재검색"; headline "그 표현으로 다시 검색한다".
Scene 2 (1.0–2.4s): left: filter chips "수분크림" + "비교 브랜드 A" sit in a row; they get struck through and fade (조건 해제).
Scene 3 (2.4–3.6s): a query pill "수부지" drops into a search bar; a flow line runs right.
Scene 4 (3.6–5.4s): results: a lime "탄력탱탱" pill pops, flanked by "함께 등장한 표현" label.
Scene 5 (5.4–7.5s): three creator avatars (circles "작성자 A/B/C") connect to 탄력탱탱 with thin lines; label "이 표현을 쓰는 작성자"; hold.

## Frame 7 — Widen to other expressions

- scene: Flowing node graph — 수부지 at centre, branches to several expressions and creators
- voiceover: "표현은 다른 표현으로 이어집니다. 선은 함께 나왔다는 뜻일 뿐이에요."
- duration: 6.5s
- poster: 5.8s
- transition_in: crossfade
- status: animated
- src: compositions/frames/07-expand.html
- type: feature_showcase
- persuasion: Progressive disclosure (map grows)
- beat: widening
- blueprint: constellation-hub (Adapt)
- focal: the 수부지 hub node
- roles: hub = foreground · expression nodes = supporting · flow lines = supporting

narrativeRole: Step 07. Show that discovery branches — each expression opens another search.
keyMessage: 표현은 다른 표현으로 이어진다 — 하지만 연결선은 '함께 등장'일 뿐이다.

Adapt: keep the nodes-spring-around-a-hub signature; resolve on a caution label instead of a push-in.
Scene 1 (0.0–1.0s): topbar "07 / 12 · 표현 넓히기"; headline "다른 표현으로 넓혀 본다"; hub "수부지" pill seats centre.
Scene 2 (1.0–3.2s): curved flow lines draw out to four nodes one by one: 탄력탱탱 · 속건조 · 가벼운 제형 · 산뜻한 마무리.
Scene 3 (3.2–4.6s): two creator dots link to two nodes each (dashed lines).
Scene 4 (4.6–6.5s): caption chip at the bottom of the graph: "선 = 함께 등장한 관찰 · 의미는 원문에서 확인"; hold.

## Frame 8 — Verify

- scene: Three check cards — 독립 작성자 · 시간 · 원문 근거 — each ticks lime
- voiceover: "서로 다른 작성자가, 여러 시점에, 원문으로 확인될 때만 신호로 봅니다."
- duration: 8s
- poster: 7.2s
- transition_in: crossfade
- status: animated
- src: compositions/frames/08-verify.html
- type: feature_showcase
- persuasion: Rule of three (checklist)
- beat: rigor
- blueprint: grid-card-assemble (Adapt)
- focal: the three check cards
- roles: cards = foreground · check marks = supporting

narrativeRole: Step 08. The discipline that separates a signal from one loud post.
keyMessage: 서로 다른 작성자가, 여러 시점에, 원문으로 확인될 때만 신호로 본다.

Scene 1 (0.0–1.0s): topbar "08 / 12 · 검증"; headline "신호인지 검증한다".
Scene 2 (1.0–3.0s): card 1 "독립 작성자" + "서로 다른 계정인가? 한 캠페인의 반복은 아닌가?"; lime check draws.
Scene 3 (3.0–5.0s): card 2 "시간" + "언제 올라왔나? 한 시점에 몰렸나?"; check draws.
Scene 4 (5.0–7.0s): card 3 "원문 근거" + "원문을 직접 읽었나? 큰 글 한 건의 인상은 아닌가?"; check draws.
Scene 5 (7.0–8.0s): hold.

## Frame 9 — Bookmark

- scene: A post card slides into a bookmark folder; a memo slip with evidence fields stamps on
- voiceover: "원문 링크, 작성자, 게시일, 저장한 이유까지 남깁니다."
- duration: 5.5s
- poster: 4.8s
- transition_in: crossfade
- status: animated
- src: compositions/frames/09-bookmark.html
- type: social_proof
- persuasion: Concretization (what to keep)
- beat: calm
- blueprint: compose
- focal: the bookmark folder + memo
- roles: post card = supporting · folder = foreground · memo = foreground

narrativeRole: Step 09. Evidence must be kept with its context so the team can re-check it.
keyMessage: 원문·작성자·날짜·메모를 함께 저장한다.

Scene 1 (0.0–1.0s): topbar "09 / 12 · 북마크"; headline "근거를 남긴다".
Scene 2 (1.0–2.6s): post card slides right into a forest folder labelled "수부지 리서치 · 예시".
Scene 3 (2.6–4.2s): memo slip stamps beside it with four field pills: 원문 링크 · 작성자 · 게시일 · 왜 저장했나.
Scene 4 (4.2–5.5s): hold.

## Frame 10 — Hypothesis

- scene: Forest ground; two hypothesis cards — 제품 가설 / 메시지 가설 — and a lime note "가설은 결론이 아니다"
- voiceover: "관찰을 가설로 바꿉니다. 가설은 결론이 아니라, 검증할 문장이에요."
- duration: 7s
- poster: 6.2s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/10-hypothesis.html
- type: benefit_highlight
- persuasion: Translation (evidence → testable claim)
- beat: insight
- blueprint: compose
- focal: the two hypothesis cards
- roles: cards = foreground · forest field = background

narrativeRole: Step 10. Turn observation into a product and a message hypothesis a manufacturer can act on.
keyMessage: 관찰을 제품 가설과 메시지 가설로 바꾼다 — 아직 결론이 아니다.

Scene 1 (0.0–1.0s): topbar (forest variant) "10 / 12 · 가설"; headline (paper) "관찰을 가설로 바꾼다".
Scene 2 (1.0–3.2s): card 1 "제품 가설" — "수부지를 위한 가볍고 탄력 있는 수분 제형".
Scene 3 (3.2–5.2s): card 2 "메시지 가설" — "‘끈적임 없이 탄력탱탱’이 수부지 고객에게 통할까?".
Scene 4 (5.2–7.0s): lime pill "가설은 결론이 아니다 · 검증할 문장이다"; hold.

## Frame 11 — Small experiment

- scene: Three small experiment pills in a row on paper, each with a tiny icon; a scale glyph emphasises "작게"
- voiceover: "크게 만들기 전에, 소량 샘플과 문구 테스트로 작게 확인합니다."
- duration: 6s
- poster: 5.2s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/11-experiment.html
- type: feature_showcase
- persuasion: Risk reduction (small bets)
- beat: confidence
- blueprint: grid-card-assemble (Adapt)
- focal: the three experiment cards
- roles: cards = foreground · topbar = supporting

narrativeRole: Step 11. Make the hypothesis cheap to test before committing a product line.
keyMessage: 큰 결정 전에, 작게 실험하고 반응을 기록한다.

Scene 1 (0.0–1.0s): topbar "11 / 12 · 작은 실험"; headline "작게 실험한다".
Scene 2 (1.0–3.8s): three cards cascade: "소량 샘플" (테스트용 소량 생산·체험단) · "문구 A/B" (같은 제품, 다른 메시지) · "반응 기록" (댓글·저장·문의를 메모).
Scene 3 (3.8–6.0s): a lime strip under the cards: "크게 만들기 전에 작게 확인"; hold.

## Frame 12 — Monitor (the loop)

- scene: A circular flow of all steps; a lime dot travels the ring; centre reads "모니터링은 반복이다"
- voiceover: "실험 결과는 다음 질문이 됩니다. 모니터링은 한 번이 아니라, 반복입니다."
- duration: 7s
- poster: 6.4s
- transition_in: crossfade
- status: animated
- src: compositions/frames/12-monitor-loop.html
- type: branding
- persuasion: Cycle model (closure)
- beat: resolution
- blueprint: constellation-hub (Adapt)
- focal: the loop ring
- roles: ring + step pills = foreground · travelling dot = supporting

narrativeRole: Step 12. Close the method into a habit — results feed the next question.
keyMessage: 실험 결과가 다음 질문이 된다. 모니터링은 반복이다.

Scene 1 (0.0–1.0s): topbar "12 / 12 · 모니터링"; headline "계속 지켜보고, 다시 묻는다".
Scene 2 (1.0–3.4s): a ring draws on clockwise; eight step pills pop around it in order: 질문 · 검색 · 관찰 · 발견 · 검증 · 저장 · 가설 · 실험.
Scene 3 (3.4–5.6s): a lime dot travels the full ring once, lighting each pill as it passes.
Scene 4 (5.6–7.0s): centre text "모니터링은 반복이다" settles; hold.

## Frame 13 — Honest scope

- scene: Forest ground; two columns — "지금 앱에서" (✓) vs "아직 연결 전" (○); footnote that all examples are hypothetical
- voiceover: "방법은 지금 연습할 수 있어요. 전체 키워드 발견과 광고 자동 수집은 아직 연결 전입니다."
- duration: 8s
- poster: 7s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/13-scope.html
- type: cta
- persuasion: Expectation setting (honest scope)
- beat: trust
- blueprint: compose
- focal: the two columns
- roles: columns = foreground · footnote = supporting · forest field = background

narrativeRole: Separates the teachable method from what the current tool actually does.
keyMessage: 방법은 지금 연습할 수 있다. 전역 키워드 발견과 Meta 광고 자동 수집은 아직 연결 전이다.

Scene 1 (0.0–1.2s): topbar "정리 · 지금 할 수 있는 것" (all segments filled); headline "방법은 지금부터 연습할 수 있어요".
Scene 2 (1.2–3.6s): left column "지금 앱에서" with two lime-check rows: "등록한 프로페셔널 Instagram 계정의 글 읽기" · "수집한 글 안에서 키워드·브랜드·작성자 탐색, 북마크".
Scene 3 (3.6–5.6s): right column "아직 연결 전" with two open-circle rows: "전역 키워드 발견" · "Meta 광고 자동 수집".
Scene 4 (5.6–8.0s): footnote "영상 속 키워드·브랜드 연결은 모두 교육용 예시이며 실제 측정 결과가 아닙니다."; hold to the end (no exit — ends on a readable frame for README loops).
