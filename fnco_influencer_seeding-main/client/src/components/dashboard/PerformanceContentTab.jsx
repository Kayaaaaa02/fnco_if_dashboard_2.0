import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.js';
import {
    setPerformanceSortBy,
    togglePerformanceSortDirection,
    loadMorePerformance,
    setPerformancePlatformFilter,
    setPerformanceCountryFilter,
    setPerformanceCampaignFilter,
    setPerformanceFollowerSizeFilter,
} from '../../store/slices/dashboardSlice.js';
import { Button } from '../ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip.jsx';
import { TrendingUp, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { ContentCard } from './ContentCard.jsx';
import { sortContents, getPlatformLabel, getCountryName } from '../../utils/contentUtils.js';
import { useTranslation } from '../../hooks/useTranslation.js';

export function PerformanceContentTab({ contents = [], videoAnalysisStatuses, onOpenVideoAnalysis }) {
    const dispatch = useAppDispatch();
    const { performance } = useAppSelector((state) => state.dashboard);
    const [displayContents, setDisplayContents] = useState([]);
    const t = useTranslation();
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');

    // 계층적 필터 옵션 추출
    // 1단계: 모든 플랫폼 (전체 contents 기준)
    const availablePlatforms = useMemo(() => {
        if (!Array.isArray(contents)) return [];
        const platforms = [...new Set(contents.map((content) => content.platform).filter(Boolean))];
        return platforms.sort();
    }, [contents]);

    // 2단계: 선택된 플랫폼의 팔로워 사이즈만 추출
    const availableFollowerSizes = useMemo(() => {
        if (!Array.isArray(contents)) return [];
        const platformFiltered = performance.platformFilter
            ? contents.filter((content) => content.platform === performance.platformFilter)
            : contents;
        const sizes = [...new Set(platformFiltered.map((content) => content.follower_size).filter(Boolean))];
        return sizes.sort();
    }, [contents, performance.platformFilter]);

    // 3단계: 선택된 플랫폼 + 팔로워 사이즈의 국가만 추출
    const availableCountries = useMemo(() => {
        if (!Array.isArray(contents)) return [];
        let filtered = contents;

        // 플랫폼 필터 적용
        if (performance.platformFilter) {
            filtered = filtered.filter((content) => content.platform === performance.platformFilter);
        }

        // 팔로워 사이즈 필터 적용
        if (performance.followerSizeFilter) {
            filtered = filtered.filter((content) => content.follower_size === performance.followerSizeFilter);
        }

        const countries = [...new Set(filtered.map((content) => content.seeding_cntry).filter(Boolean))];
        return countries.sort();
    }, [contents, performance.platformFilter, performance.followerSizeFilter]);

    // 플랫폼 + 팔로워 + 국가 필터 적용 결과 (캠페인 옵션은 이 결과 기준)
    const countryFilteredContents = useMemo(() => {
        if (!Array.isArray(contents)) return [];

        return contents.filter((content) => {
            if (performance.countryFilter && performance.countryFilter !== 'all') {
                if (content.seeding_cntry !== performance.countryFilter) return false;
            }
            if (performance.platformFilter) {
                if (content.platform !== performance.platformFilter) return false;
            }
            if (performance.followerSizeFilter) {
                if (content.follower_size !== performance.followerSizeFilter) return false;
            }
            return true;
        });
    }, [contents, performance.countryFilter, performance.platformFilter, performance.followerSizeFilter]);

    // 캠페인 필터 옵션: 국가 필터에 상속 (플랫폼·팔로워·국가 적용 후)
    const availableCampaigns = useMemo(() => {
        if (!Array.isArray(countryFilteredContents)) return [];
        const names = [
            ...new Set(
                countryFilteredContents
                    .map((content) => content.campaign_name)
                    .filter((v) => v != null && String(v).trim() !== '')
            ),
        ];
        return names.sort();
    }, [countryFilteredContents]);

    // 캠페인 필터 적용까지 한 최종 목록
    const filteredContents = useMemo(() => {
        if (!Array.isArray(countryFilteredContents)) return [];
        if (performance.campaignFilter && performance.campaignFilter !== 'all') {
            return countryFilteredContents.filter((content) => content.campaign_name === performance.campaignFilter);
        }
        return countryFilteredContents;
    }, [countryFilteredContents, performance.campaignFilter]);

    // 필터링된 채널별 최대 성과 지수 계산
    const maxPerformanceScore = useMemo(() => {
        if (!Array.isArray(filteredContents) || filteredContents.length === 0) return 0;
        const scores = filteredContents.map((content) => Number(content.performance_score || 0));
        return Math.max(...scores);
    }, [filteredContents]);

    // 플랫폼 필터 초기화 (최초 로드 시 또는 유효하지 않을 때)
    useEffect(() => {
        if (availablePlatforms.length > 0) {
            if (!performance.platformFilter || !availablePlatforms.includes(performance.platformFilter)) {
                dispatch(setPerformancePlatformFilter(availablePlatforms[0]));
            }
        }
    }, [availablePlatforms, performance.platformFilter, dispatch]);

    // 플랫폼 변경 시 팔로워 사이즈 필터 유효성 검사
    useEffect(() => {
        if (performance.followerSizeFilter && availableFollowerSizes.length > 0) {
            // 현재 선택된 팔로워 사이즈가 사용 가능한 옵션에 없으면 초기화
            if (!availableFollowerSizes.includes(performance.followerSizeFilter)) {
                dispatch(setPerformanceFollowerSizeFilter(availableFollowerSizes[0]));
            }
        } else if (availableFollowerSizes.length > 0 && !performance.followerSizeFilter) {
            // 팔로워 사이즈가 선택되지 않았으면 첫 번째 옵션으로 설정
            dispatch(setPerformanceFollowerSizeFilter(availableFollowerSizes[0]));
        }
    }, [availableFollowerSizes, performance.followerSizeFilter, dispatch]);

    // 팔로워 사이즈 변경 시 국가 필터 유효성 검사
    useEffect(() => {
        if (performance.countryFilter && performance.countryFilter !== 'all' && availableCountries.length > 0) {
            if (!availableCountries.includes(performance.countryFilter)) {
                dispatch(setPerformanceCountryFilter('all'));
            }
        }
    }, [availableCountries, performance.countryFilter, dispatch]);

    // 국가/캠페인 변경 시 캠페인 필터 유효성 검사
    useEffect(() => {
        if (performance.campaignFilter && performance.campaignFilter !== 'all' && availableCampaigns.length > 0) {
            if (!availableCampaigns.includes(performance.campaignFilter)) {
                dispatch(setPerformanceCampaignFilter('all'));
            }
        }
    }, [availableCampaigns, performance.campaignFilter, dispatch]);

    useEffect(() => {
        const sortedContents = sortContents(filteredContents, performance.sortBy, performance.sortDirection);
        setDisplayContents(sortedContents.slice(0, performance.loadedCount));
    }, [filteredContents, performance.loadedCount, performance.sortBy, performance.sortDirection]);

    const handleLoadMore = () => {
        dispatch(loadMorePerformance());
    };

    const handleToggleSortDirection = () => {
        dispatch(togglePerformanceSortDirection());
    };

    if (contents.length === 0) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-muted-foreground">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h4 className="mb-2">{t('dashboard.performanceContentTab.emptyTitle')}</h4>
                    <p>{t('dashboard.performanceContentTab.emptyDescription')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.125rem', color: '#111827', margin: 0 }}>
                            {t('dashboard.performanceContentTab.title')}
                        </h3>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            background: 'none',
                                            border: 'none',
                                        }}
                                    >
                                        <Info style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    align="start"
                                    style={{
                                        backgroundColor: '#000000',
                                        color: '#ffffff',
                                        borderColor: '#374151',
                                        padding: '12px',
                                        minWidth: '600px',
                                        maxWidth: '650px',
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                                borderBottom: '1px solid #4b5563',
                                                paddingBottom: '12px',
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{ color: '#d1d5db', marginBottom: '2px', fontSize: '15px' }}
                                                >
                                                    {t('dashboard.performanceContentTab.tooltip.viewCountZScore')}
                                                </div>
                                                <div
                                                    style={{
                                                        color: '#ffffff',
                                                        fontFamily: 'monospace',
                                                        fontSize: '15px',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {t(
                                                        'dashboard.performanceContentTab.tooltip.viewCountZScoreFormula'
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{ color: '#d1d5db', marginBottom: '2px', fontSize: '15px' }}
                                                >
                                                    {t('dashboard.performanceContentTab.tooltip.engagementZScore')}
                                                </div>
                                                <div
                                                    style={{
                                                        color: '#ffffff',
                                                        fontFamily: 'monospace',
                                                        fontSize: '15px',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {t(
                                                        'dashboard.performanceContentTab.tooltip.engagementZScoreFormula'
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{ color: '#d1d5db', marginBottom: '2px', fontSize: '15px' }}
                                                >
                                                    {t('dashboard.performanceContentTab.tooltip.performanceIndex')}
                                                </div>
                                                <div
                                                    style={{
                                                        color: '#ffffff',
                                                        fontFamily: 'monospace',
                                                        fontSize: '15px',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {t(
                                                        'dashboard.performanceContentTab.tooltip.performanceIndexFormula'
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                borderBottom: '1px solid #4b5563',
                                                paddingBottom: '12px',
                                            }}
                                        >
                                            <div style={{ color: '#d1d5db', marginBottom: '8px' }}>
                                                {t('dashboard.performanceContentTab.tooltip.rankByGrade')}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        width: '48px',
                                                        height: '12px',
                                                        borderRadius: '4px',
                                                        background: 'linear-gradient(to right, #facc15, #f97316)',
                                                    }}
                                                ></span>
                                                <span style={{ color: '#ffffff' }}>
                                                    {t('dashboard.performanceContentTab.tooltip.rank1to5')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        width: '48px',
                                                        height: '12px',
                                                        borderRadius: '4px',
                                                        background: 'linear-gradient(to right, #a855f7, #ec4899)',
                                                    }}
                                                ></span>
                                                <span style={{ color: '#ffffff' }}>
                                                    {t('dashboard.performanceContentTab.tooltip.rank6to10')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        width: '48px',
                                                        height: '12px',
                                                        borderRadius: '4px',
                                                        background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                                                    }}
                                                ></span>
                                                <span style={{ color: '#ffffff' }}>
                                                    {t('dashboard.performanceContentTab.tooltip.rank11to20')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}></div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                            }}
                                        >
                                            <div style={{ color: '#d1d5db', marginBottom: '6px' }}>
                                                {t('dashboard.performanceContentTab.tooltip.note')}
                                            </div>
                                            <div style={{ color: '#d1d5db', lineHeight: '1.5', fontSize: '12px' }}>
                                                • {t('dashboard.performanceContentTab.tooltip.note1')}
                                            </div>
                                            <div style={{ color: '#d1d5db', lineHeight: '1.5', fontSize: '12px' }}>
                                                • {t('dashboard.performanceContentTab.tooltip.note2')}
                                            </div>
                                            <div style={{ color: '#d1d5db', lineHeight: '1.5', fontSize: '12px' }}>
                                                • {t('dashboard.performanceContentTab.tooltip.note3')}
                                            </div>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.performanceContentTab.description', {
                            total: contents.length,
                            displayed: displayContents.length,
                        })}
                    </p>
                </div>

                {/* 필터 및 정렬 옵션 */}
                <div className="flex items-center gap-3">
                    {/* 1. 플랫폼 필터 */}
                    <Select
                        value={performance.platformFilter || availablePlatforms[0] || ''}
                        onValueChange={(value) => dispatch(setPerformancePlatformFilter(value))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.performanceContentTab.filters.platform')} />
                        </SelectTrigger>
                        <SelectContent>
                            {availablePlatforms.map((platform) => (
                                <SelectItem key={platform} value={platform}>
                                    {getPlatformLabel(platform)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 2. 팔로워 사이즈 필터 */}
                    <Select
                        value={performance.followerSizeFilter || availableFollowerSizes[0] || ''}
                        onValueChange={(value) => dispatch(setPerformanceFollowerSizeFilter(value))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.performanceContentTab.filters.follower')} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableFollowerSizes.map((size) => (
                                <SelectItem key={size} value={size}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 3. 시딩 국가 필터 */}
                    <Select
                        value={performance.countryFilter || 'all'}
                        onValueChange={(value) => dispatch(setPerformanceCountryFilter(value))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.performanceContentTab.filters.country')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {t('dashboard.performanceContentTab.filters.allCountries')}
                            </SelectItem>
                            {availableCountries.map((country) => (
                                <SelectItem key={country} value={country}>
                                    {getCountryName(country, currentLanguage)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 4. 캠페인 필터 (국가 필터에 상속) */}
                    <Select
                        value={performance.campaignFilter || 'all'}
                        onValueChange={(value) => dispatch(setPerformanceCampaignFilter(value))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.performanceContentTab.filters.campaign')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {t('dashboard.performanceContentTab.filters.allCampaigns')}
                            </SelectItem>
                            {availableCampaigns.map((campaign) => (
                                <SelectItem key={campaign} value={campaign}>
                                    {campaign}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 5. 정렬 옵션 */}
                    <Select value={performance.sortBy} onValueChange={(value) => dispatch(setPerformanceSortBy(value))}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder={t('dashboard.performanceContentTab.sort.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="performance_score">
                                {t('dashboard.performanceContentTab.sort.performanceScore')}
                            </SelectItem>
                            <SelectItem value="default">{t('dashboard.performanceContentTab.sort.default')}</SelectItem>
                            <SelectItem value="view_count">
                                {t('dashboard.performanceContentTab.sort.viewCount')}
                            </SelectItem>
                            <SelectItem value="like_count">
                                {t('dashboard.performanceContentTab.sort.likeCount')}
                            </SelectItem>
                            <SelectItem value="comment_count">
                                {t('dashboard.performanceContentTab.sort.commentCount')}
                            </SelectItem>
                            <SelectItem value="share_count">
                                {t('dashboard.performanceContentTab.sort.shareCount')}
                            </SelectItem>
                            <SelectItem value="crawling_start_dt">
                                {t('dashboard.performanceContentTab.sort.uploadDate')}
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* 5. 오름차순/내림차순 버튼 */}
                    {performance.sortBy !== 'default' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleSortDirection}
                            className="flex items-center gap-2"
                        >
                            {performance.sortDirection === 'desc' ? (
                                <>
                                    <ArrowDown className="w-4 h-4" />
                                    {t('dashboard.performanceContentTab.sort.descending')}
                                </>
                            ) : (
                                <>
                                    <ArrowUp className="w-4 h-4" />
                                    {t('dashboard.performanceContentTab.sort.ascending')}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* 콘텐츠 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayContents.map((content) => (
                    <ContentCard
                        key={content.id}
                        content={content}
                        type="performance"
                        videoAnalysisStatus={videoAnalysisStatuses?.[content.post_id]}
                        onOpenVideoAnalysis={onOpenVideoAnalysis}
                        maxPerformanceScore={maxPerformanceScore}
                    />
                ))}
            </div>

            {/* 더 보기 버튼 */}
            {displayContents.length < filteredContents.length && (
                <div className="flex justify-center pt-8">
                    <Button onClick={handleLoadMore} variant="outline" size="lg">
                        {t('dashboard.performanceContentTab.loadMore', {
                            remaining: filteredContents.length - displayContents.length,
                        })}
                    </Button>
                </div>
            )}
        </div>
    );
}
