import { useParams, useNavigate } from 'react-router-dom';
import { useEarlySignals, useDetectSignals } from '@/hooks/useEarlySignal';
import { Button } from '@/components/ui/button.jsx';
import {
  Radar,
  Sparkles,
  Loader2,
  AlertTriangle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { mockEarlySignals } from '@/mocks/data.js';
import { useState } from 'react';

function TabTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        width: 15, height: 15, borderRadius: '50%',
        background: '#E8E8E8', color: '#888888',
        fontSize: 9, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1, flexShrink: 0,
      }}>?</span>
      {show && (
        <span style={{
          position: 'fixed',
          top: 'auto', left: 'auto',
          transform: 'translateX(-50%) translateY(-100%)',
          marginTop: -10,
          padding: '8px 12px', background: '#222222', color: '#ffffff',
          fontSize: 11, fontWeight: 400, lineHeight: 1.5,
          borderRadius: 8, whiteSpace: 'nowrap', zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}
        ref={(el) => {
          if (el) {
            const parent = el.parentElement?.getBoundingClientRect();
            if (parent) {
              el.style.top = `${parent.top - 8}px`;
              el.style.left = `${parent.left + parent.width / 2}px`;
            }
          }
        }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function AlertLevelBadge({ level }) {
  const styles = {
    good: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    normal: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
    warning: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  };
  const labels = { good: '우수', normal: '보통', warning: '주의' };
  const s = styles[level] || styles.normal;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {labels[level] || level}
    </span>
  );
}

function ChangeIndicator({ value }) {
  if (value == null) return <span style={{ color: '#94a3b8' }}>-</span>;
  const isPositive = value > 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 12, fontWeight: 600,
      color: isPositive ? '#16a34a' : '#dc2626',
    }}>
      {isPositive ? <ArrowUp style={{ width: 12, height: 12 }} /> : <ArrowDown style={{ width: 12, height: 12 }} />}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function GoToButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, border: 'none', background: 'transparent',
        color: '#94a3b8', cursor: 'pointer', transition: 'color 0.15s', flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#6366f1'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
    >
      <ExternalLink style={{ width: 13, height: 13 }} />
    </button>
  );
}

