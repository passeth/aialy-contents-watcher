# Acceptance report — monitoring explainer

Rendered 2026-10-13 with HyperFrames CLI 0.8.150 (faceless-explainer workflow, autonomous run:
`flow: automation`, `storyboard: no`; the user pre-authorized the finished video).
Re-rendered the same day after two follow-up requests from the user, described below:
"Revision — wording correction" and "Revision — narration".
The 13 scenes, their timing and the 89 s length did not change.

## Deliverables

| Path (relative to this folder) | Result |
|---|---|
| `monitoring-explainer.mp4` | H.264 High@4.1, 1920×1080, yuv420p, 30 fps, **89.000 s**, 2670 frames, **4,981,510 bytes (5.0 MB)**, AAC-LC 48 kHz stereo narration track (128 kbps target), `+faststart` |
| `poster.png` | PNG 1920×1080, 383,665 bytes — title frame at 4.9 s (regenerated from the narrated master; byte-identical to the previous poster because the title frame has no edited copy) |
| `qa/contact-sheet.jpg` | 13 landed frames sampled from the final MP4 (regenerated, 295,191 bytes; identical to the sheet taken from the silent re-render, so adding audio changed no pixels) |
| Source | `index.html`, `compositions/frames/*.html` (13), `STORYBOARD.md`, `BRIEF.md`, `SCRIPT.md`, `audio_meta.json`, `frame.md`, `assets/fonts/*`, `assets/voice/*.mp3` (13), `scripts/subset-fonts.py` — see README |

SHA-256
```
ca021d69ee4d97bd01040f3f02aca11cc075d26e1391ea5a05b2365f39022e69  monitoring-explainer.mp4
58c9ffb1737240ced4c0fe915e83ceff91bdcb4d291cb16bfa08e6aa026f6f87  poster.png
46f4755391325044efcb8ebd209e6752a5d3564f40e03c7d9c9bd7b4316d3874  qa/contact-sheet.jpg
0f0efa566d73d4e09b9458a665107351252d74d503d6533414ef572d7fdd0dfe  assets/fonts/NotoSansKR-500.woff2
2f7f3c4b66c688d9a435dd95add28bec1b12a3fe22a478ff638e7ea0185193df  assets/fonts/NotoSansKR-700.woff2
fcb12c58166d56400e6eb586dbcc7ec11fb50458f7068a51db3e1d0630d8141e  assets/fonts/NotoSansKR-900.woff2
```

### ffprobe (`monitoring-explainer.mp4`)
```
codec_name=h264
profile=High
codec_type=video
width=1920
height=1080
pix_fmt=yuv420p
level=41
r_frame_rate=30/1
nb_frames=2670
codec_name=aac
profile=LC
codec_type=audio
sample_rate=48000
channels=2
format_name=mov,mp4,m4a,3gp,3g2,mj2
duration=89.000000
size=4981510
bit_rate=447776
```
The video stream averages about 344 kbps and the audio about 96 kbps. A full decode (`ffmpeg -f null`) reports no errors, and `moov` comes before `mdat` (faststart).

## Pipeline

1. Master render: `hyperframes render --quality high` → 1080p master with mixed narration, 11.4 MB, 89.0 s, rendered in ~47 s (kept outside the repo).
2. Delivery encode: `libx264 -preset slow -tune animation -crf 21 -pix_fmt yuv420p -profile:v high -level 4.1 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart` → 5.0 MB.
   1080p was kept (not 720p) because it fits the ≤10 MB target with room to spare and keeps small Korean type sharp.
   A 720p CRF 20 encode was tested at 2.4 MB if a smaller file is ever needed.

## Automated checks (re-run after the wording correction, before the final render)

| Check | Result |
|---|---|
| `hyperframes lint` | 0 errors, 0 warnings |
| `hyperframes check` | **passed** — Lint 0/0, Runtime 0/0, Layout 0 errors, Motion 0/0, Contrast 0 errors |
| Layout infos (21) | `content_overlap` only during the 0.5–0.6 s crossfades, where two frames' identical topbars/headlines overlap by design (marked `data-layout-allow-overlap`) |
| Contrast warning (1) | at t=24.72 s the "?" badge of the second question pill in frame 04 is sampled mid-fade-in (2.63:1 while partly transparent); at rest it is lime on forest, well above 3:1 |
| Transitions | `transitions.mjs verify`: 12 transitions verified (crossfade ×8, blur-crossfade ×4, cut at start) |

