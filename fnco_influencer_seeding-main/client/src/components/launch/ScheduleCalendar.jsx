import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.jsx';
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const PLATFORM_STYLES = {
  instagram: { bg: 'bg-gradient-to-r from-pink-500 to-purple-500', text: 'text-white', label: 'Instagram' },
  tiktok: { bg: 'bg-gray-900', text: 'text-white', label: 'TikTok' },
  youtube: { bg: 'bg-red-600', text: 'text-white', label: 'YouTube' },
  default: { bg: 'bg-primary/80', text: 'text-white', label: '기타' },
};

const STATUS_ICONS = {
  draft: Clock,
  scheduled: Clock,
  approved: CheckCircle2,
  published: Send,
  failed: XCircle,
};

function getPlatformStyle(platform) {
  const key = (platform || '').toLowerCase();
  return PLATFORM_STYLES[key] || PLATFORM_STYLES.default;
}

function getStatusIcon(status) {
  const Icon = STATUS_ICONS[status] || Clock;
  return Icon;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function ScheduleCalendar({ items = [] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedItem, setSelectedItem] = useState(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map = {};
    for (const item of items) {
      if (!item.scheduled_at) continue;
      const d = new Date(item.scheduled_at);
      const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    }
    return map;
  }, [items]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Build calendar grid
  const cells = [];
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, key: `empty-${i}` });
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${month}-${d}`;
    cells.push({ day: d, key: dateKey, items: itemsByDate[dateKey] || [] });
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">발행 스케줄</CardTitle>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-xs">{items.length}건</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {year}년 {monthNames[month]}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAYS_OF_WEEK.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1.5 ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((cell) => {
              if (cell.day === null) {
                return <div key={cell.key} className="min-h-[80px] bg-muted/10 rounded" />;
              }

              const isToday =
                cell.day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              const dayIndex = new Date(year, month, cell.day).getDay();

              return (
                <div
                  key={cell.key}
                  className={`min-h-[80px] rounded border p-1 transition-colors ${
                    isToday ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-accent/30'
                  }`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-xs font-medium leading-none ${
                        isToday
                          ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center'
                          : dayIndex === 0
                            ? 'text-red-400'
                            : dayIndex === 6
                              ? 'text-blue-400'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {cell.day}
                    </span>
                  </div>

                  {/* Schedule items */}
                  <div className="space-y-0.5">
                    {cell.items.slice(0, 3).map((item) => {
                      const style = getPlatformStyle(item.platform);
                      const StatusIcon = getStatusIcon(item.status);
                      const time = item.scheduled_at
                        ? new Date(item.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <button
                              className={`w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate ${style.bg} ${style.text} hover:opacity-90 transition-opacity`}
                              onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                            >
                              <div className="flex items-center gap-0.5">
                                <StatusIcon className="size-2.5 shrink-0" />
                                <span className="truncate">
                                  {time} {item.influencer_name || '자체 채널'}
                                </span>
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-56">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold">{item.influencer_name || '자체 채널'}</p>
                              <p className="text-xs text-muted-foreground">{style.label} / {time}</p>
                              <p className="text-xs">
                                상태: <span className="font-medium">{item.status}</span>
                              </p>
                              {item.concept_name && (
                                <p className="text-xs text-muted-foreground">{item.concept_name}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {cell.items.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-1">
                        +{cell.items.length - 3}건 더
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Detail popup for selected item */}
        {selectedItem && (
          <div className="mt-4 rounded-lg border bg-accent/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {selectedItem.influencer_name || '자체 채널'}
              </h4>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedItem(null)}>
                닫기
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">플랫폼: </span>
                <span className="font-medium">{getPlatformStyle(selectedItem.platform).label}</span>
              </div>
              <div>
                <span className="text-muted-foreground">상태: </span>
                <Badge variant="outline" className="text-xs">{selectedItem.status}</Badge>
              </div>
              {selectedItem.scheduled_at && (
                <div>
                  <span className="text-muted-foreground">예정: </span>
                  <span className="font-medium">
                    {new Date(selectedItem.scheduled_at).toLocaleString('ko-KR')}
                  </span>
                </div>
              )}
              {selectedItem.concept_name && (
                <div>
                  <span className="text-muted-foreground">컨셉: </span>
                  <span className="font-medium">{selectedItem.concept_name}</span>
                </div>
              )}
            </div>
            {selectedItem.published_url && (
              <a
                href={selectedItem.published_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <ExternalLink className="size-3" />
                게시물 보기
              </a>
            )}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarDays className="size-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">스케줄이 아직 없습니다</p>
            <p className="text-xs mt-1">위에서 스케줄 생성 버튼을 클릭해주세요</p>
          </div>
        )}

        {/* Platform legend */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">플랫폼:</span>
            {Object.entries(PLATFORM_STYLES)
              .filter(([k]) => k !== 'default')
              .map(([key, style]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${style.bg}`} />
                  <span className="text-xs text-muted-foreground">{style.label}</span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
