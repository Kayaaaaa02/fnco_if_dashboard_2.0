import { useMemo, useState } from 'react';
import { Search, Users, Globe2, TrendingUp, KanbanSquare, List, ExternalLink, FlaskConical } from 'lucide-react';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useInfluencerPool } from '@/hooks/useInfluencerPool.js';
import { creatorStages, formatCompactNumber, getPlatformMeta, tokens } from '@/styles/designTokens.js';
import CreatorDeepAnalysis from '@/components/creator-hub/CreatorDeepAnalysis.jsx';

const FALLBACK_CREATORS = [
  // Partnered (3명)
  { id: 'c1', name: 'Olivia Yang', handle: '@olafflee', platform: 'tiktok', followers: 2400000, avgViews: 840000, stage: 'partnered', country: 'US', geoReady: true },
  { id: 'c2', name: '이시안 Lee Sian', handle: '@youseeany', platform: 'instagram', followers: 1200000, avgViews: 420000, stage: 'partnered', country: 'KR', geoReady: false },
  { id: 'c3', name: '레오제이', handle: '@leojmakeup', platform: 'youtube', followers: 584300, avgViews: 204000, stage: 'partnered', country: 'KR', geoReady: false },
  // Performing (4명)
  { id: 'c4', name: 'Olia Majd', handle: '@oliamajd', platform: 'tiktok', followers: 409100, avgViews: 143000, stage: 'performing', country: 'US', geoReady: true },
  { id: 'c5', name: '미선짱', handle: '@sunn416', platform: 'instagram', followers: 405800, avgViews: 142000, stage: 'performing', country: 'KR', geoReady: false },
  { id: 'c6', name: 'Hasime Kukaj', handle: '@thebeautyradar', platform: 'youtube', followers: 349300, avgViews: 122000, stage: 'performing', country: 'US', geoReady: true },
  { id: 'c7', name: '권은지', handle: '@3eunji__', platform: 'tiktok', followers: 337900, avgViews: 118000, stage: 'performing', country: 'US', geoReady: true },
  // Posted (5명)
  { id: 'c8', name: '메이크업 아티스트 NANA', handle: '@_twinkle_makeup_', platform: 'instagram', followers: 292600, avgViews: 102000, stage: 'posted', country: 'KR', geoReady: false },
  { id: 'c9', name: 'Candace Hampton-Fudge', handle: '@thebeautybeau', platform: 'tiktok', followers: 261200, avgViews: 91000, stage: 'posted', country: 'US', geoReady: true },
  { id: 'c10', name: '꿀아영(신아영)', handle: '@dkdud5070', platform: 'youtube', followers: 245100, avgViews: 86000, stage: 'posted', country: 'KR', geoReady: false },
  { id: 'c11', name: '이향 LEE HYANG', handle: '@_leehyang', platform: 'instagram', followers: 227900, avgViews: 80000, stage: 'posted', country: 'KR', geoReady: false },
  { id: 'c12', name: '加藤 美南', handle: '@minamikato_0115', platform: 'tiktok', followers: 202300, avgViews: 71000, stage: 'posted', country: 'JP', geoReady: true },
  // Seeded (4명)
  { id: 'c13', name: '모델 심지영', handle: '@jy____shim', platform: 'instagram', followers: 193900, avgViews: 68000, stage: 'seeded', country: 'KR', geoReady: false },
  { id: 'c14', name: 'Grazy Grace', handle: '@gebabyk', platform: 'youtube', followers: 145600, avgViews: 51000, stage: 'seeded', country: 'US', geoReady: true },
  { id: 'c15', name: '倉田乃彩', handle: '@i_09_noa', platform: 'tiktok', followers: 144100, avgViews: 50000, stage: 'seeded', country: 'JP', geoReady: true },
  { id: 'c16', name: 'Shim hye jin', handle: '@hyedini_sim', platform: 'instagram', followers: 140100, avgViews: 49000, stage: 'seeded', country: 'KR', geoReady: false },
  // Discovered (4명)
  { id: 'c17', name: 'Megan', handle: '@milktea.meg', platform: 'tiktok', followers: 131700, avgViews: 46000, stage: 'discovered', country: 'US', geoReady: true },
  { id: 'c18', name: '오민초 Mincho Oh', handle: '@mincho_oh', platform: 'youtube', followers: 121500, avgViews: 43000, stage: 'discovered', country: 'KR', geoReady: false },
  { id: 'c19', name: '채원 Chaewon', handle: '@chaewonsays', platform: 'instagram', followers: 119000, avgViews: 42000, stage: 'discovered', country: 'US', geoReady: true },
  { id: 'c20', name: '모하뉴', handle: '@ujjja_e', platform: 'tiktok', followers: 99400, avgViews: 35000, stage: 'discovered', country: 'KR', geoReady: false },
];

