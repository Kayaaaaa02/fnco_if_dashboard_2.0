import { useState, useMemo } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { useLaunchSchedule, useCreateSchedule, useApproveLaunch, useExecuteLaunch } from '@/hooks/useLaunch';
import { useCreatives } from '@/hooks/useCreatives.js';
import { useCampaignInfluencers } from '@/hooks/useInfluencers.js';
import ApprovalFlow from '@/components/launch/ApprovalFlow.jsx';
import FinalReviewSection from '@/components/launch/FinalReviewSection.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import {
  Loader2, CalendarPlus, CheckCircle2, Rocket, Clock, CheckCheck,
  AlertTriangle, ArrowRight, Zap, Upload, Megaphone, ExternalLink,
  ChevronDown, ChevronUp, Eye, RefreshCw, User, Play,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

/* ── Pipeline stage config ── */
const STAGE_CONFIG = [
  {
    key: 'schedule',
    label: '업로드 스케줄 생성',
    description: '인플루언서별 콘텐츠 업로드 일정을 자동 생성',
    icon: CalendarPlus,
    buttonLabel: '업데이트',
    color: '#6366f1',
    softBg: '#eef2ff',
  },
  {
    key: 'confirm',
    label: '업로드 확인',
    description: '인플루언서 콘텐츠 업로드 여부 확인',
    icon: CheckCircle2,
    buttonLabel: '업데이트',
    color: '#f59e0b',
    softBg: '#fffbeb',
  },
  {
    key: 'ad',
    label: '광고 집행',
    description: 'META 광고 연동 및 집행 관리',
    icon: Megaphone,
    buttonLabel: 'META 연동',
    color: '#10b981',
    softBg: '#ecfdf5',
  },
];

const PLATFORM_COLORS = {
  TikTok: { icon: '🎵', color: '#000', bg: '#f0f0f0', border: '#d4d4d4' },
  tiktok: { icon: '🎵', color: '#000', bg: '#f0f0f0', border: '#d4d4d4' },
  Instagram: { icon: '📸', color: '#e1306c', bg: '#fce7f3', border: '#f9a8d4' },
  instagram: { icon: '📸', color: '#e1306c', bg: '#fce7f3', border: '#f9a8d4' },
  instagram_reels: { icon: '📸', color: '#e1306c', bg: '#fce7f3', border: '#f9a8d4' },
  YouTube: { icon: '▶️', color: '#ff0000', bg: '#fef2f2', border: '#fecaca' },
  youtube: { icon: '▶️', color: '#ff0000', bg: '#fef2f2', border: '#fecaca' },
  youtube_shorts: { icon: '▶️', color: '#ff0000', bg: '#fef2f2', border: '#fecaca' },
};

// placement → display label
const PLACEMENT_LABELS = {
  tiktok: 'TikTok',
  instagram_reels: 'Instagram Reels',
  instagram: 'Instagram',
  youtube: 'YouTube',
  youtube_shorts: 'YouTube Shorts',
};

// format → display label
const FORMAT_LABELS = {
  short_video: '숏폼 영상',
  long_video: '롱폼 영상',
  carousel: '카루셀',
  infographic: '인포그래픽',
  image: '이미지',
};

