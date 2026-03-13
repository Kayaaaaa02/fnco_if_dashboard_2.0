import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.js';
import {
    setUgcSortBy,
    toggleUgcSortDirection,
    loadMoreUgc,
    setUgcCountryFilter,
    setUgcCampaignFilter,
} from '../../store/slices/dashboardSlice.js';
import { Button } from '../ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.jsx';
import { Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { ContentCard } from './ContentCard.jsx';
import { sortContents, getCountryName } from '../../utils/contentUtils.js';
import { useTranslation } from '../../hooks/useTranslation.js';

export function UGCContentTab({ contents = [], videoAnalysisStatuses, onOpenVideoAnalysis }) {
    const dispatch = useAppDispatch();
    const { ugc } = useAppSelector((state) => state.dashboard);
    const [displayContents, setDisplayContents] = useState([]);
    const t = useTranslation();
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');

    // 국가 필터 옵션 추출
    const availableCountries = useMemo(() => {
        if (!Array.isArray(contents)) return [];
        const countries = [...new Set(contents.map((content) => content.seeding_cntry).filter(Boolean))];
        return countries.sort();
    }, [contents]);

    // 국가 필터 적용 결과 (캠페인 옵션은 이 결과 기준)
    const countryFilteredContents = useMemo(() => {
        if (!Array.isArray(contents)) return [];
        if (ugc.countryFilter && ugc.countryFilter !== 'all') {
            return contents.filter((content) => content.seeding_cntry === ugc.countryFilter);
        }
        return contents;
    }, [contents, ugc.countryFilter]);

    // 캠페인 필터 옵션: 국가 필터에 상속
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
        if (ugc.campaignFilter && ugc.campaignFilter !== 'all') {
            return countryFilteredContents.filter((content) => content.campaign_name === ugc.campaignFilter);
        }
        return countryFilteredContents;
    }, [countryFilteredContents, ugc.campaignFilter]);

    useEffect(() => {
        if (!Array.isArray(filteredContents)) {
            setDisplayContents([]);
            return;
        }
        const sortedContents = sortContents(filteredContents, ugc.sortBy, ugc.sortDirection);
        setDisplayContents(sortedContents.slice(0, ugc.loadedCount));
    }, [filteredContents, ugc.loadedCount, ugc.sortBy, ugc.sortDirection]);

    const handleLoadMore = () => {
        dispatch(loadMoreUgc());
    };

    const handleToggleSortDirection = () => {
        dispatch(toggleUgcSortDirection());
    };

    if (contents.length === 0) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-muted-foreground">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h4 className="mb-2">{t('dashboard.ugcContentTab.emptyTitle')}</h4>
                    <p>{t('dashboard.ugcContentTab.emptyDescription')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 style={{ fontSize: '1.125rem', color: '#111827', margin: 0 }}>
                        {t('dashboard.ugcContentTab.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.ugcContentTab.description', {
                            total: contents.length,
                            displayed: displayContents.length,
                        })}
                    </p>
                </div>

                {/* 필터 및 정렬 옵션 */}
                <div className="flex items-center gap-3">
                    {/* 국가 필터 */}
                    <Select
                        value={ugc.countryFilter || 'all'}
                        onValueChange={(value) => dispatch(setUgcCountryFilter(value))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.ugcContentTab.countryFilter.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('dashboard.ugcContentTab.countryFilter.all')}</SelectItem>
                            {availableCountries.map((country) => (
                                <SelectItem key={country} value={country}>
                                    {getCountryName(country, currentLanguage)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 캠페인 필터 (국가 필터에 상속) */}
                    <Select
                        value={ugc.campaignFilter || 'all'}
                        onValueChange={(value) => dispatch(setUgcCampaignFilter(value))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.ugcContentTab.campaignFilter.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('dashboard.ugcContentTab.campaignFilter.all')}</SelectItem>
                            {availableCampaigns.map((campaign) => (
                                <SelectItem key={campaign} value={campaign}>
                                    {campaign}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 정렬 옵션 */}
                    <Select value={ugc.sortBy} onValueChange={(value) => dispatch(setUgcSortBy(value))}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder={t('dashboard.ugcContentTab.sort.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">{t('dashboard.ugcContentTab.sort.default')}</SelectItem>
                            <SelectItem value="view_count">{t('dashboard.ugcContentTab.sort.viewCount')}</SelectItem>
                            <SelectItem value="like_count">{t('dashboard.ugcContentTab.sort.likeCount')}</SelectItem>
                            <SelectItem value="comment_count">
                                {t('dashboard.ugcContentTab.sort.commentCount')}
                            </SelectItem>
                            <SelectItem value="share_count">{t('dashboard.ugcContentTab.sort.shareCount')}</SelectItem>
                        </SelectContent>
                    </Select>

                    {ugc.sortBy !== 'default' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleSortDirection}
                            className="flex items-center gap-2"
                        >
                            {ugc.sortDirection === 'desc' ? (
                                <>
                                    <ArrowDown className="w-4 h-4" />
                                    {t('dashboard.ugcContentTab.sort.descending')}
                                </>
                            ) : (
                                <>
                                    <ArrowUp className="w-4 h-4" />
                                    {t('dashboard.ugcContentTab.sort.ascending')}
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
                        type="ugc"
                        videoAnalysisStatus={videoAnalysisStatuses?.[content.post_id]}
                        onOpenVideoAnalysis={onOpenVideoAnalysis}
                    />
                ))}
            </div>

            {/* 더 보기 버튼 */}
            {displayContents.length < filteredContents.length && (
                <div className="flex justify-center pt-8">
                    <Button onClick={handleLoadMore} variant="outline" size="lg">
                        {t('dashboard.ugcContentTab.loadMore', {
                            remaining: filteredContents.length - displayContents.length,
                        })}
                    </Button>
                </div>
            )}
        </div>
    );
}
