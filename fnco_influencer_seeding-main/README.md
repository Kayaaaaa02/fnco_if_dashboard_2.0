# FnCo Influencer Seeding Platform

인플루언서 시딩 캠페인의 기획부터 실행, 모니터링까지 **9-Phase 행위론 기반 프레임워크**로 관리하는 풀스택 웹 플랫폼입니다.

V2에서는 V1의 독립 모듈(AI-PLAN, 콘텐츠 관리, 인플루언서 풀)을 **캠페인 중심 단일 워크플로우**로 통합했습니다.

## 핵심 구조: 9-Phase 캠페인 파이프라인

```
Phase 1   Phase 2    Phase 3     Phase 4      Phase 5
P.D.A. → Strategy → Content  → Creative  → Influencer
Setup     Design    Planning    Production   Matching
  │                                            │
  │  ┌─ AI 제품분석                    ┌─ AI 추천 기획안
  │  └─ 제품 업로드                    └─ P.D.A. 매칭 점수
  │
Phase 6     Phase 7    Phase 8     Phase 9
Outreach → Launch  → Monitor  → Optimize
Comms      Deploy    Track       Iterate
                │                    │
                ├─ 최종 리뷰          └─ UGC 플라이휠
                └─ PPT 내보내기           피로도 추적
```

## 주요 기능

| 영역 | 기능 | 설명 |
|------|------|------|
| **캠페인 빌더** | 상태 워크스페이스 + 9-Phase 진입 | `NEW / 진행중 / 완료` 상태별 목록, 신규 생성, 이번 주 Action Plan |
| **P.D.A. 프레임워크** | Persona-Desire-Awareness | AI 자동 생성 + 수동 편집, 컨셉 매트릭스 |
| **AI-PLAN 통합** | 제품분석 · 기획편집 · 이미지생성 | V1 AI-PLAN 6단계를 V2 Phase에 분산 삽입 |
| **콘텐츠 엔진** | 시딩/UGC/프리뷰/성과 | BF Score(1~3), GEO Ready 필터, 영상 분석/성과 룰 |
| **크리에이터 허브** | 운영 대시보드 + 네트워크 | Creator Pipeline 시각화, 2-Mode View(Pipeline/List), 심층 분석 |
| **인플루언서 풀** | 후보 발굴/검증/선정 | 플랫폼/카테고리/국가 필터 + 허브 대상 확정 연동 |
| **Analytics** | 파이프라인/플랫폼 성과 | Creator Volume, GEO Ready Ratio, 플랫폼 성과 집계 |
| **크리에이티브 제작** | 카피 · 시나리오 · AI 이미지 | 4-Step 타임라인 이미지 (HOOK/MIDDLE/HIGHLIGHT/CTA) |
| **실시간 모니터링** | KPI · 피로도 · UGC 플라이휠 | Socket.IO 실시간 업데이트 + PDA 히트맵 |
| **대량 작업** | 일괄 승인/거절/발송 | 인플루언서, 소통, 크리에이티브 일괄 처리 |
| **내보내기** | PDF · PPT · Excel | 캠페인 데이터 + AI-PLAN 결과 내보내기 |
| **다국어** | ko · en · zh | 한국어 · 영어 · 중국어 3개 언어 |

## 좌측 메뉴 IA (최종)

1. 캠페인 빌더
2. 콘텐츠 엔진
3. 크리에이터 허브
4. 인플루언서 풀
5. Analytics
6. 설정

캠페인 빌더를 클릭하면 하위 상태 메뉴가 열립니다.

- NEW (`/campaigns?status=draft`)
- 진행중 (`/campaigns?status=active`)
- 완료 (`/campaigns?status=completed`)

## 아키텍처

