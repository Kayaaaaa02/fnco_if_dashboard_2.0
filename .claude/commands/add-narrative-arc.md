# 내러티브 아크 추가

캠페인 스토리텔링 내러티브 아크 기능을 확장합니다.

## 입력
- $ARGUMENTS: 요구사항 (예: "내러티브 아크 시각화", "Phase별 스토리 연결" 등)

## 기존 구조
- `server/src/controllers/narrativeArcController.js` — JSONB `phases` 배열, 버전 관리, draft/active 상태 전환
- `server/src/routes/narrativeArc.js` — `GET/POST /api/v2/campaigns/:id/narrative-arc`
- `client/src/hooks/useNarrativeArc.js` — TanStack Query Hook

### 데이터 모델
- campaign_id 기반 연결
- phases: JSONB 배열 (단계별 스토리)
- version: 자동 증가
- status: draft → active

## 규칙
- 기존 narrativeArcController 패턴 유지
- 캠페인별 버전 히스토리 보존
