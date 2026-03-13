import { useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCreatives, useGenerateCreatives, useBulkUpdateCreativeStatus, useGenerateGuide } from '@/hooks/useCreatives';
import { usePDA } from '@/hooks/usePDA';
import { useStrategy } from '@/hooks/useStrategy';
import { useConfirmedConcepts } from '@/hooks/useConfirmedConcepts';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import CreativeCard from '@/components/creative/CreativeCard.jsx';
import HookBank from '@/components/creative/HookBank.jsx';
import BulkActionBar from '@/components/bulk/BulkActionBar.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import {
  Sparkles, Loader2, PackageOpen, ThumbsUp, RefreshCw,
  FileEdit, CheckCircle2, Bot, FilePen, X, Trash2,
  ChevronRight, Film, Image as ImageIcon,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

/* ── Constants ── */
const STATUS_CFG = {
  draft:        { label: '가이드 초안',       color: '#6b7280', bg: '#f9fafb', icon: FileEdit },
  ai_generated: { label: 'AI 이미지/영상 생성',  color: '#2563eb', bg: '#eff6ff', icon: Bot },
  human_edited: { label: '최종 편집',         color: '#d97706', bg: '#fffbeb', icon: FilePen },
  approved:     { label: '완료',             color: '#059669', bg: '#ecfdf5', icon: CheckCircle2 },
};

/* Tab definitions matching 4-step workflow */
const WORKFLOW_TABS = [
  { value: 'draft',        label: '가이드 초안',       statusKey: 'draft' },
  { value: 'ai_generated', label: 'AI 이미지/영상 생성',  statusKey: 'ai_generated' },
  { value: 'human_edited', label: '최종 편집',         statusKey: 'human_edited' },
  { value: 'approved',     label: '완료',             statusKey: 'approved' },
];

const FUNNEL_LIST = [
  { value: 'all', label: '전체' },
  { value: 'TOFU', label: 'TOFU', color: '#0284c7' },
  { value: 'MOFU', label: 'MOFU', color: '#7c3aed' },
  { value: 'BOFU', label: 'BOFU', color: '#059669' },
];

const FORMAT_LIST = [
  { value: 'all', label: '전체 포맷' },
  { value: 'video', label: '영상' },
  { value: 'image', label: '이미지' },
  { value: 'text', label: '텍스트' },
];

