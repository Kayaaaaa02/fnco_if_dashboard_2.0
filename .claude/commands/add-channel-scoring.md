# 채널 스코어링 로직 추가

PDA 기반 채널 배분 스코어링 엔진을 확장합니다.

## 입력
- $ARGUMENTS: 스코어링 요구사항 (예: "새 플랫폼 추가", "퍼널 가중치 조정" 등)

## 기존 구조
- `client/src/lib/channelScoring.js`
  - **Stage 1** (60%): 페르소나 미디어 선호도 파싱 → 플랫폼 우선순위 가중치
  - **Stage 2** (40%): 퍼널 핏 매트릭스 적용
    - TOFU → TikTok
    - MOFU → Instagram
    - BOFU → YouTube
  - 출력: PDA 컨셉별 플랫폼 랭킹 점수

## 규칙
- 기존 2-stage 스코어링 구조 유지
- 가중치 변경 시 합산 100% 유지
- 새 플랫폼 추가 시 퍼널 매트릭스도 함께 업데이트
