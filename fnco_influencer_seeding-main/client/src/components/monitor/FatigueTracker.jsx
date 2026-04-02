import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFatigueReport } from '@/hooks/useMonitor';
import { Loader2, Activity, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { mockFatigueReport } from '@/mocks/data.js';

function formatNum(val) {
  if (val == null) return '-';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString('ko-KR');
}

function getFatigueStatus(score) {
  if (score < 20) return { label: '양호', color: '#16a34a', bg: '#dcfce7', barBg: '#16a34a', border: '#bbf7d0', icon: CheckCircle2 };
  if (score <= 50) return { label: '주의', color: '#d97706', bg: '#fef3c7', barBg: '#f59e0b', border: '#fde68a', icon: AlertCircle };
  return { label: '위험', color: '#dc2626', bg: '#fee2e2', barBg: '#ef4444', border: '#fecaca', icon: AlertTriangle };
}

export default function FatigueTracker() {
  const { id: campaignId } = useParams();
  const { data: fatigueData, isLoading } = useFatigueReport(campaignId);
  const [expanded, setExpanded] = useState(false);

  const hasApiData = fatigueData && (
    (Array.isArray(fatigueData.items) && fatigueData.items.length > 0) ||
    (Array.isArray(fatigueData) && fatigueData.length > 0)
  );
  const effectiveData = hasApiData ? fatigueData : mockFatigueReport;
  const items = Array.isArray(effectiveData?.items) ? effectiveData.items : [];

  const sorted = [...items].sort((a, b) => (b.fatigue_score ?? 0) - (a.fatigue_score ?? 0));

  if (isLoading) {
    return (
      <div style={{ borderRadius: 14, border: '1px solid #E8E8E8', background: '#ffffff', padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
        <Loader2 style={{ width: 24, height: 24, color: '#888' }} className="animate-spin" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div style={{ borderRadius: 14, border: '1px solid #E8E8E8', background: '#ffffff', padding: '40px 0', textAlign: 'center', color: '#888888' }}>
        <Activity style={{ width: 36, height: 36, margin: '0 auto 12px', opacity: 0.3 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>피로도 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 14, border: '1px solid #E8E8E8',
      background: '#ffffff', overflow: 'hidden',
    }}>
      {/* Header (토글) */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 20px',
          borderBottom: expanded ? '1px solid #E8E8E8' : 'none',
          background: '#FAFAFA',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F0F0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #ef4444, #f97316)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity style={{ width: 14, height: 14, color: '#fff' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>콘텐츠 피로도 측정</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#ef4444',
          background: '#fee2e2', borderRadius: 6, padding: '3px 10px',
        }}>
          {sorted.filter((i) => i.fatigue_score > 50).length}건 위험
        </span>
        <div style={{ marginLeft: 'auto', color: '#888888', display: 'flex', alignItems: 'center' }}>
          {expanded
            ? <ChevronUp style={{ width: 18, height: 18 }} />
            : <ChevronDown style={{ width: 18, height: 18 }} />
          }
        </div>
      </div>

      {/* Items (토글 콘텐츠) */}
      {expanded && (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((item) => {
          const score = item.fatigue_score ?? 0;
          const status = getFatigueStatus(score);
          const StatusIcon = status.icon;

          return (
            <div
              key={item.id || item.concept_name}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 12,
                border: `1px solid ${status.border}`,
                background: score > 50 ? status.bg : '#fff',
                transition: 'background .15s',
              }}
            >
              <StatusIcon style={{ width: 18, height: 18, color: status.color, flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.concept_name || '무제 컨셉'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                  }}>
                    {status.label}
                  </span>
                  {score > 50 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: '#ef4444', color: '#fff',
                    }}>
                      교체 필요
                    </span>
                  )}
                </div>

                {/* 인플루언서 */}
                {item.influencers && item.influencers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {item.influencers.map((inf, i) => {
                      const platColors = { instagram: '#ec4899', youtube: '#ef4444', tiktok: '#0f172a' };
                      const platLabels = { instagram: 'IG', youtube: 'YT', tiktok: 'TT' };
                      return (
                        <span key={i} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 500, color: '#475569',
                          background: '#f8fafc', padding: '3px 8px', borderRadius: 999,
                          border: '1px solid #e2e8f0',
                        }}>
                          <span style={{
                            fontSize: 8, fontWeight: 700, color: '#fff',
                            background: platColors[inf.platform] || '#64748b',
                            padding: '0px 4px', borderRadius: 999,
                          }}>{platLabels[inf.platform] || inf.platform}</span>
                          @{inf.name}
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>{formatNum(inf.views)}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999,
                      background: status.barBg,
                      width: `${Math.min(score, 100)}%`,
                      transition: 'width .5s ease',
                    }} />
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: status.color,
                    fontVariantNumeric: 'tabular-nums', minWidth: 30, textAlign: 'right',
                  }}>
                    {score}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          paddingTop: 12, marginTop: 4, borderTop: '1px solid #F0F0F0',
        }}>
          <span style={{ fontSize: 11, color: '#888888' }}>피로도 기준:</span>
          {[
            { color: '#16a34a', label: '< 20 양호' },
            { color: '#f59e0b', label: '20-50 주의' },
            { color: '#ef4444', label: '> 50 위험' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
