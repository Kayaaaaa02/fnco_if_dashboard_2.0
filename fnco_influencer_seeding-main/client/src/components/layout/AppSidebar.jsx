import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Megaphone, Layers, Palette, Users, BarChart3, Settings,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import fncoLogoPink from '@/assets/images/logo/fnco_logo_pink.png';

const NAV_ITEMS = [
  { to: '/campaigns', key: 'campaigns', label: '캠페인 빌더', icon: Megaphone },
  { to: '/content-engine', key: 'content-engine', label: '콘텐츠 엔진', icon: Layers },
  { to: '/creator-hub', key: 'creator-hub', label: '크리에이터 허브', icon: Palette },
  { to: '/influencer-pool', key: 'influencer-pool', label: '인플루언서 풀', icon: Users },
  { to: '/analytics', key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', key: 'settings', label: '설정', icon: Settings },
];

const CAMPAIGN_STATUS_ITEMS = [
  { status: 'draft', label: 'NEW' },
  { status: 'active', label: '진행중' },
  { status: 'completed', label: '완료' },
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isCampaignMenuOpen, setIsCampaignMenuOpen] = useState(false);

  const isCampaignRoute = location.pathname.startsWith('/campaigns');
  const isCampaignListRoute = location.pathname === '/campaigns';
  const campaignQuery = new URLSearchParams(location.search);
  const currentCampaignStatus = campaignQuery.get('status') || 'all';
  const showCampaignStatusMenu = !collapsed && (isCampaignMenuOpen || (isCampaignListRoute && currentCampaignStatus !== 'all'));

  const sidebarWidth = collapsed ? '64px' : '250px';

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        borderRight: '1px solid #E8E8E8',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'visible',
      }}
    >
      {/* 플로팅 토글 버튼 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-14px',
          transform: 'translateY(-50%)',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '1px solid #E0E0E0',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          zIndex: 10,
          transition: 'all 0.2s ease',
          color: '#888888',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#111111';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.borderColor = '#111111';
          e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.color = '#888888';
          e.currentTarget.style.borderColor = '#E0E0E0';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
        }}
      >
        {collapsed
          ? <ChevronsRight style={{ width: '14px', height: '14px' }} />
          : <ChevronsLeft style={{ width: '14px', height: '14px' }} />
        }
      </button>

      {/* 로고 */}
      <div style={{
        padding: collapsed ? '0 0 8px 0' : '0 20px 8px 20px',
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: 'padding 0.2s ease',
        overflow: 'hidden',
      }}>
        <img
          src={fncoLogoPink}
          alt="F&CO"
          style={{
            height: '32px',
            objectFit: 'contain',
            maxWidth: collapsed ? '28px' : '120px',
            overflow: 'hidden',
            transition: 'max-width 0.2s ease',
          }}
        />
      </div>

      {/* 메뉴 */}
      <nav style={{
        flex: 1,
        padding: collapsed ? '16px 8px 0 8px' : '16px 10px 0 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        transition: 'padding 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* 캠페인 빌더 (서브메뉴 포함) */}
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isCampaignItem = idx === 0;

          if (isCampaignItem) {
            const isActive = isCampaignRoute;
            return (
              <div key={item.key}>
                <button
                  onClick={() => {
                    setIsCampaignMenuOpen((prev) => !prev);
                    navigate('/campaigns');
                  }}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? '0' : '10px',
                    padding: collapsed ? '10px 0' : '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? '#F5F5F5' : 'transparent',
                    color: isActive ? '#111111' : '#888888',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#F9F9F9';
                      e.currentTarget.style.color = '#444444';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#888888';
                    }
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px', flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && isActive && (
                    <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: '#111111' }} />
                  )}
                </button>

                {/* 캠페인 상태 서브메뉴 */}
                {showCampaignStatusMenu && (
                  <div style={{ marginTop: '4px', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {CAMPAIGN_STATUS_ITEMS.map((sub) => {
                      const isSubActive = isCampaignListRoute && currentCampaignStatus === sub.status;
                      return (
                        <NavLink
                          key={sub.status}
                          to={`/campaigns?status=${sub.status}`}
                          style={{
                            display: 'block',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: isSubActive ? 600 : 400,
                            color: isSubActive ? '#111111' : '#888888',
                            background: isSubActive ? '#F5F5F5' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {sub.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          /* 일반 메뉴 아이템 */
          return (
            <NavLink
              key={item.key}
              to={item.to}
              onClick={() => setIsCampaignMenuOpen(false)}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? '0' : '10px',
                padding: collapsed ? '10px 0' : '9px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? '#F5F5F5' : 'transparent',
                color: isActive ? '#111111' : '#888888',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                textAlign: 'left',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              })}
            >
              <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
