# E2E 테스트 추가

Playwright 기반 E2E 테스트를 프로젝트 패턴에 맞게 생성합니다.

## 입력
- $ARGUMENTS: 테스트 대상 (예: "크리에이티브 제작 플로우", "인플루언서 검색 필터" 등)

## 수행 작업

`e2e/{test-name}.spec.js` 파일 생성:

```js
import { test, expect } from '@playwright/test';

test.describe('{테스트 그룹명}', () => {
  test('should {테스트 설명}', async ({ page }) => {
    await page.goto('/{경로}');
    // Assertions
  });
});
```

## 테스트 작성 가이드

1. **페이지 네비게이션**: `page.goto('/{route}')`
2. **요소 선택**: role 기반 우선 (`getByRole`, `getByText`, `getByTestId`)
3. **한국어 텍스트**: heading은 한국어로 매칭 (예: `{ name: '캠페인 빌더' }`)
4. **API 모킹**: `e2e/helpers/` 하위 모킹 헬퍼 활용
5. **대기**: `waitForSelector`, `waitForResponse` 사용

## 기존 테스트 참고
- `e2e/auth.spec.js` — 인증 플로우
- `e2e/campaign-lifecycle.spec.js` — 캠페인 라이프사이클
- `e2e/pda-framework.spec.js` — PDA 프레임워크

## 주요 페이지 경로
- `/campaigns` — 캠페인 목록
- `/campaigns/new` — 캠페인 생성
- `/campaigns/:id` — 캠페인 허브
- `/content-engine` — 콘텐츠 엔진
- `/creator-hub` — 크리에이터 허브
- `/influencer-pool` — 인플루언서 풀
- `/settings` — 설정

## 실행 방법
```bash
npx playwright test e2e/{test-name}.spec.js
```

## 규칙
- `playwright.config.js` 설정을 수정하지 않는다
- 테스트 간 독립성 유지 (상태 공유 금지)
- 하드코딩된 대기(sleep) 대신 명시적 대기 사용
