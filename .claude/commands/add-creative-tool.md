# 크리에이티브 제작 도구 추가

Phase 4 (Creative Production)에 새 크리에이티브 제작 도구를 추가합니다.

## 입력
- $ARGUMENTS: 도구 설명 (예: "AI 썸네일 생성기", "캡션 자동 번역기" 등)

## 수행 작업

1. **컴포넌트** 생성: `client/src/components/creative/{ToolName}.jsx`
   - shadcn/ui Card, Tabs, Dialog 기반 UI
   - AI 기능 시 서버 API 연동
   - 미리보기/편집/저장 플로우

2. **Hook** (필요 시): `client/src/hooks/useCreatives.js` 확장 또는 새 Hook 생성

3. **Backend** (AI 연동 시):
   - Controller: `server/src/controllers/creativeController.js` 확장
   - Route: `server/src/routes/creative.js` 확장
   - AI API 호출 (Gemini, Imagen 등)

## 기존 크리에이티브 도구 참고
- `ScenarioEditor.jsx` — 시나리오 편집기
- `HookBank.jsx` + `HookCard.jsx` — 훅 뱅크 (오프닝 훅 관리)
- `ImageGenerator.jsx` — AI 이미지 생성
- `TimelineImageGenerator.jsx` — 4-Step 타임라인 이미지 (HOOK/MIDDLE/HIGHLIGHT/CTA)
- `CopyEditor.jsx` — 카피 편집기
- `AIImageEditor.jsx` — AI 이미지 에디터
- `ProductionGuide.jsx` — 제작 가이드
- `CreativeEditor.jsx` — 크리에이티브 통합 편집
- `FinalReviewEditor.jsx` — 최종 리뷰 편집

## 규칙
- 기존 크리에이티브 컴포넌트를 수정하지 않는다
- AI 이미지 생성 시 `server/src/controllers/aiImageController.js` 패턴 참고
- 파일 업로드 시 multer 설정 + `server/uploads/` 디렉토리 사용
