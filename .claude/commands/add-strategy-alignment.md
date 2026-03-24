# 전략 정합성 분석 추가

AI 기반 전략 정합성 (Strategy Alignment) 분석 기능을 확장합니다.

## 입력
- $ARGUMENTS: 분석 요구사항 (예: "새 체크 디멘션 추가", "정합성 리포트 생성" 등)

## 기존 구조

### Server
- `server/src/controllers/alignmentController.js` — Gemini AI로 콘텐츠 플랜 vs 브랜드 전략 스코어링
- `server/src/config/alignmentPrompts.js` — AI 프롬프트 정의
- `server/src/routes/alignment.js`
- DB: `dw_strategy_alignment` (overall_score, JSONB 체크 배열)

### Client
- `client/src/hooks/useAlignment.js` — `useAlignment(campaignId)`, `useRunAlignment()`

### 분석 플로우
1. 캠페인의 콘텐츠 플랜 + 브랜드 전략 수집
2. Gemini AI에 프롬프트와 함께 전송
3. 다차원 체크 결과 수신 (각 체크별 score + feedback)
4. overall_score 산출 후 DB 저장

## 수행 작업
1. alignmentPrompts.js에 새 체크 디멘션 추가
2. Controller에 분석 로직 확장
3. UI에 결과 시각화 컴포넌트 추가

## 규칙
- Gemini API 키는 환경변수 관리
- 기존 alignmentPrompts.js 프롬프트 구조 유지
- overall_score는 0~100 범위
