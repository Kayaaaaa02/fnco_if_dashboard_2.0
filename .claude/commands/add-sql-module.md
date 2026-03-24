# SQL 쿼리 모듈 추가

PostgreSQL 쿼리 모듈을 프로젝트 패턴에 맞게 생성합니다.

## 입력
- $ARGUMENTS: 테이블/도메인명과 컬럼 정보 (예: "reward 테이블 - reward_id, campaign_id, influencer_id, amount, status")

## 수행 작업

`server/src/sql/{도메인}/` 디렉토리에 4개 파일 생성:

### 1. `selectQuery.js`
```js
export const select{Domain}s = (filters) => {
    // WHERE 절 동적 생성
    // params 배열 + parameterized query ($1, $2...)
    return { selectQuery: `SELECT ... FROM ...`, params };
};
export const select{Domain}ById = (id) => { ... };
```

### 2. `insertQuery.js`
```js
export const insert{Domain} = (data) => {
    // data 객체에서 params 추출
    // created_at, updated_at = NOW()
    // RETURNING *
    return { insertQuery: `INSERT INTO ...`, params };
};
```

### 3. `updateQuery.js`
```js
export const update{Domain} = (id, data) => {
    // 동적 SET 절 생성
    // updated_at = NOW() 자동 추가
    return { updateQuery: `UPDATE ... SET ...`, params };
};
```

### 4. `deleteQuery.js`
```js
export const softDelete{Domain} = (id) => {
    // is_deleted = true, deleted_at = NOW()
    return { deleteQuery: `UPDATE ... SET is_deleted = true`, params };
};
```

## 패턴 참고 파일
- `server/src/sql/campaign/insertQuery.js`
- `server/src/sql/seeding/selectQuery.js`
- `server/src/sql/ugc/updateQuery.js`

## 규칙
- 항상 Parameterized Query 사용 ($1, $2...) — SQL Injection 방지
- 물리 삭제 대신 Soft Delete (is_deleted 플래그)
- campaign_id 기반 연결 시 WHERE campaign_id = $N 포함
- JSON 컬럼은 `JSON.stringify()` 처리 후 저장
