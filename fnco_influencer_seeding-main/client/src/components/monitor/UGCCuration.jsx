import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Send, Star, Heart, Eye } from 'lucide-react';

const permissionLabels = {
  pending: { text: '대기', className: 'bg-gray-100 text-gray-700' },
  requested: { text: '요청됨', className: 'bg-blue-100 text-blue-700' },
  granted: { text: '허가됨', className: 'bg-green-100 text-green-700' },
  denied: { text: '거부됨', className: 'bg-red-100 text-red-700' },
};

function formatEngagement(count) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getDMTemplate(handle) {
  return `안녕하세요 ${handle}님! 저희 브랜드 제품을 사용해주셔서 감사합니다.\n고객님의 소중한 콘텐츠를 저희 공식 채널에서 소개하고 싶습니다.\n콘텐츠 사용 허가를 부탁드려도 될까요?`;
}

export default function UGCCuration({ content, onUpdatePermission }) {
  const [expandedDM, setExpandedDM] = useState(null);

  // 큐레이션 대상: quality_score >= 5.0
  const curatedContent = useMemo(() => {
    if (!content) return [];
    return content.filter((item) => parseFloat(item.quality_score) >= 5.0);
  }, [content]);

  const grantedCount = curatedContent.filter((i) => i.permission_status === 'granted').length;
  const pendingCount = curatedContent.filter((i) => i.permission_status === 'pending').length;

  if (!content || content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Eye className="size-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">큐레이션 대상 콘텐츠가 없습니다</p>
        <p className="text-xs mt-1">먼저 UGC를 수확해주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm">
          <span className="text-muted-foreground">큐레이션 대상</span>
          <span className="ml-2 font-semibold text-blue-700">{curatedContent.length}건</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">허가됨</span>
          <span className="ml-2 font-semibold text-green-700">{grantedCount}건</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">대기 중</span>
          <span className="ml-2 font-semibold text-gray-700">{pendingCount}건</span>
        </div>
      </div>

      {/* Curated content cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {curatedContent.map((item) => {
          const perm = permissionLabels[item.permission_status] || permissionLabels.pending;
          const qualityScore = parseFloat(item.quality_score);

          return (
            <Card key={item.ugc_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                {/* Top row: platform + permission badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.source_platform}</span>
                  <Badge className={`text-xs ${perm.className}`}>
                    {perm.text}
                  </Badge>
                </div>

                {/* Content text */}
                <p className="text-sm line-clamp-2 text-foreground">
                  {item.content_text}
                </p>

                {/* Creator + Quality */}
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

                {/* Action: request permission for pending items */}
                {item.permission_status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => {
                      onUpdatePermission({ ugcId: item.ugc_id, permission_status: 'requested' });
                      setExpandedDM(item.ugc_id);
                    }}
                  >
                    <Send className="size-3 mr-1" />
                    권한 요청
                  </Button>
                )}

                {/* DM Template for requested items */}
                {(item.permission_status === 'requested' || expandedDM === item.ugc_id) && (
                  <div className="p-3 bg-blue-50 rounded-md text-xs text-blue-800 whitespace-pre-line">
                    {getDMTemplate(item.creator_handle)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {curatedContent.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">품질 점수 5.0 이상 콘텐츠가 없습니다</p>
        </div>
      )}
    </div>
  );
}
