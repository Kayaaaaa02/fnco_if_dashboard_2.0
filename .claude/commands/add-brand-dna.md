# Brand DNA 관리 기능 추가

브랜드 DNA (아이덴티티) 관리 모듈을 확장합니다.

## 입력
- $ARGUMENTS: 확장 요구사항 (예: "브랜드 DNA 비교 뷰", "AI 기반 브랜드 톤 분석" 등)

## 기존 Brand DNA 구조

### Server
- `server/src/controllers/brandDnaController.js` — CRUD (brand_name, mission, tone_of_voice, visual_style, key_messages)
- `server/src/routes/brandDna.js` — REST 라우트
- `server/src/sql/brandDna/` — initTable, selectQuery, insertQuery, updateQuery, deleteQuery
- 부팅 시 자동 테이블 생성

### Client
- `client/src/hooks/useBrandDna.js` — TanStack Query 기반 Hook

### 데이터 모델
```
mst_brand_dna:
- brand_dna_id (PK)
- brand_name, mission, tone_of_voice, visual_style
- key_messages (JSONB)
- created_at, updated_at
```

## 수행 작업
1. 기존 Brand DNA CRUD 패턴 기반으로 기능 확장
2. 필요한 UI 컴포넌트 추가
3. PDA / Strategy Phase와 연동 고려

## 규칙
- 기존 brandDnaController.js 패턴 유지
- Brand DNA는 캠페인 생성 시 참조되므로 삭제 시 의존성 확인
