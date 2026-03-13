export const tokens = {
  color: {
    canvas: 'var(--fnco-canvas)',
    surface: 'var(--fnco-surface)',
    surfaceMuted: 'var(--fnco-surface-muted)',
    sidebar: 'var(--fnco-sidebar)',
    border: 'var(--fnco-border)',
    borderStrong: 'var(--fnco-border-strong)',
    text: 'var(--fnco-text)',
    textSubtle: 'var(--fnco-text-subtle)',
    primary: 'var(--fnco-primary)',
    primarySoft: 'var(--fnco-primary-soft)',
    success: 'var(--fnco-success)',
    successSoft: 'var(--fnco-success-soft)',
    warning: 'var(--fnco-warning)',
    warningSoft: 'var(--fnco-warning-soft)',
    danger: 'var(--fnco-danger)',
    dangerSoft: 'var(--fnco-danger-soft)',
    geo: 'var(--fnco-geo)',
    geoSoft: 'var(--fnco-geo-soft)',
  },
  radius: {
    sm: 'var(--fnco-radius-sm)',
    md: 'var(--fnco-radius-md)',
    lg: 'var(--fnco-radius-lg)',
  },
  shadow: {
    card: 'var(--fnco-shadow-card)',
    panel: 'var(--fnco-shadow-panel)',
  },
};

export const creatorStages = [
  { value: 'discovered', label: 'Discovered', color: '#60a5fa', soft: '#dbeafe' },
  { value: 'seeded', label: 'Seeded', color: '#f59e0b', soft: '#fef3c7' },
  { value: 'posted', label: 'Posted', color: '#8b5cf6', soft: '#ede9fe' },
  { value: 'performing', label: 'Performing', color: '#10b981', soft: '#d1fae5' },
  { value: 'partnered', label: 'Partnered', color: '#2563eb', soft: '#dbeafe' },
];

export const platformMeta = {
  youtube: { label: 'YouTube', color: '#ef4444', soft: '#fee2e2' },
  instagram: { label: 'Instagram', color: '#ec4899', soft: '#fce7f3' },
  tiktok: { label: 'TikTok', color: '#0f172a', soft: '#e2e8f0' },
  default: { label: 'Unknown', color: '#64748b', soft: '#e2e8f0' },
};

export function getPlatformMeta(platform) {
  if (!platform) return platformMeta.default;
  const normalized = platform.toLowerCase();
  if (normalized.includes('youtube') || normalized === 'yt') return platformMeta.youtube;
  if (normalized.includes('instagram') || normalized === 'ig') return platformMeta.instagram;
  if (normalized.includes('tiktok') || normalized === 'tt') return platformMeta.tiktok;
  return platformMeta.default;
}

export function formatCompactNumber(value) {
  const num = Number(value) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}