```
Browser (React 18 SPA)
    │  Azure AD MSAL (SSO)
    │  TanStack Query v5 (서버 상태)
    │  Socket.IO Client (실시간)
    ▼
Express.js v5 Server (Node.js, :5000)
    │
    ├── /api/v2/campaigns/*          → 캠페인 CRUD + 9-Phase 하위 리소스
    │   ├── /:id/pda/*               → P.D.A. 페르소나/욕구/인지도/컨셉
    │   ├── /:id/strategy/*          → 전략 설계 + 승인
    │   ├── /:id/calendar/*          → 콘텐츠 캘린더
    │   ├── /:id/creatives/*         → 크리에이티브 제작
    │   ├── /:id/influencers/*       → 인플루언서 매칭 + 벌크
    │   ├── /:id/outreach/*          → 소통 브리프/이메일
    │   ├── /:id/launch/*            → 론칭 스케줄
    │   └── /:id/monitor/*           → 성과 지표
    │
    ├── /api/v2/templates/*          → 캠페인 템플릿
    ├── /api/v2/notifications/*      → 알림 시스템
    │
    ├── /api/ai-plan/*               → V1 AI 제품분석/기획편집/탑콘텐츠
    ├── /api/ai-image/*              → V1 AI 이미지 생성/선택
    ├── /api/contents/*              → V1 콘텐츠 CRUD + 영상분석
    ├── /api/crawling/*              → V1 소셜미디어 크롤링
    ├── /api/influencer/*            → V1 인플루언서 풀
    └── /api/user-*                  → V1 사용자/권한 관리
         │
    ┌────┴────┐
    ▼         ▼
PostgreSQL   FastAPI Microservice (EC2)
(fnco_influencer)   ├── Gemini AI 분석
    │               ├── Imagen 이미지 생성
    │               ├── 인플루언서 프로필 스크래핑
    ▼               └── 소셜 미디어 크롤링 API
  AWS S3
(plan 문서 + AI 이미지 버전 관리)
```

## 기술 스택

### Frontend (`client/`)
- **React 18** + **Vite 6** (SWC)
- **TanStack Query v5** (서버 상태 관리 — 31개 커스텀 훅)
- **Redux Toolkit** (클라이언트 상태 — V1 레거시)
- **React Router v6** (캠페인 중심 중첩 라우팅)
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI 기반 50+ 컴포넌트)
- **Socket.IO Client** (실시간 캠페인 업데이트)
- **Recharts** (차트), **ReactFlow** (캠페인 플로우차트)
- **html2pdf.js** / **pptxgenjs** (PDF/PPT 내보내기)
- **xlsx** (엑셀 파싱), **Sentry** (에러 추적)
- **Azure MSAL** (SSO 인증)

### Backend (`server/`)
- **Express.js v5** (Node.js, ESM)
- **PostgreSQL** (`pg` pool — V1 테이블 + V2 13테이블 + 1뷰)
- **Socket.IO** (캠페인 룸 기반 실시간 통신)
- **Multer** (파일 업로드, 최대 500MB)
- **Nodemailer** (이메일 발송)
- **Helmet** + **CORS** (보안)
- **Sentry** (서버 에러 추적)

### Middleware
- **auditLog.js** — V2 API 변경사항 감사 로그
- **teamIsolation.js** — 다중 팀 데이터 격리 (x-team-code 헤더)

### Python Crawlers (`server/crawling/`)
- **instaloader** (Instagram), **yt-dlp** (YouTube)
- **TikTokApi** (TikTok), **tweepy** (X/Twitter)
- **playwright** (헤드리스 브라우저)

## 디렉토리 구조

