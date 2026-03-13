import { useTopContent } from '@/hooks/useAIPlan';
import { CONTENT_TYPE_TO_HOOKS } from '@/lib/aiPlanConstants';
import { Card, CardContent, CardHeader } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Brain, Sparkles, Hash } from 'lucide-react';

export default function AIRecommendedPlans({ planDocId }) {
  const { data: topContent, isLoading } = useTopContent(planDocId);

  const recommendations = topContent?.recommendations || [];

  // 추천 데이터가 없을 때 기본 콘텐츠 타입에서 제안 카드 생성
  const fallbackItems = Object.entries(CONTENT_TYPE_TO_HOOKS)
    .slice(0, 5)
    .map(([key, value]) => ({
      contentType: key,
      title: `${value.label} 콘텐츠`,
      description: `${value.label} 형식의 콘텐츠를 기획해보세요`,
      matchScore: null,
      hooks: value.hooks,
    }));

  if (!planDocId) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Brain className="h-5 w-5 text-purple-500" />
            AI 추천 기획안
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayItems = recommendations.length > 0 ? recommendations : fallbackItems;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-base font-semibold">
          <Brain className="h-5 w-5 text-purple-500" />
          AI 추천 기획안
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayItems.map((item, idx) => {
              const typeInfo = CONTENT_TYPE_TO_HOOKS[item.contentType];
              const typeLabel = typeInfo?.label || item.contentType;
              // API 훅과 상수 훅 병합
              const allHooks = [
                ...(typeInfo?.hooks || []),
                ...(item.hooks || []),
              ];
              // 중복 제거
              const uniqueHooks = [...new Set(allHooks)];

              return (
                <Card key={idx} className="border-dashed">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {typeLabel}
                      </Badge>
                      {item.matchScore != null && (
                        <Badge className="text-xs">
                          {item.matchScore}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        추천 훅
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {uniqueHooks.map((hook, hIdx) => (
                          <Badge
                            key={hIdx}
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {hook}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {recommendations.length === 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            <Sparkles className="inline h-3 w-3 mr-1" />
            AI 분석이 완료되면 맞춤 기획안이 표시됩니다. 위 항목은 기본 제안입니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
