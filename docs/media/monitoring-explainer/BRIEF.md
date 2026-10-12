---
workflow: faceless-explainer
flow: automation
storyboard: no
message: "콘텐츠 모니터링은 한 번의 검색이 아니라, 고객의 표현을 따라가며 검증하고 작게 실험하는 반복 습관이다"
destination: github-readme
aspect: 1920x1080
language: ko
audience: 브랜드 마케팅을 배우는 화장품 제조사 실무자
length: 60-90s
angle: how-to
narration: yes
---

## Intent

화장품 제조사(제품·성분 지식은 있지만 브랜드 마케팅 탐색 루틴이 부족한 팀)를 위한
한국어 교육용 모션 그래픽. GitHub 이슈와 README에 첨부되어 소리 없이 재생되는 경우가 많으므로
화면 텍스트만으로 이해되어야 한다. 첫 납품 뒤 사용자 요청으로 `seulki` 목소리의 한국어 내레이션을 더했다
(`SCRIPT.md`). 내레이션은 화면 내용을 요약하는 보조 수단이며, 소리를 꺼도 내용이 그대로 전달된다.

핵심 흐름(사용자 제시):
워크스페이스 선택(스킨케어/바디케어/헤어케어) → 시장 질문 → `수분크림` 검색 →
`비교 브랜드 A`(Reference A, 가상의 브랜드) 같은 브랜드 관찰 → `수부지` 표현 발견 → 그 표현으로 독립 검색 →
`탄력탱탱`과 크리에이터 발견 → 다른 표현 탐색 → 독립 작성자·시간·원문 근거 검증 →
북마크 → 제품/메시지 가설 → 작은 실험 → 모니터링.

## Customizations

- Palette: forest #163300, lime #9fe870, paper white #ffffff, fog #e8ebe6.
- Heavy sans Korean typography, flat pills, flowing diagrams. No shadows.
- 16:9, readable without sound (Korean narration in the `seulki` voice added on request), H.264 MP4 deliverable ≤ 10MB (720p acceptable), poster image, editable source.

## Notes

- 모든 키워드·브랜드 연결은 가상의 교육용 예시이며 화면에 "예시"로 표시한다. 실제 측정 트렌드/수치를 만들지 않는다 (수치·증가율 표기 금지).
- 현재 Aialy 앱은 등록한 프로페셔널 Instagram 계정의 게시물을 읽는다. 전역 키워드 발견과 Meta 광고 자동 수집은 아직 연결되지 않았다. 영상은 방법을 가르치며, 미래 기능이 동작한다고 주장하지 않는다.
- 크리에이터의 브랜드 언급은 관찰이지 유료 협업의 증거가 아니다. "시장 전체" 표현을 쓰지 않는다.
- 비밀값/.env/.data/비공개 수집 캡처를 읽거나 화면에 넣지 않는다. 앱 스크린샷 없음 — 모든 화면은 가상의 일러스트.
- Ownership: docs/media/monitoring-explainer only. Root integrates and publishes.