```
fnco_influencer_seeding-main/
├── package.json                     # 루트 모노레포 (concurrently)
├── common/utils.js                  # 공유 URL 파서
├── tasks/
│   ├── todo.md                      # 태스크 추적
│   └── lessons.md                   # 세션별 교훈 기록
│
├── client/                          # ── React 프론트엔드 ──
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                 # 진입점 (QueryClient + Redux + Socket + Sentry)
│       ├── App.jsx                  # AppRouter 위임
│       │
│       ├── components/
│       │   │
│       │   │  ── V2 캠페인 모듈 (9-Phase) ──
│       │   ├── campaign/            # 캠페인 CRUD + 허브
│       │   │   ├── CampaignList.jsx
│       │   │   ├── CampaignCreate.jsx       # 생성 (+ 제품파일 업로드 + 템플릿)
│       │   │   ├── CampaignHub.jsx          # 9-Phase 대시보드 (+ AI-PLAN 상태)
│       │   │   ├── CampaignFlowchart.jsx    # ReactFlow 워크플로우
│       │   │   ├── PhaseCard.jsx
│       │   │   └── TemplateGallery.jsx      # 캠페인 템플릿
│       │   │
│       │   ├── pda/                 # Phase 1: P.D.A. 프레임워크
│       │   │   ├── PDASetup.jsx             # 메인 (+ 제품분석 + 업로드)
│       │   │   ├── PDAMatrix.jsx
│       │   │   ├── PersonaEditor.jsx
│       │   │   ├── DesireEditor.jsx
│       │   │   ├── ConceptGrid.jsx / ConceptCard.jsx
│       │   │   ├── ProductAnalysisSection.jsx  # AI 제품분석 결과
│       │   │   └── ProductUploadDialog.jsx     # 제품 파일 업로드
│       │   │
│       │   ├── strategy/            # Phase 2: 전략 설계
│       │   │   ├── Strategy.jsx
│       │   │   ├── StrategyApproval.jsx     # 버전 비교 (DiffViewer)
│       │   │   ├── NarrativeArc.jsx
│       │   │   └── AlignmentCheck.jsx
│       │   │
│       │   ├── content-plan/        # Phase 3: 콘텐츠 기획
│       │   │   ├── ContentPlan.jsx
│       │   │   └── CalendarView.jsx
│       │   │
│       │   ├── creative/            # Phase 4: 크리에이티브 제작
│       │   │   ├── CreativeList.jsx / CreativeCard.jsx
│       │   │   ├── CreativeEditor.jsx       # 메인 (+ 6섹션편집 + AI이미지)
│       │   │   ├── CopyEditor.jsx
│       │   │   ├── ScenarioEditor.jsx
│       │   │   ├── ImageGenerator.jsx
│       │   │   ├── HookBank.jsx / HookCard.jsx
│       │   │   ├── ModifySections.jsx       # 6섹션 아코디언 편집
│       │   │   └── TimelineImageGenerator.jsx  # 4-Step AI 이미지
│       │   │
│       │   ├── influencer/          # Phase 5: 인플루언서 매칭
│       │   │   ├── InfluencerMatch.jsx      # 메인 (+ AI추천 기획안)
│       │   │   ├── InfluencerMatchCard.jsx
│       │   │   ├── InfluencerDetail.jsx
│       │   │   └── AIRecommendedPlans.jsx   # AI 추천 기획안 카드
│       │   │
│       │   ├── outreach/            # Phase 6: 소통
│       │   │   ├── Outreach.jsx / OutreachCard.jsx
│       │   │   ├── BriefEditor.jsx
│       │   │   └── EmailPreview.jsx         # 2단계 발송 확인
│       │   │
│       │   ├── launch/              # Phase 7: 론칭
│       │   │   ├── Launch.jsx               # 메인 (+ 최종리뷰)
│       │   │   ├── ScheduleCalendar.jsx
│       │   │   ├── ApprovalFlow.jsx
│       │   │   ├── ChannelSetup.jsx / DropCoordination.jsx / DropTimeline.jsx
│       │   │   └── FinalReviewSection.jsx   # 최종리뷰 + PPT 내보내기
│       │   │
│       │   ├── monitor/             # Phase 8-9: 모니터링 + 최적화
│       │   │   ├── Monitor.jsx / MetricCard.jsx
│       │   │   ├── PDAHeatmap.jsx / FatigueTracker.jsx
│       │   │   ├── EarlySignal.jsx / CreativeRotation.jsx
│       │   │   ├── ChannelRebalance.jsx / MessagePivot.jsx
│       │   │   ├── OptimizationPanel.jsx
│       │   │   └── UGC*.jsx (Flywheel, Harvest, Curation, Amplify, CreatorTable)
│       │   │
│       │   │  ── V1→V2 통합 모듈 ──
│       │   ├── content-engine/      # 콘텐츠 엔진 (V1 콘텐츠관리 통합)
│       │   │   ├── SeedingContentForm.jsx
│       │   │   ├── UGCContentForm.jsx
│       │   │   ├── VideoAnalysisPanel.jsx
│       │   │   └── PerformanceRuleSettings.jsx
│       │   │
│       │   ├── creator-hub/         # 크리에이터 허브 (V1 인플루언서분석 통합)
│       │   │   ├── CreatorDeepAnalysis.jsx
│       │   │   ├── OverviewTab.jsx
│       │   │   ├── ContentAnalysisTab.jsx
│       │   │   └── BestPlanTab.jsx
│       │   │
│       │   │  ── 공통 모듈 ──
│       │   ├── layout/              # 레이아웃
│       │   │   ├── AppLayout.jsx            # 사이드바 + 헤더 + 알림벨
│       │   │   ├── CampaignLayout.jsx       # Outlet 컨텍스트 (campaign)
│       │   │   └── AuthGuard.jsx
│       │   │
│       │   ├── search/              # 글로벌 검색 + 필터
│       │   ├── notification/        # NotificationBell (30초 폴링)
│       │   ├── bulk/                # BulkActionBar (일괄 작업)
│       │   ├── diff/                # DiffViewer (버전 비교)
│       │   ├── audit/               # AuditLog (감사 로그)
│       │   ├── export/              # ExportMenu (PDF/PPT/Excel)
│       │   ├── settings/            # 설정 (일반/팀/권한/PDA/브랜드DNA)
│       │   ├── error/               # ErrorFallback, RouteErrorBoundary
│       │   ├── placeholder/         # 독립 페이지 (Analytics, ContentLibrary 등)
│       │   └── ui/                  # shadcn/ui 컴포넌트 (50+)
│       │
│       │   │  ── V1 레거시 (참조용 보존) ──
│       │   ├── AI-PLAN/             # V1 AI 캠페인 기획 (독립 서브앱)
│       │   ├── dashboard/           # V1 콘텐츠 대시보드
│       │   ├── Dashboard.jsx / LoginPage.jsx / AccessManagement.jsx
│       │   └── InfluencerContentForm.jsx / UGCForm.jsx / ContentList.jsx
│       │
│       ├── hooks/                   # ── TanStack Query 훅 (31개) ──
│       │   │  V2 캠페인 훅
│       │   ├── useCampaign.js       # 캠페인 CRUD
│       │   ├── usePDA.js            # P.D.A. 생성/편집
│       │   ├── useStrategy.js       # 전략 설계
│       │   ├── useCalendar.js       # 콘텐츠 캘린더
│       │   ├── useCreatives.js      # 크리에이티브 (+ 벌크)
│       │   ├── useInfluencers.js    # 인플루언서 매칭 (+ 벌크)
│       │   ├── useOutreach.js       # 소통 (+ 벌크)
│       │   ├── useLaunch.js         # 론칭 스케줄
│       │   ├── useMonitor.js        # 성과 지표
│       │   │
│       │   │  V2 부가 훅
│       │   ├── useTemplates.js      # 캠페인 템플릿
│       │   ├── useNotifications.js  # 알림 (30초 폴링)
│       │   ├── useSocket.js         # WebSocket (캐시 무효화)
│       │   ├── useAudit.js          # 감사 로그
│       │   ├── useBulkSelection.js  # 벌크 선택 상태
│       │   ├── useHookBank.js / useAlignment.js / useNarrativeArc.js
│       │   ├── useChannelSetup.js / useDropCoordination.js
│       │   ├── useEarlySignal.js / useOptimization.js / useUGCFlywheel.js
│       │   │
│       │   │  V1 API 래핑 훅 (v1Fetch 패턴)
│       │   ├── useAIPlan.js         # /api/ai-plan/* (제품분석, 기획편집, 탑콘텐츠)
│       │   ├── useAIImage.js        # /api/ai-image/* (이미지생성, 선택)
│       │   ├── useVideoAnalysis.js  # /api/contents/videoAnalysis/*
│       │   ├── useCrawling.js       # /api/crawling
│       │   ├── useContentLibrary.js # /api/contents/* (시딩/UGC CRUD)
│       │   ├── useInfluencerPool.js # /api/influencer/* (풀 검색/저장)
│       │   └── useRoles.js          # /api/user-access (권한 관리)
│       │
│       ├── lib/                     # ── 유틸리티 라이브러리 ──
│       │   ├── queryClient.js       # TanStack Query 설정
│       │   ├── socket.js            # Socket.IO 클라이언트
│       │   ├── sentry.js            # Sentry 초기화
│       │   ├── aiPlanConstants.js   # AI-PLAN 상수 (콘텐츠타입→훅, 타임라인)
│       │   ├── jsonDiff.js          # JSON diff 유틸
│       │   └── export*.js           # PDF / PPT / CSV 내보내기
│       │
│       ├── services/
│       │   ├── api.js               # V2 ApiClient (Axios, /api/v2 baseURL)
│       │   └── authService.js       # MSAL 인증
│       │
│       ├── mocks/data.js            # 개발용 목업 데이터
│       ├── store/                   # Redux (V1 레거시)
│       ├── locales/                 # i18n (ko.json, en.json, zh.json)
│       └── utils/                   # 레거시 유틸리티
│
└── server/                          # ── Node.js 백엔드 ──
    ├── src/
    │   ├── index.js                 # Express 진입점 (:5000, Socket.IO, Sentry)
    │   │
    │   ├── config/
    │   │   └── database.js          # PostgreSQL 연결 풀
    │   │
    │   ├── middleware/
    │   │   ├── auditLog.js          # V2 감사 로그
    │   │   └── teamIsolation.js     # 팀 데이터 격리
    │   │
    │   ├── lib/
    │   │   ├── mailer.js            # Nodemailer (SMTP/Mock)
    │   │   ├── sentry.js            # Sentry 서버
    │   │   └── socketManager.js     # Socket.IO 룸 관리
    │   │
    │   ├── routes/                  # ── API 라우트 (26개) ──
    │   │   │  V2 캠페인 라우트 (mergeParams: true)
    │   │   ├── campaign.js / pda.js / strategy.js / calendar.js
    │   │   ├── creative.js / campaignInfluencer.js / outreach.js
    │   │   ├── launch.js / monitor.js
    │   │   ├── hookBank.js / alignment.js / narrativeArc.js
    │   │   ├── channelSetup.js / dropCoordination.js
    │   │   ├── earlySignal.js / optimization.js / ugcFlywheel.js
    │   │   ├── templateRoutes.js / notificationRoutes.js / auditRoutes.js
    │   │   │
    │   │   │  V1 레거시 라우트
    │   │   ├── aiPlan.js            # /api/ai-plan/*
    │   │   ├── aiImage.js           # /api/ai-image/*
    │   │   ├── contents.js          # /api/contents/*
    │   │   ├── crawling.js          # /api/crawling
    │   │   ├── influencer.js        # /api/influencer/*
    │   │   └── user.js              # /api/user-*
    │   │
    │   ├── controllers/             # 비즈니스 로직 (25개, 라우트 1:1 대응)
    │   │
    │   ├── sql/                     # SQL 쿼리 모듈
    │   │   ├── seeding/ preview/ ugc/ performance/   # V1 콘텐츠
    │   │   ├── aiPlan/ aiImage/ influencer/           # V1 AI
    │   │   └── videoAnalysis/ schema/                 # V1 분석 + 스키마
    │   │
    │   └── utils/
    │       └── pythonRunner.js      # Python 크롤러 실행기
    │
    ├── crawling/                    # Python 크롤러
    │   ├── instagram_crawler.py / youtube_crawler.py
    │   ├── tiktok_crawler.py / twitter_crawler.py
    │   └── ... (헬퍼 스크립트)
    │
    ├── scripts/
    │   ├── init-db.js               # V1 DB 스키마 초기화
    │   └── migrate-v2.js            # V2 마이그레이션 (13테이블 + 1뷰)
    │
    └── uploads/plan-ai-images/      # AI 이미지 로컬 폴백
```

