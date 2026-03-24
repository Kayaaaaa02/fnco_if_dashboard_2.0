# API 엔드포인트 추가

새 API 엔드포인트를 프로젝트 패턴에 맞게 생성합니다.

## 입력
- $ARGUMENTS: 도메인명 (예: "reward", "notification" 등)

## 수행 작업

1. **SQL 쿼리 모듈** 생성: `server/src/sql/{도메인}/`
   - `selectQuery.js` — 목록/단건 조회
   - `insertQuery.js` — 신규 등록
   - `updateQuery.js` — 수정
   - `deleteQuery.js` — 삭제 (soft delete)
   - 패턴 참고: `server/src/sql/campaign/insertQuery.js` (parameterized query + RETURNING *)

2. **Controller** 생성: `server/src/controllers/{도메인}Controller.js`
   - `import { pool } from '../config/database.js'`로 DB 연결
   - SQL 모듈에서 쿼리 import
   - try/catch + 한국어 에러 메시지
   - `req.teamCode` 기반 팀 격리 적용 (teamIsolation 미들웨어)
   - 패턴 참고: `server/src/controllers/campaignController.js`

3. **Route** 생성: `server/src/routes/{도메인}.js`
   - Express Router 사용
   - RESTful 패턴: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
   - 필요 시 multer 파일 업로드 설정
   - 패턴 참고: `server/src/routes/campaign.js`

4. **서버 등록**: `server/src/app.js`에 route import + `app.use()` 추가

## 규칙
- 기존 라우트/컨트롤러를 절대 수정하지 않는다
- PostgreSQL parameterized query ($1, $2...) 사용
- 모든 테이블에 created_at, updated_at 포함
- 응답 형식: `{ success: true, data: ..., count: ... }`
