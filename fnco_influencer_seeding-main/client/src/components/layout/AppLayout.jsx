import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { tokens } from '@/styles/designTokens.js';

const NAV_ITEMS = [
  { to: '/campaigns', label: '캠페인 빌더' },
  { to: '/content-engine', label: '콘텐츠 엔진' },
  { to: '/creator-hub', label: '크리에이터 허브' },
  { to: '/influencer-pool', label: '인플루언서 풀' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: '설정' },
];

const CAMPAIGN_STATUS_ITEMS = [
  { status: 'draft', label: 'NEW' },
  { status: 'active', label: '진행중' },
  { status: 'completed', label: '완료' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCampaignMenuOpen, setIsCampaignMenuOpen] = useState(false);
  const isCampaignRoute = location.pathname.startsWith('/campaigns');
  const isCampaignListRoute = location.pathname === '/campaigns';
  const campaignQuery = new URLSearchParams(location.search);
  const currentCampaignStatus = campaignQuery.get('status') || 'all';
  const showCampaignStatusMenu = isCampaignMenuOpen || (isCampaignListRoute && currentCampaignStatus !== 'all');
  const activeMenuStyle = {
    background: tokens.color.surface,
    color: tokens.color.text,
    border: `1px solid ${tokens.color.borderStrong}`,
    boxShadow: 'none',
  };
  const inactiveMenuStyle = {
    background: 'transparent',
    color: tokens.color.textSubtle,
    border: '1px solid transparent',
  };

  return (
    <div className="flex h-screen" style={{ background: tokens.color.canvas }}>
      <aside
        className="shrink-0 border-r"
        style={{
          width: 220,
          background: tokens.color.sidebar,
          borderColor: tokens.color.border,
        }}
      >
        <div className="px-6 pb-6 pt-8">
          <img src="/fnco.png" alt="F&CO" className="h-8 w-auto" />
        </div>

        <nav className="space-y-3 px-4">
          <div>
            <button
              type="button"
              onClick={() => {
                setIsCampaignMenuOpen((prev) => !prev);
                navigate('/campaigns');
              }}
              className="block w-full rounded-[14px] px-4 py-3 text-left text-base font-bold leading-tight tracking-[-0.02em] transition"
              style={isCampaignRoute || showCampaignStatusMenu ? activeMenuStyle : inactiveMenuStyle}
            >
              캠페인 빌더
            </button>

            {showCampaignStatusMenu && (
              <div className="mt-2 space-y-1 pl-5">
                {CAMPAIGN_STATUS_ITEMS.map((item) => (
                  <NavLink
                    key={item.status}
                    to={`/campaigns?status=${item.status}`}
                    className="block rounded-[10px] px-3 py-2 text-sm font-bold leading-tight transition"
                    style={() => ((isCampaignListRoute && currentCampaignStatus === item.status) ? activeMenuStyle : inactiveMenuStyle)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {NAV_ITEMS.slice(1).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsCampaignMenuOpen(false)}
              className="block rounded-[14px] px-4 py-3 text-base font-bold leading-tight tracking-[-0.02em] transition"
              style={({ isActive }) => (isActive ? activeMenuStyle : inactiveMenuStyle)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* 우측 상단 계정정보 */}
        <div
          className="flex items-center gap-4"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 50,
            padding: '12px 32px',
          }}
        >
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: tokens.color.text, lineHeight: 1.4 }}>
              kayaa(김효은) F/KR/DD/PRCS/AX
            </p>
            <p className="text-xs" style={{ color: tokens.color.textSubtle, lineHeight: 1.3 }}>
              hyoeun28@fnfcorp.com
            </p>
          </div>
          <Button
            variant="outline"
            className="h-8 rounded-lg px-4 text-[13px] font-semibold"
            style={{ borderColor: tokens.color.border, color: tokens.color.text, background: tokens.color.surface }}
          >
            로그아웃
          </Button>
          <Button
            variant="outline"
            className="h-8 rounded-lg px-4 text-[13px] font-semibold"
            style={{ borderColor: tokens.color.border, color: tokens.color.text, background: tokens.color.surface }}
          >
            권한관리
          </Button>
        </div>

        <main className="flex-1 overflow-auto" style={{ background: tokens.color.canvas, paddingTop: 48 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