## V1 → V2 통합 매핑

V1의 독립 모듈이 V2의 어떤 Phase에 삽입되었는지:

| V1 모듈 | V2 위치 | 연결 방식 |
|---------|---------|-----------|
| AI-PLAN ProductAnalysis | Phase 1 PDA | `ProductAnalysisSection` + `ProductUploadDialog` |
| AI-PLAN InfluencerAnalysis | Phase 5 Influencer | `AIRecommendedPlans` (CONTENT_TYPE_TO_HOOKS 기반) |
| AI-PLAN Modify (6섹션) | Phase 4 Creative | `ModifySections` 아코디언 (감정/후킹/가이드/시나리오/프로덕션/주의) |
| AI-PLAN AIImageGeneration | Phase 4 Creative | `TimelineImageGenerator` (HOOK 0-3s / MIDDLE 3-9s / HIGHLIGHT 9-13s / CTA 13-15s) |
| AI-PLAN FinalReview | Phase 7 Launch | `FinalReviewSection` + PPT 내보내기 (pptxgenjs) |
| 콘텐츠 관리 | Content Engine + Campaign Builder | `SeedingContentForm`, `UGCContentForm`, `VideoAnalysisPanel` + 콘텐츠 큐 기반 Action Plan |
| 인플루언서 풀 | Influencer Pool + Creator Hub | `InfluencerPool` 후보 선별 → `CreatorHub` 파이프라인/심층 분석 |

