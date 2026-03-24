# 실시간 Socket.IO 이벤트 추가

Socket.IO 기반 실시간 기능을 프로젝트 패턴에 맞게 추가합니다.

## 입력
- $ARGUMENTS: 실시간 기능 설명 (예: "캠페인 상태 변경 실시간 알림", "공동 편집 커서 공유" 등)

## 기존 Socket 구조

### Server
- `server/src/lib/socketManager.js`
  - `initSocketIO(server)` — Socket.IO 서버 초기화
  - `emitToCampaign(campaignId, event, data)` — 캠페인 룸 대상 emit
  - `emitToAll(event, data)` — 전체 브로드캐스트
  - 룸 기반 네임스페이스: `campaign:{id}`

### Client
- `client/src/lib/socket.js`
  - `initSocket()` — 싱글톤 소켓 초기화 + reconnect 로직
  - `getSocket()` — 소켓 인스턴스 반환
  - `joinCampaign(campaignId)` — 캠페인 룸 참여
  - DEMO_MODE일 때 no-op 프록시

### Hook
- `client/src/hooks/useSocket.js` — 소켓 이벤트 리스너 관리

## 수행 작업
1. **Server**: socketManager에 새 이벤트 emit 함수 추가 또는 기존 controller에서 emit 호출
2. **Client**: useSocket hook으로 이벤트 리스너 등록
3. 필요 시 새 룸/네임스페이스 정의

## 규칙
- 기존 socketManager.js 패턴 유지 (initSocketIO, emitToCampaign)
- DEMO_MODE 호환성 유지
- 이벤트명은 `{도메인}:{액션}` 형식 (예: `monitor:kpi-update`)
