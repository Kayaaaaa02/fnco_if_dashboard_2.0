# React Hook 추가

TanStack Query v5 패턴으로 새 커스텀 Hook을 생성합니다.

## 입력
- $ARGUMENTS: 도메인명 (예: "reward", "schedule" 등)

## 수행 작업

`client/src/hooks/use{PascalCase도메인}.js` 파일 생성:

1. **Import 구조**:
   ```js
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { api } from '@/services/api.js';
   ```

2. **Query Hooks** (목록, 단건, 관련데이터):
   - `use{Domain}s(filters)` — 목록 조회 (queryKey: ['{domain}s', filters])
   - `use{Domain}(id)` — 단건 조회 (enabled: !!id)

3. **Mutation Hooks** (생성, 수정, 삭제):
   - `useCreate{Domain}()` — POST, onSuccess에서 queryKey invalidate
   - `useUpdate{Domain}()` — PUT, 목록 + 단건 queryKey 모두 invalidate
   - `useDelete{Domain}()` — DELETE

4. **패턴 참고**: `client/src/hooks/useCampaign.js`

## 규칙
- `@/services/api.js`의 api 객체 사용 (api.get, api.post, api.put, api.delete, api.upload)
- FormData 지원 시 `api.upload()` 분기 처리
- queryKey는 일관된 네이밍 (['{domain}s'], ['{domain}', id])
- enabled 옵션으로 불필요한 요청 방지
