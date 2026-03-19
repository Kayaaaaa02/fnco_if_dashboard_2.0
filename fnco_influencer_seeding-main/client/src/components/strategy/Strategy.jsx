import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useStrategy,
  useStrategyHistory,
  useGenerateStrategy,
  useUpdateStrategy,
  useApproveStrategy,
} from '@/hooks/useStrategy';
import { usePDA } from '@/hooks/usePDA';
import { useNarrativeArc } from '@/hooks/useNarrativeArc.js';
import { useCampaign } from '@/hooks/useCampaign.js';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import {
  Sparkles,
  Loader2,
  Pencil,
  Check,
  X,
  Megaphone,
  MessageSquare,
  PieChart,
  Target,
  History,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StrategyApproval from '@/components/strategy/StrategyApproval.jsx';
import NarrativeArc from '@/components/strategy/NarrativeArc.jsx';
import AlignmentCheck from '@/components/strategy/AlignmentCheck.jsx';
import { assignConceptsToChannels, getChannelSummary, getFunnelFitMatrix } from '@/lib/channelScoring.js';

const STATUS_LABELS = {
  draft: { label: '초안', color: '#d97706', bg: '#fef3c7' },
  approved: { label: '승인됨', color: '#15803d', bg: '#dcfce7' },
};

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];


