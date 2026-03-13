import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { ArrowRight, ArrowLeft, Users, Sparkles, Download, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { useTranslation, useLanguage } from '../../hooks/useTranslation.js';
import { CurrentStepCard } from './CurrentStepCard.jsx';
import { StepProgressBar } from './StepProgressBar.jsx';
import { InformationSection } from './influencer-analysis/InformationSection.jsx';
import { ChannelSelector } from './influencer-analysis/ChannelSelector.jsx';
import { UploadSection } from './influencer-analysis/UploadSection.jsx';
import { FilterSection } from './influencer-analysis/FilterSection.jsx';
import { InfluencerList } from './influencer-analysis/InfluencerList.jsx';
import { InfluencerDetailAnalysis } from './influencer-analysis/InfluencerDetailAnalysis.jsx';
import { Dialog, DialogContent } from '../ui/dialog.jsx';
import { AnalysisLoadingDialog } from './AnalysisLoadingDialog.jsx';

const apiBase = import.meta.env.VITE_API_BASE_URL || '';
const UPLOADED_PROFILE_URLS_KEY = 'ai_plan_influencer_uploaded_profile_urls';

function getStoredUploadedProfileUrls() {
    try {
        const s = localStorage.getItem(UPLOADED_PROFILE_URLS_KEY);
        if (!s) return [];
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

const CONTENT_TYPE_ID_MAP = {
    grwm: 'GRWM',
    routine: '루틴',
    daily: '일상/브이로그',
    review: '리뷰/튜토리얼',
    info: '정보형',
    asmr: 'ASMR',
    recommend: '추천템',
    haul: '하울/언박싱',
    beforeafter: '비포앤에프터',
};

const CATEGORY_ID_MAP = { mega: '메가', macro: '매크로', micro: '마이크로' };

// 콘텐츠 유형별 Hook 타입 매핑
const CONTENT_TYPE_TO_HOOKS = {
    GRWM: ['Story', 'Trend', 'Cultural'],
    루틴: ['Pain', 'Result', 'Utility'],
    '일상/브이로그': ['Emotional', 'Story', 'Fame'],
    '리뷰/튜토리얼': ['Visual Shock', 'Pain', 'Contradiction', 'Myth'],
    정보형: ['Myth', 'Utility', 'Pain'],
    ASMR: ['ASMR', 'Sensory', 'Visual Shock', 'Contradiction'],
    추천템: ['Fame', 'Contradiction', 'Result'],
    '하울/언박싱': ['Visual Shock', 'Emotional', 'Trend'],
    비포앤에프터: ['Result', 'Pain', 'Visual Shock'],
};

function buildCategoriesFromList(list, t) {
    const total = list.length;
    const mega = list.filter((i) => i.category === '메가').length;
    const macro = list.filter((i) => i.category === '매크로').length;
    const micro = list.filter((i) => i.category === '마이크로').length;
    return [
        { id: 'all', label: t('aiPlan.influencerAnalysis.categories.all'), count: total },
        { id: 'mega', label: t('aiPlan.influencerAnalysis.categories.mega'), count: mega },
        { id: 'macro', label: t('aiPlan.influencerAnalysis.categories.macro'), count: macro },
        { id: 'micro', label: t('aiPlan.influencerAnalysis.categories.micro'), count: micro },
    ];
}

function buildContentTypesFromList(list, t) {
    const total = list.length;
    const counts = Object.keys(CONTENT_TYPE_ID_MAP).reduce((acc, id) => {
        const label = CONTENT_TYPE_ID_MAP[id];
        acc[id] = list.filter((i) => Array.isArray(i.contentTypes) && i.contentTypes.includes(label)).length;
        return acc;
    }, {});
    return [
        { id: 'all', label: t('aiPlan.influencerAnalysis.contentTypes.all'), count: total },
        { id: 'grwm', label: t('aiPlan.influencerAnalysis.contentTypes.grwm'), count: counts.grwm ?? 0 },
        { id: 'routine', label: t('aiPlan.influencerAnalysis.contentTypes.routine'), count: counts.routine ?? 0 },
        { id: 'daily', label: t('aiPlan.influencerAnalysis.contentTypes.daily'), count: counts.daily ?? 0 },
        { id: 'review', label: t('aiPlan.influencerAnalysis.contentTypes.review'), count: counts.review ?? 0 },
        { id: 'info', label: t('aiPlan.influencerAnalysis.contentTypes.info'), count: counts.info ?? 0 },
        { id: 'asmr', label: t('aiPlan.influencerAnalysis.contentTypes.asmr'), count: counts.asmr ?? 0 },
        { id: 'recommend', label: t('aiPlan.influencerAnalysis.contentTypes.recommend'), count: counts.recommend ?? 0 },
        { id: 'haul', label: t('aiPlan.influencerAnalysis.contentTypes.haul'), count: counts.haul ?? 0 },
        {
            id: 'beforeafter',
            label: t('aiPlan.influencerAnalysis.contentTypes.beforeafter'),
            count: counts.beforeafter ?? 0,
        },
    ];
}

export function InfluencerAnalysis({ navigateToPage, completionStatus, user, onLogout, onBack }) {
    const t = useTranslation();
    const language = useLanguage();
    const deepAnalysisLang = language === 'zh' ? 'cn' : language === 'en' ? 'eng' : 'ko';

    const [selectedChannel, setSelectedChannel] = useState('instagram');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedContentType, setSelectedContentType] = useState('all');
    const [selectedInfluencers, setSelectedInfluencers] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [expandedInfluencer, setExpandedInfluencer] = useState(null);

    const [influencerList, setInfluencerList] = useState([]);
    const [uploadedProfileUrls, setUploadedProfileUrls] = useState(getStoredUploadedProfileUrls);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);

    // AI 추천 기획안 데이터 (언어별 ko/cn/eng 보관 후 언어에 맞게 사용)
    const [reelsPlansByLang, setReelsPlansByLang] = useState({ ko: [], cn: [], eng: [] });
    const langKey = language === 'zh' ? 'cn' : language === 'en' ? 'eng' : 'ko';
    const allReelsPlans = useMemo(() => {
        const plans = reelsPlansByLang[langKey];
        if (plans && plans.length > 0) return plans;
        return reelsPlansByLang.ko && reelsPlansByLang.ko.length > 0 ? reelsPlansByLang.ko : [];
    }, [reelsPlansByLang, langKey]);
    const [planDocId, setPlanDocId] = useState(null);

    // 심층 분석 관련 state
    const [deepAnalysisLoading, setDeepAnalysisLoading] = useState(false);
    const [deepAnalysisMessage, setDeepAnalysisMessage] = useState(null);
    const [deepAnalysisMessageType, setDeepAnalysisMessageType] = useState(null);

    // 최종 기획안 미선택 알림 모달
    const [showFinalPlanWarningModal, setShowFinalPlanWarningModal] = useState(false);

    // 기획안 선택 필요 알림 모달
    const [showSelectPlanModal, setShowSelectPlanModal] = useState(false);
    const [showPlanNotFoundModal, setShowPlanNotFoundModal] = useState(false);

    // 심층 분석 대상 localStorage에 저장/복원
    const [deepAnalysisTargetIds, setDeepAnalysisTargetIds] = useState(() => {
        try {
            const stored = localStorage.getItem('influencer_deep_analysis_targets');
            if (stored) {
                const value = JSON.parse(stored);
                return value;
            }
        } catch (error) {
            console.error('[심층 분석 대상 복원 오류]', error);
        }
        return [];
    });

    // 심층 분석 후 최종 기획안 localStorage에 저장/복원
    const [selectedFinalPlanFromDeepAnalysis, setSelectedFinalPlanFromDeepAnalysis] = useState(() => {
        try {
            const stored = localStorage.getItem('influencer_final_plan_from_deep');
            if (stored) {
                const value = JSON.parse(stored);
                return value;
            }
        } catch (error) {
            console.error('[심층 분석 최종 기획안 복원 오류]', error);
        }
        return null;
    });

    const [isModifyProcessing, setIsModifyProcessing] = useState(false);

    // 심층 분석 관련 데이터 localStorage에 저장
    useEffect(() => {
        try {
            localStorage.setItem('influencer_deep_analysis_targets', JSON.stringify(deepAnalysisTargetIds));
        } catch (error) {
            console.error('[심층 분석 대상 저장 오류]', error);
        }
    }, [deepAnalysisTargetIds]);

    useEffect(() => {
        try {
            localStorage.setItem('influencer_final_plan_from_deep', JSON.stringify(selectedFinalPlanFromDeepAnalysis));
        } catch (error) {
            console.error('[심층 분석 최종 기획안 저장 오류]', error);
        }
    }, [selectedFinalPlanFromDeepAnalysis]);

    useEffect(() => {
        try {
            const expandedId = expandedInfluencer?.id || null;
            localStorage.setItem('influencer_expanded_influencer', JSON.stringify(expandedId));
        } catch (error) {
            console.error('[확장된 인플루언서 저장 오류]', error);
        }
    }, [expandedInfluencer]);

    // plan_doc_id를 localStorage에서 가져오기
    useEffect(() => {
        try {
            const storedPlanDocId = localStorage.getItem('current_plan_doc_id');
            if (storedPlanDocId) {
                setPlanDocId(storedPlanDocId);
            }
        } catch (error) {
            console.error('[plan_doc_id 로드 오류]', error);
        }
    }, []);

    // 기획안 데이터 가져오기 (ProductAnalysis와 동일한 소스: ai-plan/analysis의 ai_top10_reels_plan 사용)
    const fetchReelsPlans = useCallback(async () => {
        if (!planDocId) {
            return;
        }

        const url = `${apiBase}/ai-plan/analysis?plan_doc_id=${planDocId}`;

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error('[인플루언서 분석] ② 기획안 조회 실패:', res.status);
                return;
            }
            const result = await res.json();
            const data = result?.data || {};
            const plansKo = Array.isArray(data.ai_top10_reels_plan) ? data.ai_top10_reels_plan : [];
            const plansCn = Array.isArray(data.ai_top10_reels_plan_cn) ? data.ai_top10_reels_plan_cn : [];
            const plansEng = Array.isArray(data.ai_top10_reels_plan_eng) ? data.ai_top10_reels_plan_eng : [];
            setReelsPlansByLang({ ko: plansKo, cn: plansCn, eng: plansEng });
        } catch (error) {
            console.error('[인플루언서 분석] ② 기획안 조회 오류:', error);
        }
    }, [planDocId, apiBase]);

    // planDocId가 설정되면 기획안 데이터 및 타겟 플랫폼 가져오기
    useEffect(() => {
        if (planDocId) {
            fetchReelsPlans();

            // 타겟 플랫폼 가져오기
            const fetchTargetPlatform = async () => {
                try {
                    const response = await fetch(`${apiBase}/ai-plan/plan-product?plan_doc_id=${planDocId}`);
                    if (response.ok) {
                        const data = await response.json();
                        // target_platform이 있으면 설정 (없으면 기본값 'instagram' 유지)
                        if (data.target_platform) {
                            setSelectedChannel(data.target_platform);
                        }
                    }
                } catch (error) {
                    console.error('[타겟 플랫폼 조회 오류]', error);
                }
            };
            fetchTargetPlatform();
        }
    }, [planDocId, fetchReelsPlans, apiBase]);

    // 콘텐츠 유형 필터가 변경되면 선택된 기획안 및 인플루언서 초기화
    useEffect(() => {
        setSelectedPlan(null);
        setSelectedInfluencers([]);
    }, [selectedContentType]);

    /**
     * 리스트 조회. 수집 완료 다이얼로그에서 urls를 넘기면 그 URL로 list-by-urls 호출(트리거).
     * @param {boolean} silent - true면 로딩/에러 UI 없음
     * @param {string[]} [urlsForByUrls] - 있으면 이 URL로 POST list-by-urls 호출 (완료 창 트리거용)
     */
    const fetchInfluencerList = useCallback(
        async (silent = false, urlsForByUrls = null) => {
            const base = urlsForByUrls ?? uploadedProfileUrls;
            const urlsToFetch = base?.length > 0 ? base : [];

            if (!silent) {
                setListLoading(true);
                setListError(null);
            }
            try {
                const resSelected = await fetch(`${apiBase}/influencer/list`);
                const dataSelected = resSelected.ok ? await resSelected.json() : { list: [] };
                const selectedList = dataSelected.list || [];

                let byUrlsList = [];
                if (urlsToFetch && urlsToFetch.length > 0) {
                    const resByUrls = await fetch(`${apiBase}/influencer/list-by-urls`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ profile_url: urlsToFetch }),
                    });
                    const dataByUrls = resByUrls.ok ? await resByUrls.json() : { list: [] };
                    byUrlsList = dataByUrls.list || [];
                }

                const normId = (id) => (id == null ? '' : String(id));
                const byId = new Map();
                byUrlsList.forEach((i) => byId.set(normId(i.id), { ...i, id: i.id }));
                selectedList.forEach((i) => byId.set(normId(i.id), { ...i, id: i.id }));
                const finalList = Array.from(byId.values());
                setInfluencerList(finalList);
                return finalList;
            } catch (err) {
                console.error('[인플루언서 리스트 조회]', err);
                if (!silent) {
                    setListError(err.message || '리스트를 불러오지 못했습니다.');
                    setInfluencerList([]);
                }
                return [];
            } finally {
                if (!silent) setListLoading(false);
            }
        },
        [uploadedProfileUrls]
    );

    // 최초 로드 + uploadedProfileUrls 변경 시 1회 조회
    useEffect(() => {
        fetchInfluencerList();
    }, [fetchInfluencerList]);

    // influencerList 로드 후 expandedInfluencer 복원 (최초 1회만)
    useEffect(() => {
        if (influencerList.length > 0 && !listLoading && !expandedInfluencer) {
            try {
                const storedExpandedId = localStorage.getItem('influencer_expanded_influencer');
                let targetId = null;

                if (storedExpandedId && storedExpandedId !== 'null') {
                    try {
                        targetId = JSON.parse(storedExpandedId);
                    } catch (e) {
                        // ignore parse error
                    }
                }

                if (!targetId && deepAnalysisTargetIds.length > 0) {
                    targetId = deepAnalysisTargetIds[0];
                }

                if (targetId) {
                    const found = influencerList.find((inf) => inf.id === targetId);
                    if (found) {
                        setExpandedInfluencer(found);
                    }
                }
            } catch (error) {
                console.error('[확장된 인플루언서 복원 오류]', error);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [influencerList, listLoading]);

    const handleAnalysisStarted = useCallback((urls) => {
        const next = Array.isArray(urls) ? urls : [];
        setUploadedProfileUrls(next);
        try {
            if (next.length > 0) {
                localStorage.setItem(UPLOADED_PROFILE_URLS_KEY, JSON.stringify(next));
            } else {
                localStorage.removeItem(UPLOADED_PROFILE_URLS_KEY);
            }
        } catch {
            // ignore
        }
    }, []);

    const categories = buildCategoriesFromList(influencerList, t);
    const categoryFilteredInfluencers = influencerList.filter((influencer) => {
        return (
            selectedCategory === 'all' ||
            (selectedCategory === 'mega' && influencer.category === '메가') ||
            (selectedCategory === 'macro' && influencer.category === '매크로') ||
            (selectedCategory === 'micro' && influencer.category === '마이크로')
        );
    });
    const contentTypes = buildContentTypesFromList(categoryFilteredInfluencers, t);

    const getCategoryColor = (category) => {
        switch (category) {
            case '메가':
            case 'Mega':
            case '头部':
                return { bg: '#EDE9FE', text: '#7C3AED' };
            case '매크로':
            case 'Macro':
            case '腰部':
                return { bg: '#DBEAFE', text: '#2563EB' };
            case '마이크로':
            case 'Micro':
            case '尾部':
                return { bg: '#D1FAE5', text: '#059669' };
            default:
                return { bg: '#F3F4F6', text: '#4B5563' };
        }
    };

    const filteredInfluencers = influencerList.filter((influencer) => {
        const categoryMatch =
            selectedCategory === 'all' ||
            (selectedCategory === 'mega' && influencer.category === '메가') ||
            (selectedCategory === 'macro' && influencer.category === '매크로') ||
            (selectedCategory === 'micro' && influencer.category === '마이크로');

        const contentTypeMatch =
            selectedContentType === 'all' ||
            (Array.isArray(influencer.contentTypes) &&
                influencer.contentTypes.some((type) => type === CONTENT_TYPE_ID_MAP[selectedContentType]));

        return categoryMatch && contentTypeMatch;
    });

    const handleInfluencerToggle = (influencerId) => {
        setSelectedInfluencers((prev) =>
            prev.includes(influencerId) ? prev.filter((id) => id !== influencerId) : [...prev, influencerId]
        );
    };

    const [saveLoading, setSaveLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [saveMessageType, setSaveMessageType] = useState(null); // 'success' | 'error'
    const [manageLoading, setManageLoading] = useState(false);

    const handleSaveSelected = useCallback(async () => {
        if (selectedInfluencers.length === 0) return;
        setSaveLoading(true);
        setSaveMessage(null);
        setSaveMessageType(null);
        try {
            const updatedBy = user?.user_id ?? user?.name ?? 'unknown';
            const res = await fetch(`${apiBase}/influencer/mark-selected`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_ids: selectedInfluencers, updated_by: updatedBy }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || data.details || t('aiPlan.influencerAnalysis.errors.saveFailed'));
            setSaveMessage(t('aiPlan.influencerAnalysis.saveSuccess') || '선택한 인플루언서가 저장되었습니다.');
            setSaveMessageType('success');
            await fetchInfluencerList(true);
            setTimeout(() => {
                setSaveMessage(null);
                setSaveMessageType(null);
            }, 3000);
        } catch (err) {
            console.error('[인플루언서 저장]', err);
            setSaveMessage(err.message || t('aiPlan.influencerAnalysis.saveError') || '저장 중 오류가 발생했습니다.');
            setSaveMessageType('error');
        } finally {
            setSaveLoading(false);
        }
    }, [selectedInfluencers, user, t, apiBase, fetchInfluencerList]);

    const handleUnsaveSelected = useCallback(async () => {
        const savedIds = selectedInfluencers.filter((id) => {
            const target = filteredInfluencers.find((inf) => inf.id === id);
            return target?.isSaved === true;
        });

        if (savedIds.length === 0) {
            setSaveMessage(t('aiPlan.influencerAnalysis.noSavedSelected') || '저장된 인플루언서를 선택해 주세요.');
            setSaveMessageType('error');
            setTimeout(() => {
                setSaveMessage(null);
                setSaveMessageType(null);
            }, 3000);
            return;
        }

        setManageLoading(true);
        setSaveMessage(null);
        setSaveMessageType(null);
        try {
            const updatedBy = user?.user_id ?? user?.name ?? 'unknown';
            const res = await fetch(`${apiBase}/influencer/unmark-selected`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_ids: savedIds, updated_by: updatedBy }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || data.details || t('aiPlan.influencerAnalysis.errors.unsaveFailed'));
            setSaveMessage(t('aiPlan.influencerAnalysis.unmarkSuccess') || '선택한 인플루언서가 저장 해제되었습니다.');
            setSaveMessageType('success');
            await fetchInfluencerList(true);
            setSelectedInfluencers((prev) => prev.filter((id) => !savedIds.includes(id)));
            setTimeout(() => {
                setSaveMessage(null);
                setSaveMessageType(null);
            }, 3000);
        } catch (err) {
            console.error('[인플루언서 저장 해제]', err);
            setSaveMessage(
                err.message || t('aiPlan.influencerAnalysis.unmarkError') || '저장 해제 중 오류가 발생했습니다.'
            );
            setSaveMessageType('error');
        } finally {
            setManageLoading(false);
        }
    }, [selectedInfluencers, filteredInfluencers, user, t, apiBase, fetchInfluencerList]);

    // AI 추천 기획안 계산 (콘텐츠 유형별 필터 기반)
    const recommendedPlans = useMemo(() => {
        if (!allReelsPlans || allReelsPlans.length === 0) {
            return [];
        }

        if (selectedContentType === 'all') {
            return [];
        }

        const contentTypeLabel = CONTENT_TYPE_ID_MAP[selectedContentType];
        const allowedHooks = contentTypeLabel ? CONTENT_TYPE_TO_HOOKS[contentTypeLabel] : null;

        // 훅 타입 추출: [Hook타입] 또는 [기획안/策划/策划案/Plan N: Hook타입] 형식 지원 (반각·전각 콜론)
        const extractHookType = (title) => {
            if (!title) return null;
            const match = title.match(/\[([^\]]+)\]/);
            if (!match) return null;
            const inside = match[1].trim();
            // 반각(:) 또는 전각(：) 콜론 기준으로 마지막 부분이 훅 설명
            const afterColon = inside.split(/\s*[:\：]\s*/).pop();
            return (afterColon && afterColon.trim()) || inside;
        };

        // 중국어 훅 키워드 → 영어 훅명 (allowedHooks 매칭용)
        const HOOK_ZH_TO_EN = {
            痛点: 'Pain',
            结果: 'Result',
            视觉冲击: 'Visual Shock',
            神话: 'Myth',
            故事: 'Story',
            趋势: 'Trend',
            文化: 'Cultural',
            效用: 'Utility',
            实用: 'Utility',
            情感: 'Emotional',
            名人: 'Fame',
            名气: 'Fame',
            矛盾: 'Contradiction',
            感官: 'Sensory',
            感觉: 'Sensory',
        };

        const normalizeHookForMatch = (hookType) => {
            if (!hookType) return '';
            let s = hookType;
            Object.entries(HOOK_ZH_TO_EN).forEach(([zh, en]) => {
                if (s.includes(zh)) s = s.replace(new RegExp(zh, 'g'), ` ${en} `);
            });
            return s.trim();
        };

        // 표시용 제목에서 접두어 제거 (한/영/중, 策划案 포함. 앞 [ 부터 제거)
        const formatDisplayTitle = (title) => {
            if (!title) return '';
            return title
                .replace(/^\[?\s*(?:기획안|策划案?|Plan)\s*\d*\s*[:\：]\s*/i, '')
                .replace(/\]\s*$/, '')
                .trim();
        };

        const isHookAllowed = (hookType, hooks) => {
            if (!hookType) return false;
            if (!hooks) return true;
            const toCheck = normalizeHookForMatch(hookType) || hookType;
            return hooks.some((h) => toCheck.toLowerCase().includes(h.toLowerCase()));
        };

        const filteredPlans = allReelsPlans
            .map((plan) => {
                const hookType = extractHookType(plan.title);
                return {
                    ...plan,
                    displayTitle: formatDisplayTitle(plan.title),
                    subtitle: plan.message || hookType || '',
                    hookType,
                };
            })
            .filter((plan) => isHookAllowed(plan.hookType, allowedHooks));

        const result = filteredPlans.slice(0, 10);
        return result;
    }, [selectedContentType, allReelsPlans]);

    const savedSelectedCount = selectedInfluencers.filter((id) => {
        const target = filteredInfluencers.find((inf) => inf.id === id);
        return target?.isSaved === true;
    }).length;

    const handleDeepAnalysis = useCallback(async () => {
        if (selectedInfluencers.length === 0) return;
        const influencersToSend = selectedInfluencers
            .map((id) => filteredInfluencers.find((inf) => inf.id === id))
            .filter(Boolean);
        if (influencersToSend.length === 0) return;
        setDeepAnalysisLoading(true);
        setDeepAnalysisMessage(null);
        setDeepAnalysisMessageType(null);
        try {
            const planDocId = typeof localStorage !== 'undefined' ? localStorage.getItem('current_plan_doc_id') : null;

            const res = await fetch(`${apiBase}/influencer/deep-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_doc_id: planDocId || undefined,
                    influencers: influencersToSend.map((inf) => ({
                        profile_id: inf.id,
                        platform: String(inf.platform ?? 'instagram').toLowerCase(),
                    })),
                    language: deepAnalysisLang,
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || data.details || t('aiPlan.influencerAnalysis.errors.deepAnalysisFailed'));

            const targetIds = influencersToSend.map((inf) => inf.id);
            setDeepAnalysisTargetIds(targetIds);

            const firstId = influencersToSend[0]?.id;

            // 심층 분석 완료 후 리스트 재조회 (업데이트된 deep_analysis 반영)
            const refetchedList = await fetchInfluencerList(true);
            // 재조회된 리스트에서 해당 인플루언서로 갱신 (Matching Summary 등 deep_analysis 반영)
            const applyExpandedFromList = (list) => {
                if (!list || list.length === 0 || firstId == null) return;
                const updatedFirst = list.find((inf) => String(inf.id) === String(firstId));
                if (updatedFirst) setExpandedInfluencer(updatedFirst);
            };
            if (refetchedList && refetchedList.length > 0) {
                applyExpandedFromList(refetchedList);
            } else {
                setExpandedInfluencer(influencersToSend[0]);
            }
            // 서버가 deep_analysis를 응답 직후가 아닌 직후에 DB 반영할 수 있으므로, 짧은 지연 후 한 번 더 재조회
            setTimeout(async () => {
                const retryList = await fetchInfluencerList(true);
                applyExpandedFromList(retryList);
            }, 1500);

            setTimeout(() => {
                const element = document.getElementById('influencer-detail');
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
            setDeepAnalysisMessage(
                t('aiPlan.influencerAnalysis.deepAnalysisSuccess') || '심층 분석 요청이 접수되었습니다.'
            );
            setDeepAnalysisMessageType('success');
            setTimeout(() => {
                setDeepAnalysisMessage(null);
                setDeepAnalysisMessageType(null);
            }, 3000);
        } catch (err) {
            console.error('[인플루언서 심층 분석]', err);
            setDeepAnalysisMessage(
                err.message ||
                    t('aiPlan.influencerAnalysis.deepAnalysisError') ||
                    '심층 분석 요청 중 오류가 발생했습니다.'
            );
            setDeepAnalysisMessageType('error');
        } finally {
            setDeepAnalysisLoading(false);
        }
    }, [selectedInfluencers, filteredInfluencers, apiBase, t, fetchInfluencerList, language]);

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
    };

    // 타겟 채널 변경 핸들러 (미선택 시 기본값 instagram)
    const handleChannelChange = useCallback(
        async (channel) => {
            const value = channel || 'instagram';
            setSelectedChannel(value);

            // API 호출하여 DB 업데이트
            try {
                const planDocId = localStorage.getItem('current_plan_doc_id');
                if (!planDocId) return;

                const response = await fetch(`${apiBase}/ai-plan/update-target-platform`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        plan_doc_id: planDocId,
                        target_platform: value,
                    }),
                });

                if (!response.ok) {
                    console.error('[타겟 플랫폼 업데이트 실패]', await response.text());
                }
            } catch (error) {
                console.error('[타겟 플랫폼 업데이트 오류]', error);
            }
        },
        [apiBase]
    );

    /** 다음: 기획안 수정 및 확정 → modify API 호출 후 Modify 페이지로 이동 */
    const handleNextToModify = useCallback(async () => {
        const docId = planDocId || localStorage.getItem('current_plan_doc_id');
        if (!docId) {
            alert(
                t('aiPlan.productAnalysis.productAnalysisPage.toastPlanDocIdNotFound') ||
                    'plan_doc_id를 찾을 수 없습니다.'
            );
            return;
        }

        let selectedPlanForApi = null;
        if (deepAnalysisTargetIds.length > 0) {
            // 심층 분석 후: 최종 기획안 탭에서 선택한 기획안 (전체 reels plan이 있으면 사용)
            const fromDeep = selectedFinalPlanFromDeepAnalysis;
            if (!fromDeep) {
                setShowFinalPlanWarningModal(true);
                return;
            }
            selectedPlanForApi = allReelsPlans.find((p) => String(p.id) === String(fromDeep.id)) || fromDeep;
        } else {
            // 심층 분석 전: AI 추천 기획안 카드에서 선택한 기획안
            if (!selectedPlan) {
                setShowSelectPlanModal(true);
                return;
            }
            selectedPlanForApi = recommendedPlans.find((p) => p.id === selectedPlan) || null;
            if (!selectedPlanForApi) {
                setShowPlanNotFoundModal(true);
                return;
            }
        }

        setIsModifyProcessing(true);
        try {
            let promotionText = null;
            try {
                const analysisRes = await fetch(`${apiBase}/ai-plan/analysis?plan_doc_id=${docId}`);
                if (analysisRes.ok) {
                    const analysisJson = await analysisRes.json();
                    if (analysisJson.success && analysisJson.data?.promotion_text) {
                        promotionText = analysisJson.data.promotion_text;
                    }
                }
            } catch (_) {}

            const channelInsights = {};
            for (const platform of ['youtube', 'tiktok', 'instagram']) {
                try {
                    const topRes = await fetch(
                        `${apiBase}/ai-plan/top-content?plan_doc_id=${docId}&platform=${platform}`
                    );
                    if (topRes.ok) {
                        const topJson = await topRes.json();
                        const list = topJson?.data || topJson?.list || [];
                        if (list.length > 0 && list[0].ai_channel_summary) {
                            channelInsights[platform] = list[0].ai_channel_summary;
                        }
                    }
                } catch (_) {}
            }

            const modifyRes = await fetch(`${apiBase}/ai-plan/modify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_doc_id: docId,
                    selected_plan: selectedPlanForApi,
                    promotion_text: promotionText,
                    channel_insights: channelInsights,
                }),
            });

            if (!modifyRes.ok) {
                const errData = await modifyRes.json().catch(() => ({}));
                throw new Error(errData.error || '기획안 수정 요청이 실패했습니다.');
            }
            const modifyResult = await modifyRes.json();
            if (!modifyResult.success) {
                throw new Error(modifyResult.error || '기획안 수정 요청이 실패했습니다.');
            }

            localStorage.setItem('can_access_modify', 'true');

            if (navigateToPage) {
                navigateToPage('Modify');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }
        } catch (err) {
            alert(err.message || '기획안 수정 요청 중 오류가 발생했습니다.');
        } finally {
            setIsModifyProcessing(false);
        }
    }, [
        planDocId,
        deepAnalysisTargetIds.length,
        selectedFinalPlanFromDeepAnalysis,
        selectedPlan,
        recommendedPlans,
        allReelsPlans,
        apiBase,
        navigateToPage,
        t,
    ]);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div style={{ width: '15%', flexShrink: 0, borderRight: '1px solid #e5e7eb' }}>
                <Sidebar
                    currentPage="influencer-analysis"
                    navigateToPage={navigateToPage}
                    completionStatus={completionStatus}
                />
            </div>
            <div style={{ width: '85%', flexShrink: 0 }}>
                <div style={{ backgroundColor: '#FFFFFF' }}>
                    <Header
                        title={t('aiPlan.influencerAnalysis.pageTitle')}
                        onLogout={handleLogout}
                        showBackButton={false}
                        onBackToDashboard={onBack}
                        user={user}
                        noBorder={true}
                    />
                </div>
                <StepProgressBar currentStep={3} attached={true} />
                {/* 현재 단계 정보 카드 */}
                <CurrentStepCard
                    icon={Users}
                    title={t('aiPlan.influencerAnalysis.title')}
                    description={t('aiPlan.influencerAnalysis.description')}
                    attached={true}
                />

                <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 80px)' }}>
                    <main className="p-8 mx-auto" style={{ maxWidth: '90%' }}>
                        {/* 이렇게 사용해보세요! 섹션 */}
                        <InformationSection />

                        {/* 인플루언서 리스트 업로드 섹션 */}
                        <UploadSection
                            user={user}
                            onAnalysisStarted={handleAnalysisStarted}
                            onRefetchList={(urls) => fetchInfluencerList(false, urls)}
                        />

                        {/* 인플루언서 리스트 섹션 */}
                        <div>
                            {listError && (
                                <div
                                    className="mb-4 p-3 rounded-lg"
                                    style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '14px' }}
                                >
                                    {listError}
                                </div>
                            )}
                            {listLoading && (
                                <p style={{ marginBottom: '12px', fontSize: '14px', color: '#6B7280' }}>
                                    인플루언서 리스트 불러오는 중...
                                </p>
                            )}
                            <FilterSection
                                categories={categories}
                                contentTypes={contentTypes}
                                selectedCategory={selectedCategory}
                                selectedContentType={selectedContentType}
                                onCategoryChange={setSelectedCategory}
                                onContentTypeChange={setSelectedContentType}
                                selectedInfluencers={selectedInfluencers}
                            />

                            <InfluencerList
                                influencers={filteredInfluencers}
                                selectedInfluencers={selectedInfluencers}
                                onToggle={handleInfluencerToggle}
                                getCategoryColor={getCategoryColor}
                            />

                            {/* 액션 버튼들 */}
                            {saveMessage && (
                                <p
                                    style={{
                                        fontSize: '14px',
                                        color: saveMessageType === 'error' ? '#DC2626' : '#059669',
                                        marginTop: '16px',
                                        marginBottom: '8px',
                                    }}
                                >
                                    {saveMessage}
                                </p>
                            )}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    marginTop: '12px',
                                    marginBottom: '16px',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={handleSaveSelected}
                                    disabled={selectedInfluencers.length === 0 || saveLoading}
                                    style={{
                                        flex: 1,
                                        padding: '16px',
                                        backgroundColor:
                                            selectedInfluencers.length > 0 && !saveLoading ? '#E9D5FF' : '#E5E7EB',
                                        color: selectedInfluencers.length > 0 && !saveLoading ? '#7C3AED' : '#9CA3AF',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor:
                                            selectedInfluencers.length > 0 && !saveLoading ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedInfluencers.length > 0 && !saveLoading)
                                            e.currentTarget.style.backgroundColor = '#DDD6FE';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedInfluencers.length > 0 && !saveLoading)
                                            e.currentTarget.style.backgroundColor = '#E9D5FF';
                                    }}
                                >
                                    <Download className="w-4 h-4" />
                                    {saveLoading
                                        ? t('aiPlan.influencerAnalysis.saving') || '저장 중...'
                                        : t('aiPlan.influencerAnalysis.saveAnalyzed')}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleUnsaveSelected}
                                    disabled={savedSelectedCount === 0 || manageLoading}
                                    style={{
                                        flex: 1,
                                        padding: '16px',
                                        backgroundColor:
                                            savedSelectedCount > 0 && !manageLoading ? '#FFFFFF' : '#F3F4F6',
                                        color: '#4B5563',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: savedSelectedCount > 0 && !manageLoading ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (savedSelectedCount > 0 && !manageLoading) {
                                            e.currentTarget.style.backgroundColor = '#F9FAFB';
                                            e.currentTarget.style.borderColor = '#C4B5FD';
                                            e.currentTarget.style.color = '#7C3AED';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (savedSelectedCount > 0 && !manageLoading) {
                                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                                            e.currentTarget.style.borderColor = '#D1D5DB';
                                            e.currentTarget.style.color = '#4B5563';
                                        }
                                    }}
                                >
                                    {manageLoading
                                        ? t('aiPlan.influencerAnalysis.manageLoading') || '취소 중...'
                                        : t('aiPlan.influencerAnalysis.manageSaved') || '저장 취소'}
                                </button>
                            </div>

                            {deepAnalysisMessage && (
                                <p
                                    style={{
                                        fontSize: '14px',
                                        color: deepAnalysisMessageType === 'error' ? '#DC2626' : '#059669',
                                        marginBottom: '8px',
                                    }}
                                >
                                    {deepAnalysisMessage}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={handleDeepAnalysis}
                                disabled={selectedInfluencers.length === 0 || deepAnalysisLoading}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background:
                                        selectedInfluencers.length > 0 && !deepAnalysisLoading
                                            ? 'linear-gradient(135deg, #B9A8FF 0%, #9F7AEA 100%)'
                                            : '#E5E7EB',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor:
                                        selectedInfluencers.length > 0 && !deepAnalysisLoading
                                            ? 'pointer'
                                            : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    boxShadow:
                                        selectedInfluencers.length > 0 && !deepAnalysisLoading
                                            ? '0 4px 6px rgba(185, 168, 255, 0.3)'
                                            : 'none',
                                    opacity: selectedInfluencers.length > 0 && !deepAnalysisLoading ? 1 : 0.6,
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedInfluencers.length > 0 && !deepAnalysisLoading) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(185, 168, 255, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedInfluencers.length > 0 && !deepAnalysisLoading) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(185, 168, 255, 0.3)';
                                    }
                                }}
                            >
                                <Sparkles className="w-5 h-5" />
                                {deepAnalysisLoading
                                    ? t('aiPlan.influencerAnalysis.deepAnalysisLoading') || '요청 중...'
                                    : t('aiPlan.influencerAnalysis.deepAnalysis')}
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            {/* 인플루언서 상세 분석 섹션 */}
                            {expandedInfluencer && (
                                <InfluencerDetailAnalysis
                                    influencer={expandedInfluencer}
                                    allInfluencers={filteredInfluencers}
                                    analysisTargetIds={deepAnalysisTargetIds}
                                    onSelectInfluencer={(id) => {
                                        const next = filteredInfluencers.find((inf) => inf.id === id);
                                        if (next) setExpandedInfluencer(next);
                                    }}
                                    onClose={() => setExpandedInfluencer(null)}
                                    onSelectedFinalPlanChange={setSelectedFinalPlanFromDeepAnalysis}
                                    allReelsPlans={allReelsPlans}
                                />
                            )}

                            {/* AI 추천 기획안 섹션 - 심층 분석 전에만 표시 */}
                            {deepAnalysisTargetIds.length === 0 && (
                                <div style={{ marginTop: '40px', marginBottom: '30px' }}>
                                    <div className="flex items-center gap-2 mb-6">
                                        <Sparkles
                                            className="w-5 h-5 text-white"
                                            style={{ color: '#9333ea', marginBottom: '10px' }}
                                        />
                                        <h2
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: '700',
                                                color: '#111827',
                                                marginBottom: '10px',
                                            }}
                                        >
                                            {t('aiPlan.influencerAnalysis.aiRecommendations')}
                                        </h2>
                                    </div>

                                    {/* 기획안 카드들 */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                                            gap: '16px',
                                            marginBottom: '20px',
                                        }}
                                    >
                                        {recommendedPlans.length === 0 ? (
                                            <div
                                                style={{
                                                    padding: '40px',
                                                    textAlign: 'center',
                                                    color: '#6B7280',
                                                    fontSize: '14px',
                                                    gridColumn: '1 / -1',
                                                }}
                                            >
                                                {!allReelsPlans || allReelsPlans.length === 0
                                                    ? t('aiPlan.influencerAnalysis.plansLoading')
                                                    : selectedContentType === 'all'
                                                    ? t('aiPlan.influencerAnalysis.selectContentType')
                                                    : t('aiPlan.influencerAnalysis.noPlansForType')}
                                            </div>
                                        ) : (
                                            recommendedPlans.map((plan) => {
                                                const isSelected = selectedPlan === plan.id;
                                                return (
                                                    <div
                                                        key={plan.id}
                                                        onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
                                                        style={{
                                                            position: 'relative',
                                                            border: isSelected
                                                                ? '2px solid #B9A8FF'
                                                                : '1px solid #E5E7EB',
                                                            borderRadius: '12px',
                                                            padding: '18px',
                                                            backgroundColor: '#FFFFFF',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: isSelected
                                                                ? '0 4px 12px rgba(185, 168, 255, 0.2)'
                                                                : 'none',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isSelected) {
                                                                e.currentTarget.style.boxShadow =
                                                                    '0 2px 8px rgba(0, 0, 0, 0.08)';
                                                                e.currentTarget.style.borderColor = '#D1C4FF';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isSelected) {
                                                                e.currentTarget.style.boxShadow = 'none';
                                                                e.currentTarget.style.borderColor = '#E5E7EB';
                                                            }
                                                        }}
                                                    >
                                                        {/* 체크 아이콘 */}
                                                        {isSelected && (
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '12px',
                                                                    right: '12px',
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: '#B9A8FF',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <CheckCircle
                                                                    className="w-4 h-4"
                                                                    style={{ color: '#FFFFFF', fill: '#B9A8FF' }}
                                                                />
                                                            </div>
                                                        )}

                                                        <h3
                                                            style={{
                                                                fontSize: '15px',
                                                                fontWeight: '700',
                                                                color: isSelected ? '#7C3AED' : '#111827',
                                                                marginBottom: '8px',
                                                            }}
                                                        >
                                                            {plan.displayTitle || plan.title}
                                                        </h3>

                                                        <p
                                                            style={{
                                                                fontSize: '13px',
                                                                color: '#6B7280',
                                                                marginBottom: '12px',
                                                                fontWeight: '500',
                                                            }}
                                                        >
                                                            {plan.subtitle}
                                                        </p>

                                                        {plan.hook && (
                                                            <div style={{ marginBottom: '10px' }}>
                                                                <p
                                                                    style={{
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        color: '#6B7280',
                                                                        marginBottom: '3px',
                                                                    }}
                                                                >
                                                                    {t('aiPlan.influencerAnalysis.sceneSetup')}
                                                                </p>
                                                                <p
                                                                    style={{
                                                                        fontSize: '13px',
                                                                        color: '#374151',
                                                                        lineHeight: '1.5',
                                                                    }}
                                                                >
                                                                    {plan.hook}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {plan.usp && (
                                                            <div style={{ marginBottom: '10px' }}>
                                                                <p
                                                                    style={{
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        color: '#6B7280',
                                                                        marginBottom: '3px',
                                                                    }}
                                                                >
                                                                    {t('aiPlan.influencerAnalysis.dropUSP')}
                                                                </p>
                                                                <p
                                                                    style={{
                                                                        fontSize: '13px',
                                                                        color: '#374151',
                                                                        lineHeight: '1.5',
                                                                    }}
                                                                >
                                                                    {plan.usp}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {plan.message && (
                                                            <div style={{ marginBottom: '10px' }}>
                                                                <p
                                                                    style={{
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        color: '#6B7280',
                                                                        marginBottom: '3px',
                                                                    }}
                                                                >
                                                                    {t('aiPlan.influencerAnalysis.closingCTA')}
                                                                </p>
                                                                <p
                                                                    style={{
                                                                        fontSize: '13px',
                                                                        color: '#374151',
                                                                        lineHeight: '1.5',
                                                                    }}
                                                                >
                                                                    {plan.message}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SNS 채널 선택 - 이전단계/다음 버튼 위에 배치 */}
                            <div style={{ marginTop: '30px', marginBottom: '20px' }}>
                                <ChannelSelector
                                    selectedChannel={selectedChannel}
                                    onChannelChange={handleChannelChange}
                                />
                            </div>

                            {/* 하단 네비게이션 버튼들 */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px',
                                    paddingTop: '30px',
                                    borderTop: '1px solid #E5E7EB',
                                    marginTop: '20px',
                                }}
                            >
                                <button
                                    onClick={() => navigateToPage('ProductAnalysis')}
                                    style={{
                                        padding: '14px 20px',
                                        backgroundColor: '#FFFFFF',
                                        color: '#6B7280',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    }}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    {t('app.buttons.previousStep')}
                                </button>

                                <button
                                    onClick={handleNextToModify}
                                    disabled={isModifyProcessing}
                                    style={{
                                        padding: '14px 20px',
                                        backgroundColor: isModifyProcessing ? '#d1d5db' : '#B9A8FF',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: isModifyProcessing ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'background-color 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isModifyProcessing) {
                                            e.currentTarget.style.backgroundColor = '#A08FFF';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isModifyProcessing) {
                                            e.currentTarget.style.backgroundColor = '#B9A8FF';
                                        }
                                    }}
                                >
                                    {isModifyProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>
                                                {t('aiPlan.productAnalysis.productAnalysisPage.processing') ||
                                                    '분석 진행 중...'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {t('aiPlan.influencerAnalysis.nextStep')}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* AI 심층 분석 진행 중 팝업 */}
            <AnalysisLoadingDialog
                open={deepAnalysisLoading}
                title={t('aiPlan.influencerAnalysis.deepAnalysisInProgress')}
                description={t('aiPlan.influencerAnalysis.deepAnalysisInProgressDescription')}
            />

            {/* 기획안 수정 진행 중 팝업 */}
            <AnalysisLoadingDialog
                open={isModifyProcessing}
                title={t('aiPlan.influencerAnalysis.modifyDialogTitle')}
                description={t('aiPlan.influencerAnalysis.modifyDialogDescription')}
            />

            {/* 최종 기획안 미선택 경고 모달 */}
            <Dialog open={showFinalPlanWarningModal} onOpenChange={setShowFinalPlanWarningModal}>
                <DialogContent
                    style={{
                        maxWidth: '500px',
                        padding: '0',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: 'none',
                    }}
                >
                    <div style={{ padding: '32px' }}>
                        {/* 헤더 */}
                        <div style={{ marginBottom: '24px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: '#FEF3C7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <AlertTriangle size={24} style={{ color: '#F59E0B' }} />
                                </div>
                            </div>
                            <h2
                                style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#111827',
                                    textAlign: 'center',
                                    marginBottom: '8px',
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.finalPlanWarningTitle')}
                            </h2>
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#6B7280',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.finalPlanWarningLine1')}
                                <br />
                                <strong style={{ color: '#374151' }}>
                                    {t('aiPlan.influencerAnalysis.finalPlanWarningBold')}
                                </strong>
                                {t('aiPlan.influencerAnalysis.finalPlanWarningLine2')}
                            </p>
                        </div>

                        {/* 버튼 */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowFinalPlanWarningModal(false)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: '#B9A8FF',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#A08FFF';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#B9A8FF';
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.confirm')}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 기획안 선택 필요 알림 모달 */}
            <Dialog open={showSelectPlanModal} onOpenChange={setShowSelectPlanModal}>
                <DialogContent
                    style={{
                        maxWidth: '500px',
                        padding: '0',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: 'none',
                    }}
                >
                    <div style={{ padding: '32px' }}>
                        {/* 헤더 */}
                        <div style={{ marginBottom: '24px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: '#FEF3C7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <AlertTriangle size={24} style={{ color: '#F59E0B' }} />
                                </div>
                            </div>
                            <h2
                                style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#111827',
                                    textAlign: 'center',
                                    marginBottom: '8px',
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.selectPlanModalTitle')}
                            </h2>
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#6B7280',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.selectPlanModalLine1')}
                                <br />
                                <strong style={{ color: '#374151' }}>
                                    {t('aiPlan.influencerAnalysis.selectPlanModalBold')}
                                </strong>
                                {t('aiPlan.influencerAnalysis.selectPlanModalLine2')}
                            </p>
                        </div>

                        {/* 버튼 */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowSelectPlanModal(false)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: '#B9A8FF',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#A08FFF';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#B9A8FF';
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.confirm')}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 기획안을 찾을 수 없음 알림 모달 */}
            <Dialog open={showPlanNotFoundModal} onOpenChange={setShowPlanNotFoundModal}>
                <DialogContent
                    style={{
                        maxWidth: '500px',
                        padding: '0',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: 'none',
                    }}
                >
                    <div style={{ padding: '32px' }}>
                        {/* 헤더 */}
                        <div style={{ marginBottom: '24px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: '#FEE2E2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <AlertTriangle size={24} style={{ color: '#DC2626' }} />
                                </div>
                            </div>
                            <h2
                                style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#111827',
                                    textAlign: 'center',
                                    marginBottom: '8px',
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.planNotFoundModalTitle')}
                            </h2>
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#6B7280',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.planNotFoundModalDescription')
                                    .split('\n')
                                    .map((line, i) => (
                                        <span key={i}>
                                            {i > 0 && <br />}
                                            {line}
                                        </span>
                                    ))}
                            </p>
                        </div>

                        {/* 버튼 */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowPlanNotFoundModal(false)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: '#B9A8FF',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#A08FFF';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#B9A8FF';
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.confirm')}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
