# FNCO Influencer Seeding — 행위론 기반 재설계 Tasks

## Phase A: 기반 설정 ✅
- [x] React Router v6 도입 + 라우트 구조 설정
- [x] TanStack Query 설정 + API 클라이언트 (`lib/queryClient.js`, `services/api.js`)
- [x] AppLayout + CampaignLayout 레이아웃 컴포넌트
- [x] DB 마이그레이션 스크립트 (`server/scripts/migrate-v2.js` — 13 테이블 + 1 뷰)
- [x] 캠페인 CRUD API + UI (CampaignList, CampaignCreate, CampaignHub, PhaseCard)

## Phase B: P.D.A. 엔진 ✅
- [x] P.D.A. SQL (select/insert/update/delete) + Controller + Routes
- [x] P.D.A. Mock AI 생성 (personas, desires, awareness, concepts)
- [x] PDASetup, PDAMatrix, PersonaEditor, DesireEditor, ConceptGrid, ConceptCard UI
- [x] usePDA 훅 (TanStack Query)

## Phase C: 전략 + 콘텐츠 기획 ✅
- [x] Strategy SQL/Controller/Routes + Mock AI 생성/승인
- [x] Strategy, StrategyApproval UI
- [x] Calendar SQL/Controller/Routes + Mock AI 생성
- [x] ContentPlan, CalendarView UI
- [x] useStrategy, useCalendar 훅

## Phase D: 크리에이티브 제작 ✅
- [x] Creative SQL/Controller/Routes + Mock AI 카피/시나리오/이미지 생성
- [x] CreativeList, CreativeCard, CreativeEditor UI
- [x] CopyEditor (AI 변형 포함), ScenarioEditor (유연한 구조)
- [x] ImageGenerator (AI 이미지 생성)
- [x] useCreatives 훅

## Phase E: 인플루언서 매칭 + 소통 ✅
- [x] CampaignInfluencer SQL/Controller/Routes + Mock P.D.A. 매칭
- [x] InfluencerMatch, InfluencerMatchCard, InfluencerDetail UI
- [x] Outreach SQL/Controller/Routes + Mock 브리프/이메일 생성
- [x] Outreach, OutreachCard, BriefEditor, EmailPreview UI
- [x] useInfluencers, useOutreach 훅

## Phase F: 론칭 + 모니터링 ✅
- [x] Launch SQL/Controller/Routes + 스케줄 생성/승인/실행
- [x] Launch, ScheduleCalendar, ApprovalFlow UI
- [x] Monitor SQL/Controller/Routes + Mock 성과 지표
- [x] Monitor, MetricCard, PDAHeatmap, FatigueTracker UI
- [x] useLaunch, useMonitor 훅

## Phase G: 통합 ✅
- [x] 서버 index.js에 모든 V2 라우트 등록 (10개 라우트)
- [x] AppRouter.jsx 완성 (전체 9 Phase 라우트)
- [x] App.jsx에 V2 라우트 분기 통합 (V1 기존 기능 유지)
- [x] creativeRoutes 누락 수정

## Sentry Error Tracking ✅
- [x] @sentry/react 설치 (client)
- [x] @sentry/node 설치 (server)
- [x] client/src/lib/sentry.js 생성 (browserTracing + replay 통합)
- [x] client/src/main.jsx에 initSentry() 호출 추가
- [x] server/src/lib/sentry.js 생성 (requestHandler + errorHandler)
- [x] server/src/index.js에 Sentry 미들웨어 연결
- [x] RouteErrorBoundary에 Sentry.captureException 연결
- [x] .env.example 파일 생성 (VITE_SENTRY_DSN, SENTRY_DSN)

## Phase H: 클라이언트사이드 PDF/PPT/CSV 내보내기 ✅
- [x] exportPDF.js — html2pdf 기반 PDF 내보내기 유틸
- [x] exportPPT.js — PptxGenJS 기반 PPT 내보내기 유틸
- [x] exportCSV.js — XLSX 기반 Excel/CSV 내보내기 유틸
- [x] ExportMenu.jsx — 드롭다운 내보내기 메뉴 컴포넌트
- [x] Monitor.jsx에 ExportMenu 통합 (PDF + Excel)
- [x] InfluencerMatch.jsx에 ExportMenu 통합 (PDF + Excel)

## Notification System ✅
- [x] notificationController.js — dw_notification 테이블 자동 생성 + CRUD
- [x] notificationRoutes.js — GET/POST/PATCH 라우트
- [x] server index.js에 /api/v2/notifications 라우트 등록
- [x] useNotifications.js — TanStack Query 훅 (30초 polling)
- [x] NotificationBell.jsx — Popover 알림 벨 컴포넌트
- [x] AppLayout.jsx에 상단 헤더 바 + NotificationBell 통합
- [x] Vite 빌드 성공 확인

## Nodemailer 이메일 발송 ✅
- [x] nodemailer 설치 (server)
- [x] server/src/lib/mailer.js 생성 (SMTP transporter + sendEmail + MOCK fallback)
- [x] outreachController.js sendOutreach에 실제 이메일 발송 로직 연결
- [x] .env.example에 SMTP 환경변수 추가 (SMTP_HOST/PORT/USER/PASS/FROM)
- [x] EmailPreview.jsx에 발송 확인 단계 추가 (2단계 클릭)
- [x] Vite 빌드 성공 확인

