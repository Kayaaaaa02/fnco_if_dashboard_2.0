import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, CheckCircle2, Clock3, ArrowRight, Trash2 } from 'lucide-react';
import { useCampaigns, useArchiveCampaign } from '@/hooks/useCampaign.js';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { tokens } from '@/styles/designTokens.js';
import CampaignTimeline from '@/components/campaign/CampaignTimeline.jsx';

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: 'NEW' },
  { value: 'active', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'archived', label: '보관' },
];

const STATUS_LABELS = {
  all: '전체',
  draft: 'NEW',
  active: '진행중',
  completed: '완료',
  archived: '보관',
};

const STATUS_BADGE_STYLES = {
  draft: { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
  active: { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  completed: { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' },
  archived: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' },
};

const STATUS_PAGE_COPY = {
  all: {
    title: '캠페인 빌더',
    description: '캠페인 설계, 단계 실행, 운영 플로우를 관리합니다',
  },
  draft: {
    title: 'NEW 캠페인',
    description: '준비 단계의 신규 캠페인을 관리합니다',
  },
  active: {
    title: '진행중 캠페인',
    description: '실행 중인 캠페인의 상태와 액션을 점검합니다',
  },
  completed: {
    title: '완료 캠페인',
    description: '완료된 캠페인 결과를 확인하고 다음 액션으로 연결합니다',
  },
  archived: {
    title: '보관 캠페인',
    description: '보관된 캠페인 이력을 확인합니다',
  },
};

const FALLBACK_ACTION_PLAN = [
  {
    id: 'fallback-1',
    title: '진행중 캠페인 단계 리스크 점검',
    detail: '현재 Phase 지연 캠페인 대응 플랜을 정리합니다.',
    status: 'in_progress',
    source: '캠페인 빌더',
  },
  {
    id: 'fallback-2',
    title: '캠페인 KPI 달성률 중간 점검',
    detail: '목표 대비 현재 달성률을 점검하고 대응 방안을 수립합니다.',
    status: 'planned',
    source: '캠페인 빌더',
  },
  {
    id: 'fallback-3',
    title: '캠페인 일정 및 마일스톤 확인',
    detail: '이번 주 예정된 캠페인 마일스톤과 일정을 확인합니다.',
    status: 'planned',
    source: '캠페인 빌더',
  },
];

function getPhaseLabel(phases) {
  if (!phases) return null;
  const phaseKeys = Object.keys(phases);
  const inProgress = phaseKeys.find((k) => phases[k] === 'in_progress');
  if (inProgress) {
    const num = inProgress.replace('phase_', '');
    return `Phase ${num}`;
  }
  return null;
}


/* ── Campaign Card ── */
function CampaignCard({ campaign, onClick, onDelete }) {
  const status = campaign.status || 'draft';
  const badgeStyle = STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.draft;
  const isActive = status === 'active';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all"
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderLeft: isActive ? '3px solid var(--fnco-primary)' : `1px solid ${tokens.color.border}`,
        borderRadius: 'var(--fnco-radius-md)',
        padding: '20px 24px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--fnco-shadow-card)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Title + Badge + Delete */}
      <div className="flex items-start justify-between gap-3" style={{ marginBottom: 14 }}>
        <h3
          className="truncate"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: tokens.color.text,
            lineHeight: 1.4,
          }}
        >
          {campaign.campaign_name}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span
            style={{
              ...badgeStyle,
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 6,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}
          >
            {STATUS_LABELS[status] || status || 'NEW'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(campaign);
            }}
            className="inline-flex items-center justify-center transition-colors"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: tokens.color.textSubtle,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = tokens.color.textSubtle;
            }}
            title="캠페인 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1" style={{ fontSize: 13, color: tokens.color.textSubtle }}>
        {(campaign.brand || campaign.brand_cd) && (
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 500, minWidth: 40, color: tokens.color.textSubtle }}>브랜드</span>
            <span style={{ color: tokens.color.text }}>{campaign.brand || campaign.brand_cd}</span>
          </div>
        )}
        {campaign.product_name && (
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 500, minWidth: 40, color: tokens.color.textSubtle }}>제품</span>
            <span style={{ color: tokens.color.text }}>{campaign.product_name}</span>
          </div>
        )}
        {(campaign.scheduled_start || campaign.scheduled_end) && (
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 500, minWidth: 40, color: tokens.color.textSubtle }}>기간</span>
            <span style={{ color: tokens.color.text }}>
              {(campaign.scheduled_start || '?').slice(0, 10)} ~ {(campaign.scheduled_end || '?').slice(0, 10)}
            </span>
          </div>
        )}
      </div>

      {/* Phase */}
      {campaign.phases && getPhaseLabel(campaign.phases) && (
        <div style={{ marginTop: 12 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: tokens.color.textSubtle,
              background: tokens.color.surfaceMuted,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 6,
              padding: '2px 10px',
            }}
          >
            {getPhaseLabel(campaign.phases)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Action Plan Item ── */
function ActionPlanItem({ item }) {
  return (
    <div
      className="flex items-center justify-between gap-4"
      style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${tokens.color.border}`,
      }}
    >
      {/* Left: Info */}
      <div className="min-w-0 flex-1">
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: tokens.color.text,
            marginBottom: 3,
          }}
        >
          {item.title}
        </p>
        <p
          style={{
            fontSize: 13,
            color: tokens.color.textSubtle,
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          {item.detail}
        </p>
        <span
          className="inline-flex items-center gap-1.5"
          style={{ fontSize: 12.5, color: tokens.color.textSubtle }}
        >
          {item.status === 'in_progress' ? (
            <>
              <Clock3 className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
              <span style={{ fontWeight: 500 }}>진행중</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
              <span style={{ fontWeight: 500 }}>예정</span>
            </>
          )}
        </span>
      </div>

      {/* Right: Source + Action */}
      <div className="flex items-center gap-4 shrink-0">
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: tokens.color.textSubtle,
            background: tokens.color.surfaceMuted,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 6,
            padding: '4px 12px',
            whiteSpace: 'nowrap',
          }}
        >
          {item.source}
        </span>
        <span
          className="inline-flex items-center gap-1"
          style={{ fontSize: 13, color: tokens.color.textSubtle, whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          실행
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

const PERIOD_OPTIONS = [
  { value: 'all', label: '전체 기간' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: '6m', label: '최근 6개월' },
  { value: '1y', label: '최근 1년' },
];

function getPeriodRange(value) {
  if (!value || value === 'all') return {};
  const now = new Date();
  const map = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
  const days = map[value] || 0;
  if (!days) return {};
  const from = new Date(now.getTime() - days * 86400000);
  return { date_from: from.toISOString().split('T')[0] };
}

/* ── Main Component ── */
export default function CampaignList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status');
  const initialBrand = searchParams.get('brand') || '';
  const normalizedInitialStatus = STATUS_OPTIONS.some((opt) => opt.value === initialStatus) ? initialStatus : 'all';
  const [statusFilter, setStatusFilter] = useState(normalizedInitialStatus);
  const [brandFilter, setBrandFilter] = useState(initialBrand);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const archiveCampaign = useArchiveCampaign();

  useEffect(() => {
    const queryStatus = searchParams.get('status');
    const nextStatus = STATUS_OPTIONS.some((opt) => opt.value === queryStatus) ? queryStatus : 'all';
    if (nextStatus !== statusFilter) setStatusFilter(nextStatus);

    const queryBrand = searchParams.get('brand') || '';
    if (queryBrand !== brandFilter) setBrandFilter(queryBrand);
  }, [searchParams, statusFilter, brandFilter]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (statusFilter === 'all') nextParams.delete('status');
    else nextParams.set('status', statusFilter);

    const trimmedBrand = brandFilter.trim();
    if (!trimmedBrand) nextParams.delete('brand');
    else nextParams.set('brand', trimmedBrand);

    const current = searchParams.toString();
    const next = nextParams.toString();
    if (current !== next) setSearchParams(nextParams, { replace: true });
  }, [statusFilter, brandFilter, searchParams, setSearchParams]);

  const filters = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (brandFilter && brandFilter !== 'all') filters.brand = brandFilter;
  const periodRange = getPeriodRange(periodFilter);
  if (periodRange.date_from) filters.date_from = periodRange.date_from;

  const { data: campaigns = [], isLoading, error } = useCampaigns(filters);

  // Extract unique brand list for filter dropdown
  const brandOptions = useMemo(() => {
    const brands = [...new Set(campaigns.map((c) => c.brand || c.brand_cd).filter(Boolean))];
    return brands.sort();
  }, [campaigns]);

  // Client-side keyword search across name, brand, product
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    const q = searchQuery.trim().toLowerCase();
    return campaigns.filter((c) =>
      (c.campaign_name || '').toLowerCase().includes(q) ||
      (c.brand || c.brand_cd || '').toLowerCase().includes(q) ||
      (c.product_name || '').toLowerCase().includes(q)
    );
  }, [campaigns, searchQuery]);
  const pageCopy = STATUS_PAGE_COPY[statusFilter] || STATUS_PAGE_COPY.all;

  const actionPlanItems = useMemo(() => {
    const campaignItems = campaigns.map((campaign, index) => {
      const phase = getPhaseLabel(campaign.phases);
      const isActive = campaign.status === 'active';
      return {
        id: `campaign-${campaign.campaign_id || campaign._id}`,
        title: `${campaign.campaign_name} ${isActive ? '운영 점검' : '준비 점검'}`,
        detail: phase
          ? `${phase} 기준으로 이번 주 액션 정리`
          : `캠페인 ${isActive ? '진행 상황 점검 및 다음 단계 준비' : '초기 셋업 및 일정 확인'}`,
        status: isActive ? 'in_progress' : 'planned',
        source: '캠페인 빌더',
      };
    }).slice(0, 5);

    return campaignItems.length > 0 ? campaignItems : FALLBACK_ACTION_PLAN;
  }, [campaigns]);

  /* ── Campaign cards content ── */
  const campaignListContent = isLoading ? (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  ) : error ? (
    <div className="text-center py-20" style={{ color: 'var(--fnco-danger)' }}>
      <p>캠페인 목록을 불러오는 중 오류가 발생했습니다.</p>
      <p className="text-sm mt-1" style={{ color: tokens.color.textSubtle }}>{error.message}</p>
    </div>
  ) : filteredCampaigns.length === 0 ? (
    <div className="text-center py-20" style={{ color: tokens.color.textSubtle }}>
      <p style={{ fontSize: 16 }}>
        {searchQuery.trim()
          ? `"${searchQuery.trim()}" 검색 결과가 없습니다`
          : statusFilter === 'all'
            ? '등록된 캠페인이 없습니다'
            : `${STATUS_LABELS[statusFilter]} 상태 캠페인이 없습니다`}
      </p>
      <p className="text-sm mt-1">필터를 바꾸거나 새 캠페인을 만들어보세요</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {filteredCampaigns.map((campaign) => (
        <CampaignCard
          key={campaign.campaign_id || campaign._id}
          campaign={campaign}
          onClick={() => navigate(`/campaigns/${campaign.campaign_id || campaign._id}`)}
          onDelete={(c) => setDeleteTarget(c)}
        />
      ))}
    </div>
  );

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: tokens.color.text,
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}
            >
              {pageCopy.title}
            </h1>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: tokens.color.textSubtle,
                cursor: 'pointer',
              }}
            >
              {STATUS_LABELS[statusFilter] || '전체'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: tokens.color.textSubtle, lineHeight: 1.5 }}>
            {pageCopy.description}
          </p>
        </div>
        <Button
          onClick={() => navigate('/campaigns/new')}
          className="gap-2 h-10 px-5"
          style={{
            borderRadius: 'var(--fnco-radius-sm)',
            background: tokens.color.text,
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Plus className="h-4 w-4" />
          새 캠페인
        </Button>
      </div>

      {/* ── Campaign Timeline ── */}
      <CampaignTimeline campaigns={campaigns} />

      {/* ── Search + Filter Bar ── */}
      <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
        {/* Search (keyword) */}
        <div className="relative" style={{ flex: '1 1 0', minWidth: 180 }}>
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: tokens.color.textSubtle }}
          />
          <Input
            placeholder="캠페인명, 브랜드, 제품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 'var(--fnco-radius-sm)',
              height: 40,
              fontSize: 13,
              paddingLeft: 36,
            }}
          />
        </div>

        {/* Right-side filters */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Brand filter */}
          <Select value={brandFilter || 'all'} onValueChange={(v) => setBrandFilter(v === 'all' ? '' : v)}>
            <SelectTrigger
              style={{
                width: 130,
                height: 40,
                borderRadius: 'var(--fnco-radius-sm)',
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                fontSize: 13,
              }}
            >
              <SelectValue placeholder="브랜드" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 브랜드</SelectItem>
              {brandOptions.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period filter */}
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger
              style={{
                width: 130,
                height: 40,
                borderRadius: 'var(--fnco-radius-sm)',
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                fontSize: 13,
              }}
            >
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              style={{
                width: 110,
                height: 40,
                borderRadius: 'var(--fnco-radius-sm)',
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                fontSize: 13,
              }}
            >
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Campaign Grid (full width) ── */}
      <section style={{ marginBottom: 40 }}>
        {campaignListContent}
      </section>

      {/* ── Action Plan (full width, below campaigns) ── */}
      <section>
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: tokens.color.text,
              marginBottom: 4,
              letterSpacing: '-0.01em',
            }}
          >
            이번 주 Action Plan
          </h2>
          <p style={{ fontSize: 13, color: tokens.color.textSubtle }}>
            캠페인별 이번 주 운영 액션을 확인합니다.
          </p>
        </div>

        <div
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 'var(--fnco-radius-md)',
            overflow: 'hidden',
          }}
        >
          {actionPlanItems.map((item, idx) => (
            <ActionPlanItem key={item.id} item={item} isLast={idx === actionPlanItems.length - 1} />
          ))}
        </div>
      </section>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: '28px 32px',
              width: 400,
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 10 }}>
              캠페인 삭제
            </h3>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>
              진짜로 삭제하시겠습니까?
              <br />
              <strong style={{ color: '#111' }}>{deleteTarget.campaign_name}</strong> 캠페인이 삭제됩니다.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '8px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  archiveCampaign.mutate(deleteTarget.campaign_id || deleteTarget._id);
                  setDeleteTarget(null);
                }}
                style={{
                  padding: '8px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
