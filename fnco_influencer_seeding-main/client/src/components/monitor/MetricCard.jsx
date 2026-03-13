import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const CARD_THEMES = {
  Eye:              { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', iconBg: '#e0e7ff' },
  MousePointerClick:{ color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', iconBg: '#fef3c7' },
  DollarSign:       { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', iconBg: '#d1fae5' },
  TrendingUp:       { color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', iconBg: '#fce7f3' },
};

export default function MetricCard({ label, value, change, icon: Icon, sublabel }) {
  const changeNum = typeof change === 'number' ? change : parseFloat(change) || 0;
  const isPositive = changeNum > 0;
  const isNegative = changeNum < 0;

  const iconName = Icon?.displayName || Icon?.name || '';
  const theme = CARD_THEMES[iconName] || { color: '#6366f1', bg: '#f8fafc', border: tokens.color.border, iconBg: '#e2e8f0' };

  return (
    <div style={{
      borderRadius: 14, border: `1.5px solid ${theme.border}`,
      background: theme.bg,
      padding: '20px 20px 16px',
      position: 'relative', overflow: 'hidden',
      transition: 'box-shadow .2s',
    }}>
      {/* Decorative accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: theme.color,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: theme.color,
            textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
          }}>
            {label}
          </p>
          <p style={{
            fontSize: 28, fontWeight: 800, color: '#1e293b',
            margin: '8px 0 0', lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value ?? '-'}
          </p>
        </div>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: theme.iconBg,
            border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon style={{ width: 20, height: 20, color: theme.color }} />
          </div>
        )}
      </div>

      {/* Change indicator */}
      {change !== undefined && change !== null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 12, paddingTop: 10,
          borderTop: `1px solid ${theme.border}`,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: isPositive ? '#dcfce7' : isNegative ? '#fef2f2' : '#f1f5f9',
            color: isPositive ? '#15803d' : isNegative ? '#dc2626' : '#64748b',
          }}>
            {isPositive ? <TrendingUp style={{ width: 12, height: 12 }} /> :
             isNegative ? <TrendingDown style={{ width: 12, height: 12 }} /> :
             <Minus style={{ width: 12, height: 12 }} />}
            {isPositive ? '+' : ''}{changeNum.toFixed(1)}%
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>전주 대비</span>
        </div>
      )}
    </div>
  );
}
