import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import PhaseCard from '@/components/campaign/PhaseCard.jsx';
import { Brain } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const PHASE_CONFIG = [
  { phase: 1, name: '캠페인 설정', description: '캠페인 목표, 예산, 일정 등 기본 정보를 설정합니다', path: '/pda' },
  { phase: 2, name: '캠페인 전략', description: 'PDA 프레임워크 기반 채널·메시징·타이밍·예산 전략을 설계합니다', path: '/strategy' },
  { phase: 3, name: '콘텐츠 기획', description: '콘텐츠 방향 및 핵심 메시지를 기획합니다', path: '/calendar' },
  { phase: 4, name: '콘텐츠 제작', description: 'AI가 콘텐츠 초안을 생성하고 사람이 편집합니다', path: '/creative' },
  { phase: 5, name: '인플루언서 선정', description: 'AI가 최적의 인플루언서를 추천합니다', path: '/influencers' },
  { phase: 6, name: '인플루언서 소통', description: '인플루언서 컨택 및 협업 조율을 관리합니다', path: '/outreach' },
  { phase: 7, name: '콘텐츠 론칭', description: '콘텐츠 배포 및 캠페인을 론칭합니다', path: '/launch' },
  { phase: 8, name: '성과 모니터링', description: 'AI가 실시간 성과를 분석하고 인사이트를 제공합니다', path: '/monitor' },
];

export default function CampaignHub() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { campaign, isLoading } = useOutletContext();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${tokens.color.border}`, borderBottomColor: tokens.color.primary }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: tokens.color.textSubtle }}>
        <p style={{ fontSize: 15, fontWeight: 600 }}>캠페인을 찾을 수 없습니다</p>
      </div>
    );
  }

  const phaseStatuses = campaign.phases || {};
  const statusLabel = campaign.status === 'active' ? '진행중' : campaign.status === 'completed' ? '완료' : '초안';
  const statusStyle = campaign.status === 'active'
    ? { bg: tokens.color.primarySoft, color: tokens.color.primary }
    : campaign.status === 'completed'
      ? { bg: tokens.color.successSoft, color: tokens.color.success }
      : { bg: tokens.color.surfaceMuted, color: tokens.color.textSubtle };

  const infoItems = [
    { label: '브랜드', value: campaign.brand_cd },
    { label: '카테고리', value: campaign.category },
    { label: '서브카테고리', value: campaign.subcategory },
    { label: '제품', value: campaign.product_name },
    { label: '국가', value: campaign.country },
  ].filter((i) => i.value);

  return (
    <div>
      {/* ── 1) Campaign Info (top) ── */}
      <div
        style={{
          borderRadius: 14,
          border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface,
          boxShadow: tokens.shadow.card,
          padding: '16px 20px',
          marginBottom: 20,
        }}
      >
        {/* Name + Status + Date row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: infoItems.length > 0 ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {campaign.campaign_name}
            </h1>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: statusStyle.bg, color: statusStyle.color, flexShrink: 0 }}>
              {statusLabel}
            </span>
          </div>
          {(campaign.scheduled_start || campaign.scheduled_end) && (
            <span style={{ fontSize: 12, color: tokens.color.textSubtle, flexShrink: 0 }}>
              {(campaign.scheduled_start || '?').slice(0, 10)} ~ {(campaign.scheduled_end || '?').slice(0, 10)}
            </span>
          )}
        </div>

        {/* Detail fields */}
        {infoItems.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 28px' }}>
            {infoItems.map((item) => (
              <div key={item.label} style={{ minWidth: 80 }}>
                <p style={{ fontSize: 10, color: tokens.color.textSubtle, marginBottom: 1 }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 2) AI-PLAN Banner ── */}
      {campaign.plan_doc_id && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 12,
            border: `1px solid ${tokens.color.primarySoft}`,
            background: tokens.color.primarySoft,
            padding: '12px 16px',
            marginBottom: 20,
          }}
        >
          <Brain style={{ width: 18, height: 18, color: tokens.color.primary }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>AI 기획안 연동됨</p>
            <p style={{ fontSize: 11, color: tokens.color.textSubtle }}>AI-PLAN이 캠페인에 연결되어 각 단계에서 AI 분석 결과를 활용할 수 있습니다</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: tokens.color.surface, color: tokens.color.primary }}>
            연동 완료
          </span>
        </div>
      )}

      {/* ── 3) Combined Phase Steps ── */}
      <div>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>캠페인 단계</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PHASE_CONFIG.map((p) => (
            <PhaseCard
              key={p.phase}
              phase={p.phase}
              name={p.name}
              description={p.description}
              status={phaseStatuses[`phase_${p.phase}`] || 'not_started'}
              onClick={() => p.path && navigate(`/campaigns/${id}${p.path}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
