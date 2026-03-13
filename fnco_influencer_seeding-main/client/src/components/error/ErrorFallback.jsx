import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">오류가 발생했습니다</h2>
            <p className="text-sm text-muted-foreground">
              {error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
          </div>
          {import.meta.env.DEV && error?.stack && (
            <pre className="text-xs text-left bg-muted p-3 rounded-md overflow-auto max-h-40">
              {error.stack}
            </pre>
          )}
          <Button onClick={resetErrorBoundary} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
