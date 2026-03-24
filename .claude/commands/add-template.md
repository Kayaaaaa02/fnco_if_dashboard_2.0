# 캠페인 템플릿 추가

재사용 가능한 캠페인 템플릿을 추가합니다.

## 입력
- $ARGUMENTS: 템플릿 설명 (예: "뷰티 인플루언서 시딩 템플릿", "신제품 런칭 캠페인 템플릿" 등)

## 기존 구조

### Server
- `server/src/controllers/templateController.js` — CRUD (mst_campaign_template)
- `server/src/routes/templateRoutes.js`
- 데이터: JSONB `config`, category, description

### Client
- `client/src/components/campaign/TemplateGallery.jsx` — 카테고리 필터, "Create From Template" 다이얼로그
- `client/src/hooks/useTemplates.js` — TanStack Query Hook

### 템플릿 스키마
```json
{
  "template_id": "...",
  "template_name": "...",
  "category": "beauty|fashion|food|...",
  "description": "...",
  "config": { /* 캠페인 설정 JSON */ },
  "created_at": "..."
}
```

## 수행 작업
1. 템플릿 config JSON 정의
2. 필요 시 TemplateGallery에 카테고리 추가
3. 서버에 시드 데이터 등록

## 규칙
- 기존 templateController 패턴 유지
- 템플릿에서 캠페인 생성 시 campaign_name, scheduled_start 오버라이드
