# API 디버깅

API 엔드포인트의 문제를 체계적으로 진단하고 수정합니다.

## 입력
- $ARGUMENTS: 문제 설명 (예: "캠페인 생성 API 500 에러", "인플루언서 목록 빈 응답" 등)

## 진단 순서

### 1. Route 확인
- `server/src/routes/` 에서 해당 엔드포인트 라우트 확인
- HTTP 메서드, 경로 파라미터, 미들웨어 체인 검증

### 2. Controller 확인
- `server/src/controllers/` 에서 핸들러 로직 확인
- req.params, req.query, req.body 파싱 검증
- try/catch 에러 핸들링 확인

### 3. SQL 쿼리 확인
- `server/src/sql/` 에서 쿼리 검증
- Parameterized query 파라미터 순서/개수 일치 확인
- NULL 처리 확인

### 4. DB 연결 확인
- `server/src/config/database.js` 풀 설정 확인
- 테이블/컬럼 존재 여부 확인

### 5. 프론트엔드 연동 확인
- `client/src/hooks/` 에서 API 호출 경로 확인
- `client/src/services/api.js` 에서 baseURL 확인
- TanStack Query 캐싱 이슈 확인

## 수정 시 규칙
- 기존 API 동작을 변경하지 않는다 (버그 수정만)
- 에러 메시지는 한국어로 작성
- console.error에 `[핸들러명]` 접두사 포함
- 수정 전후 영향 범위 확인
