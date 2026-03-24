# Diff/버전 비교 기능 추가

JSON diff 기반 버전 추적 및 비교 기능을 확장합니다.

## 입력
- $ARGUMENTS: 비교 대상 (예: "PDA 컨셉 변경 이력", "전략 문서 버전 비교" 등)

## 기존 구조

### Diff 유틸리티
- `client/src/lib/jsonDiff.js`
  - `computeDiff(before, after)` — 재귀적 JSON diff (added/removed/changed)
  - `getPathLabel(path)` — 경로 라벨링
  - `summarizeDiff(changes)` — 변경 요약
  - `groupChangesByRoot(changes)` — 루트 키 기준 그룹화

### Diff 뷰어
- `client/src/components/diff/DiffViewer.jsx`
  - 색상 코딩: 추가(green), 삭제(red), 변경(amber)
  - 사이드바이사이드 / 스택 레이아웃 토글
  - 경로 그룹별 접기/펼치기

## 수행 작업
1. 비교할 두 스냅샷 소스 결정 (DB 버전 히스토리 등)
2. computeDiff 호출하여 변경사항 추출
3. DiffViewer 컴포넌트로 시각화
4. 필요 시 서버에 스냅샷 저장 API 추가

## 규칙
- 기존 jsonDiff.js, DiffViewer.jsx 수정하지 않고 활용
- 대용량 JSON 비교 시 성능 고려 (깊이 제한)
