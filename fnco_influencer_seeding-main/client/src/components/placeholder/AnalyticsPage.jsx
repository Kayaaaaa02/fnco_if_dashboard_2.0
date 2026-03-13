import { useMemo } from 'react';
import { BarChart3, Globe2, Users, TrendingUp } from 'lucide-react';
import { useInfluencerPool } from '@/hooks/useInfluencerPool.js';
import { useContentLibrary } from '@/hooks/useContentLibrary.js';
import { creatorStages, formatCompactNumber, tokens, getPlatformMeta } from '@/styles/designTokens.js';

const FALLBACK_INFLUENCERS = [
  { id: 1, stage: 'discovered', avgViews: 5100, country: 'JP' },
  { id: 2, stage: 'seeded', avgViews: 6400, country: 'KR' },
  { id: 3, stage: 'posted', avgViews: 16400, country: 'KR' },
  { id: 4, stage: 'performing', avgViews: 38200, country: 'US' },
  { id: 5, stage: 'performing', avgViews: 27800, country: 'KR' },
  { id: 6, stage: 'partnered', avgViews: 47600, country: 'CN' },
];

const FALLBACK_PERFORMANCE = [
  { id: 'p1', platform: 'instagram', view_count: 101665, like_count: 114, comment_count: 10, seeding_cntry: 'KR' },
  { id: 'p2', platform: 'instagram', view_count: 90341, like_count: 515, comment_count: 52, seeding_cntry: 'US' },
  { id: 'p3', platform: 'youtube', view_count: 565109, like_count: 4300, comment_count: 244, seeding_cntry: 'KR' },
  { id: 'p4', platform: 'tiktok', view_count: 120321, like_count: 2400, comment_count: 201, seeding_cntry: 'JP' },
];

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function deriveCreatorStage(item) {
  const explicit = String(item?.stage || '').toLowerCase();
  if (creatorStages.some((stage) => stage.value === explicit)) return explicit;
  const avgViews = Number(item?.avgViews ?? item?.avg_views ?? 0) || 0;
  const posts = Number(item?.postCount ?? item?.post_count ?? 0) || 0;
  if (item?.isPartnered) return 'partnered';
  if (avgViews >= 30000) return 'performing';
  if (posts > 0) return 'posted';
  if (item?.isSaved || item?.selected) return 'seeded';
  return 'discovered';
}

/* ── reusable ── */

function KpiCard({ icon, title, value, desc, accent }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: tokens.color.textSubtle }}>{title}</p>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: tokens.color.text, marginTop: 6 }}>{value}</p>
      <p style={{ fontSize: 11, color: tokens.color.textSubtle, marginTop: 6 }}>{desc}</p>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: 18,
      }}
    >
      {title && <h2 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, marginBottom: 14 }}>{title}</h2>}
      {children}
    </div>
  );
}

/* ── Main ── */

