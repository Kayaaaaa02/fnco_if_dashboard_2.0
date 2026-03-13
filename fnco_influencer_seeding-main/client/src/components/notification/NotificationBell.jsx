import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';

const TYPE_ICONS = {
  phase_change: '\uD83D\uDD04',
  ai_complete: '\u2728',
  approval: '\uD83D\uDCCB',
  outreach: '\uD83D\uDCE7',
  system: '\u2699\uFE0F',
};

function formatTimeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '\uBC29\uAE08';
  if (minutes < 60) return `${minutes}\uBD84 \uC804`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}\uC2DC\uAC04 \uC804`;
  const days = Math.floor(hours / 24);
  return `${days}\uC77C \uC804`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  const handleMarkRead = (id) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate('system');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full px-1 text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">{'\uC54C\uB9BC'}</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleMarkAllRead}>
              <CheckCheck className="size-3" />
              {'\uBAA8\uB450 \uC77D\uC74C'}
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="size-8 mb-2 opacity-30" />
              <p className="text-xs">{'\uC0C8 \uC54C\uB9BC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4'}</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div
                  key={n.notification_id}
                  className={`flex gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                    !n.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => !n.is_read && handleMarkRead(n.notification_id)}
                >
                  <span className="text-lg mt-0.5">{TYPE_ICONS[n.type] || '\uD83D\uDCCC'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-medium' : ''}`}>{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{formatTimeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
