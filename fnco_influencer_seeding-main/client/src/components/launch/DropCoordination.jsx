import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDrops, useGenerateDrops, useSendReminders } from '@/hooks/useDropCoordination.js';
import DropTimeline from '@/components/launch/DropTimeline.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Crosshair, Sparkles, Loader2, Bell, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const PHASE_LABEL = {
  tease: '티징',
  reveal: '공개',
  validate: '검증',
  amplify: '확산',
};

const PHASE_VARIANT = {
  tease: 'secondary',
  reveal: 'default',
  validate: 'outline',
  amplify: 'destructive',
};

const TYPE_LABEL = {
  influencer: '인플루언서',
  brand: '브랜드',
  ugc: 'UGC',
  ad: '광고',
};

const PLATFORM_ICON = {
  instagram: '📸',
  tiktok: '🎵',
  youtube: '▶️',
  blog: '📝',
};

const STATUS_LABEL = {
  draft: '초안',
  scheduled: '예약',
  published: '발행',
  completed: '완료',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2 p-3 rounded-lg border">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function DropCoordination() {
  const { id: campaignId } = useParams();
  const { data, isLoading } = useDrops(campaignId);
  const generateDrops = useGenerateDrops();
  const sendReminders = useSendReminders();
  const [open, setOpen] = useState(true);

  const drops = data?.data || [];

  // Stats
  const stats = useMemo(() => {
    const phaseCounts = { tease: 0, reveal: 0, validate: 0, amplify: 0 };
    const typeCounts = { influencer: 0, brand: 0, ugc: 0, ad: 0 };

    for (const drop of drops) {
      if (phaseCounts[drop.arc_phase] !== undefined) phaseCounts[drop.arc_phase]++;
      if (typeCounts[drop.drop_type] !== undefined) typeCounts[drop.drop_type]++;
    }

    return { phaseCounts, typeCounts };
  }, [drops]);

  // Group drops by date for table
  const groupedByDate = useMemo(() => {
    const groups = {};
    for (const drop of drops) {
      const dateKey = drop.scheduled_at
        ? new Date(drop.scheduled_at).toLocaleDateString('ko-KR')
        : '미정';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(drop);
    }
    return groups;
  }, [drops]);

  const handleGenerate = () => {
    generateDrops.mutate(campaignId);
  };

  const handleSendReminders = () => {
    sendReminders.mutate(campaignId);
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="size-5 text-primary" />
            <CardTitle className="text-lg">동시 드랍 코디네이션</CardTitle>
            {drops.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {drops.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleSendReminders();
              }}
              disabled={sendReminders.isPending || drops.length === 0}
            >
              {sendReminders.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Bell className="size-4" />
              )}
              <span>리마인더 발송</span>
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerate();
              }}
              disabled={generateDrops.isPending}
            >
              {generateDrops.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              <span>동시 드랍 생성</span>
            </Button>
            {open ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : drops.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Crosshair className="size-10 mb-3 opacity-30" />
              <p className="text-sm text-center">
                동시 드랍 스케줄을 생성하여 인플루언서와 브랜드 콘텐츠를 동기화하세요
              </p>
            </div>
          ) : (
            <>
              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-medium">
                  총 <span className="text-primary font-bold">{drops.length}</span>개 드랍
                </div>
                <div className="h-4 w-px bg-border" />
                {Object.entries(stats.phaseCounts).map(([phase, count]) => (
                  <Badge key={phase} variant={PHASE_VARIANT[phase]} className="text-xs">
                    {PHASE_LABEL[phase]} {count}
                  </Badge>
                ))}
                <div className="h-4 w-px bg-border" />
                {Object.entries(stats.typeCounts).map(([type, count]) => (
                  count > 0 && (
                    <Badge key={type} variant="outline" className="text-xs">
                      {TYPE_LABEL[type]} {count}
                    </Badge>
                  )
                ))}
              </div>

              {/* Visual Timeline */}
              <DropTimeline drops={drops} />

              {/* Summary table grouped by date */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>시간</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>플랫폼</TableHead>
                      <TableHead>내용</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedByDate).map(([dateKey, dateDrops]) => (
                      dateDrops.map((drop, idx) => (
                        <TableRow key={drop.drop_id}>
                          {idx === 0 ? (
                            <TableCell
                              rowSpan={dateDrops.length}
                              className="align-top font-medium bg-muted/30 border-r"
                            >
                              <div className="flex items-center gap-1.5">
                                <Calendar className="size-3 text-muted-foreground" />
                                <span className="text-xs">{dateKey}</span>
                              </div>
                            </TableCell>
                          ) : null}
                          <TableCell className="text-xs">
                            {formatTime(drop.scheduled_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {TYPE_LABEL[drop.drop_type] || drop.drop_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {PLATFORM_ICON[drop.platform] || '📦'} {drop.platform}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {drop.notes || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {STATUS_LABEL[drop.status] || drop.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
