import { useParams } from 'react-router-dom';
import { useAuditLog } from '@/hooks/useAudit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { History, Loader2 } from 'lucide-react';

const ACTION_COLORS = {
  create: 'bg-green-600',
  update: 'bg-blue-600',
  delete: 'bg-red-600',
  approve: 'bg-violet-600',
  generate: 'bg-amber-600',
  send: 'bg-teal-600',
  execute: 'bg-indigo-600',
};

const ACTION_LABELS = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  approve: '승인',
  generate: 'AI 생성',
  send: '발송',
  execute: '실행',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditLog() {
  const { id: campaignId } = useParams();
  const { data: logs, isLoading } = useAuditLog(campaignId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const items = logs || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">감사 로그</CardTitle>
          <Badge variant="secondary" className="text-xs">{items.length}건</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">기록이 없습니다</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {items.map((log) => (
                <div key={log.log_id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-2 ${ACTION_COLORS[log.action] || 'bg-gray-500'}`} />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${ACTION_COLORS[log.action] || 'bg-gray-600'} text-white text-xs px-1.5 py-0`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                      <span className="text-muted-foreground">{log.entity_type}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.user_name || log.user_id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
