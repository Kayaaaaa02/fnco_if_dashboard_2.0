import { Button } from '@/components/ui/button.jsx';
import { X } from 'lucide-react';
import { cn } from '@/components/ui/utils';

/**
 * 대량 작업 액션 바 — 항목 선택 시 하단에 슬라이드업
 *
 * @param {number} selectedCount - 선택된 항목 수
 * @param {function} onClearSelection - 선택 해제 콜백
 * @param {Array<{label: string, icon: ReactNode, onClick: function, variant?: string}>} actions
 * @param {string} [className]
 */
export default function BulkActionBar({ selectedCount, onClearSelection, actions = [], className }) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg',
        'animate-in slide-in-from-bottom duration-300',
        className
      )}
    >
      <div className="mx-auto flex items-center justify-between gap-4 px-6 py-3 max-w-screen-xl">
        {/* Left: count + clear */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">
            {selectedCount}개 선택됨
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs text-muted-foreground"
          >
            <X className="size-3.5" />
            <span>선택 해제</span>
          </Button>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="text-xs gap-1.5"
            >
              {action.icon}
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
