import { useState } from 'react';
import { ArrowRight, Check, X, Info } from 'lucide-react';

const PRIORITY = {
  high:   { label: '긴급', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  medium: { label: '보통', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  low:    { label: '낮음', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
};

function CtrWithTooltip({ withRec }) {
  const [show, setShow] = useState(false);
  const hasDetail = withRec.q3_avg_ctr != null;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#111111' }}>
        예상 CTR {withRec.predicted_ctr}%
      </span>
      {hasDetail && (
        <span
          style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          <Info style={{ width: 12, height: 12, color: '#BBBBBB' }} />
          {show && (
            <span style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 14px', background: 'rgba(34,34,34,0.92)', backdropFilter: 'blur(8px)',
              color: '#ffffff', fontSize: 11, lineHeight: 1.7,
              borderRadius: 10, zIndex: 9999, width: 280,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}>
              <strong style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>예상 CTR 산정 로직</strong>
              <span>① 비교 그룹: {withRec.reference_group} ({withRec.group_size}개)</span><br />
              <span>② Q3(상위 25%) 평균 CTR: {withRec.q3_avg_ctr}%</span><br />
              <span>③ 보수적 보정: ×{withRec.discount_factor}</span><br />
              <span style={{ borderTop: '1px solid rgba(255,255,255,0.15)', display: 'block', paddingTop: 4, marginTop: 4 }}>
                = {withRec.q3_avg_ctr}% × {withRec.discount_factor} = <strong>{withRec.predicted_ctr}%</strong>
              </span>
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export default function CreativeRotation({ actions = [], onApply, onDismiss }) {
  if (!actions || actions.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#888888' }}>
        <p style={{ fontSize: 13 }}>교체 추천이 없습니다</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {actions.map((action) => {
        const rec = action.recommendation || {};
        const replace = rec.replace || {};
        const withRec = rec.with || {};
        const priority = PRIORITY[rec.priority] || PRIORITY.medium;
        const isResolved = action.status !== 'pending';

        return (
          <div
            key={action.action_id}
            style={{
              borderRadius: 12, border: '1px solid #E8E8E8',
              background: '#ffffff', overflow: 'hidden',
              opacity: isResolved ? 0.45 : 1,
            }}
          >
            {/* 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 16px',
              background: '#FAFAFA', borderBottom: '1px solid #E8E8E8',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: priority.color,
                background: priority.bg, border: `1px solid ${priority.border}`,
                padding: '2px 10px', borderRadius: 999,
              }}>
                우선순위: {priority.label}
              </span>
              {isResolved && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                  background: '#F5F5F5', color: '#888888',
                }}>
                  {action.status === 'applied' ? '적용됨' : '무시됨'}
                </span>
              )}
            </div>

            {/* 교체 대상 → 교체 제안 */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
                {/* 교체 대상 */}
                <div style={{
                  flex: 1, padding: '12px 14px', borderRadius: 10,
                  background: '#FAFAFA', border: '1px solid #E8E8E8',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#888888', display: 'block', marginBottom: 6 }}>교체 대상</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111111', margin: '0 0 4px', lineHeight: 1.4 }}>
                    {replace.creative_name}
                  </p>
                  <p style={{ fontSize: 11, color: '#999999', margin: '0 0 6px', lineHeight: 1.4 }}>
                    {replace.reason}
                  </p>
                  {replace.current_ctr != null && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111111' }}>
                      CTR {replace.current_ctr}%
                    </span>
                  )}
                </div>

                {/* 화살표 */}
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <ArrowRight style={{ width: 16, height: 16, color: '#CCCCCC' }} />
                </div>

                {/* 교체 제안 */}
                <div style={{
                  flex: 1, padding: '12px 14px', borderRadius: 10,
                  background: '#FAFAFA', border: '1px solid #E8E8E8',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#888888', display: 'block', marginBottom: 6 }}>교체 제안</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111111', margin: '0 0 4px', lineHeight: 1.4 }}>
                    {withRec.hook_text}
                  </p>
                  <p style={{ fontSize: 11, color: '#999999', margin: '0 0 6px', lineHeight: 1.4 }}>
                    유형: {withRec.hook_type}
                  </p>
                  {withRec.predicted_ctr != null && (
                    <CtrWithTooltip withRec={withRec} />
                  )}
                </div>
              </div>

              {/* CTR 개선 예상 */}
              {replace.current_ctr != null && withRec.predicted_ctr != null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginTop: 12, padding: '8px 12px', borderRadius: 8,
                  background: '#FAFAFA', border: '1px solid #F0F0F0',
                }}>
                  <span style={{ fontSize: 10, color: '#999999', fontWeight: 600, flexShrink: 0 }}>CTR 개선</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 999, background: '#E8E8E8', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999,
                      background: '#111111',
                      width: `${Math.min((withRec.predicted_ctr / Math.max(replace.current_ctr, 0.1)) * 20, 100)}%`,
                      transition: 'width .4s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#111111' }}>
                    +{(withRec.predicted_ctr - replace.current_ctr).toFixed(1)}%p
                  </span>
                </div>
              )}

              {/* 액션 버튼 */}
              {!isResolved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => onApply?.(action.action_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 16px', borderRadius: 8,
                      background: '#111111', color: '#ffffff',
                      fontSize: 12, fontWeight: 600,
                      border: 'none', cursor: 'pointer', transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#333333'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#111111'; }}
                  >
                    <Check style={{ width: 12, height: 12 }} />
                    적용
                  </button>
                  <button
                    onClick={() => onDismiss?.(action.action_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 16px', borderRadius: 8,
                      background: '#ffffff', color: '#888888',
                      fontSize: 12, fontWeight: 600,
                      border: '1px solid #E8E8E8', cursor: 'pointer', transition: 'all .15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C0C0C0'; e.currentTarget.style.color = '#111111'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.color = '#888888'; }}
                  >
                    <X style={{ width: 12, height: 12 }} />
                    무시
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
