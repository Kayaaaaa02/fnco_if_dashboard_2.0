import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Target } from 'lucide-react';

const CARD_THEMES = {
  Eye:              { color: '#6366f1', bg: '#ffffff', accent: '#eef2ff', border: '#e0e7ff', iconBg: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  MousePointerClick:{ color: '#f59e0b', bg: '#ffffff', accent: '#fffbeb', border: '#fde68a', iconBg: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  DollarSign:       { color: '#10b981', bg: '#ffffff', accent: '#ecfdf5', border: '#a7f3d0', iconBg: 'linear-gradient(135deg, #10b981, #34d399)' },
  TrendingUp:       { color: '#ec4899', bg: '#ffffff', accent: '#fdf2f8', border: '#fbcfe8', iconBg: 'linear-gradient(135deg, #ec4899, #f472b6)' },
};

export default function MetricCard({ label, value, change, icon: Icon, tooltip, kpiTarget, totalValue }) {
  const [showTip, setShowTip] = useState(false);
  const changeNum = typeof change === 'number' ? change : parseFloat(change) || 0;
  const isPositive = changeNum > 0;
  const isNegative = changeNum < 0;

  const iconName = Icon?.displayName || Icon?.name || '';
  const theme = CARD_THEMES[iconName] || { color: '#6366f1', bg: '#ffffff', accent: '#f8fafc', border: '#e2e8f0', iconBg: 'linear-gradient(135deg, #6366f1, #818cf8)' };

  // KPI 달성률 계산
  const kpiAchievement = (kpiTarget != null && totalValue != null && kpiTarget > 0)
    ? Math.round((totalValue / kpiTarget) * 100)
    : null;

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${theme.border}`,
      background: theme.bg,
      padding: '22px 22px 18px',
      position: 'relative',
      transition: 'box-shadow .2s, transform .2s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: theme.iconBg,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: theme.color,
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
            }}>
              {label}
            </p>
            {tooltip && (
              <span
                style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
              >
                <Info style={{ width: 12, height: 12, color: '#b0b0b0' }} />
                {showTip && (
                  <span style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '8px 12px', background: 'rgba(34, 34, 34, 0.7)', backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    fontSize: 11, fontWeight: 400, lineHeight: 1.5,
                    borderRadius: 8, whiteSpace: 'pre-line', zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    pointerEvents: 'none', width: 260,
                  }}>
                    {tooltip}
                  </span>
                )}
              </span>
            )}
          </div>
          <p style={{
            fontSize: 30, fontWeight: 800, color: '#111111',
            margin: '10px 0 0', lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value ?? '-'}
          </p>
        </div>
        {Icon && (
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: theme.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon style={{ width: 22, height: 22, color: '#ffffff' }} />
          </div>
        )}
      </div>

      {/* WoW 전주 대비 + KPI 목표 대비 */}
      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: `1px solid ${theme.border}`,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* WoW 전주 대비 */}
        {change !== undefined && change !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: isPositive ? '#dcfce7' : isNegative ? '#fef2f2' : '#f1f5f9',
              color: isPositive ? '#15803d' : isNegative ? '#dc2626' : '#64748b',
            }}>
              {isPositive ? <TrendingUp style={{ width: 11, height: 11 }} /> :
               isNegative ? <TrendingDown style={{ width: 11, height: 11 }} /> :
               <Minus style={{ width: 11, height: 11 }} />}
              {isPositive ? '+' : ''}{changeNum.toFixed(1)}%
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>WoW 전주 대비</span>
          </div>
        )}

        {/* KPI 목표 대비 TTL */}
        {kpiAchievement != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target style={{ width: 11, height: 11, color: '#94a3b8' }} />
              <span style={{ fontSize: 10, color: '#94a3b8' }}>KPI 목표 대비</span>
            </div>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: kpiAchievement >= 100 ? '#10b981' : kpiAchievement >= 70 ? '#f59e0b' : '#ef4444',
                width: `${Math.min(kpiAchievement, 100)}%`,
                transition: 'width .4s ease',
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, minWidth: 36, textAlign: 'right',
              color: kpiAchievement >= 100 ? '#10b981' : kpiAchievement >= 70 ? '#f59e0b' : '#ef4444',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {kpiAchievement}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
