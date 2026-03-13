const apiBase = import.meta.env.VITE_API_BASE_URL;
import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { reloadingSeedingContents, reloadingPreviewContents } from '../utils/reloadData.js';
import { contentData } from '../utils/insertDataSet.js';
import { useCampaignNameOptions } from '../hooks/useCampaignNameOptions.js';
import {
    updateFormData,
    setFormData,
    resetFormData,
    setExcelData,
    addExcelRow,
    removeExcelRow,
    clearExcelData,
    setSelectedFile,
    setIsProcessingExcel,
    setCrawlLoading,
    setCrawlError,
    clearCrawlError,
    setCurrentUrl,
    setIsDone,
    addCrawledData,
    setSeedingContents,
    addSeedingContent,
} from '../store/slices/crawlSlice.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Textarea } from './ui/textarea.jsx';
import { Switch } from './ui/switch.jsx';
import { Button } from './ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { Badge } from './ui/badge.jsx';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Upload, FileText, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
    fetchWithRetry,
    checkPostExistsInPerformance,
    checkMultiplePostsExistInPerformance,
    logPerformanceContentDetection,
} from '../utils/apiFunction.js';
import { parseUrl } from '../../../common/utils.js';
import CountrySelect from './CountrySelect.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { formatDate } from '../utils/contentUtils.js';
// InfluencerContent object structure:
// { id, influencerAccount, post_url, platform, seeding_product, keyword, title, uploadSchedule,
//   seeding_cost, agency_nm, user_nm, second_crawling_start_dt, second_crwaling_end_dt,
//   is_fnco_edit, content_summary, upload_dt, thumbnailUrl, view_count, like_count,
//   comment_count, share_count }

// Props: { onSubmit, onBulkSubmit, userRole, user_nm }

// ExcelRowData object structure:
// { influencerAccount, post_url, platform, seeding_product, keyword, title,
//   uploadSchedule, seeding_cost, agency_nm, second_crawling_start_dt, second_crwaling_end_dt,
//   is_fnco_edit, content_summary, error }

