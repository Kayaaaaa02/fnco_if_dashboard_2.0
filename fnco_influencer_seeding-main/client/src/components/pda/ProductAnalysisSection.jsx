import { useProductAnalysis, useTopContent } from '@/hooks/useAIPlan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Sparkles, Package, TrendingUp, BarChart3, FileText, Loader2 } from 'lucide-react';

export default function ProductAnalysisSection({ planDocId }) {
  const { data: analysisData, isLoading: analysisLoading } = useProductAnalysis(planDocId);
  const { data: topContentData, isLoading: topLoading } = useTopContent(planDocId);

  if (!planDocId) return null;

  if (analysisLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mb-3" />
          <p className="text-sm">제품을 업로드하면 AI가 자동으로 분석합니다</p>
        </CardContent>
      </Card>
    );
  }

  const bestPlans = analysisData.bestPlans || [];
  const formatStrategy = analysisData.formatStrategy || [];
  const topItems = topContentData?.items || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI 제품 분석 결과
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 분석 요약 */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                분석 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysisData.summary}
              </p>
            </CardContent>
          </Card>

          {/* 베스트 기획안 TOP 10 */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                베스트 기획안 TOP 10
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bestPlans.map((plan, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5">
                      {idx + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{plan.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {plan.description}
                      </p>
                    </div>
                    <Badge className="shrink-0">{plan.score}%</Badge>
                  </div>
                ))}
                {bestPlans.length === 0 && (
                  <p className="text-xs text-muted-foreground">데이터 없음</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 콘텐츠 포맷 전략 */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                콘텐츠 포맷 전략
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formatStrategy.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.format}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.ratio}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${item.ratio}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
                {formatStrategy.length === 0 && (
                  <p className="text-xs text-muted-foreground">데이터 없음</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 트렌딩 TOP 3 */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                트렌딩 TOP 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {topItems.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {typeof item.viewCount === 'number'
                            ? item.viewCount.toLocaleString() + '회'
                            : item.viewCount}
                        </p>
                      </div>
                    </div>
                  ))}
                  {topItems.length === 0 && (
                    <p className="text-xs text-muted-foreground">데이터 없음</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