export default function Strategy({ initialApprovalOpen = false }) {
  const { id: campaignId } = useParams();
  const { data: rawStrategy, isLoading } = useStrategy(campaignId);
  const { data: campaignData } = useCampaign(campaignId);
  const { data: historyData } = useStrategyHistory(campaignId);
  const { data: pdaData } = usePDA(campaignId);
  const { data: arcData } = useNarrativeArc(campaignId);
  const generateStrategy = useGenerateStrategy();
  const updateStrategy = useUpdateStrategy();
  const approveStrategy = useApproveStrategy();

  // strategy_ko JSON을 최상위로 펼치고, 필드명 정규화
  const strategy = rawStrategy ? {
    ...rawStrategy,
    ...(rawStrategy.strategy_ko || {}),
    // 필드명 호환: budget_allocation → budget, kpi_targets → kpis
    budget: rawStrategy.strategy_ko?.budget_allocation || rawStrategy.strategy_ko?.budget || rawStrategy.budget,
    kpis: rawStrategy.strategy_ko?.kpi_targets || rawStrategy.strategy_ko?.kpis || rawStrategy.kpis,
  } : null;

  const [editingSection, setEditingSection] = useState(null);
  const [sectionDraft, setSectionDraft] = useState({});
  const [showApproval, setShowApproval] = useState(initialApprovalOpen);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const history = historyData || [];
  const status = strategy?.status || 'draft';
  const version = strategy?.version || 1;
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.draft;

  const isGenerating = generateStrategy.isPending;

  const startEditing = (section) => {
    setEditingSection(section);
    setSectionDraft({ ...strategy?.[section] });
  };
  const cancelEditing = () => { setEditingSection(null); setSectionDraft({}); };
  const saveSection = (section) => {
    updateStrategy.mutate({ campaignId, data: { [section]: sectionDraft } });
    setEditingSection(null);
    setSectionDraft({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const hasStrategy = strategy?.channels || strategy?.messaging || strategy?.timing || strategy?.budget || strategy?.kpis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>캠페인 전략</h1>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: tokens.color.surfaceMuted, color: tokens.color.textSubtle,
            }}>v{version}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 6,
              background: statusInfo.bg, color: statusInfo.color,
            }}>{statusInfo.label}</span>
          </div>
          <p style={{ fontSize: 12, color: tokens.color.textSubtle }}>
            PDA 프레임워크 기반으로 채널·메시징·타이밍·예산을 설계합니다
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {history.length > 1 && (
            <Select value={selectedVersion?.toString() || ''} onValueChange={(v) => setSelectedVersion(Number(v))}>
              <SelectTrigger className="h-9 w-36 text-xs gap-1">
                <History className="h-3.5 w-3.5" />
                <SelectValue placeholder="버전 이력" />
              </SelectTrigger>
              <SelectContent>
                {history.map((h) => (
                  <SelectItem key={h.version} value={h.version.toString()}>
                    v{h.version} — {h.created_at ? new Date(h.created_at).toLocaleDateString('ko-KR') : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => generateStrategy.mutate({ campaignId })} disabled={isGenerating} className="gap-2" style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'AI 분석 중...' : 'AI 전략 생성'}
          </Button>
          {status === 'draft' && strategy && (
            <Button
              variant="outline"
              className="gap-2"
              style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, borderColor: '#86efac', color: '#15803d' }}
              onClick={() => setShowApproval(true)}
            >
              <ShieldCheck className="h-4 w-4" />
              승인
            </Button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {!hasStrategy ? (
        <div style={{
          borderRadius: 14, border: `2px dashed ${tokens.color.border}`,
          padding: '48px 20px', textAlign: 'center', color: tokens.color.textSubtle,
        }}>
          <Sparkles style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: 16, fontWeight: 500 }}>전략이 아직 생성되지 않았습니다</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>위의 "AI 전략 생성" 버튼을 클릭하여 마케팅 전략을 자동 생성하세요</p>
        </div>
      ) : (
        <>
          {/* ①  KPI 목표 — 최상단 대시보드 */}
          <KPISection
            kpis={strategy?.kpis}
            isEditing={editingSection === 'kpis'}
            onEdit={() => startEditing('kpis')}
            onSave={() => saveSection('kpis')}
            onCancel={cancelEditing}
            draft={sectionDraft}
            onDraftChange={setSectionDraft}
            status={status}
          />

          {/* ② 채널 + 메시징 2열 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StrategySection
              icon={<Megaphone style={{ width: 16, height: 16, color: '#6366f1' }} />}
              title="채널 전략"
              tooltip={"콘텐츠는 어떻게 배분되나요?\n\n고객의 미디어 소비 패턴과 현재 마케팅 목표를 분석해 채널을 결정합니다.\n\n1. 고객이 좋아하는 채널\n페르소나가 가장 많이 활동하는 1, 2순위 채널 중심\n\n2. 단계별 최적 채널\n'제품 인지(TOFU)', '고려(MOFU)', '구매 전환 유도(BOFU)' 등 각 목적에 가장 효과적인 채널 가중치 부여"}
              isEditing={editingSection === 'channels'}
              onEdit={() => startEditing('channels')}
              onSave={() => saveSection('channels')}
              onCancel={cancelEditing}
              status={status}
            >
              {editingSection === 'channels'
                ? <ChannelsEditor draft={sectionDraft} onChange={setSectionDraft} />
                : <ChannelsDisplay channels={strategy?.channels} pdaData={pdaData} />}
            </StrategySection>

            <StrategySection
              icon={<MessageSquare style={{ width: 16, height: 16, color: '#8b5cf6' }} />}
              title="메시징 전략"
              tooltip="PDA 매트릭스의 인지 단계별로 핵심 메시지와 톤을 설계합니다. Problem→Solution→Product→Most Aware 순으로 메시지가 진화합니다."
              isEditing={editingSection === 'messaging'}
              onEdit={() => startEditing('messaging')}
              onSave={() => saveSection('messaging')}
              onCancel={cancelEditing}
              status={status}
            >
              {editingSection === 'messaging'
                ? <MessagingEditor draft={sectionDraft} onChange={setSectionDraft} />
                : <MessagingDisplay messaging={strategy?.messaging} />}
            </StrategySection>
          </div>

          {/* ③ 론칭 서사 아크 (인지단계 + 타이밍 통합) */}
          <NarrativeArc />

          {/* ⑤ 채널별 시딩 예산 */}
          <StrategySection
            icon={<PieChart style={{ width: 16, height: 16, color: '#d97706' }} />}
            title="채널별 시딩 비중 제안"
            tooltip="YouTube·Instagram·TikTok 3개 채널에 인플루언서 시딩 예산을 어떻게 배분할지 AI가 제안합니다. 카테고리 특성·퍼널 단계·콘텐츠 수명을 종합 분석합니다."
            isEditing={editingSection === 'budget'}
            onEdit={() => startEditing('budget')}
            onSave={() => saveSection('budget')}
            onCancel={cancelEditing}
            status={status}
          >
            {editingSection === 'budget'
              ? <BudgetEditor draft={sectionDraft} onChange={setSectionDraft} />
              : <BudgetDisplay budget={strategy?.budget} />}
          </StrategySection>

          {/* ⑥ 전략 정합성 체크 */}
          <AlignmentCheck />
        </>
      )}

      {/* Approval Dialog */}
      <StrategyApproval
        open={showApproval}
        onOpenChange={setShowApproval}
        strategy={strategy}
        narrativeArc={arcData}
        onApprove={() => { approveStrategy.mutate(campaignId); setShowApproval(false); }}
        isPending={approveStrategy.isPending}
      />
    </div>
  );
}

