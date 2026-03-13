import { useState, useEffect, useMemo } from 'react';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle, BarChart3, AlertTriangle } from 'lucide-react';
import { DeepAnalysis } from './product-analysis/DeepAnalysis.jsx';
import { BestPlansList } from './product-analysis/BestPlansList.jsx';
import { ContentFormatStrategy } from './product-analysis/ContentFormatStrategy.jsx';
import { TrendingContentTop3 } from './product-analysis/TrendingContentTop3.jsx';
import { Toast } from './modify/Toast.jsx';
import { CurrentStepCard } from './CurrentStepCard.jsx';
import { StepProgressBar } from './StepProgressBar.jsx';
import { Dialog, DialogContent } from '../ui/dialog.jsx';
import { useTranslation } from '../../hooks/useTranslation.js';

export function ProductAnalysis({
    navigateToPage,
    onParsingComplete,
    parsedData,
    completionStatus,
    user,
    onLogout,
    onBack,
    pendingUploadData,
    onSetPendingUploadData,
}) {
    const [isLoading, setIsLoading] = useState(!parsedData);
    const [data, setData] = useState(() => {
        if (parsedData) return parsedData;
        // localStorage에서 plan_doc_id 가져오기 (이어서 작업하기 경로)
        const savedPlanDocId = localStorage.getItem('current_plan_doc_id');
        return savedPlanDocId ? { plan_doc_id: savedPlanDocId } : {};
    });
    const [uploadError, setUploadError] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisDataCn, setAnalysisDataCn] = useState(null);
    const [analysisDataEng, setAnalysisDataEng] = useState(null);
    const [reelsPlans, setReelsPlans] = useState([]);
    const [reelsPlansCn, setReelsPlansCn] = useState([]);
    const [reelsPlansEng, setReelsPlansEng] = useState([]);
    const [contentFormatStrategy, setContentFormatStrategy] = useState(null);
    const [contentFormatStrategyCn, setContentFormatStrategyCn] = useState(null);
    const [contentFormatStrategyEng, setContentFormatStrategyEng] = useState(null);
    const [topContents, setTopContents] = useState({ youtube: [], tiktok: [], instagram: [] });
    const [uploadDate, setUploadDate] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });
    const [category, setCategory] = useState(null);
    const [isSaved, setIsSaved] = useState(false); // 저장 완료 여부
    const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false); // 저장 확인 다이얼로그
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    const t = useTranslation();

    // 토스트 표시 함수
    const showToast = (message, type = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    // 토스트 닫기 함수
    const hideToast = () => {
        setToast((prev) => ({ ...prev, isVisible: false }));
    };

    // AI 제품 분석 & 기획안 저장하기
    const handleSaveProductAnalysis = async () => {
        try {
            const planDocId = data?.plan_doc_id || localStorage.getItem('current_plan_doc_id');

            if (!planDocId) {
                showToast(t('aiPlan.productAnalysis.productAnalysisPage.planIdNotFound'), 'error');
                return;
            }

            const response = await fetch(`${apiBase}/ai-plan/update-product-analyzed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plan_doc_id: planDocId }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showToast(t('aiPlan.productAnalysis.productAnalysisPage.savedSuccessfully'), 'success');
                setIsSaved(true);
                // localStorage에 저장 상태 기록
                localStorage.setItem(`product_analysis_saved_${planDocId}`, 'true');
            } else {
                showToast(result.error || t('aiPlan.productAnalysis.productAnalysisPage.saveFailed'), 'error');
            }
        } catch (error) {
            console.error('[AI 제품 분석 저장 오류]', error);
            showToast(t('aiPlan.productAnalysis.productAnalysisPage.saveError'), 'error');
        }
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            alert(t('aiPlan.productAnalysis.productAnalysisPage.logoutMessage'));
        }
    };

    // 다음 버튼 클릭 핸들러
    const handleNextClick = () => {
        if (isSaved) {
            // 이미 저장된 경우 바로 이동
            navigateToPage('InfluencerAnalysis');
        } else {
            // 저장하지 않은 경우 확인 다이얼로그 표시
            setShowSaveConfirmDialog(true);
        }
    };

    // 저장하지 않고 계속 진행
    const handleProceedWithoutSave = () => {
        setShowSaveConfirmDialog(false);
        navigateToPage('InfluencerAnalysis');
    };

    // plan_doc_id 변경 시 저장 상태 확인
    useEffect(() => {
        const currentPlanDocId = data?.plan_doc_id || localStorage.getItem('current_plan_doc_id');
        if (currentPlanDocId) {
            const savedStatus = localStorage.getItem(`product_analysis_saved_${currentPlanDocId}`);
            setIsSaved(savedStatus === 'true');
        } else {
            setIsSaved(false);
        }
    }, [data?.plan_doc_id]);

    // 컴포넌트 마운트 시 API 호출
    useEffect(() => {
        // localStorage에서 category 복원
        const savedCategory = localStorage.getItem('current_plan_category');
        if (savedCategory && !category) {
            setCategory(savedCategory);
        }

        // localStorage에서 plan_doc_id 복원 (이어서 작업하기 경로)
        const savedPlanDocId = localStorage.getItem('current_plan_doc_id');

        // parsedData가 없지만 localStorage에 plan_doc_id가 있는 경우
        if (!parsedData && savedPlanDocId && !analysisData) {
            // localStorage에서 저장 상태 확인 (이어서 작업하기 경로)
            const savedStatus = localStorage.getItem(`product_analysis_saved_${savedPlanDocId}`);
            if (savedStatus === 'true') {
                setIsSaved(true);
            } else {
                setIsSaved(false);
            }
            setIsLoading(false);

            const fetchAnalysisData = async () => {
                try {
                    const analysisResponse = await fetch(`${apiBase}/ai-plan/analysis?plan_doc_id=${savedPlanDocId}`);
                    if (analysisResponse.ok) {
                        const analysisResult = await analysisResponse.json();
                        if (analysisResult.success && analysisResult.data) {
                            // product_name 업데이트
                            if (analysisResult.data.product_name) {
                                setData((prev) => ({
                                    ...prev,
                                    productName: analysisResult.data.product_name,
                                    plan_doc_id: savedPlanDocId,
                                }));
                            }
                            if (analysisResult.data.ai_product_insight_analysis) {
                                setAnalysisData(analysisResult.data.ai_product_insight_analysis);
                            }
                            if (analysisResult.data.ai_product_insight_analysis_cn) {
                                setAnalysisDataCn(analysisResult.data.ai_product_insight_analysis_cn);
                            }
                            if (analysisResult.data.ai_product_insight_analysis_eng) {
                                setAnalysisDataEng(analysisResult.data.ai_product_insight_analysis_eng);
                            }
                            if (analysisResult.data.ai_top10_reels_plan) {
                                const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan)
                                    ? analysisResult.data.ai_top10_reels_plan
                                    : [];
                                setReelsPlans(plans);
                            }
                            if (analysisResult.data.ai_top10_reels_plan_cn) {
                                const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan_cn)
                                    ? analysisResult.data.ai_top10_reels_plan_cn
                                    : [];
                                setReelsPlansCn(plans);
                            }
                            if (analysisResult.data.ai_top10_reels_plan_eng) {
                                const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan_eng)
                                    ? analysisResult.data.ai_top10_reels_plan_eng
                                    : [];
                                setReelsPlansEng(plans);
                            }
                            if (analysisResult.data.ai_content_format_strategy) {
                                setContentFormatStrategy(analysisResult.data.ai_content_format_strategy);
                            }
                            if (analysisResult.data.ai_content_format_strategy_cn) {
                                setContentFormatStrategyCn(analysisResult.data.ai_content_format_strategy_cn);
                            }
                            if (analysisResult.data.ai_content_format_strategy_eng) {
                                setContentFormatStrategyEng(analysisResult.data.ai_content_format_strategy_eng);
                            }

                            // TOP 콘텐츠 조회
                            if (savedPlanDocId) {
                                const platforms = ['youtube', 'tiktok', 'instagram'];
                                const topContentPromises = platforms.map(async (platform) => {
                                    try {
                                        const url = `${apiBase}/ai-plan/top-content?plan_doc_id=${savedPlanDocId}&platform=${platform}`;
                                        const topContentResponse = await fetch(url);

                                        if (topContentResponse.ok) {
                                            const topContentResult = await topContentResponse.json();
                                            if (topContentResult.success) {
                                                return { platform, data: topContentResult.data || [] };
                                            }
                                        }
                                    } catch (error) {
                                        console.error(`TOP 콘텐츠 조회 실패 (${platform}):`, error);
                                    }
                                    return { platform, data: [] };
                                });

                                const results = await Promise.all(topContentPromises);
                                const topContentsMap = results.reduce((acc, { platform, data }) => {
                                    acc[platform] = data;
                                    return acc;
                                }, {});

                                setTopContents(topContentsMap);
                            }
                        }
                    }
                } catch (error) {
                    console.error('[ProductAnalysis] API 호출 오류:', error);
                }
            };
            fetchAnalysisData();
            return;
        }

        // 이미 파싱된 데이터가 있으면 파일 업로드는 하지 않지만, 분석 데이터는 조회
        if (parsedData) {
            setIsLoading(false);
            // parsedData에서 plan_doc_id 추출하여 분석 데이터 조회
            const planDocId = parsedData?.plan_doc_id;
            if (planDocId && !analysisData) {
                // 새로운 분석 시작: 저장 상태 초기화
                setIsSaved(false);
                // 기존 plan_doc_id 명시적으로 삭제 (캐시 방지)
                const oldPlanDocId = localStorage.getItem('current_plan_doc_id');
                if (oldPlanDocId && oldPlanDocId !== planDocId) {
                    localStorage.removeItem(`product_analysis_saved_${oldPlanDocId}`);
                }
                localStorage.removeItem('current_plan_doc_id');
                // 새로운 plan_doc_id 저장
                localStorage.setItem('current_plan_doc_id', planDocId);
                // 새로운 plan_doc_id의 저장 상태도 제거
                localStorage.removeItem(`product_analysis_saved_${planDocId}`);
                // 분석 데이터 조회
                const fetchAnalysisData = async () => {
                    try {
                        const analysisResponse = await fetch(`${apiBase}/ai-plan/analysis?plan_doc_id=${planDocId}`);
                        if (analysisResponse.ok) {
                            const analysisResult = await analysisResponse.json();
                            if (analysisResult.success && analysisResult.data) {
                                // product_name 업데이트
                                if (analysisResult.data.product_name) {
                                    setData((prev) => ({
                                        ...prev,
                                        productName: analysisResult.data.product_name,
                                    }));
                                }
                                if (analysisResult.data.ai_product_insight_analysis) {
                                    setAnalysisData(analysisResult.data.ai_product_insight_analysis);
                                }
                                if (analysisResult.data.ai_product_insight_analysis_cn) {
                                    setAnalysisDataCn(analysisResult.data.ai_product_insight_analysis_cn);
                                }
                                if (analysisResult.data.ai_product_insight_analysis_eng) {
                                    setAnalysisDataEng(analysisResult.data.ai_product_insight_analysis_eng);
                                }
                                if (analysisResult.data.ai_top10_reels_plan) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan)
                                        ? analysisResult.data.ai_top10_reels_plan
                                        : [];
                                    setReelsPlans(plans);
                                }
                                if (analysisResult.data.ai_top10_reels_plan_cn) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan_cn)
                                        ? analysisResult.data.ai_top10_reels_plan_cn
                                        : [];
                                    setReelsPlansCn(plans);
                                }
                                if (analysisResult.data.ai_top10_reels_plan_eng) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan_eng)
                                        ? analysisResult.data.ai_top10_reels_plan_eng
                                        : [];
                                    setReelsPlansEng(plans);
                                }
                                if (analysisResult.data.ai_content_format_strategy) {
                                    setContentFormatStrategy(analysisResult.data.ai_content_format_strategy);
                                }
                                if (analysisResult.data.ai_content_format_strategy_cn) {
                                    setContentFormatStrategyCn(analysisResult.data.ai_content_format_strategy_cn);
                                }
                                if (analysisResult.data.ai_content_format_strategy_eng) {
                                    setContentFormatStrategyEng(analysisResult.data.ai_content_format_strategy_eng);
                                }

                                // TOP 콘텐츠 조회 (plan_doc_id 사용 - 서버에서 subcategory 조회)
                                if (planDocId) {
                                    const platforms = ['youtube', 'tiktok', 'instagram'];
                                    const topContentPromises = platforms.map(async (platform) => {
                                        try {
                                            const url = `${apiBase}/ai-plan/top-content?plan_doc_id=${planDocId}&platform=${platform}`;
                                            const topContentResponse = await fetch(url);

                                            if (topContentResponse.ok) {
                                                const topContentResult = await topContentResponse.json();
                                                if (topContentResult.success) {
                                                    return { platform, data: topContentResult.data || [] };
                                                }
                                            }
                                        } catch (error) {
                                            // 에러 발생 시 빈 배열 반환
                                        }
                                        return { platform, data: [] };
                                    });

                                    const topContentResults = await Promise.all(topContentPromises);
                                    const topContentsMap = {};
                                    topContentResults.forEach(({ platform, data }) => {
                                        // platform을 소문자로 정규화하여 저장
                                        const normalizedPlatform = platform.toLowerCase();
                                        topContentsMap[normalizedPlatform] = data;
                                    });
                                    setTopContents(topContentsMap);
                                }
                            }
                        }
                    } catch (error) {
                        // 에러 처리 (필요 시 사용자에게 알림)
                    }
                };
                fetchAnalysisData();
            }
            return;
        }

        // pendingUploadData가 없으면 에러
        if (!pendingUploadData) {
            setIsLoading(false);
            setUploadError(t('aiPlan.productAnalysis.productAnalysisPage.errorUploadDataNotFound'));
            return;
        }

        // pendingUploadData에 parsedData가 포함되어 있으면 (이미 업로드 완료)
        if (pendingUploadData.parsedData) {
            setIsLoading(false);
            const parsedData = pendingUploadData.parsedData;
            setData(parsedData);
            // category 정보 저장
            if (pendingUploadData.category) {
                setCategory(pendingUploadData.category);
                localStorage.setItem('current_plan_category', pendingUploadData.category);
            }

            // plan_doc_id로 분석 데이터 조회
            const planDocId = parsedData?.plan_doc_id;

            // 기존 plan_doc_id 명시적으로 삭제 후 새로운 것 저장 (캐시 방지)
            if (planDocId) {
                const oldPlanDocId = localStorage.getItem('current_plan_doc_id');
                if (oldPlanDocId && oldPlanDocId !== planDocId) {
                    localStorage.removeItem(`product_analysis_saved_${oldPlanDocId}`);
                }
                localStorage.removeItem('current_plan_doc_id');
                localStorage.setItem('current_plan_doc_id', planDocId);
            }

            // 상위 컴포넌트에서 데이터 제거
            if (onSetPendingUploadData) {
                onSetPendingUploadData(null);
            }

            // 분석 데이터 조회
            if (planDocId) {
                const fetchAnalysisData = async () => {
                    try {
                        const analysisResponse = await fetch(`${apiBase}/ai-plan/analysis?plan_doc_id=${planDocId}`);
                        if (analysisResponse.ok) {
                            const analysisResult = await analysisResponse.json();
                            if (analysisResult.success && analysisResult.data) {
                                if (analysisResult.data.ai_product_insight_analysis) {
                                    setAnalysisData(analysisResult.data.ai_product_insight_analysis);
                                }
                                if (analysisResult.data.ai_product_insight_analysis_cn) {
                                    setAnalysisDataCn(analysisResult.data.ai_product_insight_analysis_cn);
                                }
                                if (analysisResult.data.ai_product_insight_analysis_eng) {
                                    setAnalysisDataEng(analysisResult.data.ai_product_insight_analysis_eng);
                                }
                                if (analysisResult.data.ai_top10_reels_plan) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan)
                                        ? analysisResult.data.ai_top10_reels_plan
                                        : [];
                                    setReelsPlans(plans);
                                }
                                if (analysisResult.data.ai_top10_reels_plan_cn) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan_cn)
                                        ? analysisResult.data.ai_top10_reels_plan_cn
                                        : [];
                                    setReelsPlansCn(plans);
                                }
                                if (analysisResult.data.ai_top10_reels_plan_eng) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan_eng)
                                        ? analysisResult.data.ai_top10_reels_plan_eng
                                        : [];
                                    setReelsPlansEng(plans);
                                }
                                if (analysisResult.data.ai_content_format_strategy) {
                                    setContentFormatStrategy(analysisResult.data.ai_content_format_strategy);
                                }
                                if (analysisResult.data.ai_content_format_strategy_cn) {
                                    setContentFormatStrategyCn(analysisResult.data.ai_content_format_strategy_cn);
                                }
                                if (analysisResult.data.ai_content_format_strategy_eng) {
                                    setContentFormatStrategyEng(analysisResult.data.ai_content_format_strategy_eng);
                                }
                                if (analysisResult.data.created_dt) {
                                    setUploadDate(analysisResult.data.created_dt);
                                }

                                // TOP 콘텐츠 조회
                                const platforms = ['youtube', 'tiktok', 'instagram'];
                                const topContentPromises = platforms.map(async (platform) => {
                                    try {
                                        const url = `${apiBase}/ai-plan/top-content?plan_doc_id=${planDocId}&platform=${platform}`;
                                        const topContentResponse = await fetch(url);

                                        if (topContentResponse.ok) {
                                            const topContentResult = await topContentResponse.json();
                                            if (topContentResult.success) {
                                                return { platform, data: topContentResult.data || [] };
                                            }
                                        }
                                    } catch (error) {
                                        // 에러 발생 시 빈 배열 반환
                                    }
                                    return { platform, data: [] };
                                });

                                const topContentResults = await Promise.all(topContentPromises);
                                const topContentsMap = {};
                                topContentResults.forEach(({ platform, data }) => {
                                    const normalizedPlatform = platform.toLowerCase();
                                    topContentsMap[normalizedPlatform] = data;
                                });
                                setTopContents(topContentsMap);
                            }
                        }
                    } catch (error) {
                        // 에러 처리
                    }
                };
                fetchAnalysisData();
            }
            return;
        }

        // pendingUploadData에 file이 없으면 에러
        if (!pendingUploadData.file) {
            setUploadError(t('aiPlan.productAnalysis.productAnalysisPage.errorUploadDataNotFound'));
            setIsLoading(false);
            return;
        }

        const uploadData = pendingUploadData;

        // API 호출 (이전 로직 유지 - 이제는 사용되지 않을 가능성이 높음)
        const uploadFile = async () => {
            try {
                setIsLoading(true);
                setUploadError(null);

                // FormData 생성
                const formDataToSend = new FormData();
                formDataToSend.append('file', uploadData.file); // File 객체 직접 사용
                formDataToSend.append('original_filename', uploadData.file.name);
                formDataToSend.append('country', uploadData.country);
                formDataToSend.append('brand', uploadData.brand);
                formDataToSend.append('category', uploadData.category);
                formDataToSend.append('subcategory', uploadData.subcategory);
                formDataToSend.append('productName', uploadData.productName);
                formDataToSend.append('marketingKeywords', uploadData.marketingKeywords || '');
                formDataToSend.append('promotionContent', uploadData.promotionContent || '');
                if (uploadData.user_nm) {
                    formDataToSend.append('user_nm', uploadData.user_nm);
                }

                const response = await fetch(`${apiBase}/ai-plan/upload`, {
                    method: 'POST',
                    body: formDataToSend,
                });

                if (!response.ok) {
                    const errorData = await response
                        .json()
                        .catch(() => ({ error: t('aiPlan.productAnalysis.productAnalysisPage.uploadFailed') }));
                    throw new Error(
                        errorData.error || t('aiPlan.productAnalysis.productAnalysisPage.fileUploadFailed')
                    );
                }

                const result = await response.json();

                // 응답이 성공적으로 받아졌는지 확인
                if (result.success && result.data) {
                    // 상위 컴포넌트에서 데이터 제거
                    if (onSetPendingUploadData) {
                        onSetPendingUploadData(null);
                    }

                    // 파싱된 데이터 설정
                    const parsedData = {
                        productName: uploadData.productName,
                        subcategory: uploadData.subcategory, // subcategory 저장
                        ...result.data,
                    };
                    setData(parsedData);
                    // category 정보 저장
                    if (uploadData.category) {
                        setCategory(uploadData.category);
                        localStorage.setItem('current_plan_category', uploadData.category);
                    }

                    // plan_doc_id로 분석 데이터 조회
                    const planDocId = result.data?.plan_doc_id;

                    // 기존 plan_doc_id 명시적으로 삭제 후 새로운 것 저장 (캐시 방지)
                    if (planDocId) {
                        const oldPlanDocId = localStorage.getItem('current_plan_doc_id');
                        if (oldPlanDocId && oldPlanDocId !== planDocId) {
                            localStorage.removeItem(`product_analysis_saved_${oldPlanDocId}`);
                        }
                        localStorage.removeItem('current_plan_doc_id');
                        localStorage.setItem('current_plan_doc_id', planDocId);
                    }

                    if (planDocId) {
                        try {
                            const analysisResponse = await fetch(
                                `${apiBase}/ai-plan/analysis?plan_doc_id=${planDocId}`
                            );

                            if (analysisResponse.ok) {
                                const analysisResult = await analysisResponse.json();

                                if (analysisResult.success && analysisResult.data) {
                                    if (analysisResult.data.ai_product_insight_analysis) {
                                        setAnalysisData(analysisResult.data.ai_product_insight_analysis);
                                    }
                                    if (analysisResult.data.ai_product_insight_analysis_cn) {
                                        setAnalysisDataCn(analysisResult.data.ai_product_insight_analysis_cn);
                                    }
                                    if (analysisResult.data.ai_product_insight_analysis_eng) {
                                        setAnalysisDataEng(analysisResult.data.ai_product_insight_analysis_eng);
                                    }
                                    if (analysisResult.data.ai_top10_reels_plan) {
                                        const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan)
                                            ? analysisResult.data.ai_top10_reels_plan
                                            : [];
                                        setReelsPlans(plans);
                                    }
                                    if (analysisResult.data.ai_content_format_strategy) {
                                        setContentFormatStrategy(analysisResult.data.ai_content_format_strategy);
                                    }
                                    if (analysisResult.data.ai_content_format_strategy_cn) {
                                        setContentFormatStrategyCn(analysisResult.data.ai_content_format_strategy_cn);
                                    }
                                    if (analysisResult.data.ai_content_format_strategy_eng) {
                                        setContentFormatStrategyEng(analysisResult.data.ai_content_format_strategy_eng);
                                    }
                                    if (analysisResult.data.created_dt) {
                                        setUploadDate(analysisResult.data.created_dt);
                                    }

                                    // TOP 콘텐츠 조회 (plan_doc_id 사용 - 서버에서 subcategory 조회)
                                    const platforms = ['youtube', 'tiktok', 'instagram'];
                                    const topContentPromises = platforms.map(async (platform) => {
                                        try {
                                            const url = `${apiBase}/ai-plan/top-content?plan_doc_id=${planDocId}&platform=${platform}`;
                                            const topContentResponse = await fetch(url);

                                            if (topContentResponse.ok) {
                                                const topContentResult = await topContentResponse.json();
                                                if (topContentResult.success) {
                                                    return { platform, data: topContentResult.data || [] };
                                                }
                                            }
                                        } catch (error) {
                                            // 에러 발생 시 빈 배열 반환
                                        }
                                        return { platform, data: [] };
                                    });

                                    const topContentResults = await Promise.all(topContentPromises);
                                    const topContentsMap = {};
                                    topContentResults.forEach(({ platform, data }) => {
                                        // platform을 소문자로 정규화하여 저장
                                        const normalizedPlatform = platform.toLowerCase();
                                        topContentsMap[normalizedPlatform] = data;
                                    });
                                    setTopContents(topContentsMap);
                                }
                            }
                        } catch (analysisError) {
                            // 분석 데이터 조회 실패해도 계속 진행
                        }
                    }

                    // 상위 컴포넌트에 알림
                    if (onParsingComplete) {
                        onParsingComplete(parsedData);
                    }
                } else {
                    throw new Error(t('aiPlan.productAnalysis.productAnalysisPage.serverResponseError'));
                }
            } catch (error) {
                setUploadError(error.message || t('aiPlan.productAnalysis.productAnalysisPage.fileUploadError'));
            } finally {
                setIsLoading(false);
            }
        };

        uploadFile();
    }, [pendingUploadData]);

    // 새로고침 시 localStorage에서 plan_doc_id 복원하여 데이터 조회
    useEffect(() => {
        // pendingUploadData도 없고, parsedData도 없을 때만 localStorage에서 복원
        if (!pendingUploadData && !parsedData && !analysisData) {
            const savedPlanDocId = localStorage.getItem('current_plan_doc_id');
            const savedCategory = localStorage.getItem('current_plan_category');
            if (savedCategory) {
                setCategory(savedCategory);
            }
            if (savedPlanDocId) {
                setIsLoading(true);

                const fetchDataFromPlanDocId = async () => {
                    try {
                        // 분석 데이터 조회
                        const analysisResponse = await fetch(
                            `${apiBase}/ai-plan/analysis?plan_doc_id=${savedPlanDocId}`
                        );

                        if (analysisResponse.ok) {
                            const analysisResult = await analysisResponse.json();
                            if (analysisResult.success && analysisResult.data) {
                                // 기본 데이터 설정 - product_name이 있으면 사용, 없으면 기본값
                                setData({
                                    productName:
                                        analysisResult.data.product_name ||
                                        t('aiPlan.productAnalysis.productAnalysisPage.pageTitle'),
                                    plan_doc_id: savedPlanDocId,
                                });

                                // 각종 분석 데이터 설정
                                if (analysisResult.data.ai_product_insight_analysis) {
                                    setAnalysisData(analysisResult.data.ai_product_insight_analysis);
                                }
                                if (analysisResult.data.ai_product_insight_analysis_cn) {
                                    setAnalysisDataCn(analysisResult.data.ai_product_insight_analysis_cn);
                                }
                                if (analysisResult.data.ai_product_insight_analysis_eng) {
                                    setAnalysisDataEng(analysisResult.data.ai_product_insight_analysis_eng);
                                }
                                if (analysisResult.data.ai_top10_reels_plan) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan)
                                        ? analysisResult.data.ai_top10_reels_plan
                                        : [];
                                    setReelsPlans(plans);
                                }
                                if (analysisResult.data.ai_top10_reels_plan_cn) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan_cn)
                                        ? analysisResult.data.ai_top10_reels_plan_cn
                                        : [];
                                    setReelsPlansCn(plans);
                                }
                                if (analysisResult.data.ai_top10_reels_plan_eng) {
                                    const plans = Array.isArray(analysisResult.data.ai_top10_reels_plan_eng)
                                        ? analysisResult.data.ai_top10_reels_plan_eng
                                        : [];
                                    setReelsPlansEng(plans);
                                }
                                if (analysisResult.data.ai_content_format_strategy) {
                                    setContentFormatStrategy(analysisResult.data.ai_content_format_strategy);
                                }
                                if (analysisResult.data.ai_content_format_strategy_cn) {
                                    setContentFormatStrategyCn(analysisResult.data.ai_content_format_strategy_cn);
                                }
                                if (analysisResult.data.ai_content_format_strategy_eng) {
                                    setContentFormatStrategyEng(analysisResult.data.ai_content_format_strategy_eng);
                                }
                                if (analysisResult.data.created_dt) {
                                    setUploadDate(analysisResult.data.created_dt);
                                }

                                // TOP 콘텐츠 조회 (plan_doc_id 사용 - 서버에서 subcategory 조회)
                                if (savedPlanDocId) {
                                    const platforms = ['youtube', 'tiktok', 'instagram'];
                                    const topContentPromises = platforms.map(async (platform) => {
                                        try {
                                            const topContentResponse = await fetch(
                                                `${apiBase}/ai-plan/top-content?plan_doc_id=${savedPlanDocId}&platform=${platform}`
                                            );
                                            if (topContentResponse.ok) {
                                                const topContentResult = await topContentResponse.json();
                                                if (topContentResult.success) {
                                                    return { platform, data: topContentResult.data };
                                                }
                                            }
                                        } catch (error) {
                                            // 에러 발생 시 빈 배열 반환
                                        }
                                        return { platform, data: [] };
                                    });

                                    const topContentResults = await Promise.all(topContentPromises);
                                    const topContentsMap = {};
                                    topContentResults.forEach(({ platform, data }) => {
                                        // platform을 소문자로 정규화하여 저장
                                        const normalizedPlatform = platform.toLowerCase();
                                        topContentsMap[normalizedPlatform] = data;
                                    });
                                    setTopContents(topContentsMap);
                                }

                                // 상위 컴포넌트에 알림
                                if (onParsingComplete) {
                                    onParsingComplete({
                                        plan_doc_id: savedPlanDocId,
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        // 에러 처리 (필요 시 사용자에게 알림)
                    } finally {
                        setIsLoading(false);
                    }
                };

                fetchDataFromPlanDocId();
            }
        }
    }, []); // 마운트 시 한 번만 실행

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <div style={{ width: '15%', flexShrink: 0, borderRight: '1px solid #e5e7eb' }}>
                    <Sidebar
                        currentPage="product-analysis"
                        navigateToPage={navigateToPage}
                        completionStatus={completionStatus}
                    />
                </div>
                <div style={{ width: '85%', flexShrink: 0 }}>
                    <Header
                        title={t('aiPlan.productAnalysis.productAnalysisPage.pageTitle')}
                        onLogout={handleLogout}
                        showBackButton={true}
                        onBack={() => navigateToPage('Dashboard')}
                        onBackToDashboard={onBack}
                        user={user}
                    />
                    <main className="p-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                        {isLoading ? (
                            <div className="text-center">
                                {uploadError && (
                                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">
                                        {uploadError}
                                        <button
                                            onClick={() => navigateToPage('Dashboard')}
                                            className="block mt-2 text-blue-600 hover:underline"
                                        >
                                            {t('aiPlan.productAnalysis.productAnalysisPage.errorBackToDashboard')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center">
                                {uploadError && (
                                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">
                                        {uploadError}
                                        <button
                                            onClick={() => navigateToPage('Dashboard')}
                                            className="block mt-2 text-blue-600 hover:underline"
                                        >
                                            {t('aiPlan.productAnalysis.productAnalysisPage.errorBackToDashboard')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div style={{ width: '15%', flexShrink: 0, borderRight: '1px solid #e5e7eb' }}>
                <Sidebar
                    currentPage="product-analysis"
                    navigateToPage={navigateToPage}
                    completionStatus={completionStatus}
                />
            </div>
            <div style={{ width: '85%', flexShrink: 0 }}>
                <div style={{ backgroundColor: '#FFFFFF' }}>
                    <Header
                        title={t('aiPlan.productAnalysis.productAnalysisPage.pageTitle')}
                        onLogout={handleLogout}
                        showBackButton={false}
                        onBackToDashboard={onBack}
                        user={user}
                        noBorder={true}
                    />
                </div>
                <StepProgressBar currentStep={2} attached={true} />
                {/* 현재 단계 정보 카드 */}
                <CurrentStepCard
                    icon={BarChart3}
                    title={t('aiPlan.sidebar.productAnalysis')}
                    description={
                        t('aiPlan.productAnalysis.productAnalysisPage.stepDescription') ||
                        '제품 정보를 분석하고 최적의 기획안을 생성합니다.'
                    }
                    attached={true}
                />

                <div style={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 80px)' }}>
                    <main className="p-8 mx-auto" style={{ maxWidth: '60%' }}>
                        {/* 제품명 및 날짜 */}
                        <div className="mb-6 flex flex-col items-start">
                            <div className="text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="">{data.productName}</h2>
                                    <div
                                        className="w-8 h-8  rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: '#CFFDE1' }}
                                    >
                                        <CheckCircle className="w-5 h-5 text-[#10b981]" />
                                    </div>
                                </div>
                                <p className="text-sm " style={{ marginBottom: '10px', color: '#6b7280' }}>
                                    {uploadDate
                                        ? `${t(
                                              'aiPlan.productAnalysis.productAnalysisPage.uploadDatePrefix'
                                          )}${new Date(uploadDate).toISOString().split('T')[0].replace(/-/g, '.')}`
                                        : t('aiPlan.productAnalysis.productAnalysisPage.uploadDateNone')}
                                </p>
                            </div>
                        </div>

                        {/* ① 제품 심층 분석 결과 */}
                        <DeepAnalysis
                            analysisData={analysisData}
                            analysisDataCn={analysisDataCn}
                            analysisDataEng={analysisDataEng}
                        />

                        {/* ② BEST 릴스 기획안 10선 */}
                        <BestPlansList
                            reelsPlans={reelsPlans}
                            reelsPlansCn={reelsPlansCn}
                            reelsPlansEng={reelsPlansEng}
                        />

                        {/* ③ 콘텐츠 포맷 전략 */}
                        <ContentFormatStrategy
                            contentFormatStrategy={contentFormatStrategy}
                            contentFormatStrategyCn={contentFormatStrategyCn}
                            contentFormatStrategyEng={contentFormatStrategyEng}
                        />

                        {/* ④ 관련 카테고리 현재 이슈 콘텐츠 TOP 3 */}
                        <TrendingContentTop3
                            topContents={topContents}
                            planDocId={data?.plan_doc_id}
                            category={category}
                        />

                        {/* AI 제품 분석 & 기획안 저장하기 버튼 */}
                        <div style={{ marginBottom: '12px' }}>
                            <button
                                onClick={handleSaveProductAnalysis}
                                disabled={isSaved}
                                style={{
                                    width: '100%',
                                    paddingTop: '14px',
                                    paddingBottom: '14px',
                                    background: isSaved
                                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                        : 'linear-gradient(135deg, #D5BAFF 0%, #C5B3FF 25%, #B5ADFF 50%, #A5B8FF 75%, #9BC8FF 100%)',
                                    color: 'white',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: isSaved ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSaved
                                        ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                                        : '0 2px 8px rgba(185, 168, 255, 0.3)',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSaved) {
                                        e.target.style.background =
                                            'linear-gradient(135deg, #C9AEFF 0%, #B9A7FF 25%, #A9A1FF 50%, #99ACFF 75%, #8FBCFF 100%)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(185, 168, 255, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSaved) {
                                        e.target.style.background =
                                            'linear-gradient(135deg, #D5BAFF 0%, #C5B3FF 25%, #B5ADFF 50%, #A5B8FF 75%, #9BC8FF 100%)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(185, 168, 255, 0.3)';
                                    }
                                }}
                            >
                                {isSaved ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>{t('aiPlan.productAnalysis.productAnalysisPage.saveCompleted')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>{t('aiPlan.productAnalysis.productAnalysisPage.saveButton')}</span>
                                        <CheckCircle className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* 다음 버튼 */}
                        <div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => navigateToPage('Dashboard')}
                                    style={{
                                        flex: 1,
                                        paddingTop: '12px',
                                        paddingBottom: '12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'background-color 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>{t('aiPlan.productAnalysis.productAnalysisPage.previousStep')}</span>
                                </button>

                                <button
                                    onClick={handleNextClick}
                                    style={{
                                        flex: 1,
                                        paddingTop: '12px',
                                        paddingBottom: '12px',
                                        backgroundColor: '#B9A8FF',
                                        color: 'white',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'background-color 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#A08FFF';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#B9A8FF';
                                    }}
                                >
                                    <span>{t('aiPlan.productAnalysis.productAnalysisPage.nextStep')}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            {/* 토스트 알림 */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
                duration={3000}
            />

            {/* 저장 확인 다이얼로그 */}
            <Dialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
                <DialogContent
                    style={{
                        maxWidth: '480px',
                        padding: '32px',
                        borderRadius: '12px',
                        backgroundColor: 'white',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        {/* 설명 */}
                        <p
                            style={{
                                fontSize: '14px',
                                color: '#6B7280',
                                lineHeight: '1.6',
                                marginTop: '24px',
                                marginBottom: '24px',
                            }}
                        >
                            {t('aiPlan.productAnalysis.productAnalysisPage.saveConfirmDialog.description1')}
                            <br />
                            {t('aiPlan.productAnalysis.productAnalysisPage.saveConfirmDialog.description2')}
                            <br />
                            <br />
                            <strong style={{ color: '#374151' }}>
                                {t('aiPlan.productAnalysis.productAnalysisPage.saveConfirmDialog.description3')}
                            </strong>
                        </p>

                        {/* 버튼 */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowSaveConfirmDialog(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    backgroundColor: 'white',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#F9FAFB';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'white';
                                }}
                            >
                                {t('aiPlan.productAnalysis.productAnalysisPage.saveConfirmDialog.cancelAndSave')}
                            </button>
                            <button
                                onClick={handleProceedWithoutSave}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    backgroundColor: '#B9A8FF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#A08FFF';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#B9A8FF';
                                }}
                            >
                                {t('aiPlan.productAnalysis.productAnalysisPage.saveConfirmDialog.proceedWithoutSave')}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
