# 역할/권한 관리 추가

RBAC (Role-Based Access Control) 기능을 확장합니다.

## 입력
- $ARGUMENTS: 권한 요구사항 (예: "새 역할 추가", "페이지별 접근 제한" 등)

## 기존 구조
- `client/src/hooks/useRoles.js`
  - `useRoles()` — 역할 목록 조회
  - `useRolePermissions(roleId)` — 역할별 권한 조회
  - `useRoleUsers(roleId)` — 역할별 사용자 조회
  - `useCreateRole()`, `useUpdateRole()`, `useDeleteRole()` — 역할 CRUD
  - `useAssignPermission()` — 권한 할당
  - `useAssignUserRole()` — 사용자-역할 할당
  - API: `/api/roles/*`

## 수행 작업
1. 필요한 역할/권한 정의
2. useRoles Hook 활용하여 UI 구현
3. AuthGuard와 연동하여 접근 제어
4. 필요 시 서버 미들웨어 추가

## 규칙
- 기존 useRoles Hook 패턴 활용
- 권한 체크는 클라이언트 + 서버 양쪽에서 수행
- 기본 역할 (admin, editor, viewer) 삭제 금지