## 라우팅

```
/                          → /campaigns (리다이렉트)
/login                     → LoginPage
/campaigns                 → CampaignList
/campaigns?status=draft    → CampaignList (NEW)
/campaigns?status=active   → CampaignList (진행중)
/campaigns?status=completed → CampaignList (완료)
/campaigns/new             → CampaignCreate
/campaigns/:id             → CampaignHub (9-Phase 대시보드)
/campaigns/:id/pda         → PDASetup
/campaigns/:id/strategy    → Strategy
/campaigns/:id/approval    → StrategyApproval
/campaigns/:id/calendar    → ContentPlan
/campaigns/:id/creative    → CreativeList
/campaigns/:id/creative/:cid → CreativeEditor
/campaigns/:id/influencer  → InfluencerMatch
/campaigns/:id/outreach    → Outreach
/campaigns/:id/launch      → Launch
/campaigns/:id/monitor     → Monitor
/content-library           → ContentLibrary (레거시/내부용)
/influencer-pool           → InfluencerPool (V1 통합)
/content-engine            → ContentEngine
/creator-hub               → CreatorHub
/analytics                 → AnalyticsPage
/settings                  → SettingsPage (5탭)
```

## DB 스키마

### V2 테이블 (migrate-v2.js)

| 테이블 | 설명 |
|--------|------|
| `mst_campaign` | 캠페인 마스터 (9-Phase 진행상태, brand_dna, plan_doc_id) |
| `mst_pda_persona` | P.D.A. 페르소나 |
| `mst_pda_desire` | P.D.A. 욕구 |
| `mst_pda_awareness` | P.D.A. 인지도 단계 |
| `mst_pda_concept` | P.D.A. 컨셉 (페르소나×욕구 교차) |
| `dw_campaign_strategy` | 전략 버전 관리 |
| `dw_content_calendar` | 콘텐츠 캘린더 |
| `dw_creative` | 크리에이티브 에셋 |
| `dw_campaign_influencer` | 캠페인-인플루언서 매칭 |
| `dw_outreach` | 소통 브리프/이메일 |
| `dw_launch_schedule` | 론칭 스케줄 |
| `dw_performance_metric` | 성과 지표 |
| `dw_audit_log` | 감사 로그 |
| `dw_notification` | 알림 |
| `mst_campaign_template` | 캠페인 템플릿 |
| `vw_pda_heatmap` | P.D.A. 히트맵 뷰 |