export default function EarlySignal() {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const { data: signalData, isLoading } = useEarlySignals(campaignId);
  const detectMutation = useDetectSignals();
  const [activeTab, setActiveTab] = useState('hooks');

  const apiSignals = signalData?.data || [];
  const signals = apiSignals.length > 0 ? apiSignals : mockEarlySignals;
  const hookSignal = signals.find((s) => s.signal_type === 'hook_ranking');
  const channelSignal = signals.find((s) => s.signal_type === 'channel_ranking');
  const anomalySignal = signals.find((s) => s.signal_type === 'anomaly');

  const hookData = hookSignal?.rank_data || [];
  const channelData = channelSignal?.rank_data || [];
  const anomalyData = anomalySignal?.anomalies || [];

  const hasData = signals.length > 0;

  const tabs = [
    { key: 'hooks', label: '컨텐츠 랭킹', count: hookData.length, tooltip: '컨텐츠 주차별 변동 ENG율 순위' },
    { key: 'channels', label: '채널 랭킹', count: channelData.length, tooltip: '채널별 인게이지먼트 효율 평균 대비 비교' },
    { key: 'anomalies', label: '이상 감지', count: anomalyData.length, alert: anomalyData.length > 0, tooltip: 'z-score 기반 성과 점수이상치 자동 감지 | 성과점수 = (0.7 × 조회수_z) + (0.3 × 참여율_z)' },
  ];

  return (
    <div style={{
      borderRadius: 14, border: '1px solid #E8E8E8',
      background: '#ffffff', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #E8E8E8',
        background: '#FAFAFA',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Radar style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>초기 신호 감지</span>
        </div>
        <Button
          onClick={() => detectMutation.mutate(campaignId)}
          disabled={detectMutation.isPending}
          variant="outline"
          size="sm"
          style={{ fontSize: 12, fontWeight: 600, borderRadius: 8, gap: 4 }}
        >
          {detectMutation.isPending
            ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
            : <Sparkles style={{ width: 14, height: 14 }} />
          }
          신호 감지
        </Button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #E8E8E8',
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '10px 16px',
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#111111' : '#888888',
                background: 'transparent', border: 'none',
                borderBottom: isActive ? '2px solid #111111' : '2px solid transparent',
                cursor: 'pointer', transition: 'all .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {tab.label}
              <TabTooltip text={tab.tooltip} />
              {tab.alert && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 999,
                  background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 style={{ width: 24, height: 24, color: '#888' }} className="animate-spin" />
          </div>
        ) : !hasData ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888888' }}>
            <Radar style={{ width: 36, height: 36, margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>초기 신호를 감지해보세요</p>
          </div>
        ) : (
          <>
            {/* Content Ranking */}
            {activeTab === 'hooks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* 컬럼 헤더 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '6px 12px', borderRadius: 8,
                  background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                }}>
                  <span style={{ width: 26, flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>순위</span>
                  <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>컨텐츠명</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', minWidth: 45, textAlign: 'right' }}>ENG율</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', minWidth: 55, textAlign: 'right' }}>변동률</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', minWidth: 36, textAlign: 'center' }}>상태</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', minWidth: 46, textAlign: 'center' }}></span>
                </div>
                {hookData.map((item) => (
                  <div key={item.entity_id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10,
                    background: item.rank <= 3 ? '#f8fafc' : 'transparent',
                    border: item.rank <= 3 ? '1px solid #e2e8f0' : '1px solid transparent',
                    transition: 'background .15s',
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      background: item.rank === 1 ? '#f59e0b' : item.rank === 2 ? '#94a3b8' : item.rank === 3 ? '#d4a574' : '#e2e8f0',
                      color: item.rank <= 3 ? '#fff' : '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                    }}>
                      {item.rank}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.entity_name}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111111', fontVariantNumeric: 'tabular-nums', minWidth: 45, textAlign: 'right' }}>
                      {item.value}%
                    </span>
                    <div style={{ minWidth: 55, textAlign: 'right' }}>
                      <ChangeIndicator value={item.change_pct} />
                    </div>
                    <AlertLevelBadge level={item.alert_level} />
                    <GoToButton onClick={() => navigate(`/campaigns/${campaignId}/creative`)} />
                  </div>
                ))}
              </div>
            )}

            {/* Channel Ranking */}
            {activeTab === 'channels' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* 컬럼 설명 헤더 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 16px', borderRadius: 8,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>채널</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>주간 변동률</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', minWidth: 36, textAlign: 'center' }}>상태</span>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 16px', fontSize: 10, color: '#94a3b8', lineHeight: 1.4,
                }}>
                  <span style={{ fontWeight: 700 }}>효율 배수(x)</span>
                  <span>= 해당 채널 ENG율 ÷ 전체 평균 ENG율</span>
                  <span style={{ marginLeft: 4, color: '#64748b' }}>(1.0x = 평균, 2.0x = 2배 효율)</span>
                </div>
                {channelData.map((item) => {
                  const channelColors = {
                    'Instagram Reels': { bg: '#fce7f3', bar: '#ec4899', icon: '📸' },
                    'TikTok': { bg: '#f1f5f9', bar: '#0f172a', icon: '🎵' },
                    'YouTube Shorts': { bg: '#fee2e2', bar: '#ef4444', icon: '▶' },
                    'Blog': { bg: '#dcfce7', bar: '#16a34a', icon: '📝' },
                  };
                  const ch = channelColors[item.entity_name] || { bg: '#f1f5f9', bar: '#64748b', icon: '📊' };
                  return (
                    <div key={item.entity_id} style={{
                      padding: '14px 16px', borderRadius: 12,
                      border: '1px solid #E8E8E8', background: '#fff',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: ch.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14,
                          }}>{ch.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>{item.entity_name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ChangeIndicator value={item.change_pct} />
                          <AlertLevelBadge level={item.alert_level} />
                          <GoToButton onClick={() => navigate(`/campaigns/${campaignId}/creative`)} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            background: ch.bar, width: `${Math.min((item.value / 5) * 100, 100)}%`,
                            transition: 'width .4s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#111111', fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>
                          {item.value}x
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Anomalies — 콘텐츠별 성과점수 이상 감지 */}
            {activeTab === 'anomalies' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {anomalyData.map((item, idx) => {
                  const isHigh = item.severity === 'high';
                  const isMedium = item.severity === 'medium';
                  const severityStyle = isHigh
                    ? { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', label: '심각', scoreBg: '#fecaca' }
                    : isMedium
                      ? { bg: '#fffbeb', border: '#fde68a', icon: '#f59e0b', label: '주의', scoreBg: '#fde68a' }
                      : { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', label: '관찰', scoreBg: '#bfdbfe' };
                  const Icon = isHigh ? AlertTriangle : AlertCircle;
                  return (
                    <div key={idx} style={{
                      padding: '14px 16px', borderRadius: 12,
                      background: severityStyle.bg, border: `1px solid ${severityStyle.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <Icon style={{ width: 18, height: 18, color: severityStyle.icon, flexShrink: 0, marginTop: 1 }} />
                        <div style={{ flex: 1 }}>
                          {/* 콘텐츠명 + 심각도 + 채널 + 바로가기 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>{item.metric}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                              background: severityStyle.border, color: severityStyle.icon,
                            }}>
                              {severityStyle.label}
                            </span>
                            {item.channel && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                                background: '#f1f5f9', color: '#475569',
                              }}>
                                {item.channel}
                              </span>
                            )}
                            <GoToButton onClick={() => navigate(`/campaigns/${campaignId}/creative`)} />
                          </div>
                          {/* 진단 메시지 */}
                          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: '0 0 10px' }}>
                            {item.message}
                          </p>
                          {/* 수치 */}
                          <div style={{ display: 'flex', gap: 12, fontSize: 11, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>그룹평균: <strong style={{ color: '#111111' }}>{item.expected}</strong></span>
                            <span style={{ color: '#64748b' }}>실제: <strong style={{ color: severityStyle.icon }}>{item.actual}</strong></span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 11, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                            {item.eng_deviation != null && (
                              <span style={{ color: '#64748b' }}>참여율 편차: <strong style={{ color: item.eng_deviation < 0 ? '#dc2626' : '#16a34a' }}>{item.eng_deviation > 0 ? '+' : ''}{item.eng_deviation}%</strong></span>
                            )}
                            {item.view_deviation != null && (
                              <span style={{ color: '#64748b' }}>VIEW 편차: <strong style={{ color: item.view_deviation < 0 ? '#dc2626' : '#16a34a' }}>{item.view_deviation > 0 ? '+' : ''}{item.view_deviation}%</strong></span>
                            )}
                          </div>
                          {/* 성과점수 바 */}
                          {item.performance_score != null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>성과점수</span>
                              <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', borderRadius: 999,
                                  background: severityStyle.icon,
                                  width: `${Math.min(Math.max((Math.abs(item.performance_score) / 3) * 100, 10), 100)}%`,
                                  transition: 'width .4s ease',
                                }} />
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 700, color: severityStyle.icon,
                                fontVariantNumeric: 'tabular-nums', minWidth: 36,
                              }}>
                                {item.performance_score.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