/* ── ChipButton ── */
function Chip({ active, label, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 12, fontWeight: 600,
        padding: '4px 14px', borderRadius: 999,
        border: active ? `1.5px solid ${color || tokens.color.text}` : `1px solid ${tokens.color.border}`,
        background: active ? (color ? color + '14' : tokens.color.text + '0a') : tokens.color.surface,
        color: active ? (color || tokens.color.text) : tokens.color.textSubtle,
        cursor: 'pointer', transition: 'all .15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

/* ── Helper: classify format into image or video ── */
function classifyFormat(format) {
  if (!format) return 'other';
  const f = format.toLowerCase();
  if (f.includes('video') || f.includes('reel') || f.includes('short') || f.includes('영상')) return 'video';
  if (f.includes('image') || f.includes('carousel') || f.includes('이미지') || f.includes('photo')) return 'image';
  return 'other';
}

const FORMAT_GROUP_CFG = {
  image: { label: 'AI 이미지 생성', icon: ImageIcon, color: '#7c3aed', bg: '#ede9fe', border: '#7c3aed' },
  video: { label: 'AI 영상 생성',   icon: Film,      color: '#0284c7', bg: '#e0f2fe', border: '#0284c7' },
  other: { label: '기타 포맷',      icon: FileEdit,  color: '#6b7280', bg: '#f3f4f6', border: '#6b7280' },
};

function FormatGroupedGrid({ items, campaignId, isSelected, toggle, personaMap, desireMap, handleDeleteConcept, onGenerateGuide, generatingId, videoStates, onVideoGenerate, onApprove }) {
  const groups = useMemo(() => {
    const map = { image: [], video: [], other: [] };
    items.forEach((c) => {
      const key = classifyFormat(c.format);
      map[key].push(c);
    });
    return map;
  }, [items]);

  const orderedKeys = ['image', 'video', 'other'].filter((k) => groups[k].length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {orderedKeys.map((key) => {
        const cfg = FORMAT_GROUP_CFG[key];
        const Icon = cfg.icon;
        const list = groups[key];
        return (
          <div key={key}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 12, paddingBottom: 8,
              borderBottom: `2px solid ${cfg.border}20`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: cfg.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon style={{ width: 16, height: 16, color: cfg.color }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: cfg.color, margin: 0 }}>
                  {cfg.label}
                </p>
                <p style={{ fontSize: 11, color: tokens.color.textSubtle, margin: 0 }}>
                  {list.length}개 컨셉
                </p>
              </div>
            </div>
            {/* Cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 12,
            }}>
              {list.map((creative) => (
                <CreativeCard
                  key={creative.id}
                  creative={creative}
                  campaignId={campaignId}
                  isSelected={isSelected(creative.id)}
                  onToggleSelect={() => toggle(creative.id)}
                  personaMap={personaMap}
                  desireMap={desireMap}
                  onDelete={creative.concept_id ? () => handleDeleteConcept(creative.concept_id) : undefined}
                  onGenerateGuide={onGenerateGuide}
                  generatingId={generatingId}
                  videoStates={videoStates}
                  onVideoGenerate={onVideoGenerate}
                  onApprove={onApprove}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CreativeList() {
  const { id: campaignId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: creatives, isLoading } = useCreatives(campaignId);
  const { data: pdaData } = usePDA(campaignId);
  const { data: rawStrategy } = useStrategy(campaignId);
  const generateCreatives = useGenerateCreatives();
  const bulkStatusUpdate = useBulkUpdateCreativeStatus();
  const generateGuide = useGenerateGuide();
  const { lockedIds, lockedCount, unlockConcept } = useConfirmedConcepts(campaignId);

  // 카드별 로딩 상태: null | creativeId(loading) | `done-${creativeId}`
  const [generatingId, setGeneratingId] = useState(null);
  // 영상 생성 상태: { [creativeId]: 'generating' | 'done' }
  const [videoStates, setVideoStates] = useState({});

  const handleVideoGenerate = useCallback((creative) => {
    const cId = creative.creative_id || creative.id;
    setVideoStates((prev) => ({ ...prev, [cId]: 'generating' }));
    // 영상 생성 시뮬레이션 (5초)
    setTimeout(() => {
      setVideoStates((prev) => ({ ...prev, [cId]: 'done' }));
    }, 5000);
  }, []);

  const handleGuideGenerate = useCallback((creative) => {
    const cId = creative.creative_id || creative.id;
    if (!campaignId || !cId) return;
    setGeneratingId(cId);
    generateGuide.mutate(
      { campaignId, creativeId: cId, conceptId: creative.concept_id },
      {
        onSuccess: () => {
          setGeneratingId(`done-${cId}`);
          setTimeout(() => setGeneratingId(null), 2500);
        },
        onError: (err) => {
          console.error('[handleGuideGenerate]', err);
          setGeneratingId(null);
        },
      },
    );
  }, [campaignId, generateGuide]);

  // 승인된 전략에서 확정 컨셉 ID 추출 (localStorage 보조 소스)
  const strategyConceptIds = useMemo(() => {
    const strategyKo = rawStrategy?.strategy_ko;
    if (rawStrategy?.status !== 'approved' || !strategyKo?.timing?.phases) return null;
    const ids = new Set();
    strategyKo.timing.phases.forEach((p) => {
      (p.concept_ids || []).forEach((id) => ids.add(id));
      (p.concepts || []).forEach((c) => { if (c.concept_id) ids.add(c.concept_id); });
    });
    return ids.size > 0 ? ids : null;
  }, [rawStrategy]);

  // 실제 사용할 확정 컨셉 ID: localStorage locked > 전략 approved
  const effectiveConceptIds = useMemo(() => {
    if (lockedCount > 0) return lockedIds;
    if (strategyConceptIds) return strategyConceptIds;
    return new Set();
  }, [lockedIds, lockedCount, strategyConceptIds]);

  const effectiveCount = effectiveConceptIds.size;

  // Active workflow tab from URL params (default: draft)
  const activeTab = searchParams.get('tab') || 'draft';
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });

  const [funnelFilter, setFunnelFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');

  const allCreatives = Array.isArray(creatives) ? creatives : [];
  const pdaConcepts = pdaData?.concepts || [];

  // 확정 컨셉을 모두 표시: 크리에이티브 매칭 + PDA 컨셉 폴백
  const items = useMemo(() => {
    if (effectiveCount === 0) return allCreatives;

    const creativeByConceptId = {};
    allCreatives.forEach((c) => {
      if (c.concept_id) creativeByConceptId[c.concept_id] = c;
    });

    const result = [];
    const usedConceptIds = new Set();

    // 1) 확정 컨셉에 매칭되는 크리에이티브 추가
    effectiveConceptIds.forEach((cid) => {
      if (creativeByConceptId[cid]) {
        result.push(creativeByConceptId[cid]);
        usedConceptIds.add(cid);
      }
    });

    // 2) 크리에이티브 없는 확정 컨셉은 PDA에서 폴백 카드 생성
    effectiveConceptIds.forEach((cid) => {
      if (usedConceptIds.has(cid)) return;
      const concept = pdaConcepts.find((c) => c.concept_id === cid);
      if (concept) {
        result.push({
          id: `concept-${cid}`,
          creative_id: null,
          concept_id: cid,
          concept_name: concept.concept_name,
          copy_text: concept.head_copy || '',
          copy_variants: [],
          status: 'draft',
          funnel: concept.funnel,
          format: concept.format,
          persona_code: concept.persona_code,
          desire_code: concept.desire_code,
          campaign_placement: concept.campaign_placement,
          copy_type: concept.copy_type,
          _fromConcept: true,
        });
      }
    });

    return result;
  }, [allCreatives, pdaConcepts, effectiveConceptIds, effectiveCount]);

  const personaMap = useMemo(() => {
    const m = {};
    (pdaData?.personas || []).forEach((p) => { if (p.code) m[p.code] = p.name; });
    return m;
  }, [pdaData]);

  const desireMap = useMemo(() => {
    const m = {};
    (pdaData?.desires || []).forEach((d) => { if (d.code) m[d.code] = d.name; });
    return m;
  }, [pdaData]);

  /* Status counts */
  const statusCounts = useMemo(() => {
    const counts = { draft: 0, ai_generated: 0, human_edited: 0, approved: 0 };
    items.forEach((c) => { if (counts[c.status] !== undefined) counts[c.status]++; });
    return counts;
  }, [items]);

  /* Filtering: always filter by activeTab status + optional funnel/format */
  const filtered = useMemo(() => items.filter((c) => {
    if (c.status !== activeTab) return false;
    if (funnelFilter !== 'all' && c.funnel !== funnelFilter) return false;
    if (formatFilter !== 'all') {
      const fmt = (c.format || '').toLowerCase();
      if (formatFilter === 'video' && !fmt.includes('video') && !fmt.includes('reel') && !fmt.includes('short')) return false;
      if (formatFilter === 'image' && !fmt.includes('image') && !fmt.includes('carousel')) return false;
      if (formatFilter === 'text' && !fmt.includes('text')) return false;
    }
    return true;
  }), [items, activeTab, funnelFilter, formatFilter]);

  const { selectedIds, isSelected, toggle, toggleAll, clearSelection, isAllSelected, selectedCount } =
    useBulkSelection(filtered, 'id');

  const hasActiveFilters = funnelFilter !== 'all' || formatFilter !== 'all';

  const handleGenerate = () => {
    const conceptIds = effectiveCount > 0 ? [...effectiveConceptIds] : undefined;
    generateCreatives.mutate({ campaignId, conceptIds });
  };
  const handleBulkApprove = () => {
    bulkStatusUpdate.mutate(
      { campaignId, creativeIds: [...selectedIds], status: 'approved' },
      { onSuccess: clearSelection },
    );
  };
  const handleBulkStatusChange = (status) => {
    bulkStatusUpdate.mutate(
      { campaignId, creativeIds: [...selectedIds], status },
      { onSuccess: clearSelection },
    );
  };

  const handleDeleteConcept = (conceptId) => {
    unlockConcept(conceptId);
  };

  const handleApproveCard = (creative) => {
    const cId = creative.creative_id || creative.id;
    bulkStatusUpdate.mutate({ campaignId, creativeIds: [cId], status: 'approved' });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 style={{ width: 32, height: 32, color: tokens.color.textSubtle, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentTabCfg = STATUS_CFG[activeTab] || STATUS_CFG.draft;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 64 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>콘텐츠 시딩 가이드 제작</h1>
          <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 2 }}>
            {effectiveCount > 0
              ? `콘텐츠 기획에서 확정된 ${effectiveCount}개 컨셉의 시딩 가이드를 제작합니다`
              : 'PDA 컨셉 기반 시딩 가이드를 생성·관리합니다'}
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generateCreatives.isPending} className="gap-2"
          style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {generateCreatives.isPending
            ? <Loader2 className="size-4 animate-spin" />
            : <Sparkles className="size-4" />}
          {generateCreatives.isPending ? '생성 중...' : 'AI 크리에이티브 생성'}
        </Button>
      </div>

      {/* ── Concepts from Content Plan Banner ── */}
      {effectiveCount > 0 && (
        <div style={{
          borderRadius: 12, padding: '14px 20px',
          background: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)',
          border: '1px solid #c7d2fe',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#4338ca', margin: 0 }}>
                콘텐츠 기획에서 확정된 컨셉 {effectiveCount}개
              </p>
              <p style={{ fontSize: 11, color: '#6366f1', margin: '2px 0 0' }}>
                {lockedCount > 0
                  ? '콘텐츠 기획 탭에서 이관된 확정 컨셉입니다. AI 크리에이티브를 생성하여 시딩 가이드를 완성하세요.'
                  : '승인된 전략의 확정 컨셉입니다. 콘텐츠 기획 탭에서 "제작으로 넘기기"를 진행하면 잠금 처리됩니다.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 22, fontWeight: 900, color: '#6366f1', lineHeight: 1,
            }}>{effectiveCount}</span>
            <span style={{ fontSize: 10, color: '#8b5cf6' }}>컨셉</span>
          </div>
        </div>
      )}

      {/* ── 4-Step Workflow Tabs ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surfaceMuted,
      }}>
        {WORKFLOW_TABS.map((tab, idx) => {
          const cfg = STATUS_CFG[tab.statusKey];
          const Icon = cfg.icon;
          const count = statusCounts[tab.statusKey] || 0;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px 10px',
                background: isActive ? cfg.bg : 'transparent',
                borderBottom: isActive ? `3px solid ${cfg.color}` : '3px solid transparent',
                cursor: 'pointer', transition: 'all .15s',
                position: 'relative',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: isActive ? cfg.color + '20' : tokens.color.border + '60',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon style={{ width: 13, height: 13, color: isActive ? cfg.color : tokens.color.textSubtle }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  color: isActive ? cfg.color : tokens.color.textSubtle,
                  margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap',
                }}>
                  {tab.label}
                </p>
                <p style={{
                  fontSize: 10, color: isActive ? cfg.color : tokens.color.textSubtle,
                  margin: 0, opacity: 0.7,
                }}>
                  {count}개
                </p>
              </div>
              {/* Arrow connector between tabs */}
              {idx < WORKFLOW_TABS.length - 1 && (
                <ChevronRight style={{
                  position: 'absolute', right: -7, zIndex: 1,
                  width: 14, height: 14, color: tokens.color.border,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filters: Funnel Chips + Format Chips ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '10px 14px', borderRadius: 10,
        background: tokens.color.surfaceMuted,
        border: `1px solid ${tokens.color.border}`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>퍼널</span>
        {FUNNEL_LIST.map((f) => (
          <Chip
            key={f.value}
            active={funnelFilter === f.value}
            label={f.label}
            color={f.color}
            onClick={() => setFunnelFilter(funnelFilter === f.value && f.value !== 'all' ? 'all' : f.value)}
          />
        ))}

        <div style={{ width: 1, height: 20, background: tokens.color.border }} />

        <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>포맷</span>
        {FORMAT_LIST.map((f) => (
          <Chip
            key={f.value}
            active={formatFilter === f.value}
            label={f.label}
            onClick={() => setFormatFilter(formatFilter === f.value && f.value !== 'all' ? 'all' : f.value)}
          />
        ))}

        {hasActiveFilters && (
          <>
            <div style={{ width: 1, height: 20, background: tokens.color.border }} />
            <button
              type="button"
              onClick={() => { setFunnelFilter('all'); setFormatFilter('all'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle,
                padding: '3px 10px', borderRadius: 999,
                border: `1px solid ${tokens.color.border}`, background: tokens.color.surface,
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 11, height: 11 }} />
              초기화
            </button>
          </>
        )}
      </div>

      {/* ── Select all + count ── */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={toggleAll}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: 4,
                border: isAllSelected ? '2px solid #6366f1' : `2px solid ${tokens.color.border}`,
                background: isAllSelected ? '#6366f1' : '#fff',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {isAllSelected && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span style={{ fontSize: 12, color: tokens.color.textSubtle }}>
              전체 선택 ({filtered.length}개)
            </span>
          </div>
          <span style={{ fontSize: 12, color: tokens.color.textSubtle }}>
            총 {items.length}개 컨셉
          </span>
        </div>
      )}

      {/* ── Grid or Empty ── */}
      {filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '60px 20px', color: tokens.color.textSubtle,
          borderRadius: 14, border: `2px dashed ${tokens.color.border}`,
        }}>
          <PackageOpen style={{ width: 40, height: 40, marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
            {effectiveCount === 0
              ? '시딩 가이드가 없습니다'
              : `${currentTabCfg.label} 단계의 컨셉이 없습니다`}
          </p>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            {effectiveCount === 0
              ? '콘텐츠 기획에서 컨셉을 확정하고 "콘텐츠 제작으로 넘기기"를 먼저 진행해주세요'
              : activeTab === 'draft'
                ? 'AI 크리에이티브 생성 버튼을 클릭하여 가이드를 생성해주세요'
                : '이전 단계에서 승인된 컨셉이 이 단계로 이동합니다'}
          </p>
        </div>
      ) : activeTab === 'ai_generated' ? (
        /* ── AI 레퍼런스 생성 탭: 이미지/영상 포맷별 그룹 ── */
        <FormatGroupedGrid
          items={filtered}
          campaignId={campaignId}
          isSelected={isSelected}
          toggle={toggle}
          personaMap={personaMap}
          desireMap={desireMap}
          handleDeleteConcept={handleDeleteConcept}
          onGenerateGuide={handleGuideGenerate}
          generatingId={generatingId}
          videoStates={videoStates}
          onVideoGenerate={handleVideoGenerate}
          onApprove={handleApproveCard}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 12,
        }}>
          {filtered.map((creative) => (
            <CreativeCard
              key={creative.id}
              creative={creative}
              campaignId={campaignId}
              isSelected={isSelected(creative.id)}
              onToggleSelect={() => toggle(creative.id)}
              personaMap={personaMap}
              desireMap={desireMap}
              onDelete={creative.concept_id ? () => handleDeleteConcept(creative.concept_id) : undefined}
              onGenerateGuide={handleGuideGenerate}
              generatingId={generatingId}
              onApprove={handleApproveCard}
            />
          ))}
        </div>
      )}

      {/* ── Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        actions={[
          {
            label: '일괄 승인',
            icon: <ThumbsUp className="size-3.5" />,
            onClick: handleBulkApprove,
            disabled: bulkStatusUpdate.isPending,
          },
          {
            label: '상태 변경',
            icon: <RefreshCw className="size-3.5" />,
            onClick: () => handleBulkStatusChange('human_edited'),
            variant: 'outline',
            disabled: bulkStatusUpdate.isPending,
          },
        ]}
      />

    </div>
  );
}
