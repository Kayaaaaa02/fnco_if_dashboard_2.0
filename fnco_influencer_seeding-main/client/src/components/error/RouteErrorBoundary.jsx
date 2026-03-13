import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ErrorFallback.jsx';

export default function RouteErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset app state if needed
        window.location.reload();
      }}
      onError={(error, info) => {
        console.error('[RouteErrorBoundary]', error, info);
        try {
          import('@sentry/react').then(Sentry => {
            Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
          });
        } catch (e) {
          // Sentry not available
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