function toStage(raw) {
  const explicit = raw?.stage?.toLowerCase();
  if (creatorStages.some((item) => item.value === explicit)) return explicit;
  // 명시적 stage가 없으면 인플루언서 풀에서 넘어온 것이므로 discovered
  if (raw?.isSaved) return 'discovered';
  return 'discovered';
}

function toCreatorModel(raw, index) {
  const followers = Number(raw?.followers ?? raw?.follower_count ?? 0) || 0;
  const avgViews = Number(raw?.avgViews ?? raw?.avg_views ?? raw?.avg_views_30d ?? 0) || 0;
  const geoReady = raw?.geoReady ?? ['US', 'JP', 'CN', 'GLOBAL'].includes(String(raw?.country || '').toUpperCase());
  const stage = toStage(raw);
  const rawHandle = raw?.handle || raw?.profile_id || raw?.username || '';
  const fallbackHandle = raw?.name ? `@${String(raw.name).replace(/\s+/g, '').toLowerCase()}` : '@unknown';
  const handle = rawHandle ? (String(rawHandle).startsWith('@') ? String(rawHandle) : `@${rawHandle}`) : fallbackHandle;
  const bf = [followers >= 10000, avgViews >= 5000, geoReady || ['performing', 'partnered'].includes(stage)];

  return {
    id: raw?.id ?? `creator-${index + 1}`,
    name: raw?.name || raw?.user_nm || raw?.influencer_nm || 'Unknown Creator',
    handle, platform: raw?.platform || 'instagram',
    followers, avgViews, stage, country: raw?.country || 'KR', geoReady, bf,
    profileUrl: raw?.profileUrl || raw?.profile_url || '',
    profileImage: raw?.profileImage || raw?.profile_image || null,
    summary: raw?.quickSummary || raw?.summary || '',
    category: raw?.category || raw?.influencer_type || '',
    engagementRate: raw?.engagementRate || raw?.avg_engagement_quick || 0,
  };
}

/* ── Shared Components ── */

function FilterSelect({ value, onChange, children, width = 130 }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm font-medium"
      style={{
        width, height: 36, borderRadius: 8,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        padding: '0 10px', color: tokens.color.text, outline: 'none',
      }}
    >
      {children}
    </select>
  );
}

function KpiCard({ label, value, caption, color }) {
  return (
    <div style={{
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 'var(--fnco-radius-md)',
      padding: '16px 20px',
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: tokens.color.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color || tokens.color.text, lineHeight: 1.1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 12, color: tokens.color.textSubtle }}>{caption}</p>
    </div>
  );
}

function BfBadges({ bf }) {
  return (
    <div className="flex gap-1">
      {['①', '②', '③'].map((label, idx) => (
        <span
          key={label}
          className="inline-flex h-5 w-5 items-center justify-center text-[10px] font-bold"
          style={{
            borderRadius: 5,
            background: bf[idx] ? tokens.color.successSoft : '#edf1f7',
            color: bf[idx] ? tokens.color.success : '#a0aec0',
          }}
        >{label}</span>
      ))}
    </div>
  );
}

function SectionCard({ children, style }) {
  return (
    <div style={{
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 'var(--fnco-radius-md)',
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, right }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text }}>{title}</h2>
      {right && <span style={{ fontSize: 12, color: tokens.color.textSubtle }}>{right}</span>}
    </div>
  );
}

/* ── Creator Cards ── */

