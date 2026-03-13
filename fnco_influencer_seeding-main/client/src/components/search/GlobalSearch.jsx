import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaign.js';
import { tokens } from '@/styles/designTokens.js';

const BASE_LINKS = [
  { label: '캠페인 빌더', path: '/campaigns', hint: '캠페인 관리' },
  { label: '콘텐츠 엔진', path: '/content-engine', hint: '라이브러리/엔진' },
  { label: '크리에이터 허브', path: '/creator-hub', hint: '대시보드/네트워크' },
  { label: '인플루언서 풀', path: '/influencer-pool', hint: '탐색/분석' },
  { label: 'Analytics', path: '/analytics', hint: '성과 분석' },
  { label: '설정', path: '/settings', hint: '시스템 설정' },
];

export default function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data: campaigns = [] } = useCampaigns();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const links = useMemo(() => {
    const campaignLinks = campaigns.slice(0, 8).map((campaign) => ({
      label: campaign.campaign_name || '캠페인',
      path: `/campaigns/${campaign.campaign_id || campaign._id}`,
      hint: campaign.brand_cd || 'Campaign',
    }));
    return [...BASE_LINKS, ...campaignLinks];
  }, [campaigns]);

  const filteredLinks = useMemo(() => {
    if (!query.trim()) return links.slice(0, 8);
    const q = query.trim().toLowerCase();
    return links
      .filter((item) => item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q))
      .slice(0, 8);
  }, [links, query]);

  const goTo = useCallback((path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  }, [navigate]);

  return (
    <div className="relative" style={{ width: 520, maxWidth: '100%' }}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: tokens.color.textSubtle }}
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && filteredLinks[0]) {
            event.preventDefault();
            goTo(filteredLinks[0].path);
          }
        }}
        placeholder="캠페인/메뉴 검색..."
        className="h-[42px] w-full rounded-xl border pl-10 pr-12 text-sm outline-none"
        style={{
          borderColor: tokens.color.border,
          background: tokens.color.surface,
          color: tokens.color.text,
        }}
      />
      <kbd
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border px-1.5 text-[11px] font-medium"
        style={{ borderColor: tokens.color.border, color: tokens.color.textSubtle, background: tokens.color.surfaceMuted }}
      >
        ⌘K
      </kbd>

      {open && filteredLinks.length > 0 && (
        <div
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border"
          style={{ borderColor: tokens.color.border, background: tokens.color.surface, boxShadow: tokens.shadow.panel }}
        >
          {filteredLinks.map((item) => (
            <button
              key={`${item.path}-${item.label}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => goTo(item.path)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors"
              style={{ color: tokens.color.text }}
            >
              <span>{item.label}</span>
              <span className="text-xs" style={{ color: tokens.color.textSubtle }}>{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
