import { useEffect } from 'react';
const apiBase = import.meta.env.VITE_API_BASE_URL;
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Textarea } from './ui/textarea.jsx';
import { Button } from './ui/button.jsx';
import { contentData } from '../utils/insertDataSet.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx';
import { toast } from 'sonner@2.0.3';
import { fetchWithRetry } from '../utils/apiFunction.js';
import { parseUrl } from '../../../common/utils.js';
import { updateUgcFormData, resetUgcFormData, addUgcContent, setIsDone } from '../store/slices/crawlSlice.js';
import { reloadingUGCContents } from '../utils/reloadData.js';
import CountrySelect from './CountrySelect.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { useCampaignNameOptions } from '../hooks/useCampaignNameOptions.js';

// UGCContent object structure:
// { id, platform, post_url, author_nm, seeding_product, content_summary,
//   upload_dt, thumbnail_url, view_count, like_count, comment_count, share_count }

// Props: { onSubmit }

export function UGCForm({ onSubmit }) {
    const dispatch = useAppDispatch();
    const { ugcFormData, isDone } = useAppSelector((state) => state.crawl);
    const userState = useAppSelector((state) => state.user);
    const t = useTranslation();
    const campaignNameOptions = useCampaignNameOptions();
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');

    useEffect(() => {
        handleInputChange(
            'user_nm',
            `${userState.name}(${
                userState.name_eng.charAt(0).toUpperCase() + userState.name_eng.slice(1).toLowerCase()
            })`
        );
        handleInputChange('user_id', userState.user_id);
    }, [userState.name, userState.name_eng, userState.user_id, ugcFormData.user_nm]);

    const handleComplete = async (data, insertPara) => {
        try {
            dispatch(addUgcContent(data));
            dispatch(resetUgcFormData());

            await fetch(`${apiBase}/contents/ugc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ insertPara }),
            });
            await reloadingUGCContents(dispatch, userState);
            toast.success(t('ugcForm.messages.registerSuccess'));
            dispatch(setIsDone(false));
        } catch (error) {
            toast.error(t('ugcForm.messages.registerError'));
            dispatch(setIsDone(false));
        }
    };

    // 크롤링
    const handleCrawl = async (url) => {
        try {
            const params = {
                url: url,
                is_seeding: false,
            };

            const res = await fetchWithRetry(`${apiBase}/crawling`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            const data = await res.json();

            // 데이터 변환 (InfluencerContentForm과 동일한 구조)
            const resultData = contentData(data[0], ugcFormData);
            // Redux에 UGC 데이터 추가
            dispatch(addUgcContent(resultData));
            onSubmit(resultData);

            let insertPara = contentData([], ugcFormData);
            handleComplete(resultData, insertPara);
        } catch (error) {
            toast.error(t('ugcForm.messages.crawlingError'));
            dispatch(setIsDone(false));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 필수 필드 검증
        if (!ugcFormData.post_url || !ugcFormData.crawling_start_dt || !ugcFormData.crawling_end_dt) {
            toast.error(t('ugcForm.errors.requiredFields'));
            return;
        }

        if (
            (ugcFormData.crawling_start_dt && !ugcFormData.crawling_end_dt) ||
            (!ugcFormData.crawling_start_dt && ugcFormData.crawling_end_dt)
        ) {
            toast.error(t('ugcForm.errors.bothDatesRequired'));
            return;
        }

        // 업로드 기간 순서 검증
        if (ugcFormData.crawling_start_dt && ugcFormData.crawling_end_dt) {
            const startDate = new Date(ugcFormData.crawling_start_dt);
            const endDate = new Date(ugcFormData.crawling_end_dt);
            if (startDate >= endDate) {
                toast.error(t('ugcForm.errors.endDateAfterStart'));
                return;
            }
        }

        // URL 형식 검증
        try {
            new URL(ugcFormData.post_url);
        } catch {
            toast.error(t('ugcForm.errors.invalidUrlFormat'));
            return;
        }

        const response = await fetch(`${apiBase}/contents/ugc`);
        const data = await response.json();

        if (data.find((content) => content.post_id == parseUrl(ugcFormData.post_url)?.id)) {
            toast.error(t('ugcForm.errors.alreadyRegistered'));
            return;
        }

        // 플랫폼 자동 감지
        if (!parseUrl(ugcFormData.post_url)?.platform) {
            toast.error(t('ugcForm.errors.invalidPlatform'));
            return;
        }

        dispatch(setIsDone(true));
        handleCrawl(ugcFormData.post_url);
    };

    const handleInputChange = (field, value) => {
        dispatch(updateUgcFormData({ field, value }));
    };

    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>{t('ugcForm.title')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('ugcForm.description')}</p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="ugc-post_url">{t('ugcForm.labels.contentUrl')} *</Label>
                        <Input
                            id="ugc-post_url"
                            type="url"
                            placeholder={t('ugcForm.placeholders.contentUrl')}
                            value={ugcFormData.post_url}
                            onChange={(e) => handleInputChange('post_url', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ugc-platform">{t('ugcForm.labels.platform')}</Label>
                        <Input
                            id="ugc-platform"
                            type="text"
                            readOnly
                            placeholder={t('ugcForm.placeholders.platformAuto')}
                            value={
                                parseUrl(ugcFormData.post_url)?.platform.replace(/^\w/, (c) => c.toUpperCase()) || ''
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="uploadSchedule">
                            {t('ugcForm.labels.collectionSchedule')} * ({t('ugcForm.labels.collectionScheduleHint')})
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="crawling_start_dt">{t('ugcForm.labels.startDate')}</Label>
                                <Input
                                    id="crawling_start_dt"
                                    type="date"
                                    // min={getTodayString()}
                                    value={ugcFormData.crawling_start_dt}
                                    readOnly
                                    onChange={(e) => handleInputChange('crawling_start_dt', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="crawling_end_dt">{t('ugcForm.labels.endDate')}</Label>
                                <Input
                                    id="crawling_end_dt"
                                    type="date"
                                    min={getTodayString()}
                                    value={ugcFormData.crawling_end_dt}
                                    onChange={(e) => handleInputChange('crawling_end_dt', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="user_nm">{t('ugcForm.labels.userName')}</Label>
                        <Input
                            id="user_nm"
                            type="text"
                            placeholder={t('ugcForm.placeholders.userName')}
                            value={ugcFormData.user_nm}
                            // onChange={(e) => handleInputChange("user_nm", e.target.value)}
                            readOnly
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="seeding_cntry">{t('ugcForm.labels.seedingCountry')}</Label>
                        <CountrySelect
                            value={ugcFormData.seeding_cntry || 'KR'}
                            onChange={(value) => handleInputChange('seeding_cntry', value)}
                            placeholder={t('ugcForm.placeholders.selectCountry')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ugc-campaign_name">{t('ugcForm.labels.campaignName')}</Label>
                        <Input
                            id="ugc-campaign_name"
                            type="text"
                            list="campaign-name-datalist-ugc"
                            placeholder={t('ugcForm.placeholders.campaignName')}
                            value={ugcFormData.campaign_name || ''}
                            onChange={(e) => handleInputChange('campaign_name', e.target.value)}
                        />
                        <datalist id="campaign-name-datalist-ugc">
                            {campaignNameOptions.map((name) => (
                                <option key={name} value={name} />
                            ))}
                        </datalist>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ugc-content_summary">{t('ugcForm.labels.contentSummary')}</Label>
                        <Textarea
                            id="ugc-content_summary"
                            placeholder={t('ugcForm.placeholders.contentSummary')}
                            value={ugcFormData.content_summary}
                            onChange={(e) => handleInputChange('content_summary', e.target.value)}
                            rows={4}
                        />
                    </div>

                    {isDone ? (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#99999950',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <p style={{ color: '#fff' }}> {t('ugcForm.buttons.registering')} </p>
                        </div>
                    ) : (
                        <Button type="submit" className="w-full">
                            {t('ugcForm.buttons.register')}
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
