import { useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Loader2, CheckCircle2, Clock, Instagram, Youtube, Video } from 'lucide-react';

const PLATFORM_ICONS = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Video,
};

function getPlatformIcon(platform) {
  const key = (platform || '').toLowerCase();
  return PLATFORM_ICONS[key] || Video;
}

export default function ApprovalFlow({ open, onOpenChange, items = [], onConfirm, isLoading }) {
  // Only show items that are pending approval (scheduled/draft status)
  const pendingItems = useMemo(
    () => items.filter((i) => i.status === 'scheduled' || i.status === 'draft'),
    [items],
  );

  const platformCounts = useMemo(() => {
    const map = {};
    for (const item of pendingItems) {
      const p = item.platform || '기타';
      map[p] = (map[p] || 0) + 1;
    }
    return map;
  }, [pendingItems]);

  const platformList = Object.entries(platformCounts)
    .map(([name, count]) => `${name} ${count}개`)
    .join(', ');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            콘텐츠 승인
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-1">
            <span className="block">
              <span className="font-semibold text-foreground">{pendingItems.length}개</span> 콘텐츠가{' '}
              <span className="font-semibold text-foreground">{Object.keys(platformCounts).length}개</span> 플랫폼에 예약됩니다
            </span>
            {platformList && (
              <span className="block text-xs">({platformList})</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Scrollable item list */}
        <ScrollArea className="max-h-[300px] -mx-1 px-1">
          <div className="space-y-2">
            {pendingItems.map((item) => {
              const PlatformIcon = getPlatformIcon(item.platform);
              const time = item.scheduled_at
                ? new Date(item.scheduled_at).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-';

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border p-3 bg-card"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <PlatformIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.influencer_name || '자체 채널'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.concept_name || item.title || '콘텐츠'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {(item.platform || '기타').toLowerCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                      <Clock className="size-3" />
                      {time}
                    </p>
                  </div>
                </div>
              );
            })}

            {pendingItems.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                승인 대기 중인 콘텐츠가 없습니다
              </div>
            )}
          </div>
        </ScrollArea>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading || pendingItems.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                승인 중...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                전체 승인 ({pendingItems.length}건)
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