export default function AnalyticsPage() {
  const { influencers } = useInfluencerPool({ selectedOnly: true });
  const { data: performanceData } = useContentLibrary('performance');

  const creatorData = useMemo(() => {
    const list = influencers.length ? influencers : FALLBACK_INFLUENCERS;
    return list.map((item) => ({
      stage: deriveCreatorStage(item),
      avgViews: Number(item.avgViews ?? item.avg_views ?? 0) || 0,
      country: item.country || 'KR',
    }));
  }, [influencers]);

  const performanceItems = useMemo(() => {
    const list = normalizeList(performanceData);
    return (list.length ? list : FALLBACK_PERFORMANCE).map((item) => ({
      platform: String(item.platform || 'instagram').toLowerCase(),
      views: Number(item.view_count ?? 0) || 0,
      likes: Number(item.like_count ?? 0) || 0,
      comments: Number(item.comment_count ?? 0) || 0,
      country: item.seeding_cntry || 'KR',
    }));
  }, [performanceData]);

  const stageCounts = useMemo(() => {
    return creatorStages.map((stage) => ({
      ...stage,
      count: creatorData.filter((item) => item.stage === stage.value).length,
    }));
  }, [creatorData]);

  const maxStageCount = Math.max(...stageCounts.map((item) => item.count), 1);

  const platformSummary = useMemo(() => {
    const map = new Map();
    performanceItems.forEach((item) => {
      const key = item.platform;
      if (!map.has(key)) map.set(key, { platform: key, views: 0, interactions: 0, count: 0 });
      const target = map.get(key);
      target.views += item.views;
      target.interactions += item.likes + item.comments;
      target.count += 1;
    });
    return [...map.values()]
      .map((item) => ({
        ...item,
        engagement: item.views > 0 ? (item.interactions / item.views) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views);
  }, [performanceItems]);

  const geoReadyRatio = useMemo(() => {
    const total = performanceItems.length || 1;
    const ready = performanceItems.filter((item) => ['US', 'JP', 'CN', 'GLOBAL'].includes(String(item.country).toUpperCase())).length;
    return { ready, total, ratio: (ready / total) * 100 };
  }, [performanceItems]);

  const avgCreatorViews = Math.round(
    creatorData.reduce((sum, item) => sum + item.avgViews, 0) / Math.max(creatorData.length, 1),
  );

  /* Country breakdown */
  const countryBreakdown = useMemo(() => {
    const map = new Map();
    performanceItems.forEach((item) => {
      const c = String(item.country || 'KR').toUpperCase();
      if (!map.has(c)) map.set(c, { country: c, views: 0, count: 0 });
      const t = map.get(c);
      t.views += item.views;
      t.count += 1;
    });
    return [...map.values()].sort((a, b) => b.views - a.views);
  }, [performanceItems]);

  const maxCountryViews = Math.max(...countryBreakdown.map((c) => c.views), 1);

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 3 }}>
          Creator Pipeline, 플랫폼 성과, GEO 준비도 지표
        </p>
      </div>

      {/* KPI cards */}
      <div className="fnco-grid-kpi-4" style={{ marginBottom: 18 }}>
        <KpiCard
          icon={<Users style={{ width: 15, height: 15 }} />}
          title="Creator Volume"
          value={creatorData.length}
          desc="활성 크리에이터 수"
          accent={tokens.color.primary}
        />
        <KpiCard
          icon={<TrendingUp style={{ width: 15, height: 15 }} />}
          title="Avg Creator Views"
          value={formatCompactNumber(avgCreatorViews)}
          desc="크리에이터 평균 조회수"
          accent={tokens.color.success}
        />
        <KpiCard
          icon={<BarChart3 style={{ width: 15, height: 15 }} />}
          title="Perf Contents"
          value={performanceItems.length}
          desc="성과 콘텐츠 집계"
          accent={tokens.color.warning}
        />
        <KpiCard
          icon={<Globe2 style={{ width: 15, height: 15 }} />}
          title="GEO Ready Ratio"
          value={`${geoReadyRatio.ratio.toFixed(1)}%`}
          desc={`${geoReadyRatio.ready} / ${geoReadyRatio.total}`}
          accent={tokens.color.geo}
        />
      </div>

      {/* Main grid: Pipeline + Platform */}
      <div className="fnco-analytics-main-grid" style={{ marginBottom: 18 }}>
        {/* Creator Pipeline */}
        <SectionCard title="Creator Pipeline Distribution">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stageCounts.map((stage) => (
              <div key={stage.value}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: stage.color,
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text }}>{stage.count}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: tokens.color.surfaceMuted }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: stage.color,
                      width: `${(stage.count / maxStageCount) * 100}%`,
                      transition: 'width .3s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Platform Performance */}
        <SectionCard title="Platform Performance">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {platformSummary.map((p) => {
              const meta = getPlatformMeta(p.platform);
              return (
                <div
                  key={p.platform}
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.surfaceMuted,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{meta.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>{p.count} posts</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 10, color: tokens.color.textSubtle }}>Views</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>{formatCompactNumber(p.views)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: tokens.color.textSubtle }}>Interactions</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>{formatCompactNumber(p.interactions)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: tokens.color.textSubtle }}>Engagement</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{p.engagement.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Bottom row: GEO + Stage summary table */}
      <div className="fnco-analytics-main-grid">
        {/* Country breakdown */}
        <SectionCard title="GEO Distribution">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {countryBreakdown.map((c) => (
              <div key={c.country}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{c.country}</span>
                  <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>
                    {formatCompactNumber(c.views)} views · {c.count} posts
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: tokens.color.surfaceMuted }}>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: tokens.color.geo,
                      width: `${(c.views / maxCountryViews) * 100}%`,
                      transition: 'width .3s',
                    }}
                  />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${tokens.color.border}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>GEO Ready</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.geo }}>
                {geoReadyRatio.ratio.toFixed(1)}% ({geoReadyRatio.ready}/{geoReadyRatio.total})
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Stage summary table */}
        <SectionCard title="Stage Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', padding: '6px 0', borderBottom: `1px solid ${tokens.color.border}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>Stage</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle, textAlign: 'right' }}>Count</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle, textAlign: 'right' }}>Share</span>
            </div>
            {stageCounts.map((stage) => {
              const share = creatorData.length > 0 ? ((stage.count / creatorData.length) * 100).toFixed(1) : '0.0';
              return (
                <div
                  key={stage.value}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 80px',
                    padding: '8px 0',
                    borderBottom: `1px solid ${tokens.color.border}`,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: stage.color,
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, textAlign: 'right' }}>{stage.count}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.textSubtle, textAlign: 'right' }}>{share}%</span>
                </div>
              );
            })}
            {/* total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', padding: '8px 0', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.primary, textAlign: 'right' }}>{creatorData.length}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.textSubtle, textAlign: 'right' }}>100%</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