/* ─── Section Wrapper ────────────────────────────────── */
function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  if (!text) return null;
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info style={{ width: 13, height: 13, color: tokens.color.textSubtle, cursor: 'help' }} />
      {show && (
        <span style={{
          position: 'absolute', left: '50%', bottom: 'calc(100% + 6px)', transform: 'translateX(-50%)',
          width: 360, padding: '10px 14px', borderRadius: 10,
          background: '#1e293b', color: '#fff',
          fontSize: 11, lineHeight: 1.6, fontWeight: 400,
          fontFamily: "'Pretendard', monospace",
          pointerEvents: 'none',
          zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,.3)',
          whiteSpace: 'pre-wrap',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

function StrategySection({ icon, title, tooltip, isEditing, onEdit, onSave, onCancel, status, children }) {
  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface, boxShadow: tokens.shadow.card,
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: `1px solid ${tokens.color.border}`,
        background: tokens.color.surfaceMuted,
        borderRadius: '14px 14px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{title}</span>
          <InfoTooltip text={tooltip} />
        </div>
        {status === 'draft' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isEditing ? (
              <>
                <SectionBtn onClick={onSave} color={tokens.color.success} label="저장" icon={<Check style={{ width: 13, height: 13 }} />} />
                <SectionBtn onClick={onCancel} color={tokens.color.textSubtle} label="취소" icon={<X style={{ width: 13, height: 13 }} />} />
              </>
            ) : (
              <SectionBtn onClick={onEdit} color={tokens.color.textSubtle} label="편집" icon={<Pencil style={{ width: 13, height: 13 }} />} />
            )}
          </div>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '16px 18px' }}>
        {children}
      </div>
    </div>
  );
}

function SectionBtn({ onClick, color, label, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        height: 26, padding: '0 10px', borderRadius: 6,
        border: `1px solid ${tokens.color.border}`, background: tokens.color.surface,
        fontSize: 11, fontWeight: 600, color, cursor: 'pointer',
      }}
    >
      {icon}{label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   ① KPI 대시보드 (최상단)
   ═══════════════════════════════════════════════════════ */
// DB에 저장된 구 명칭 → 신 명칭 매핑
const KPI_NAME_MAP = { '도달': '평균 조회수', '총 조회수': '평균 조회수', 'UGC 수': '컨텐츠 수', '참여율': '인게이지먼트율', 'CPE': '평균 좋아요 수' };
const normalizeKpiName = (name) => KPI_NAME_MAP[name] || name;

function KPISection({ kpis, isEditing, onEdit, onSave, onCancel, draft, onDraftChange, status }) {
  const rawItems = kpis?.items || kpis?.metrics || [];
  const items = rawItems
    .map((item) => ({ ...item, name: normalizeKpiName(item.name || item.metric) }))
    .filter((item) => item.name !== 'ROAS');
  const hasKpis = Array.isArray(items) && items.length > 0;

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface, boxShadow: tokens.shadow.card,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: `1px solid ${tokens.color.border}`,
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)',
        borderRadius: '14px 14px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target style={{ width: 16, height: 16, color: '#4f46e5' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>KPI 목표</span>
          <InfoTooltip text="PDA 확정 컨셉 수 기반으로 자동 산출됩니다. 평균 조회수 = 3개월 평균 조회수(116,244회) 대비 120% → 140,000회, 인게이지먼트율 = 3개월 평균(2.18%) 대비 120% → 2.62%, 평균 좋아요 수 = 3개월 평균(845회) 대비 120% → 1,014회, 컨텐츠 수 = 3개월 월 평균(17건) 대비 120% → 20건. *3개월 평균은 예산 규모가 비슷한 캠페인들의 평균 값입니다." />
          {hasKpis && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 999, background: '#e0e7ff', color: '#4338ca' }}>
              {items.length}개 지표
            </span>
          )}
        </div>
        {status === 'draft' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isEditing ? (
              <>
                <SectionBtn onClick={onSave} color={tokens.color.success} label="저장" icon={<Check style={{ width: 13, height: 13 }} />} />
                <SectionBtn onClick={onCancel} color={tokens.color.textSubtle} label="취소" icon={<X style={{ width: 13, height: 13 }} />} />
              </>
            ) : (
              <SectionBtn onClick={onEdit} color={tokens.color.textSubtle} label="편집" icon={<Pencil style={{ width: 13, height: 13 }} />} />
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px' }}>
        {isEditing ? (
          <KPIsEditor draft={draft} onChange={onDraftChange} />
        ) : !hasKpis ? (
          <p style={{ fontSize: 13, color: tokens.color.textSubtle }}>KPI 목표가 설정되지 않았습니다</p>
        ) : (
          <KPIsDashboard items={items} />
        )}
      </div>
    </div>
  );
}

