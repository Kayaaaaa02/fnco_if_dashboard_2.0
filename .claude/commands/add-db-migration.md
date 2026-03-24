# DB 마이그레이션/스키마 추가

PostgreSQL 데이터베이스 스키마를 추가하거나 변경합니다.

## 입력
- $ARGUMENTS: 테이블/컬럼 설명 (예: "reward 테이블 생성", "campaign에 budget 컬럼 추가" 등)

## 기존 구조

### 초기화 스크립트
- `server/scripts/init-db.js` — `server/sql/schema/` 하위 .sql 파일을 순서대로 실행
- 실행: `node server/scripts/init-db.js`

### 자동 ALTER 패턴
많은 Controller에서 부팅 시 자동으로 컬럼 추가:
```js
(async () => {
  await pool.query(`ALTER TABLE mst_campaign ADD COLUMN IF NOT EXISTS new_col VARCHAR(100)`);
})();
```

### DB 연결
- `server/src/config/database.js` — PostgreSQL 풀 (pg)

## 수행 작업

### 새 테이블 생성
1. `server/sql/schema/` 하위에 `.sql` 파일 추가
2. `CREATE TABLE IF NOT EXISTS` 사용
3. Primary Key, Foreign Key, Index 정의
4. created_at, updated_at 기본 컬럼 포함

### 기존 테이블 변경
1. `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 사용
2. Controller 상단에 자동 마이그레이션 코드 추가 (기존 패턴)

## 규칙
- `IF NOT EXISTS` / `IF NOT EXISTS` 사용하여 멱등성 보장
- 물리 삭제 대신 is_deleted 소프트 삭제
- JSONB 타입 적극 활용 (유연한 스키마)
- FK 참조 시 campaign_id 기반 연결
