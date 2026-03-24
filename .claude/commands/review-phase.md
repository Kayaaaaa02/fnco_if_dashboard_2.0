# Phase별 코드 리뷰

캠페인 9-Phase 파이프라인의 특정 Phase 코드를 리뷰합니다.

## 입력
- $ARGUMENTS: Phase 번호 또는 이름 (예: "Phase 4", "Creative", "Monitor" 등)

## 리뷰 대상 매핑

| Phase | Frontend | Backend | Hooks |
|-------|----------|---------|-------|
| 1. PDA | `components/pda/` | `controllers/pdaController.js` | `usePDA.js` |
| 2. Strategy | — | `controllers/strategyController.js` | `useStrategy.js` |
| 3. Content | `components/content-plan/` | `controllers/calendarController.js` | `useCalendar.js` |
| 4. Creative | `components/creative/` | `controllers/creativeController.js` | `useCreatives.js` |
| 5. Influencer | `components/influencer/` | `controllers/influencerController.js` | `useInfluencers.js` |
| 6. Outreach | `components/outreach/` | `controllers/outreachController.js` | `useOutreach.js` |
| 7. Launch | `components/launch/` | `controllers/launchController.js` | `useLaunch.js` |
| 8. Monitor | `components/monitor/` | `controllers/monitorController.js` | `useMonitor.js` |
| 9. Optimize | `components/monitor/` | `controllers/optimizationController.js` | `useOptimization.js` |

## 리뷰 체크리스트

1. **API 연동**: Hook ↔ Route ↔ Controller ↔ SQL 체인 정합성
2. **에러 핸들링**: try/catch, 사용자 친화적 에러 메시지
3. **보안**: SQL Injection 방지 (parameterized query), XSS 방지
4. **성능**: 불필요한 리렌더링, N+1 쿼리, 캐싱 전략
5. **UX**: 로딩 상태, 에러 상태, 빈 상태 처리
6. **팀 격리**: teamIsolation 미들웨어 적용 여부

## 규칙
- Phase 1 (PDA) 리뷰는 읽기 전용 — 수정 제안 금지
- 리뷰 결과를 구조적으로 정리 (OK / Warning / Issue)
- 수정 제안 시 기존 코드를 삭제하지 않는 방향으로 제안
