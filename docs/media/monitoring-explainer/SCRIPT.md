# SCRIPT — monitoring explainer narration

한국어 내레이션 13줄. 장면마다 한 줄씩이며 화면 문구를 그대로 읽지 않고 요약합니다.
화면 텍스트만으로도 내용이 전달되도록 만든 영상이라 소리 없이 봐도 됩니다.

- 목소리: ElevenLabs `seulki` (사용자 계정의 클론 보이스), 모델 `eleven_multilingual_v2`, 속도 1.1, 그 밖에는 보이스 기본값
- 파일: `assets/voice/NN.mp3`. 앞에 0.45초(1번 장면은 0.4초) 무음을 넣고 뒤쪽 무음은 0.15초만 남겼습니다. -16 LUFS / -1.5 dBTP, 모노 128 kbps
- 배치: `index.html`의 voice 트랙(`data-track-index="10"`)에서 각 장면의 시작 시각에 맞춰 재생. 경로 목록은 `audio_meta.json`
- 모든 줄이 다음 장면 전환 전에 끝납니다. 줄을 고치면 길이가 해당 장면 안에 들어가는지 다시 확인하세요.

## 01 훅 (Frame 1)

**clip:** `assets/voice/01.mp3` · start 0s · scene 6.1s

    콘텐츠 모니터링, 어디서부터 시작할까요? 고객이 쓰는 말에서 출발합니다.

## 02 워크스페이스와 질문 (Frame 2)

**clip:** `assets/voice/02.mp3` · start 5.5s · scene 8.5s

    먼저 우리 제품군을 고르고, 시장에 질문을 던집니다. 결론이 아니라, 확인할 질문부터요.

## 03 검색 (Frame 3)

**clip:** `assets/voice/03.mp3` · start 13.5s · scene 7s

    그다음, 수분크림 같은 제품 단어로 검색해 봅니다.

## 04 브랜드 관찰 (Frame 4)

**clip:** `assets/voice/04.mp3` · start 20s · scene 7s

    어떤 브랜드가 보이는지, 누가 올린 글인지 살펴봅니다.

## 05 표현 발견 (Frame 5)

**clip:** `assets/voice/05.mp3` · start 26.5s · scene 7.5s

    글 속에서 고객이 쓰는 표현을 찾습니다. 수부지, 수분 부족형 지성 피부라는 뜻이죠.

## 06 표현으로 재검색 (Frame 6)

**clip:** `assets/voice/06.mp3` · start 33.5s · scene 8s

    처음 조건을 풀고, 수부지만으로 다시 검색합니다. 함께 쓰인 표현과 작성자가 보이죠.

## 07 표현 넓히기 (Frame 7)

**clip:** `assets/voice/07.mp3` · start 41s · scene 7s

    표현은 다른 표현으로 이어집니다. 선은 함께 나왔다는 뜻일 뿐이에요.

## 08 검증 (Frame 8)

**clip:** `assets/voice/08.mp3` · start 47.5s · scene 8.5s

    서로 다른 작성자가, 여러 시점에, 원문으로 확인될 때만 신호로 봅니다.

## 09 북마크 (Frame 9)

**clip:** `assets/voice/09.mp3` · start 55.5s · scene 6.1s

    원문 링크, 작성자, 게시일, 저장한 이유까지 남깁니다.

## 10 가설 (Frame 10)

**clip:** `assets/voice/10.mp3` · start 61s · scene 7.6s

    관찰을 가설로 바꿉니다. 가설은 결론이 아니라, 검증할 문장이에요.

## 11 작은 실험 (Frame 11)

**clip:** `assets/voice/11.mp3` · start 68s · scene 6.5s

    크게 만들기 전에, 소량 샘플과 문구 테스트로 작게 확인합니다.

## 12 모니터링 루프 (Frame 12)

**clip:** `assets/voice/12.mp3` · start 74s · scene 7.6s

    실험 결과는 다음 질문이 됩니다. 모니터링은 한 번이 아니라, 반복입니다.

## 13 현재 앱 범위 (Frame 13)

**clip:** `assets/voice/13.mp3` · start 81s · scene 8s

    방법은 지금 연습할 수 있어요. 전체 키워드 발견과 광고 자동 수집은 아직 연결 전입니다.
