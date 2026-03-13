# Lessons

## 2026-02-26
- LoginPage uses named export `{ LoginPage }`, not default export. Always verify export style before writing imports.
- Existing AppRouter already had phases A-E routes. Check file state before overwriting to avoid losing comments/structure.
- When agents run in parallel, some may modify the same file (e.g., AppRouter.jsx). Always re-read before editing to avoid conflicts.
- Express `app.use('/api/v2/campaigns/:id/...')` with path params requires `mergeParams: true` on sub-routers — all V2 routes correctly implemented this.
- `creativeRoutes` was missing from server index.js even though the route file was created — always cross-check imports after parallel agent creation.
- V1/V2 coexistence: App.jsx routes V2 paths (`/campaigns/*`) to AppRouter while keeping legacy V1 code for existing paths (`/`, `/AI-PLAN/*`, `/access-management`).
- Parallel agents modifying same file (AppLayout.jsx): Notification agent finished first (added header bar), Search agent re-read the file and correctly adapted. Instruction to "re-read before editing" in agent prompts is critical.
- Long-running agents can time out — set reasonable timeouts and be prepared to stop/redo the work manually (e.g., audit log agent a361230 was stopped and reimplemented directly).
- Build must run from `client/` subdirectory, NOT project root. `cd fnco_influencer_seeding-main/client && npx vite build`.
- notificationRoutes uses simple `/api/v2/notifications` path (no campaign scoping) since notifications are user-level, not campaign-level.
- ApiClient.patch(path, body) only accepts 2 args. For query params, use api.request('PATCH', path, { params }) instead.
- V1 API endpoints use `/api/influencer/*` (no /v2 prefix). The V2 ApiClient hardcodes `/api/v2` baseURL, so V1 calls need direct fetch. Created separate `v1Fetch` helper in useInfluencerPool.js.
- Server `mapRowToInfluencer` returns camelCase fields (name, isSaved, avgViews, quickSummary, profileUrl, profileImage) — not snake_case. Always check server controller mapper before assuming field names.

## 2026-02-27
- **V1 API 엔드포인트 경로 불일치**: BATCH 0에서 V1 훅을 생성할 때 서버 라우트 파일을 직접 확인하지 않고 path param 방식(`/:planDocId/analysis`)으로 작성했으나, 서버는 query param 방식(`/analysis?plan_doc_id=xxx`)을 사용. **반드시 서버 route 파일을 먼저 읽고 훅을 작성할 것.**
- ai-plan: `GET /analysis?plan_doc_id=xxx`, `GET /refined?plan_doc_id=xxx`, `POST /update-refined` (not PUT with path), `GET /top-content?plan_doc_id=xxx`
- ai-image: `GET /images?plan_doc_id=xxx`, `POST /generate-image` (JSON) or `/generate-prompt` (FormData), `PATCH /image/select` (not POST /:id/save)
- contents/videoAnalysis: `GET /videoAnalysis?post_id=xxx` (not `/:postId`), 업로드는 `POST /preview/individual` (not `/videoAnalysis/upload`)
- PDASetup에서 `plan_doc_id`를 `pdaData`에서 가져오던 것을 `campaign` (useOutletContext)에서 가져오도록 수정 — 다른 5개 phase 컴포넌트와 일관성 확보
- AIRecommendedPlans: planDocId 없을 때 빈 카드 표시 대신 `return null`로 통일 — 대부분의 캠페인이 AI-PLAN 미연동이므로 노이즈 방지
