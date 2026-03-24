# UI 컴포넌트 추가

shadcn/ui + Tailwind CSS 기반으로 새 컴포넌트를 프로젝트 패턴에 맞게 생성합니다.

## 입력
- $ARGUMENTS: 컴포넌트 설명 (예: "인플루언서 비교 테이블", "KPI 대시보드 카드" 등)

## 수행 작업

1. 적절한 디렉토리에 `.jsx` 파일 생성:
   - 기존 도메인에 속하면: `client/src/components/{도메인}/{ComponentName}.jsx`
   - 새 도메인이면: 새 디렉토리 생성

2. **컴포넌트 구조**:
   - 함수형 컴포넌트 (export default 또는 named export)
   - shadcn/ui 컴포넌트 import: `@/components/ui/{component}`
   - lucide-react 아이콘 사용
   - Tailwind CSS 클래스 사용
   - 필요 시 커스텀 Hook import

3. **UI 패턴 (기존 프로젝트 컨벤션)**:
   - Card 레이아웃: `<Card>`, `<CardHeader>`, `<CardContent>` (shadcn/ui)
   - 테이블: `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableCell>`
   - 탭: `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`
   - Badge 상태 표시: `<Badge variant="...">`
   - 로딩: Skeleton 컴포넌트 사용

## 규칙
- 기존 컴포넌트 파일을 수정하지 않는다
- PDA 관련 컴포넌트는 수정 금지 (CLAUDE.md 참조)
- 다국어 필요 시 `useTranslation` hook 사용
- 반응형 디자인 적용 (mobile-first)
