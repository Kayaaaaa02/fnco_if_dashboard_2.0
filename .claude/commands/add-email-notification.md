# 이메일/알림 기능 추가

Nodemailer 기반 이메일 발송 및 알림 시스템을 확장합니다.

## 입력
- $ARGUMENTS: 알림 시나리오 (예: "인플루언서 승인 완료 이메일", "캠페인 마감 D-3 알림" 등)

## 기존 알림 구조

### Email (Server)
- `server/src/lib/mailer.js`
  - `getTransporter()` — SMTP 설정 (환경변수 기반)
  - `sendEmail({ to, subject, html })` — 이메일 발송
  - SMTP 미설정 시 graceful mock-mode fallback

### Notification (Full-stack)
- `server/src/controllers/notificationController.js` — 알림 CRUD
- `server/src/routes/notificationRoutes.js` — 알림 라우트
- `client/src/components/notification/NotificationBell.jsx` — 알림 벨 UI
- `client/src/hooks/useNotifications.js` — 알림 Hook

## 수행 작업
1. 이메일 템플릿 작성 (HTML)
2. Controller에 이메일 발송 트리거 추가
3. 인앱 알림 연동 (NotificationBell)
4. Socket.IO 실시간 알림 연동 (선택)

## 규칙
- SMTP 설정은 환경변수로 관리 (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- 이메일 발송 실패 시 에러 로깅만 (사용자 플로우 중단 금지)
- 한국어 이메일 제목/본문 지원
