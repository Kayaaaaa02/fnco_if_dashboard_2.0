import AppRouter from './AppRouter.jsx';
import RouteErrorBoundary from './components/error/RouteErrorBoundary.jsx';

/**
 * V2 마이그레이션 완료 — 모든 라우팅은 AppRouter가 처리.
 * V1 경로(/AI-PLAN/*, /access-management 등)는 AppRouter 내에서 V2 대응 경로로 리다이렉트.
 * V1 컴포넌트 파일은 삭제하지 않음 (참조용 보존).
 */
export default function App() {
    return (
        <RouteErrorBoundary>
            <AppRouter />
        </RouteErrorBoundary>
    );
}
