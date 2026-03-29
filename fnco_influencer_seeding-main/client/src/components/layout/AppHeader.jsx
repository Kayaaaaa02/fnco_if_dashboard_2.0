import { LogOut, User, UserRoundPlus } from 'lucide-react';

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 14px',
  borderRadius: '9999px',
  border: '1px solid #EDD5E8',
  background: 'white',
  color: '#444444',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const btnHoverOn = (e) => {
  e.currentTarget.style.borderColor = '#F19CC3';
  e.currentTarget.style.color = '#F19CC3';
};
const btnHoverOff = (e) => {
  e.currentTarget.style.borderColor = '#EDD5E8';
  e.currentTarget.style.color = '#444444';
};

export default function AppHeader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '16px',
        padding: '12px 32px',
        borderBottom: '1px solid #F0F0F0',
        background: '#ffffff',
        flexShrink: 0,
      }}
    >
      {/* 사용자 정보 */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <User style={{ width: '14px', height: '14px', color: '#888888' }} />
          <span style={{ fontWeight: 500, color: '#111111', fontSize: '14px' }}>
            kayaa(김효은)
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#666666' }}>
          hyoeun28@fnfcorp.com
        </div>
      </div>

      {/* 로그아웃 */}
      <button style={btnStyle} onMouseEnter={btnHoverOn} onMouseLeave={btnHoverOff}>
        <LogOut style={{ width: '14px', height: '14px' }} />
        로그아웃
      </button>

      {/* 권한관리 */}
      <button style={btnStyle} onMouseEnter={btnHoverOn} onMouseLeave={btnHoverOff}>
        <UserRoundPlus style={{ width: '14px', height: '14px' }} />
        권한관리
      </button>
    </div>
  );
}
