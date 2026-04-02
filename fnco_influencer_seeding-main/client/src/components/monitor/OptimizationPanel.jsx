import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useOptimizations, useGenerateOptimizations, useApplyOptimization } from '@/hooks/useOptimization.js';
import CreativeRotation from '@/components/monitor/CreativeRotation.jsx';
import ChannelRebalance from '@/components/monitor/ChannelRebalance.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Zap, Sparkles, Loader2, RefreshCw, BarChart3, Info } from 'lucide-react';
import { mockOptimizationActions } from '@/mocks/data.js';

export default function OptimizationPanel() {
  const { id: campaignId } = useParams();
  const { data: result, isLoading } = useOptimizations(campaignId);
  const generateMut = useGenerateOptimizations();
  const applyMut = useApplyOptimization();
  const [activeTab, setActiveTab] = useState('creative');

  const apiActions = result?.data || [];
  const actions = apiActions.length > 0 ? apiActions : mockOptimizationActions;

  const grouped = useMemo(() => {
    const creative = actions.filter((a) => a.action_type === 'creative_rotation');
    const channel = actions.find((a) => a.action_type === 'channel_rebalance') || null;
    return { creative, channel };
  }, [actions]);

  const pendingCounts = useMemo(() => ({
    creative: grouped.creative.filter((a) => a.status === 'pending').length,
    channel: grouped.channel?.status === 'pending' ? 1 : 0,
  }), [grouped]);

  const handleGenerate = () => generateMut.mutate(campaignId);
  const handleApply = (actionId) => applyMut.mutate({ campaignId, actionId, status: 'applied', applied_by: 'user' });
  const handleDismiss = (actionId) => applyMut.mutate({ campaignId, actionId, status: 'dismissed', applied_by: 'user' });

  const tabs = [
    { key: 'creative', icon: RefreshCw, label: '콘텐츠 교체', count: pendingCounts.creative, color: '#ef4444',
      tooltip: 'CTR이 하락하거나 피로도가 높은 크리에이티브를 감지하고, 더 높은 성과가 예상되는 콘텐츠로 교체를 추천합니다.',
      content: <CreativeRotation actions={grouped.creative} onApply={handleApply} onDismiss={handleDismiss} /> },
    { key: 'channel', icon: BarChart3, label: '채널 리밸런싱', count: pendingCounts.channel, color: '#3b82f6',
      tooltip: '채널별 ROI와 인게이지먼트 추이를 분석하여 예산 배분 비율의 최적 조합을 추천합니다.',
      content: <ChannelRebalance action={grouped.channel} onApply={handleApply} onDismiss={handleDismiss} /> },
  ];

  const hasAnyActions = actions.length > 0;
  const activeSection = tabs.find((t) => t.key === activeTab);

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
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>실시간 광고 최적화</span>
          {hasAnyActions && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
            }}>
              {pendingCounts.creative + pendingCounts.channel} 액션
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={generateMut.isPending}
          style={{ fontSize: 12, fontWeight: 600, borderRadius: 8, gap: 4 }}
        >
          {generateMut.isPending
            ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
            : <Sparkles style={{ width: 14, height: 14 }} />
          }
          추천 생성
        </Button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #E8E8E8',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '10px 12px',
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? tab.color : '#888888',
                background: 'transparent', border: 'none',
                borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                cursor: 'pointer', transition: 'all .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  minWidth: 16, height: 16, borderRadius: 999,
                  background: isActive ? tab.color : '#e2e8f0',
                  color: isActive ? '#fff' : '#64748b',
                  fontSize: 10, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content — 광고 데이터 연결 전 오버레이 */}
      <div style={{ position: 'relative', minHeight: 160 }}>
        <div style={{ padding: '16px 20px', filter: 'blur(1px)', opacity: 0.4, pointerEvents: 'none' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader2 style={{ width: 24, height: 24, color: '#888' }} className="animate-spin" />
            </div>
          ) : !hasAnyActions ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888888' }}>
              <Zap style={{ width: 36, height: 36, margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>최적화 추천을 생성해보세요</p>
            </div>
          ) : (
            <>
              {activeSection?.tooltip && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 14px', borderRadius: 10,
                  background: `${activeSection.color}08`,
                  border: `1px solid ${activeSection.color}20`,
                  marginBottom: 14,
                }}>
                  <Info style={{ width: 14, height: 14, color: activeSection.color, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {activeSection.tooltip}
                  </p>
                </div>
              )}
              {activeSection?.content}
            </>
          )}
        </div>
        {/* 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          background: 'rgba(255, 255, 255, 0.75)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 6,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#F5F5F5', border: '1px solid #E8E8E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap style={{ width: 18, height: 18, color: '#b0b0b0' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>광고 데이터 연결 전</span>
          <span style={{ fontSize: 11, color: '#888888' }}>광고 플랫폼 연동 후 활성화됩니다</span>
        </div>
      </div>
    </div>
  );
}
