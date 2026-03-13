import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { ArrowRight, Check, X } from 'lucide-react';

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const priorityLabels = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export default function CreativeRotation({ actions = [], onApply, onDismiss }) {
  if (!actions || actions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <p className="text-sm">교체 추천이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action) => {
        const rec = action.recommendation || {};
        const replace = rec.replace || {};
        const withRec = rec.with || {};
        const priority = rec.priority || 'medium';
        const isResolved = action.status !== 'pending';

        return (
          <div
            key={action.action_id}
            className={`rounded-lg border p-4 space-y-3 ${isResolved ? 'opacity-50' : ''}`}
          >
            {/* Priority badge */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={priorityColors[priority]}>
                우선순위: {priorityLabels[priority]}
              </Badge>
              {isResolved && (
                <Badge variant="secondary" className="text-xs">
                  {action.status === 'applied' ? '적용됨' : '무시됨'}
                </Badge>
              )}
            </div>

            {/* Replace target → Suggestion */}
            <div className="flex items-start gap-3">
              {/* 교체 대상 */}
              <div className="flex-1 rounded-md bg-red-50 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">교체 대상</p>
                <p className="text-sm font-semibold">{replace.creative_name}</p>
                <p className="text-xs text-muted-foreground">{replace.reason}</p>
                {replace.current_ctr != null && (
                  <p className="text-sm font-bold text-red-600">CTR {replace.current_ctr}%</p>
                )}
              </div>

              {/* Arrow */}
              <div className="flex items-center pt-6">
                <ArrowRight className="size-5 text-muted-foreground" />
              </div>

              {/* 교체 제안 */}
              <div className="flex-1 rounded-md bg-green-50 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">교체 제안</p>
                <p className="text-sm font-semibold">{withRec.hook_text}</p>
                <p className="text-xs text-muted-foreground">유형: {withRec.hook_type}</p>
                {withRec.predicted_ctr != null && (
                  <p className="text-sm font-bold text-green-600">예상 CTR {withRec.predicted_ctr}%</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isResolved && (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onApply?.(action.action_id)}
                >
                  <Check className="size-3.5 mr-1" />
                  적용
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
      })}
    </div>
  );
}