const KPI_FORMULAS = {
  '평균 조회수': '3개월 평균 조회수 대비 120% 목표',
  '인게이지먼트율': '3개월 평균 인게이지먼트율 대비 120% 목표',
  '평균 좋아요 수': '3개월 평균 좋아요 수 대비 120% 목표',
  '컨텐츠 수': '3개월 월 평균 업로드 건수 대비 120% 목표',
};

function KPIBarLabel({ x, y, width, value }) {
  return (
    <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#374151">
      {value.toLocaleString()}
    </text>
  );
}

function KPIsDashboard({ items }) {
  // 3개월 평균 대비 비교용 데이터 — 정규화(3개월 평균=100 기준)하여 스케일 통일
  const barData = items.map((kpi) => {
    const current = kpi.current || 0;
    const avg3m = kpi.avg3m || 0;
    const diff = avg3m > 0 ? Math.round(((current - avg3m) / avg3m) * 100) : 0;
    return {
      name: kpi.name || kpi.metric,
      '3개월 평균': avg3m > 0 ? 100 : 0,
      '현재 캠페인': avg3m > 0 ? Math.round((current / avg3m) * 100) : 0,
      rawCurrent: current,
      rawAvg3m: avg3m,
      diff,
      unit: kpi.unit || '',
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, 1fr)`, gap: 12 }}>
        {items.map((kpi, idx) => {
          const target = kpi.target || kpi.goal || 0;
          const current = kpi.current || 0;
          const avg3m = kpi.avg3m || 0;
          const pct = target > 0 ? Math.round((current / target) * 100) : 0;
          const diff = avg3m > 0 ? Math.round(((current - avg3m) / avg3m) * 100) : 0;
          const isUp = diff > 0;
          const isFlat = diff === 0;
          const trendColor = isUp ? '#15803d' : isFlat ? '#d97706' : '#dc2626';
          const trendBg = isUp ? '#f0fdf4' : isFlat ? '#fffbeb' : '#fef2f2';
          const TrendIcon = isUp ? TrendingUp : isFlat ? Minus : TrendingDown;

          return (
            <div key={idx} style={{
              borderRadius: 12, border: `1px solid ${tokens.color.border}`,
              padding: '14px 16px', position: 'relative',
            }}>
              {/* Progress bar background */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                width: `${Math.min(pct, 100)}%`, height: 3,
                background: trendColor, opacity: 0.6,
                borderRadius: pct >= 100 ? '0 0 12px 12px' : '0 2px 0 12px',
                transition: 'width .4s ease',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, lineHeight: 1.2 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle, margin: 0 }}>
                  {kpi.name || kpi.metric}
                </p>
                {KPI_FORMULAS[kpi.name || kpi.metric] && (
                  <InfoTooltip text={`산출식: ${KPI_FORMULAS[kpi.name || kpi.metric]}`} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: tokens.color.text, lineHeight: 1 }}>
                  {current.toLocaleString()}
                </span>
                {kpi.unit && (
                  <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>{kpi.unit}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: tokens.color.textSubtle }}>
                  3개월 평균 {avg3m.toLocaleString()}{kpi.unit || ''}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                  background: trendBg, color: trendColor,
                }}>
                  <TrendIcon style={{ width: 10, height: 10 }} />
                  {isUp ? '+' : ''}{diff}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar Chart — 3개월 평균 vs 현재 캠페인 (정규화 비교) */}
      {barData.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: tokens.color.textSubtle }}>3개월 캠페인 평균 대비 현재 KPI 비교</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: tokens.color.textSubtle }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#c7d2fe' }} />3개월 평균
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#6366f1', marginLeft: 6 }} />현재
            </span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={2} barCategoryGap="20%" margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={tokens.color.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: tokens.color.textSubtle }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tokens.color.textSubtle }} axisLine={false} tickLine={false} domain={[0, (max) => Math.ceil(max / 10) * 10 + 10]} hide />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${tokens.color.border}` }}
                  formatter={(value, name, props) => {
                    const d = props.payload;
                    if (name === '3개월 평균') return [`${d.rawAvg3m.toLocaleString()}${d.unit}`, '3개월 평균'];
                    return [`${d.rawCurrent.toLocaleString()}${d.unit} (${d.diff >= 0 ? '+' : ''}${d.diff}%)`, '현재 캠페인'];
                  }}
                />
                <Bar dataKey="3개월 평균" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="현재 캠페인" radius={[4, 4, 0, 0]} label={<KPIBarLabel />}>
                  {barData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.diff >= 0 ? '#6366f1' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function KPIsEditor({ draft, onChange }) {
  const items = draft?.items || draft?.metrics || (Array.isArray(draft) ? draft : []);
  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: field === 'target' ? Number(value) || 0 : value };
    onChange({ ...draft, items: updated });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((kpi, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input value={kpi.name || kpi.metric || ''} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="h-8 text-sm flex-1" placeholder="KPI 이름" />
          <Input type="number" value={kpi.target || kpi.goal || ''} onChange={(e) => updateItem(idx, 'target', e.target.value)} className="h-8 text-sm w-28" placeholder="목표" />
          <Input value={kpi.unit || ''} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="h-8 text-sm w-20" placeholder="단위" />
        </div>
      ))}
    </div>
  );
}

