import { useState, useMemo } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useCampaignInfluencers, useMatchInfluencers, useBulkUpdateInfluencers } from '@/hooks/useInfluencers';
import { useCreatives } from '@/hooks/useCreatives';
import { usePDA } from '@/hooks/usePDA';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import AIRecommendedPlans from '@/components/influencer/AIRecommendedPlans.jsx';
import InfluencerMatchCard from '@/components/influencer/InfluencerMatchCard.jsx';
import BulkActionBar from '@/components/bulk/BulkActionBar.jsx';
import ExportMenu from '@/components/export/ExportMenu.jsx';
import { exportInfluencersToExcel } from '@/lib/exportCSV';
import { exportSectionToPDF } from '@/lib/exportPDF';
import { Button } from '@/components/ui/button.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog.jsx';
import {
  Sparkles, Loader2, Users, ThumbsUp, ThumbsDown, RefreshCw, Filter,
  UserCheck, MessageCircle, Star, User, ChevronDown, ChevronUp,
  CheckCircle2, Film, Image as ImageIcon, X, Eye, Music, Heart,
  Target, Zap, Wrench, Lightbulb, Play, AlertTriangle,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const STATUS_OPTIONS = [
  { value: 'all', label: '전체 상태' },
  { value: 'suggested', label: '추천' },
  { value: 'selected', label: '선택됨' },
  { value: 'contacted', label: '컨택됨' },
  { value: 'confirmed', label: '확정됨' },
  { value: 'declined', label: '거절됨' },
];

const STAT_CARDS = [
  { key: 'suggested', label: '추천', icon: Star, color: '#6366f1', bg: '#eef2ff' },
  { key: 'selected', label: '선택됨', icon: UserCheck, color: '#10b981', bg: '#ecfdf5' },
  { key: 'contacted', label: '컨택됨', icon: MessageCircle, color: '#f59e0b', bg: '#fffbeb' },
  { key: 'confirmed', label: '확정됨', icon: ThumbsUp, color: '#0d9488', bg: '#f0fdfa' },
];

const PERSONA_COLORS = [
  { color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
  { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', gradient: 'linear-gradient(135deg, #059669, #34d399)' },
  { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)' },
];

/* ── deep analysis에서 P코드 추출 ── */
function extractPersonaCodes(analysis) {
  if (!analysis) return [];
  const overview = analysis.overview || analysis;
  const ta = overview?.['타겟_오디언스'];
  if (!ta) return [];
  const desc = ta['설명'] || [];
  const arr = Array.isArray(desc) ? desc : [desc];
  const codes = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const m = item.match(/P\d+/g);
    if (m) codes.push(...m);
  }
  return [...new Set(codes)];
}

/* ── 인플루언서 → 페르소나 매칭 ── */
function matchInfluencerToPersona(influencer, personas) {
  if (!personas || personas.length === 0) return null;

  // 1) match_reason에 저장된 persona_primary 우선 사용
  const matchReason = typeof influencer.match_reason === 'string'
    ? (() => { try { return JSON.parse(influencer.match_reason); } catch { return {}; } })()
    : influencer.match_reason || {};

  if (matchReason.persona_primary) {
    const found = personas.find((p) => p.code === matchReason.persona_primary);
    if (found) return found.code;
  }

  // 2) match_reason.persona_codes 배열에서 캠페인 페르소나와 매칭
  if (Array.isArray(matchReason.persona_codes) && matchReason.persona_codes.length > 0) {
    for (const pc of matchReason.persona_codes) {
      const found = personas.find((p) => p.code === pc);
      if (found) return found.code;
    }
  }

  // 3) deep_analysis에서 P코드 추출
  const deepAnalysis = typeof influencer.deep_analysis === 'string'
    ? (() => { try { return JSON.parse(influencer.deep_analysis); } catch { return null; } })()
    : influencer.deep_analysis;

  const pCodes = extractPersonaCodes(deepAnalysis);
  if (pCodes.length > 0) {
    for (const pc of pCodes) {
      const found = personas.find((p) => p.code === pc);
      if (found) return found.code;
    }
  }

  // 4) 텍스트 기반 폴백 매칭
  const scores = {};
  personas.forEach((p) => { scores[p.code] = 0; });

  const matchText = [
    matchReason.ko || '',
    influencer.quick_summary || '',
    ...(influencer.matched_concepts || []).map((c) => typeof c === 'string' ? c : (c.match_reason || '')),
  ].join(' ').toLowerCase();

  personas.forEach((p) => {
    const profile = p.profile_json || {};
    const keywords = [
      ...(Array.isArray(profile.pain_points) ? profile.pain_points : (profile.pain_points || '').split(/[,，\s]+/)),
      ...(Array.isArray(profile.keyword) ? profile.keyword : (profile.keyword || '').replace(/#/g, '').split(/\s+/)),
      ...(Array.isArray(profile.behavior) ? profile.behavior : (profile.behavior || '').split(/[,，\s]+/)),
      p.name,
    ].filter(Boolean).map((k) => k.toLowerCase().trim()).filter((k) => k.length > 1);

    keywords.forEach((kw) => {
      if (matchText.includes(kw)) scores[p.code] += 2;
    });

    const media = (profile.media || '').toLowerCase();
    const platform = (influencer.platform || '').toLowerCase();
    if (media.includes(platform)) scores[p.code] += 3;
  });

  let best = personas[0]?.code;
  let bestScore = -1;
  Object.entries(scores).forEach(([code, s]) => {
    if (s > bestScore) { bestScore = s; best = code; }
  });

  return best;
}

function formatFollowers(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const FUNNEL_CFG = {
  TOFU: { label: 'TOFU', color: '#0284c7', bg: '#e0f2fe' },
  MOFU: { label: 'MOFU', color: '#7c3aed', bg: '#ede9fe' },
  BOFU: { label: 'BOFU', color: '#059669', bg: '#d1fae5' },
};

export default function InfluencerMatch() {
  const { id: campaignId } = useParams();
  const { data: influencers, isLoading } = useCampaignInfluencers(campaignId);
  const { data: pdaData } = usePDA(campaignId);
  const { data: creatives } = useCreatives(campaignId);
  const matchInfluencers = useMatchInfluencers();
  const bulkUpdate = useBulkUpdateInfluencers();

  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreRange, setScoreRange] = useState([0]);
  const [activePersona, setActivePersona] = useState(null); // null = 전체
  const [expandedPersonas, setExpandedPersonas] = useState({});
  const [previewCreative, setPreviewCreative] = useState(null); // 최종 가이드 팝업용

  const { campaign } = useOutletContext();

  const items = useMemo(() => {
    const raw = Array.isArray(influencers) ? influencers : [];
    return raw.map((inf) => ({
      ...inf,
      name: inf.name || inf.username || inf.profile_nm || inf.profile_id || '이름 없음',
      followers: Number(inf.followers || inf.follower_count || inf.follow_count || 0),
      profile_image: inf.profile_image || inf.profile_img || null,
      platform: (inf.platform || 'instagram').toLowerCase(),
      match_score: Number(inf.match_score || 0),
      quick_summary: inf.quick_summary || '',
      deep_analysis: typeof inf.deep_analysis === 'string'
        ? (() => { try { return JSON.parse(inf.deep_analysis); } catch { return null; } })()
        : inf.deep_analysis || null,
    }));
  }, [influencers]);
  const personas = pdaData?.personas || [];

  // 콘텐츠 제작 완료된 컨셉 (approved)
  const approvedCreatives = useMemo(() => {
    const list = Array.isArray(creatives) ? creatives : [];
    return list.filter((c) => c.status === 'approved');
  }, [creatives]);

  // 페르소나별 인플루언서 그룹핑 (팔로워 순 정렬)
  const personaGroups = useMemo(() => {
    if (personas.length === 0) return {};
    const groups = {};
    personas.forEach((p) => { groups[p.code] = []; });

    items.forEach((inf) => {
      const matched = matchInfluencerToPersona(inf, personas);
      if (groups[matched]) groups[matched].push(inf);
    });

    // 팔로워 순 정렬
    Object.keys(groups).forEach((code) => {
      groups[code].sort((a, b) => (b.followers || 0) - (a.followers || 0));
    });

    return groups;
  }, [items, personas]);

  // 필터링된 리스트
  const filtered = useMemo(() => {
    let pool = activePersona ? (personaGroups[activePersona] || []) : items;
    // 전체일 때도 팔로워 순
    if (!activePersona) pool = [...pool].sort((a, b) => (b.followers || 0) - (a.followers || 0));
    return pool.filter((inf) => {
      if (statusFilter !== 'all' && inf.status !== statusFilter) return false;
      if ((inf.match_score || 0) < scoreRange[0]) return false;
      return true;
    });
  }, [items, personaGroups, activePersona, statusFilter, scoreRange]);

  const { selectedIds, isSelected, toggle, toggleAll, clearSelection, isAllSelected, selectedCount } =
    useBulkSelection(filtered, 'profile_id');

  const statusCounts = useMemo(() => {
    const counts = {};
    items.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return counts;
  }, [items]);

  const handleMatch = () => { matchInfluencers.mutate(campaignId); };
  const handleBulkApprove = () => {
    bulkUpdate.mutate({ campaignId, ids: [...selectedIds], action: 'approve' }, { onSuccess: clearSelection });
  };
  const handleBulkReject = () => {
    bulkUpdate.mutate({ campaignId, ids: [...selectedIds], action: 'reject' }, { onSuccess: clearSelection });
  };
  const handleBulkStatusChange = (status) => {
    bulkUpdate.mutate({ campaignId, ids: [...selectedIds], action: 'update_status', data: { status } }, { onSuccess: clearSelection });
  };

  const togglePersonaExpand = (code) => {
    setExpandedPersonas((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${tokens.color.border}`, borderBottomColor: tokens.color.primary }} />
      </div>
    );
  }

  return (
    <div id="influencer-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 22px',
          background: 'linear-gradient(135deg, #eef2ff 0%, #ecfdf5 50%, #fffbeb 100%)',
          borderBottom: `1px solid ${tokens.color.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>인플루언서 선정</h2>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: '#e0e7ff', color: '#4338ca',
              }}>
                총 {items.length}명
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              기획안별 페르소나 기반 AI 매칭으로 최적의 인플루언서를 추천합니다
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button onClick={handleMatch} disabled={matchInfluencers.isPending}
              style={{ borderRadius: 8, fontSize: 12, fontWeight: 600, height: 34 }}>
              {matchInfluencers.isPending
                ? <Loader2 className="size-4 animate-spin" />
                : <Sparkles className="size-4" />}
              <span>AI 매칭</span>
            </Button>
            <ExportMenu
              onExportPDF={() => exportSectionToPDF('influencer-content', `인플루언서-${campaignId}`)}
              onExportCSV={() => exportInfluencersToExcel(filtered, campaignId)}
            />
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {STAT_CARDS.map((stat, idx) => {
            const count = statusCounts[stat.key] || 0;
            const Icon = stat.icon;
            return (
              <button key={stat.key} onClick={() => setStatusFilter(statusFilter === stat.key ? 'all' : stat.key)}
                style={{
                  padding: '14px 18px', cursor: 'pointer', border: 'none',
                  background: statusFilter === stat.key ? stat.bg : 'transparent',
                  borderRight: idx < 3 ? `1px solid ${tokens.color.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background .15s',
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: stat.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon style={{ width: 16, height: 16, color: stat.color }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', margin: 0 }}>{stat.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: count > 0 ? stat.color : '#cbd5e1', margin: 0, lineHeight: 1.1 }}>{count}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 콘텐츠 제작 완료 컨셉 블록 ── */}
      {approvedCreatives.length > 0 && (
        <div style={{
          borderRadius: 14, border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, boxShadow: tokens.shadow.card,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 22px',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#fff' }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#065f46', margin: 0 }}>
              콘텐츠 제작 완료 컨셉
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: '#d1fae5', color: '#059669',
            }}>
              {approvedCreatives.length}건
            </span>
          </div>
          <div style={{
            padding: '16px 22px',
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(approvedCreatives.length, 4)}, 1fr)`,
            gap: 10,
          }}>
            {approvedCreatives.map((cr) => {
              const funnelCfg = FUNNEL_CFG[cr.funnel] || FUNNEL_CFG.TOFU;
              const guide = cr.production_guide || {};
              const hasImages = !!guide.saved_images;
              const hasVideo = !!guide.video_generated;
              const channel = cr.campaign_placement || campaign?.placement || 'Instagram';
              const CHANNEL_ICON = { Instagram: '📸', TikTok: '🎵', YouTube: '▶️' };
              return (
                <div
                  key={cr.creative_id || cr.id}
                  onClick={() => setPreviewCreative(cr)}
                  style={{
                    borderRadius: 10, border: `1px solid #d1fae5`,
                    background: '#f0fdf4', padding: '12px 14px',
                    cursor: 'pointer', transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,150,105,.15)'; e.currentTarget.style.borderColor = '#059669'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#d1fae5'; }}
                >
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {cr.persona_code && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: '#7c3aed', color: '#fff' }}>
                        {cr.persona_code}
                      </span>
                    )}
                    {cr.desire_code && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: '#d97706', color: '#fff' }}>
                        {cr.desire_code}
                      </span>
                    )}
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: funnelCfg.bg, color: funnelCfg.color }}>
                      {funnelCfg.label}
                    </span>
                    {cr.format && (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: '#f1f5f9', color: '#475569' }}>
                        {cr.format}
                      </span>
                    )}
                  </div>
                  {/* Concept name */}
                  <p style={{
                    fontSize: 12, fontWeight: 700, color: '#065f46', margin: 0,
                    lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {cr.concept_name || '컨셉명 없음'}
                  </p>
                  {/* Channel + Media indicators */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                      background: '#e0e7ff', color: '#4338ca',
                    }}>
                      {CHANNEL_ICON[channel] || '🌐'} {channel}
                    </span>
                    {hasImages && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#059669' }}>
                        <ImageIcon style={{ width: 11, height: 11 }} /> 이미지
                      </span>
                    )}
                    {hasVideo && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#059669' }}>
                        <Film style={{ width: 11, height: 11 }} /> 영상
                      </span>
                    )}
                    <span style={{
                      marginLeft: 'auto', fontSize: 9, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 999,
                      background: '#059669', color: '#fff',
                    }}>
                      완료
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 페르소나 카드 3개 ── */}
      {personas.length > 0 && (
        <div style={{
          borderRadius: 14, border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, boxShadow: tokens.shadow.card,
          padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User style={{ width: 16, height: 16, color: '#6366f1' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>캠페인 페르소나별 인플루언서 추천</h3>
            </div>
            {activePersona && (
              <button
                onClick={() => setActivePersona(null)}
                style={{
                  fontSize: 11, fontWeight: 600, color: '#6366f1', padding: '4px 12px', borderRadius: 999,
                  border: '1px solid #c7d2fe', background: '#eef2ff', cursor: 'pointer',
                }}
              >
                전체 보기
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {personas.map((persona, idx) => {
              const pColor = PERSONA_COLORS[idx % PERSONA_COLORS.length];
              const group = personaGroups[persona.code] || [];
              const isActive = activePersona === persona.code;
              const profile = persona.profile_json || {};

              return (
                <button
                  key={persona.code}
                  onClick={() => setActivePersona(isActive ? null : persona.code)}
                  style={{
                    borderRadius: 12, overflow: 'hidden',
                    border: isActive ? `2px solid ${pColor.color}` : `1px solid ${pColor.border}`,
                    background: isActive ? pColor.bg : tokens.color.surface,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all .2s',
                    boxShadow: isActive ? `0 4px 16px ${pColor.color}20` : 'none',
                  }}
                >
                  {/* Top accent */}
                  <div style={{ height: 4, background: pColor.gradient }} />
                  <div style={{ padding: '14px 16px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                        background: pColor.color, color: '#fff',
                      }}>
                        {persona.code}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pColor.color }}>{persona.name}</span>
                    </div>
                    {/* Profile summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                      {profile.age && (
                        <span style={{ fontSize: 10, color: '#64748b' }}>
                          <strong style={{ color: '#475569' }}>연령:</strong> {profile.age} · {profile.job}
                        </span>
                      )}
                      {profile.media && (
                        <span style={{ fontSize: 10, color: '#64748b' }}>
                          <strong style={{ color: '#475569' }}>주요 채널:</strong> {profile.media}
                        </span>
                      )}
                      {profile.pain_points && (
                        <span style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          <strong style={{ color: '#475569' }}>니즈:</strong> {profile.pain_points}
                        </span>
                      )}
                    </div>
                    {/* Influencer count */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: 8,
                      background: pColor.bg,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: pColor.color }}>
                        추천 인플루언서
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: pColor.color }}>{group.length}명</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AI 추천 기획안 ── */}
      <AIRecommendedPlans planDocId={campaign?.plan_doc_id} />

      {/* ── Filters ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        padding: '12px 18px', borderRadius: 12,
        border: `1px solid ${tokens.color.border}`, background: tokens.color.surface,
      }}>
        <Filter style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: tokens.color.textSubtle }}>상태</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger style={{
              width: 130, height: 32, borderRadius: 8,
              border: `1px solid ${tokens.color.border}`, background: tokens.color.surface,
              fontSize: 12,
            }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div style={{ width: 1, height: 32, background: tokens.color.border }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 180 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: tokens.color.textSubtle }}>
            최소 매칭 점수: <span style={{ color: '#6366f1', fontWeight: 800 }}>{scoreRange[0]}</span>
          </label>
          <Slider value={scoreRange} onValueChange={setScoreRange} min={0} max={100} step={5} className="w-full" />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>결과</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: tokens.color.text }}>{filtered.length}명</span>
        </div>
      </div>

      {/* ── 페르소나별 그룹 뷰 (activePersona가 없을 때) ── */}
      {!activePersona && personas.length > 0 && items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {personas.map((persona, idx) => {
            const pColor = PERSONA_COLORS[idx % PERSONA_COLORS.length];
            const group = (personaGroups[persona.code] || [])
              .filter((inf) => {
                if (statusFilter !== 'all' && inf.status !== statusFilter) return false;
                if ((inf.match_score || 0) < scoreRange[0]) return false;
                return true;
              });
            const isExpanded = expandedPersonas[persona.code] !== false; // 기본 열림
            const profile = persona.profile_json || {};

            return (
              <div key={persona.code} style={{
                borderRadius: 14, border: `1px solid ${pColor.border}`,
                background: tokens.color.surface, overflow: 'hidden',
                boxShadow: tokens.shadow.card,
              }}>
                {/* Group Header */}
                <button
                  onClick={() => togglePersonaExpand(persona.code)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', cursor: 'pointer',
                    background: pColor.bg, border: 'none', borderBottom: isExpanded ? `1px solid ${pColor.border}` : 'none',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: pColor.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 800,
                    }}>
                      {persona.code}
                    </span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: pColor.color }}>{persona.name}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{profile.age} · {profile.job}</span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                      background: pColor.color, color: '#fff', marginLeft: 4,
                    }}>
                      {group.length}명
                    </span>
                  </div>
                  {isExpanded
                    ? <ChevronUp style={{ width: 16, height: 16, color: pColor.color }} />
                    : <ChevronDown style={{ width: 16, height: 16, color: pColor.color }} />
                  }
                </button>

                {/* Influencer List — grouped by channel */}
                {isExpanded && (
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {group.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                        필터 조건에 맞는 인플루언서가 없습니다
                      </p>
                    ) : (
                      (() => {
                        // 채널별 그룹핑
                        const channelGroups = {};
                        group.forEach((inf) => {
                          const ch = (inf.platform || 'Other').charAt(0).toUpperCase() + (inf.platform || 'other').slice(1).toLowerCase();
                          if (!channelGroups[ch]) channelGroups[ch] = [];
                          channelGroups[ch].push(inf);
                        });
                        const CHANNEL_COLORS = {
                          Tiktok: { color: '#000', bg: '#f0f0f0', icon: '🎵' },
                          Instagram: { color: '#e1306c', bg: '#fce7f3', icon: '📸' },
                          Youtube: { color: '#ff0000', bg: '#fef2f2', icon: '▶️' },
                          Other: { color: '#6b7280', bg: '#f3f4f6', icon: '🌐' },
                        };
                        return Object.entries(channelGroups).map(([channel, channelInfs]) => {
                          const chCfg = CHANNEL_COLORS[channel] || CHANNEL_COLORS.Other;
                          return (
                            <div key={channel}>
                              {/* Channel sub-header */}
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                marginBottom: 8, padding: '6px 10px',
                                borderRadius: 8, background: chCfg.bg,
                              }}>
                                <span style={{ fontSize: 13 }}>{chCfg.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: chCfg.color }}>{channel}</span>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                                  background: chCfg.color, color: '#fff', marginLeft: 4,
                                }}>
                                  {channelInfs.length}명
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
                                {channelInfs.map((influencer) => {
                                  const infId = influencer.profile_id || influencer.id;
                                  return (
                                    <InfluencerMatchCard
                                      key={infId}
                                      influencer={influencer}
                                      campaignId={campaignId}
                                      isSelected={isSelected(infId)}
                                      onToggleSelect={() => toggle(infId)}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── 단일 페르소나 필터 또는 페르소나 없을 때 ── */
        <>
          {filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
              <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} aria-label="전체 선택" />
              <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>전체 선택</span>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '64px 0', color: tokens.color.textSubtle,
              borderRadius: 14, border: `2px dashed ${tokens.color.border}`,
            }}>
              <Users style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>매칭된 인플루언서가 없습니다</p>
              <p style={{ fontSize: 13, marginTop: 4, color: '#94a3b8' }}>
                AI 매칭을 실행하여 최적의 인플루언서를 찾아보세요
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((influencer) => {
                const infId = influencer.profile_id || influencer.id;
                return (
                  <InfluencerMatchCard
                    key={infId}
                    influencer={influencer}
                    campaignId={campaignId}
                    isSelected={isSelected(infId)}
                    onToggleSelect={() => toggle(infId)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        actions={[
          { label: '일괄 승인', icon: <ThumbsUp className="size-3.5" />, onClick: handleBulkApprove, disabled: bulkUpdate.isPending },
          { label: '일괄 거절', icon: <ThumbsDown className="size-3.5" />, onClick: handleBulkReject, variant: 'destructive', disabled: bulkUpdate.isPending },
          { label: '컨택됨으로 변경', icon: <RefreshCw className="size-3.5" />, onClick: () => handleBulkStatusChange('contacted'), variant: 'outline', disabled: bulkUpdate.isPending },
        ]}
      />

      {/* ── 최종 가이드 미리보기 팝업 ── */}
      <GuidePreviewDialog
        creative={previewCreative}
        open={!!previewCreative}
        onClose={() => setPreviewCreative(null)}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════
   최종 가이드 미리보기 Dialog
   ══════════════════════════════════════════════ */
const ACCENT = '#7c3aed';

function GuideSection({ title, icon: Icon, color = ACCENT, collapsible = false, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={collapsible ? () => setOpen(!open) : undefined}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, marginBottom: open ? 10 : 0,
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: collapsible ? 'none' : 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: `linear-gradient(135deg, ${color}, ${color}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: 12, height: 12, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{title}</span>
        </div>
        {collapsible && (
          open
            ? <ChevronUp style={{ width: 14, height: 14, color: '#94a3b8' }} />
            : <ChevronDown style={{ width: 14, height: 14, color: '#94a3b8' }} />
        )}
      </div>
      {open && children}
    </div>
  );
}

function GuideInfoBlock({ label, value, bg = '#f8fafc', borderColor, labelColor = '#475569' }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: labelColor, display: 'block', marginBottom: 4 }}>{label}</span>
      <div style={{
        padding: '8px 12px', borderRadius: 8,
        background: bg, border: `1px solid ${borderColor || tokens.color.border}`,
        fontSize: 11, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line',
      }}>
        {Array.isArray(value) ? value.map((v, i) => <div key={i}>{v}</div>) : value}
      </div>
    </div>
  );
}

function GuidePreviewDialog({ creative, open, onClose }) {
  if (!creative) return null;

  const guide = creative.production_guide || {};
  const guideIndex = guide.guideIndex || {};
  const copywriting = guide.copywriting || {};
  const scenarioRows = guide.scenarioRows || [];
  const savedImages = guide.saved_images || {};
  const channel = creative.campaign_placement || 'Instagram';
  const funnelCfg = FUNNEL_CFG[creative.funnel] || FUNNEL_CFG.TOFU;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-3xl" style={{ maxHeight: '85vh', overflow: 'auto', padding: 0 }}>
        {/* ── Purple Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          padding: '20px 24px', borderRadius: '8px 8px 0 0',
        }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>
              {creative.concept_name || '최종 가이드'}
            </DialogTitle>
            <DialogDescription style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>
              콘텐츠 제작 완료 가이드
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>플랫폼</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{channel}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginLeft: 8 }}>퍼널</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{funnelCfg.label}</span>
            {creative.persona_code && (<>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginLeft: 8 }}>페르소나</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{creative.persona_code}</span>
            </>)}
            {creative.desire_code && (<>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginLeft: 8 }}>욕구</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{creative.desire_code}</span>
            </>)}
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* 1. 가이드 개요 */}
          <GuideSection title="가이드 개요" icon={Target} color="#7c3aed">
            <GuideInfoBlock label="타겟 (Target)" value={guideIndex.target} bg="#f5f3ff" borderColor="#ddd6fe" labelColor="#7c3aed" />
            <GuideInfoBlock label="컨셉 (Concept)" value={guideIndex.concept || creative.concept_name} bg="#f5f3ff" borderColor="#ddd6fe" labelColor="#7c3aed" />
            <GuideInfoBlock label="멘션 가이드" value={[guideIndex.mentionGuide, guideIndex.requiredHashtags].filter(Boolean).join('\n') || null} bg="#eff6ff" borderColor="#bfdbfe" labelColor="#2563eb" />
          </GuideSection>

          {/* 2. 후킹 핵심 전략 */}
          <GuideSection title="후킹 핵심 전략 설계" icon={Zap} color="#f59e0b">
            <GuideInfoBlock label="Hooking Logic" value={guide.hookingLogic} bg="#fffbeb" borderColor="#fde68a" labelColor="#d97706" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <GuideInfoBlock
                label="Trigger Points"
                value={Array.isArray(guide.triggerPoints) ? guide.triggerPoints : null}
                bg="#fffbeb" borderColor="#fde68a" labelColor="#d97706"
              />
              <GuideInfoBlock label="Focus" value={guide.focusText} bg="#fffbeb" borderColor="#fde68a" labelColor="#d97706" />
            </div>
          </GuideSection>

          {/* 3. 콘텐츠 가이드 */}
          <GuideSection title="콘텐츠 가이드" icon={Sparkles} color="#6366f1">
            {guide.visualDirecting && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', margin: '0 0 6px' }}>비주얼 디렉팅</p>
                <GuideInfoBlock label="Lighting" value={guide.visualDirecting.lighting} />
                <GuideInfoBlock label="Mise-en-scene" value={guide.visualDirecting.miseEnScene} />
              </>
            )}
            {(copywriting.onScreen || copywriting.captionGuide) && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', margin: '8px 0 6px' }}>카피라이팅 & 캡션</p>
                <GuideInfoBlock label="On-Screen Copy" value={copywriting.onScreen} />
                <GuideInfoBlock label="캡션 가이드" value={copywriting.captionGuide} />
              </>
            )}
            <GuideInfoBlock
              label="업로드 전략"
              value={typeof guide.uploadStrategy === 'object' ? guide.uploadStrategy?.format : guide.uploadStrategy}
              bg="#eff6ff" borderColor="#bfdbfe" labelColor="#2563eb"
            />
          </GuideSection>

          {/* 4. 시나리오 테이블 */}
          {scenarioRows.length > 0 && (
            <GuideSection title="시나리오 테이블" icon={Film} color="#2563eb">
              {guide.scenarioTitle && (
                <div style={{
                  padding: '8px 14px', borderRadius: 8, marginBottom: 12,
                  background: '#1e1b4b', color: '#fff',
                  fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Film style={{ width: 12, height: 12, color: '#a78bfa' }} />
                  {guide.scenarioTitle}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {scenarioRows.map((row, idx) => {
                  const stepImgs = savedImages[idx + 1] || [];
                  return (
                    <div key={idx} style={{
                      borderRadius: 10, border: `1px solid ${tokens.color.border}`,
                      overflow: 'hidden', background: '#fff',
                    }}>
                      {/* Step header */}
                      <div style={{
                        padding: '8px 14px', background: '#f5f3ff',
                        borderBottom: `1px solid ${tokens.color.border}`,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: ACCENT, padding: '1px 8px', borderRadius: 4 }}>
                          {row.section}
                        </span>
                        <span style={{ fontSize: 10, color: '#64748b' }}>{row.time}</span>
                      </div>
                      {/* 3-column */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: stepImgs.length > 0 ? `1px solid ${tokens.color.border}` : 'none' }}>
                        <div style={{ padding: '8px 10px', borderRight: `1px solid ${tokens.color.border}` }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                            <Eye style={{ width: 10, height: 10 }} /> Visual
                          </span>
                          <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>{row.visual}</p>
                        </div>
                        <div style={{ padding: '8px 10px', borderRight: `1px solid ${tokens.color.border}` }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                            <Music style={{ width: 10, height: 10 }} /> Audio
                          </span>
                          <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>{row.audio}</p>
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                            <Heart style={{ width: 10, height: 10 }} /> Emotion
                          </span>
                          <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>{row.emotion}</p>
                        </div>
                      </div>
                      {/* AI Images */}
                      {stepImgs.length > 0 && (
                        <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {stepImgs.slice(0, 3).map((img, i) => (
                            <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${tokens.color.border}`, aspectRatio: '3/4', background: '#f8fafc' }}>
                              {img ? (
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                  <ImageIcon style={{ width: 20, height: 20, color: '#cbd5e1' }} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </GuideSection>
          )}

          {/* 5. 테크니컬 가이드 */}
          {guide.techGuide && (
            <GuideSection title="테크니컬 슈팅 & 에디팅 가이드" icon={Wrench} color="#475569">
              <GuideInfoBlock label="Pre-Production" value={guide.techGuide.preProduction} />
              <GuideInfoBlock label="Cut Editing" value={guide.techGuide.cutEditing} />
            </GuideSection>
          )}

          {/* 6. 유의사항 & Director's Tip */}
          {(guide.cautions || guide.directorTip) && (
            <GuideSection title="유의사항 & Director's Tip" icon={Lightbulb} color="#16a34a">
              {guide.cautions && guide.cautions.map((c, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                  background: '#fff7ed', border: '1px solid #fed7aa',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', margin: '0 0 2px' }}>{i + 1}. {c.title}</p>
                  <p style={{ fontSize: 10, color: '#9a3412', margin: 0, lineHeight: 1.4 }}>{c.desc}</p>
                </div>
              ))}
              {guide.directorTip && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Lightbulb style={{ width: 12, height: 12, color: '#16a34a' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>Director&apos;s Tip</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#166534', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{guide.directorTip}</p>
                </div>
              )}
            </GuideSection>
          )}

          {/* 7. AI 영상 가이드 */}
          <GuideSection title="AI 영상 가이드" icon={Film} color="#0284c7" collapsible defaultOpen={false}>
            <div style={{
              borderRadius: 10, overflow: 'hidden', background: '#000',
              aspectRatio: '16/9', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {savedImages[1]?.[0] && (
                <img src={savedImages[1][0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
              )}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play style={{ width: 22, height: 22, color: '#1e293b', marginLeft: 2 }} />
              </div>
            </div>
            {!guide.video_generated && (
              <div style={{
                marginTop: 8, padding: '8px 12px', borderRadius: 8,
                background: '#fffbeb', border: '1px solid #fde68a',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <AlertTriangle style={{ width: 12, height: 12, color: '#d97706' }} />
                <span style={{ fontSize: 11, color: '#92400e' }}>영상 생성이 완료되지 않았습니다.</span>
              </div>
            )}
          </GuideSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}
