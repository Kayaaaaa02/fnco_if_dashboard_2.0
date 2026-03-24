# Azure AD SSO 인증 추가

Microsoft Azure AD MSAL 기반 SSO 인증 기능을 확장합니다.

## 입력
- $ARGUMENTS: 인증 요구사항 (예: "특정 페이지 접근 제한", "팀별 권한 분리" 등)

## 기존 인증 구조

### Client
- `client/src/authConfig.js` — msalConfig (clientId, authority, redirectUri), loginRequest, graphConfig
- `client/src/services/authService.js` — msalInstance 초기화, `login()`, `callMsGraph()`
- `client/src/components/layout/AuthGuard.jsx` — 라우트 가드 (현재 passthrough stub)

### 인증 플로우
1. MSAL PublicClientApplication 초기화
2. login-redirect 방식 인증
3. Graph API `/v1.0/me` 호출로 사용자 정보 획득
4. AuthGuard가 `<Outlet />` 래핑

## 수행 작업
1. AuthGuard 활성화 또는 확장
2. 필요한 인증 조건 추가
3. 토큰 만료/갱신 처리
4. 역할 기반 접근 제어 (useRoles.js 연동)

## 규칙
- 기존 authConfig.js, authService.js 구조 유지
- 인증 정보(clientId, secret)는 환경변수로 관리
- DEMO_MODE에서는 인증 우회 지원
