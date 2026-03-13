import { tokens } from '@/styles/designTokens.js';

const STATUS_MAP = {
  not_started: { label: '미시작', bg: tokens.color.surfaceMuted, color: tokens.color.textSubtle },
  in_progress: { label: '진행중', bg: tokens.color.primarySoft, color: tokens.color.primary },
  completed: { label: '완료', bg: tokens.color.successSoft, color: tokens.color.success },
};

export default function PhaseCard({
  phase,
  name,
  description,
  status = 'not_started',
  onClick,
}) {
  const s = STATUS_MAP[status] || STATUS_MAP.not_started;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 14,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: 16,
        cursor: 'pointer',
        transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadow.panel; e.currentTarget.style.transform = 'scale(1.01)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = tokens.shadow.card; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* Phase header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: tokens.color.primarySoft,
              color: tokens.color.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {phase}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{name}</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color }}>
          {s.label}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p style={{ fontSize: 11, color: tokens.color.textSubtle, lineHeight: 1.5, marginBottom: 10 }}>{description}</p>
      )}

    </div>
  );
}
