import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge.jsx';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover.jsx';
import { Calendar, Users, Building2, Video, Megaphone } from 'lucide-react';

const PHASE_CONFIG = {
  tease: { label: '티징', color: 'bg-violet-100 border-violet-300', headerBg: 'bg-violet-50', textColor: 'text-violet-700', range: 'D-21 ~ D-14' },
  reveal: { label: '공개', color: 'bg-blue-100 border-blue-300', headerBg: 'bg-blue-50', textColor: 'text-blue-700', range: 'D-7 ~ D-3' },
  validate: { label: '검증', color: 'bg-green-100 border-green-300', headerBg: 'bg-green-50', textColor: 'text-green-700', range: 'D-Day ~ D+3' },
  amplify: { label: '확산', color: 'bg-amber-100 border-amber-300', headerBg: 'bg-amber-50', textColor: 'text-amber-700', range: 'D+7 ~ D+30' },
};

const TYPE_CONFIG = {
  influencer: { label: '인플루언서', dotColor: 'bg-blue-500', icon: Users },
  brand: { label: '브랜드', dotColor: 'bg-purple-500', icon: Building2 },
  ugc: { label: 'UGC', dotColor: 'bg-green-500', icon: Video },
  ad: { label: '광고', dotColor: 'bg-orange-500', icon: Megaphone },
};

const PLATFORM_ICON = {
  instagram: '📸',
  tiktok: '🎵',
  youtube: '▶️',
  blog: '📝',
};

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function DropPill({ drop }) {
  const typeConfig = TYPE_CONFIG[drop.drop_type] || TYPE_CONFIG.influencer;
  const platformIcon = PLATFORM_ICON[drop.platform] || '📦';
  const truncatedNotes = drop.notes && drop.notes.length > 12 ? drop.notes.slice(0, 12) + '...' : drop.notes;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all text-xs cursor-pointer max-w-full">
          <span className={`size-2 rounded-full shrink-0 ${typeConfig.dotColor}`} />
          <span>{platformIcon}</span>
          <span className="truncate text-muted-foreground">{truncatedNotes || drop.drop_type}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${typeConfig.dotColor}`} />
          <span className="font-semibold text-sm">{typeConfig.label}</span>
          <Badge variant="outline" className="text-xs ml-auto">
            {drop.status}
          </Badge>
        </div>
        <div className="text-xs space-y-1 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>{platformIcon}</span>
            <span>{drop.platform}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3" />
            <span>{formatDateTime(drop.scheduled_at)}</span>
          </div>
          {drop.notes && (
            <p className="pt-1 text-foreground">{drop.notes}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function DropTimeline({ drops }) {
  const groupedByPhase = useMemo(() => {
    const grouped = { tease: [], reveal: [], validate: [], amplify: [] };
    for (const drop of drops) {
      const phase = drop.arc_phase;
      if (grouped[phase]) {
        grouped[phase].push(drop);
      }
    }
    return grouped;
  }, [drops]);

  if (!drops || drops.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Timeline zones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {Object.entries(PHASE_CONFIG).map(([key, config]) => {
          const phaseDrops = groupedByPhase[key] || [];

          return (
            <div
              key={key}
              className={`rounded-lg border ${config.color} p-3 space-y-2 min-h-[120px]`}
            >
              {/* Phase header */}
              <div className={`flex items-center justify-between rounded px-2 py-1 ${config.headerBg}`}>
                <span className={`text-xs font-bold ${config.textColor}`}>{config.label}</span>
                <span className="text-[10px] text-muted-foreground">{config.range}</span>
              </div>

              {/* Drop count */}
              <div className="text-[10px] text-muted-foreground px-1">
                {phaseDrops.length}개 드랍
              </div>

              {/* Drop pills */}
              <div className="flex flex-wrap gap-1.5">
                {phaseDrops.map((drop) => (
                  <DropPill key={drop.drop_id} drop={drop} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1 pt-1">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2.5 rounded-full ${config.dotColor}`} />
              <Icon className="size-3" />
              <span>{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
