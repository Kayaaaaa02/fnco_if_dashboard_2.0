import { useState, useMemo } from 'react';
import {
  Library,
  Search,
  ExternalLink,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Youtube,
  Instagram,
  Loader2,
} from 'lucide-react';
import { useContentLibrary, useDeleteContent } from '@/hooks/useContentLibrary.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';

// --- Constants ---

const CONTENT_TABS = [
  { value: 'seeding', label: '시딩 콘텐츠' },
  { value: 'ugc', label: 'UGC 콘텐츠' },
  { value: 'preview', label: '프리뷰' },
  { value: 'performance', label: '성과 콘텐츠' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회수순' },
  { value: 'likes', label: '좋아요순' },
  { value: 'engagement', label: '참여도순' },
];

const PLATFORM_OPTIONS = [
  { value: 'all', label: '전체 플랫폼' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

const ITEMS_PER_PAGE = 12;

// --- Helpers ---

function getPlatformBadge(platform) {
  if (!platform) return null;
  const p = platform.toLowerCase();
  if (p.includes('youtube') || p === 'yt') {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <Youtube className="h-3 w-3" />
        YouTube
      </Badge>
    );
  }
  if (p.includes('instagram') || p === 'ig') {
    return (
      <Badge className="gap-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <Instagram className="h-3 w-3" />
        Instagram
      </Badge>
    );
  }
  if (p.includes('tiktok') || p === 'tt') {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.77a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
        </svg>
        TikTok
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-xs">{platform}</Badge>;
}

function formatNumber(num) {
  if (num == null) return '-';
  const n = Number(num);
  if (isNaN(n)) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function matchPlatformFilter(platform, filter) {
  if (filter === 'all') return true;
  if (!platform) return false;
  const p = platform.toLowerCase();
  if (filter === 'youtube') return p.includes('youtube') || p === 'yt';
  if (filter === 'instagram') return p.includes('instagram') || p === 'ig';
  if (filter === 'tiktok') return p.includes('tiktok') || p === 'tt';
  return false;
}

function getEngagement(item) {
  const views = Number(item.view_count) || 0;
  const likes = Number(item.like_count) || 0;
  const comments = Number(item.comment_count) || 0;
  const shares = Number(item.share_count) || 0;
  if (views === 0) return likes + comments + shares;
  return ((likes + comments + shares) / views) * 100;
}

// --- Sub-components ---

function ContentCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function ContentCard({ item, onDelete, canDelete }) {
  const thumbnailUrl = item.thumbnail_url || item.media_url;

  return (
    <Card
      className="overflow-hidden group cursor-pointer transition-shadow"
      style={{
        borderRadius: 14,
        borderColor: '#d1d5db',
        background: '#ffffff',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative bg-muted overflow-hidden"
        style={{ height: 260 }}
        onClick={() => {
          if (item.post_url) window.open(item.post_url, '_blank', 'noopener,noreferrer');
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.title || item.author_nm || '콘텐츠'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`flex items-center justify-center h-full w-full ${thumbnailUrl ? 'hidden' : ''} absolute inset-0 bg-muted`}>
          <Library className="h-10 w-10 text-muted-foreground/30" />
        </div>

        {/* Platform badge overlay */}
        <div className="absolute top-2 left-2">
          {getPlatformBadge(item.platform)}
        </div>

        {/* Open link icon */}
        {item.post_url && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 rounded-full p-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-2" style={{ padding: 16 }}>
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium line-clamp-2 flex-1">
            {item.title || item.description || item.seeding_product || '제목 없음'}
          </h3>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Influencer + Campaign */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.author_nm && <span className="font-medium truncate">{item.author_nm}</span>}
          {item.campaign_name && (
            <>
              <span className="text-border">|</span>
              <span className="truncate">{item.campaign_name}</span>
            </>
          )}
        </div>

        {/* Country */}
        {item.seeding_cntry && (
          <Badge variant="outline" className="text-xs">
            {item.seeding_cntry}
          </Badge>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          {item.view_count != null && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(item.view_count)}
            </span>
          )}
          {item.like_count != null && (
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {formatNumber(item.like_count)}
            </span>
          )}
          {item.comment_count != null && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {formatNumber(item.comment_count)}
            </span>
          )}
          {item.share_count != null && Number(item.share_count) > 0 && (
            <span className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              {formatNumber(item.share_count)}
            </span>
          )}
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground">
          {formatDate(item.upload_dt || item.created_dt)}
        </div>

        {item.post_url && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.post_url, '_blank', 'noopener,noreferrer');
            }}
          >
            영상 보기
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ContentTabPanel({ type }) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: rawItems = [], isLoading, error } = useContentLibrary(type);
  const deleteContentMutation = useDeleteContent(type);

  const canDelete = type !== 'performance';

  // Derive unique countries and campaigns for filter options
  const { countries, campaigns } = useMemo(() => {
    const countrySet = new Set();
    const campaignSet = new Set();
    rawItems.forEach((item) => {
      if (item.seeding_cntry) countrySet.add(item.seeding_cntry);
      if (item.campaign_name) campaignSet.add(item.campaign_name);
    });
    return {
      countries: Array.from(countrySet).sort(),
      campaigns: Array.from(campaignSet).sort(),
    };
  }, [rawItems]);

  // Filter + sort
  const filteredItems = useMemo(() => {
    let items = [...rawItems];

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.author_nm && item.author_nm.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.seeding_product && item.seeding_product.toLowerCase().includes(q))
      );
    }

    // Platform filter
    if (platformFilter !== 'all') {
      items = items.filter((item) => matchPlatformFilter(item.platform, platformFilter));
    }

    // Country filter
    if (countryFilter !== 'all') {
      items = items.filter((item) => item.seeding_cntry === countryFilter);
    }

    // Campaign filter
    if (campaignFilter !== 'all') {
      items = items.filter((item) => item.campaign_name === campaignFilter);
    }

    // Sort
    items.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (Number(b.view_count) || 0) - (Number(a.view_count) || 0);
        case 'likes':
          return (Number(b.like_count) || 0) - (Number(a.like_count) || 0);
        case 'engagement':
          return getEngagement(b) - getEngagement(a);
        case 'latest':
        default: {
          const dateA = new Date(a.upload_dt || a.created_dt || 0);
          const dateB = new Date(b.upload_dt || b.created_dt || 0);
          return dateB - dateA;
        }
      }
    });

    return items;
  }, [rawItems, search, platformFilter, countryFilter, campaignFilter, sortBy]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  function handleDelete(item) {
    setDeleteTarget(item);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    // V1 delete APIs expect an object with post_id + potentially other identifiers
    const deletePara = {
      post_id: deleteTarget.post_id || deleteTarget.id,
    };
    deleteContentMutation.mutate(deletePara, {
      onSettled: () => setDeleteTarget(null),
    });
  }

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          platformFilter={platformFilter}
          onPlatformChange={setPlatformFilter}
          countryFilter={countryFilter}
          onCountryChange={setCountryFilter}
          campaignFilter={campaignFilter}
          onCampaignChange={setCampaignFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          countries={[]}
          campaigns={[]}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        <p>콘텐츠를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  // Empty
  if (rawItems.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Library className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">콘텐츠가 없습니다</p>
        <p className="text-sm mt-1">등록된 콘텐츠가 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        platformFilter={platformFilter}
        onPlatformChange={setPlatformFilter}
        countryFilter={countryFilter}
        onCountryChange={setCountryFilter}
        campaignFilter={campaignFilter}
        onCampaignChange={setCampaignFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        countries={countries}
        campaigns={campaigns}
      />

      {/* Result count */}
      <div className="text-sm text-muted-foreground">
        총 {filteredItems.length}개 콘텐츠
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item) => (
              <ContentCard
                key={item.post_id || item.id || `${item.author_nm}-${item.created_dt}`}
                item={item}
                onDelete={handleDelete}
                canDelete={canDelete}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              >
                더 보기 ({filteredItems.length - visibleCount}개 남음)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>콘텐츠 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 콘텐츠를 삭제하시겠습니까? 삭제된 콘텐츠는 복구할 수 없습니다.
              {deleteTarget?.title && (
                <span className="block mt-2 font-medium text-foreground">
                  {deleteTarget.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteContentMutation.isPending}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteContentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteContentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterBar({
  search,
  onSearchChange,
  platformFilter,
  onPlatformChange,
  countryFilter,
  onCountryChange,
  campaignFilter,
  onCampaignChange,
  sortBy,
  onSortChange,
  countries,
  campaigns,
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-2xl border"
      style={{ padding: 16, borderColor: '#d1d5db', background: '#f9fafb' }}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="제목, 인플루언서 검색..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          style={{ background: '#ffffff', borderColor: '#d1d5db', height: 42 }}
        />
      </div>

      {/* Platform filter */}
      <Select value={platformFilter} onValueChange={onPlatformChange}>
        <SelectTrigger className="w-[140px]" style={{ borderRadius: 10, background: '#ffffff' }}>
          <SelectValue placeholder="플랫폼" />
        </SelectTrigger>
        <SelectContent>
          {PLATFORM_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Country filter */}
      {countries.length > 0 && (
        <Select value={countryFilter} onValueChange={onCountryChange}>
          <SelectTrigger className="w-[120px]" style={{ borderRadius: 10, background: '#ffffff' }}>
            <SelectValue placeholder="국가" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 국가</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Campaign filter */}
      {campaigns.length > 0 && (
        <Select value={campaignFilter} onValueChange={onCampaignChange}>
          <SelectTrigger className="w-[160px]" style={{ borderRadius: 10, background: '#ffffff' }}>
            <SelectValue placeholder="캠페인" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 캠페인</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[120px]" style={{ borderRadius: 10, background: '#ffffff' }}>
          <SelectValue placeholder="정렬" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// --- Main Component ---

export default function ContentLibrary() {
  const [activeTab, setActiveTab] = useState('seeding');

  return (
    <div className="space-y-6" style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>콘텐츠 라이브러리</h1>
        <p style={{ color: '#6b7280' }}>
          캠페인에서 생성된 크리에이티브 에셋을 관리합니다.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {CONTENT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CONTENT_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <ContentTabPanel type={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

