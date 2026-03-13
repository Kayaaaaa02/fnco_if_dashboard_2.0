import { Outlet, NavLink, useParams } from 'react-router-dom';
import { useCampaign, useCampaignHub } from '@/hooks/useCampaign.js';
import { useCampaignSocket } from '@/hooks/useSocket.js';
import { useConfirmedConcepts } from '@/hooks/useConfirmedConcepts.js';
import { tokens } from '@/styles/designTokens.js';

const PHASES = [
  { phase: 1, labelKey: '캠페인 설정', path: '/pda', end: false },
  { phase: 2, labelKey: '캠페인 전략', path: '/strategy' },
  { phase: 3, labelKey: '콘텐츠 기획', path: '/calendar' },
  { phase: 4, labelKey: '콘텐츠 제작', path: '/creative' },
  { phase: 5, labelKey: '인플루언서 선정', path: '/influencers' },
  { phase: 6, labelKey: '인플루언서 소통', path: '/outreach' },
  { phase: 7, labelKey: '콘텐츠 론칭', path: '/launch' },
  { phase: 8, labelKey: '성과 모니터링', path: '/monitor' },
];

const STATUS_BADGE = {
  not_started: { label: '미시작', bg: tokens.color.surfaceMuted, color: tokens.color.textSubtle },
  in_progress: { label: '진행중', bg: tokens.color.primarySoft, color: tokens.color.primary },
  completed: { label: '완료', bg: tokens.color.successSoft, color: tokens.color.success },
};

function PhaseStatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_BADGE[status] || STATUS_BADGE.not_started;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

/**
 * phase_summary 카운트를 기반으로 각 단계 상태를 추론한다.
 * 해당 phase에 데이터가 있으면 completed, current_phase와 같으면 in_progress, 없으면 not_started.
 */
function derivePhaseStatuses(campaign, phaseSummary) {
  // 캠페인 자체에 phases 객체가 있으면 우선 사용
  if (campaign?.phases && Object.keys(campaign.phases).length > 0) {
    return campaign.phases;
  }
  if (!phaseSummary) return {};

  const currentPhase = campaign?.current_phase || 1;
  // phase별 summary 키 매핑
  const phaseKeys = {
    1: ['persona_count', 'desire_count', 'awareness_count'],
    2: ['strategy_count'],
    3: ['calendar_count'],
    4: ['creative_count'],
    5: ['influencer_count'],
    6: ['outreach_count'],
    7: ['schedule_count'],
    8: ['metric_count'],
  };

  const statuses = {};
  for (let p = 1; p <= 8; p++) {
    const keys = phaseKeys[p] || [];
    const hasData = keys.some((k) => (phaseSummary[k] || 0) > 0);

    // 전략 단계(phase 2): 승인 상태이면 completed
    if (p === 2 && phaseSummary.strategy_status === 'approved') {
      statuses[`phase_${p}`] = 'completed';
    } else if (hasData && p < currentPhase) {
      statuses[`phase_${p}`] = 'completed';
    } else if (p === currentPhase) {
      statuses[`phase_${p}`] = hasData ? 'in_progress' : 'in_progress';
    } else if (hasData) {
      statuses[`phase_${p}`] = 'in_progress';
    } else {
      statuses[`phase_${p}`] = 'not_started';
    }
  }
  return statuses;
}

export default function CampaignLayout() {
  const { id } = useParams();
  useCampaignSocket(id);
  const { data: campaign, isLoading } = useCampaign(id);
  const { data: hub } = useCampaignHub(id);
  const { lockedCount } = useConfirmedConcepts(id);
  const derived = derivePhaseStatuses(campaign, hub?.phase_summary);
  // 콘텐츠 기획(phase 3): 확정(lock)된 컨셉이 있으면 completed
  const phaseStatuses = lockedCount > 0
    ? { ...derived, phase_3: 'completed' }
    : derived;

  return (
    <div className="flex h-full flex-col">
      {/* Phase Navigation */}
      <div
        className="scrollbar-hide"
        style={{
          borderBottom: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface,
          padding: '0 32px',
          overflowX: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          height: 46,
          flexShrink: 0,
        }}
      >
        {PHASES.map(({ phase, labelKey, path, end }) => (
          <NavLink
            key={phase}
            to={`/campaigns/${id}${path}`}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              transition: 'all .15s',
              background: isActive ? tokens.color.primarySoft : 'transparent',
              color: isActive ? tokens.color.primary : tokens.color.textSubtle,
            })}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: tokens.color.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: tokens.color.text,
              }}
            >
              {phase}
            </span>
            <span>{labelKey}</span>
            {!isLoading && <PhaseStatusBadge status={phaseStatuses[`phase_${phase}`]} />}
          </NavLink>
        ))}
      </div>

      {/* Phase Content */}
      <div className="flex-1 overflow-auto" style={{ padding: '28px 32px' }}>
        <Outlet context={{ campaign, isLoading }} />
      </div>
    </div>
  );
}
