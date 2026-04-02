export const STAGE_MAP = {
    candidate_pool: { label: 'Candidate Pool', color: '#6366f1', icon: '🔍', desc: 'Influencer Find Agent에 등록된 인플루언서 전체' },
    partnered: { label: 'Partnered', color: '#10b981', icon: '🤝', desc: '허브 대상 확정 인원의 합' },
    hidden_gem: { label: 'Hidden Gem', color: '#f59e0b', icon: '💎', desc: '팔로워 1만~10만 이내 + 인게이지먼트 효율 우수 인원' },
};

export const STAGE_LIST = Object.entries(STAGE_MAP).map(([key, val]) => ({
    key,
    ...val,
}));

export const PLATFORM_MAP = {
    tiktok: { label: 'TikTok', color: '#000000', bg: '#F0F0F0' },
    instagram: { label: 'Instagram', color: '#E4405F', bg: '#FFF0F3' },
    youtube: { label: 'YouTube', color: '#FF0000', bg: '#FFF0F0' },
};

// === 필터 옵션 ===

export const CREATOR_TYPE_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: 'fnco', label: 'FNCO 크리에이터' },
    { value: 'excluded', label: '제외 인원' },
];

export const PLATFORM_OPTIONS = [
    { value: 'all', label: '전체', color: '#666666' },
    { value: 'youtube', label: 'YouTube', color: PLATFORM_MAP.youtube.color },
    { value: 'instagram', label: 'Instagram', color: PLATFORM_MAP.instagram.color },
    { value: 'tiktok', label: 'TikTok', color: PLATFORM_MAP.tiktok.color },
];

export const CHANNEL_SIZE_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: 'mega', label: '메가 (100만+)' },
    { value: 'macro', label: '매크로 (10만~100만)' },
    { value: 'micro', label: '마이크로 (1만~10만)' },
    { value: 'nano', label: '나노 (~1만)' },
];

export const HIDDEN_GEM_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'gem_only', label: 'Hidden Gem Only' },
];

export const COUNTRY_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: 'KR', label: '🇰🇷 한국어' },
    { value: 'Lang:KO', label: '🇰🇷 한국어' },
    { value: 'Lang:JA', label: '🇯🇵 일본어' },
    { value: 'Lang:ZH', label: '🇨🇳 중국어' },
    { value: 'Lang:TH', label: '🇹🇭 태국어' },
    { value: 'Lang:EN', label: '🇺🇸 영어' },
];

export const HUB_STATUS_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: 'confirmed', label: '확정' },
    { value: 'unconfirmed', label: '미확정' },
];

export const ANALYSIS_STATUS_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: 'none', label: '미분석' },
    { value: 'completed', label: '완료' },
];

// 팔로워 수 기반 채널 규모 계산
export function getChannelSize(followers) {
    if (followers >= 1_000_000) return 'mega';
    if (followers >= 100_000) return 'macro';
    if (followers >= 10_000) return 'micro';
    return 'nano';
}

export function formatNumber(num) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
}

export function getEngagementColor(rate) {
    if (rate >= 7.0) return '#16a34a';
    if (rate >= 5.0) return '#d97706';
    return '#888888';
}

/** 페이지네이션 범위 계산 */
export function getPageRange(currentPage, totalPages, maxVisible = 5) {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
}