### V1 테이블 (기존)

| 테이블 | 설명 |
|--------|------|
| `mst_plan_doc` | AI Plan 문서 (S3 경로, 버전) |
| `dw_plan_doc_analysis` | AI 분석 결과 JSON (ko/cn/eng) |
| `mst_influencer` | 인플루언서 프로필 |
| `dw_influencer_ai_analysis` | 인플루언서 AI 분석 |
| `dw_plan_ai_image` | AI 생성 이미지 (step 1-4) |
| `vw_mst_post` | 콘텐츠 포스트 뷰 |
| `users` / `user_access` | 사용자 + RBAC |

## 환경 변수

### Server (`.env`)
```env
PORT=5000
DB_HOST=                    # PostgreSQL 호스트
DB_PORT=35430               # PostgreSQL 포트
DB_USER=                    # PostgreSQL 사용자
DB_PASSWORD=                # PostgreSQL 비밀번호
DB_NAME=                    # PostgreSQL DB명
API_URL=                    # FastAPI 마이크로서비스 URL
IMAGE_PATH=                 # 로컬 이미지 서빙 경로
BASE_URL=                   # 서버 기본 URL

# Optional
SMTP_HOST=                  # 이메일 SMTP 호스트
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SENTRY_DSN=                 # Sentry 에러 추적
```

### Client (`.env`)
```env
VITE_API_BASE_URL=          # Express API URL (예: http://localhost:5000)
VITE_MSAL_CLIENT_ID=        # Azure AD 앱 ID
VITE_MSAL_AUTHORITY=        # Azure AD Authority
VITE_MSAL_REDIRECT_URI=
VITE_MSAL_POST_LOGOUT_REDIRECT_URI=
VITE_MUI_LICENSE_KEY=       # MUI X Pro 라이선스
VITE_SENTRY_DSN=            # Sentry 클라이언트 DSN
```

## 실행 방법

### 사전 요구사항
- Node.js 18+
- Python 3.10+
- PostgreSQL
- FastAPI 마이크로서비스 (EC2, AI 기능 사용 시)

### 설치 및 실행

```bash
# 의존성 설치
npm install
cd server && npm install
cd ../client && npm install

# Python 크롤러 (선택)
cd ../server && pip install -r requirements.txt

# DB 초기화
node scripts/init-db.js         # V1 스키마
node scripts/migrate-v2.js      # V2 마이그레이션

# 개발 서버 (루트에서)
cd ..
npm run dev                     # client(:5173) + server(:5000) 동시 실행
```

### 빌드

```bash
cd client && npx vite build     # → client/build/
```
