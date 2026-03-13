import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Check, X, MessageSquare } from 'lucide-react';

function getSentimentColor(score) {
  if (score < 0.3) return { bg: 'bg-red-100', text: 'text-red-700', label: '낮음' };
  if (score <= 0.6) return { bg: 'bg-amber-100', text: 'text-amber-700', label: '보통' };
  return { bg: 'bg-green-100', text: 'text-green-700', label: '높음' };
}

export default function MessagePivot({ action, onApply, onDismiss }) {
  if (!action) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <p className="text-sm">메시지 피봇 추천이 없습니다</p>
      </div>
    );
  }

  const rec = action.recommendation || {};
  const sentimentScore = rec.sentiment_score ?? 0;
  const sentiment = getSentimentColor(sentimentScore);
  const isResolved = action.status !== 'pending';

  return (
    <div className={`space-y-4 ${isResolved ? 'opacity-50' : ''}`}>
      {isResolved && (
        <Badge variant="secondary" className="text-xs">
          {action.status === 'applied' ? '적용됨' : '무시됨'}
        </Badge>
      )}

      {/* Sentiment score display */}
      <div className="flex items-center gap-4">
        <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-xl ${sentiment.bg}`}>
          <span className={`text-3xl font-bold ${sentiment.text}`}>
            {sentimentScore.toFixed(2)}
          </span>
          <span className={`text-xs font-medium ${sentiment.text}`}>감성 점수</span>
        </div>

        <div className="flex-1">
          {/* Score bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 (부정적)</span>
              <span>1 (긍정적)</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  sentimentScore < 0.3
                    ? 'bg-red-500'
                    : sentimentScore <= 0.6
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${sentimentScore * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current vs Suggested tone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">현재 톤</p>
          <p className="text-sm font-semibold">{rec.current_tone}</p>
        </div>
        <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-2">
          <p className="text-xs font-medium text-primary">제안 톤</p>
          <p className="text-sm font-semibold">{rec.suggested_tone}</p>
        </div>
      </div>

      {/* Trigger reason info box */}
      {rec.trigger_reason && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <MessageSquare className="size-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-700 mb-0.5">분석 근거</p>
            <p className="text-sm text-blue-800">{rec.trigger_reason}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isResolved && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onApply?.(action.action_id)}
          >
            <Check className="size-3.5 mr-1" />
            톤 변경 적용
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDismiss?.(action.action_id)}
          >
            <X className="size-3.5 mr-1" />
            무시
          </Button>
        </div>
      )}
    </div>
  );
}
