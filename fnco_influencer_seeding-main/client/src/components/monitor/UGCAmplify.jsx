import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Zap, Star, Heart } from 'lucide-react';

const amplifyLabels = {
  none: '미적용',
  ad_creative: '광고 소재',
  detail_page: '상세페이지',
  repost: '리포스트',
};

const amplifyBadgeColors = {
  none: 'bg-gray-100 text-gray-600',
  ad_creative: 'bg-violet-100 text-violet-700',
  detail_page: 'bg-indigo-100 text-indigo-700',
  repost: 'bg-purple-100 text-purple-700',
};

function formatEngagement(count) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function UGCAmplify({ content, onUpdateAmplify }) {
  // 증폭 대상: permission_status === 'granted'
  const grantedContent = useMemo(() => {
    if (!content) return [];
    return content.filter((item) => item.permission_status === 'granted');
  }, [content]);

  const amplifyCounts = useMemo(() => {
    const counts = { none: 0, ad_creative: 0, detail_page: 0, repost: 0 };
    grantedContent.forEach((item) => {
      const status = item.amplify_status || 'none';
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  }, [grantedContent]);

  if (!content || content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Zap className="size-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">증폭 대상 콘텐츠가 없습니다</p>
        <p className="text-xs mt-1">먼저 UGC를 수확하고 권한을 허가해주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-lg flex-wrap">
        <div className="text-sm">
          <span className="text-muted-foreground">허가 콘텐츠</span>
          <span className="ml-2 font-semibold text-violet-700">{grantedContent.length}건</span>
        </div>
        {Object.entries(amplifyCounts).map(([key, count]) => (
          <div key={key} className="text-sm">
            <span className="text-muted-foreground">{amplifyLabels[key]}</span>
            <span className="ml-1 font-semibold">{count}</span>
          </div>
        ))}
      </div>

      {/* Granted content with amplify selector */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {grantedContent.map((item) => {
          const qualityScore = parseFloat(item.quality_score);
          const currentAmplify = item.amplify_status || 'none';

          return (
            <Card key={item.ugc_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                {/* Top row: platform + amplify badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.source_platform}</span>
                  <Badge className={`text-xs ${amplifyBadgeColors[currentAmplify]}`}>
                    {amplifyLabels[currentAmplify]}
                  </Badge>
                </div>

                {/* Content text */}
                <p className="text-sm line-clamp-2 text-foreground">
                  {item.content_text}
                </p>

                {/* Creator + Stats */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">
                    {item.creator_handle}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs flex items-center gap-0.5 text-muted-foreground">
                      <Star className="size-3" />
                      {qualityScore.toFixed(1)}
                    </span>
                    <span className="text-xs flex items-center gap-0.5 text-muted-foreground">
                      <Heart className="size-3" />
                      {formatEngagement(item.engagement_count)}
                    </span>
                  </div>
                </div>

                {/* Amplify selector */}
                <Select
                  value={currentAmplify}
                  onValueChange={(value) =>
                    onUpdateAmplify({ ugcId: item.ugc_id, amplify_status: value })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="증폭 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">미적용</SelectItem>
                    <SelectItem value="ad_creative">광고 소재</SelectItem>
                    <SelectItem value="detail_page">상세페이지</SelectItem>
                    <SelectItem value="repost">리포스트</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {grantedContent.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">권한이 허가된 콘텐츠가 없습니다</p>
          <p className="text-xs mt-1">큐레이션 탭에서 권한을 요청해주세요</p>
        </div>
      )}
    </div>
  );
}
