import { useState, useMemo, useCallback } from 'react';
import { useInfluencerPool, useInfluencerAnalysis, useToggleInfluencerSelection } from '@/hooks/useInfluencerPool';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import {
  Users,
  Search,
  LayoutGrid,
  List,
  Star,
  ExternalLink,
  BarChart3,
  Loader2,
  UserCheck,
  Funnel,
  CheckCircle2,
  Check,
  X,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Target,
  Sparkles,
  AlertTriangle,
  Languages,
  Gem,
} from 'lucide-react';
import { toast } from 'sonner';
import { tokens } from '@/styles/designTokens.js';

const PLATFORM_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '메가', label: '메가' },
  { value: '매크로', label: '매크로' },
  { value: '마이크로', label: '마이크로' },
  { value: '나노', label: '나노' },
];

const LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어' },
  { value: 'eng', label: 'English' },
  { value: 'cn', label: '中文' },
];

const HIDDEN_GEM_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'gem', label: 'Hidden GEM만' },
];

const ANALYSIS_STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'done', label: '분석 완료' },
  { value: 'none', label: '미분석' },
];

const CREATOR_FILTER_OPTIONS = [
  { value: 'all', label: '전체 보기' },
  { value: 'fnco', label: 'FNCO 크리에이터' },
  { value: 'excluded', label: '제외 인원' },
];

const CATEGORY_BADGE = {
  '메가': { bg: '#f3e8ff', color: '#7c3aed' },
  '매크로': { bg: '#dbeafe', color: '#2563eb' },
  '마이크로': { bg: '#dcfce7', color: '#16a34a' },
  '나노': { bg: '#ffedd5', color: '#ea580c' },
};

const PLATFORM_BADGE = {
  youtube: { bg: '#fee2e2', color: '#dc2626' },
  instagram: { bg: '#fce7f3', color: '#db2777' },
  tiktok: { bg: '#e2e8f0', color: '#0f172a' },
};

/* ── helpers ── */

function formatFollowerCount(count) {
  if (count == null) return '0';
  const n = Number(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ko-KR');
}

const PROFILE_COLORS = ['#3b82f6','#22c55e','#8b5cf6','#ec4899','#f59e0b','#06b6d4','#f43f5e','#6366f1','#14b8a6','#f97316'];
function getProfileColor(name) {
  if (!name) return '#9ca3af';
  return PROFILE_COLORS[name.charCodeAt(0) % PROFILE_COLORS.length];
}

/* ── reusable components ── */

function FilterSelect({ label, value, onValueChange, options, width = 130 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {label && <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle }}>{label}</span>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          style={{
            width,
            height: 36,
            borderRadius: 8,
            borderColor: tokens.color.border,
            background: tokens.color.surface,
            fontSize: 13,
          }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function KpiCard({ title, value, color }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: '14px 16px',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: tokens.color.textSubtle }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color || tokens.color.text, marginTop: 6 }}>{value}</p>
    </div>
  );
}

function InlineBadge({ bg, color, children }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '1px 8px',
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color,
        lineHeight: '18px',
      }}
    >
      {children}
    </span>
  );
}

function PlatformBadge({ platform }) {
  const s = PLATFORM_BADGE[platform] || { bg: '#f1f5f9', color: '#64748b' };
  const label = platform === 'youtube' ? 'YouTube' : platform === 'instagram' ? 'Instagram' : platform === 'tiktok' ? 'TikTok' : platform || '-';
  return <InlineBadge bg={s.bg} color={s.color}>{label}</InlineBadge>;
}

function CategoryBadge({ category }) {
  const s = CATEGORY_BADGE[category] || { bg: '#f1f5f9', color: '#64748b' };
  return <InlineBadge bg={s.bg} color={s.color}>{category || '미분류'}</InlineBadge>;
}

/* ── skeleton ── */

