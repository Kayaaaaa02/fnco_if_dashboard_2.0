import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Workflow } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const STEPS = [
  { phase: 1, name: 'PDA 설정', path: '/pda' },
  { phase: 2, name: '캠페인 전략', path: '/strategy' },
  { phase: 3, name: '콘텐츠 기획', path: '/calendar' },
  { phase: 4, name: '크리에이티브 제작', path: '/creative' },
  { phase: 5, name: '인플루언서 선정', path: '/influencers' },
  { phase: 6, name: '인플루언서 소통', path: '/outreach' },
  { phase: 7, name: '콘텐츠 론칭', path: '/launch' },
  { phase: 8, name: '성과 모니터링', path: '/monitor' },
];

export default function CampaignFlowchart({ campaignId }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: '14px 18px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Workflow style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>캠페인 빌딩 순서도</span>
      </div>

      {/* Steps */}
      <div className="scrollbar-hide" style={{ display: 'flex', alignItems: 'stretch', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.phase}>
            <div
              onClick={() => navigate(`/campaigns/${campaignId}${step.path}`)}
              style={{
                flexShrink: 0,
                width: 150,
                borderRadius: 12,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surfaceMuted,
                padding: 10,
                cursor: 'pointer',
                transition: 'box-shadow .15s, border-color .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadow.card; e.currentTarget.style.borderColor = tokens.color.borderStrong; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = tokens.color.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: tokens.color.primarySoft,
                    color: tokens.color.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {step.phase}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.name}</span>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <ChevronRight style={{ width: 14, height: 14, color: tokens.color.border }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
