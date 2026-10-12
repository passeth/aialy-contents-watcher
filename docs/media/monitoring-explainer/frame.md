---
version: alpha
name: Forest Pill — Korean explainer frame
description: >
  Hand-tuned design truth for the content-monitoring explainer. Started from the shipped
  blue-professional preset (flat cards, pill chrome, no shadows) and re-cast onto the brand
  palette supplied in the brief: forest #163300, lime #9fe870, paper white, fog #e8ebe6.
  Heavy Korean sans (Noto Sans KR 900/700/500, subset + shipped locally), flat pills,
  flowing hairline diagrams. 1920×1080. On-screen type carries the teaching; the narration is a supporting layer.
unit: the frame — 1920×1080
principle: atoms are sacred · composition is free · every keyword/brand link is an example

colors:
  paper: "#ffffff"
  forest: "#163300"
  lime: "#9fe870"
  fog: "#e8ebe6"
  forest-muted: "#4d5e45"
  forest-line: "#c9d1c4"
  lime-ink: "#2f5b12"

radii:
  pill: "999px"
  card: "28px"
  card-sm: "18px"
  circle: "50%"

typography:
  hero:      { fontFamily: "Noto Sans KR", px: 132, weight: 900, lineHeight: 1.04, tracking: "-0.035em", color: "forest" }
  headline:  { fontFamily: "Noto Sans KR", px: 72, weight: 900, lineHeight: 1.12, tracking: "-0.03em", color: "forest" }
  title:     { fontFamily: "Noto Sans KR", px: 46, weight: 900, lineHeight: 1.18, tracking: "-0.02em", color: "forest" }
  body:      { fontFamily: "Noto Sans KR", px: 34, weight: 500, lineHeight: 1.45, tracking: "-0.01em", color: "forest-muted" }
  pill:      { fontFamily: "Noto Sans KR", px: 32, weight: 700, lineHeight: 1.0, tracking: "-0.01em", color: "forest" }
  chrome:    { fontFamily: "Noto Sans KR", px: 26, weight: 700, lineHeight: 1.0, tracking: "0", color: "forest" }

spacing:
  pad-x: "120px"
  chrome-top: "56px"
  headline-top: "150px"
  keep-out-bottom: "900px"
  gap: "28px"

components:
  topbar:
    placement: "top edge (y 56–108): step pill left, 12-segment progress centre-left, example pill right"
    description: "On every step frame. Identical position across frames so crossfades keep it still."
  step-pill:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.lime}"
    rounded: "{radii.pill}"
    typography: "{typography.chrome}"
    description: "'03 / 12 · 검색' — the step number is the spine of the how-to."
  example-pill:
    backgroundColor: "{colors.fog}"
    textColor: "{colors.forest}"
    rounded: "{radii.pill}"
    typography: "{typography.chrome}"
    description: "'교육용 예시 · 실제 측정 아님' — on every frame that shows a keyword or brand link."
  keyword-pill:
    backgroundColor: "{colors.lime} (active) / {colors.fog} (idle) / {colors.paper} + 3px {colors.forest} outline (query)"
    textColor: "{colors.forest}"
    rounded: "{radii.pill}"
    typography: "{typography.pill}"
    description: "Keywords, brands, expressions. Flat — no shadow, ever."
  card:
    backgroundColor: "{colors.fog} on paper / {colors.paper} on fog / #24410f on forest"
    rounded: "{radii.card}"
    shadow: "none"
    description: "Post cards, check cards, hypothesis cards."
  flow-line:
    stroke: "4px {colors.forest} (paper ground) / 4px {colors.lime} (forest ground)"
    description: "Curved SVG paths that draw on (stroke-dashoffset) between nodes — the 'flowing diagram'."
  marker:
    backgroundColor: "{colors.lime}"
    description: "Lime highlighter bar that sweeps (scaleX) behind a discovered word."
---

# Forest Pill — frame layer

## Overview

A calm, flat, high-contrast teaching system. Forest ink on paper for step frames; a forest ground
is reserved for gravity moments (hook, hypothesis, closing scope note). Lime is the one accent:
the active pill, the highlighter, the moving dot. Fog is the quiet card surface.

## Rules

- **Two grounds:** paper (#ffffff) for steps, forest (#163300) for hook / hypothesis / close.
- **Lime is never text on paper** (too low contrast). On paper, lime is a fill behind forest text.
  On forest, lime can be text.
- **Muted text** is forest-muted (#4d5e45) on paper, fog (#e8ebe6) on forest.
- **Flat:** no shadows, no gradients, no glow. Depth = fill contrast + overlap + scale.
- **Type:** Noto Sans KR only, 900 for display, 700 for pills/chrome, 500 for body. Load-bearing
  text ≥ 26px at 1080p (≥ 17px once scaled to the 720p deliverable).
- **Keep-out:** content stays above y = 900; the bottom band holds at most a one-line footnote.
- **Honesty:** every frame that shows a keyword, brand, creator or link carries the example pill.
  No numbers, percentages or growth arrows — nothing that reads as a measured trend.
- **Motion:** power3/power2 long-tail eases, staggered pill pops, path draw-on, highlighter
  sweep, a single travelling lime dot. No bounce, no float/breathing loops, no exits except the
  final frame.
