import { useState, useMemo } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { useCalendar, useGenerateCalendar, useUpdateCalendarItem } from '@/hooks/useCalendar';
import { usePDA } from '@/hooks/usePDA';
import { useStrategy } from '@/hooks/useStrategy';
import { useNarrativeArc } from '@/hooks/useNarrativeArc';
import { useConfirmedConcepts } from '@/hooks/useConfirmedConcepts';
import { assignConceptsToChannels } from '@/lib/channelScoring.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog.jsx';
import {
  Sparkles, Loader2, Music, Camera, Play, ArrowRight, Map, Check, CheckCircle2, ListChecks, ChevronDown, ChevronUp,
  X, Hash, Megaphone, Target, MessageSquare, Film, FileText, Lock, Send,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

/* ── 기획안 자동 생성 헬퍼 ── */
function generatePlanDetails(item) {
  const hook = item.head_copy || item.concept_name || '';
  const format = item.format || '';
  const funnel = item.funnel || '';
  const copyType = item.copy_type || '';
  const tone = item.tone || '';
  const persona = item.persona_code || '';
  const desire = item.desire_code || '';
  const awareness = item.awareness_stage || '';

  // USP 생성
  const uspMap = {
    TOFU: '빠른 인지 확보 — 타깃이 공감할 수 있는 일상 문제를 제시하여 브랜드 존재감을 심어줌',
    MOFU: '제품 가치 전달 — 솔루션으로서 제품의 핵심 기능·성분을 비교/교육 형태로 소구',
    BOFU: '전환 유도 — 리뷰·후기·한정 오퍼를 통해 구매 확신과 긴급성을 부여',
  };

  // 핵심 메시지 생성
  const messageMap = {
    '공감': `"나도 그래" 공감을 통해 ${persona} 페르소나의 일상 고민에 자연스럽게 브랜드를 연결`,
    '솔루션': `제품이 ${persona}의 문제를 어떻게 해결하는지 구체적 Before/After로 전달`,
    '비교': `경쟁 제품 대비 차별화 포인트를 객관적 데이터와 함께 제시`,
    '교육': `${persona}가 몰랐던 성분·사용법 정보를 전달하여 전문성 인식 강화`,
    '신뢰': `실사용 후기와 전문가 추천으로 제품 신뢰도를 극대화`,
    '기능': `제품의 핵심 기능과 사용 편의성을 직관적으로 시연`,
    '후기': `실제 사용자의 생생한 경험담으로 구매 의사결정 지원`,
    '바이럴': `트렌드 포맷을 활용한 자연스러운 바이럴 확산 유도`,
  };

  // 주요 컷 구성
  const cutMap = {
    '15s Reels': ['Hook 장면 (0-3s): 시선 집중 오프닝', '문제/공감 제시 (3-7s)', '제품 등장 & 솔루션 (7-12s)', 'CTA + 브랜드 태그 (12-15s)'],
    '30s Video': ['Hook 오프닝 (0-5s): 질문/공감', '문제 심화 (5-12s)', '제품 소개 & 시연 (12-22s)', '결과 & 사회적 증거 (22-27s)', 'CTA 클로징 (27-30s)'],
    'Carousel': ['커버: 궁금증 유발 타이틀', '슬라이드 1-2: 문제 정의', '슬라이드 3-4: 제품 솔루션', '슬라이드 5: 사용 결과', '마지막: CTA + 프로필 유도'],
    'YouTube Shorts': ['Hook (0-3s): 강렬한 첫 장면', '스토리 전개 (3-15s)', '제품 하이라이트 (15-25s)', '반전/결과 (25-28s)', 'CTA (28-30s)'],
    'Single Image': ['메인 비주얼: 제품 + 핵심 카피', '서브 카피: 혜택 요약', '브랜드 로고 + CTA'],
  };

  // 시나리오 요약
  const scenarioTemplates = {
    TOFU: `${persona} 페르소나의 일상에서 시작 → "${hook.replace(/"/g, '')}" 공감 유도 → 자연스러운 제품 노출 → 호기심 자극 후 프로필/링크 유도. ${tone} 톤으로 거부감 없이 브랜드를 인지시키는 것이 핵심.`,
    MOFU: `${persona}가 겪는 구체적 고민 제시 → 제품이 해결하는 방식을 ${copyType} 형태로 설명 → Before/After 또는 비교 장면 → 다음 액션(저장/팔로우/더보기) 유도. ${tone} 톤 유지.`,
    BOFU: `${persona}의 구매 고민 포인트 짚기 → 리얼 후기/전문가 추천 → 한정 오퍼 또는 혜택 강조 → 직접 구매 링크 CTA. ${tone} 톤으로 신뢰감과 긴급성을 동시에 전달.`,
  };

  return {
    hook,
    usp: uspMap[funnel] || '제품의 핵심 차별 포인트를 타깃 페르소나 관점에서 소구',
    coreMessage: messageMap[copyType] || `${copyType || '핵심'} 메시지를 ${tone || '자연스러운'} 톤으로 전달하여 ${persona} 타깃의 관심 유도`,
    cuts: cutMap[format] || ['오프닝: Hook 장면', '본문: 핵심 메시지 전달', '클로징: CTA'],
    scenario: scenarioTemplates[funnel] || `${persona} 타깃을 위한 ${format} 포맷 콘텐츠. ${hook} 메시지를 중심으로 ${copyType} 유형의 스토리를 전개합니다.`,
  };
}

/* ── 12가지 Hook 유형 (mst_awareness copy_type 기반) ── */
const HOOK_TYPE_MAP = {
  Visual_shock: { label: 'Visual Shock', desc: '강렬한 비주얼로 시선을 사로잡는 충격 훅', color: '#dc2626' },
  Myth:         { label: 'Myth', desc: '통념을 깨는 반전 사실로 호기심 유발', color: '#9333ea' },
  Cultural:     { label: 'Cultural', desc: '문화·트렌드 코드를 활용한 공감 훅', color: '#0891b2' },
  Pain:         { label: 'Pain', desc: 'Pain Point를 직접 자극하여 문제 인식 유도', color: '#e11d48' },
  Story:        { label: 'Story', desc: '스토리텔링으로 감정 몰입을 이끄는 서사 훅', color: '#7c3aed' },
  ASMR:         { label: 'ASMR', desc: '감각적 자극(소리·질감)으로 몰입감 극대화', color: '#059669' },
  Result:       { label: 'Result', desc: 'Before/After 결과를 보여주는 증거 훅', color: '#d97706' },
  trend:        { label: 'Trend', desc: '최신 트렌드·밈을 활용한 바이럴 훅', color: '#2563eb' },
  Utility:      { label: 'Utility', desc: '실용적 팁·노하우를 제공하는 정보 훅', color: '#0d9488' },
  Contradiction:{ label: 'Contradiction', desc: '기존 상식과 반대되는 메시지로 주목 유도', color: '#c026d3' },
  Fame:         { label: 'Fame', desc: '유명인·권위자 인용으로 신뢰 극대화', color: '#ea580c' },
  '공감':       { label: '공감', desc: '타겟의 일상 고민에 공감하며 자연스럽게 연결', color: '#64748b' },
  '솔루션':     { label: '솔루션', desc: '문제 해결 방법을 제시하는 교육형 훅', color: '#2563eb' },
  '비교':       { label: '비교', desc: '경쟁 제품 대비 차별점을 객관적으로 비교', color: '#0891b2' },
  '교육':       { label: '교육', desc: '성분·사용법 정보를 전달하는 전문성 훅', color: '#0d9488' },
  '신뢰':       { label: '신뢰', desc: '실사용 후기와 전문가 추천으로 신뢰 구축', color: '#059669' },
  '기능':       { label: '기능', desc: '핵심 기능과 사용 편의성을 직관적으로 시연', color: '#d97706' },
  '후기':       { label: '후기', desc: '실제 사용자의 생생한 경험담 제공', color: '#ea580c' },
  '바이럴':     { label: '바이럴', desc: '트렌드 포맷 활용한 자연스러운 확산 유도', color: '#2563eb' },
};

/* ── Arc Phase Definitions ── */
const ARC_PHASES = [
  { key: 'tease',    num: 1, name: '티징',     subtitle: '호기심',   color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', desc: '궁금증을 유발하고 관심을 끌어 모읍니다' },
  { key: 'launch',   num: 2, name: '런칭',     subtitle: '문제 제기', color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', desc: '제품과 문제를 본격적으로 드러냅니다' },
  { key: 'spread',   num: 3, name: '확산',     subtitle: '리뷰',     color: '#059669', bg: '#d1fae5', border: '#6ee7b7', desc: '사회적 증거로 확산하고 검증합니다' },
  { key: 'lastcall', num: 4, name: '라스트콜', subtitle: '전환',     color: '#d97706', bg: '#fef3c7', border: '#fcd34d', desc: '긴급성으로 최종 전환을 이끕니다' },
];

const NARRATIVE_TO_ROADMAP = { tease: 'tease', reveal: 'launch', validate: 'spread', amplify: 'lastcall' };

const PLATFORMS = [
  { key: 'TikTok',    label: 'TikTok',    Icon: Music,  color: '#0f172a', bg: '#f1f5f9' },
  { key: 'Instagram', label: 'Instagram', Icon: Camera, color: '#db2777', bg: '#fdf2f8' },
  { key: 'YouTube',   label: 'YouTube',   Icon: Play,   color: '#dc2626', bg: '#fef2f2' },
];

const STATUS_COLORS = {
  planned:     { label: '예정',   color: '#2563eb', bg: '#dbeafe' },
  in_progress: { label: '진행중', color: '#d97706', bg: '#fef3c7' },
  completed:   { label: '완료',   color: '#059669', bg: '#d1fae5' },
  draft:       { label: '초안',   color: tokens.color.textSubtle, bg: tokens.color.surfaceMuted },
  confirmed:   { label: '확정',   color: '#059669', bg: '#d1fae5' },
};

/* ── Map funnel to arc phase ── */
function funnelToPhase(funnel) {
  if (funnel === 'TOFU') return 'tease';
  if (funnel === 'MOFU') return 'launch';
  if (funnel === 'BOFU') return 'spread';
  return 'lastcall';
}

/* ── Helpers ── */
function mapItemToPhase(item) {
  if (item.arc_phase) {
    const mapped = NARRATIVE_TO_ROADMAP[item.arc_phase] || item.arc_phase;
    if (ARC_PHASES.find((p) => p.key === mapped)) return mapped;
  }
  if (item.phase) {
    const mapped = NARRATIVE_TO_ROADMAP[item.phase] || item.phase;
    if (ARC_PHASES.find((p) => p.key === mapped)) return mapped;
  }
  if (item.funnel === 'TOFU') return 'tease';
  if (item.funnel === 'MOFU') return 'launch';
  if (item.funnel === 'BOFU') return 'spread';
  return null;
}

function normalizePlatform(p) {
  if (!p) return null;
  const lower = p.toLowerCase();
  if (lower === 'tiktok') return 'TikTok';
  if (lower === 'instagram') return 'Instagram';
  if (lower === 'youtube') return 'YouTube';
  return p;
}

/* ── Content Item Card ── */
function ContentItemCard({ item, onClick, selectable, selected, onToggle, locked }) {
  const statusCfg = locked
    ? { label: '제작 이관', color: '#6366f1', bg: '#eef2ff' }
    : STATUS_COLORS[item.status] || STATUS_COLORS.draft;
  return (
    <div
      onClick={() => { if (!locked) onClick?.(item); }}
      style={{
        borderRadius: 10,
        border: locked ? '2px solid #a5b4fc' : selected ? `2px solid ${tokens.color.primary}` : `1px solid ${tokens.color.border}`,
        background: locked ? '#eef2ff' : selected ? '#eef2ff' : tokens.color.surface,
        padding: '8px 10px',
        cursor: locked ? 'default' : 'pointer',
        transition: 'box-shadow .15s, border-color .15s',
        opacity: locked ? 0.75 : 1,
        position: 'relative',
      }}
      onMouseEnter={(e) => { if (!locked) e.currentTarget.style.boxShadow = tokens.shadow.card; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {locked && (
        <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock style={{ width: 10, height: 10, color: '#fff' }} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          {selectable && !locked && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={!!selected}
                onCheckedChange={() => { onToggle?.(item); }}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
            </div>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {item.concept_name || item.title || '(무제)'}
          </span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 999, color: statusCfg.color, background: statusCfg.bg, flexShrink: 0, marginLeft: 6 }}>
          {statusCfg.label}
        </span>
      </div>
      {item.head_copy && (
        <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.head_copy}
        </p>
      )}
      {item.content_type && !item.head_copy && (
        <span style={{ fontSize: 10, color: tokens.color.textSubtle }}>{item.content_type}</span>
      )}
      {/* PDA tags + score */}
      <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {item.persona_code && <span style={{ fontSize: 9, fontWeight: 600, padding: '0 5px', borderRadius: 999, background: '#7c3aed', color: '#fff' }}>{item.persona_code}</span>}
        {item.desire_code && <span style={{ fontSize: 9, fontWeight: 600, padding: '0 5px', borderRadius: 999, background: '#d97706', color: '#fff' }}>{item.desire_code}</span>}
        {item.score_total && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '0 5px', borderRadius: 999, background: item.score_total >= 70 ? '#dcfce7' : '#fef3c7', color: item.score_total >= 70 ? '#15803d' : '#d97706', marginLeft: 'auto' }}>
            적합도 {item.score_total}
          </span>
        )}
      </div>
      {item.scheduled_date && (
        <p style={{ fontSize: 9, color: tokens.color.textSubtle, marginTop: 3 }}>{item.scheduled_date}</p>
      )}
    </div>
  );
}

/* ── Empty Cell Placeholder ── */
function EmptyCell() {
  return (
    <div style={{ borderRadius: 10, border: `1px dashed ${tokens.color.border}`, padding: '14px 10px', textAlign: 'center' }}>
      <span style={{ fontSize: 10, color: tokens.color.textSubtle }}>콘텐츠 없음</span>
    </div>
  );
}

/* ── Main Component ── */
export default function ContentPlan() {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const { data: calendarData, isLoading } = useCalendar(campaignId);
  const { data: pdaData } = usePDA(campaignId);
  const { data: rawStrategy } = useStrategy(campaignId);
  const { data: arcData } = useNarrativeArc(campaignId);
  const generateCalendar = useGenerateCalendar();
  const updateItem = useUpdateCalendarItem();

  // 승인된 전략에서 확정 컨셉 ID 추출
  const strategyKo = rawStrategy?.strategy_ko;
  const strategyStatus = rawStrategy?.status;
  const approvedConceptIds = useMemo(() => {
    if (!strategyKo?.timing?.phases) return null;
    const ids = new Set();
    strategyKo.timing.phases.forEach(p => {
      (p.concept_ids || []).forEach(id => ids.add(id));
      // concept 객체에서도 추출 (개별 concept 정보가 있는 경우)
      (p.concepts || []).forEach(c => { if (c.concept_id) ids.add(c.concept_id); });
    });
    return ids.size > 0 ? ids : null;
  }, [strategyKo]);

  const [editItem, setEditItem] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [arcDetailOpen, setArcDetailOpen] = useState({});

  const {
    confirmedIds, lockedIds, confirmedCount, lockedCount,
    isConfirmed, isLocked, toggleConfirm: sharedToggleConfirm,
    confirmAll: sharedConfirmAll, clearConfirmed: sharedClearConfirmed,
    lockConfirmed,
  } = useConfirmedConcepts(campaignId);

  const calendarItems = calendarData?.items || calendarData || [];
  const arcPhases = arcData?.phases || [];
  const isGenerating = generateCalendar.isPending;

  // 승인된 전략의 확정 컨셉 우선, 없으면 전체 PDA 컨셉 사용
  const pdaConcepts = useMemo(() => {
    const concepts = pdaData?.concepts || [];
    if (approvedConceptIds && approvedConceptIds.size > 0) {
      // 전략에서 확정된 컨셉만 필터링
      return concepts.filter((c) => approvedConceptIds.has(c.concept_id));
    }
    // 전략 미승인 시 전체 컨셉 사용
    return concepts;
  }, [pdaData, approvedConceptIds]);

  const pdaPersonas = pdaData?.personas || [];

  // Convert PDA concepts to roadmap items with 3-factor scoring channel assignment
  const conceptItems = useMemo(() => {
    const scored = assignConceptsToChannels(pdaConcepts, pdaPersonas);
    return scored.map((c) => ({
      ...c,
      id: `concept-${c.concept_id}`,
      arc_phase: funnelToPhase(c.funnel),
      platform: c.assigned_platform,
      status: lockedIds.has(c.concept_id) ? 'confirmed' : confirmedIds.has(c.concept_id) ? 'confirmed' : 'draft',
    }));
  }, [pdaConcepts, pdaPersonas, confirmedIds, lockedIds]);

  // Merge: always show PDA concepts (not already in calendar) + calendar items
  const items = useMemo(() => {
    const calendarConceptIds = new Set(calendarItems.map((i) => i.concept_id).filter(Boolean));
    const newConcepts = conceptItems.filter((c) => !calendarConceptIds.has(c.concept_id));
    return [...newConcepts, ...calendarItems];
  }, [calendarItems, conceptItems]);

  const isConceptMode = conceptItems.length > 0;

  const arcInfo = useMemo(() => {
    const map = {};
    arcPhases.forEach((p) => {
      const rKey = NARRATIVE_TO_ROADMAP[p.phase] || p.phase;
      map[rKey] = p;
    });
    return map;
  }, [arcPhases]);

  // Group items by phase × platform
  const roadmapMatrix = useMemo(() => {
    const matrix = {};
    ARC_PHASES.forEach((p) => {
      matrix[p.key] = {};
      PLATFORMS.forEach((pl) => { matrix[p.key][pl.key] = []; });
      matrix[p.key]._unassigned = [];
    });
    const unassigned = [];

    items.forEach((item) => {
      const phase = mapItemToPhase(item) || item.arc_phase;
      const platform = normalizePlatform(item.platform);
      if (phase && matrix[phase]) {
        if (platform && matrix[phase][platform]) {
          matrix[phase][platform].push(item);
        } else {
          matrix[phase]._unassigned.push(item);
        }
      } else {
        unassigned.push(item);
      }
    });

    if (unassigned.length > 0) {
      const phaseKeys = ARC_PHASES.map((p) => p.key);
      unassigned.forEach((item, idx) => {
        const pKey = phaseKeys[idx % phaseKeys.length];
        const platform = normalizePlatform(item.platform);
        if (platform && matrix[pKey][platform]) {
          matrix[pKey][platform].push(item);
        } else {
          matrix[pKey]._unassigned.push(item);
        }
      });
    }

    return matrix;
  }, [items]);

  const phaseCounts = useMemo(() => {
    const counts = {};
    ARC_PHASES.forEach((p) => {
      let c = 0;
      PLATFORMS.forEach((pl) => { c += (roadmapMatrix[p.key]?.[pl.key]?.length || 0); });
      c += (roadmapMatrix[p.key]?._unassigned?.length || 0);
      counts[p.key] = c;
    });
    return counts;
  }, [roadmapMatrix]);

  // Confirm handlers
  const toggleConfirm = (item) => {
    const cid = item.concept_id;
    if (!cid || isLocked(cid)) return;
    sharedToggleConfirm(cid);
  };

  const handleConfirmAll = () => {
    const ids = pdaConcepts.map((c) => c.concept_id).filter(Boolean);
    sharedConfirmAll(ids);
  };

  const [showTransferSuccess, setShowTransferSuccess] = useState(false);
  const handleLockAndSend = () => {
    lockConfirmed();
    setShowTransferSuccess(true);
    // 1.5초 후 콘텐츠 제작 탭으로 자동 이동
    setTimeout(() => {
      navigate(`/campaigns/${campaignId}/creative`);
    }, 1500);
  };

  const allConfirmed = confirmedCount >= pdaConcepts.length && pdaConcepts.length > 0;
  const unlocked = confirmedCount - lockedCount; // 확정됐지만 아직 잠기지 않은 수

  // Edit handlers
  const openEdit = (item) => { setEditItem(item); setEditDraft({ ...item }); };
  const closeEdit = () => { setEditItem(null); setEditDraft({}); };
  const saveEdit = () => {
    updateItem.mutate({ campaignId, calendarId: editDraft.id, ...editDraft });
    closeEdit();
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${tokens.color.border}`, borderBottomColor: tokens.color.primary }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Map style={{ width: 20, height: 20, color: tokens.color.primary }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>콘텐츠 로드맵</h1>
          </div>
          <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>
            {strategyStatus === 'approved'
              ? `승인된 전략의 확정 컨셉 ${pdaConcepts.length}개가 채널별로 자동 배분되었습니다`
              : pdaConcepts.length > 0
                ? `PDA 컨셉 ${pdaConcepts.length}개가 로드되었습니다. 전략 승인 후 확정 컨셉이 표시됩니다`
                : '캠페인 전략 탭에서 전략을 생성하고 승인해주세요'}
          </p>
          {strategyStatus === 'approved' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 4, fontSize: 11, fontWeight: 700,
              padding: '2px 10px', borderRadius: 999,
              background: '#dcfce7', color: '#15803d',
            }}>
              <CheckCircle2 style={{ width: 12, height: 12 }} />
              전략 승인됨 · v{rawStrategy?.version || 1}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isConceptMode && (
            <>
              <Button
                onClick={handleConfirmAll}
                disabled={allConfirmed}
                variant={allConfirmed ? 'secondary' : 'default'}
                className="gap-2"
                style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, background: allConfirmed ? '#d1fae5' : undefined, color: allConfirmed ? '#059669' : undefined }}
              >
                {allConfirmed ? <CheckCircle2 className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                {allConfirmed ? '전체 확정 완료' : '전체 컨셉 확정'}
              </Button>
              {unlocked > 0 && (
                <Button
                  onClick={handleLockAndSend}
                  className="gap-2"
                  style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#6366f1' }}
                >
                  <Send className="h-4 w-4" />
                  콘텐츠 제작으로 넘기기 ({unlocked})
                </Button>
              )}
            </>
          )}
          <Button
            onClick={() => generateCalendar.mutate(campaignId)}
            disabled={isGenerating}
            className="gap-2"
            style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600 }}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'AI 생성 중...' : 'AI 로드맵 생성'}
          </Button>
        </div>
      </div>

      {/* ── Concept Auto-Distribution Banner ── */}
      {isConceptMode && (
        <div style={{
          borderRadius: 12, padding: '16px 20px',
          background: 'linear-gradient(135deg, #eef2ff 0%, #fdf2f8 50%, #fef2f2 100%)',
          border: `1px solid #c7d2fe`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #db2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {strategyStatus === 'approved' ? '승인된 전략 컨셉 자동 배분 완료' : 'PDA 컨셉 자동 배분 완료'}
              </p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                {strategyStatus === 'approved'
                  ? <>승인된 전략(v{rawStrategy?.version})의 <strong>{pdaConcepts.length}개 확정 컨셉</strong>이 서사 아크 × 채널별로 자동 배분되었습니다.</>
                  : <>PDA에서 생성된 <strong>{pdaConcepts.length}개 컨셉</strong>이 서사 아크 × 채널별로 자동 배분되었습니다.</>
                }
                {lockedCount > 0
                  ? <>{' '}<strong style={{ color: '#6366f1' }}>{lockedCount}개</strong>가 콘텐츠 제작으로 이관되었습니다.</>
                  : ' 각 컨셉을 확인 후 확정해주세요.'
                }
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#6366f1', margin: 0, lineHeight: 1 }}>{confirmedCount}</p>
              <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>/ {pdaConcepts.length} 확정</p>
            </div>
            {/* Progress bar */}
            <div style={{ width: 80, height: 6, borderRadius: 999, background: '#e2e8f0' }}>
              <div style={{
                width: pdaConcepts.length > 0 ? `${(confirmedCount / pdaConcepts.length) * 100}%` : '0%',
                height: '100%', borderRadius: 999,
                background: confirmedCount === pdaConcepts.length ? '#10b981' : 'linear-gradient(90deg, #6366f1, #db2777)',
                transition: 'width .3s ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Arc Flow Visualization (블록별 토글) ── */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card,
        padding: '20px 24px',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>서사 아크 (Narrative Arc)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, alignItems: 'start' }}>
          {ARC_PHASES.map((phase, idx) => {
            const info = arcInfo[phase.key];
            const isOpen = !!arcDetailOpen[phase.key];
            const count = phaseCounts[phase.key] || 0;
            const platformBreakdown = PLATFORMS.map((pl) => ({
              ...pl,
              count: roadmapMatrix[phase.key]?.[pl.key]?.length || 0,
            }));
            return (
              <div key={phase.key} style={{ display: 'flex', alignItems: 'start' }}>
                <div style={{
                  flex: 1, borderRadius: 12, border: `1.5px solid ${phase.border}`,
                  background: phase.bg, overflow: 'hidden',
                }}>
                  {/* 상단: 아크 요약 */}
                  <div style={{ padding: '14px 16px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: phase.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {phase.num}
                      </span>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: phase.color }}>{phase.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: phase.color, opacity: 0.7, marginLeft: 6 }}>({phase.subtitle})</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: phase.color, opacity: 0.8, lineHeight: 1.5, marginBottom: 6 }}>
                      {info?.purpose || phase.desc}
                    </p>
                    {info?.timing && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: phase.color, color: '#fff', opacity: 0.9 }}>
                        {info.timing}
                      </span>
                    )}
                    <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: phase.color, color: '#fff' }}>
                      {count}
                    </span>
                  </div>

                  {/* 토글 버튼 */}
                  {items.length > 0 && (
                    <button
                      onClick={() => setArcDetailOpen((prev) => ({ ...prev, [phase.key]: !prev[phase.key] }))}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        width: '100%', padding: '6px 0',
                        borderTop: `1px solid ${phase.border}`,
                        background: 'transparent', border: 'none', borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: phase.border,
                        cursor: 'pointer', fontSize: 10, fontWeight: 600, color: phase.color, opacity: 0.7,
                      }}
                    >
                      {isOpen ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
                      상세
                    </button>
                  )}

                  {/* 토글 내용: 채널별 수 + KPI */}
                  {isOpen && (
                    <div style={{ padding: '10px 14px', borderTop: `1px solid ${phase.border}`, background: `${phase.bg}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {platformBreakdown.map((pl) => (
                          <div key={pl.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <pl.Icon style={{ width: 11, height: 11, color: pl.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, color: phase.color, opacity: 0.7 }}>{pl.label}</span>
                            <span style={{ fontWeight: 700, color: phase.color }}>{pl.count}</span>
                          </div>
                        ))}
                      </div>
                      {info?.kpi && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${phase.border}` }}>
                          <p style={{ fontSize: 10, fontWeight: 600, color: phase.color, opacity: 0.6, margin: '0 0 2px' }}>KPI</p>
                          <p style={{ fontSize: 11, fontWeight: 500, color: phase.color, margin: 0, lineHeight: 1.4 }}>{info.kpi}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {idx < ARC_PHASES.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', flexShrink: 0, marginTop: 32 }}>
                    <ArrowRight style={{ width: 18, height: 18, color: tokens.color.border }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Roadmap Matrix ── */}
      {items.length === 0 ? (
        <div style={{ borderRadius: 14, border: `2px dashed ${tokens.color.border}`, padding: '48px 20px', textAlign: 'center' }}>
          <Map style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.4, color: tokens.color.textSubtle }} />
          <p style={{ fontSize: 16, fontWeight: 500, color: tokens.color.textSubtle }}>콘텐츠 로드맵이 비어있습니다</p>
          <p style={{ fontSize: 13, color: tokens.color.textSubtle, marginTop: 4 }}>
            {!rawStrategy
              ? '캠페인 전략 탭에서 AI 전략을 먼저 생성해주세요'
              : strategyStatus !== 'approved'
                ? '캠페인 전략 탭에서 전략을 승인하면 확정 컨셉이 자동으로 불러와집니다'
                : '"AI 로드맵 생성" 버튼을 클릭하여 콘텐츠 로드맵을 생성하세요'}
          </p>
        </div>
      ) : (
        <div style={{
          borderRadius: 14, border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, boxShadow: tokens.shadow.card,
          overflow: 'hidden',
        }}>
          {/* Column Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(4, 1fr)', borderBottom: `1px solid ${tokens.color.border}` }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: tokens.color.textSubtle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>채널</span>
            </div>
            {ARC_PHASES.map((phase) => (
              <div key={phase.key} style={{ padding: '12px 16px', borderLeft: `1px solid ${tokens.color.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: phase.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
                  {phase.num}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: phase.color }}>{phase.name}</span>
                <span style={{ fontSize: 10, color: phase.color, opacity: 0.6 }}>({phase.subtitle})</span>
              </div>
            ))}
          </div>

          {/* Platform Rows */}
          {PLATFORMS.map((plat, pIdx) => (
            <div
              key={plat.key}
              style={{
                display: 'grid', gridTemplateColumns: '120px repeat(4, 1fr)',
                borderBottom: pIdx < PLATFORMS.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                minHeight: 100,
              }}
            >
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 8, background: plat.bg }}>
                <plat.Icon style={{ width: 16, height: 16, color: plat.color, marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: plat.color }}>{plat.label}</span>
              </div>
              {ARC_PHASES.map((phase) => {
                const cellItems = roadmapMatrix[phase.key]?.[plat.key] || [];
                return (
                  <div
                    key={phase.key}
                    style={{
                      padding: 10, borderLeft: `1px solid ${tokens.color.border}`,
                      display: 'flex', flexDirection: 'column', gap: 6,
                      background: cellItems.length > 0 ? `${phase.bg}33` : 'transparent',
                    }}
                  >
                    {cellItems.length > 0 ? (
                      cellItems.map((item, idx) => (
                        <ContentItemCard
                          key={item.id || idx}
                          item={item}
                          onClick={openEdit}
                          selectable={isConceptMode}
                          selected={!!item.concept_id && confirmedIds.has(item.concept_id)}
                          onToggle={toggleConfirm}
                          locked={!!item.concept_id && lockedIds.has(item.concept_id)}
                        />
                      ))
                    ) : (
                      <EmptyCell />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}


      {/* ── Transfer Success Toast ── */}
      {showTransferSuccess && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 24px', borderRadius: 14,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', boxShadow: '0 8px 32px rgba(99,102,241,.4)',
          animation: 'slideDown .3s ease',
        }}>
          <CheckCircle2 style={{ width: 20, height: 20, color: '#a5f3fc' }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>콘텐츠 제작으로 이관 완료!</p>
            <p style={{ fontSize: 12, margin: '2px 0 0', opacity: 0.85 }}>
              확정된 컨셉이 콘텐츠 제작 탭으로 전달되었습니다. 잠시 후 이동합니다...
            </p>
          </div>
          <Send style={{ width: 16, height: 16, opacity: 0.7 }} />
        </div>
      )}

      {/* ── Confirm Floating Bar ── */}
      {isConceptMode && confirmedCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 24px', borderRadius: 14,
          background: '#1e293b', color: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,.25)',
        }}>
          <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {confirmedCount}개 / {pdaConcepts.length}개 확정됨
            {lockedCount > 0 && <span style={{ color: '#a5b4fc', marginLeft: 6 }}>({lockedCount}개 이관 잠금)</span>}
          </span>
          {confirmedCount < pdaConcepts.length && (
            <Button
              onClick={handleConfirmAll}
              size="sm"
              variant="outline"
              style={{ borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'transparent', color: '#fff', borderColor: '#475569' }}
            >
              전체 확정
            </Button>
          )}
          {unlocked > 0 && (
            <Button
              onClick={handleLockAndSend}
              size="sm"
              style={{ borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#6366f1', color: '#fff', gap: 4 }}
            >
              <Send style={{ width: 12, height: 12 }} />
              제작으로 넘기기
            </Button>
          )}
          {unlocked > 0 && (
            <Button
              onClick={sharedClearConfirmed}
              size="sm"
              variant="outline"
              style={{ borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'transparent', color: '#94a3b8', borderColor: '#475569' }}
            >
              선택 해제
            </Button>
          )}
          {lockedCount > 0 && unlocked === 0 && (
            <Button
              onClick={() => navigate(`/campaigns/${campaignId}/creative`)}
              size="sm"
              style={{ borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#6366f1', color: '#fff', gap: 4 }}
            >
              <ArrowRight style={{ width: 12, height: 12 }} />
              콘텐츠 제작 보기
            </Button>
          )}
        </div>
      )}

      {/* ── Edit Dialog (Redesigned) ── */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-2xl p-0" style={{ borderRadius: 16, overflow: 'hidden', maxHeight: '90vh' }}>
          {(() => {
            const plan = editItem ? generatePlanDetails(editItem) : {};
            const arcPhase = ARC_PHASES.find((p) => p.key === (editItem?.arc_phase || editItem?.phase));
            const platInfo = PLATFORMS.find((p) => p.key === (editItem?.assigned_platform || editItem?.platform));
            const statusCfg = STATUS_COLORS[editItem?.status] || STATUS_COLORS.draft;
            return (
              <>
                {/* ── Header ── */}
                <div style={{
                  background: arcPhase ? `linear-gradient(135deg, ${arcPhase.color}18 0%, ${arcPhase.bg} 100%)` : 'linear-gradient(135deg, #eef2ff, #f8fafc)',
                  padding: '20px 24px 16px', borderBottom: `1px solid ${tokens.color.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: tokens.color.textSubtle, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>콘텐츠 기획안</p>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: tokens.color.text, margin: 0, lineHeight: 1.3 }}>
                        {editItem?.concept_name || editItem?.title || '(무제)'}
                      </h2>
                    </div>
                    <button onClick={closeEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, color: tokens.color.textSubtle }}>
                      <X style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                  {/* Meta Tags */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    {editItem?.persona_code && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#7c3aed', color: '#fff' }}>{editItem.persona_code}</span>}
                    {editItem?.desire_code && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#d97706', color: '#fff' }}>{editItem.desire_code}</span>}
                    {editItem?.awareness_stage && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>{editItem.awareness_stage}</span>}
                    {editItem?.copy_type && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#dbeafe', color: '#2563eb' }}>{editItem.copy_type}</span>}
                    {editItem?.tone && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#fdf2f8', color: '#db2777' }}>{editItem.tone}</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                    {editItem?.score_total && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: editItem.score_total >= 70 ? '#dcfce7' : '#fef3c7', color: editItem.score_total >= 70 ? '#15803d' : '#d97706', marginLeft: 'auto' }}>
                        적합도 {editItem.score_total}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
                  {/* Row: Channel + Arc Phase */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {/* Channel */}
                    <div style={{ borderRadius: 12, border: `1px solid ${tokens.color.border}`, padding: '14px 16px', background: platInfo?.bg || '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Hash style={{ width: 12, height: 12, color: tokens.color.textSubtle }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: tokens.color.textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em' }}>채널</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {platInfo && <platInfo.Icon style={{ width: 20, height: 20, color: platInfo.color }} />}
                        <span style={{ fontSize: 15, fontWeight: 700, color: platInfo?.color || tokens.color.text }}>{editItem?.assigned_platform || editItem?.platform || '미배정'}</span>
                      </div>
                    </div>
                    {/* Arc Phase */}
                    <div style={{ borderRadius: 12, border: `1px solid ${arcPhase?.border || tokens.color.border}`, padding: '14px 16px', background: arcPhase?.bg || '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Map style={{ width: 12, height: 12, color: tokens.color.textSubtle }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: tokens.color.textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em' }}>서사 아크 단계</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {arcPhase && (
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: arcPhase.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                            {arcPhase.num}
                          </span>
                        )}
                        <span style={{ fontSize: 15, fontWeight: 700, color: arcPhase?.color || tokens.color.text }}>{arcPhase?.name || '미지정'}</span>
                        {arcPhase && <span style={{ fontSize: 11, color: arcPhase.color, opacity: 0.7 }}>({arcPhase.subtitle})</span>}
                        {editItem?.funnel && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: arcPhase?.color || '#6366f1', color: '#fff', marginLeft: 'auto' }}>{editItem.funnel}</span>}
                      </div>
                    </div>
                  </div>

                  {/* ── 기획안 설명 ── */}
                  <div style={{ borderRadius: 12, border: `1px solid ${tokens.color.border}`, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: `1px solid ${tokens.color.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText style={{ width: 14, height: 14, color: '#6366f1' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>기획안 설명</span>
                    </div>

                    {/* Hook */}
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Megaphone style={{ width: 13, height: 13, color: '#dc2626' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>사용 Hook</span>
                        {editItem?.copy_type && (() => {
                          const hookInfo = HOOK_TYPE_MAP[editItem.copy_type];
                          if (!hookInfo) return null;
                          return (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: hookInfo.color + '15', color: hookInfo.color, border: `1px solid ${hookInfo.color}30`, marginLeft: 'auto' }}>
                              {hookInfo.label}
                            </span>
                          );
                        })()}
                      </div>
                      {editItem?.copy_type && HOOK_TYPE_MAP[editItem.copy_type] && (
                        <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 8px', lineHeight: 1.4, padding: '6px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          {HOOK_TYPE_MAP[editItem.copy_type].desc}
                        </p>
                      )}
                      <p style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text, margin: 0, lineHeight: 1.5, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                        {plan.hook || '—'}
                      </p>
                    </div>

                    {/* USP */}
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Target style={{ width: 13, height: 13, color: '#7c3aed' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>노출 USP</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6, padding: '8px 12px', borderRadius: 8, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                        {plan.usp}
                      </p>
                    </div>

                    {/* Core Message */}
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <MessageSquare style={{ width: 13, height: 13, color: '#2563eb' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>핵심 메시지</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                        {plan.coreMessage}
                      </p>
                    </div>

                    {/* Cuts */}
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Film style={{ width: 13, height: 13, color: '#059669' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>주요 컷 구성</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {plan.cuts?.map((cut, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 12px', borderRadius: 6, background: i % 2 === 0 ? '#f0fdf4' : 'transparent' }}>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
                              {i + 1}
                            </span>
                            <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{cut}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scenario Summary */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Sparkles style={{ width: 13, height: 13, color: '#d97706' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>시나리오 요약</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.7, padding: '10px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a' }}>
                        {plan.scenario}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: '14px 24px', borderTop: `1px solid ${tokens.color.border}`, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {editItem?.campaign_placement && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#e0e7ff', color: '#4338ca' }}>{editItem.campaign_placement}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="outline" size="sm" onClick={closeEdit} style={{ borderRadius: 8, fontSize: 12 }}>닫기</Button>
                    {editItem?.concept_id && lockedIds.has(editItem.concept_id) ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#6366f1', padding: '6px 14px', borderRadius: 8, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                        <Lock style={{ width: 12, height: 12 }} /> 콘텐츠 제작 이관됨
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => {
                        if (editItem?.concept_id && !confirmedIds.has(editItem.concept_id)) {
                          toggleConfirm(editItem);
                        }
                        closeEdit();
                      }} style={{ borderRadius: 8, fontSize: 12, fontWeight: 700, gap: 4, background: editItem?.concept_id && confirmedIds.has(editItem.concept_id) ? '#059669' : undefined }}>
                        {editItem?.concept_id && confirmedIds.has(editItem.concept_id) ? (
                          <><CheckCircle2 className="h-3.5 w-3.5" /> 확정 완료</>
                        ) : (
                          <><Check className="h-3.5 w-3.5" /> 컨셉 확정</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* CSS keyframes */}
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

