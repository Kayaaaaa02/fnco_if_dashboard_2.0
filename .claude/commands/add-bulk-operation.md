# 대량 작업 기능 추가

다중 항목 선택 및 일괄 처리 기능을 추가합니다.

## 입력
- $ARGUMENTS: 대량 작업 대상 (예: "인플루언서 일괄 태그", "크리에이티브 일괄 승인" 등)

## 기존 구조

### Hook
- `client/src/hooks/useBulkSelection.js`
  - `Set<string>` 기반 선택 ID 관리
  - `toggle(id)`, `selectAll(ids)`, `clearSelection()`
  - `selectedCount`, `isSelected(id)` 유틸

### UI
- `client/src/components/bulk/BulkActionBar.jsx`
  - 선택 시 화면 하단 슬라이드업 바
  - 설정 가능한 액션 버튼 렌더링 (태그, 내보내기, 삭제 등)

## 수행 작업
1. 대상 목록 컴포넌트에 `useBulkSelection` Hook 연결
2. 체크박스 UI 추가 (각 행/카드)
3. `BulkActionBar`에 액션 버튼 정의
4. 서버에 벌크 API 엔드포인트 추가 (POST /api/{도메인}/bulk)

## 규칙
- 기존 useBulkSelection, BulkActionBar 패턴 활용
- 벌크 API는 ID 배열 받아 처리 (`{ ids: [...] }`)
- 대량 삭제는 확인 다이얼로그 필수
