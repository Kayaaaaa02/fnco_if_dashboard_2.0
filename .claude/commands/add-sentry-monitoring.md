# Sentry 에러 모니터링 확장

풀스택 Sentry 에러 트래킹을 확장합니다.

## 입력
- $ARGUMENTS: 모니터링 요구사항 (예: "커스텀 에러 경계 추가", "성능 트레이싱 설정" 등)

## 기존 구조

### Server
- `server/src/lib/sentry.js`
  - `initSentry(app)` — `@sentry/node` 초기화, `requestHandler` 미들웨어
  - `setupSentryErrorHandler(app)` — `errorHandler` 미들웨어

### Client
- `client/src/lib/sentry.js`
  - `initSentry()` — `@sentry/react` 초기화
  - `browserTracingIntegration` — 라우트 트레이싱
  - `replayIntegration` — 세션 리플레이
  - 환경별 DSN / 샘플링 레이트

## 수행 작업
1. 커스텀 에러 태그/컨텍스트 추가
2. 성능 트레이싱 범위 확장
3. 에러 경계 (ErrorBoundary) 컴포넌트 연동
4. 알림 규칙 설정 가이드

## 참고
- `client/src/components/error/ErrorFallback.jsx` — 에러 폴백 UI
- `client/src/components/error/RouteErrorBoundary.jsx` — 라우트 에러 경계

## 규칙
- Sentry DSN은 환경변수 관리 (SENTRY_DSN)
- 프로덕션만 활성화 (개발 환경 비활성화)
- 민감 정보 (토큰, 비밀번호) 필터링 필수
