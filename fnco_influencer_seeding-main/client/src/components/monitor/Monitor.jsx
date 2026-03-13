import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMonitorDashboard } from '@/hooks/useMonitor';
import MetricCard from '@/components/monitor/MetricCard.jsx';
import PDAHeatmap from '@/components/monitor/PDAHeatmap.jsx';
import FatigueTracker from '@/components/monitor/FatigueTracker.jsx';
import EarlySignal from '@/components/monitor/EarlySignal.jsx';
import OptimizationPanel from '@/components/monitor/OptimizationPanel.jsx';
import UGCFlywheel from '@/components/monitor/UGCFlywheel.jsx';
import ExportMenu from '@/components/export/ExportMenu.jsx';
import { exportSectionToPDF } from '@/lib/exportPDF';
import { exportMetricsToExcel } from '@/lib/exportCSV';
import {
  Eye,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
  Radio,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';

export default function Monitor() {
  const { id: campaignId } = useParams();
  const { data: dashboard, isLoading } = useMonitorDashboard(campaignId);
  const [activeTab, setActiveTab] = useState('monitoring');

  const rawMetrics = dashboard?.metrics || [];
  const summary = dashboard?.summary || {};
  const trend = Array.isArray(dashboard?.trend) ? dashboard.trend : [];

  // DB 지표가 있으면 집계, 없으면 summary 사용
  const metrics = (() => {
    if (Array.isArray(rawMetrics) && rawMetrics.length > 0) {
      const totalImpressions = rawMetrics.reduce((s, m) => s + (m.impressions || 0), 0);
      const totalLikes = rawMetrics.reduce((s, m) => s + (m.likes || 0), 0);
      const totalContents = rawMetrics.reduce((s, m) => s + (m.contents_count || 0), 0);
      const avgEngagement = rawMetrics.reduce((s, m) => s + (m.engagement_rate || 0), 0) / rawMetrics.length;
      const avgViews = totalImpressions > 0 ? Math.round(totalImpressions / rawMetrics.length) : (summary.total_impressions ? Math.round(summary.total_impressions / Math.max(rawMetrics.length, 1)) : 0);
      // 최근 절반 vs 이전 절반으로 변화율 계산
      const half = Math.floor(rawMetrics.length / 2);
      const recent = rawMetrics.slice(0, half);
      const older = rawMetrics.slice(half);
      const recentAvgViews = recent.length > 0 ? recent.reduce((s, m) => s + (m.impressions || 0), 0) / recent.length : 0;
      const olderAvgViews = older.length > 0 ? older.reduce((s, m) => s + (m.impressions || 0), 0) / older.length : 0;
      const recentAvgEng = recent.length > 0 ? recent.reduce((s, m) => s + (m.engagement_rate || 0), 0) / recent.length : 0;
      const olderAvgEng = older.length > 0 ? older.reduce((s, m) => s + (m.engagement_rate || 0), 0) / older.length : 0;
      const recentAvgLikes = recent.length > 0 ? recent.reduce((s, m) => s + (m.likes || 0), 0) / recent.length : 0;
      const olderAvgLikes = older.length > 0 ? older.reduce((s, m) => s + (m.likes || 0), 0) / older.length : 0;
      const recentContents = recent.reduce((s, m) => s + (m.contents_count || 0), 0);
      const olderContents = older.reduce((s, m) => s + (m.contents_count || 0), 0);
      return {
        avg_views: avgViews,
        avg_views_change: olderAvgViews > 0 ? ((recentAvgViews - olderAvgViews) / olderAvgViews) * 100 : 0,
        engagement_rate: avgEngagement,
        engagement_rate_change: olderAvgEng > 0 ? ((recentAvgEng - olderAvgEng) / olderAvgEng) * 100 : 0,
        avg_likes: totalLikes > 0 ? Math.round(totalLikes / rawMetrics.length) : 0,
        avg_likes_change: olderAvgLikes > 0 ? ((recentAvgLikes - olderAvgLikes) / olderAvgLikes) * 100 : 0,
        contents_count: totalContents,
        contents_count_change: olderContents > 0 ? ((recentContents - olderContents) / olderContents) * 100 : 0,
      };
    }
    // fallback: summary 기반
    return {
      avg_views: summary.avg_views || null,
      avg_views_change: null,
      engagement_rate: summary.avg_engagement_rate || null,
      engagement_rate_change: null,
      avg_likes: summary.avg_likes || null,
      avg_likes_change: null,
      contents_count: summary.total_contents_count || null,
      contents_count_change: null,
    };
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div id="monitor-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header Banner ── */}
      <div style={{
        borderRadius: 16, overflow: 'hidden',
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)',
        padding: '28px 32px',
        position: 'relative',
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', top: 10, right: 200, width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Activity style={{ width: 22, height: 22, color: '#a7f3d0' }} />
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>성과 모니터링</h1>
              {/* Live indicator */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                background: 'rgba(255,255,255,0.15)', color: '#a7f3d0',
              }}>
                <Radio style={{ width: 10, height: 10 }} />
                LIVE
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#a7f3d0', margin: 0 }}>
              캠페인 핵심 성과 지표를 실시간으로 추적합니다
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExportMenu
              onExportPDF={() => exportSectionToPDF('monitor-content', `성과리포트-${campaignId}`)}
              onExportCSV={() => exportMetricsToExcel(metrics, trend, campaignId)}
            />
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{
        display: 'flex', gap: 4, padding: 4, borderRadius: 12,
        background: tokens.color.surfaceMuted, border: `1px solid ${tokens.color.border}`,
        alignSelf: 'flex-start',
      }}>
        {[
          { key: 'monitoring', label: '성과 모니터링', icon: BarChart3 },
          { key: 'ugc', label: 'UGC 플라이휠', icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: 'none',
                background: isActive ? tokens.color.surface : 'transparent',
                color: isActive ? '#1e293b' : '#94a3b8',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all .15s ease',
              }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'monitoring' ? (
        <>
          {/* ── Top Metric Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <MetricCard
              label="평균 조회수"
              value={metrics.avg_views != null ? `${metrics.avg_views.toLocaleString('ko-KR')}회` : '-'}
              change={metrics.avg_views_change}
              icon={Eye}
            />
            <MetricCard
              label="인게이지먼트율"
              value={metrics.engagement_rate != null ? `${metrics.engagement_rate.toFixed(2)}%` : '-'}
              change={metrics.engagement_rate_change}
              icon={MousePointerClick}
            />
            <MetricCard
              label="평균 좋아요 수"
              value={metrics.avg_likes != null ? `${metrics.avg_likes.toLocaleString('ko-KR')}회` : '-'}
              change={metrics.avg_likes_change}
              icon={DollarSign}
            />
            <MetricCard
              label="컨텐츠 수"
              value={metrics.contents_count != null ? `${metrics.contents_count.toLocaleString('ko-KR')}건` : '-'}
              change={metrics.contents_count_change}
              icon={TrendingUp}
            />
          </div>

          {/* ── Performance Trend Chart ── */}
          <div style={{
            borderRadius: 14, border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface, boxShadow: tokens.shadow.card,
            overflow: 'hidden',
          }}>
            {/* Section header */}
            <div style={{
              padding: '12px 20px',
              borderBottom: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 style={{ width: 15, height: 15, color: '#6366f1' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>성과 추이</span>
              </div>
              {trend.length > 0 && (
                <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>
                  최근 {trend.length}일
                </span>
              )}
            </div>

            <div style={{ padding: '16px 20px' }}>
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={tokens.color.border} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(val) => {
                        if (!val) return '';
                        const d = new Date(val);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12, borderRadius: 10,
                        border: `1px solid ${tokens.color.border}`,
                        background: tokens.color.surface,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      labelFormatter={(val) => val ? new Date(val).toLocaleDateString('ko-KR') : ''}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Area type="monotone" dataKey="avg_views" name="평균 조회수" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradImpressions)" dot={false} activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="avg_likes" name="평균 좋아요" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gradClicks)" dot={false} activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="contents_count" name="컨텐츠 수" stroke="#10b981" strokeWidth={2.5} fill="url(#gradConversions)" dot={false} activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '48px 0', color: tokens.color.textSubtle,
                }}>
                  <BarChart3 style={{ width: 40, height: 40, marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>추이 데이터가 없습니다</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>목 데이터를 생성하면 트렌드 차트가 표시됩니다</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Early Signal Detection ── */}
          <EarlySignal />

          {/* ── Real-time Optimization ── */}
          <OptimizationPanel />

          {/* ── PDA Heatmap (full width) ── */}
          <PDAHeatmap />

          {/* ── Fatigue Tracker ── */}
          <FatigueTracker />
        </>
      ) : (
        <UGCFlywheel />
      )}
    </div>
  );
}