function LoadingSkeleton() {
  return (
    <div className="space-y-6" style={{ padding: 28 }}>
      <Skeleton className="h-6 w-48" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ── 심층 분석 결과 팝업 ── */

function DeepAnalysisDialog({ open, onOpenChange, influencer, analysisData }) {
  if (!influencer || !analysisData) return null;

  const overview = analysisData.overview || {};
  const contentAnalysis = analysisData.contentAnalysis || {};
  const channelFeature = overview['채널 특징'] || {};
  const skinInfo = overview['피부특성'] || {};
  const audience = overview['타겟_오디언스'] || {};
  const strengths = overview['콘텐츠 강점'] || {};
  const contentDist = overview['최근_30일_콘텐츠_유형_분포'] || overview['콘텐츠_유형_분포'] || {};
  const topics = overview['주요_토픽_및_키워드'] || [];
  const seedingPoints = overview['시딩_캠페인_적용_포인트'] || [];
  const optimizationMd = contentAnalysis['콘텐츠_최적화_개선안_마크다운'] || '';

  const SectionTitle = ({ icon: Icon, color, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 20 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ width: 14, height: 14, color: '#fff' }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>{children}</span>
    </div>
  );

  const InfoTag = ({ children, color = '#f1f5f9', textColor = tokens.color.text }) => (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, background: color, fontSize: 12, fontWeight: 600, color: textColor, marginRight: 4, marginBottom: 4 }}>
      {children}
    </span>
  );

  const StatBox = ({ label, value, icon: Icon }) => (
    <div style={{ padding: '10px 14px', borderRadius: 10, background: tokens.color.surfaceMuted, textAlign: 'center' }}>
      {Icon && <Icon style={{ width: 14, height: 14, color: tokens.color.textSubtle, margin: '0 auto 4px' }} />}
      <p style={{ fontSize: 10, color: tokens.color.textSubtle, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{value}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: 720, padding: 0, maxHeight: '90vh' }} className="overflow-y-auto">
        {/* 헤더 */}
        <div style={{ padding: '20px 24px 16px', background: 'linear-gradient(135deg, #f0f9ff, #f5f3ff)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <DialogHeader style={{ padding: 0 }}>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 800, color: tokens.color.text }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: getProfileColor(influencer.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {getInitial(influencer.name)}
              </div>
              {influencer.name} 심층 분석
              <PlatformBadge platform={influencer.platform} />
            </DialogTitle>
          </DialogHeader>
        </div>

        <div style={{ padding: '4px 24px 28px' }}>

          {/* ── Step 1: 개요 ── */}
          <SectionTitle icon={Users} color="#6366f1">요약 카드</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {overview['성별'] && <InfoTag color="#ede9fe" textColor="#7c3aed">{overview['성별']}</InfoTag>}
            {overview['연령대'] && <InfoTag color="#ede9fe" textColor="#7c3aed">{overview['연령대']}</InfoTag>}
            {(overview['라이프스타일'] || []).map((ls, i) => (
              <InfoTag key={i} color="#ecfdf5" textColor="#059669">{ls}</InfoTag>
            ))}
          </div>
          {overview['콘텐츠'] && (
            <p style={{ fontSize: 13, color: tokens.color.textSubtle, lineHeight: 1.6, marginBottom: 12 }}>{overview['콘텐츠']}</p>
          )}

          {/* 채널 특징 */}
          {(channelFeature['톤앤무드'] || channelFeature['특징'] || channelFeature['연출 스타일']) && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text, marginBottom: 8 }}>채널 특징</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {channelFeature['톤앤무드'] && <InfoTag color="#dbeafe" textColor="#2563eb">톤: {channelFeature['톤앤무드']}</InfoTag>}
                {channelFeature['특징'] && <InfoTag color="#fef3c7" textColor="#d97706">{channelFeature['특징']}</InfoTag>}
                {channelFeature['연출 스타일'] && <InfoTag color="#f3e8ff" textColor="#9333ea">{channelFeature['연출 스타일']}</InfoTag>}
              </div>
            </div>
          )}

          {/* 피부 특성 */}
          {(skinInfo['피부타입'] || skinInfo['피부특징']) && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fdf2f8', border: '1px solid #fce7f3', marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text, marginBottom: 8 }}>피부 특성</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {skinInfo['피부타입'] && <InfoTag color="#fce7f3" textColor="#be185d">타입: {skinInfo['피부타입']}</InfoTag>}
                {skinInfo['피부특징'] && <InfoTag color="#fce7f3" textColor="#be185d">특징: {skinInfo['피부특징']}</InfoTag>}
              </div>
            </div>
          )}

          {/* 핵심 페르소나 */}
          <SectionTitle icon={Target} color="#8b5cf6">핵심 페르소나</SectionTitle>
          {audience['설명'] && (
            <div style={{ marginBottom: 8 }}>
              {(Array.isArray(audience['설명']) ? audience['설명'] : [audience['설명']]).map((desc, i) => (
                <InfoTag key={i} color="#ede9fe" textColor="#7c3aed">{desc}</InfoTag>
              ))}
            </div>
          )}
          {audience['태그'] && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(Array.isArray(audience['태그']) ? audience['태그'] : []).map((tag, i) => (
                <InfoTag key={i}>{tag}</InfoTag>
              ))}
            </div>
          )}

          {/* 콘텐츠 강점 */}
          <SectionTitle icon={TrendingUp} color="#10b981">콘텐츠 강점</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {strengths['팔로워_특징'] && <StatBox label="팔로워 특징" value={strengths['팔로워_특징']} icon={Users} />}
            {strengths['주간_컨텐츠_업로드_평균_회수_최근30일'] && <StatBox label="발행 주기" value={strengths['주간_컨텐츠_업로드_평균_회수_최근30일']} icon={BarChart3} />}
            {strengths['인게이지먼트_최근30일'] && <StatBox label="인게이지먼트" value={strengths['인게이지먼트_최근30일']} icon={Heart} />}
          </div>

          {/* 콘텐츠 유형 분포 */}
          {contentDist['유형별_비중'] && (
            <>
              <SectionTitle icon={BarChart3} color="#f59e0b">콘텐츠 유형 분포</SectionTitle>
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                {(contentDist['유형별_비중'] || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < (contentDist['유형별_비중'].length - 1) ? 8 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text, width: 100 }}>{item['유형']}</span>
                    <div style={{ flex: 1, height: 20, borderRadius: 6, background: '#fef3c7', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: 6,
                        background: i === 0 ? '#f59e0b' : i === 1 ? '#fbbf24' : '#fcd34d',
                        width: item['비중'] || '0%',
                        transition: 'width 0.5s',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', width: 40, textAlign: 'right' }}>{item['비중']}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 주요 토픽 & 키워드 */}
          {topics.length > 0 && (
            <>
              <SectionTitle icon={Sparkles} color="#6366f1">주요 토픽 & 키워드</SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {topics.map((t, i) => (
                  <InfoTag key={i} color="#eef2ff" textColor="#4f46e5">{t}</InfoTag>
                ))}
              </div>
            </>
          )}

          {/* 시딩 캠페인 적용 포인트 */}
          {seedingPoints.length > 0 && (
            <>
              <SectionTitle icon={Target} color="#0ea5e9">시딩 캠페인 적용 포인트</SectionTitle>
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                {seedingPoints.map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < seedingPoints.length - 1 ? 8 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, color: '#0c4a6e', lineHeight: 1.5 }}>{point}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Step 2: 콘텐츠 분석 ── */}
          {optimizationMd && (
            <>
              <SectionTitle icon={AlertTriangle} color="#ef4444">콘텐츠 최적화 개선안</SectionTitle>
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: 10,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: tokens.color.text,
                  whiteSpace: 'pre-wrap',
                }}
                dangerouslySetInnerHTML={{
                  __html: optimizationMd
                    .replace(/### 🔴/g, '<h3 style="font-size:14px;font-weight:700;color:#ef4444;margin:16px 0 8px">🔴')
                    .replace(/### 🟡/g, '<h3 style="font-size:14px;font-weight:700;color:#f59e0b;margin:16px 0 8px">🟡')
                    .replace(/### 🟢/g, '<h3 style="font-size:14px;font-weight:700;color:#10b981;margin:16px 0 8px">🟢')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>'),
                }}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Card view ── */

/** 키워드 → 페르소나 매핑 테이블 */
const PERSONA_KEYWORD_MAP = [
  { code: 'P1', label: '피부 입문자', keywords: ['입문', '초보', '피부 입문', '뷰티 관심', '뷰티 팁', '메이크업 팁', '데일리 뷰티', '메이크업덕후', '트렌드 민감', '메이크업 정보', 'ootd', '오오티디', '쿨톤', '웜톤'] },
  { code: 'P2', label: '효율 추구형', keywords: ['효율', '실용', '가성비', '합리적', '올리브영', '다이소', '올영'] },
  { code: 'P3', label: '스킨케어 마니아', keywords: ['마니아', '코덕', '스킨케어', '성분', '전문', '리뷰', '상세리뷰', '전문성'] },
  { code: 'P4', label: '얼리 안티에이징', keywords: ['안티에이징', '탄력', '주름', '에이징'] },
  { code: 'P5', label: '클린 뷰티 비건', keywords: ['클린', '비건', '자연', '유기농'] },
  { code: 'P6', label: '그루밍족', keywords: ['그루밍', '남성', '남자', '남녀'] },
  { code: 'P7', label: '트러블 슈터', keywords: ['트러블', '여드름', '피지', '모공'] },
  { code: 'P8', label: '스마트 골든 에이지', keywords: ['골든', '4050', '40대', '50대', '중년'] },
  { code: 'P9', label: '민감성/더마', keywords: ['민감', '더마', '진정', '수딩', '자극'] },
  { code: 'P10', label: '바쁜 워킹/육아맘', keywords: ['육아', '워킹맘', '주부', '산후', '바쁜'] },
  { code: 'P11', label: '럭셔리 스테이머', keywords: ['럭셔리', '프리미엄', '하이엔드', '고급', '감성 소비'] },
  { code: 'P12', label: '이벤트 타겟', keywords: ['이벤트', '챌린지', '프로모션'] },
];

/** deep analysis에서 페르소나 코드(P1, P2 등) 추출 */
function extractPersonaCodes(analysis) {
  if (!analysis) return [];
  const overview = analysis.overview || analysis;
  const ta = overview?.['타겟_오디언스'];
  if (!ta) return [];

  // 1) 설명 필드에서 직접 P코드 추출
  const desc = ta['설명'] || ta['tags'] || [];
  const arr = Array.isArray(desc) ? desc : [desc];
  const codes = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const matches = item.match(/P\d+/g);
    if (matches) codes.push(...matches);
  }
  if (codes.length > 0) return [...new Set(codes)];

  // 2) P코드 없으면 설명+태그 텍스트에서 키워드 매칭
  const allText = [
    ...(Array.isArray(desc) ? desc : [desc]),
    ...(Array.isArray(ta['태그']) ? ta['태그'] : []),
  ].filter(Boolean).join(' ').toLowerCase();

  if (!allText) return [];

  const matched = [];
  for (const p of PERSONA_KEYWORD_MAP) {
    if (p.keywords.some((kw) => allText.includes(kw))) {
      matched.push(p.code);
    }
  }
  return matched.slice(0, 2); // 최대 2개
}

const PERSONA_COLORS = {
  P1: { bg: '#ede9fe', color: '#7c3aed' },
  P2: { bg: '#dbeafe', color: '#2563eb' },
  P3: { bg: '#fce7f3', color: '#db2777' },
  P4: { bg: '#d1fae5', color: '#059669' },
  P5: { bg: '#fef3c7', color: '#d97706' },
  P6: { bg: '#ffedd5', color: '#ea580c' },
  P7: { bg: '#e0e7ff', color: '#4f46e5' },
  P8: { bg: '#cffafe', color: '#0891b2' },
  P9: { bg: '#fce4ec', color: '#e11d48' },
  P10: { bg: '#f3e8ff', color: '#9333ea' },
  P11: { bg: '#fef9c3', color: '#a16207' },
  P12: { bg: '#dcfce7', color: '#15803d' },
};

function InfluencerCard({ influencer, onToggleSelection, onDeepAnalysis, isAnalyzing, isAnalyzed, onViewAnalysis, isChecked, onToggleCheck, analysisData }) {
  const { id, name, platform, category, followers, avgViews, engagementRate, contentTypes, quickSummary, isSaved, profileUrl, profileImage, collectedAt } = influencer;
  const personaCodes = extractPersonaCodes(analysisData);

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${isChecked ? tokens.color.primary : isSaved ? '#bbf7d0' : tokens.color.border}`,
        background: isSaved ? '#f0fdf4' : tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: 16,
        transition: 'box-shadow .15s, border-color .15s, background .15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadow.panel; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = tokens.shadow.card; }}
    >
      {/* profile + checkbox + star */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* 체크박스 */}
          <button
            type="button"
            onClick={() => onToggleCheck(id)}
            style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              border: `2px solid ${isChecked ? tokens.color.primary : '#cbd5e1'}`,
              background: isChecked ? tokens.color.primary : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
          >
            {isChecked && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
          </button>
          {profileImage ? (
            <img src={profileImage} alt={name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: getProfileColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {getInitial(name)}
            </div>
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{name || '이름 없음'}</p>
            <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
              <PlatformBadge platform={platform} />
              <CategoryBadge category={category} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleSelection(id, isSaved)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <Star style={{ width: 16, height: 16, fill: isSaved ? '#f59e0b' : 'none', color: isSaved ? '#f59e0b' : '#9ca3af' }} />
        </button>
      </div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
        <div style={{ borderRadius: 8, padding: '6px 10px', background: tokens.color.surfaceMuted }}>
          <p style={{ fontSize: 10, color: tokens.color.textSubtle }}>팔로워</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{formatFollowerCount(followers)}</p>
        </div>
        <div style={{ borderRadius: 8, padding: '6px 10px', background: tokens.color.surfaceMuted }}>
          <p style={{ fontSize: 10, color: tokens.color.textSubtle }}>평균 조회수</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{formatFollowerCount(avgViews)}</p>
        </div>
        <div style={{ borderRadius: 8, padding: '6px 10px', background: tokens.color.surfaceMuted }}>
          <p style={{ fontSize: 10, color: tokens.color.textSubtle }}>참여율</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: (engagementRate || 0) >= 3 ? '#10b981' : tokens.color.text }}>{Number(engagementRate || 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* 페르소나 배지 */}
      {personaCodes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {personaCodes.map((code) => {
            const c = PERSONA_COLORS[code] || { bg: '#f1f5f9', color: '#475569' };
            const pDef = PERSONA_KEYWORD_MAP.find((p) => p.code === code);
            return (
              <span
                key={code}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '3px 8px', borderRadius: 6,
                  background: c.bg, fontSize: 11, fontWeight: 700, color: c.color,
                  letterSpacing: 0.3,
                }}
              >
                {code}{pDef ? ` ${pDef.label}` : ''}
              </span>
            );
          })}
        </div>
      )}

      {/* AI 요약 */}
      {quickSummary && (
        <p style={{ fontSize: 11, color: tokens.color.textSubtle, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {quickSummary}
        </p>
      )}

      {/* 수집일자 */}
      <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>수집일: {formatDate(collectedAt)}</p>

      {/* actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isAnalyzed ? (
          <button
            type="button"
            onClick={() => onViewAnalysis(influencer)}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 8,
              border: '1px solid #bbf7d0',
              background: '#f0fdf4',
              fontSize: 12,
              fontWeight: 600,
              color: '#059669',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <CheckCircle2 style={{ width: 13, height: 13 }} />
            분석 결과 보기
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDeepAnalysis(influencer)}
            disabled={isAnalyzing}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${isAnalyzing ? '#bae6fd' : tokens.color.border}`,
              background: isAnalyzing ? '#f0f9ff' : tokens.color.surface,
              fontSize: 12,
              fontWeight: 600,
              color: isAnalyzing ? '#0284c7' : tokens.color.text,
              cursor: isAnalyzing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {isAnalyzing ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <BarChart3 style={{ width: 13, height: 13 }} />}
            {isAnalyzing ? '분석 중...' : '심층 분석'}
          </button>
        )}
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.color.textSubtle,
            }}
          >
            <ExternalLink style={{ width: 13, height: 13 }} />
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Table view ── */

function InfluencerTableView({ influencers, onToggleSelection, onDeepAnalysis, analyzingIds, analyzedResults, onViewAnalysis, checkedIds, onToggleCheck, onToggleCheckAll }) {
  const thStyle = { fontSize: 12, fontWeight: 600, color: tokens.color.textSubtle };
  const allChecked = influencers.length > 0 && influencers.every((inf) => checkedIds.has(inf.id));
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${tokens.color.border}`, overflow: 'hidden', background: tokens.color.surface }}>
      <Table>
        <TableHeader>
          <TableRow style={{ background: tokens.color.surfaceMuted }}>
            <TableHead style={{ ...thStyle, width: 40, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => onToggleCheckAll(influencers.map((i) => i.id))}
                style={{
                  width: 18, height: 18, borderRadius: 3,
                  border: `2px solid ${allChecked ? tokens.color.primary : '#cbd5e1'}`,
                  background: allChecked ? tokens.color.primary : 'transparent',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {allChecked && <Check style={{ width: 11, height: 11, color: '#fff' }} />}
              </button>
            </TableHead>
            <TableHead style={thStyle}>이름</TableHead>
            <TableHead style={thStyle}>플랫폼</TableHead>
            <TableHead style={thStyle}>채널 규모</TableHead>
            <TableHead style={{ ...thStyle, textAlign: 'right' }}>팔로워</TableHead>
            <TableHead style={{ ...thStyle, textAlign: 'right' }}>평균 조회수</TableHead>
            <TableHead style={{ ...thStyle, textAlign: 'right' }}>참여율</TableHead>
            <TableHead style={thStyle}>페르소나</TableHead>
            <TableHead style={{ ...thStyle, maxWidth: 200 }}>AI 요약</TableHead>
            <TableHead style={thStyle}>수집일</TableHead>
            <TableHead style={{ ...thStyle, textAlign: 'center' }}>액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {influencers.map((inf) => (
            <TableRow key={inf.id} style={{ borderColor: tokens.color.border, background: inf.isSaved ? '#f0fdf4' : undefined }}>
              <TableCell style={{ width: 40, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => onToggleCheck(inf.id)}
                  style={{
                    width: 18, height: 18, borderRadius: 3,
                    border: `2px solid ${checkedIds.has(inf.id) ? tokens.color.primary : '#cbd5e1'}`,
                    background: checkedIds.has(inf.id) ? tokens.color.primary : 'transparent',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {checkedIds.has(inf.id) && <Check style={{ width: 11, height: 11, color: '#fff' }} />}
                </button>
              </TableCell>
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {inf.profileImage ? (
                    <img src={inf.profileImage} alt={inf.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: getProfileColor(inf.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                      {getInitial(inf.name)}
                    </div>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{inf.name || '이름 없음'}</span>
                </div>
              </TableCell>
              <TableCell><PlatformBadge platform={inf.platform} /></TableCell>
              <TableCell><CategoryBadge category={inf.category} /></TableCell>
              <TableCell style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{formatFollowerCount(inf.followers)}</TableCell>
              <TableCell style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{formatFollowerCount(inf.avgViews)}</TableCell>
              <TableCell style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: (inf.engagementRate || 0) >= 3 ? '#10b981' : tokens.color.text }}>
                {Number(inf.engagementRate || 0).toFixed(1)}%
              </TableCell>
              <TableCell>
                {(() => {
                  const codes = extractPersonaCodes(analyzedResults.get(inf.id)?.analysis || inf.deepAnalysis);
                  return codes.length > 0 ? (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {codes.map((code) => {
                        const c = PERSONA_COLORS[code] || { bg: '#f1f5f9', color: '#475569' };
                        const pDef = PERSONA_KEYWORD_MAP.find((p) => p.code === code);
                        return <span key={code} style={{ padding: '2px 6px', borderRadius: 4, background: c.bg, fontSize: 10, fontWeight: 700, color: c.color }}>{code}{pDef ? ` ${pDef.label}` : ''}</span>;
                      })}
                    </div>
                  ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>-</span>;
                })()}
              </TableCell>
              <TableCell style={{ maxWidth: 200 }}>
                <p style={{ fontSize: 11, color: tokens.color.textSubtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inf.quickSummary || '-'}</p>
              </TableCell>
              <TableCell style={{ fontSize: 11, color: tokens.color.textSubtle, whiteSpace: 'nowrap' }}>{formatDate(inf.collectedAt)}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <button type="button" onClick={() => onToggleSelection(inf.id, inf.isSaved)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Star style={{ width: 14, height: 14, fill: inf.isSaved ? '#f59e0b' : 'none', color: inf.isSaved ? '#f59e0b' : '#9ca3af' }} />
                  </button>
                  {(analyzedResults.has(inf.id) || inf.analysisType === 'DEEP_ANALYSIS') ? (
                    <button type="button" onClick={() => onViewAnalysis(inf)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#059669' }} title="분석 결과 보기">
                      <CheckCircle2 style={{ width: 14, height: 14 }} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => onDeepAnalysis(inf)} disabled={analyzingIds.has(inf.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: analyzingIds.has(inf.id) ? '#0284c7' : tokens.color.textSubtle }} title="심층 분석">
                      {analyzingIds.has(inf.id) ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <BarChart3 style={{ width: 14, height: 14 }} />}
                    </button>
                  )}
                  {inf.profileUrl && (
                    <a href={inf.profileUrl} target="_blank" rel="noopener noreferrer" style={{ padding: 4, color: tokens.color.textSubtle }}>
                      <ExternalLink style={{ width: 14, height: 14 }} />
                    </a>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ── Main ── */

export default function InfluencerPool() {
  const { influencers, count, partneredCount, isLoading, isError, error } = useInfluencerPool();
  const deepAnalysis = useInfluencerAnalysis();
  const toggleSelection = useToggleInfluencerSelection();

  const [viewMode, setViewMode] = useState('grid');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('ko');
  const [hiddenGemFilter, setHiddenGemFilter] = useState('all');
  const [analysisStatusFilter, setAnalysisStatusFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzingIds, setAnalyzingIds] = useState(new Set());
  // 심층 분석 결과 저장: Map<profileId, { influencer, analysis }>
  const [analyzedResults, setAnalyzedResults] = useState(new Map());
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null); // { influencer, analysis }
  // 허브 대상 체크 선택: Set<profileId>
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [isConfirmingHub, setIsConfirmingHub] = useState(false);

  // Normalize snake_case API fields → camelCase
  const normalized = useMemo(() => influencers.map((raw) => ({
    ...raw,
    id: raw.id ?? raw.profile_id,
    name: raw.name || raw.user_nm || raw.influencer_nm || raw.profile_id || '이름 없음',
    avgViews: raw.avgViews ?? raw.avg_views ?? 0,
    quickSummary: raw.quickSummary || raw.quick_summary || '',
    profileUrl: raw.profileUrl || raw.profile_url || '',
    profileImage: raw.profileImage || raw.profile_image || null,
    isSaved: raw.isSaved ?? raw.is_saved ?? false,
    engagementRate: Number(raw.engagementRate ?? raw.engagement_rate ?? 0),
    contentTypes: raw.contentTypes || raw.content_types || [],
    collectedAt: raw.updatedAt || raw.updated_at || raw.collected_at || raw.created_at || '',
    stage: raw.stage || '',
  })), [influencers]);

  const countries = useMemo(() => {
    const set = new Set();
    normalized.forEach((inf) => { if (inf.country) set.add(inf.country); });
    return Array.from(set).sort();
  }, [normalized]);

  const [countryFilter, setCountryFilter] = useState('all');

  const selectedCount = useMemo(() => normalized.filter((i) => i.isSaved).length, [normalized]);
  // partneredCount는 서버 API에서 가져옴 (바닐라코 캠페인 매칭 인플루언서)
  const hiddenGemCount = useMemo(() => normalized.filter((i) => {
    const cat = (i.category || '').trim();
    return (cat === '마이크로' || cat === '나노') && (i.engagementRate || 0) >= 3;
  }).length, [normalized]);

  const filtered = useMemo(() => {
    return normalized.filter((inf) => {
      if (platformFilter !== 'all' && inf.platform !== platformFilter) return false;
      if (categoryFilter !== 'all' && inf.category !== categoryFilter) return false;
      if (countryFilter !== 'all' && inf.country !== countryFilter) return false;
      if (hiddenGemFilter === 'gem') {
        const cat = (inf.category || '').trim();
        const isGem = (cat === '마이크로' || cat === '나노') && (inf.engagementRate || 0) >= 3;
        if (!isGem) return false;
      }
      if (analysisStatusFilter === 'done') {
        const isDeepDone = inf.analysisType === 'DEEP_ANALYSIS' || analyzedResults.has(inf.id);
        if (!isDeepDone) return false;
      } else if (analysisStatusFilter === 'none') {
        const isDeepDone = inf.analysisType === 'DEEP_ANALYSIS' || analyzedResults.has(inf.id);
        if (isDeepDone) return false;
      }
      if (creatorFilter === 'fnco' && !inf.isSaved) return false;
      if (creatorFilter === 'excluded' && inf.isSaved) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(inf.name || '').toLowerCase().includes(q) && !(inf.quickSummary || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [normalized, platformFilter, categoryFilter, countryFilter, hiddenGemFilter, analysisStatusFilter, creatorFilter, analyzedResults, searchQuery]);

  const handleToggleSelection = (profileId, currentlySelected) => {
    toggleSelection.mutate(
      { profileIds: [profileId], selected: !currentlySelected },
      {
        onSuccess: () => toast.success(currentlySelected ? '선택이 해제되었습니다' : '선택되었습니다'),
        onError: (err) => toast.error(`선택 변경 실패: ${err.message}`),
      },
    );
  };

  const handleDeepAnalysis = useCallback((influencer) => {
    const profileId = influencer.id;
    setAnalyzingIds((prev) => new Set(prev).add(profileId));
    deepAnalysis.mutate(
      { influencers: [{ profile_id: profileId, platform: influencer.platform }], language: languageFilter },
      {
        onSuccess: (data) => {
          toast.success(`${influencer.name || '인플루언서'} 심층 분석이 완료되었습니다`);
          setAnalyzingIds((prev) => { const s = new Set(prev); s.delete(profileId); return s; });

          // 결과 저장
          const analysisResult = data?.results?.[0]?.analysis || data?.analysis || data;
          setAnalyzedResults((prev) => {
            const next = new Map(prev);
            next.set(profileId, { influencer, analysis: analysisResult });
            return next;
          });
        },
        onError: (err) => {
          toast.error(`심층 분석 실패: ${err.message}`);
          setAnalyzingIds((prev) => { const s = new Set(prev); s.delete(profileId); return s; });
        },
      },
    );
  }, [deepAnalysis, languageFilter]);

  const handleViewAnalysis = useCallback((influencer) => {
    const profileId = influencer.id;
    const stored = analyzedResults.get(profileId);
    if (stored) {
      setSelectedAnalysis(stored);
      setAnalysisDialogOpen(true);
    }

    // DB에 저장된 기존 deep_analysis도 확인
    if (!stored && influencer.deepAnalysis) {
      setSelectedAnalysis({ influencer, analysis: influencer.deepAnalysis });
      setAnalysisDialogOpen(true);
    }
  }, [analyzedResults]);

  const handleToggleCheck = useCallback((profileId) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }, []);

  const handleToggleCheckAll = useCallback((ids) => {
    setCheckedIds((prev) => {
      const allChecked = ids.every((id) => prev.has(id));
      if (allChecked) return new Set(); // 모두 해제
      return new Set(ids); // 모두 선택
    });
  }, []);

  const handleConfirmHub = useCallback(() => {
    if (checkedIds.size === 0) {
      toast.error('허브에 추가할 인플루언서를 체크해주세요');
      return;
    }
    setIsConfirmingHub(true);
    toggleSelection.mutate(
      { profileIds: Array.from(checkedIds), selected: true },
      {
        onSuccess: () => {
          toast.success(`${checkedIds.size}명이 크리에이터 허브 Discovered에 추가되었습니다`);
          setCheckedIds(new Set());
          setIsConfirmingHub(false);
        },
        onError: (err) => {
          toast.error(`허브 대상 확정 실패: ${err.message}`);
          setIsConfirmingHub(false);
        },
      },
    );
  }, [checkedIds, toggleSelection]);

  const resetFilters = () => {
    setPlatformFilter('all');
    setCategoryFilter('all');
    setCountryFilter('all');
    setHiddenGemFilter('all');
    setAnalysisStatusFilter('all');
    setCreatorFilter('all');
    setSearchQuery('');
  };

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Users style={{ width: 40, height: 40, color: '#cbd5e1', marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: tokens.color.text }}>데이터를 불러올 수 없습니다</p>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>{error?.message || '서버 연결을 확인해주세요.'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>인플루언서 풀</h1>
          <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 3 }}>발굴/검증/선택 후보를 관리하고 크리에이터 허브로 연결합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: tokens.color.surfaceMuted, borderRadius: 10, padding: 3 }}>
          {[{ v: 'grid', icon: LayoutGrid, label: '카드뷰' }, { v: 'list', icon: List, label: '리스트뷰' }].map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewMode(v)}
              style={{
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                border: 'none',
                background: viewMode === v ? tokens.color.surface : 'transparent',
                color: viewMode === v ? tokens.color.text : tokens.color.textSubtle,
                boxShadow: viewMode === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: viewMode === v ? 600 : 500,
                transition: 'all .15s',
              }}
            >
              <Icon style={{ width: 15, height: 15 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="fnco-grid-kpi-3" style={{ marginBottom: 16 }}>
        <KpiCard title="Candidate Pool" value={count} />
        <KpiCard title="Partnered" value={partneredCount} color={tokens.color.success} />
        <KpiCard title="Hidden Gem" value={hiddenGemCount} color="#f59e0b" />
      </div>

      {/* Search */}
      <div
        style={{
          borderRadius: 14,
          border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surfaceMuted,
          padding: '16px 18px',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: tokens.color.textSubtle }} />
            <Input
              placeholder="브랜드명 또는 인플루언서명을 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 32, height: 40, borderRadius: 10, borderColor: tokens.color.border, background: tokens.color.surface, fontSize: 13 }}
            />
          </div>
          <button
            type="button"
            style={{
              height: 40,
              padding: '0 20px',
              borderRadius: 10,
              border: 'none',
              background: tokens.color.primary,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            검색
          </button>
        </div>
        <p style={{ fontSize: 11, color: tokens.color.textSubtle, marginTop: 8 }}>
          DB에 있는 브랜드를 선택하거나 직접 입력할 수 있습니다. 검색 후 국가/카테고리 필터로 결과를 좁혀보세요.
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10, marginBottom: 18 }}>
        <div
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            background: tokens.color.primarySoft,
            color: tokens.color.primary,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          전체 {count}명
        </div>

        <FilterSelect label="크리에이터" value={creatorFilter} onValueChange={setCreatorFilter} options={CREATOR_FILTER_OPTIONS} width={150} />
        <FilterSelect label="플랫폼" value={platformFilter} onValueChange={setPlatformFilter} options={PLATFORM_OPTIONS} />
        <FilterSelect label="채널 규모" value={categoryFilter} onValueChange={setCategoryFilter} options={CATEGORY_OPTIONS} />
        <FilterSelect label="언어" value={languageFilter} onValueChange={setLanguageFilter} options={LANGUAGE_OPTIONS} width={100} />
        <FilterSelect label="Hidden GEM" value={hiddenGemFilter} onValueChange={setHiddenGemFilter} options={HIDDEN_GEM_OPTIONS} width={130} />
        <FilterSelect label="심층분석" value={analysisStatusFilter} onValueChange={setAnalysisStatusFilter} options={ANALYSIS_STATUS_OPTIONS} width={110} />
        {countries.length > 0 && (
          <FilterSelect
            label="국가"
            value={countryFilter}
            onValueChange={setCountryFilter}
            options={[{ value: 'all', label: '전체' }, ...countries.map((c) => ({ value: c, label: c }))]}
          />
        )}

        <span style={{ fontSize: 12, color: tokens.color.textSubtle, marginLeft: 'auto', paddingBottom: 4 }}>
          {checkedIds.size > 0 && (
            <span style={{ fontWeight: 700, color: tokens.color.primary, marginRight: 8 }}>{checkedIds.size}명 선택</span>
          )}
          {filtered.length}개 결과
        </span>

        <button
          type="button"
          onClick={handleConfirmHub}
          disabled={isConfirmingHub || checkedIds.size === 0}
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            border: 'none',
            background: checkedIds.size > 0 ? tokens.color.primary : tokens.color.surfaceMuted,
            fontSize: 12,
            fontWeight: 600,
            color: checkedIds.size > 0 ? '#fff' : tokens.color.textSubtle,
            cursor: checkedIds.size > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            opacity: isConfirmingHub ? 0.7 : 1,
            transition: 'all .15s',
          }}
        >
          {isConfirmingHub ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <UserCheck style={{ width: 14, height: 14 }} />}
          {isConfirmingHub ? '처리 중...' : `허브 대상 확정${checkedIds.size > 0 ? ` (${checkedIds.size})` : ''}`}
        </button>

        <button
          type="button"
          onClick={resetFilters}
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            fontSize: 12,
            fontWeight: 600,
            color: tokens.color.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Funnel style={{ width: 14, height: 14 }} /> 필터 초기화
        </button>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: tokens.color.textSubtle }}>
          <Users style={{ width: 40, height: 40, opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>인플루언서가 없습니다</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>선택된 인플루언서가 없습니다. 인플루언서 분석을 먼저 실행해주세요.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((inf) => (
            <InfluencerCard
              key={inf.id}
              influencer={inf}
              onToggleSelection={handleToggleSelection}
              onDeepAnalysis={handleDeepAnalysis}
              isAnalyzing={analyzingIds.has(inf.id)}
              isAnalyzed={analyzedResults.has(inf.id) || inf.analysisType === 'DEEP_ANALYSIS'}
              onViewAnalysis={handleViewAnalysis}
              isChecked={checkedIds.has(inf.id)}
              onToggleCheck={handleToggleCheck}
              analysisData={analyzedResults.get(inf.id)?.analysis || inf.deepAnalysis}
            />
          ))}
        </div>
      ) : (
        <InfluencerTableView
          influencers={filtered}
          onToggleSelection={handleToggleSelection}
          onDeepAnalysis={handleDeepAnalysis}
          analyzingIds={analyzingIds}
          analyzedResults={analyzedResults}
          onViewAnalysis={handleViewAnalysis}
          checkedIds={checkedIds}
          onToggleCheck={handleToggleCheck}
          onToggleCheckAll={handleToggleCheckAll}
        />
      )}

      {/* 심층 분석 결과 팝업 */}
      <DeepAnalysisDialog
        open={analysisDialogOpen}
        onOpenChange={setAnalysisDialogOpen}
        influencer={selectedAnalysis?.influencer}
        analysisData={selectedAnalysis?.analysis}
      />
    </div>
  );
}
