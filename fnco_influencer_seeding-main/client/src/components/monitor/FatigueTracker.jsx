import { useParams } from 'react-router-dom';
import { useFatigueReport } from '@/hooks/useMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Loader2, Activity, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

function getFatigueStatus(score) {
  if (score < 20) return { label: '양호', color: 'text-green-600', bgColor: 'bg-green-500', badgeClass: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
  if (score <= 50) return { label: '주의', color: 'text-amber-600', bgColor: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle };
  return { label: '위험', color: 'text-red-600', bgColor: 'bg-red-500', badgeClass: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
}

export default function FatigueTracker() {
  const { id: campaignId } = useParams();
  const { data: fatigueData, isLoading } = useFatigueReport(campaignId);

  const items = Array.isArray(fatigueData?.items) ? fatigueData.items : [];

  // Sort by fatigue_score DESC
  const sorted = [...items].sort((a, b) => (b.fatigue_score ?? 0) - (a.fatigue_score ?? 0));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <Activity className="size-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">피로도 데이터가 없습니다</p>
          <p className="text-xs mt-1">목 데이터를 먼저 생성해주세요</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Creative Fatigue 리포트</CardTitle>
          <Badge variant="secondary" className="text-xs">{sorted.length}개 컨셉</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((item) => {
            const score = item.fatigue_score ?? 0;
            const status = getFatigueStatus(score);
            const StatusIcon = status.icon;

            return (
              <div
                key={item.id || item.concept_name}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {/* Status icon */}
                <div className="shrink-0">
                  <StatusIcon className={`size-4 ${status.color}`} />
                </div>

                {/* Concept info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {item.concept_name || '무제 컨셉'}
                    </span>
                    <Badge variant="outline" className={`text-xs shrink-0 ${status.badgeClass}`}>
                      {status.label}
                    </Badge>
                    {score > 50 && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        교체 필요
                      </Badge>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${status.bgColor}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold tabular-nums min-w-[32px] text-right ${status.color}`}>
                      {score}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">피로도 기준:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">&lt; 20 양호</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">20-50 주의</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">&gt; 50 위험</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