## Visual QA (frames sampled from the final MP4)

Landed state of every frame (`qa/contact-sheet.jpg`): 4.9, 13.2, 19.7, 26.2, 33.1, 40.6, 47.2, 55.2, 60.7, 67.7, 73.7, 80.7, 88.5 s.
Mid-action samples: 2.0, 8.0, 15.2, 23.6, 30.2, 37.4, 44.2, 51.4, 58.2, 64.6, 71.2, 77.6, 85.0 s.

Confirmed in those samples:
- Korean renders in the shipped Noto Sans KR at 500/700/900 everywhere; no fallback glyphs or tofu.
- Reveals build across each frame (typing in the search bar, flow lines drawing, checks ticking one by one, the runner circling the loop). No frame dumps everything at t=0.
- Every frame from 02 to 13 shows the `교육용 예시 · 실제 측정 아님` pill; frame 03 also says `예시 화면 · 실제 앱 화면 아님`; the example post card in frame 05 is tagged `예시 글`; and the last frame carries the footnote that all keyword/brand links are examples.
- No numbers, percentages, growth arrows or chart values appear anywhere.
- Content stays above y≈900 on a 1080 canvas; nothing is clipped at the edges (the hook's decorative rings are intentionally off-canvas).
- Full-resolution crops of the smallest text (24–26 px chrome, footnote) are crisp after the CRF 21 encode.

Issues found during QA and fixed before the final render:
- Frame 02: the lime "selected" fill on 스킨케어 did not show because of a CSS specificity bug.
- Frame 03: the typing effect used transparent text color, which `check` flagged as unpainted text. It now uses per-glyph opacity.
- Frame 04: the brand pills collided with the image placeholder circle, so the circle was moved. Frame 03 got the same change to keep the two frames continuous.
- Frame 09: the layout was right-heavy and was rebalanced.
- Frame 12: the loop runner ended on top of the "질문" label. It now travels behind the pills.
- Frame 13: flex gaps were splitting the footnote around "교육용 예시".

## Honesty and scope constraints

- The keyword, brand and creator chain (수분크림 → 비교 브랜드 A (Reference A, a fictional brand) → 수부지 → 탄력탱탱 → 작성자 A/B/C) is hypothetical and labeled as an example. Creator links are shown as "함께 등장한 관찰" (observed together), never as sponsorship or demand.
- The closing frame separates what the Aialy app does today (reads registered professional Instagram accounts; searches and bookmarks within the collected posts) from what is not connected yet (global keyword discovery; automatic Meta ads collection, where ads are currently saved manually).
- The film contains no app screenshots, credentials, `.env`/`.data` content or private research captures. Only the repo's public docs (`docs/implementation-status.md`, `docs/exploration-workflows.md`) were read, to get the terminology right.

## Revision — wording correction

The user asked for these changes after the first delivery:

- The example brand is now the fictional **비교 브랜드 A (Reference A)** everywhere. Before, a real brand name stood in for it. This covers the source frames, `BRIEF.md`, `STORYBOARD.md`, `README.md`, this report and `capture/extracted/visible-text.txt`.
  - On screen: frame 04 (two card pills plus the large highlighted pill), frame 05 (the author line `작성자 A · 수분크림 · 비교 브랜드 A 언급`) and frame 06 (the struck-through filter chip).
  - The other card pills in frame 04 now read `브랜드 B` / `브랜드 C`, so none of them can be mistaken for `비교 브랜드 A`.
- No product name other than Aialy appears in the published source or docs. Where the docs mean the current app, they say "Aialy". The shared chrome CSS class prefix was renamed to a neutral `mx-` (monitoring explainer). The rename changes no visuals.
- Font subsets were regenerated with `scripts/subset-fonts.py` and now hold 363 characters per weight. The glyphs for `비교 브랜드` are present. Glyphs that only the old brand name used have dropped out of the subset.
- Copy fit was checked at full resolution in the landed frames at 26.2 s (frame 04), 33.1 s (frame 05) and 40.6 s (frame 06). `비교 브랜드 A` stays inside its card image area, its pill and its chip. The large pill ends well left of the question pills. `hyperframes check` reports no new layout findings.
- Forbidden-name scan: across every non-ignored text file in this folder, `rg -i` for the old brand name (Hangul or Latin, with or without a space) and for the previous product name (Hangul or Latin, singular or plural) returns **0 matches**.

## Revision — narration

After the first delivery the user asked for narration in their `seulki` voice.

- **Voice:** ElevenLabs cloned voice `seulki` from the user's account, model `eleven_multilingual_v2`, speed 1.1, otherwise the voice's default settings. The API key was used only as a shell environment variable during generation. It is not stored in this folder or anywhere in the repo.
- **Script:** `SCRIPT.md` holds 13 short Korean lines, one per scene. Each line summarizes what is on screen and does not read it word for word. The lines keep to the honesty constraints: they make no measured claims, refer to the brand only generically, and the last line separates what can be practiced now from what is not connected yet. Two first drafts were changed:
  - Scene 07 was shortened so it fits its scene.
  - Scene 13 now says "전체 키워드 발견". The draft's "전역" is pronounced like "저녁", and a speech-to-text check confirmed it was heard that way.
- **Processing:** each clip got 0.45 s of leading silence (0.4 s for scene 01), its trailing silence was trimmed to 0.15 s, and it was normalized two-pass to -16 LUFS / -1.5 dBTP. Clips are mono 128 kbps MP3 in `assets/voice/NN.mp3`, 1.1 MB in total.
- **Placement:** 13 root-level `<audio>` elements on voice track 10 in `index.html`, one at each scene's start, with `data-duration` set to the clip length. `audio_meta.json` records the frame → clip mapping in the faceless-explainer format. `hyperframes check` passed: Lint 0/0, Runtime 0/0, Layout 0 errors (the same 21 crossfade infos as before), Motion 0/0, Contrast 0 errors with the same single mid-fade warning.
- **Timing in the final mix** (silencedetect, -45 dB, at least 0.6 s): every line ends before the next scene's crossfade begins, and no two lines overlap. The gaps between lines are 4.83–6.00, 12.11–14.00, 17.76–20.45, 24.15–27.02, 32.87–34.00, 39.67–41.50, 46.55–47.95, 53.11–55.95, 59.48–61.52, 66.09–68.50, 73.41–74.47, 79.26–81.52 and 87.92–89.00 s.
- **Loudness of the delivered mix:** -13.5 LUFS integrated (dual-mono stereo), LRA 6.1 LU, true peak -1.9 dBFS.
- **Content check:** ElevenLabs speech-to-text on the audio track of the delivered MP4 returns all 13 lines in order. Speech runs from 0.68 s to 87.92 s.

## Not done / notes

- The Studio preview was not opened. This was a dispatched run and the render was pre-authorized. `npx hyperframes@0.8.150 preview` opens it for any later edits.
- No music or SFX (`music: none`). Narration was added on request; see "Revision — narration".
- No preferences were recorded to HyperFrames memory, because every run-shape value was a stated default, not a user-confirmed answer.
- After the wording fix, the HyperFrames desktop app, which was open on this project, stamped editor-only `data-hf-id` attributes into `index.html` and the frame files. They do not affect rendering: the contact sheet from the narrated render is byte-identical to the one from the silent re-render before the stamp. They were left in place.
- Frame 04's brand pills sit about 5 px above the decorative image circle. The pills were already that close before the wording change, and they do not overlap it, so the geometry was left alone.
- `.gitignore` in this folder excludes `renders/`, `snapshots/`, `.hyperframes/`, `.media/`, `node_modules/` and logs. Intermediate renders and snapshots were written to `/tmp`, outside the repo.
