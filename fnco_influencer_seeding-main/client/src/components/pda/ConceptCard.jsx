import { tokens } from '@/styles/designTokens.js';

const FUNNEL_COLORS = {
  TOFU: { color: '#0284c7', bg: '#e0f2fe' },
  MOFU: { color: '#7c3aed', bg: '#ede9fe' },
  BOFU: { color: '#059669', bg: '#d1fae5' },
};

const AWARENESS_COLORS = {
  A1: { color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  A2: { color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  A3: { color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6' },
  A4: { color: '#10b981', bg: '#d1fae5', text: '#065f46' },
};

function Pill({ children, color, bg, border, tooltip }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} className={tooltip ? 'pda-pill-wrap' : undefined}>
      <span
        style={{
          fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
          color, background: bg, whiteSpace: 'nowrap', lineHeight: 1.3,
          border: border ? `1px solid ${border}` : 'none',
          cursor: tooltip ? 'pointer' : undefined,
        }}
      >
        {children}
      </span>
      {tooltip && (
        <span className="pda-pill-tip" style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 6, padding: '4px 10px', borderRadius: 6,
          background: '#1e293b', color: '#fff',
          fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
          pointerEvents: 'none', opacity: 0, transition: 'opacity .15s',
          zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        }}>
          {tooltip}
          <span style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            border: '4px solid transparent', borderTopColor: '#1e293b',
          }} />
        </span>
      )}
    </span>
  );
}

/* Inject hover style once */
if (typeof document !== 'undefined' && !document.getElementById('pda-pill-style')) {
  const s = document.createElement('style');
  s.id = 'pda-pill-style';
  s.textContent = '.pda-pill-wrap:hover .pda-pill-tip{opacity:1!important}';
  document.head.appendChild(s);
}

export default function ConceptCard({ concept, isLast, checked, onToggleCheck, personaMap = {}, desireMap = {} }) {
  const funnel = concept.funnel || 'TOFU';
  const funnelCfg = FUNNEL_COLORS[funnel] || FUNNEL_COLORS.TOFU;
  const aCode = concept.awareness_code || '';
  const awarenessCfg = AWARENESS_COLORS[aCode] || { color: '#6b7280', bg: '#f3f4f6', text: '#6b7280' };
  const awarenessLabel = concept.awareness_name || concept.awareness_name_eng || aCode;

  const personaTooltip = personaMap[concept.persona_code];
  const desireTooltip = desireMap[concept.desire_code];

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', minHeight: 40,
        background: checked ? '#f0fdf4' : tokens.color.surface,
        borderBottom: isLast ? 'none' : `1px solid ${tokens.color.border}`,
        transition: 'background .12s',
      }}
      onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = tokens.color.surfaceMuted; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = checked ? '#f0fdf4' : tokens.color.surface; }}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggleCheck?.(concept.concept_id ?? concept.id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
          border: checked ? '2px solid #10b981' : `2px solid ${tokens.color.border}`,
          background: checked ? '#10b981' : '#fff',
          cursor: 'pointer', transition: 'all .15s',
        }}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* PDA Badges */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {concept.persona_code && <Pill color="#fff" bg="#7c3aed" tooltip={personaTooltip}>{concept.persona_code}</Pill>}
        {concept.desire_code && <Pill color="#fff" bg="#d97706" tooltip={desireTooltip}>{concept.desire_code}</Pill>}
        {aCode && (
          <Pill color={awarenessCfg.text} bg={awarenessCfg.bg} tooltip={awarenessLabel}>{aCode}</Pill>
        )}
      </div>

      {/* Concept Name — Head Copy */}
      <span style={{
        flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.4, color: tokens.color.text,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontWeight: 700 }}>{concept.concept_name || '(무제)'}</span>
        {concept.head_copy && (
          <span style={{ color: tokens.color.textSubtle, fontWeight: 400 }}> — {concept.head_copy}</span>
        )}
      </span>

      {/* Right: format + placement + funnel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {concept.campaign_placement && (
          <Pill color={tokens.color.textSubtle} bg="transparent" border={tokens.color.border}>
            {concept.campaign_placement}
          </Pill>
        )}
        {concept.format && (
          <Pill color={tokens.color.textSubtle} bg="transparent" border={tokens.color.border}>{concept.format}</Pill>
        )}
        <Pill color={funnelCfg.color} bg={funnelCfg.bg}>{funnel}</Pill>
      </div>
    </div>
  );
}