## WebSocket Real-Time Updates (Socket.IO) ✅
- [x] server/src/lib/socketManager.js — Socket.IO 서버 초기화 + 캠페인 룸 관리
- [x] server/src/index.js — http.createServer 전환 + initSocketIO 연결
- [x] client/src/lib/socket.js — Socket.IO 클라이언트 초기화 + 캠페인 룸 join/leave
- [x] client/src/hooks/useSocket.js — useCampaignSocket + useGlobalSocket 훅 (TanStack Query 캐시 무효화)
- [x] client/src/main.jsx — initSocket() 호출 추가
- [x] CampaignLayout.jsx — useCampaignSocket 훅 통합
- [x] Vite 빌드 성공 확인

## #15 Access Management (권한 관리) UI ✅
- [x] useRoles.js 훅 생성 (V1 API 엔드포인트, TanStack Query)
- [x] AccessManagement.jsx 3-패널 레이아웃 컴포넌트 생성
- [x] SettingsPage.jsx에 4번째 탭 (권한 관리) 추가
- [x] Vite 빌드 성공 확인

## #16 Multi-Team Isolation (다중 팀 격리) ✅
- [x] server/src/middleware/teamIsolation.js 생성 (x-team-code/x-user-role 헤더 기반)
- [x] selectQuery.js에 team_code 필터 조건 추가
- [x] campaignController.js getCampaigns에 req.teamCode 전달
- [x] server/src/index.js에 teamIsolation 미들웨어 등록 + CORS 헤더 업데이트
- [x] TeamSettings.jsx 팀 관리 UI 컴포넌트 생성 (팀 목록 + 멤버 테이블)
- [x] SettingsPage.jsx에 5번째 탭 (팀 관리) 추가
- [x] Vite 빌드 성공 확인

## #17 Campaign Templates (캠페인 템플릿) ✅
- [x] server/src/controllers/templateController.js 생성 (mst_campaign_template 자동 생성 + CRUD)
- [x] server/src/routes/templateRoutes.js 생성 (GET/POST/DELETE + create-campaign)
- [x] server/src/index.js에 /api/v2/templates 라우트 등록
- [x] client/src/hooks/useTemplates.js 생성 (TanStack Query 훅 5개)
- [x] client/src/components/campaign/TemplateGallery.jsx 생성 (카테고리 필터 + 프리뷰 + 삭제)
- [x] CampaignCreate.jsx에 템플릿 선택/저장 기능 통합
- [x] Vite 빌드 성공 확인

## #18 Version Comparison / Diff Viewer (버전 비교) ✅
- [x] client/src/lib/jsonDiff.js 생성 (재귀 JSON diff 유틸 — computeDiff, getPathLabel, summarizeDiff, groupChangesByRoot)
- [x] client/src/components/diff/DiffViewer.jsx 생성 (범용 diff 뷰어 — inline/side-by-side 전환, 접기 그룹, 변경 요약 배지)
- [x] StrategyApproval.jsx에 "이전 버전과 비교" 버튼 추가 (version > 1일 때 활성화, mock 데이터 기반 diff)
- [x] CreativeEditor.jsx에 "버전 비교" 버튼 추가 (version > 1일 때 활성화, Dialog 기반 diff)
- [x] Vite 빌드 성공 확인

## #19 Bulk Operations (대량 작업) ✅
- [x] client/src/hooks/useBulkSelection.js 생성 (selectedIds, toggle, selectAll, clearSelection, toggleAll)
- [x] client/src/components/bulk/BulkActionBar.jsx 생성 (고정 하단 바, 애니메이션, 액션 버튼)
- [x] server/src/controllers/campaignInfluencerController.js에 bulkUpdateInfluencers 추가 (approve/reject/update_status)
- [x] server/src/routes/campaignInfluencer.js에 PATCH /bulk 라우트 추가 (/:profileId 앞에 배치)
- [x] client/src/hooks/useInfluencers.js에 useBulkUpdateInfluencers 훅 추가
- [x] InfluencerMatch.jsx에 전체선택 + BulkActionBar 통합 (일괄 승인/거절/상태변경)
- [x] InfluencerMatchCard.jsx에 체크박스 추가 (선택적 prop)
- [x] Outreach.jsx에 전체선택 + BulkActionBar 통합 (일괄 발송/삭제)
- [x] OutreachCard.jsx에 체크박스 추가 (선택적 prop)
- [x] client/src/hooks/useOutreach.js에 useBulkSendOutreach, useBulkDeleteOutreach 추가
- [x] CreativeList.jsx에 전체선택 + BulkActionBar 통합 (일괄 승인/상태변경)
- [x] CreativeCard.jsx에 체크박스 추가 (선택적 prop)
- [x] client/src/hooks/useCreatives.js에 useBulkUpdateCreativeStatus 추가
- [x] Vite 빌드 성공 확인

## #22 V1→V2 Complete Migration ✅
- [x] App.jsx에서 V1 컴포넌트 임포트 및 레거시 라우팅 코드 제거
- [x] App.jsx를 단순 AppRouter 위임 구조로 변환
- [x] AppRouter.jsx에 V1 리다이렉트 추가 (/AI-PLAN/* → /campaigns, /access-management → /settings)
- [x] Catch-all 라우트 추가 (알 수 없는 경로 → /campaigns)
- [x] V1 컴포넌트 파일은 삭제하지 않음 (참조용 보존)
- [x] Vite 빌드 성공 확인

## 향후 작업 (다음 세션)
- [ ] 감사 로그 미들웨어 연결 (dw_audit_log)
- [ ] FastAPI AI 엔드포인트 연결 (Mock → 실제 Gemini/Imagen)
- [x] 기존 콘텐츠 라이브러리 → ContentLibrary 통합
- [x] 기존 인플루언서 풀 → InfluencerPool 통합
- [x] E2E 테스트 (Playwright — campaign-lifecycle, pda-framework, navigation, auth)
- [ ] DiffViewer에 실제 버전 히스토리 API 연결 (mock → 실제 audit log 데이터)
