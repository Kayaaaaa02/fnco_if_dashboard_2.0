# 모니터링 위젯 추가

Phase 8 (Monitor) 대시보드에 새 모니터링 위젯을 추가합니다.

## 입력
- $ARGUMENTS: 위젯 설명 (예: "인플루언서 응답률 추적", "콘텐츠 도달 범위 히트맵" 등)

## 수행 작업

1. **컴포넌트** 생성: `client/src/components/monitor/{WidgetName}.jsx`
   - shadcn/ui Card 기반 레이아웃
   - recharts 차트 라이브러리 사용 (BarChart, LineChart, PieChart 등)
   - 로딩 상태: Skeleton 컴포넌트
   - 실시간 데이터 시 Socket.IO 연동 (useSocket hook)

2. **Hook 확장** (필요 시):
   - `client/src/hooks/useMonitor.js` — 새 쿼리 함수 추가
   - 또는 `client/src/hooks/useEarlySignal.js`, `useOptimization.js` 확장

3. **Backend** (필요 시):
   - Controller: `server/src/controllers/monitorController.js`에 핸들러 추가
   - Route: `server/src/routes/monitor.js`에 GET 엔드포인트 추가
   - SQL: `server/src/sql/monitor/` 하위 쿼리 추가

## 기존 모니터 위젯 참고
- `EarlySignal.jsx` — 조기 신호 감지
- `FatigueTracker.jsx` — 피로도 추적
- `OptimizationPanel.jsx` — 최적화 패널
- `UGCHarvest.jsx` / `UGCAmplify.jsx` — UGC 수확/증폭
- `CreativeRotation.jsx` — 크리에이티브 로테이션
- `ChannelRebalance.jsx` — 채널 리밸런싱
- `MessagePivot.jsx` — 메시지 피벗

## 규칙
- 기존 모니터 위젯을 수정하지 않는다
- Socket.IO 실시간 업데이트 지원 고려
- 반응형 그리드 레이아웃 (lg:col-span-2 등)
