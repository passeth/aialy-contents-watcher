# 콘텐츠 모니터링 설명 영상 (monitoring explainer)

화장품 제조사를 위한 한국어 교육용 모션 그래픽 — 89초, 16:9, 한국어 내레이션(`seulki` 목소리) 포함. 소리를 꺼도 화면 텍스트만으로 읽힙니다.
GitHub 이슈와 README에 첨부하는 용도로 만들었습니다.

| 파일 | 내용 |
|---|---|
| [monitoring-explainer.mp4](https://github.com/user-attachments/assets/14b3c4c7-cf60-43e9-ace6-42c33fa22b05) | 최종 영상 — H.264 High, 1920×1080, 30fps, 89.0s, AAC 48kHz 스테레오 내레이션, 5.0 MB, faststart |
| `poster.png` | 포스터 이미지 (1920×1080, 영상 4.9s 지점의 타이틀 프레임) |
| `ACCEPTANCE.md` | 수용 보고서 — ffprobe, 검사 결과, 샘플 프레임 QA |
| `qa/contact-sheet.jpg` | 최종 MP4에서 뽑은 13개 장면 착지 프레임 |

## 이야기 구성

`워크스페이스 → 질문 → 수분크림 검색 → 브랜드 관찰(비교 브랜드 A) → 표현 발견(수부지) → 표현으로 재검색(탄력탱탱·작성자) → 표현 넓히기 → 검증(독립 작성자·시간·원문) → 북마크 → 제품/메시지 가설 → 작은 실험 → 모니터링 루프 → 현재 앱 범위`

- 모든 키워드·브랜드·작성자 연결은 **가상의 교육용 예시**이며 (`비교 브랜드 A`·`브랜드 B/C`·`작성자 A/B/C`는 실제 브랜드나 계정이 아닌 가상의 이름), 화면에 `교육용 예시 · 실제 측정 아님`으로 표시합니다. 수치·증가율·차트 값은 쓰지 않았습니다.
- 검색 화면은 일반적인 일러스트이며 실제 앱 화면이 아닙니다 (3번 장면에 표기).
- 마지막 장면은 현재 Aialy 앱이 하는 일(등록한 프로페셔널 Instagram 계정의 글 읽기, 수집한 글 안에서의 탐색·북마크)과
  아직 연결되지 않은 것(전역 키워드 발견, Meta 광고 자동 수집)을 구분합니다.

## 편집 가능한 소스

[HyperFrames](https://hyperframes.heygen.com) HTML 컴포지션입니다. CLI 버전은 `package.json`에 `0.8.150`으로 고정되어 있습니다.

| 경로 | 역할 |
|---|---|
| `BRIEF.md` | 목적·대상·제약 (왜) |
| `STORYBOARD.md` | 13개 장면의 길이·전환·장면별 연출 (무엇을) |
| `frame.md` | 색·타이포·컴포넌트 디자인 기준 (어떻게 보이는지) |
| `SCRIPT.md` | 장면별 내레이션 문구, 목소리·처리 설정 |
| `assets/voice/NN.mp3` | 장면별 내레이션 오디오 (ElevenLabs `seulki` 보이스, -16 LUFS) |
| `audio_meta.json` | 장면 번호 → 내레이션 파일 경로 (faceless-explainer `assemble-index.mjs` 입력) |
| `compositions/frames/NN-*.html` | 장면별 실제 화면과 GSAP 타임라인 — **문구·레이아웃 수정은 여기서** |
| `index.html` | 장면을 이어 붙이고 내레이션 `<audio>`(voice 트랙 10)를 배치한 루트 컴포지션 (생성 파일 — 직접 수정하지 않음) |
| `assets/fonts/` | 서브셋한 Noto Sans KR 500/700/900 woff2 + 라이선스 |
| `scripts/subset-fonts.py` | 화면 문구가 바뀌면 폰트 서브셋을 다시 만드는 스크립트 |
| `capture/extracted/` | 원래 요청 문구와 브랜드 토큰 (참고용) |

### 수정 → 다시 렌더

이 폴더에서 실행합니다.

```bash
# 1) 장면 문구를 바꿨다면 새 글자가 폰트에 들어가도록 서브셋을 다시 만든다
#    (원본: github.com/google/fonts 의 ofl/notosanskr/NotoSansKR[wght].ttf, 저장소에는 넣지 않음)
python3 scripts/subset-fonts.py /path/to/NotoSansKR[wght].ttf

# 2) 미리보기(Studio)와 검사
npx --yes hyperframes@0.8.150 preview
npx --yes hyperframes@0.8.150 check

# 3) 마스터 렌더 (renders/ 는 .gitignore 대상)
npx --yes hyperframes@0.8.150 render --quality high --output renders/master.mp4

# 4) 웹 배포용 인코딩과 포스터
ffmpeg -y -i renders/master.mp4 -c:v libx264 -preset slow -tune animation -crf 21 \
  -pix_fmt yuv420p -profile:v high -level 4.1 -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -movflags +faststart monitoring-explainer.mp4
ffmpeg -y -ss 4.9 -i renders/master.mp4 -frames:v 1 poster.png
```

장면 길이나 순서를 바꿀 때는 `STORYBOARD.md`의 `duration`/`transition_in`을 고친 뒤
HyperFrames `faceless-explainer` 스킬의 `assemble-index.mjs`(`audio_meta.json`을 읽어 내레이션을 다시 배치)와
`transitions.mjs inject`로 `index.html`을 다시 만듭니다. 다시 만든 뒤에는 각 `<audio>`의 `data-duration`을
실제 클립 길이로 맞춰야 `check`의 `clip_media_fit` 경고가 나지 않습니다.

### 내레이션 수정

`SCRIPT.md`의 문구를 고친 뒤 해당 장면 클립만 ElevenLabs `seulki` 보이스(`eleven_multilingual_v2`, 속도 1.1)로
다시 생성합니다. 앞에 0.45초 무음을 넣고 -16 LUFS로 맞춰 `assets/voice/NN.mp3`를 교체한 다음,
클립이 다음 장면 전환 전에 끝나는지 확인하세요. API 키는 저장소에 넣지 않습니다.

## 라이선스

- **Noto Sans KR** — SIL Open Font License 1.1 (`assets/fonts/OFL.txt`). 원본 가변 폰트에서 필요한 굵기만
  인스턴스화하고 사용 글자만 남긴 서브셋입니다. 예약 폰트 이름(“Source”)은 사용하지 않습니다.
- **내레이션** — 사용자 ElevenLabs 계정의 `seulki` 보이스로 생성했습니다. 사용 권한은 해당 계정의 약관을 따릅니다.
- **GSAP** — 렌더 시 jsDelivr CDN에서 불러오며 이 폴더에 포함하지 않습니다 ([GSAP Standard License](https://gsap.com/standard-license)).
- **HyperFrames CLI** — `npx`로 실행하며 이 폴더에 포함하지 않습니다.
- 그 밖의 이미지·아이콘·도형은 모두 이 컴포지션 안에서 HTML/SVG로 직접 그렸습니다. 외부 사진·로고·앱 스크린샷은 없습니다.
