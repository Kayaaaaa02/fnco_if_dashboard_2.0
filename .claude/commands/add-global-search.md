# 글로벌 검색 확장

Cmd/Ctrl+K 글로벌 검색 오버레이를 확장합니다.

## 입력
- $ARGUMENTS: 검색 요구사항 (예: "인플루언서 검색 추가", "콘텐츠 검색 추가" 등)

## 기존 구조
- `client/src/components/search/GlobalSearch.jsx`
  - Cmd/Ctrl+K 단축키 활성화
  - 정적 네비게이션 링크 + 실시간 캠페인 데이터 (useCampaigns) 병합
  - label/hint 기반 필터링
  - React Router navigate로 이동
  - 전체 클라이언트사이드 (별도 검색 API 없음)

- `client/src/components/search/FilterPanel.jsx` — 필터 패널

## 수행 작업
1. 새 검색 소스 데이터 추가 (Hook 연동)
2. 검색 결과 항목 렌더링 확장
3. 필요 시 서버사이드 검색 API 추가 (대량 데이터)

## 규칙
- 기존 GlobalSearch 검색 로직 유지
- 단축키 Cmd/Ctrl+K 유지
- 검색 결과는 즉시 필터링 (debounce 적용)