function getStageStatus(items, stage) {
  if (!items || items.length === 0) return 'empty';
  if (stage === 'schedule') return 'done';
  if (stage === 'confirm') {
    const allConfirmed = items.every((i) => i.status === 'approved' || i.status === 'published' || i.status === 'failed');
    return allConfirmed ? 'done' : 'pending';
  }
  if (stage === 'ad') {
    const anyPublished = items.some((i) => i.status === 'published' || i.status === 'failed');
    return anyPublished ? 'done' : 'pending';
  }
  return 'pending';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${m}/${day}(${dow})`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Launch() {
  const { id: campaignId } = useParams();
  const { campaign } = useOutletContext();
  const navigate = useNavigate();
  const { data: launchData, isLoading } = useLaunchSchedule(campaignId);
  const { data: creativesData, isLoading: creativesLoading } = useCreatives(campaignId);
  const { data: influencersData } = useCampaignInfluencers(campaignId);
  const createSchedule = useCreateSchedule();
  const approveLaunch = useApproveLaunch();
  const executeLaunch = useExecuteLaunch();

  const [approvalOpen, setApprovalOpen] = useState(false);
  const [activeStage, setActiveStage] = useState('schedule'); // which detail view
  const [uploadChecks, setUploadChecks] = useState({}); // { schedule_id: true }
  const [metaConnected, setMetaConnected] = useState(false);
  const [scheduleUpdatedAt, setScheduleUpdatedAt] = useState(null); // 업데이트 클릭 시점

  // API 응답: { success, data } → api client가 data를 자동 추출 → 배열 직접 반환
  const launchItems = Array.isArray(launchData) ? launchData : Array.isArray(launchData?.items) ? launchData.items : [];

  // 크리에이티브 데이터 → 스케줄 형태로 변환 (launch 데이터가 없을 때 사용)
  const creatives = useMemo(() => {
    const raw = Array.isArray(creativesData) ? creativesData : Array.isArray(creativesData?.data) ? creativesData.data : [];
    // draft 제외한 크리에이티브만
    return raw.filter((c) => c.status !== 'draft');
  }, [creativesData]);

  // 인플루언서 목록
  const influencers = useMemo(() => {
    const raw = Array.isArray(influencersData) ? influencersData : Array.isArray(influencersData?.data) ? influencersData.data : [];
    return raw;
  }, [influencersData]);

  const creativeScheduleItems = useMemo(() => {
    if (launchItems.length > 0) return []; // launch 데이터가 있으면 사용 안 함
    const now = Date.now();

    // 컨셉별 매칭된 인플루언서 맵 구축
    const conceptInfluencerMap = {};
    influencers.forEach((inf) => {
      const concepts = inf.matched_concepts || [];
      const cIds = Array.isArray(concepts) ? concepts : [];
      cIds.forEach((cId) => {
        if (!conceptInfluencerMap[cId]) conceptInfluencerMap[cId] = [];
        conceptInfluencerMap[cId].push(inf);
      });
    });

    // 매칭 안 된 인플루언서도 순환 배정
    const allInfluencers = influencers.length > 0 ? influencers : [];

    return creatives.map((cr, idx) => {
      // 임의 업로드 예정 일자: 현재 기준 1~14일 후 랜덤
      const randomDaysLater = Math.floor(Math.random() * 14) + 1;
      const randomHour = 9 + Math.floor(Math.random() * 10);
      const randomMin = Math.floor(Math.random() * 60);
      const mockUploadDate = new Date(now + randomDaysLater * 86400000);
      mockUploadDate.setHours(randomHour, randomMin, 0, 0);

      // 해당 크리에이티브에 매칭된 인플루언서 or 순환 배정
      const matched = conceptInfluencerMap[cr.concept_id] || [];
      const assignedInf = matched.length > 0
        ? matched[idx % matched.length]
        : allInfluencers.length > 0
          ? allInfluencers[idx % allInfluencers.length]
          : null;

      return {
        schedule_id: `cr-${cr.creative_id || idx}`,
        creative_id: cr.creative_id,
        campaign_id: campaignId,
        platform: PLACEMENT_LABELS[cr.campaign_placement] || cr.campaign_placement || 'Instagram',
        scheduled_at: cr.created_at || new Date().toISOString(),
        status: cr.status === 'approved' ? 'approved' : 'scheduled',
        concept_name: cr.concept_name || '컨셉',
        influencer_name: assignedInf?.username || assignedInf?.name || '자체 채널',
        profile_id: assignedInf?.profile_id || null,
        influencer_platform: assignedInf?.platform || null,
        persona_name: cr.persona_name || '',
        desire_name: cr.desire_name || '',
        awareness_name: cr.awareness_name || '',
        funnel: cr.funnel || '',
        copy_text: cr.copy_text || '',
        updated_at: mockUploadDate.toISOString(),
        _isCreative: true,
      };
    });
  }, [creatives, launchItems, campaignId, influencers]);

  const items = launchItems.length > 0 ? launchItems : creativeScheduleItems;
  const hasSchedule = items.length > 0;
  const allApproved = items.length > 0 && items.every((i) => i.status === 'approved' || i.status === 'published' || i.status === 'failed');

  const statusCounts = useMemo(() => {
    const counts = { scheduled: 0, approved: 0, published: 0, failed: 0 };
    for (const item of items) {
      if (item.status === 'scheduled' || item.status === 'draft') counts.scheduled++;
      else if (item.status === 'approved') counts.approved++;
      else if (item.status === 'published') counts.published++;
      else if (item.status === 'failed') counts.failed++;
    }
    return counts;
  }, [items]);

  const totalItems = items.length;
  const progressPct = totalItems > 0 ? Math.round((statusCounts.published / totalItems) * 100) : 0;

  // Group items by platform (normalize platform name for display)
  const platformGroups = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      // Normalize platform key for grouping
      let p = item.platform || 'Other';
      // Map lowercase/code values to display names
      if (p === 'instagram' || p === 'instagram_reels') p = 'Instagram';
      else if (p === 'tiktok') p = 'TikTok';
      else if (p === 'youtube' || p === 'youtube_shorts') p = 'YouTube';
      if (!groups[p]) groups[p] = [];
      groups[p].push(item);
    });
    // Sort each group by scheduled_at
    Object.values(groups).forEach((g) => g.sort((a, b) => new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0)));
    return groups;
  }, [items]);

  // Timeline date range
  const timelineDates = useMemo(() => {
    if (items.length === 0) return [];
    const dates = new Set();
    items.forEach((item) => {
      if (item.scheduled_at) {
        dates.add(new Date(item.scheduled_at).toISOString().slice(0, 10));
      }
    });
    return [...dates].sort();
  }, [items]);

  const handleStageAction = (stageKey) => {
    if (stageKey === 'schedule') {
      setScheduleUpdatedAt(new Date().toISOString());
      createSchedule.mutate({ campaignId });
    } else if (stageKey === 'confirm') {
      approveLaunch.mutate(campaignId);
    } else if (stageKey === 'ad') {
      setMetaConnected(true);
    }
  };

  const isStageEnabled = (stageKey) => {
    if (stageKey === 'schedule') return true;
    if (stageKey === 'confirm') return hasSchedule;
    if (stageKey === 'ad') return allApproved;
    return false;
  };

  const isStageLoading = (stageKey) => {
    if (stageKey === 'schedule') return createSchedule.isPending;
    if (stageKey === 'confirm') return approveLaunch.isPending;
    if (stageKey === 'ad') return executeLaunch.isPending;
    return false;
  };

  const toggleUploadCheck = (scheduleId) => {
    setUploadChecks((prev) => ({ ...prev, [scheduleId]: !prev[scheduleId] }));
  };

  // 크리에이티브 기반 스케줄인지 여부
  const isCreativeBased = launchItems.length === 0 && creativeScheduleItems.length > 0;

  if (isLoading || creativesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ── */}
      <div style={{
        borderRadius: 16, overflow: 'hidden',
        background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #6366f1 100%)',
        padding: '28px 32px',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Rocket style={{ width: 22, height: 22, color: '#c7d2fe' }} />
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>콘텐츠 론칭</h1>
            </div>
            {campaign?.campaign_name && (
              <p style={{ fontSize: 13, color: '#c7d2fe', margin: 0 }}>{campaign.campaign_name}</p>
            )}
          </div>
          {totalItems > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: '#c7d2fe', margin: 0 }}>전체 진행률</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>{progressPct}%</p>
              </div>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `conic-gradient(#22c55e ${progressPct * 3.6}deg, rgba(255,255,255,0.15) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap style={{ width: 18, height: 18, color: '#c7d2fe' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Status Summary Cards ── */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: '예약', count: statusCounts.scheduled, icon: Clock, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
            { label: '승인', count: statusCounts.approved, icon: CheckCheck, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
            { label: '발행 완료', count: statusCounts.published, icon: Rocket, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: '실패', count: statusCounts.failed, icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{
                borderRadius: 12, border: `1px solid ${s.border}`, background: s.bg,
                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#fff', border: `1px solid ${s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon style={{ width: 18, height: 18, color: s.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: s.color, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>{s.count}<span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', marginLeft: 2 }}>건</span></p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ Three-stage Pipeline ══════ */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card,
      }}>
        <div style={{
          padding: '12px 20px', borderBottom: `1px solid ${tokens.color.border}`,
          background: tokens.color.surfaceMuted, borderRadius: '14px 14px 0 0',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Zap style={{ width: 15, height: 15, color: '#6366f1' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>론칭 파이프라인</span>
        </div>

        <div style={{ padding: '20px 20px', display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {STAGE_CONFIG.map((stage, idx) => {
            const Icon = stage.icon;
            const enabled = isStageEnabled(stage.key);
            const loading = isStageLoading(stage.key);
            const stageStatus = getStageStatus(items, stage.key);
            const isDone = stageStatus === 'done' && hasSchedule;
            const doneColor = '#10b981';
            const isActive = activeStage === stage.key;

            const activeColor = isDone ? doneColor : enabled ? stage.color : '#94a3b8';
            const activeBg = isDone ? '#ecfdf5' : enabled ? stage.softBg : '#f8fafc';
            const activeBorder = isActive
              ? (isDone ? doneColor : stage.color)
              : isDone ? '#a7f3d0' : enabled ? stage.color + '40' : tokens.color.border;

            return (
              <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div
                  onClick={() => enabled && setActiveStage(stage.key)}
                  style={{
                    flex: 1, borderRadius: 12,
                    border: `${isActive ? '2px' : '1.5px'} solid ${activeBorder}`,
                    background: activeBg, padding: '20px 18px',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    opacity: enabled ? 1 : 0.55,
                    cursor: enabled ? 'pointer' : 'default',
                    transition: 'all .2s ease',
                    boxShadow: isActive ? `0 4px 16px ${activeColor}20` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isDone ? doneColor : enabled ? stage.color : '#cbd5e1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0,
                    }}>
                      {isDone ? <CheckCircle2 style={{ width: 18, height: 18 }} /> : idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{stage.label}</span>
                        {isDone && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#dcfce7', color: '#15803d' }}>완료</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{stage.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleStageAction(stage.key); }}
                    disabled={!enabled || loading}
                    variant={isDone ? 'outline' : 'default'}
                    size="sm"
                    style={{
                      width: '100%', borderRadius: 8, fontSize: 12, fontWeight: 600, height: 34,
                      ...(isDone ? {} : enabled ? { background: stage.color, borderColor: stage.color } : {}),
                    }}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                    <span>{stage.buttonLabel}</span>
                  </Button>
                </div>
                {idx < 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, flexShrink: 0 }}>
                    <ArrowRight style={{ width: 18, height: 18, color: isDone ? doneColor : '#d1d5db' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════ 채널별 업로드 스케줄 (Stage 1 Detail) ══════ */}
      {activeStage === 'schedule' && (
        <div style={{
          borderRadius: 14, border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, boxShadow: tokens.shadow.card, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 22px', borderBottom: `1px solid ${tokens.color.border}`,
            background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CalendarPlus style={{ width: 16, height: 16, color: '#6366f1' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>채널별 업로드 스케줄</h3>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#e0e7ff', color: '#4338ca' }}>
              {totalItems}건
            </span>
            {isCreativeBased && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e' }}>
                콘텐츠 기획 기반
              </span>
            )}
            {scheduleUpdatedAt && (
              <span style={{ fontSize: 10, fontWeight: 500, color: '#64748b', marginLeft: 'auto' }}>
                마지막 업데이트: {formatDate(scheduleUpdatedAt)} {formatTime(scheduleUpdatedAt)}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <CalendarPlus style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>업로드 스케줄을 생성해주세요</p>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>파이프라인에서 &ldquo;업데이트&rdquo; 버튼을 클릭하세요</p>
            </div>
          ) : (
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(platformGroups).map(([platform, pItems]) => {
                const pCfg = PLATFORM_COLORS[platform] || { icon: '🌐', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' };
                return (
                  <div key={platform} style={{ borderRadius: 12, border: `1px solid ${pCfg.border}`, overflow: 'hidden' }}>
                    {/* Channel header */}
                    <div style={{
                      padding: '10px 16px', background: pCfg.bg,
                      display: 'flex', alignItems: 'center', gap: 8,
                      borderBottom: `1px solid ${pCfg.border}`,
                    }}>
                      <span style={{ fontSize: 16 }}>{pCfg.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pCfg.color }}>{platform}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                        background: pCfg.color, color: '#fff',
                      }}>
                        {pItems.length}건
                      </span>
                    </div>
                    {/* Schedule items table */}
                    <div style={{ overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, borderBottom: `1px solid ${tokens.color.border}` }}>인플루언서</th>
                            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, borderBottom: `1px solid ${tokens.color.border}` }}>컨셉</th>
                            {isCreativeBased && (
                              <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, borderBottom: `1px solid ${tokens.color.border}` }}>페르소나</th>
                            )}
                            {isCreativeBased && (
                              <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 10, borderBottom: `1px solid ${tokens.color.border}` }}>퍼널</th>
                            )}
                            {!isCreativeBased && (
                              <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 10, borderBottom: `1px solid ${tokens.color.border}` }}>업로드 일자</th>
                            )}
                            <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 10, borderBottom: `1px solid ${tokens.color.border}` }}>상태</th>
                            <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 10, borderBottom: `1px solid ${tokens.color.border}` }}>업로드 예정일자</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pItems.map((item) => {
                            const st = item.status;
                            const stColor = st === 'published' ? '#10b981' : st === 'approved' ? '#f59e0b' : st === 'failed' ? '#ef4444' : st === 'human_edited' ? '#6366f1' : st === 'ai_generated' ? '#8b5cf6' : '#3b82f6';
                            const stLabel = st === 'published' ? '발행완료' : st === 'approved' ? '승인' : st === 'failed' ? '실패' : st === 'human_edited' ? '편집완료' : st === 'ai_generated' ? 'AI생성' : '예약';
                            const funnelColor = item.funnel === 'TOFU' ? '#3b82f6' : item.funnel === 'MOFU' ? '#f59e0b' : item.funnel === 'BOFU' ? '#10b981' : '#94a3b8';
                            const infName = item.influencer_name || item.profile_id || '자체 채널';
                            const hasProfile = !!item.profile_id;
                            return (
                              <tr key={item.schedule_id} style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                                <td style={{ padding: '10px 14px' }}>
                                  <div
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: hasProfile ? 'pointer' : 'default' }}
                                    onClick={() => {
                                      if (hasProfile) navigate(`/campaigns/${campaignId}/influencers?profile=${item.profile_id}`);
                                    }}
                                  >
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <User style={{ width: 12, height: 12, color: '#64748b' }} />
                                    </div>
                                    <span style={{
                                      fontWeight: 600, color: hasProfile ? '#6366f1' : '#1e293b',
                                      textDecoration: hasProfile ? 'underline' : 'none',
                                      fontSize: 12,
                                    }}>
                                      {infName}
                                    </span>
                                    {hasProfile && (
                                      <ExternalLink style={{ width: 10, height: 10, color: '#94a3b8', flexShrink: 0 }} />
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.concept_name || '컨셉'}</span>
                                  {isCreativeBased && item.copy_text && (
                                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0', lineHeight: 1.3, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {item.copy_text}
                                    </p>
                                  )}
                                </td>
                                {isCreativeBased && (
                                  <td style={{ padding: '10px 14px' }}>
                                    <span style={{ fontSize: 11, color: '#475569' }}>{item.persona_name || '-'}</span>
                                  </td>
                                )}
                                {isCreativeBased && (
                                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                    {item.funnel && (
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: funnelColor + '15', color: funnelColor }}>
                                        {item.funnel}
                                      </span>
                                    )}
                                  </td>
                                )}
                                {!isCreativeBased && (
                                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{formatDate(item.scheduled_at)}</span>
                                    <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{formatTime(item.scheduled_at)}</span>
                                  </td>
                                )}
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: stColor + '15', color: stColor }}>
                                    {stLabel}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 11 }}>
                                    {formatDate(item.updated_at || item.created_at || scheduleUpdatedAt)}
                                  </span>
                                  <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>
                                    {formatTime(item.updated_at || item.created_at || scheduleUpdatedAt)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════ 발행 스케줄 타임라인 (가로) ══════ */}
      {activeStage === 'schedule' && !isCreativeBased && timelineDates.length > 0 && (
        <div style={{
          borderRadius: 14, border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, boxShadow: tokens.shadow.card, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 22px', borderBottom: `1px solid ${tokens.color.border}`,
            background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Clock style={{ width: 16, height: 16, color: '#6366f1' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>발행 스케줄 타임라인</h3>
          </div>
          <div style={{ padding: '20px 22px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 0, minWidth: timelineDates.length * 140, position: 'relative' }}>
              {/* Horizontal line */}
              <div style={{
                position: 'absolute', top: 18, left: 20, right: 20,
                height: 3, background: 'linear-gradient(90deg, #6366f1, #10b981)',
                borderRadius: 2, zIndex: 0,
              }} />
              {timelineDates.map((dateStr, dIdx) => {
                const dayItems = items.filter((it) => it.scheduled_at && new Date(it.scheduled_at).toISOString().slice(0, 10) === dateStr);
                const d = new Date(dateStr);
                const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
                return (
                  <div key={dateStr} style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    {/* Dot */}
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: dayItems.some((i) => i.status === 'published') ? '#10b981' : '#6366f1',
                      border: '3px solid #fff', boxShadow: '0 0 0 2px #e2e8f0',
                      marginBottom: 8, zIndex: 2,
                    }} />
                    {/* Date label */}
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>
                      {d.getMonth() + 1}/{d.getDate()}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{dow}요일</span>
                    {/* Items */}
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 6px' }}>
                      {dayItems.map((item) => {
                        const st = item.status;
                        const stColor = st === 'published' ? '#10b981' : st === 'approved' ? '#f59e0b' : '#3b82f6';
                        return (
                          <div key={item.schedule_id} style={{
                            padding: '6px 8px', borderRadius: 6,
                            background: stColor + '10', border: `1px solid ${stColor}30`,
                            fontSize: 10, lineHeight: 1.4,
                          }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{item.influencer_name || item.profile_id || '자체 채널'}</div>
                            <div style={{ color: '#64748b' }}>{item.concept_name || '컨셉'}</div>
                            <div style={{ color: stColor, fontWeight: 600, marginTop: 2 }}>{formatTime(item.scheduled_at)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════ 업로드 확인 (Stage 2 Detail) ══════ */}
      {activeStage === 'confirm' && (
        <div style={{
          borderRadius: 14, border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, boxShadow: tokens.shadow.card, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 22px', borderBottom: `1px solid ${tokens.color.border}`,
            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Upload style={{ width: 16, height: 16, color: '#d97706' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#92400e', margin: 0 }}>인플루언서 업로드 확인</h3>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#fde68a', color: '#92400e' }}>
                {Object.values(uploadChecks).filter(Boolean).length}/{items.length} 확인
              </span>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => {
                const allChecked = items.every((i) => uploadChecks[i.schedule_id]);
                const next = {};
                items.forEach((i) => { next[i.schedule_id] = !allChecked; });
                setUploadChecks(next);
              }}
              style={{ fontSize: 11, height: 30, borderRadius: 8 }}
            >
              <CheckCheck className="size-3.5" />
              전체 {items.every((i) => uploadChecks[i.schedule_id]) ? '해제' : '확인'}
            </Button>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>스케줄이 없습니다</p>
            </div>
          ) : (
            <div style={{ padding: '4px 0' }}>
              {items.map((item) => {
                const checked = !!uploadChecks[item.schedule_id];
                const isPublished = item.status === 'published';
                const pCfg = PLATFORM_COLORS[item.platform] || { icon: '🌐', color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <div
                    key={item.schedule_id}
                    onClick={() => toggleUploadCheck(item.schedule_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 22px', cursor: 'pointer',
                      borderBottom: `1px solid ${tokens.color.border}`,
                      background: checked ? '#f0fdf4' : isPublished ? '#f0fdf420' : 'transparent',
                      transition: 'background .15s',
                    }}
                  >
                    <Checkbox
                      checked={checked || isPublished}
                      onCheckedChange={() => toggleUploadCheck(item.schedule_id)}
                      disabled={isPublished}
                    />
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User style={{ width: 14, height: 14, color: '#64748b' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{item.influencer_name || item.profile_id || '자체 채널'}</span>
                        <span style={{ fontSize: 12 }}>{pCfg.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: pCfg.color }}>{item.platform}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                        {item.concept_name || '컨셉'} · {item.content_type || item.platform}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{formatDate(item.scheduled_at)}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{formatTime(item.scheduled_at)}</span>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {isPublished ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#15803d' }}>업로드 완료</span>
                      ) : checked ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#dbeafe', color: '#2563eb' }}>확인됨</span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#94a3b8' }}>미확인</span>
                      )}
                    </div>
                    {isPublished && item.published_url && (
                      <a
                        href={item.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ flexShrink: 0 }}
                      >
                        <ExternalLink style={{ width: 14, height: 14, color: '#6366f1' }} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════ 광고 집행 - META 연동 (Stage 3 Detail) ══════ */}
      {activeStage === 'ad' && (
        <div style={{
          borderRadius: 14, border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, boxShadow: tokens.shadow.card, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 22px', borderBottom: `1px solid ${tokens.color.border}`,
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Megaphone style={{ width: 16, height: 16, color: '#059669' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#065f46', margin: 0 }}>META 광고 집행</h3>
            {metaConnected && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#059669', color: '#fff' }}>연동됨</span>
            )}
          </div>

          <div style={{ padding: '24px 22px' }}>
            {/* META connection card */}
            <div style={{
              borderRadius: 12, border: '1px solid #bfdbfe',
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              padding: '24px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              {/* Meta logo placeholder */}
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'linear-gradient(135deg, #1877F2, #42b72a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 4px 12px rgba(24,119,242,.3)',
              }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>M</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>Meta Business Suite</h4>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Facebook & Instagram 광고 캠페인을 연동하여 시딩 콘텐츠 기반 광고를 자동으로 집행합니다.
                </p>
                {metaConnected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color: '#059669' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>연결 완료 — Ad Account 활성화됨</span>
                  </div>
                )}
              </div>
              {!metaConnected && (
                <Button
                  onClick={() => setMetaConnected(true)}
                  style={{ borderRadius: 8, fontSize: 12, fontWeight: 700, height: 36, background: '#1877F2' }}
                >
                  <ExternalLink className="size-4" />
                  META 연동하기
                </Button>
              )}
            </div>

            {/* Ad campaign cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                {
                  type: 'Spark Ads',
                  desc: '인플루언서 콘텐츠를 그대로 광고 소재로 활용',
                  icon: Zap,
                  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a',
                  status: metaConnected ? 'ready' : 'locked',
                },
                {
                  type: 'Branded Content Ads',
                  desc: '파트너십 표시와 함께 브랜드 노출 극대화',
                  icon: Megaphone,
                  color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe',
                  status: metaConnected ? 'ready' : 'locked',
                },
                {
                  type: 'Retargeting',
                  desc: '시딩 콘텐츠 조회자 대상 리타겟팅 광고',
                  icon: RefreshCw,
                  color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0',
                  status: metaConnected ? 'ready' : 'locked',
                },
              ].map((ad) => {
                const AdIcon = ad.icon;
                return (
                  <div key={ad.type} style={{
                    borderRadius: 12, border: `1px solid ${ad.border}`,
                    background: ad.bg, padding: '18px 16px',
                    opacity: ad.status === 'locked' ? 0.5 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: ad.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <AdIcon style={{ width: 16, height: 16, color: '#fff' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{ad.type}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>{ad.desc}</p>
                    <Button
                      variant="outline" size="sm"
                      disabled={ad.status === 'locked'}
                      style={{
                        width: '100%', borderRadius: 8, fontSize: 11, fontWeight: 600, height: 32,
                        borderColor: ad.border,
                      }}
                    >
                      {ad.status === 'locked' ? '연동 필요' : '캠페인 생성'}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Published content summary for ads */}
            {metaConnected && statusCounts.published > 0 && (
              <div style={{
                marginTop: 16, borderRadius: 12, border: `1px solid ${tokens.color.border}`,
                padding: '16px 18px', background: '#f8fafc',
              }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>
                  광고 소재로 활용 가능한 콘텐츠
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.filter((i) => i.status === 'published').map((item) => (
                    <div key={item.schedule_id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8,
                      border: `1px solid ${tokens.color.border}`, background: '#fff',
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User style={{ width: 12, height: 12, color: '#64748b' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{item.influencer_name || item.profile_id || '자체 채널'}</span>
                        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{item.concept_name || '컨셉'}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{item.platform} · {item.content_type || item.platform}</span>
                      {item.published_url && (
                        <a href={item.published_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink style={{ width: 13, height: 13, color: '#6366f1' }} />
                        </a>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#15803d' }}>
                        소재 활용 가능
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI 플랜 최종 리뷰 ── */}
      <FinalReviewSection
        planDocId={campaign?.plan_doc_id}
        campaignId={campaignId}
      />

      {/* Approval Dialog */}
      <ApprovalFlow
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        items={items}
        onConfirm={() => { approveLaunch.mutate(campaignId); setApprovalOpen(false); }}
        isLoading={approveLaunch.isPending}
      />
    </div>
  );
}
