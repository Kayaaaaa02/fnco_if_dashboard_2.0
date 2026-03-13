import { useState } from 'react';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Clipboard, Check, Trash2 } from 'lucide-react';

const TYPE_STYLES = {
  headline: { label: '헤드라인', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  opening_line: { label: '오프닝', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  cta: { label: 'CTA', color: 'bg-green-100 text-green-700 border-green-200' },
  hashtag: { label: '해시태그', color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

const STATUS_STYLES = {
  draft: { label: '초안', color: 'bg-gray-100 text-gray-600' },
  active: { label: '활성', color: 'bg-blue-100 text-blue-700' },
  approved: { label: '승인됨', color: 'bg-green-100 text-green-700' },
  archived: { label: '보관됨', color: 'bg-amber-100 text-amber-700' },
};

export default function HookCard({ hook, onUpdate, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const typeStyle = TYPE_STYLES[hook.hook_type] || TYPE_STYLES.headline;
  const statusStyle = STATUS_STYLES[hook.status] || STATUS_STYLES.draft;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.hook_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  const handleDelete = () => {
    if (onDelete) onDelete(hook.hook_id);
  };

  return (
    <div
      className="group relative rounded-lg border bg-card p-3 transition-all hover:shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hook text */}
      <p className="text-sm leading-relaxed mb-2.5 pr-6">{hook.hook_text}</p>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Type badge */}
        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeStyle.color}`}>
          {typeStyle.label}
        </span>

        {/* Variant group badge */}
        {hook.variant_group && (
          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            {hook.variant_group}
          </span>
        )}

        {/* Channel badge */}
        {hook.channel && (
          <span className="inline-flex items-center rounded-md border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700">
            {hook.channel}
          </span>
        )}

        {/* Status indicator */}
        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${statusStyle.color}`}>
          {statusStyle.label}
        </span>

        {/* Performance score */}
        {hook.performance_score > 0 && (
          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            {Number(hook.performance_score).toFixed(1)}
          </span>
        )}
      </div>

      {/* Action buttons (top-right) */}
      <div className={`absolute top-2 right-2 flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
          title="클립보드에 복사"
        >
          {copied ? (
            <Check className="size-3 text-green-600" />
          ) : (
            <Clipboard className="size-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          title="삭제"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  );
}
