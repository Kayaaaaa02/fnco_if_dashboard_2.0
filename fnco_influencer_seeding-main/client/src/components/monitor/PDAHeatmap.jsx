import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePDAHeatmap } from '@/hooks/useMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.jsx';
import { Grid3X3, Loader2, Trophy, TrendingUp, AlertTriangle, Heart, Megaphone, ExternalLink, User } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import { mockPDAHeatmap } from '@/mocks/data.js';

/* ── Awareness 뱃지 색상 ── */
const A_COLORS = {
  A1: { bg: '#f97316', text: '#fff' },
  A2: { bg: '#8b5cf6', text: '#fff' },
  A3: { bg: '#3b82f6', text: '#fff' },
  A4: { bg: '#10b981', text: '#fff' },
};

const BAR_COLORS = ['#f97316', '#8b5cf6', '#3b82f6', '#10b981'];

function formatNum(val) {
  if (val == null) return '-';
  if (val >= 10000) return `${(val / 10000).toFixed(1)}만`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString('ko-KR');
}

export default function PDAHeatmap() {
  const { id: campaignId } = useParams();
  const { data: heatmapData, isLoading } = usePDAHeatmap(campaignId);
  const [activeTab, setActiveTab] = useState('engagement');

  // API 데이터가 비어있으면 mock fallback 사용
  const hasApiData = heatmapData && (
    (Array.isArray(heatmapData.personas) && heatmapData.personas.length > 0) ||
    (Array.isArray(heatmapData.cells) && heatmapData.cells.length > 0) ||
    (Array.isArray(heatmapData) && heatmapData.length > 0)
  );
  const effectiveData = hasApiData ? heatmapData : mockPDAHeatmap;
  const personas = effectiveData?.personas || [];
  const desires = effectiveData?.desires || [];
  const cells = effectiveData?.cells || [];

  const isEngTab = activeTab === 'engagement';

  const TOP_BORDER_COLORS = ['#f59e0b', '#10b981', '#3b82f6'];
  const TOP_BG_COLORS = ['rgba(245,158,11,0.05)', 'rgba(16,185,129,0.05)', 'rgba(59,130,246,0.05)'];
  const TOP_BADGE_COLORS = ['linear-gradient(135deg, #f59e0b, #f97316)', 'linear-gradient(135deg, #10b981, #059669)', 'linear-gradient(135deg, #3b82f6, #6366f1)'];

  const { cellMap, rankedByEng, rankedByRoas, topEngRankMap, topRoasRankMap } = useMemo(() => {
    const map = {};
    for (const cell of cells) {
      map[`${cell.persona_code}-${cell.desire_code}`] = cell;
    }
    const byEng = [...cells].filter(c => c.avg_engagement != null).sort((a, b) => b.avg_engagement - a.avg_engagement);
    const byRoas = [...cells].filter(c => c.avg_roas != null).sort((a, b) => b.avg_roas - a.avg_roas);
    const engMap = new Map();
    byEng.slice(0, 3).forEach((c, i) => engMap.set(`${c.persona_code}-${c.desire_code}`, i));
    const roasMap = new Map();
    byRoas.slice(0, 3).forEach((c, i) => roasMap.set(`${c.persona_code}-${c.desire_code}`, i));
    return { cellMap: map, rankedByEng: byEng, rankedByRoas: byRoas, topEngRankMap: engMap, topRoasRankMap: roasMap };
  }, [cells]);

  const topRankMap = isEngTab ? topEngRankMap : topRoasRankMap;
  const ranked = isEngTab ? rankedByEng : rankedByRoas;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (personas.length === 0 || desires.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <Grid3X3 className="size-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">P.D.A. 데이터가 없습니다</p>
          <p className="text-xs mt-1">목 데이터를 먼저 생성해주세요</p>
        </CardContent>
      </Card>
    );
  }

  // 바 비율 계산용 최대값
  const maxMetric = isEngTab
    ? Math.max(...cells.map(c => c.avg_engagement || 0))
    : Math.max(...cells.map(c => c.avg_roas || 0));

  /* ── 컨셉 뱃지 안의 서브 메트릭 (탭별) ── */
  function getConceptSubLabel(c) {
    if (isEngTab) {
      return `${formatNum(c.views)}`;
    }
    return `${c.ctr?.toFixed(1)}%`;
  }

  /* ── 셀 요약 메트릭 (탭별 3개, 발행 콘텐츠 평균값) ── */
  function renderCellMetrics(cell) {
    const cnt = cell.contents_count;
    if (isEngTab) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>VIEW <b style={{ color: '#1e293b' }}>{formatNum(cell.avg_views)}</b></span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>ENG <b style={{ color: '#6366f1' }}>{cell.avg_engagement?.toFixed(1)}%</b></span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>LIKE <b style={{ color: '#ec4899' }}>{formatNum(cell.avg_likes)}</b></span>
          </div>
          {cnt != null && <span style={{ fontSize: 9, color: '#b0b0b0' }}>발행 {cnt}건 평균</span>}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>CTR <b style={{ color: '#6366f1' }}>{(cell.avg_ctr * 100)?.toFixed(1)}%</b></span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>ROAS <b style={{ color: '#10b981' }}>{cell.avg_roas?.toFixed(1)}x</b></span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>전환 <b style={{ color: '#1e293b' }}>{formatNum(cell.total_conversions)}</b></span>
        </div>
        {cnt != null && <span style={{ fontSize: 9, color: '#b0b0b0' }}>발행 {cnt}건 평균</span>}
      </div>
    );
  }

  return (
    <Card style={{ overflow: 'hidden' }}>
      <CardHeader style={{ paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Grid3X3 style={{ width: 16, height: 16, color: '#94a3b8' }} />
            <CardTitle style={{ fontSize: 14, fontWeight: 800 }}>P.D.A. 매트릭스</CardTitle>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              {personas.length}P × {desires.length}D
            </span>
          </div>

          {/* ── 탭 토글 ── */}
          <div style={{
            display: 'flex', gap: 2, padding: 2, borderRadius: 8,
            background: tokens.color.surfaceMuted, border: `1px solid ${tokens.color.border}`,
          }}>
            {[
              { key: 'engagement', label: 'ENG 기준', icon: Heart, sub: 'VIEW · ENG · LIKE' },
              { key: 'efficiency', label: '광고 효율', icon: Megaphone, sub: 'CTR · ROAS · 전환' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 14px', borderRadius: 6,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: 'none',
                    background: isActive ? tokens.color.surface : 'transparent',
                    color: isActive ? '#1e293b' : '#94a3b8',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all .15s ease',
                  }}
                >
                  <Icon style={{ width: 12, height: 12 }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <TooltipProvider>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 160 }} />
                {desires.map(d => (
                  <col key={d.code} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textAlign: 'left', borderBottom: `1px solid ${tokens.color.border}`, whiteSpace: 'nowrap' }}>
                    P ＼ D
                  </th>
                  {desires.map(d => (
                    <th key={d.code} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: `1px solid ${tokens.color.border}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Badge style={{ background: '#d97706', color: '#fff', fontSize: 11, padding: '1px 8px', borderRadius: 999 }}>
                          {d.code}
                        </Badge>
                        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{d.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {personas.map(p => (
                  <tr key={p.code}>
                    <td style={{ padding: '8px 12px', borderBottom: `1px solid ${tokens.color.border}`, verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge style={{ background: '#7c3aed', color: '#fff', fontSize: 11, padding: '1px 8px', borderRadius: 999 }}>
                          {p.code}
                        </Badge>
                        <span style={{ fontSize: 11, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.name}</span>
                      </div>
                    </td>
                    {desires.map(d => {
                      const key = `${p.code}-${d.code}`;
                      const cell = cellMap[key];
                      const topIdx = topRankMap.has(key) ? topRankMap.get(key) : -1;
                      const isTop = topIdx >= 0;
                      const concepts = cell?.concepts_detail || [];
                      const topBorderColor = isTop ? TOP_BORDER_COLORS[topIdx] : tokens.color.border;
                      const topBgColor = isTop ? TOP_BG_COLORS[topIdx] : tokens.color.surface;
                      const topBadgeBg = isTop ? TOP_BADGE_COLORS[topIdx] : '';

                      return (
                        <td key={d.code} style={{ padding: 4, borderBottom: `1px solid ${tokens.color.border}` }}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div style={{
                                position: 'relative',
                                borderRadius: 10,
                                border: isTop ? `2px solid ${topBorderColor}` : `1px solid ${tokens.color.border}`,
                                background: topBgColor,
                                padding: '10px 12px',
                                cursor: 'default',
                                transition: 'all .2s ease',
                                boxShadow: isTop ? `0 0 12px ${topBorderColor}30` : 'none',
                                minHeight: 100,
                              }}>
                                {isTop && (
                                  <div style={{
                                    position: 'absolute', top: -8, right: 8,
                                    background: topBadgeBg,
                                    color: '#fff', fontSize: 9, fontWeight: 700,
                                    padding: '1px 6px', borderRadius: 999,
                                    boxShadow: `0 2px 4px ${topBorderColor}50`,
                                  }}>
                                    TOP {topIdx + 1}
                                  </div>
                                )}

                                {/* Awareness 뱃지 + 컨셉별 서브 메트릭 */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                                  {concepts.map((c, idx) => {
                                    const aColor = A_COLORS[c.awareness_code] || { bg: '#94a3b8', text: '#fff' };
                                    return (
                                      <span key={idx} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                        background: aColor.bg, color: aColor.text,
                                        fontSize: 10, fontWeight: 700,
                                        padding: '2px 7px', borderRadius: 999,
                                      }}>
                                        {c.awareness_code}
                                        <span style={{ fontSize: 9, opacity: 0.85, fontWeight: 500 }}>{getConceptSubLabel(c)}</span>
                                      </span>
                                    );
                                  })}
                                </div>

                                {/* 셀 요약: 컨셉 수 */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                                    {concepts.length}개
                                  </span>
                                </div>

                                {/* 탭별 3개 메트릭 */}
                                {cell && renderCellMetrics(cell)}

                                {/* 인플루언서 */}
                                {cell?.top_influencers && cell.top_influencers.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                                    {cell.top_influencers.slice(0, 2).map((inf, i) => (
                                      <span key={i} style={{
                                        fontSize: 9, fontWeight: 500, color: '#475569',
                                        background: '#f1f5f9', padding: '1px 6px', borderRadius: 999,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90,
                                      }}>
                                        @{inf.name}
                                      </span>
                                    ))}
                                    {cell.top_influencers.length > 2 && (
                                      <span style={{ fontSize: 9, color: '#94a3b8', padding: '1px 4px' }}>
                                        +{cell.top_influencers.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* 효율 바 */}
                                <div style={{
                                  display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden',
                                  background: '#f1f5f9',
                                }}>
                                  {concepts.map((c, idx) => {
                                    const cMetric = isEngTab ? c.engagement_rate : c.roas;
                                    const width = maxMetric > 0 ? Math.max((cMetric / maxMetric) * 100, 8) : 50;
                                    return (
                                      <div key={idx} style={{
                                        width: `${width / concepts.length}%`,
                                        flexGrow: 1,
                                        background: BAR_COLORS[idx % BAR_COLORS.length],
                                        marginRight: idx < concepts.length - 1 ? 2 : 0,
                                        borderRadius: 4,
                                        transition: 'width .3s ease',
                                      }} />
                                    );
                                  })}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" style={{ maxWidth: 320, padding: 12 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <p style={{ fontSize: 12, fontWeight: 700 }}>{p.code} × {d.code}</p>
                                {concepts.map((c, idx) => (
                                  <div key={idx} style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{
                                        background: (A_COLORS[c.awareness_code] || {}).bg || '#94a3b8',
                                        color: '#fff', fontSize: 9, fontWeight: 700,
                                        padding: '1px 5px', borderRadius: 999,
                                      }}>{c.awareness_code}</span>
                                      <span style={{ fontWeight: 600 }}>{c.concept_name}</span>
                                    </div>
                                    {isEngTab ? (
                                      <div style={{ display: 'flex', gap: 12, color: '#64748b', fontSize: 10 }}>
                                        <span>VIEW <b style={{ color: '#1e293b' }}>{formatNum(c.views)}</b></span>
                                        <span>ENG <b style={{ color: '#6366f1' }}>{c.engagement_rate?.toFixed(1)}%</b></span>
                                        <span>LIKE <b style={{ color: '#ec4899' }}>{formatNum(c.likes)}</b></span>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', gap: 12, color: '#64748b', fontSize: 10 }}>
                                        <span>CTR <b style={{ color: '#6366f1' }}>{c.ctr?.toFixed(1)}%</b></span>
                                        <span>ROAS <b style={{ color: '#10b981' }}>{c.roas?.toFixed(1)}x</b></span>
                                        <span>전환 <b style={{ color: '#1e293b' }}>{formatNum(c.cpa)}원</b></span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TooltipProvider>

        {/* ── 범례 ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 10,
          borderTop: `1px solid ${tokens.color.border}`, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Awareness:</span>
          {Object.entries(A_COLORS).map(([code, c]) => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: c.bg }} />
              <span style={{ fontSize: 10, color: '#64748b' }}>{code}</span>
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 10, color: '#94a3b8' }}>|</span>
          {TOP_BORDER_COLORS.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${c}`, background: TOP_BG_COLORS[i] }} />
              <span style={{ fontSize: 10, color: c, fontWeight: 600 }}>TOP {i + 1}</span>
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 10, color: '#94a3b8' }}>|</span>
          <span style={{ fontSize: 10, color: '#64748b' }}>
            {isEngTab ? '지표: VIEW · ENG율 · LIKE' : '지표: CTR · ROAS · 전환'}
          </span>
        </div>

        {/* ── TOP 3 인사이트 분석 ── */}
        {ranked.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${tokens.color.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Trophy style={{ width: 15, height: 15, color: '#f59e0b' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                {isEngTab ? 'ENG. 기준 PxD 조합 TOP 3' : '광고 효율 기준 PxD 조합 TOP 3'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ranked.slice(0, 3).map((cell, idx) => {
                const pName = personas.find(pp => pp.code === cell.persona_code)?.name || cell.persona_code;
                const dName = desires.find(dd => dd.code === cell.desire_code)?.name || cell.desire_code;
                const concepts = cell.concepts_detail || [];
                const bgColors = ['rgba(245,158,11,0.06)', 'rgba(16,185,129,0.06)', 'rgba(59,130,246,0.06)'];
                const borderColors = ['#fbbf24', '#6ee7b7', '#93c5fd'];
                const icons = [
                  <Trophy key="t" style={{ width: 14, height: 14, color: '#f59e0b' }} />,
                  <TrendingUp key="u1" style={{ width: 14, height: 14, color: '#10b981' }} />,
                  <TrendingUp key="u2" style={{ width: 14, height: 14, color: '#3b82f6' }} />,
                ];

                // 탭 기준 컨셉 정렬 (전체 표시)
                const sortedConcepts = isEngTab
                  ? [...concepts].sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
                  : [...concepts].sort((a, b) => (b.roas || 0) - (a.roas || 0));

                return (
                  <div key={`${cell.persona_code}-${cell.desire_code}`} style={{
                    borderRadius: 10, border: `1px solid ${borderColors[idx]}`,
                    background: bgColors[idx], padding: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      {icons[idx]}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                        {idx + 1}위: {cell.persona_code}({pName}) × {cell.desire_code}({dName})
                      </span>
                      {cell.contents_count != null && (
                        <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 'auto' }}>발행 {cell.contents_count}건 평균</span>
                      )}
                    </div>

                    {/* 탭별 메트릭 요약 */}
                    {isEngTab ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>VIEW</span>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                            {formatNum(cell.avg_views)}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>ENG율</span>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', margin: 0 }}>
                            {cell.avg_engagement?.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>LIKE</span>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#ec4899', margin: 0 }}>
                            {formatNum(cell.avg_likes)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>CTR</span>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', margin: 0 }}>
                            {(cell.avg_ctr * 100)?.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>ROAS</span>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', margin: 0 }}>
                            {cell.avg_roas?.toFixed(1)}x
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>전환</span>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                            {formatNum(cell.total_conversions)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 컨셉별 상세 (Awareness 전체 표시) */}
                    {sortedConcepts.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                        {sortedConcepts.map((c, ci) => (
                          <div key={ci} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: ci === 0 ? 'rgba(99,102,241,0.08)' : 'rgba(241,245,249,0.6)',
                            borderRadius: 6, padding: '5px 8px',
                          }}>
                            <span style={{
                              background: (A_COLORS[c.awareness_code] || {}).bg || '#94a3b8',
                              color: '#fff', fontSize: 9, fontWeight: 700,
                              padding: '1px 5px', borderRadius: 999, flexShrink: 0,
                            }}>{c.awareness_code}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.concept_name}
                            </span>
                            <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, flexShrink: 0 }}>
                              {isEngTab
                                ? `ENG ${c.engagement_rate?.toFixed(1)}% · LIKE ${formatNum(c.likes)}`
                                : `CTR ${c.ctr?.toFixed(1)}% · ROAS ${c.roas?.toFixed(1)}x`
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 인플루언서 매칭 */}
                    {cell.top_influencers && cell.top_influencers.length > 0 && (
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: 5,
                        background: 'rgba(241,245,249,0.6)', borderRadius: 8, padding: '8px 10px', marginBottom: 6,
                        border: '1px solid #e2e8f0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <User style={{ width: 11, height: 11, color: '#94a3b8' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Top 인플루언서</span>
                        </div>
                        {cell.top_influencers.map((inf, ci) => {
                          const platColors = { instagram: '#ec4899', youtube: '#ef4444', tiktok: '#0f172a' };
                          const platLabels = { instagram: 'IG', youtube: 'YT', tiktok: 'TT' };
                          return (
                            <div key={ci} style={{
                              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
                                <span style={{
                                  background: platColors[inf.platform] || '#64748b',
                                  color: '#fff', fontSize: 8, fontWeight: 700,
                                  padding: '1px 5px', borderRadius: 999, flexShrink: 0,
                                }}>{platLabels[inf.platform] || inf.platform}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  @{inf.name}
                                </span>
                                {inf.concept_name && (
                                  <span style={{
                                    fontSize: 9, fontWeight: 500, color: '#7c3aed',
                                    background: 'rgba(139,92,246,0.08)', padding: '1px 6px', borderRadius: 999,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120, flexShrink: 0,
                                  }}>
                                    {inf.concept_name}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <span style={{ fontSize: 10, color: '#64748b' }}>{formatNum(inf.views)} views</span>
                                {inf.engagement_rate != null && (
                                  <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1' }}>{inf.engagement_rate}%</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {cell.insight && (
                      <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{cell.insight}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 부진 조합 */}
            {ranked.length > 3 && (() => {
              const worstCells = ranked.slice(-2).reverse();
              return (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <AlertTriangle style={{ width: 13, height: 13, color: '#ef4444' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>개선 필요 조합</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {worstCells.map(cell => {
                      const pName = personas.find(pp => pp.code === cell.persona_code)?.name || cell.persona_code;
                      const dName = desires.find(dd => dd.code === cell.desire_code)?.name || cell.desire_code;
                      return (
                        <div key={`w-${cell.persona_code}-${cell.desire_code}`} style={{
                          borderRadius: 8, border: '1px solid #fecaca', background: 'rgba(239,68,68,0.04)',
                          padding: '8px 12px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                              {cell.persona_code}({pName}) × {cell.desire_code}({dName})
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>
                              {isEngTab
                                ? `ENG ${cell.avg_engagement?.toFixed(1)}% · VIEW ${formatNum(cell.avg_views)}`
                                : `CTR ${(cell.avg_ctr * 100)?.toFixed(1)}% · ROAS ${cell.avg_roas?.toFixed(1)}x`
                              }
                            </span>
                          </div>
                          {cell.insight && (
                            <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{cell.insight}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
