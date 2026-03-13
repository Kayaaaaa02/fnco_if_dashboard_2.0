import { useParams } from 'react-router-dom';
import { useEarlySignals, useDetectSignals } from '@/hooks/useEarlySignal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  Radar,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

function AlertLevelBadge({ level }) {
  const variants = {
    good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    normal: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  const labels = { good: '우수', normal: '보통', warning: '주의' };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[level] || variants.normal}`}>
      {labels[level] || level}
    </span>
  );
}

function ChangeIndicator({ value }) {
  if (value == null) return <span className="text-muted-foreground">-</span>;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function HookRankingTab({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">순위</TableHead>
          <TableHead>훅/콘텐츠</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="text-right">변화율</TableHead>
          <TableHead className="text-center">상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.entity_id}>
            <TableCell>
              <span className={`font-semibold ${item.rank <= 5 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {item.rank}
              </span>
            </TableCell>
            <TableCell className="max-w-[200px] truncate font-medium">
              {item.entity_name}
            </TableCell>
            <TableCell className="text-right tabular-nums">{item.value}%</TableCell>
            <TableCell className="text-right">
              <ChangeIndicator value={item.change_pct} />
            </TableCell>
            <TableCell className="text-center">
              <AlertLevelBadge level={item.alert_level} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function channelIcon(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('instagram')) return '📸';
  if (lower.includes('tiktok')) return '🎵';
  if (lower.includes('youtube')) return '▶️';
  if (lower.includes('blog')) return '📝';
  return '📊';
}

function ChannelRankingTab({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">순위</TableHead>
          <TableHead>채널</TableHead>
          <TableHead className="text-right">ROAS</TableHead>
          <TableHead className="text-right">변화율</TableHead>
          <TableHead className="text-center">상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.entity_id}>
            <TableCell>
              <span className={`font-semibold ${item.rank <= 2 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {item.rank}
              </span>
            </TableCell>
            <TableCell className="font-medium">
              <span className="mr-1.5">{channelIcon(item.entity_name)}</span>
              {item.entity_name}
            </TableCell>
            <TableCell className="text-right tabular-nums">{item.value}x</TableCell>
            <TableCell className="text-right">
              <ChangeIndicator value={item.change_pct} />
            </TableCell>
            <TableCell className="text-center">
              <AlertLevelBadge level={item.alert_level} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AnomalyTab({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const isHigh = item.severity === 'high';
        const isMedium = item.severity === 'medium';
        const Icon = isHigh ? AlertTriangle : AlertCircle;
        const colorClass = isHigh
          ? 'text-red-500 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40'
          : isMedium
            ? 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40'
            : 'text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40';
        const iconColor = isHigh ? 'text-red-500' : isMedium ? 'text-amber-500' : 'text-blue-500';
        const severityLabel = isHigh ? '높음' : isMedium ? '중간' : '낮음';

        return (
          <div key={idx} className={`flex items-start gap-3 rounded-lg border p-3 ${colorClass}`}>
            <Icon className={`size-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{item.metric}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {severityLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.message}</p>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                <span>예상: <strong className="text-foreground">{item.expected}</strong></span>
                <span>실제: <strong className="text-foreground">{item.actual}</strong></span>
                <span>
                  편차:{' '}
                  <strong className={item.deviation < 0 ? 'text-red-500' : 'text-emerald-600'}>
                    {item.deviation > 0 ? '+' : ''}{item.deviation}%
                  </strong>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16 ml-auto" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function EarlySignal() {
  const { id: campaignId } = useParams();
  const { data: signalData, isLoading } = useEarlySignals(campaignId);
  const detectMutation = useDetectSignals();

  const signals = signalData?.data || [];
  const hookSignal = signals.find((s) => s.signal_type === 'hook_ranking');
  const channelSignal = signals.find((s) => s.signal_type === 'channel_ranking');
  const anomalySignal = signals.find((s) => s.signal_type === 'anomaly');

  const hookData = hookSignal?.rank_data || [];
  const channelData = channelSignal?.rank_data || [];
  const anomalyData = anomalySignal?.anomalies || [];

  const hasData = signals.length > 0;

  const handleDetect = () => {
    detectMutation.mutate(campaignId);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">초기 신호 감지</CardTitle>
          </div>
          <Button
            onClick={handleDetect}
            disabled={detectMutation.isPending}
            variant="outline"
            size="sm"
          >
            {detectMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            <span>초기 신호 감지</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Radar className="size-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">초기 신호를 감지하여 어떤 훅과 채널이 효과적인지 확인하세요</p>
          </div>
        ) : (
          <Tabs defaultValue="hooks" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="hooks">훅 랭킹</TabsTrigger>
              <TabsTrigger value="channels">채널 랭킹</TabsTrigger>
              <TabsTrigger value="anomalies">
                이상 감지
                {anomalyData.length > 0 && (
                  <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                    {anomalyData.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="hooks">
              <HookRankingTab data={hookData} />
            </TabsContent>
            <TabsContent value="channels">
              <ChannelRankingTab data={channelData} />
            </TabsContent>
            <TabsContent value="anomalies">
              <AnomalyTab data={anomalyData} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
