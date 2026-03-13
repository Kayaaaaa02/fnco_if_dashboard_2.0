import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.js';
import {
    setSeedingSortBy,
    toggleSeedingSortDirection,
    loadMoreSeeding,
    setSeedingCountryFilter,
    setSeedingCampaignFilter,
} from '../../store/slices/dashboardSlice.js';
import { Button } from '../ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.jsx';
import { Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { ContentCard } from './ContentCard.jsx';
import { sortContents, getCountryName } from '../../utils/contentUtils.js';
import { useTranslation } from '../../hooks/useTranslation.js';

export function SeedingPreviewTab({ contents = [], videoAnalysisStatuses, onOpenVideoAnalysis }) {
    const dispatch = useAppDispatch();
    const { seeding } = useAppSelector((state) => state.dashboard);
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
        if (seeding.countryFilter && seeding.countryFilter !== 'all') {
            return contents.filter((content) => content.seeding_cntry === seeding.countryFilter);
        }
        return contents;
    }, [contents, seeding.countryFilter]);

    // 캠페인 필터 옵션: 국가 필터 적용된 목록에서 유일한 campaign_name 추출 (국가에 상속)
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
        if (seeding.campaignFilter && seeding.campaignFilter !== 'all') {
            return countryFilteredContents.filter((content) => content.campaign_name === seeding.campaignFilter);
        }
        return countryFilteredContents;
    }, [countryFilteredContents, seeding.campaignFilter]);

    useEffect(() => {
        if (!Array.isArray(filteredContents)) {
            setDisplayContents([]);
            return;
        }
        const sortedContents = sortContents(filteredContents, seeding.sortBy, seeding.sortDirection);
        setDisplayContents(sortedContents.slice(0, seeding.loadedCount));
    }, [filteredContents, seeding.loadedCount, seeding.sortBy, seeding.sortDirection]);

    const handleLoadMore = () => {
        dispatch(loadMoreSeeding());
    };

    const handleToggleSortDirection = () => {
        dispatch(toggleSeedingSortDirection());
    };

    if (contents.length === 0) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-muted-foreground">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h4 className="mb-2">{t('dashboard.seedingPreviewTab.emptyTitle')}</h4>
                    <p>{t('dashboard.seedingPreviewTab.emptyDescription')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 style={{ fontSize: '1.125rem', color: '#111827', margin: 0 }}>
                        {t('dashboard.seedingPreviewTab.title')}
                    </h3>
                    <p className="text-sm" style={{ color: '#ea580c' }}>
                        {t('dashboard.seedingPreviewTab.description', { total: contents.length })}
                    </p>
                </div>

                {/* 필터 및 정렬 옵션 */}
                <div className="flex items-center gap-3">
                    {/* 국가 필터 */}
                    <Select
                        value={seeding.countryFilter || 'all'}
                        onValueChange={(value) => dispatch(setSeedingCountryFilter(value))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.seedingPreviewTab.countryFilter.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('dashboard.seedingPreviewTab.countryFilter.all')}</SelectItem>
                            {availableCountries.map((country) => (
                                <SelectItem key={country} value={country}>
                                    {getCountryName(country, currentLanguage)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 캠페인 필터 (국가 필터에 상속: 선택된 국가 내 캠페인만 표시) */}
                    <Select
                        value={seeding.campaignFilter || 'all'}
                        onValueChange={(value) => dispatch(setSeedingCampaignFilter(value))}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.seedingPreviewTab.campaignFilter.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('dashboard.seedingPreviewTab.campaignFilter.all')}</SelectItem>
                            {availableCampaigns.map((campaign) => (
                                <SelectItem key={campaign} value={campaign}>
                                    {campaign}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 정렬 옵션 */}
                    <Select value={seeding.sortBy} onValueChange={(value) => dispatch(setSeedingSortBy(value))}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t('dashboard.seedingPreviewTab.sort.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">{t('dashboard.seedingPreviewTab.sort.default')}</SelectItem>
                            <SelectItem value="scheduled_date">
                                {t('dashboard.seedingPreviewTab.sort.scheduledDate')}
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {seeding.sortBy !== 'default' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleSortDirection}
                            className="flex items-center gap-2"
                        >
                            {seeding.sortDirection === 'desc' ? (
                                <>
                                    <ArrowDown className="w-4 h-4" />
                                    {t('dashboard.seedingPreviewTab.sort.descending')}
                                </>
                            ) : (
                                <>
                                    <ArrowUp className="w-4 h-4" />
                                    {t('dashboard.seedingPreviewTab.sort.ascending')}
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
                        type="preview"
                        videoAnalysisStatus={videoAnalysisStatuses[content.post_id]}
                        onOpenVideoAnalysis={onOpenVideoAnalysis}
                    />
                ))}
            </div>

            {/* 더 보기 버튼 */}
            {displayContents.length < filteredContents.length && (
                <div className="flex justify-center pt-8">
                    <Button onClick={handleLoadMore} variant="outline" size="lg">
                        {t('dashboard.seedingPreviewTab.loadMore', {
                            remaining: filteredContents.length - displayContents.length,
                        })}
                    </Button>
                </div>
            )}
        </div>
    );
}