function CreatorMiniCard({ creator, onAnalyze }) {
  const platform = getPlatformMeta(creator.platform);
  return (
    <div style={{
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 10, padding: '10px 12px',
      background: tokens.color.surface,
    }}>
      <div className="flex items-start justify-between gap-2" style={{ marginBottom: 6 }}>
        <div className="flex items-center gap-2 min-w-0">
          {creator.profileImage ? (
            <img src={creator.profileImage} alt={creator.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {(creator.name || '?')[0]}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{creator.name}</p>
            <p className="truncate" style={{ fontSize: 11, color: tokens.color.textSubtle }}>{creator.handle}</p>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '2px 7px', background: platform.soft, color: platform.color, whiteSpace: 'nowrap' }}>
          {platform.label}
        </span>
      </div>
      <div className="flex items-center justify-between" style={{ fontSize: 12, color: tokens.color.textSubtle, marginBottom: 8 }}>
        <span>팔로워 {formatCompactNumber(creator.followers)}</span>
        <span>조회 {formatCompactNumber(creator.avgViews)}</span>
      </div>
      <div className="flex items-center justify-between">
        <BfBadges bf={creator.bf} />
        <div className="flex items-center gap-1.5">
          {creator.geoReady && (
            <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 5, padding: '2px 6px', background: tokens.color.geoSoft, color: tokens.color.geo }}>GEO</span>
          )}
          {onAnalyze && (
            <button
              onClick={() => onAnalyze(creator)}
              style={{
                fontSize: 11, fontWeight: 600, color: tokens.color.primary,
                background: 'transparent', border: `1px solid ${tokens.color.border}`,
                borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
              }}
            >
              분석
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreatorTable({ creators, onAnalyze }) {
  return (
    <div className="overflow-hidden" style={{ border: `1px solid ${tokens.color.border}`, borderRadius: 10, background: tokens.color.surface }}>
      <div
        className="grid grid-cols-[1.5fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_0.5fr] gap-3 px-4 py-2.5 text-xs font-semibold"
        style={{ borderBottom: `1px solid ${tokens.color.border}`, color: tokens.color.textSubtle, background: tokens.color.surfaceMuted }}
      >
        <span>Creator</span><span>Platform</span><span>Stage</span>
        <span className="text-right">Followers</span><span className="text-right">Avg Views</span>
        <span className="text-right">BF / GEO</span><span className="text-center">분석</span>
      </div>
      {creators.map((creator) => {
        const stageMeta = creatorStages.find((s) => s.value === creator.stage) || creatorStages[0];
        const platform = getPlatformMeta(creator.platform);
        return (
          <div
            key={creator.id}
            className="grid grid-cols-[1.5fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_0.5fr] items-center gap-3 px-4 py-2.5"
            style={{ borderBottom: `1px solid ${tokens.color.border}`, fontSize: 13 }}
          >
            <div className="min-w-0">
              <p className="truncate" style={{ fontWeight: 600, color: tokens.color.text }}>{creator.name}</p>
              <p className="truncate" style={{ fontSize: 11, color: tokens.color.textSubtle }}>{creator.handle}</p>
            </div>
            <span style={{ color: platform.color, fontWeight: 500 }}>{platform.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '2px 8px', background: stageMeta.soft, color: stageMeta.color, width: 'fit-content' }}>
              {stageMeta.label}
            </span>
            <span className="text-right" style={{ color: tokens.color.text }}>{formatCompactNumber(creator.followers)}</span>
            <span className="text-right" style={{ color: tokens.color.text }}>{formatCompactNumber(creator.avgViews)}</span>
            <div className="ml-auto flex items-center gap-2">
              <BfBadges bf={creator.bf} />
              {creator.geoReady && <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.geo }}>GEO</span>}
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => onAnalyze?.(creator)}
                style={{
                  fontSize: 12, fontWeight: 600, color: tokens.color.primary,
                  background: 'transparent', border: `1px solid ${tokens.color.border}`,
                  borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                }}
              >
                분석
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main ── */
export default function CreatorHub() {
  const { influencers, isLoading } = useInfluencerPool({ selectedOnly: true });

  const creators = useMemo(() => {
    if (influencers.length === 0) return FALLBACK_CREATORS.map(toCreatorModel);
    const prioritized = influencers.filter((item) => {
      if (item?.isSaved || item?.selected || item?.isPartnered || item?.stage) return true;
      return (Number(item?.avgViews ?? item?.avg_views ?? 0) || 0) >= 10000;
    });
    const source = prioritized.length > 0 ? prioritized : influencers.slice(0, 12);
    return source.map(toCreatorModel);
  }, [influencers]);

  const [selectedCreator, setSelectedCreator] = useState(null);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [geoFilter, setGeoFilter] = useState('all');
  const [networkMode, setNetworkMode] = useState('pipeline');

  const countries = useMemo(
    () => ['all', ...new Set(creators.map((c) => c.country).filter(Boolean))],
    [creators]
  );

  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
      if (countryFilter !== 'all' && c.country !== countryFilter) return false;
      if (geoFilter === 'ready' && !c.geoReady) return false;
      if (geoFilter === 'non-ready' && c.geoReady) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.handle.toLowerCase().includes(q) && !c.summary.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [creators, platformFilter, stageFilter, countryFilter, geoFilter, search]);

  const pipelineCounts = useMemo(() => {
    return creatorStages.map((stage) => ({ ...stage, creators: filteredCreators.filter((c) => c.stage === stage.value) }));
  }, [filteredCreators]);

  const pipelineWidths = useMemo(() => {
    const minW = 8;
    const varW = 100 - (minW * pipelineCounts.length);
    const total = pipelineCounts.reduce((s, st) => s + st.creators.length, 0);
    if (total === 0) return pipelineCounts.map(() => 100 / pipelineCounts.length);
    return pipelineCounts.map((st) => minW + ((st.creators.length / total) * varW));
  }, [pipelineCounts]);

  const geoReadyCount = filteredCreators.filter((c) => c.geoReady).length;
  const avgViews = filteredCreators.reduce((s, c) => s + c.avgViews, 0) / Math.max(filteredCreators.length, 1);
  const bfStrongCount = filteredCreators.filter((c) => c.bf.filter(Boolean).length >= 2).length;

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, letterSpacing: '-0.01em', marginBottom: 4 }}>
            크리에이터 허브
          </h1>
          <p style={{ fontSize: 13, color: tokens.color.textSubtle }}>
            크리에이터 운영 대시보드 + 네트워크 관리 화면
          </p>
        </div>
        {isLoading && <span style={{ fontSize: 13, color: tokens.color.textSubtle }}>데이터 동기화 중...</span>}
      </div>

      {/* ── KPI ── */}
      <div className="fnco-grid-kpi-4" style={{ marginBottom: 20 }}>
        <KpiCard label="Active Creators" value={filteredCreators.length} caption="현재 필터 기준" />
        <KpiCard label="GEO Ready" value={geoReadyCount} caption="글로벌 전환 준비" color="var(--fnco-geo)" />
        <KpiCard label="Avg Views" value={formatCompactNumber(avgViews)} caption="크리에이터 평균 조회수" color="var(--fnco-primary)" />
        <KpiCard label="BF Strong" value={bfStrongCount} caption="BF 2점 이상 크리에이터" color="var(--fnco-success)" />
      </div>

      {/* ── Filter Bar ── */}
      <div
        className="flex flex-wrap items-center gap-2"
        style={{
          padding: '12px 16px',
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: 'var(--fnco-radius-md)',
          marginBottom: 20,
        }}
      >
        <div className="relative flex-1" style={{ minWidth: 200, maxWidth: 320 }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: tokens.color.textSubtle }} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="크리에이터명, 핸들 검색..."
            className="pl-9"
            style={{ height: 36, borderRadius: 8, border: `1px solid ${tokens.color.border}`, background: tokens.color.surfaceMuted, fontSize: 13 }}
          />
        </div>
        <FilterSelect value={platformFilter} onChange={setPlatformFilter}>
          <option value="all">전체 플랫폼</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </FilterSelect>
        <FilterSelect value={stageFilter} onChange={setStageFilter}>
          <option value="all">전체 단계</option>
          {creatorStages.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </FilterSelect>
        <FilterSelect value={countryFilter} onChange={setCountryFilter}>
          {countries.map((c) => <option key={c} value={c}>{c === 'all' ? '전체 국가' : c}</option>)}
        </FilterSelect>
        <FilterSelect value={geoFilter} onChange={setGeoFilter} width={120}>
          <option value="all">GEO 전체</option>
          <option value="ready">GEO Ready</option>
          <option value="non-ready">GEO 미준비</option>
        </FilterSelect>

        <div className="flex gap-1 ml-2">
          {[
            { mode: 'pipeline', icon: KanbanSquare, label: 'Pipeline' },
            { mode: 'list', icon: List, label: 'List' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setNetworkMode(mode)}
              className="flex items-center gap-1.5"
              style={{
                height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: networkMode === mode ? tokens.color.text : 'transparent',
                color: networkMode === mode ? '#fff' : tokens.color.textSubtle,
                border: networkMode === mode ? 'none' : `1px solid ${tokens.color.border}`,
              }}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.textSubtle, marginLeft: 'auto' }}>
          {filteredCreators.length}명
        </span>
      </div>

      {/* ── Pipeline Visualization ── */}
      <SectionCard style={{ marginBottom: 20 }}>
        <SectionTitle title="Creator Pipeline" right={`전체 ${filteredCreators.length}명`} />
        <div className="flex overflow-hidden" style={{ borderRadius: 8, border: `1px solid ${tokens.color.border}`, marginBottom: 12 }}>
          {pipelineCounts.map((stage, i) => (
            <div
              key={stage.value}
              className="flex min-h-[38px] items-center justify-center text-[13px] font-semibold"
              style={{
                width: `${pipelineWidths[i] || 0}%`,
                background: stage.soft, color: stage.color,
                borderRight: i === pipelineCounts.length - 1 ? 'none' : `1px solid ${tokens.color.border}`,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {stage.label} · {stage.creators.length}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {pipelineCounts.map((stage) => (
            <span key={stage.value} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 500, color: stage.color, background: stage.soft, borderRadius: 6, padding: '3px 10px' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: stage.color }} />
              {stage.label}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* ── Creator Network ── */}
      <SectionCard style={{ marginBottom: 20 }}>
        <SectionTitle title="Creator Network" right="Pipeline / List 모드 전환 가능" />
        {networkMode === 'pipeline' ? (
          <div className="fnco-creator-network-grid">
            {pipelineCounts.map((stage) => (
              <div key={stage.value} style={{ minHeight: 220, background: tokens.color.surfaceMuted, border: `1px solid ${tokens.color.border}`, borderRadius: 10, padding: 12 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 6, padding: '2px 8px', background: stage.soft, color: stage.color }}>{stage.label}</span>
                  <span style={{ fontSize: 12, color: tokens.color.textSubtle }}>{stage.creators.length}</span>
                </div>
                <div className="space-y-2">
                  {stage.creators.length === 0 ? (
                    <div className="text-center py-6" style={{ fontSize: 12, color: tokens.color.textSubtle }}>없음</div>
                  ) : (
                    stage.creators.map((c) => <CreatorMiniCard key={c.id} creator={c} onAnalyze={setSelectedCreator} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CreatorTable creators={filteredCreators} onAnalyze={setSelectedCreator} />
        )}
      </SectionCard>

      {/* ── Bottom Cards ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <SectionTitle title="GEO Ready Queue" />
          <div className="space-y-2">
            {filteredCreators.filter((c) => c.geoReady).slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between" style={{ padding: '10px 12px', border: `1px solid ${tokens.color.border}`, borderRadius: 8 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: tokens.color.textSubtle }}>{c.country} · {c.handle}</p>
                </div>
                {c.profileUrl ? (
                  <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: tokens.color.primary }}>
                    Profile <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: tokens.color.textSubtle }}>대상 검토</span>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle title="Sprint Focus" />
          <div className="space-y-2">
            {[
              { icon: Users, text: '시딩 전환 필요: Discovered 3명' },
              { icon: Globe2, text: 'GEO 준비율 40% 이상 유지' },
              { icon: TrendingUp, text: 'BF 3점 크리에이터 주 2건 확보' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3" style={{ padding: '10px 12px', border: `1px solid ${tokens.color.border}`, borderRadius: 8 }}>
                <item.icon className="h-4 w-4 shrink-0" style={{ color: tokens.color.primary }} />
                <span style={{ fontSize: 13, color: tokens.color.text }}>{item.text}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <CreatorDeepAnalysis
        creator={selectedCreator}
        open={!!selectedCreator}
        onOpenChange={(open) => { if (!open) setSelectedCreator(null); }}
      />
    </div>
  );
}
