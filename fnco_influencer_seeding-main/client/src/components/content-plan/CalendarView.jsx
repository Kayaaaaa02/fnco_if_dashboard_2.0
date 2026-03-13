import { useMemo } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const PLATFORM_COLORS = {
  instagram: 'bg-pink-500 text-white',
  Instagram: 'bg-pink-500 text-white',
  tiktok: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
  TikTok: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
  youtube: 'bg-red-600 text-white',
  YouTube: 'bg-red-600 text-white',
  blog: 'bg-green-600 text-white',
  Blog: 'bg-green-600 text-white',
};

function getPlatformClass(platform) {
  return PLATFORM_COLORS[platform] || 'bg-muted text-muted-foreground';
}

export default function CalendarView({ items = [], currentDate, onDateChange, onItemClick }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build calendar grid
  const { weeks, daysInMonth, firstDayOfWeek } = useMemo(() => {
    const dim = new Date(year, month + 1, 0).getDate();
    const fdow = new Date(year, month, 1).getDay();
    const totalCells = Math.ceil((dim + fdow) / 7) * 7;
    const wks = [];
    let week = [];

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - fdow + 1;
      if (dayNum >= 1 && dayNum <= dim) {
        week.push(dayNum);
      } else {
        week.push(null);
      }
      if (week.length === 7) {
        wks.push(week);
        week = [];
      }
    }

    return { weeks: wks, daysInMonth: dim, firstDayOfWeek: fdow };
  }, [year, month]);

  // Group items by day
  const itemsByDay = useMemo(() => {
    const map = {};
    for (const item of items) {
      const date = new Date(item.scheduled_date || item.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(item);
      }
    }
    return map;
  }, [items, year, month]);

  const handlePrevMonth = () => {
    onDateChange?.(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onDateChange?.(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day) =>
    day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="space-y-3">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">
          {year}년 {month + 1}월
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAY_LABELS.map((label, idx) => (
          <div
            key={label}
            className={`text-center text-xs font-medium py-2 ${
              idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-muted-foreground'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border overflow-hidden bg-border">
        {weeks.flat().map((day, idx) => {
          const dayItems = day ? itemsByDay[day] || [] : [];
          const dayOfWeek = idx % 7;

          return (
            <div
              key={idx}
              className={`min-h-20 p-1 bg-card ${
                day ? 'cursor-default' : 'bg-muted/30'
              }`}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-xs font-medium leading-none ${
                        isToday(day)
                          ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
                          : dayOfWeek === 0
                          ? 'text-red-500'
                          : dayOfWeek === 6
                          ? 'text-blue-500'
                          : 'text-foreground'
                      }`}
                    >
                      {day}
                    </span>
                    {dayItems.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-4 px-1 py-0">
                        {dayItems.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map((item, itemIdx) => (
                      <button
                        key={item.id || itemIdx}
                        className={`w-full rounded px-1 py-0.5 text-left truncate text-xs ${getPlatformClass(item.platform)}`}
                        onClick={() => onItemClick?.(item)}
                      >
                        {item.concept_name || item.title || item.platform}
                      </button>
                    ))}
                    {dayItems.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{dayItems.length - 3}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Platform Legend */}
      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs text-muted-foreground">플랫폼:</span>
        {Object.entries(PLATFORM_COLORS)
          .filter(([key]) => key[0] === key[0].toUpperCase())
          .map(([platform, cls]) => (
            <div key={platform} className="flex items-center gap-1">
              <div className={`h-2.5 w-2.5 rounded-sm ${cls.split(' ')[0]}`} />
              <span className="text-xs text-muted-foreground">{platform}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
