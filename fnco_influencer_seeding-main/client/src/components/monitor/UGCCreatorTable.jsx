import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.jsx';
import { Users, Award, TrendingUp } from 'lucide-react';

const platformColors = {
  Instagram: 'bg-pink-100 text-pink-700',
  TikTok: 'bg-slate-100 text-slate-700',
  YouTube: 'bg-red-100 text-red-700',
  Twitter: 'bg-blue-100 text-blue-700',
  Blog: 'bg-green-100 text-green-700',
};

const potentialConfig = {
  high: { text: '높음', className: 'bg-green-100 text-green-700' },
  medium: { text: '보통', className: 'bg-yellow-100 text-yellow-700' },
  low: { text: '낮음', className: 'bg-gray-100 text-gray-600' },
  converted: { text: '전환됨', className: 'bg-blue-100 text-blue-700' },
};

function formatEngagement(count) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getQualityColor(score) {
  if (score >= 7) return 'text-green-600';
  if (score >= 4) return 'text-yellow-600';
  return 'text-red-600';
}

export default function UGCCreatorTable({ creators, onConvert }) {
  if (!creators || creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Users className="size-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">크리에이터 데이터가 없습니다</p>
        <p className="text-xs mt-1">UGC 수확 후 크리에이터가 자동으로 집계됩니다</p>
      </div>
    );
  }

  // Sort by total_engagement descending
  const sorted = [...creators].sort((a, b) => b.total_engagement - a.total_engagement);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">핸들</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>플랫폼</TableHead>
            <TableHead className="text-center">UGC 수</TableHead>
            <TableHead className="text-center">평균 품질</TableHead>
            <TableHead className="text-center">총 참여</TableHead>
            <TableHead className="text-center">잠재력</TableHead>
            <TableHead className="text-center">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((creator) => {
            const potential = potentialConfig[creator.influencer_potential] || potentialConfig.low;
            const avgQuality = parseFloat(creator.avg_quality_score);
            const isConvertible = creator.influencer_potential === 'high' || creator.influencer_potential === 'medium';
            const isConverted = creator.influencer_potential === 'converted';

            return (
              <TableRow key={creator.creator_id}>
                <TableCell className="font-medium text-sm">
                  {creator.handle}
                </TableCell>
                <TableCell className="text-sm">{creator.name}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${platformColors[creator.platform] || 'bg-gray-100 text-gray-700'}`}>
                    {creator.platform}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-sm">{creator.ugc_count}</TableCell>
                <TableCell className="text-center">
                  <span className={`text-sm font-medium ${getQualityColor(avgQuality)}`}>
                    {avgQuality.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm flex items-center justify-center gap-1">
                    <TrendingUp className="size-3 text-muted-foreground" />
                    {formatEngagement(creator.total_engagement)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={`text-xs ${potential.className}`}>
                    {potential.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {isConvertible && !isConverted && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => onConvert(creator.creator_id)}
                    >
                      <Award className="size-3 mr-1" />
                      인플루언서 전환
                    </Button>
                  )}
                  {isConverted && (
                    <span className="text-xs text-blue-600 font-medium">전환 완료</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
