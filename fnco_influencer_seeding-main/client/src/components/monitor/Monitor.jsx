import { useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
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
  Target,
  Zap,
  Users,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import { mockMonitorDashboard, mockCampaign } from '@/mocks/data.js';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Area, AreaChart, ComposedChart, Scatter, ZAxis, Cell,
} from 'recharts';

export default function Monitor() {
  const [showZScoreTooltip, setShowZScoreTooltip] = useState(false);
  const { id: campaignId } = useParams();
  const { campaign } = useOutletContext() || {};
  const { data: dashboard, isLoading } = useMonitorDashboard(campaignId);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [metricPeriod, setMetricPeriod] = useState('week'); // 'week' | 'all'
  const [weekStartDate, setWeekStartDate] = useState(() => {
    // 기본: 이번 주 월요일
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 캠페인 정보 (outlet context 우선, 없으면 mock fallback)
  const effectiveCampaign = campaign || mockCampaign || {};
  const productName = effectiveCampaign.product_name || effectiveCampaign.campaign_name || '';
  const campaignStart = effectiveCampaign.scheduled_start || '';
  const campaignEnd = effectiveCampaign.scheduled_end || '';

  // API 데이터가 비어있으면 mock fallback 사용
  const hasApiData = dashboard && (
    (Array.isArray(dashboard.metrics) && dashboard.metrics.length > 0) ||
    (dashboard.summary && dashboard.summary.avg_views > 0)
  );
  const effectiveDashboard = hasApiData ? dashboard : mockMonitorDashboard;

  const rawMetrics = effectiveDashboard?.metrics || [];
  const summary = effectiveDashboard?.summary || {};
  const trend = Array.isArray(effectiveDashboard?.trend) ? effectiveDashboard.trend : [];
  const topCreatives = effectiveDashboard?.top_creatives || [];

  // DB 지표가 있으면 집계, 없으면 summary 사용
  const metrics = (() => {
    if (Array.isArray(rawMetrics) && rawMetrics.length > 0) {
      const totalImpressions = rawMetrics.reduce((s, m) => s + (m.impressions || 0), 0);
      const totalLikes = rawMetrics.reduce((s, m) => s + (m.likes || 0), 0);
      const totalContents = rawMetrics.reduce((s, m) => s + (m.contents_count || 0), 0);
      const avgEngagement = rawMetrics.reduce((s, m) => s + (m.engagement_rate || 0), 0) / rawMetrics.length;
      const avgViews = totalImpressions > 0 ? Math.round(totalImpressions / rawMetrics.length) : (summary.total_impressions ? Math.round(summary.total_impressions / Math.max(rawMetrics.length, 1)) : 0);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#111111' }} />
      </div>
    );
  }

  return (
    <div id="monitor-content" style={{ display: 'flex', flexDirection: 'column', gap: 24, background: '#ffffff', padding: '24px 28px' }}>
      {/* ── Header Banner ── */}
      <div style={{
        borderRadius: 16, overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid #E8E8E8',
        padding: '28px 36px',
        position: 'relative',
      }}>
        {/* Accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#F5F3FF',
                border: '1px solid #E9E5FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity style={{ width: 18, height: 18, color: '#7c3aed' }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111111', margin: 0, letterSpacing: '-0.02em' }}>
                성과 모니터링
              </h1>
              {productName && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                  background: '#F5F3FF', color: '#7c3aed', border: '1px solid #E9E5FF',
                }}>
                  {productName}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#888888', margin: 0 }}>
              캠페인 핵심 성과 지표를 한눈에 확인 가능합니다.
            </p>
            <p style={{ fontSize: 11, color: '#b0b0b0', margin: '4px 0 0' }}>
              업데이트: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              {campaignStart && campaignEnd && (
                <span style={{ marginLeft: 12 }}>캠페인 기간: {campaignStart.slice(0, 10)} ~ {campaignEnd.slice(0, 10)}</span>
              )}
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
        display: 'flex', gap: 2, padding: 3, borderRadius: 12,
        background: '#F5F5F5', border: '1px solid #E8E8E8',
        alignSelf: 'flex-start',
      }}>
        {[
          { key: 'monitoring', label: '성과 모니터링', icon: BarChart3 },
          { key: 'ugc', label: 'UGC 플라이휠', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 9,
                fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#111111' : '#888888',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
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
          {/* ── 기간 선택 ── */}
          {(() => {
            const startD = new Date(weekStartDate);
            const endD = new Date(startD);
            endD.setDate(endD.getDate() + 6);
            const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const fmtLabel = (d) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
            const weekLabel = `${fmtLabel(startD)} ~ ${fmtLabel(endD)}`;

            const shiftWeek = (dir) => {
              const next = new Date(weekStartDate);
              next.setDate(next.getDate() + dir * 7);
              setWeekStartDate(next.toISOString().split('T')[0]);
            };

            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>핵심 지표</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* 주간 / 전체 토글 */}
                  <div style={{
                    display: 'flex', gap: 2, padding: 2, borderRadius: 8,
                    background: '#F5F5F5', border: '1px solid #E8E8E8',
                  }}>
                    {[
                      { key: 'week', label: '주간' },
                      { key: 'all', label: '전체' },
                    ].map((p) => {
                      const isActive = metricPeriod === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => setMetricPeriod(p.key)}
                          style={{
                            padding: '5px 14px', borderRadius: 6,
                            fontSize: 11, fontWeight: isActive ? 700 : 500,
                            border: 'none', cursor: 'pointer',
                            background: isActive ? '#ffffff' : 'transparent',
                            color: isActive ? '#111111' : '#888888',
                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all .15s',
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 주간 모드: 날짜 선택 */}
                  {/* 전체 모드: 캠페인 기간 표시 */}
                  {metricPeriod === 'all' && campaignStart && campaignEnd && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 8,
                      border: '1px solid #E8E8E8', background: '#ffffff',
                      fontSize: 12, fontWeight: 600, color: '#111111',
                      whiteSpace: 'nowrap',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {campaignStart.slice(0, 10)} ~ {campaignEnd.slice(0, 10)}
                    </div>
                  )}

                  {/* 주간 모드: 날짜 선택 */}
                  {metricPeriod === 'week' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
                      {/* 이전 주 */}
                      <button
                        onClick={() => shiftWeek(-1)}
                        style={{
                          width: 28, height: 28, borderRadius: 7,
                          border: '1px solid #E8E8E8', background: '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: 14, color: '#888888',
                          transition: 'all .15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                      >
                        ‹
                      </button>

                      {/* 날짜 표시 + 달력 트리거 */}
                      <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 12px', borderRadius: 8,
                          border: '1px solid #E8E8E8', background: '#ffffff',
                          fontSize: 12, fontWeight: 600, color: '#111111',
                          cursor: 'pointer', transition: 'all .15s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {weekLabel}
                      </button>

                      {/* 다음 주 */}
                      <button
                        onClick={() => shiftWeek(1)}
                        style={{
                          width: 28, height: 28, borderRadius: 7,
                          border: '1px solid #E8E8E8', background: '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: 14, color: '#888888',
                          transition: 'all .15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                      >
                        ›
                      </button>

                      {/* 달력 드롭다운 */}
                      {showDatePicker && (
                        <>
                          <div
                            style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                            onClick={() => setShowDatePicker(false)}
                          />
                          <div style={{
                            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                            background: '#ffffff', border: '1px solid #E8E8E8',
                            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            padding: 16, zIndex: 99, minWidth: 260,
                          }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#888888', margin: '0 0 8px' }}>
                              주간 시작일 선택 (월요일 자동 정렬)
                            </p>
                            <input
                              type="date"
                              value={weekStartDate}
                              onChange={(e) => {
                                const picked = new Date(e.target.value);
                                const day = picked.getDay();
                                const diff = picked.getDate() - day + (day === 0 ? -6 : 1);
                                picked.setDate(diff);
                                setWeekStartDate(picked.toISOString().split('T')[0]);
                                setShowDatePicker(false);
                              }}
                              style={{
                                width: '100%', padding: '8px 12px',
                                border: '1px solid #E8E8E8', borderRadius: 8,
                                fontSize: 13, color: '#111111',
                                outline: 'none',
                              }}
                            />
                            <p style={{ fontSize: 10, color: '#BBBBBB', margin: '8px 0 0' }}>
                              어떤 날짜를 선택해도 해당 주 월요일로 자동 정렬됩니다.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Top Metric Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <MetricCard
              label="평균 조회수"
              value={metrics.avg_views != null ? `${metrics.avg_views.toLocaleString('ko-KR')}회` : '-'}
              change={metrics.avg_views_change}
              icon={Eye}
              kpiTarget={200000}
              totalValue={metrics.avg_views}
            />
            <MetricCard
              label="인게이지먼트율"
              value={metrics.engagement_rate != null ? `${metrics.engagement_rate.toFixed(2)}%` : '-'}
              change={metrics.engagement_rate_change}
              icon={MousePointerClick}
              tooltip={"(좋아요 + 댓글 + 공유) ÷ 조회수 × 100\n\n※ 참여율과 다릅니다\n참여율 = (좋아요+댓글+공유) ÷ 팔로워수 × 100"}
              kpiTarget={3.0}
              totalValue={metrics.engagement_rate}
            />
            <MetricCard
              label="평균 좋아요 수"
              value={metrics.avg_likes != null ? `${metrics.avg_likes.toLocaleString('ko-KR')}회` : '-'}
              change={metrics.avg_likes_change}
              icon={DollarSign}
              kpiTarget={1500}
              totalValue={metrics.avg_likes}
            />
            <MetricCard
              label="컨텐츠 수"
              value={metrics.contents_count != null ? `${metrics.contents_count.toLocaleString('ko-KR')}건` : '-'}
              change={metrics.contents_count_change}
              icon={TrendingUp}
              kpiTarget={30}
              totalValue={metrics.contents_count}
            />
          </div>

          {/* ── 콘텐츠 타임라인 (버블 + 판매량) ── */}
          {(() => {
            // 콘텐츠 버블 데이터 준비 — Z-Score로 버블 크기 산출
            const rawTimeline = effectiveDashboard?.content_timeline || [];
            // 1) 기본 수치 먼저 계산
            const parsed = rawTimeline.map((c) => {
              const views = Number(c.view_count ?? c.views ?? c.impressions ?? 0);
              const likes = Number(c.like_count ?? c.likes ?? 0);
              const comments = Number(c.comment_count ?? c.comments ?? 0);
              const shares = Number(c.share_count ?? c.shares ?? 0);
              const interactions = likes + comments + shares;
              const engRate = views > 0 ? (interactions / views) * 100 : 0;
              return { ...c, views, likes, comments, shares, engRate };
            });
            // 2) Z-Score 산출 (조회수 0.7 + 참여율 0.3)
            const viewArr = parsed.map((p) => p.views);
            const engArr = parsed.map((p) => p.engRate);
            const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
            const std = (arr) => { if (arr.length < 2) return 1; const m = mean(arr); return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length) || 1; };
            const viewMean = mean(viewArr), viewStd = std(viewArr);
            const engMean = mean(engArr), engStd = std(engArr);

            const contentBubbles = parsed.map((p) => {
              const viewZ = (p.views - viewMean) / viewStd;
              const engZ = (p.engRate - engMean) / engStd;
              const zScore = Math.round((0.7 * viewZ + 0.3 * engZ) * 100) / 100;
              // 버블 크기: Z-Score를 양수 스케일로 변환 (최소 200, 최대 2500)
              const bubbleSize = Math.max(Math.min((zScore + 2) * 500, 2500), 200);
              return {
                date: p.upload_dt || p.date || p.created_dt,
                views: p.views,
                engRate: Math.round(p.engRate * 100) / 100,
                zScore,
                bubbleSize,
                title: p.content_summary || p.concept_name || p.title || '콘텐츠',
                creator: p.author_nm || p.creator || '',
                hookType: p.copy_type || '',
                bfGrade: p.bf_grade || (p.views >= 500000 ? 'A' : p.views >= 200000 ? 'B' : 'C'),
                geoReady: p.geo_ready || false,
                platform: p.platform || '',
                thumbnail: p.thumbnail_url || '',
                postUrl: p.post_url || '',
                likes: p.likes,
                comments: p.comments,
                shares: p.shares,
              };
            });
            // 판매량 데이터
            const salesData = effectiveDashboard?.sales_timeline || [];
            const fmtNum = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
            const fmtDate = (val) => { if (!val) return ''; const d = new Date(val); return `${d.getMonth() + 1}/${d.getDate()}`; };

            // 병합 데이터: 판매 타임라인을 기본으로, 콘텐츠 버블을 date 기준으로 매핑
            const dateSet = new Set([...salesData.map((s) => s.date), ...contentBubbles.map((c) => c.date)]);
            const allDates = [...dateSet].sort();
            const bubbleMap = {};
            contentBubbles.forEach((c) => { bubbleMap[c.date] = c; });
            const salesMap = {};
            salesData.forEach((s) => { salesMap[s.date] = s.sales; });
            const mergedData = allDates.map((date) => {
              const bubble = bubbleMap[date];
              return {
                date,
                sales: salesMap[date] ?? null,
                // 버블 데이터 (없으면 null → Scatter에서 무시됨)
                views: bubble?.views ?? null,
                bubbleSize: bubble?.bubbleSize ?? 0,
                zScore: bubble?.zScore ?? null,
                title: bubble?.title ?? null,
                creator: bubble?.creator ?? null,
                hookType: bubble?.hookType ?? null,
                platform: bubble?.platform ?? null,
                thumbnail: bubble?.thumbnail ?? null,
                engRate: bubble?.engRate ?? null,
                likes: bubble?.likes ?? null,
                comments: bubble?.comments ?? null,
                shares: bubble?.shares ?? null,
                geoReady: bubble?.geoReady ?? false,
                bfGrade: bubble?.bfGrade ?? null,
              };
            });

            const hasData = contentBubbles.length > 0 || salesData.length > 0;

            return (
              <div style={{ borderRadius: 14, border: '1px solid #E8E8E8', background: '#ffffff', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart3 style={{ width: 14, height: 14, color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>콘텐츠 타임라인</span>
                    <span style={{ fontSize: 10, color: '#b0b0b0', fontWeight: 500 }}>
                      업데이트: {(() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }); })()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {salesData.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 16, height: 3, background: '#a78bfa', borderRadius: 2 }} />
                        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>판매량</span>
                      </div>
                    )}
                    <div style={{ position: 'relative' }} onMouseEnter={() => setShowZScoreTooltip(true)} onMouseLeave={() => setShowZScoreTooltip(false)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'help' }}>
                        {[
                          { color: '#f97316', sz: 10 },
                          { color: '#ec4899', sz: 7 },
                          { color: '#8b5cf6', sz: 5 },
                        ].map(({ color, sz }, i) => (
                          <div key={i} style={{ width: sz, height: sz, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        ))}
                        <span style={{ fontSize: 10, color: '#94a3b8', borderBottom: '1px dotted #94a3b8' }}>성과지수 (크기·색상)</span>
                      </div>
                      {showZScoreTooltip && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', zIndex: 50, marginTop: 4,
                          width: 288, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff',
                          padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          fontSize: 10, lineHeight: 1.7, color: '#475569',
                        }}>
                          <div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>성과지수 = (0.7 × 조회수_z) + (0.3 × 참여율_z)</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
                            {[
                              { color: '#f97316', label: '≥ 1.5 — 상위 성과', sz: '큰 버블' },
                              { color: '#ec4899', label: '≥ 0.5 — 평균 이상', sz: '중간 버블' },
                              { color: '#8b5cf6', label: '< 0.5 — 평균 이하', sz: '작은 버블' },
                            ].map(({ color, label, sz }) => (
                              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span><b style={{ color }}>{label}</b> · {sz}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                            조회수_z = (조회수 - 채널그룹 평균) / 표준편차<br/>
                            참여율_z = (참여율 - 채널그룹 평균) / 표준편차
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 20px' }}>
                  {hasData ? (
                    <ResponsiveContainer width="100%" height={360}>
                      <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                        <defs>
                          <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                        <XAxis
                          dataKey="date"
                          type="category"
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          axisLine={false} tickLine={false}
                          tickFormatter={fmtDate}
                          allowDuplicatedCategory={false}
                        />
                        <YAxis
                          yAxisId="views"
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          axisLine={false} tickLine={false}
                          tickFormatter={fmtNum}
                          label={{ value: '조회수', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 10, fill: '#94a3b8' } }}
                        />
                        {salesData.length > 0 && (
                          <YAxis
                            yAxisId="sales"
                            orientation="right"
                            tick={{ fontSize: 11, fill: '#a78bfa' }}
                            axisLine={false} tickLine={false}
                            tickFormatter={(v) => v.toLocaleString()}
                            label={{ value: '판매량', angle: 90, position: 'insideRight', offset: -5, style: { fontSize: 10, fill: '#a78bfa' } }}
                          />
                        )}
                        <ZAxis dataKey="bubbleSize" range={[200, 2000]} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0]?.payload;
                            if (!d) return null;
                            // 판매 데이터만 있는 날짜
                            if (d.views == null) {
                              return (
                                <div style={{ background: '#1e1b4b', color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 11, lineHeight: 1.6, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmtDate(d.date)}</div>
                                  <div>판매량: <b>{d.sales?.toLocaleString()}건</b></div>
                                </div>
                              );
                            }
                            // 콘텐츠 버블
                            const PLAT_LABEL = { tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram' };
                            return (
                              <div style={{ background: '#1e1b4b', color: '#fff', borderRadius: 12, fontSize: 11, width: 300, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                                {/* 썸네일 */}
                                {d.thumbnail && (
                                  <div style={{ position: 'relative' }}>
                                    <img src={d.thumbnail} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, #1e1b4b)' }} />
                                    {/* 플랫폼 뱃지 */}
                                    <span style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                                      {PLAT_LABEL[d.platform] || d.platform}
                                    </span>
                                    {/* Z-Score 뱃지 */}
                                    <span style={{
                                      position: 'absolute', top: 8, right: 8, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                                      background: d.zScore >= 1.5 ? '#f97316' : d.zScore >= 0.5 ? '#ec4899' : '#8b5cf6',
                                      color: '#fff',
                                    }}>
                                      Z {d.zScore > 0 ? '+' : ''}{d.zScore}
                                    </span>
                                  </div>
                                )}
                                {/* 콘텐츠 정보 */}
                                <div style={{ padding: '12px 16px' }}>
                                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 3, lineHeight: 1.4 }}>{d.title}</div>
                                  {d.creator && (
                                    <div style={{ color: '#c4b5fd', fontSize: 11, marginBottom: 8 }}>@{d.creator} · {fmtDate(d.date)}</div>
                                  )}
                                  {/* 수치 그리드 */}
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8 }}>
                                    {[
                                      { label: '조회수', value: fmtNum(d.views) },
                                      { label: '좋아요', value: fmtNum(d.likes || 0) },
                                      { label: '댓글', value: fmtNum(d.comments || 0) },
                                      { label: '참여율', value: `${d.engRate}%` },
                                    ].map(({ label, value }) => (
                                      <div key={label}>
                                        <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0e7ff' }}>{value}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Hook 태그 */}
                                  {d.hookType && (
                                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
                                      Hook: {d.hookType}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }}
                        />
                        {/* 판매량 영역 그래프 */}
                        {salesData.length > 0 && (
                          <Area
                            yAxisId="sales"
                            dataKey="sales"
                            type="monotone"
                            stroke="#a78bfa"
                            strokeWidth={2}
                            fill="url(#gradSales)"
                            dot={false}
                            name="판매량"
                            connectNulls
                          />
                        )}
                        {/* 콘텐츠 버블 — 주황/핑크/보라 3단계 */}
                        <Scatter
                          yAxisId="views"
                          dataKey="views"
                          name="콘텐츠"
                          isAnimationActive={false}
                        >
                          {mergedData.map((entry, idx) => {
                            if (entry.views == null) return <Cell key={`bubble-${idx}`} fill="transparent" stroke="none" />;
                            const z = entry.zScore ?? 0;
                            const color = z >= 1.5 ? '#f97316' : z >= 0.5 ? '#ec4899' : '#8b5cf6';
                            return (
                              <Cell
                                key={`bubble-${idx}`}
                                fill={color}
                                fillOpacity={0.8}
                                stroke="#fff"
                                strokeWidth={1.5}
                              />
                            );
                          })}
                        </Scatter>
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#888888' }}>
                      <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <BarChart3 style={{ width: 24, height: 24, opacity: 0.4 }} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111111', margin: 0 }}>타임라인 데이터가 없습니다</p>
                      <p style={{ fontSize: 12, margin: '6px 0 0', color: '#888888' }}>시딩 콘텐츠가 등록되면 버블 차트가 표시됩니다</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Two Column Layout: Early Signal + Optimization ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <EarlySignal />
            <OptimizationPanel />
          </div>

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
