import { Check, X, ArrowRight } from 'lucide-react';

const CHANNEL_ICONS = {
  'Instagram Reels': '📸',
  'TikTok': '🎵',
  'YouTube Shorts': '▶',
  'Blog': '📝',
};

export default function ChannelRebalance({ action, onApply, onDismiss }) {
  if (!action) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#888888' }}>
        <p style={{ fontSize: 13 }}>채널 리밸런싱 추천이 없습니다</p>
      </div>
    );
  }

  const rec = action.recommendation || {};
  const channels = rec.channels || [];
  const isResolved = action.status !== 'pending';

  return (
    <div style={{ opacity: isResolved ? 0.45 : 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isResolved && (
        <span style={{
          alignSelf: 'flex-start', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
          background: '#F5F5F5', color: '#888888',
        }}>
          {action.status === 'applied' ? '적용됨' : '무시됨'}
        </span>
      )}

      {/* 테이블 */}
      <div style={{
        borderRadius: 12, border: '1px solid #E8E8E8',
        background: '#ffffff', overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 72px 32px 72px 64px',
          alignItems: 'center', gap: 8,
          padding: '8px 16px',
          background: '#FAFAFA', borderBottom: '1px solid #E8E8E8',
          fontSize: 10, fontWeight: 700, color: '#999999',
        }}>
          <span>채널</span>
          <span style={{ textAlign: 'center' }}>현재</span>
          <span />
          <span style={{ textAlign: 'center' }}>추천</span>
          <span style={{ textAlign: 'right' }}>변동</span>
        </div>

        {/* 행 */}
        {channels.map((ch, idx) => {
          const diff = ch.recommended_pct - ch.current_pct;
          const isLast = idx === channels.length - 1;
          const icon = CHANNEL_ICONS[ch.channel] || '📊';

          return (
            <div
              key={ch.channel}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 72px 32px 72px 64px',
                alignItems: 'center', gap: 8,
                padding: '12px 16px',
                borderBottom: isLast ? 'none' : '1px solid #F0F0F0',
                transition: 'background .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* 채널명 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: '#F5F5F5', border: '1px solid #E8E8E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0,
                }}>{icon}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#111111', display: 'block' }}>{ch.channel}</span>
                  <span style={{ fontSize: 10, color: '#BBBBBB' }}>ROI {ch.roi_score}x</span>
                </div>
              </div>

              {/* 현재 */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#999999', display: 'block', textAlign: 'center' }}>
                  {ch.current_pct}%
                </span>
                <div style={{ height: 3, borderRadius: 999, background: '#F0F0F0', overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ height: '100%', borderRadius: 999, background: '#CCCCCC', width: `${ch.current_pct}%` }} />
                </div>
              </div>

              {/* 화살표 */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowRight style={{ width: 12, height: 12, color: '#CCCCCC' }} />
              </div>

              {/* 추천 */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111111', display: 'block', textAlign: 'center' }}>
                  {ch.recommended_pct}%
                </span>
                <div style={{ height: 3, borderRadius: 999, background: '#F0F0F0', overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ height: '100%', borderRadius: 999, background: '#111111', width: `${ch.recommended_pct}%` }} />
                </div>
              </div>

              {/* 변동 */}
              <div style={{ textAlign: 'right' }}>
                {diff !== 0 ? (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#111111',
                  }}>
                    {diff > 0 ? '+' : ''}{diff}%p
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#BBBBBB' }}>유지</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 사유 */}
      <div style={{
        borderRadius: 10, background: '#FAFAFA', border: '1px solid #F0F0F0',
        padding: '10px 14px',
      }}>
        {channels.map((ch, idx) => (
          <div key={ch.channel} style={{
            display: 'flex', alignItems: 'flex-start', gap: 6,
            marginBottom: idx < channels.length - 1 ? 5 : 0,
          }}>
            <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>{CHANNEL_ICONS[ch.channel] || '📊'}</span>
            <span style={{ fontSize: 11, color: '#888888', lineHeight: 1.4 }}>{ch.reason}</span>
          </div>
        ))}
      </div>

      {/* 액션 */}
      {!isResolved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            리밸런싱 적용
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
  );
}