export function InfluencerContentForm({ onSubmit, onBulkSubmit, userRole = '관리자', user_nm = '', contents = [] }) {
    const dispatch = useAppDispatch();
    const { formData, excelData, selectedFile, isProcessingExcel, crawlStatus, isDone, crawledData, seedingContents } =
        useAppSelector((state) => state.crawl);
    const userState = useAppSelector((state) => state.user);
    const t = useTranslation();
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');
    const campaignNameOptions = useCampaignNameOptions();
    const fileInputRef = useRef(null);
    const videoFileInputRef = useRef(null);
    // const [errors, setErrors] = useState([]);
    const [response, setResponse] = useState(null);
    const [videoType, setVideoType] = useState('released'); // 'released' | 'preview'
    const [previewVideoFile, setPreviewVideoFile] = useState(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    // 시딩 비용 열람 권한 체크 (팀장/관리자만 실제 금액 확인 가능)
    const canViewActualCost = (role) => {
        const adminRoles = ['시스템 관리자', '팀장', '관리자', '마케팅 팀장', '콘텐츠 관리자'];
        return (
            adminRoles.some((adminRole) => role.includes(adminRole)) || role.includes('관리자') || role.includes('팀장')
        );
    };

    const formatCostForDisplay = (cost) => {
        const numericCost = typeof cost === 'string' ? parseFloat(cost) || 0 : cost;

        if (numericCost === 0) return '-';

        // 권한이 있는 사용자는 실제 금액 표시
        if (canViewActualCost(userRole)) {
            return `${numericCost.toLocaleString()}원`;
        }

        // 일반 사용자는 유료/무료만 표시
        return numericCost > 0 ? '유료' : '무료';
    };

    const handleComplete = async (data, insertPara) => {
        // Redux store에 크롤링 데이터 저장
        dispatch(addCrawledData(data));

        dispatch(resetFormData());

        await fetch(`${apiBase}/contents/seeding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ insertPara }),
        });
        await reloadingSeedingContents(dispatch, userState);

        dispatch(setIsDone(false));
        toast.success(t('influencerContentForm.messages.registerSuccess'));

        // Performance 뷰 존재 여부 확인
        try {
            const postId = insertPara.post_id || parseUrl(insertPara.post_url)?.id;
            if (postId) {
                const result = await checkPostExistsInPerformance(postId);
                if (result.exists) {
                    toast.info(t('influencerContentForm.messages.performanceContent'), { duration: 5000 });

                    // 서버에 성과 우수 콘텐츠 감지 로그 전송
                    try {
                        await logPerformanceContentDetection({
                            post_id: postId,
                            post_url: insertPara.post_url,
                            created_at: new Date().toISOString(),
                            user_id: insertPara.user_id || userState.user_id,
                            user_nm: insertPara.user_nm || userState.name,
                        });
                    } catch (logError) {
                        // 로그 저장 실패해도 사용자에게는 알리지 않음
                    }
                }
            }
        } catch (error) {
            // 체크 실패해도 등록은 완료된 상태이므로 에러 토스트는 표시하지 않음
        }
    };

    // Google Drive URL 확인
    const isGoogleDriveUrl = (url) => {
        if (!url) return false;
        return url.includes('drive.google.com');
    };

    // 플랫폼 이름 정규화 (대소문자 무관하게 소문자로 변환)
    const normalizePlatform = (platform) => {
        if (!platform) return null;
        const normalized = platform.trim().toLowerCase();
        const allowedPlatforms = ['instagram', 'youtube', 'tiktok', 'x'];
        return allowedPlatforms.includes(normalized) ? normalized : null;
    };

    // Google Drive URL에서 파일 ID 추출
    const extractGoogleDriveFileId = (url) => {
        try {
            if (!isGoogleDriveUrl(url)) {
                return null; // 구글 드라이브 URL이 아니면 null 반환
            }

            // https://drive.google.com/file/d/FILE_ID/view?usp=sharing 형식
            const match = url.match(/\/file\/d\/([^\/\?]+)/);
            if (match && match[1]) {
                return match[1];
            }

            // https://drive.google.com/open?id=FILE_ID 형식
            const idMatch = url.match(/[?&]id=([^&]+)/);
            if (idMatch && idMatch[1]) {
                return idMatch[1];
            }

            // 구글 드라이브 URL이지만 ID 추출 실패
            return null;
        } catch (error) {
            console.error('Google Drive ID 추출 실패:', error);
            return null;
        }
    };

    // 가편 영상 개별 등록 (동영상 파일 직접 업로드)
    const handlePreviewIndividualSubmit = async () => {
        try {
            // 필수 항목 검증
            if (!previewVideoFile || !formData.seeding_product || !formData.crawling_start_dt || !formData.platform) {
                toast.error(t('influencerContentForm.errors.requiredFields'));
                return;
            }

            setIsUploadingVideo(true);

            // 메타데이터 준비
            const metadata = {
                platform: formData.platform,
                seeding_product: formData.seeding_product,
                keyword: formData.keyword || '',
                seeding_cost: formData.seeding_cost || 0,
                agency_nm: formData.agency_nm || '',
                campaign_name: formData.campaign_name || '',
                is_fnco_edit: formData.is_fnco_edit || false,
                content_summary: formData.content_summary || '',
                scheduled_date: formData.crawling_start_dt || '',
                seeding_cntry: formData.seeding_cntry || 'KR',
                user_id: userState.user_id,
                user_nm: `${userState.name}(${
                    userState.name_eng.charAt(0).toUpperCase() + userState.name_eng.slice(1).toLowerCase()
                })`,
            };

            // ⭐ 순차적 시도: 실패하면 다음 시도 진행
            const uploadAttempt = async (attemptNumber) => {
                const formDataToSend = new FormData();
                formDataToSend.append('video', previewVideoFile);
                formDataToSend.append('metadata', JSON.stringify(metadata));
                formDataToSend.append('attempt', attemptNumber.toString());
                formDataToSend.append('timestamp', Date.now().toString());

                const submitResponse = await fetch(`${apiBase}/contents/preview/individual`, {
                    method: 'POST',
                    body: formDataToSend,
                });

                if (!submitResponse.ok) {
                    const errorData = await submitResponse
                        .json()
                        .catch(() => ({ error: t('influencerContentForm.errors.uploadFailed') }));
                    throw new Error(
                        errorData.error || t('influencerContentForm.errors.previewIndividualRegisterFailed')
                    );
                }

                const result = await submitResponse.json();
                return result;
            };

            let result = null;
            let hasSuccess = false;
            const maxAttempts = 8;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    result = await uploadAttempt(attempt);
                    hasSuccess = true;
                    break; // 성공하면 루프 종료
                } catch (error) {
                    // 마지막 시도가 아니면 다음 시도 진행
                    if (attempt < maxAttempts) {
                        // 다음 시도 전 짧은 대기
                        await new Promise((resolve) => setTimeout(resolve, 500));
                    } else {
                        // 모든 시도 실패
                        throw error;
                    }
                }
            }

            // 성공 처리
            if (hasSuccess && result) {
                // Redux store 업데이트
                dispatch(resetFormData());
                setPreviewVideoFile(null);
                if (videoFileInputRef.current) {
                    videoFileInputRef.current.value = '';
                }

                // Preview 리스트 갱신
                await reloadingPreviewContents(dispatch, userState);

                setIsUploadingVideo(false);
                dispatch(setIsDone(false));
                toast.success(t('influencerContentForm.messages.previewRegisterSuccess'));
            } else {
                throw new Error(t('influencerContentForm.errors.previewIndividualRegisterFailed'));
            }
        } catch (error) {
            setIsUploadingVideo(false);
            dispatch(setIsDone(false));
            toast.error(error.message || t('influencerContentForm.messages.previewRegisterErrorDetail'));
        }
    };

    // 크롤링
    const handleCrawl = async (url, insertPara = {}) => {
        dispatch(setCrawlLoading(true));
        dispatch(setCurrentUrl(url));
        dispatch(clearCrawlError());

        try {
            const res = await fetchWithRetry(`${apiBase}/crawling`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();

            const resultData = contentData(data[0], formData);
            onSubmit(resultData);
            handleComplete(resultData, insertPara);
        } catch (error) {
            dispatch(setCrawlError(error.message || t('influencerContentForm.messages.crawlingError')));
            dispatch(setIsDone(false));
            toast.error(t('influencerContentForm.messages.crawlingError'));
        } finally {
            dispatch(setCrawlLoading(false));
            dispatch(setIsDone(false));
        }
    };

    // 가편 영상 일괄 업로드 (동시 처리 개수 제한 + 타임아웃)
    const handlePreviewBulkSubmit = async () => {
        const validRows = excelData.filter((row) => !row.error);

        if (validRows.length === 0) {
            toast.error(t('influencerContentForm.errors.noValidData'));
            return;
        }

        dispatch(setCrawlLoading(true));

        const MAX_CONCURRENT = 5; // 동시 처리 개수
        const TIMEOUT_MS = 600000; // 10분 타임아웃

        try {
            let completedCount = 0;
            let failedCount = 0;

            // 배치 단위로 처리
            for (let i = 0; i < validRows.length; i += MAX_CONCURRENT) {
                const batch = validRows.slice(i, i + MAX_CONCURRENT);

                const uploadPromises = batch.map(async (row) => {
                    const fileId = extractGoogleDriveFileId(row.post_url);

                    const requestBody = {
                        url: row.post_url,
                        post_id: fileId,
                        post_url: row.post_url,
                        platform: row.platform,
                        seeding_product: row.seeding_product,
                        keyword: row.keyword || '',
                        seeding_cost: row.seeding_cost || 0,
                        agency_nm: row.agency_nm || '',
                        campaign_name: row.campaign_name ?? formData.campaign_name ?? '',
                        is_fnco_edit: row.is_fnco_edit || false,
                        content_summary: row.content_summary || '',
                        scheduled_date: row.scheduled_date || '',
                        seeding_cntry: row.seeding_cntry || 'KR',
                        user_id: userState.user_id,
                        user_nm: `${userState.name}(${
                            userState.name_eng.charAt(0).toUpperCase() + userState.name_eng.slice(1).toLowerCase()
                        })`,
                    };

                    try {
                        // 타임아웃 처리
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

                        const response = await fetch(`${apiBase}/contents/preview/bulk`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestBody),
                            signal: controller.signal,
                        });

                        clearTimeout(timeoutId);

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || t('influencerContentForm.errors.previewRegisterFailed'));
                        }

                        return { success: true, url: row.post_url };
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            return {
                                success: false,
                                url: row.post_url,
                                error: t('influencerContentForm.errors.timeout'),
                            };
                        }
                        return { success: false, url: row.post_url, error: error.message };
                    }
                });

                // 현재 배치 완료 대기
                const results = await Promise.allSettled(uploadPromises);

                // 결과 집계
                results.forEach((result) => {
                    if (result.status === 'fulfilled' && result.value.success) {
                        completedCount++;
                    } else {
                        failedCount++;
                        const errorMsg =
                            result.status === 'fulfilled'
                                ? result.value.error
                                : result.reason?.message ||
                                  t('influencerContentForm.messages.saveFailed', {
                                      url: 'unknown',
                                      error: 'Unknown error',
                                  });
                        const url = result.status === 'fulfilled' ? result.value.url : 'unknown';
                        toast.error(t('influencerContentForm.messages.saveFailed', { url, error: errorMsg }));
                    }
                });

                // 진행률 표시
                const totalProcessed = i + batch.length;
            }

            // Preview 리스트 갱신
            await reloadingPreviewContents(dispatch, userState);

            dispatch(setCrawlLoading(false));

            if (failedCount === 0) {
                toast.success(t('influencerContentForm.messages.bulkRegisterSuccess', { count: completedCount }));
            } else {
                toast.warning(
                    t('influencerContentForm.messages.bulkRegisterPartial', {
                        success: completedCount,
                        failed: failedCount,
                    })
                );
            }
        } catch (error) {
            toast.error(t('influencerContentForm.messages.bulkRegisterError'));
            dispatch(setCrawlLoading(false));
        }
    };

    // 엑셀 데이터에서 URL 추출하여 크롤링 (배치 처리)
    const handleCrawlFromExcel = async () => {
        const urls = excelData.filter((row) => !row.error);

        if (urls.length === 0) {
            toast.error(t('influencerContentForm.errors.noValidUrls'));
            return;
        }

        dispatch(setCrawlLoading(true));
        let completedCount = 0;
        const registeredContents = []; // 등록된 콘텐츠 정보 수집 (post_id, post_url, user_id, user_nm)

        try {
            // 배치 크롤링 요청 (모든 URL을 한 번에!)
            const urlList = urls.map((row) => row.post_url);

            const response = await fetchWithRetry(`${apiBase}/crawling`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: urlList, // 배열로 전송!
                    is_seeding: true,
                }),
            });

            const batchResults = await response.json();

            // 각 결과를 순차적으로 DB에 저장
            for (let i = 0; i < batchResults.length; i++) {
                let insertPara = null;
                try {
                    const crawledData = batchResults[i];
                    const excelRow = urls.find((row) => row.post_url === crawledData.post_url);

                    if (!excelRow) {
                        continue;
                    }

                    // 데이터 병합
                    const resultData = contentData(crawledData, excelRow);

                    onBulkSubmit(resultData);
                    dispatch(addCrawledData(resultData));

                    // DB 저장 (크롤링 결과의 post_id 포함)
                    insertPara = contentData([], excelRow);
                    // 크롤링 결과에서 post_id가 있으면 사용
                    if (crawledData.post_id) {
                        insertPara.post_id = crawledData.post_id;
                    }
                    insertPara.user_id = userState.user_id;
                    insertPara.user_nm = `${userState.name}(${
                        userState.name_eng.charAt(0).toUpperCase() + userState.name_eng.slice(1).toLowerCase()
                    })`;

                    let response;
                    try {
                        response = await fetch(`${apiBase}/contents/seeding`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ insertPara }),
                        });
                    } catch (fetchError) {
                        throw new Error(`${t('influencerContentForm.errors.networkError')}: ${fetchError.message}`);
                    }

                    if (!response.ok) {
                        let errorData;
                        try {
                            errorData = await response.json();
                        } catch (jsonError) {
                            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                        }
                        throw new Error(
                            errorData.error ||
                                errorData.message ||
                                `HTTP ${response.status}: ${t('influencerContentForm.errors.insertFailed')}`
                        );
                    }

                    let result;
                    try {
                        const responseText = await response.text();

                        if (!responseText || responseText.trim() === '') {
                            // 빈 응답인 경우 성공으로 간주
                            result = { message: 'success', status: response.status };
                        } else {
                            try {
                                result = JSON.parse(responseText);
                            } catch (parseError) {
                                // JSON 파싱 실패하지만 status가 201이면 성공으로 간주
                                if (response.status === 201 || response.status === 200) {
                                    result = { message: 'success', rawResponse: responseText.substring(0, 100) };
                                } else {
                                    throw new Error(
                                        `${t('influencerContentForm.errors.responseParseFailed')}: ${
                                            parseError.message
                                        }, 응답: ${responseText.substring(0, 100)}`
                                    );
                                }
                            }
                        }
                    } catch (jsonError) {
                        throw new Error(
                            `${t('influencerContentForm.errors.responseProcessFailed')}: ${jsonError.message}`
                        );
                    }

                    // 콘텐츠 정보 수집 (메일 발송용)
                    const postId = insertPara.post_id || parseUrl(insertPara.post_url)?.id;
                    if (postId) {
                        registeredContents.push({
                            post_id: postId,
                            post_url: insertPara.post_url,
                            user_id: insertPara.user_id,
                            user_nm: insertPara.user_nm,
                        });
                    }

                    completedCount++;

                    // 진행률 표시
                    toast.success(
                        t('influencerContentForm.messages.bulkRegisterSuccess', {
                            count: `${completedCount}/${urls.length}`,
                        }) + `: ${crawledData.post_url}`
                    );
                } catch (error) {
                    toast.error(
                        t('influencerContentForm.messages.saveFailed', {
                            url: batchResults[i]?.post_url || 'unknown',
                            error: error.message,
                        })
                    );
                }
            }

            // 전체 리스트 갱신 (한 번만!)
            await reloadingSeedingContents(dispatch, userState);

            dispatch(setCrawlLoading(false));
            toast.success(
                t('influencerContentForm.messages.bulkRegisterSuccess', { count: `${completedCount}/${urls.length}` })
            );

            // Performance 뷰 일괄 체크 및 메일 발송
            if (registeredContents.length > 0) {
                try {
                    const postIds = registeredContents.map((c) => c.post_id);
                    const performanceResult = await checkMultiplePostsExistInPerformance(postIds);
                    const performanceContents = performanceResult.results.filter((item) => item.exists);

                    if (performanceContents.length > 0) {
                        toast.info(
                            t('influencerContentForm.messages.performanceContents', {
                                count: performanceContents.length,
                            }),
                            {
                                duration: 6000,
                            }
                        );

                        // 성과 우수 콘텐츠에 대해 메일 발송
                        for (const performanceContent of performanceContents) {
                            const contentInfo = registeredContents.find(
                                (c) => c.post_id === performanceContent.post_id
                            );
                            if (contentInfo) {
                                try {
                                    await logPerformanceContentDetection({
                                        post_id: contentInfo.post_id,
                                        post_url: contentInfo.post_url,
                                        created_at: new Date().toISOString(),
                                        user_id: contentInfo.user_id,
                                        user_nm: contentInfo.user_nm,
                                    });
                                } catch (mailError) {
                                    // 메일 실패해도 계속 진행
                                }
                            }
                        }
                    }
                } catch (error) {
                    // 체크 실패해도 등록은 완료된 상태이므로 에러 토스트는 표시하지 않음
                }
            }
        } catch (error) {
            toast.error(t('influencerContentForm.messages.batchCrawlingError'));
            dispatch(setCrawlLoading(false));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // 가편 영상일 때 플랫폼 필수 검증
            if (videoType === 'preview' && !formData.platform) {
                toast.error(t('influencerContentForm.errors.selectPlatform'));
                return;
            }

            // 필수 필드 검증 (릴리즈된 영상만)
            if (videoType === 'released') {
                //  다른 사람이 등록한 경우 예외처리
                const response = await fetch(`${apiBase}/contents/seeding`);
                const data = await response.json();
                setResponse(data);
                if (data.find((content) => content.post_id == parseUrl(formData.post_url)?.id)) {
                    toast.error(t('influencerContentForm.errors.alreadyRegistered'));
                    return;
                }

                if (
                    !formData.post_url ||
                    !formData.seeding_product ||
                    !formData.crawling_start_dt ||
                    !formData.crawling_end_dt
                ) {
                    toast.error(t('influencerContentForm.errors.requiredFieldsReleased'));
                    return;
                }

                if (!parseUrl(formData.post_url)?.platform) {
                    toast.error(t('influencerContentForm.errors.invalidPlatform'));
                    return;
                }

                // 업로드 기간 검증 (시작일과 종료일이 모두 입력되어 있어야 함)
                if (
                    (formData.crawling_start_dt && !formData.crawling_end_dt) ||
                    (!formData.crawling_start_dt && formData.crawling_end_dt)
                ) {
                    toast.error(t('influencerContentForm.errors.bothDatesRequired'));
                    return;
                }

                // 업로드 기간 순서 검증
                if (formData.crawling_start_dt && formData.crawling_end_dt) {
                    const startDate = new Date(formData.crawling_start_dt);
                    const endDate = new Date(formData.crawling_end_dt);
                    if (startDate >= endDate) {
                        toast.error(t('influencerContentForm.errors.endDateAfterStart'));
                        return;
                    }
                }

                // 2차 활용 기간 검증 (시작일과 종료일이 모두 입력되었거나 모두 비어있어야 함)
                if (
                    (formData.second_crawling_start_dt && !formData.second_crwaling_end_dt) ||
                    (!formData.second_crawling_start_dt && formData.second_crwaling_end_dt)
                ) {
                    toast.error(t('influencerContentForm.errors.secondaryBothDates'));
                    return;
                }

                // 2차 활용 기간 순서 검증
                if (formData.second_crawling_start_dt && formData.second_crwaling_end_dt) {
                    const startDate = new Date(formData.second_crawling_start_dt);
                    const endDate = new Date(formData.second_crwaling_end_dt);
                    if (startDate >= endDate) {
                        toast.error(t('influencerContentForm.errors.secondaryEndAfterStart'));
                        return;
                    }
                }

                dispatch(setIsDone(true));
                handleCrawl(formData.post_url, contentData([], formData));
            } else {
                // 가편 영상 개별 등록: 무조건 동영상 파일 업로드 방식
                if (!previewVideoFile) {
                    toast.error(t('influencerContentForm.errors.selectVideoFile'));
                    return;
                }

                if (!formData.platform || !formData.seeding_product || !formData.crawling_start_dt) {
                    toast.error(t('influencerContentForm.errors.requiredFieldsPreview'));
                    return;
                }

                dispatch(setIsDone(true));
                handlePreviewIndividualSubmit();
            }
        } catch (error) {
            console.error(t('influencerContentForm.errors.contentRegisterError'), error);
            toast.error(t('influencerContentForm.messages.bulkRegisterError'));
        }

        // 폼 초기화는 제출 완료 후에 필요시 dispatch(resetFormData()) 호출
    };

    const handleInputChange = (field, value) => {
        dispatch(updateFormData({ field, value }));
    };

    // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    const getTodayString = () => {
        const today = new Date();
        return today.toLocaleDateString();
    };

    // 엑셀 파일 처리 함수
    const handleFileUpload = async (event) => {
        // event가 File 객체인지 확인 (드래그 앤 드롭의 경우)
        const file = event instanceof File ? event : event?.target?.files?.[0];
        if (!file) return;

        // 파일 형식 확인
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];

        if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
            toast.error(t('influencerContentForm.errors.invalidFileType'));
            return;
        }

        dispatch(setSelectedFile(file));
        dispatch(setIsProcessingExcel(true));

        try {
            // CSV 파싱
            const text = await file.text();
            const rows = parseCSV(text);

            if (rows.length === 0) {
                toast.error(t('influencerContentForm.errors.noDataInFile'));
                return;
            }

            // 가편 영상인 경우 서버에서 기존 데이터 가져와서 중복 체크
            let existingPreviewContents = [];
            if (videoType === 'preview') {
                try {
                    const response = await fetch(`${apiBase}/contents/preview`);
                    if (response.ok) {
                        existingPreviewContents = await response.json();
                    }
                } catch (error) {
                    console.error('기존 preview contents 조회 실패:', error);
                }
            }

            const parsedData = validateAndParseExcelData(rows, existingPreviewContents);
            dispatch(setExcelData(parsedData));

            const errorCount = parsedData.filter((row) => row.error).length;
            if (errorCount > 0) {
                toast.warning(
                    t('influencerContentForm.fileUpload.rowsLoadedWithErrors', {
                        total: parsedData.length,
                        error: errorCount,
                    }),
                    { duration: 10000 } // 10초 동안 표시
                );
            } else {
                toast.success(t('influencerContentForm.fileUpload.rowsLoaded', { count: parsedData.length }));
            }
        } catch (error) {
            toast.error(t('influencerContentForm.errors.fileProcessingError'));
        } finally {
            dispatch(setIsProcessingExcel(false));
        }
    };

    // CSV 파싱 함수 (기본적인 구현)
    const parseCSV = (text) => {
        const lines = text.split('\n').filter((line) => line.trim());
        return lines.map((line) => {
            // 간단한 CSV 파싱 (실제로는 더 복잡한 라이브러리 사용 권장)
            const cells = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    cells.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            cells.push(current.trim());
            return cells;
        });
    };

    // 엑셀 데이터 검증 및 파싱
    const validateAndParseExcelData = (rows, existingPreviewContents = []) => {
        if (rows.length < 2) {
            throw new Error(t('influencerContentForm.validation.headerRequired'));
        }

        // 첫 번째 행은 헤더로 간주하고 건너뜀
        const dataRows = rows.slice(1);

        // CSV 파일 내 중복 체크용 (구글 드라이브 post_id 또는 URL)
        const seenUrls = new Set();

        return dataRows.map((row, index) => {
            let data;

            if (videoType === 'preview') {
                // 가편 영상용 파싱 (10개 컬럼)
                // 구글 드라이브 주소, 플랫폼, 시딩 품목, 영상 키워드, 영상 릴리즈 예정일,
                // 시딩 비용, 에이전시명, 자사 편집 여부, 업로드 유저, 업로드 국가

                // 플랫폼 정규화 (대소문자 무관)
                const rawPlatform = row[1] || '';
                const normalizedPlatform = normalizePlatform(rawPlatform);

                data = {
                    post_url: row[0] || '',
                    platform: normalizedPlatform || rawPlatform, // 정규화된 값 또는 원본 (검증에서 에러 처리)
                    seeding_product: row[2] || '',
                    keyword: row[3] || '',
                    scheduled_date: row[4] || '', // 예상 업로드 일정
                    seeding_cost: row[5] || '0',
                    agency_nm: row[6] || '',
                    is_fnco_edit: row[7] || 'false',
                    seeding_cntry: row[8] || 'KR',
                    campaign_name: row[9] || '', // 캠페인명 (선택)
                };

                // 가편 영상 검증
                const errors = [];

                // 1. 구글 드라이브 주소 확인
                if (!data.post_url) {
                    errors.push(t('influencerContentForm.validation.googleDriveAddress'));
                } else if (!isGoogleDriveUrl(data.post_url)) {
                    errors.push(t('influencerContentForm.validation.googleDriveAddressInvalid'));
                } else {
                    // 구글 드라이브 URL 형식 확인 및 파일 ID 추출
                    const fileId = extractGoogleDriveFileId(data.post_url);
                    if (!fileId) {
                        errors.push(t('influencerContentForm.validation.googleDriveAddressFormatError'));
                    } else {
                        // CSV 파일 내 중복 체크
                        if (seenUrls.has(fileId)) {
                            errors.push(t('influencerContentForm.validation.googleDriveAddressDuplicate'));
                        } else {
                            seenUrls.add(fileId);

                            // 서버에 이미 등록된 것과 중복 체크
                            if (existingPreviewContents.find((content) => content.post_id === fileId)) {
                                errors.push(t('influencerContentForm.validation.googleDriveAddressAlreadyRegistered'));
                            }
                        }
                    }
                }

                // 2. 플랫폼 확인
                if (!rawPlatform || !rawPlatform.trim()) {
                    errors.push(t('influencerContentForm.validation.platform'));
                } else if (!normalizedPlatform) {
                    errors.push(t('influencerContentForm.validation.platformNotSupported', { platform: rawPlatform }));
                }

                // 3. 필수 항목 확인
                if (!data.seeding_product) errors.push(t('influencerContentForm.validation.seedingProduct'));
                if (!data.scheduled_date) errors.push(t('influencerContentForm.validation.scheduledDate'));

                if (errors.length > 0) {
                    data.error = `${t('influencerContentForm.validation.requiredFieldsMissing')}: ${errors.join(', ')}`;
                }
            } else {
                // 릴리즈된 영상용 파싱 (12개 컬럼, 캠페인명 포함)
                data = {
                    post_url: row[0] || '',
                    seeding_product: row[1] || '',
                    keyword: row[2] || '',
                    crawling_start_dt: row[3] || '',
                    crawling_end_dt: row[4] || '',
                    seeding_cost: row[5] || '0',
                    agency_nm: row[6] || '',
                    second_crawling_start_dt: row[7] || '',
                    second_crwaling_end_dt: row[8] || '',
                    is_fnco_edit: row[9] || 'false',
                    seeding_cntry: row[10] || 'KR',
                    campaign_name: row[11] || '',
                };

                // 릴리즈된 영상 검증
                const errors = [];

                // 1. URL 확인 및 플랫폼 검증
                if (!data.post_url) {
                    errors.push(t('influencerContentForm.validation.contentUrl'));
                } else {
                    const parsedUrl = parseUrl(data.post_url);
                    const allowedPlatforms = ['instagram', 'youtube', 'tiktok', 'x'];

                    if (!parsedUrl || !parsedUrl.platform) {
                        errors.push(t('influencerContentForm.validation.contentUrlUnsupportedPlatform'));
                    } else if (!allowedPlatforms.includes(parsedUrl.platform.toLowerCase())) {
                        errors.push(
                            t('influencerContentForm.validation.contentUrlPlatformNotSupported', {
                                platform: parsedUrl.platform,
                            })
                        );
                    } else if (!!seedingContents.find((content) => content.post_id == parsedUrl.id)) {
                        errors.push(t('influencerContentForm.validation.contentUrlAlreadyRegistered'));
                    }
                }

                // 2. 필수 항목 확인
                if (!data.seeding_product) errors.push(t('influencerContentForm.validation.seedingProduct'));
                if (!data.crawling_start_dt) errors.push(t('influencerContentForm.validation.collectionStartDate'));
                if (!data.crawling_end_dt) errors.push(t('influencerContentForm.validation.collectionEndDate'));

                if (errors.length > 0) {
                    data.error = `${t('influencerContentForm.validation.requiredFieldsMissing')}: ${errors.join(', ')}`;
                }
            }

            return data;
        });
    };

    // 일괄 등록
    // 샘플 파일 다운로드
    const downloadSampleFile = () => {
        // 헤더 행
        const headerRow =
            videoType === 'preview'
                ? [
                      t('influencerContentForm.csvHeaders.preview.googleDriveAddress'),
                      t('influencerContentForm.csvHeaders.preview.platform'),
                      t('influencerContentForm.csvHeaders.preview.seedingProduct'),
                      t('influencerContentForm.csvHeaders.preview.keyword'),
                      t('influencerContentForm.csvHeaders.preview.scheduledDate'),
                      t('influencerContentForm.csvHeaders.preview.seedingCost'),
                      t('influencerContentForm.csvHeaders.preview.agencyName'),
                      t('influencerContentForm.csvHeaders.preview.isFncoEdit'),
                      t('influencerContentForm.csvHeaders.preview.uploadCountry'),
                      t('influencerContentForm.csvHeaders.preview.campaignName'),
                  ]
                : [
                      t('influencerContentForm.csvHeaders.released.contentUrl'),
                      t('influencerContentForm.csvHeaders.released.seedingProduct'),
                      t('influencerContentForm.csvHeaders.released.keyword'),
                      t('influencerContentForm.csvHeaders.released.collectionStartDate'),
                      t('influencerContentForm.csvHeaders.released.collectionEndDate'),
                      t('influencerContentForm.csvHeaders.released.seedingCost'),
                      t('influencerContentForm.csvHeaders.released.agencyName'),
                      t('influencerContentForm.csvHeaders.released.secondaryStartDate'),
                      t('influencerContentForm.csvHeaders.released.secondaryEndDate'),
                      t('influencerContentForm.csvHeaders.released.isFncoEdit'),
                      t('influencerContentForm.csvHeaders.released.uploadCountry'),
                      t('influencerContentForm.csvHeaders.released.campaignName'),
                  ];

        // 크롤링된 데이터가 있으면 사용, 없으면 기본 샘플 데이터
        let dataRows = [];

        if (videoType === 'preview') {
            // 가편 영상용 샘플 데이터
            dataRows = [
                [
                    'https://drive.google.com/file/d/1yFE8mVzmP7ZgrD2Kq9D00unVNmSwMkmH/view?usp=sharing',
                    'instagram',
                    '비타민 세럼',
                    '스킨케어,리뷰',
                    '2024-12-30',
                    '100000',
                    '뷰티에이전시',
                    'false',
                    'KR',
                    '', // 캠페인명 (선택)
                ],
                [
                    'https://drive.google.com/file/d/2aBC9nXyzM8PqrT3Ku0D11voVNtXwLnmI/view?usp=sharing',
                    'youtube',
                    '프로틴 파우더',
                    '헬스,리뷰',
                    '2024-12-30',
                    '150000',
                    '뷰티에이전시',
                    'false',
                    'KR',
                    '', // 캠페인명 (선택)
                ],
            ];
        } else {
            // 릴리즈된 영상용 데이터
            if (contents.length > 0) {
                // 이미 등록된 contentData를 템플릿 형식으로 변환
                dataRows = contents.map((contentData) => [
                    contentData.post_url || '',
                    contentData.seeding_product || '',
                    contentData.keyword || '',
                    contentData.crawling_start_dt || '',
                    contentData.crawling_end_dt || '',
                    contentData.seeding_cost?.toString() || '0',
                    contentData.agency_nm || '',
                    contentData.second_crawling_start_dt || '',
                    contentData.second_crwaling_end_dt || '',
                    contentData.is_fnco_edit?.toString() || 'false',
                    contentData.seeding_cntry || 'KR',
                    contentData.campaign_name || '',
                ]);
            } else if (crawledData.length > 0) {
                // 크롤링된 데이터를 템플릿 형식으로 변환
                dataRows = crawledData.map((data) => [
                    '', // 원본 URL은 크롤링 데이터에 없으므로 빈 값
                    '', // 시딩품목 - 사용자가 입력해야 함
                    '', // 키워드 - 사용자가 입력해야 함
                    '', // 업로드일정시작일 - 사용자가 입력
                    '', // 업로드일정종료일 - 사용자가 입력
                    '0', // 시딩비용 - 사용자가 입력
                    '', // 에이전시명 - 사용자가 입력
                    '', // 2차활용시작일 - 사용자가 입력
                    '', // 2차활용종료일 - 사용자가 입력
                    'false', // 자사편집여부 - 기본값
                    'KR', // 업로드 국가 - 기본값
                    '', // 캠페인명 (선택)
                ]);
            } else {
                // 기본 샘플 데이터
                dataRows = [
                    [
                        'https://instagram.com/p/sample',
                        '비타민 세럼',
                        '스킨케어,리뷰',
                        '2024-12-25',
                        '2024-12-30',
                        '100000',
                        '뷰티에이전시',
                        '2024-12-30',
                        '2025-01-30',
                        'false',
                        'KR',
                        '', // 캠페인명 (선택)
                    ],
                    [
                        'https://youtube.com/watch?v=sample',
                        '프로틴 파우더',
                        '헬스,리뷰',
                        '2024-12-26',
                        '2024-12-31',
                        '150000',
                        '',
                        '2025-01-01',
                        '2025-02-01',
                        'true',
                        'KR',
                        '', // 캠페인명 (선택)
                    ],
                ];
            }
        }

        const sampleData = [headerRow, ...dataRows];

        const csvContent = sampleData.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const fileName =
            videoType === 'preview'
                ? t('influencerContentForm.fileNames.previewTemplate')
                : t('influencerContentForm.fileNames.seedingTemplate');
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 에러가 있는 행 제거
    const removeErrorRow = (index) => {
        dispatch(removeExcelRow(index));
    };

    // useEffect(() => {
    //   if (excelData.length > 0) {
    //     const parsedData = validateAndParseExcelData(excelData);
    //     dispatch(setExcelData(parsedData));
    //   }
    // }, [seedingContents]);
    useEffect(() => {
        const userIdValue = `${userState.name}(${
            userState.name_eng.charAt(0).toUpperCase() + userState.name_eng.slice(1).toLowerCase()
        })`;
        handleInputChange('user_nm', userIdValue);
        handleInputChange('user_id', userState.user_id);
    }, [userState.name, userState.name_eng, formData.user_nm]);
    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle>{t('influencerContentForm.title')}</CardTitle>
            </CardHeader>
            <CardContent>
                {/* 영상 종류 선택 - 최상단 배치 */}
                <Tabs
                    value={videoType}
                    onValueChange={(value) => {
                        setVideoType(value);
                        // 탭 변경 시 엑셀 데이터 초기화
                        dispatch(setExcelData([]));
                        dispatch(setSelectedFile(null));
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                    }}
                    className="w-full mb-8"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="released">{t('influencerContentForm.tabs.released')}</TabsTrigger>
                        <TabsTrigger value="preview">{t('influencerContentForm.tabs.preview')}</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* 개별 등록 / 일괄 업로드 탭 */}
                <Tabs defaultValue="individual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="individual">{t('influencerContentForm.tabs.individual')}</TabsTrigger>
                        <TabsTrigger value="bulk">{t('influencerContentForm.tabs.bulk')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="individual" className="space-y-6 mt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {videoType === 'preview' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="preview_video">
                                        {t('influencerContentForm.labels.videoUpload')} *
                                    </Label>
                                    <div
                                        className="border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer"
                                        style={{
                                            borderColor: previewVideoFile ? '#86efac' : undefined,
                                            backgroundColor: previewVideoFile ? '#f0fdf4' : undefined,
                                        }}
                                        onClick={() => !previewVideoFile && videoFileInputRef.current?.click()}
                                    >
                                        <Input
                                            ref={videoFileInputRef}
                                            id="preview_video"
                                            type="file"
                                            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv,.mp4,.mov,.avi,.wmv"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 500 * 1024 * 1024) {
                                                        toast.error(t('influencerContentForm.errors.fileTooLarge'));
                                                        e.target.value = '';
                                                        return;
                                                    }
                                                    setPreviewVideoFile(file);
                                                    toast.success(
                                                        t('influencerContentForm.fileUpload.fileSelected') +
                                                            `: ${file.name}`
                                                    );
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        {previewVideoFile ? (
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <div
                                                    className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3"
                                                    style={{ marginTop: '20px' }}
                                                >
                                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                                </div>
                                                <p className="text-sm font-medium mb-1">
                                                    {t('influencerContentForm.fileUpload.fileSelected')}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 mt-2">
                                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]">
                                                        {previewVideoFile.name}
                                                    </span>
                                                    <span className="text-xs flex-shrink-0">
                                                        ({(previewVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewVideoFile(null);
                                                            if (videoFileInputRef.current) {
                                                                videoFileInputRef.current.value = '';
                                                            }
                                                        }}
                                                        className="text-destructive hover:text-destructive"
                                                        style={{ marginBottom: '20px' }}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        {t('influencerContentForm.buttons.delete')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8">
                                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm font-medium mb-1">
                                                    {t('influencerContentForm.fileUpload.selectFile')}
                                                </p>
                                                <p className="text-xs text-muted-foreground mb-4">
                                                    {t('influencerContentForm.fileUpload.videoSupportedFormats')}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        videoFileInputRef.current?.click();
                                                    }}
                                                >
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    {t('influencerContentForm.buttons.selectFile')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="post_url">{t('influencerContentForm.labels.contentUrl')} *</Label>
                                    <Input
                                        id="post_url"
                                        type="url"
                                        placeholder={t('influencerContentForm.placeholders.contentUrl')}
                                        value={formData.post_url}
                                        onChange={(e) => handleInputChange('post_url', e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="platform">
                                    {t('influencerContentForm.labels.platform')} {videoType === 'preview' && '*'}
                                </Label>
                                {videoType === 'preview' ? (
                                    <>
                                        <Select
                                            value={formData.platform || ''}
                                            onValueChange={(value) => handleInputChange('platform', value)}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={t('influencerContentForm.placeholders.selectPlatform')}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                <SelectItem value="tiktok">TikTok</SelectItem>
                                                <SelectItem value="youtube">YouTube</SelectItem>
                                                <SelectItem value="x">X</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            {t('influencerContentForm.hints.platformSelect')}
                                        </p>
                                    </>
                                ) : (
                                    <Input
                                        id="platform"
                                        type="text"
                                        readOnly
                                        placeholder={t('influencerContentForm.placeholders.platformAuto')}
                                        value={
                                            parseUrl(formData.post_url)?.platform.replace(/^\w/, (c) =>
                                                c.toUpperCase()
                                            ) || ''
                                        }
                                        required
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user_nm">{t('influencerContentForm.labels.userName')}</Label>
                                <Input
                                    id="user_nm"
                                    type="text"
                                    placeholder={t('influencerContentForm.placeholders.userName')}
                                    value={formData.user_nm}
                                    // onChange={(e) => handleInputChange('user_nm', e.target.value)}
                                    readOnly
                                    style={{ backgroundColor: '#f3f4f6' }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="seeding_cntry">
                                    {t('influencerContentForm.labels.seedingCountry')}
                                </Label>
                                <CountrySelect
                                    value={formData.seeding_cntry || 'KR'}
                                    onChange={(value) => handleInputChange('seeding_cntry', value)}
                                    placeholder={t('influencerContentForm.placeholders.selectCountry')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="seeding_product">
                                    {t('influencerContentForm.labels.seedingProduct')} *
                                </Label>
                                <Input
                                    id="seeding_product"
                                    type="text"
                                    placeholder={t('influencerContentForm.placeholders.productName')}
                                    value={formData.seeding_product}
                                    onChange={(e) => handleInputChange('seeding_product', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="keyword">{t('influencerContentForm.labels.keyword')}</Label>
                                <Input
                                    id="keyword"
                                    type="text"
                                    placeholder={t('influencerContentForm.placeholders.keyword')}
                                    value={formData.keyword}
                                    onChange={(e) => handleInputChange('keyword', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="uploadSchedule">
                                    {videoType === 'preview'
                                        ? t('influencerContentForm.labels.uploadSchedule')
                                        : t('influencerContentForm.labels.collectionSchedule') + ' *'}
                                </Label>
                                {videoType === 'preview' ? (
                                    <Input
                                        id="crawling_start_dt"
                                        type="date"
                                        value={formData.crawling_start_dt}
                                        onChange={(e) => handleInputChange('crawling_start_dt', e.target.value)}
                                    />
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="crawling_start_dt">
                                                {t('influencerContentForm.labels.startDate')}
                                            </Label>
                                            <Input
                                                id="crawling_start_dt"
                                                type="date"
                                                // min={getTodayString()}
                                                value={formData.crawling_start_dt}
                                                readOnly={videoType === 'released'}
                                                onChange={(e) => handleInputChange('crawling_start_dt', e.target.value)}
                                                required={videoType === 'released'}
                                                style={{
                                                    backgroundColor: videoType === 'released' ? '#f3f4f6' : 'white',
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="crawling_end_dt">
                                                {t('influencerContentForm.labels.endDate')}
                                            </Label>
                                            <Input
                                                id="crawling_end_dt"
                                                type="date"
                                                min={getTodayString()}
                                                value={formData.crawling_end_dt}
                                                onChange={(e) => handleInputChange('crawling_end_dt', e.target.value)}
                                                required={videoType === 'released'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="seeding_cost">{t('influencerContentForm.labels.seedingCost')}</Label>
                                <Input
                                    id="seeding_cost"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder={t('influencerContentForm.placeholders.seedingCost')}
                                    value={formData.seeding_cost}
                                    onChange={(e) => handleInputChange('seeding_cost', e.target.value)}
                                />
                                {!canViewActualCost(userRole) && (
                                    <p className="text-xs text-muted-foreground">
                                        {t('influencerContentForm.hints.costDisplay')}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="agency_nm">{t('influencerContentForm.labels.agencyName')}</Label>
                                <Input
                                    id="agency_nm"
                                    type="text"
                                    placeholder={t('influencerContentForm.placeholders.agencyName')}
                                    value={formData.agency_nm}
                                    onChange={(e) => handleInputChange('agency_nm', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('influencerContentForm.hints.agencyInfo')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="campaign_name">{t('influencerContentForm.labels.campaignName')}</Label>
                                <Input
                                    id="campaign_name"
                                    type="text"
                                    list="campaign-name-datalist-influencer"
                                    placeholder={t('influencerContentForm.placeholders.campaignName')}
                                    value={formData.campaign_name}
                                    onChange={(e) => handleInputChange('campaign_name', e.target.value)}
                                />
                                <datalist id="campaign-name-datalist-influencer">
                                    {campaignNameOptions.map((name) => (
                                        <option key={name} value={name} />
                                    ))}
                                </datalist>
                            </div>

                            {videoType === 'released' && (
                                <div className="space-y-4">
                                    <Label>{t('influencerContentForm.labels.secondaryUsagePeriod')}</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="second_crawling_start_dt">
                                                {t('influencerContentForm.labels.startDate')}
                                            </Label>
                                            <Input
                                                id="second_crawling_start_dt"
                                                type="date"
                                                min={getTodayString()}
                                                value={formData.second_crawling_start_dt}
                                                onChange={(e) =>
                                                    handleInputChange('second_crawling_start_dt', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="second_crwaling_end_dt">
                                                {t('influencerContentForm.labels.endDate')}
                                            </Label>
                                            <Input
                                                id="second_crwaling_end_dt"
                                                type="date"
                                                min={formData.second_crawling_start_dt || getTodayString()}
                                                value={formData.second_crwaling_end_dt}
                                                onChange={(e) =>
                                                    handleInputChange('second_crwaling_end_dt', e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-3">
                                <Switch
                                    id="is_fnco_edit"
                                    checked={formData.is_fnco_edit}
                                    onCheckedChange={(checked) => handleInputChange('is_fnco_edit', checked)}
                                />
                                <Label htmlFor="is_fnco_edit">{t('influencerContentForm.labels.isFncoEdit')}</Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content_summary">
                                    {t('influencerContentForm.labels.contentSummary')}
                                </Label>
                                <Textarea
                                    id="content_summary"
                                    placeholder={t('influencerContentForm.placeholders.contentSummary')}
                                    value={formData.content_summary}
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
                                    <p style={{ color: '#fff' }}> {t('influencerContentForm.buttons.registering')} </p>
                                </div>
                            ) : (
                                <Button type="submit" className="w-full">
                                    {t('influencerContentForm.buttons.register')}
                                </Button>
                            )}
                        </form>
                    </TabsContent>

                    <TabsContent value="bulk" className="space-y-6 mt-6">
                        {/* 파일 업로드 섹션 */}
                        <div className="space-y-4">
                            <div>
                                <h3>{t('influencerContentForm.fileUpload.title')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('influencerContentForm.fileUpload.description')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 " style={{ justifyContent: 'flex-end' }}>
                                {videoType === 'preview' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            window.open(
                                                'https://drive.google.com/drive/u/2/folders/150cDykhln_PRvR9_6ARh2P8HUZpzCJPp',
                                                '_blank'
                                            )
                                        }
                                        className="flex items-center gap-2"
                                    >
                                        {t('influencerContentForm.buttons.goToGoogleDrive')}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={downloadSampleFile}
                                    className="flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    {t('influencerContentForm.buttons.downloadTemplate')}
                                </Button>
                            </div>

                            <div
                                className="border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer"
                                style={{
                                    borderColor: selectedFile ? '#86efac' : undefined,
                                    backgroundColor: selectedFile ? '#f0fdf4' : undefined,
                                }}
                                onClick={() => !selectedFile && fileInputRef.current?.click()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isProcessingExcel) return;

                                    const file = e.dataTransfer.files[0];
                                    if (file) {
                                        handleFileUpload(file);
                                    }
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileUpload}
                                    disabled={isProcessingExcel}
                                    className="hidden"
                                />
                                {selectedFile ? (
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <div
                                            className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3"
                                            style={{ marginTop: '20px' }}
                                        >
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <p className="text-sm font-medium mb-1">
                                            {t('influencerContentForm.fileUpload.fileSelected')}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 mt-2">
                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    dispatch(setSelectedFile(null));
                                                    dispatch(setExcelData([]));
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="text-destructive hover:text-destructive"
                                                style={{ marginBottom: '20px' }}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                {t('influencerContentForm.buttons.removeFile')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium mb-1">
                                            {t('influencerContentForm.fileUpload.selectFile')}
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            {t('influencerContentForm.fileUpload.supportedFormats')}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                            disabled={isProcessingExcel}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            {t('influencerContentForm.buttons.selectFile')}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {isProcessingExcel && (
                                <Alert>
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription>
                                        {t('influencerContentForm.fileUpload.processing')}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* 데이터 미리보기 */}
                        {excelData.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3>{t('influencerContentForm.fileUpload.previewTitle')}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {t('influencerContentForm.fileUpload.previewDescription', {
                                                total: excelData.length,
                                                valid: excelData.filter((row) => !row.error).length,
                                                error: excelData.filter((row) => row.error).length,
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                dispatch(setExcelData([]));
                                                dispatch(setSelectedFile(null));
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {t('influencerContentForm.buttons.reset')}
                                        </Button>

                                        {/* 크롤링/등록 버튼 */}
                                        <Button
                                            onClick={
                                                videoType === 'preview' ? handlePreviewBulkSubmit : handleCrawlFromExcel
                                            }
                                            disabled={
                                                excelData.filter((row) => !row.error).length === 0 ||
                                                crawlStatus.isLoading
                                            }
                                            className="flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {crawlStatus.isLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    {videoType === 'preview'
                                                        ? t('influencerContentForm.buttons.registeringBulk')
                                                        : t('influencerContentForm.buttons.crawling')}
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 cursor-pointer" />
                                                    {t('influencerContentForm.buttons.bulkRegister')} (
                                                    {excelData.filter((row) => !row.error).length})
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <div className="max-h-96 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[40px]">
                                                        {t('influencerContentForm.table.status')}
                                                    </TableHead>
                                                    <TableHead>{t('influencerContentForm.table.contentUrl')}</TableHead>
                                                    <TableHead>
                                                        {t('influencerContentForm.table.seedingProduct')}
                                                    </TableHead>
                                                    <TableHead>{t('influencerContentForm.table.keyword')}</TableHead>
                                                    {videoType === 'preview' ? (
                                                        <TableHead>
                                                            {t('influencerContentForm.table.scheduledDate')}
                                                        </TableHead>
                                                    ) : (
                                                        <>
                                                            <TableHead>
                                                                {t('influencerContentForm.table.collectionStartDate')}
                                                            </TableHead>
                                                            <TableHead>
                                                                {t('influencerContentForm.table.collectionEndDate')}
                                                            </TableHead>
                                                        </>
                                                    )}
                                                    <TableHead>{t('influencerContentForm.table.cost')}</TableHead>
                                                    <TableHead>{t('influencerContentForm.table.agencyName')}</TableHead>
                                                    {videoType === 'released' && (
                                                        <>
                                                            <TableHead>
                                                                {t('influencerContentForm.table.secondaryStartDate')}
                                                            </TableHead>
                                                            <TableHead>
                                                                {t('influencerContentForm.table.secondaryEndDate')}
                                                            </TableHead>
                                                        </>
                                                    )}
                                                    <TableHead>{t('influencerContentForm.table.isFncoEdit')}</TableHead>
                                                    <TableHead>{t('influencerContentForm.table.uploadUser')}</TableHead>
                                                    <TableHead>
                                                        {t('influencerContentForm.table.uploadCountry')}
                                                    </TableHead>
                                                    <TableHead className="w-[60px]">
                                                        {t('influencerContentForm.table.action')}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {excelData.map((row, index) => (
                                                    <TableRow
                                                        key={index}
                                                        className={row.error ? 'bg-destructive/10' : ''}
                                                    >
                                                        <TableCell>
                                                            {row.error ? (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    {t('influencerContentForm.table.error')}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {t('influencerContentForm.table.normal')}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="max-w-[150px] truncate">
                                                            {row.post_url}
                                                        </TableCell>
                                                        <TableCell className="max-w-[150px] truncate">
                                                            {row.seeding_product}
                                                        </TableCell>
                                                        <TableCell className="max-w-[150px] truncate">
                                                            {row.keyword}
                                                        </TableCell>
                                                        {videoType === 'preview' ? (
                                                            <TableCell>
                                                                {row.scheduled_date
                                                                    ? formatDate(row.scheduled_date, currentLanguage)
                                                                    : ''}
                                                            </TableCell>
                                                        ) : (
                                                            <>
                                                                <TableCell>
                                                                    {row.crawling_start_dt
                                                                        ? formatDate(
                                                                              row.crawling_start_dt,
                                                                              currentLanguage
                                                                          )
                                                                        : ''}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {row.crawling_end_dt
                                                                        ? formatDate(
                                                                              row.crawling_end_dt,
                                                                              currentLanguage
                                                                          )
                                                                        : ''}
                                                                </TableCell>
                                                            </>
                                                        )}
                                                        <TableCell>{formatCostForDisplay(row.seeding_cost)}</TableCell>
                                                        <TableCell>{row.agency_nm}</TableCell>
                                                        {videoType === 'released' && (
                                                            <>
                                                                <TableCell>
                                                                    {row.second_crawling_start_dt
                                                                        ? formatDate(
                                                                              row.second_crawling_start_dt,
                                                                              currentLanguage
                                                                          )
                                                                        : ''}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {row.second_crwaling_end_dt
                                                                        ? formatDate(
                                                                              row.second_crwaling_end_dt,
                                                                              currentLanguage
                                                                          )
                                                                        : ''}
                                                                </TableCell>
                                                            </>
                                                        )}
                                                        <TableCell>{row.is_fnco_edit}</TableCell>
                                                        <TableCell>{row.user_nm}</TableCell>
                                                        <TableCell>{row.seeding_cntry}</TableCell>
                                                        <TableCell>
                                                            {row.error && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeErrorRow(index)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {excelData.some((row) => row.error) && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="w-4 h-4" />
                                        <AlertDescription>
                                            {t('influencerContentForm.fileUpload.errorRows')}
                                            <br />
                                            {t('influencerContentForm.fileUpload.errorRowsDetail')}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
