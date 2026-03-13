import { useState, useMemo } from 'react';
import { computeDiff, getPathLabel, summarizeDiff, groupChangesByRoot } from '@/lib/jsonDiff.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Plus, Minus, RefreshCw, ChevronDown, ChevronRight, GitCompare, Columns, Rows } from 'lucide-react';

/**
 * Format a value for display in the diff viewer
 */
function formatValue(value) {
  if (value === undefined || value === null) return <span className="text-muted-foreground italic">없음</span>;
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value, null, 2);
      if (str.length > 200) return str.slice(0, 200) + '...';
      return str;
    } catch {
      return String(value);
    }
  }
  const str = String(value);
  if (str.length > 300) return str.slice(0, 300) + '...';
  return str;
}

/**
 * Icon for the change type
 */
function ChangeIcon({ type }) {
  switch (type) {
    case 'added':
      return <Plus className="size-3.5 text-green-600 shrink-0" />;
    case 'removed':
      return <Minus className="size-3.5 text-red-600 shrink-0" />;
    case 'changed':
      return <RefreshCw className="size-3.5 text-amber-600 shrink-0" />;
    default:
      return null;
  }
}

/**
 * Background color class for change type
 */
function changeBgClass(type) {
  switch (type) {
    case 'added': return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    case 'removed': return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
    case 'changed': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    default: return '';
  }
}

/**
 * Badge variant for change type
 */
function changeBadgeClass(type) {
  switch (type) {
    case 'added': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-transparent';
    case 'removed': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-transparent';
    case 'changed': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-transparent';
    default: return '';
  }
}

const TYPE_LABELS = {
  added: '추가',
  removed: '삭제',
  changed: '수정',
};

/**
 * Single change row in inline mode
 */
function InlineChangeRow({ change }) {
  return (
    <div className={`rounded-md border p-3 ${changeBgClass(change.type)}`}>
      <div className="flex items-start gap-2">
        <ChangeIcon type={change.type} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium">{getPathLabel(change.path)}</span>
            <Badge className={`text-[10px] px-1.5 py-0 ${changeBadgeClass(change.type)}`}>
              {TYPE_LABELS[change.type]}
            </Badge>
          </div>
          <div className="text-xs space-y-0.5">
            {change.type === 'changed' && (
              <>
                <div className="flex items-start gap-1.5">
                  <span className="text-red-600 dark:text-red-400 shrink-0 font-medium">-</span>
                  <span className="text-red-700 dark:text-red-300 break-all whitespace-pre-wrap">{formatValue(change.oldValue)}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-green-600 dark:text-green-400 shrink-0 font-medium">+</span>
                  <span className="text-green-700 dark:text-green-300 break-all whitespace-pre-wrap">{formatValue(change.newValue)}</span>
                </div>
              </>
            )}
            {change.type === 'added' && (
              <div className="text-green-700 dark:text-green-300 break-all whitespace-pre-wrap">
                {formatValue(change.newValue)}
              </div>
            )}
            {change.type === 'removed' && (
              <div className="text-red-700 dark:text-red-300 break-all whitespace-pre-wrap line-through">
                {formatValue(change.oldValue)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single change row in side-by-side mode
 */
function SideBySideChangeRow({ change, oldLabel, newLabel }) {
  return (
    <div className={`rounded-md border ${changeBgClass(change.type)}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-inherit">
        <ChangeIcon type={change.type} />
        <span className="text-xs font-medium">{getPathLabel(change.path)}</span>
        <Badge className={`text-[10px] px-1.5 py-0 ${changeBadgeClass(change.type)}`}>
          {TYPE_LABELS[change.type]}
        </Badge>
      </div>
      <div className="grid grid-cols-2 divide-x divide-inherit">
        <div className="p-2.5">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">{oldLabel}</p>
          <div className="text-xs break-all whitespace-pre-wrap">
            {change.type === 'removed' || change.type === 'changed'
              ? <span className="text-red-700 dark:text-red-300">{formatValue(change.oldValue)}</span>
              : <span className="text-muted-foreground italic">-</span>
            }
          </div>
        </div>
        <div className="p-2.5">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">{newLabel}</p>
          <div className="text-xs break-all whitespace-pre-wrap">
            {change.type === 'added' || change.type === 'changed'
              ? <span className="text-green-700 dark:text-green-300">{formatValue(change.newValue)}</span>
              : <span className="text-muted-foreground italic">-</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Collapsible group of changes sharing the same root key
 */
function ChangeGroup({ rootKey, changes, viewMode, oldLabel, newLabel }) {
  const [isOpen, setIsOpen] = useState(true);
  const summary = summarizeDiff(changes);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        {isOpen
          ? <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        }
        <span className="text-sm font-medium flex-1">{getPathLabel(rootKey)}</span>
        <div className="flex items-center gap-1.5">
          {summary.added > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-transparent">
              +{summary.added}
            </Badge>
          )}
          {summary.changed > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-transparent">
              ~{summary.changed}
            </Badge>
          )}
          {summary.removed > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-transparent">
              -{summary.removed}
            </Badge>
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          {changes.map((change, idx) => (
            viewMode === 'inline'
              ? <InlineChangeRow key={idx} change={change} />
              : <SideBySideChangeRow key={idx} change={change} oldLabel={oldLabel} newLabel={newLabel} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * DiffViewer — Reusable component for comparing two JSON objects
 *
 * @param {object} props
 * @param {object} props.oldData - Previous version data
 * @param {object} props.newData - Current version data
 * @param {string} [props.oldLabel='이전 버전'] - Label for old version
 * @param {string} [props.newLabel='현재 버전'] - Label for new version
 * @param {string} [props.className] - Additional CSS class
 */
export default function DiffViewer({
  oldData,
  newData,
  oldLabel = '이전 버전',
  newLabel = '현재 버전',
  className = '',
}) {
  const [viewMode, setViewMode] = useState('inline');

  const changes = useMemo(() => computeDiff(oldData, newData), [oldData, newData]);
  const summary = useMemo(() => summarizeDiff(changes), [changes]);
  const grouped = useMemo(() => groupChangesByRoot(changes), [changes]);

  if (changes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <GitCompare className="size-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">변경사항이 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitCompare className="size-4" />
            버전 비교
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Summary badges */}
            <div className="flex items-center gap-1.5 text-xs">
              {summary.added > 0 && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-transparent text-xs">
                  {summary.added}개 추가
                </Badge>
              )}
              {summary.changed > 0 && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-transparent text-xs">
                  {summary.changed}개 수정
                </Badge>
              )}
              {summary.removed > 0 && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-transparent text-xs">
                  {summary.removed}개 삭제
                </Badge>
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'inline' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 rounded-none"
                onClick={() => setViewMode('inline')}
              >
                <Rows className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === 'side-by-side' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 rounded-none"
                onClick={() => setViewMode('side-by-side')}
              >
                <Columns className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Version labels */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-400 inline-block" />
            {oldLabel}
          </span>
          <span>&rarr;</span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-green-400 inline-block" />
            {newLabel}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-2">
            {[...grouped.entries()].map(([rootKey, groupChanges]) => (
              <ChangeGroup
                key={rootKey}
                rootKey={rootKey}
                changes={groupChanges}
                viewMode={viewMode}
                oldLabel={oldLabel}
                newLabel={newLabel}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
