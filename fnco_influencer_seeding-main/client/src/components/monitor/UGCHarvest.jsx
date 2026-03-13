import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Image, Video, FileText, Star, Heart, Sparkles } from 'lucide-react';

const platformColors = {
  Instagram: 'bg-pink-100 text-pink-700',
  TikTok: 'bg-slate-100 text-slate-700',
  YouTube: 'bg-red-100 text-red-700',
  Twitter: 'bg-blue-100 text-blue-700',
  Blog: 'bg-green-100 text-green-700',
};

const contentTypeIcons = {
  image: Image,
  video: Video,
  reel: Video,
  story: Sparkles,
  review: FileText,
};

function formatEngagement(count) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getQualityColor(score) {
  if (score >= 7) return 'bg-green-100 text-green-700';
  if (score >= 4) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export default function UGCHarvest({ content, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!content || content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Sparkles className="size-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">수확된 UGC가 없습니다</p>
        <p className="text-xs mt-1">UGC 수확 버튼을 눌러 콘텐츠를 수집하세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {content.map((item) => {
        const ContentIcon = contentTypeIcons[item.content_type] || FileText;
        const qualityScore = parseFloat(item.quality_score);
        const sentimentScore = parseFloat(item.sentiment_score);

        return (
          <Card key={item.ugc_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              {/* Platform + Content Type badges */}
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${platformColors[item.source_platform] || 'bg-gray-100 text-gray-700'}`}>
                  {item.source_platform}
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <ContentIcon className="size-3" />
                  {item.content_type}
                </Badge>
              </div>

              {/* Content text */}
              <p className="text-sm line-clamp-2 text-foreground">
                {item.content_text}
              </p>

              {/* Creator handle */}
              <p className="text-xs text-muted-foreground font-medium">
                {item.creator_handle}
              </p>

              {/* Bottom row: quality, engagement, sentiment */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getQualityColor(qualityScore)}`}>
                    <Star className="size-3 mr-0.5" />
                    {qualityScore.toFixed(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="size-3" />
                    {formatEngagement(item.engagement_count)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-1.5 rounded-full bg-emerald-200"
                    style={{ width: '40px' }}
                  >
                    <div
                      className="h-1.5 rounded-full bg-emerald-500"
                      style={{ width: `${sentimentScore * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {(sentimentScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
