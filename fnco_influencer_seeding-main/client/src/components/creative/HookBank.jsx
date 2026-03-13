import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useHookBank, useGenerateHooks, useDeleteHook } from '@/hooks/useHookBank';
import HookCard from '@/components/creative/HookCard.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Lightbulb, Loader2, Inbox } from 'lucide-react';

const PHASE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'tease', label: '티징' },
  { value: 'reveal', label: '공개' },
  { value: 'validate', label: '검증' },
  { value: 'amplify', label: '확산' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'headline', label: '헤드라인' },
  { value: 'opening_line', label: '오프닝' },
  { value: 'cta', label: 'CTA' },
  { value: 'hashtag', label: '해시태그' },
];

const PHASE_CONFIG = {
  tease: { label: '티징', color: 'bg-amber-500' },
  reveal: { label: '공개', color: 'bg-blue-500' },
  validate: { label: '검증', color: 'bg-emerald-500' },
  amplify: { label: '확산', color: 'bg-purple-500' },
};

export default function HookBank() {
  const { id: campaignId } = useParams();
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filters = {};
  if (phaseFilter !== 'all') filters.phase = phaseFilter;
  if (typeFilter !== 'all') filters.type = typeFilter;

  const { data, isLoading } = useHookBank(campaignId, filters);
  const generateHooks = useGenerateHooks();
  const deleteHook = useDeleteHook();

  const hooks = data?.data || [];
  const hasFilters = phaseFilter !== 'all' || typeFilter !== 'all';

  // Group hooks by phase for column view
  const hooksByPhase = {};
  for (const phase of ['tease', 'reveal', 'validate', 'amplify']) {
    hooksByPhase[phase] = hooks.filter((h) => h.arc_phase === phase);
  }

  // Stats
  const totalCount = hooks.length;
  const phaseCountMap = {};
  for (const h of hooks) {
    phaseCountMap[h.arc_phase] = (phaseCountMap[h.arc_phase] || 0) + 1;
  }

  const handleGenerate = () => {
    generateHooks.mutate(campaignId);
  };

  const handleDelete = (hookId) => {
    deleteHook.mutate({ campaignId, hookId });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-5 text-amber-500" />
          <h2 className="text-xl font-bold">훅 뱅크</h2>
        </div>
        <Button onClick={handleGenerate} disabled={generateHooks.isPending}>
          {generateHooks.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Lightbulb className="size-4" />
          )}
          <span>AI 훅 생성</span>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="아크 단계" />
          </SelectTrigger>
          <SelectContent>
            {PHASE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="훅 유형" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats summary */}
      {totalCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            총 {totalCount}개
          </Badge>
          {Object.entries(PHASE_CONFIG).map(([phase, cfg]) => {
            const count = phaseCountMap[phase] || 0;
            if (count === 0) return null;
            return (
              <Badge key={phase} variant="outline" className="text-xs gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${cfg.color}`} />
                {cfg.label} {count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Content: 4-column grid or filtered list */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="size-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">훅 뱅크가 비어있습니다</p>
          <p className="text-sm mt-1">
            훅 뱅크를 생성하여 A/B 테스트용 카피를 준비하세요
          </p>
        </div>
      ) : hasFilters ? (
        /* Filtered flat list */
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {hooks.map((hook) => (
            <HookCard key={hook.hook_id} hook={hook} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        /* 4-column phase grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(PHASE_CONFIG).map(([phase, cfg]) => (
            <div key={phase} className="space-y-2">
              {/* Column header */}
              <div className="flex items-center gap-2 pb-1 border-b">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${cfg.color}`} />
                <span className="text-sm font-semibold">{cfg.label}</span>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {hooksByPhase[phase].length}
                </Badge>
              </div>

              {/* Hook cards */}
              <div className="space-y-2">
                {hooksByPhase[phase].map((hook) => (
                  <HookCard key={hook.hook_id} hook={hook} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
