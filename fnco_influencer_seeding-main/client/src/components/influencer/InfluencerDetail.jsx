import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignInfluencers } from '@/hooks/useInfluencers';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { ArrowLeft, Instagram, Youtube, Users, Heart, BarChart3 } from 'lucide-react';

const PLATFORM_ICON = {
  instagram: Instagram,
  youtube: Youtube,
};

function StatItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function OverviewTab({ influencer }) {
  const analysis = influencer.deep_analysis || {};
  const demographics = analysis.demographics || {};
  const audience = analysis.audience || {};

  return (
    <div className="space-y-6">
      {/* Demographics */}
      <div>
        <h3 className="text-sm font-semibold mb-3">인구통계</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatItem label="주요 연령대" value={demographics.age_range} />
          <StatItem label="성별 비율" value={demographics.gender_ratio} />
          <StatItem label="주요 지역" value={demographics.location} />
          <StatItem label="언어" value={demographics.language} />
        </div>
      </div>

      <Separator />

      {/* Content frequency */}
      <div>
        <h3 className="text-sm font-semibold mb-3">콘텐츠 빈도</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatItem label="주간 포스팅" value={analysis.posting_frequency || influencer.posting_frequency} />
          <StatItem label="평균 좋아요" value={analysis.avg_likes ? Number(analysis.avg_likes).toLocaleString() : null} />
          <StatItem label="평균 댓글" value={analysis.avg_comments ? Number(analysis.avg_comments).toLocaleString() : null} />
          <StatItem label="평균 조회수" value={analysis.avg_views ? Number(analysis.avg_views).toLocaleString() : null} />
        </div>
      </div>

      <Separator />

      {/* Audience info */}
      <div>
        <h3 className="text-sm font-semibold mb-3">오디언스 정보</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatItem label="팔로워 성장률" value={audience.growth_rate} />
          <StatItem label="참여율" value={audience.engagement_rate || influencer.engagement_rate} />
          <StatItem label="진성 팔로워 비율" value={audience.authentic_ratio} />
          <StatItem label="주요 관심사" value={audience.interests} />
        </div>
      </div>

      {/* Raw analysis fallback */}
      {!analysis.demographics && influencer.deep_analysis && (
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {typeof influencer.deep_analysis === 'string'
              ? influencer.deep_analysis
              : JSON.stringify(influencer.deep_analysis, null, 2)}
          </p>
        </div>
      )}
    </div>
  );
}

function ContentAnalysisTab({ influencer }) {
  const analysis = influencer.deep_analysis || {};
  const themes = analysis.content_themes || [];
  const style = analysis.style_analysis || {};

  return (
    <div className="space-y-6">
      {/* Content themes */}
      <div>
        <h3 className="text-sm font-semibold mb-3">콘텐츠 테마</h3>
        {themes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {themes.map((theme, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {typeof theme === 'string' ? theme : theme.name || theme.label}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">딥분석을 실행하면 콘텐츠 테마가 표시됩니다</p>
        )}
      </div>

      <Separator />

      {/* Style analysis */}
      <div>
        <h3 className="text-sm font-semibold mb-3">스타일 분석</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatItem label="촬영 스타일" value={style.filming_style} />
          <StatItem label="편집 스타일" value={style.editing_style} />
          <StatItem label="톤 & 매너" value={style.tone} />
          <StatItem label="주요 소구 포인트" value={style.appeal_point} />
        </div>
        {!style.filming_style && !themes.length && (
          <p className="text-sm text-muted-foreground mt-2">딥분석을 실행하면 스타일 분석 결과가 표시됩니다</p>
        )}
      </div>
    </div>
  );
}

function MatchingConceptsTab({ influencer }) {
  const matchedConcepts = influencer.matched_concepts || [];

  if (matchedConcepts.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p className="text-sm">매칭된 컨셉이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matchedConcepts.map((concept, idx) => {
        const pdaLabel = [
          concept.pain_point && `P${concept.pain_point}`,
          concept.desire && `D${concept.desire}`,
          concept.awareness_stage,
        ].filter(Boolean).join(' x ');

        return (
          <Card key={idx}>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pdaLabel && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {pdaLabel}
                    </Badge>
                  )}
                  <span className="text-sm font-semibold">
                    {concept.name || concept.concept_name || `컨셉 ${idx + 1}`}
                  </span>
                </div>
                {concept.match_score != null && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">점수</span>
                    <span className="text-sm font-bold tabular-nums">
                      {concept.match_score}
                    </span>
                  </div>
                )}
              </div>
              {concept.match_reason && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {concept.match_reason}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function InfluencerDetail() {
  const { id: campaignId, profileId } = useParams();
  const navigate = useNavigate();
  const { data: influencers, isLoading } = useCampaignInfluencers(campaignId);

  const items = Array.isArray(influencers) ? influencers : [];
  const influencer = items.find(
    (i) => String(i.profile_id || i.id) === String(profileId)
  );

  const PlatformIcon = PLATFORM_ICON[influencer?.platform] || Instagram;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">인플루언서를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => navigate(`/campaigns/${campaignId}/influencers`)}
      >
        <ArrowLeft className="size-4" />
        <span>인플루언서 목록</span>
      </Button>

      {/* Profile header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
          {influencer.profile_image ? (
            <img
              src={influencer.profile_image}
              alt={influencer.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold">
              {(influencer.name || '?').charAt(0)}
            </span>
          )}
        </div>
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{influencer.name || '이름 없음'}</h1>
            <Badge variant="secondary" className="text-xs gap-1">
              <PlatformIcon className="size-3" />
              {influencer.platform || 'SNS'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {influencer.followers && (
              <div className="flex items-center gap-1">
                <Users className="size-3.5" />
                <span>팔로워 {Number(influencer.followers).toLocaleString()}</span>
              </div>
            )}
            {influencer.engagement_rate && (
              <div className="flex items-center gap-1">
                <Heart className="size-3.5" />
                <span>참여율 {influencer.engagement_rate}</span>
              </div>
            )}
            {influencer.match_score != null && (
              <div className="flex items-center gap-1">
                <BarChart3 className="size-3.5" />
                <span>매칭 점수 {influencer.match_score}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="content">콘텐츠 분석</TabsTrigger>
          <TabsTrigger value="concepts">매칭 컨셉</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <OverviewTab influencer={influencer} />
        </TabsContent>
        <TabsContent value="content" className="pt-4">
          <ContentAnalysisTab influencer={influencer} />
        </TabsContent>
        <TabsContent value="concepts" className="pt-4">
          <MatchingConceptsTab influencer={influencer} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
