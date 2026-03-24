# AI-PLAN 워크플로우 단계 추가

AI-PLAN 6단계 워크플로우에 새 분석/편집 단계를 추가합니다.

## 입력
- $ARGUMENTS: 단계 설명 (예: "경쟁사 벤치마킹 분석", "AI 해시태그 추천" 등)

## 기존 AI-PLAN 구조

### Server
- `server/src/controllers/aiPlanController.js` — 파일 업로드 (multer + iconv CP949), S3 연동, 분석 상태 추적
- `server/src/routes/aiPlan.js`
- `server/src/sql/aiPlan/` — selectQuery, insertQuery, updateQuery

### Client
- `client/src/lib/aiPlanConstants.js` — 단계 정의 상수
- `client/src/hooks/useAIPlan.js` — TanStack Query Hook
- `client/src/components/AI-PLAN/AIPlanRouter.jsx` — 단계별 라우팅
- `client/src/components/AI-PLAN/` 하위 컴포넌트:
  - `Dashboard.jsx` — 대시보드
  - `ProductAnalysis.jsx` — 제품 분석
  - `InfluencerAnalysis.jsx` — 인플루언서 분석
  - `Confirm.jsx` — 확인
  - `Result.jsx` — 결과
  - `Modify.jsx` — 수정
  - `FinalReview.jsx` — 최종 리뷰

### 워크플로우
Dashboard → ProductAnalysis → InfluencerAnalysis → Confirm → Result → Modify → FinalReview

## 수행 작업
1. `aiPlanConstants.js`에 새 단계 상수 추가
2. `AI-PLAN/` 하위에 새 단계 컴포넌트 생성
3. `AIPlanRouter.jsx`에 라우팅 추가
4. `StepProgressBar.jsx`에 단계 표시 추가
5. 필요 시 서버 API 추가

## 규칙
- 기존 AI-PLAN 컴포넌트를 수정하지 않고 새 단계만 추가
- 단계 간 데이터 전달은 기존 패턴 (useAIPlan Hook) 따름
- 파일 업로드 시 CP949 인코딩 처리 유지