/* ─── 퍼널 × 채널 적합도 매트릭스 토글 ──────────────────── */
function FunnelMatrixToggle({ funnelMatrix }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 10, border: `1px solid ${tokens.color.border}`,
      overflow: 'hidden', marginTop: 4,
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: tokens.color.surfaceMuted,
          border: 'none', cursor: 'pointer',
          borderBottom: open ? `1px solid ${tokens.color.border}` : 'none',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: tokens.color.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          퍼널 × 채널 적합도 매트릭스
        </span>
        <span style={{ fontSize: 11, color: tokens.color.textSubtle, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>
      {open && (
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: tokens.color.textSubtle, borderBottom: `1px solid ${tokens.color.border}` }}>퍼널</th>
              {['TikTok', 'Instagram', 'YouTube'].map((p) => (
                <th key={p} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: tokens.color.text, borderBottom: `1px solid ${tokens.color.border}` }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(funnelMatrix).map(([funnel, scores]) => (
              <tr key={funnel}>
                <td style={{ padding: '6px 10px', fontWeight: 600, color: '#475569' }}>
                  {funnel} ({FUNNEL_LABELS[funnel]})
                </td>
                {['TikTok', 'Instagram', 'YouTube'].map((p) => {
                  const score = scores[p];
                  const stars = score >= 1.0 ? '★★★' : score >= 0.7 ? '★★' : '★';
                  const starColor = score >= 1.0 ? '#f59e0b' : score >= 0.7 ? '#94a3b8' : '#cbd5e1';
                  return (
                    <td key={p} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: starColor }}>
                      {stars}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ─── Channel Display & Editor ───────────────────────── */
const CHANNEL_META = {
  Instagram: {
    color: '#db2777', bg: '#fdf2f8', icon: '📸',
    strengths: ['높은 참여율', 'Reels/Carousel 포맷', '비주얼 중심 브랜딩'],
    role: 'MOFU 주력 — 참여·비교·소셜프루프 콘텐츠',
    defaultFunnel: { TOFU: 3, MOFU: 3, BOFU: 2 }, defaultCount: 8, defaultRatio: 32,
  },
  TikTok: {
    color: '#0f172a', bg: '#f1f5f9', icon: '🎵',
    strengths: ['바이럴 도달력', '숏폼 공감 콘텐츠', 'Z세대 접점'],
    role: 'TOFU 주력 — 바이럴 인지·공감 콘텐츠',
    defaultFunnel: { TOFU: 3, MOFU: 3, BOFU: 1 }, defaultCount: 7, defaultRatio: 28,
  },
  YouTube: {
    color: '#dc2626', bg: '#fef2f2', icon: '▶️',
    strengths: ['긴 시청 시간', '전문 리뷰·교육', '높은 신뢰도'],
    role: 'BOFU 주력 — 리뷰·전환·신뢰 구축 콘텐츠',
    defaultFunnel: { BOFU: 4, TOFU: 3, MOFU: 3 }, defaultCount: 10, defaultRatio: 40,
    subFormats: [
      { name: 'Video', ratio: 60, desc: '심층 리뷰·언박싱·비교 분석 (5~15분)', color: '#dc2626' },
      { name: 'Shorts', ratio: 40, desc: '티저·하이라이트·숏폼 바이럴 (60초 이내)', color: '#f97316' },
    ],
  },
};
const FUNNEL_LABELS = { TOFU: '인지', MOFU: '고려', BOFU: '전환' };
const PRIORITY_LABELS = ['최상', '상', '중'];

function ChannelsDisplay({ channels, pdaData }) {
  const items = channels?.items || channels || [];
  const concepts = pdaData?.concepts?.filter((c) => c.status === 'active') || [];
  const personas = pdaData?.personas || [];

  // 스코어링 기반 채널 분석
  const scored = assignConceptsToChannels(concepts, personas);
  const scoredSummary = getChannelSummary(scored);
  const funnelMatrix = getFunnelFitMatrix();
  const hasScoringData = scored.length > 0;

  // 스코어링 데이터가 없으면 기본 메타 기반 요약 생성
  const summary = hasScoringData
    ? scoredSummary
    : ['YouTube', 'Instagram', 'TikTok'].map((p) => {
        const meta = CHANNEL_META[p];
        return {
          channel: p, count: meta.defaultCount, ratio: meta.defaultRatio,
          funnelDist: meta.defaultFunnel, ...meta,
        };
      });

  if (summary.length === 0 && (!Array.isArray(items) || items.length === 0)) {
    return <p style={{ fontSize: 13, color: tokens.color.textSubtle }}>채널 전략이 설정되지 않았습니다</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 배분 근거 뱃지 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        borderRadius: 8, background: '#eef2ff', border: '1px solid #c7d2fe',
      }}>
        <span style={{ fontSize: 10 }}>🧠</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#4338ca' }}>
          2단계 스코어링: 페르소나 선호(60%) + 퍼널 적합도(40%)
        </span>
      </div>

      {/* 채널별 카드 */}
      {summary.map((ch, idx) => {
        const meta = CHANNEL_META[ch.channel] || {};
        const color = ch.color || meta.color || '#64748b';
        const bg = ch.bg || meta.bg || '#f8fafc';
        const icon = meta.icon || '';
        const role = ch.role || meta.role || '';
        const strengths = ch.strengths || meta.strengths || [];
        const funnelDist = ch.funnelDist || meta.defaultFunnel || {};

        return (
          <div key={ch.channel} style={{
            borderRadius: 12, border: `1.5px solid ${color}30`, background: bg + '80',
            padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color }}>{ch.channel}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: color, color: '#fff',
                }}>
                  {ch.count}개 컨셉 · {ch.ratio}%
                </span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                border: `1px solid ${tokens.color.border}`, color: tokens.color.textSubtle,
              }}>
                {PRIORITY_LABELS[idx] || '중'}
              </span>
            </div>

            {/* Role */}
            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>{role}</p>

            {/* 퍼널 분포 바 */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {Object.entries(funnelDist).map(([funnel, count]) => (
                <span key={funnel} style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                  background: funnel === 'TOFU' ? '#ede9fe' : funnel === 'MOFU' ? '#dbeafe' : '#fef3c7',
                  color: funnel === 'TOFU' ? '#7c3aed' : funnel === 'MOFU' ? '#2563eb' : '#d97706',
                }}>
                  {FUNNEL_LABELS[funnel] || funnel} {count}개
                </span>
              ))}
            </div>

            {/* 강점 태그 */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {strengths.map((s, i) => (
                <span key={i} style={{
                  fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                  background: '#fff', color: '#64748b', border: `1px solid ${tokens.color.border}`,
                }}>
                  {s}
                </span>
              ))}
            </div>

            {/* YouTube 서브 포맷 (Video / Shorts) */}
            {meta.subFormats && (
              <div style={{
                display: 'flex', gap: 8, marginTop: 2, paddingTop: 10,
                borderTop: `1px dashed ${color}25`,
              }}>
                {meta.subFormats.map((sf) => (
                  <div key={sf.name} style={{
                    flex: 1, borderRadius: 8, padding: '8px 10px',
                    background: '#fff', border: `1px solid ${sf.color}20`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sf.color }}>{sf.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999,
                        background: sf.color + '15', color: sf.color,
                      }}>{sf.ratio}%</span>
                    </div>
                    <p style={{ fontSize: 9, color: '#64748b', margin: 0, lineHeight: 1.4 }}>{sf.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}

function ChannelsEditor({ draft, onChange }) {
  const items = Array.isArray(draft?.items) ? draft.items : Array.isArray(draft) ? draft : [];
  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...draft, items: updated });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((ch, idx) => (
        <div key={idx} style={{ borderRadius: 10, border: `1px solid ${tokens.color.border}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Input value={ch.name || ch.channel || ''} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="h-8 text-sm font-medium" placeholder="채널 이름" />
          <Textarea value={ch.description || ch.role || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="text-xs min-h-12" placeholder="채널 설명" />
        </div>
      ))}
    </div>
  );
}

/* ─── Messaging Display & Editor ─────────────────────── */
function MessagingDisplay({ messaging }) {
  if (!messaging) return <p style={{ fontSize: 13, color: tokens.color.textSubtle }}>메시징 전략이 설정되지 않았습니다</p>;
  const messages = messaging.key_messages || messaging.messages || [];
  const tone = messaging.tone_guidelines || messaging.tone || '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: tokens.color.textSubtle, textTransform: 'uppercase', letterSpacing: '0.04em' }}>핵심 메시지</p>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              borderRadius: 8, padding: '8px 12px',
              background: idx % 2 === 0 ? tokens.color.surfaceMuted : 'transparent',
            }}>
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: 999, flexShrink: 0,
                background: '#8b5cf6', color: '#fff', fontSize: 10, fontWeight: 700,
              }}>
                {idx + 1}
              </span>
              <span style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.5 }}>
                {typeof msg === 'string' ? msg : msg.message || msg.text}
              </span>
            </div>
          ))}
        </div>
      )}
      {tone && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: tokens.color.textSubtle, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>톤 가이드라인</p>
          <p style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.6, borderRadius: 8, background: tokens.color.surfaceMuted, padding: '8px 12px' }}>
            {typeof tone === 'string' ? tone : JSON.stringify(tone)}
          </p>
        </div>
      )}
    </div>
  );
}

function MessagingEditor({ draft, onChange }) {
  const messages = draft?.key_messages || draft?.messages || [];
  const tone = draft?.tone_guidelines || draft?.tone || '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: tokens.color.textSubtle }}>핵심 메시지</p>
      {messages.map((msg, idx) => (
        <Textarea
          key={idx}
          value={typeof msg === 'string' ? msg : msg.message || ''}
          onChange={(e) => { const u = [...messages]; u[idx] = e.target.value; onChange({ ...draft, key_messages: u }); }}
          className="text-xs min-h-10"
          placeholder={`메시지 ${idx + 1}`}
        />
      ))}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: tokens.color.textSubtle, marginBottom: 4 }}>톤 가이드라인</p>
        <Textarea
          value={typeof tone === 'string' ? tone : ''}
          onChange={(e) => onChange({ ...draft, tone_guidelines: e.target.value })}
          className="text-xs min-h-12"
          placeholder="톤 가이드라인"
        />
      </div>
    </div>
  );
}

/* TimingDisplay/TimingEditor removed — merged into NarrativeArc */

/* ─── 채널별 시딩 예산 (YouTube / Instagram / TikTok) ──── */
const SEEDING_CHANNELS = [
  {
    channel: 'YouTube',
    color: '#FF0000',
    bg: '#fef2f2',
    ratio: 40,
    amount: 4000000,
    influencers: 6,
    avgCost: 670000,
    priority: '최우선',
    reason: '검색 기반 장기 노출 효과. 언박싱·리뷰 콘텐츠가 구매 결정 단계(BOFU)에서 전환율 1위. 영상 1건당 평균 수명 6개월 이상.',
    breakdown: [
      { label: '매크로 (10~50만)', count: 2, cost: 1000000 },
      { label: '마이크로 (1~10만)', count: 4, cost: 500000 },
    ],
  },
  {
    channel: 'Instagram',
    color: '#E4405F',
    bg: '#fdf2f4',
    ratio: 32,
    amount: 3200000,
    influencers: 12,
    avgCost: 270000,
    priority: '높음',
    reason: '릴스 + 피드 조합으로 참여율과 저장율이 높고, 시딩 후 UGC 전환율이 타 채널 대비 2.3배. 비주얼 중심 소셜프루프에 최적.',
    breakdown: [
      { label: '메가 (50만+)', count: 1, cost: 800000 },
      { label: '매크로 (10~50만)', count: 3, cost: 400000 },
      { label: '마이크로 (1~10만)', count: 8, cost: 150000 },
    ],
  },
  {
    channel: 'TikTok',
    color: '#000000',
    bg: '#f5f5f5',
    ratio: 28,
    amount: 2800000,
    influencers: 12,
    avgCost: 230000,
    priority: '보통',
    reason: '바이럴 확산력 최고. 저비용으로 대량 노출 가능하며, 트렌드 해시태그 참여 시 오가닉 조회수 폭발 잠재력 보유.',
    breakdown: [
      { label: '마이크로 (1~10만)', count: 8, cost: 200000 },
      { label: '나노 (~1만)', count: 4, cost: 100000 },
    ],
  },
];

const PRIORITY_STYLE = {
  '최우선': { color: '#dc2626', bg: '#fef2f2' },
  '높음': { color: '#d97706', bg: '#fffbeb' },
  '보통': { color: '#6366f1', bg: '#eef2ff' },
};

function BudgetDisplay({ budget }) {
  const raw = budget?.items || budget?.allocations || [];
  const hasChannelData = raw.length > 0 && raw[0].channel && ['Instagram', 'YouTube', 'TikTok'].includes(raw[0].channel);
  const channels = hasChannelData ? raw : SEEDING_CHANNELS;

  const total = channels.reduce((s, c) => s + (c.amount || 0), 0);
  const totalInfluencers = channels.reduce((s, c) => s + (c.influencers || 0), 0);
  const pieData = channels.map((c) => ({ name: c.channel, value: c.ratio }));
  const pieColors = channels.map((c) => c.color);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 요약 한줄 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>총 시딩 예산</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: tokens.color.text }}>{total.toLocaleString()}원</span>
        <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>· 인플루언서 {totalInfluencers}명</span>
      </div>

      {/* 파이차트 + 채널 카드 가로 배치 */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'center' }}>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={56} innerRadius={28} dataKey="value"
                label={({ cx, cy, midAngle, outerRadius: oR, value }) => {
                  const RADIAN = Math.PI / 180;
                  const r = oR + 20;
                  const x = cx + r * Math.cos(-midAngle * RADIAN);
                  const y = cy + r * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                      fontSize={12} fontWeight={700} fill="#374151">
                      {value}%
                    </text>
                  );
                }}
                labelLine={false}>
                {pieData.map((_, idx) => (<Cell key={idx} fill={pieColors[idx]} />))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}%`, name]} />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* 3채널 카드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {channels.map((ch, idx) => {
            const pStyle = PRIORITY_STYLE[ch.priority] || PRIORITY_STYLE['보통'];
            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                borderRadius: 10, border: `1px solid ${tokens.color.border}`,
                padding: '10px 14px',
              }}>
                {/* 채널명 + 비중 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: ch.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: ch.color }}>{ch.channel}</span>
                  <span style={{
                    fontSize: 15, fontWeight: 800, color: tokens.color.text,
                  }}>{ch.ratio}%</span>
                </div>

                {/* 우선순위 */}
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                  background: pStyle.bg, color: pStyle.color, flexShrink: 0,
                }}>
                  {ch.priority}
                </span>

                {/* 수치 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: tokens.color.textSubtle }}>
                  <span>{ch.influencers}명</span>
                  <span>·</span>
                  <span>{(ch.amount || 0).toLocaleString()}원</span>
                </div>

                {/* 추천 이유 (1줄 요약) */}
                <p style={{
                  flex: 1, fontSize: 10, color: tokens.color.textSubtle, margin: 0,
                  lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {ch.reason}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BudgetEditor({ draft, onChange }) {
  const items = draft?.items || draft?.allocations || [];

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    const numFields = ['influencers', 'avgCost', 'amount', 'ratio'];
    updated[idx] = { ...updated[idx], [field]: numFields.includes(field) ? Number(value) || 0 : value };
    onChange({ ...draft, items: updated });
  };

  const editItems = items.length > 0 ? items : SEEDING_CHANNELS;
  if (items.length === 0) onChange({ ...draft, items: editItems });
  const displayItems = items.length > 0 ? items : editItems;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>채널별 시딩 비중을 조정하세요</p>
      {displayItems.map((item, idx) => (
        <div key={idx} style={{
          borderRadius: 10, border: `1px solid ${tokens.color.border}`, padding: 12,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input value={item.channel || ''} onChange={(e) => updateItem(idx, 'channel', e.target.value)} className="h-8 text-sm w-28" placeholder="채널" />
            <Input type="number" value={item.ratio || ''} onChange={(e) => updateItem(idx, 'ratio', e.target.value)} className="h-8 text-sm w-16" placeholder="%" />
            <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>%</span>
            <Input type="number" value={item.influencers || ''} onChange={(e) => updateItem(idx, 'influencers', e.target.value)} className="h-8 text-sm w-16" placeholder="인원" />
            <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>명</span>
            <Input type="number" value={item.amount || ''} onChange={(e) => updateItem(idx, 'amount', e.target.value)} className="h-8 text-sm w-28" placeholder="예산 (원)" />
          </div>
          <Textarea value={item.reason || ''} onChange={(e) => updateItem(idx, 'reason', e.target.value)} className="text-xs min-h-10" placeholder="추천 이유" />
        </div>
      ))}
    </div>
  );
}
