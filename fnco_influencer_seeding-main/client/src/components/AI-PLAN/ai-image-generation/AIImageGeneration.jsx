import { useState, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { Header } from '../Header.jsx';
import { Sidebar } from '../Sidebar.jsx';
import { ArrowLeft, ArrowRight, Wand2, Sparkles, Trash2, SkipForward } from 'lucide-react';
import { useTranslation, useRegion } from '../../../hooks/useTranslation.js';
import { CurrentStepCard } from '../CurrentStepCard.jsx';
import { StepProgressBar } from '../StepProgressBar.jsx';
import { StepSelector } from './StepSelector.jsx';
import { ScenarioInfo } from './ScenarioInfo.jsx';
import { StepContent } from './StepContent.jsx';
import { StyleSettings } from './StyleSettings.jsx';
import { ProductImageAttachment } from './ProductImageAttachment.jsx';
import { AIPrompt } from './AIPrompt.jsx';
import { GeneratedImages } from './GeneratedImages.jsx';

// 시나리오 타임라인 구간 → STEP 매핑 (초 단위): 00–03s STEP1, 03–09s STEP2, 09–13s STEP3, 13–15s STEP4
const STEP_TIME_RANGES = [
    { start: 0, end: 3 }, // STEP 1 HOOK
    { start: 3, end: 9 }, // STEP 2 MIDDLE
    { start: 9, end: 13 }, // STEP 3
    { start: 13, end: 15 }, // STEP 4
];

function buildScenarioStepsFromTimeline(timeline) {
    if (!Array.isArray(timeline) || timeline.length === 0) return null;
    const steps = { 1: {}, 2: {}, 3: {}, 4: {} };
    STEP_TIME_RANGES.forEach((range, index) => {
        const stepNum = index + 1;
        const cuts = timeline.filter(
            (cut) => (cut.time_start_sec ?? 0) < range.end && (cut.time_end_sec ?? 0) > range.start
        );
        const visual =
            cuts
                .map((c) => c.visual_action_md)
                .filter(Boolean)
                .join('\n\n') || '';
        const audio =
            cuts
                .map((c) => c.audio_md)
                .filter(Boolean)
                .join('\n\n') || '';
        const emotion =
            cuts
                .map((c) => c.emotion_md)
                .filter(Boolean)
                .join('\n\n') || '';
        steps[stepNum] = { visual, audio, emotion };
    });
    return steps;
}

export function AIImageGeneration({ navigateToPage, user, onLogout, onBack, completionStatus }) {
    const t = useTranslation();
    const currentRegion = useRegion();
    const [activeStep, setActiveStep] = useState(1); // 1: Hook, 2: Middle, 3: Highlight, 4: CTA
    const [selectedStyle, setSelectedStyle] = useState(() => t('aiPlan.aiImageGeneration.friendly'));

    const defaultPromptText = t('aiPlan.aiImageGeneration.defaultPromptText');

    const [aiPromptByStep, setAiPromptByStep] = useState(() => {
        const text = t('aiPlan.aiImageGeneration.defaultPromptText');
        return {
            1: text,
            2: text,
            3: text,
            4: text,
        };
    });
    const initialStepKeys = { 1: [], 2: [], 3: [], 4: [] };
    const [generatedImagesByStep, setGeneratedImagesByStep] = useState(() => ({ ...initialStepKeys }));
    const [selectedImagesByStep, setSelectedImagesByStep] = useState(() => ({ ...initialStepKeys }));
    const [savedImagesByStep, setSavedImagesByStep] = useState(() => ({ ...initialStepKeys })); // STEP별 저장 (최대 3개/스텝)
    const [hoveredSavedId, setHoveredSavedId] = useState(null);
    const [productInfo, setProductInfo] = useState(null); // { category, subcategory, product_name }
    const [refinedData, setRefinedData] = useState(null);
    const [productImages, setProductImages] = useState([]); // 제품 참고 이미지 (File[])
    const [generatePromptLoading, setGeneratePromptLoading] = useState(false);
    const [generateImageLoading, setGenerateImageLoading] = useState(false);

    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const STORAGE_KEY_PREFIX = 'ai_image_gen_';

    // 새로고침 시 복원: plan_doc_id 기준으로 localStorage에서 로드
    useEffect(() => {
        if (typeof localStorage === 'undefined') return;
        const planDocId = localStorage.getItem('current_plan_doc_id');
        if (!planDocId) return;
        try {
            const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${planDocId}`);
            if (!raw) return;
            const data = JSON.parse(raw);
            // STEP별 AI 프롬프트 복원
            if (data.prompts && typeof data.prompts === 'object') {
                setAiPromptByStep((prev) => {
                    const next = { ...prev };
                    [1, 2, 3, 4].forEach((s) => {
                        if (data.prompts[s] != null && typeof data.prompts[s] === 'string') {
                            next[s] = data.prompts[s];
                        }
                    });
                    return next;
                });
            }
            if (data.generated && typeof data.generated === 'object') {
                const normalized = { 1: [], 2: [], 3: [], 4: [] };
                [1, 2, 3, 4].forEach((s) => {
                    const arr = data.generated[s];
                    normalized[s] = Array.isArray(arr) ? arr.filter((i) => i && (i.id || i.url)) : [];
                });
                setGeneratedImagesByStep(normalized);
            }
            if (data.saved && typeof data.saved === 'object') {
                const normalized = { 1: [], 2: [], 3: [], 4: [] };
                [1, 2, 3, 4].forEach((s) => {
                    const arr = data.saved[s];
                    normalized[s] = Array.isArray(arr) ? arr.filter((i) => i && (i.id || i.url)) : [];
                });
                setSavedImagesByStep(normalized);
            }
        } catch (e) {
            console.warn('[AI 이미지 생성] localStorage 복원 실패', e);
        }
    }, []);

    // 변경 시 plan_doc_id 기준으로 localStorage에 저장 (프롬프트 + 생성/저장된 이미지, 새로고침 후 유지)
    useEffect(() => {
        if (typeof localStorage === 'undefined') return;
        const planDocId = localStorage.getItem('current_plan_doc_id');
        if (!planDocId) return;
        try {
            const payload = {
                prompts: aiPromptByStep, // STEP별 AI 프롬프트
                generated: generatedImagesByStep,
                saved: savedImagesByStep,
            };
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${planDocId}`, JSON.stringify(payload));
        } catch (e) {
            console.warn('[AI 이미지 생성] localStorage 저장 실패', e);
        }
    }, [aiPromptByStep, generatedImagesByStep, savedImagesByStep]);

    useEffect(() => {
        const planDocId = typeof localStorage !== 'undefined' ? localStorage.getItem('current_plan_doc_id') : null;
        if (!planDocId || !apiBase) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${apiBase}/ai-plan/plan-product?plan_doc_id=${encodeURIComponent(planDocId)}`);
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (!cancelled) setProductInfo(data);
            } catch (err) {
                if (!cancelled) console.error('[생성 제품 조회]', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [apiBase]);

    // refined 데이터 조회 (시나리오 섹션 사용)
    useEffect(() => {
        const planDocId = typeof localStorage !== 'undefined' ? localStorage.getItem('current_plan_doc_id') : null;
        if (!planDocId || !apiBase) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${apiBase}/ai-plan/refined?plan_doc_id=${encodeURIComponent(planDocId)}`);
                if (!res.ok || cancelled) return;
                const result = await res.json();
                if (!cancelled && result?.data) setRefinedData(result.data);
            } catch (err) {
                if (!cancelled) console.error('[refined 조회]', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [apiBase]);

    // 시나리오 섹션(현재 언어) → STEP 1~4 데이터 (00–03s, 03–09s, 09–13s, 13–15s)
    const scenarioData = useMemo(() => {
        const defaultTitle = t('aiPlan.aiImageGeneration.defaultScenarioTitle');
        const defaultRunningTime = t('aiPlan.aiImageGeneration.runningTimeFormat', { seconds: 15 });
        const defaultSteps = {
            1: { visual: '', audio: '', emotion: '' },
            2: { visual: '', audio: '', emotion: '' },
            3: { visual: '', audio: '', emotion: '' },
            4: { visual: '', audio: '', emotion: '' },
        };

        if (!refinedData?.sections) {
            return { title: defaultTitle, runningTime: defaultRunningTime, steps: defaultSteps };
        }
        const section = refinedData.sections.find((s) => s.key === 'scenario');
        if (!section) return { title: defaultTitle, runningTime: defaultRunningTime, steps: defaultSteps };

        const langKey = currentRegion === 'china' ? 'cn' : currentRegion === 'global' ? 'eng' : 'ko';
        const sectionData = section.data?.[langKey] || section.data?.ko || section.data || {};
        const timeline = sectionData.timeline;
        const builtSteps = buildScenarioStepsFromTimeline(timeline);

        const title = sectionData.scenario_title || sectionData.scenario_title_raw || defaultTitle;
        const runtimeSec =
            sectionData.runtime_sec ?? (timeline?.length ? timeline[timeline.length - 1]?.time_end_sec ?? 15 : 15);
        const runningTime = t('aiPlan.aiImageGeneration.runningTimeFormat', { seconds: runtimeSec });

        return {
            title,
            runningTime,
            steps: builtSteps || defaultSteps,
        };
    }, [refinedData, currentRegion, t]);

    const handleStyleChange = (style) => {
        setSelectedStyle(style);
    };

    // AI 프롬프트 생성: POST /api/ai-image/generate-prompt (현재 STEP 기준)
    const handleGeneratePrompt = async () => {
        if (!apiBase) {
            console.warn('[AI 프롬프트 생성] API Base가 없습니다.');
            return;
        }
        const stepData = scenarioData.steps[activeStep] || { visual: '', audio: '', emotion: '' };
        const stepLabels = {
            1: t('aiPlan.aiImageGeneration.step1'),
            2: t('aiPlan.aiImageGeneration.step2'),
            3: t('aiPlan.aiImageGeneration.step3'),
            4: t('aiPlan.aiImageGeneration.step4'),
        };
        const payload = {
            product: {
                category: productInfo?.category ?? '',
                subcategory: productInfo?.subcategory ?? '',
                product_name: productInfo?.product_name ?? '',
            },
            step: {
                step_number: activeStep,
                step_label: stepLabels[activeStep] || `STEP ${activeStep}`,
                visual_action: stepData.visual ?? '',
                audio_narration: stepData.audio ?? '',
                emotion_note: stepData.emotion ?? '',
            },
            style: selectedStyle ?? '',
        };
        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload));
        (productImages || []).forEach((file) => {
            formData.append('images', file);
        });
        flushSync(() => setGeneratePromptLoading(true));
        try {
            const res = await fetch(`${apiBase}/ai-image/generate-prompt`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || `HTTP ${res.status}`);
            }
            const data = await res.json();
            if (data?.prompt != null) setAiPromptByStep((prev) => ({ ...prev, [activeStep]: String(data.prompt) }));
        } catch (err) {
            console.error('[AI 프롬프트 생성]', err);
        } finally {
            setGeneratePromptLoading(false);
        }
    };

    // 이미지 생성: POST /api/ai-image/generate-image (프롬프트 → FastAPI Imagen → 이미지 표시)
    const handleGenerate = async () => {
        const currentPrompt = aiPromptByStep[activeStep] ?? '';
        if (!apiBase || !currentPrompt?.trim()) {
            console.warn('[이미지 생성] API Base 또는 프롬프트가 없습니다.');
            return;
        }
        flushSync(() => setGenerateImageLoading(true));
        try {
            const planDocId = typeof localStorage !== 'undefined' ? localStorage.getItem('current_plan_doc_id') : null;
            const res = await fetch(`${apiBase}/ai-image/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: currentPrompt.trim(),
                    step_number: activeStep,
                    num_images: 4,
                    ...(planDocId ? { plan_doc_id: planDocId } : {}),
                    ...(user?.email || user?.name ? { created_by: user?.email ?? user?.name ?? '' } : {}),
                }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.details || errData?.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            const rawImages = data?.images ?? [];
            const mapped = rawImages.map((img) => ({
                id: img.id ?? `${activeStep}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                url: img.url ?? '',
                step: activeStep,
            }));
            setGeneratedImagesByStep((prev) => ({ ...prev, [activeStep]: mapped }));
            setSelectedImagesByStep((prev) => ({ ...prev, [activeStep]: [] }));
        } catch (err) {
            console.error('[이미지 생성]', err);
        } finally {
            setGenerateImageLoading(false);
        }
    };

    const handleImageSelect = (imageId) => {
        const images = generatedImagesByStep[activeStep] || [];
        const image = images.find((img) => img.id === imageId);
        const current = selectedImagesByStep[activeStep] || [];
        const wasSelected = current.includes(imageId);
        const newSelected = !wasSelected; // true = 선택, false = 해제

        setSelectedImagesByStep((prev) => {
            const cur = prev[activeStep] || [];
            return {
                ...prev,
                [activeStep]: wasSelected ? cur.filter((id) => id !== imageId) : [...cur, imageId],
            };
        });

        // dw_plan_ai_image.is_selected 반영 (img_url로 행 구별)
        if (apiBase && image?.url) {
            const planDocId = typeof localStorage !== 'undefined' ? localStorage.getItem('current_plan_doc_id') : null;
            fetch(`${apiBase}/ai-image/image/select`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    img_url: image.url,
                    is_selected: newSelected,
                    ...(planDocId ? { plan_doc_id: planDocId } : {}),
                    step: activeStep,
                }),
            }).catch((err) => console.error('[이미지 선택 DB 반영]', err));
        }
    };

    const handleSave = () => {
        const generated = generatedImagesByStep[activeStep] || [];
        const selected = selectedImagesByStep[activeStep] || [];
        const previousSaved = savedImagesByStep[activeStep] || [];
        const newlySelected = generated.filter((img) => selected.includes(img.id));

        // 이전에 저장한 이미지 + 이번에 선택한 이미지 합치기 (중복 제거, 최대 3개)
        const seen = new Set();
        const merged = [];
        [...previousSaved, ...newlySelected].forEach((img) => {
            const key = img.id || img.url || '';
            if (key && !seen.has(key)) {
                seen.add(key);
                merged.push(img);
            }
        });
        const toSave = merged.slice(0, 3);

        setSavedImagesByStep((prev) => ({ ...prev, [activeStep]: toSave }));

        // DB: 저장 목록(toSave)은 is_selected = true, 현재 생성 목록 중 비저장은 false
        if (!apiBase) return;
        const planDocId = typeof localStorage !== 'undefined' ? localStorage.getItem('current_plan_doc_id') : null;
        const saveUrls = new Set(toSave.map((img) => img.url).filter(Boolean));
        const saveIds = new Set(toSave.map((img) => img.id).filter(Boolean));
        toSave.forEach((img) => {
            if (!img?.url) return;
            fetch(`${apiBase}/ai-image/image/select`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    img_url: img.url,
                    is_selected: true,
                    ...(planDocId ? { plan_doc_id: planDocId } : {}),
                    step: activeStep,
                }),
            }).catch((err) => console.error('[저장하기 DB 반영]', err));
        });
        generated.forEach((img) => {
            if (!img?.url || saveUrls.has(img.url) || saveIds.has(img.id)) return;
            fetch(`${apiBase}/ai-image/image/select`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    img_url: img.url,
                    is_selected: false,
                    ...(planDocId ? { plan_doc_id: planDocId } : {}),
                    step: activeStep,
                }),
            }).catch((err) => console.error('[저장하기 DB 반영]', err));
        });
    };

    const handleRemoveSavedImage = (imageId) => {
        const saved = savedImagesByStep[activeStep] || [];
        const image = saved.find((img) => img.id === imageId);

        setSavedImagesByStep((prev) => ({
            ...prev,
            [activeStep]: (prev[activeStep] || []).filter((img) => img.id !== imageId),
        }));

        // 저장된 이미지 삭제 시 DB에서 is_selected = false 로 변경
        if (apiBase && image?.url) {
            const planDocId = typeof localStorage !== 'undefined' ? localStorage.getItem('current_plan_doc_id') : null;
            fetch(`${apiBase}/ai-image/image/select`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    img_url: image.url,
                    is_selected: false,
                    ...(planDocId ? { plan_doc_id: planDocId } : {}),
                    step: activeStep,
                }),
            }).catch((err) => console.error('[저장된 이미지 삭제 DB 반영]', err));
        }
    };

    const currentGeneratedImages = generatedImagesByStep[activeStep] || [];
    const currentSelectedImages = selectedImagesByStep[activeStep] || [];
    const currentSavedImages = savedImagesByStep[activeStep] || [];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div style={{ width: '15%', flexShrink: 0, borderRight: '1px solid #e5e7eb' }}>
                <Sidebar
                    currentPage="ai-image-generation"
                    navigateToPage={navigateToPage}
                    completionStatus={completionStatus}
                />
            </div>
            <div style={{ width: '85%', flexShrink: 0 }}>
                <div style={{ backgroundColor: '#FFFFFF' }}>
                    <Header
                        title={t('aiPlan.aiImageGeneration.pageTitle')}
                        user={user}
                        onLogout={onLogout}
                        showBackButton={false}
                        onBackToDashboard={onBack}
                    />
                </div>
                <StepProgressBar currentStep={5} attached={true} />
                {/* 현재 단계 정보 카드 & Skip 버튼 */}
                <div
                    className="no-print"
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderLeft: '1px solid #E5E7EB',
                        borderRight: '1px solid #E5E7EB',
                        borderBottom: '1px solid #E5E7EB',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                    }}
                >
                    {/* 아이콘 */}
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#B9A8FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Sparkles className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                    </div>
                    {/* 텍스트 (flex로 확장) */}
                    <div style={{ flex: 1 }}>
                        <h2
                            style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: '4px',
                            }}
                        >
                            {t('aiPlan.aiImageGeneration.pageTitle')}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'pre-line' }}>
                            {`${t('aiPlan.aiImageGeneration.description')}\n${t(
                                'aiPlan.aiImageGeneration.skipMessage'
                            )}`}
                        </p>
                    </div>
                    {/* Skip 버튼 */}
                    <button
                        onClick={() => navigateToPage('FinalReview')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 28px',
                            backgroundColor: '#EDE9FE',
                            color: '#7C3AED',
                            border: '2px solid #C4B5FD',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            marginRight: '90px',
                            boxShadow: '0 2px 4px rgba(124, 58, 237, 0.1)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#DDD6FE';
                            e.currentTarget.style.borderColor = '#A78BFA';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(124, 58, 237, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#EDE9FE';
                            e.currentTarget.style.borderColor = '#C4B5FD';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(124, 58, 237, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <span>SKIP</span>
                        <SkipForward size={18} />
                    </button>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 80px)' }}>
                    <main className="p-8 mx-auto" style={{ maxWidth: '90%' }}>
                        {/* 시나리오 정보 */}
                        <ScenarioInfo title={scenarioData.title} runningTime={scenarioData.runningTime} />

                        {/* STEP 선택 */}
                        <StepSelector activeStep={activeStep} onStepChange={setActiveStep} />

                        {/* 안내 메시지 */}
                        <div
                            style={{
                                backgroundColor: '#FEF3C7',
                                border: '1px solid #FCD34D',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>⚠️</span>
                            <div style={{ fontSize: '14px', color: '#92400E', lineHeight: '1.6', margin: 0 }}>
                                <p style={{ margin: 0, marginBottom: '4px' }}>
                                    {t('aiPlan.aiImageGeneration.instruction')}
                                </p>
                                <p style={{ margin: 0 }}>{t('aiPlan.aiImageGeneration.tipMessage')}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* 왼쪽: 생성 제품 + AI 이미지 생성 */}
                            <div>
                                {/* 생성 제품 - 스타일 설정하기 왼쪽, AI 이미지 생성 위 */}
                                <div
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        <Sparkles style={{ width: '16px', height: '16px', color: '#8B5CF6' }} />
                                        <h3
                                            style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}
                                        >
                                            {t('aiPlan.aiImageGeneration.productSectionTitle')}
                                        </h3>
                                    </div>
                                    {productInfo ? (
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '12px',
                                                fontSize: '13px',
                                                color: '#374151',
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontWeight: '600',
                                                        color: '#6B7280',
                                                        marginBottom: '6px',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    {t('aiPlan.aiImageGeneration.productCategory')}
                                                </div>
                                                <div
                                                    style={{
                                                        background: '#F5F3FF',
                                                        border: '1px solid #DDD6FE',
                                                        borderRadius: '8px',
                                                        padding: '8px 12px',
                                                        fontSize: '13px',
                                                        color: '#5B21B6',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    {productInfo.category || '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontWeight: '600',
                                                        color: '#6B7280',
                                                        marginBottom: '6px',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    {t('aiPlan.aiImageGeneration.productSubcategory')}
                                                </div>
                                                <div
                                                    style={{
                                                        background: '#F5F3FF',
                                                        border: '1px solid #DDD6FE',
                                                        borderRadius: '8px',
                                                        padding: '8px 12px',
                                                        fontSize: '13px',
                                                        color: '#5B21B6',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    {productInfo.subcategory || '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontWeight: '600',
                                                        color: '#6B7280',
                                                        marginBottom: '6px',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    {t('aiPlan.aiImageGeneration.productNameLabel')}
                                                </div>
                                                <div
                                                    style={{
                                                        background: '#F5F3FF',
                                                        border: '1px solid #DDD6FE',
                                                        borderRadius: '8px',
                                                        padding: '8px 12px',
                                                        fontSize: '13px',
                                                        color: '#5B21B6',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    {productInfo.product_name || '—'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                                            {t('aiPlan.aiImageGeneration.productSectionLoading')}
                                        </p>
                                    )}
                                </div>
                                {/* AI 이미지 생성 */}
                                <div
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        marginBottom: '24px',
                                    }}
                                >
                                    <h2
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: '#111827',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        {t('aiPlan.aiImageGeneration.sectionTitle')}
                                    </h2>
                                    <StepContent step={activeStep} data={scenarioData.steps[activeStep]} />
                                </div>
                                {/* 저장된 이미지 - 현재 STEP 기준, 저장하기 클릭 후 표시 */}
                                {currentSavedImages.length > 0 && (
                                    <div
                                        style={{
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '12px',
                                            padding: '24px',
                                            marginBottom: '24px',
                                        }}
                                    >
                                        <h3
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: '#111827',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            {t('aiPlan.aiImageGeneration.savedImagesTitle')} (STEP {activeStep})
                                        </h3>
                                        <p
                                            style={{
                                                fontSize: '13px',
                                                color: '#6B7280',
                                                marginBottom: '20px',
                                            }}
                                        >
                                            {t('aiPlan.aiImageGeneration.savedImagesMaxHint')}
                                        </p>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: '16px',
                                            }}
                                        >
                                            {currentSavedImages.map((img) => (
                                                <div
                                                    key={img.id}
                                                    onMouseEnter={() => setHoveredSavedId(img.id)}
                                                    onMouseLeave={() => setHoveredSavedId(null)}
                                                    style={{
                                                        position: 'relative',
                                                        aspectRatio: '9/16',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        border: '1px solid #E5E7EB',
                                                        backgroundColor: '#F9FAFB',
                                                    }}
                                                >
                                                    <img
                                                        src={img.url}
                                                        alt={`Saved ${img.id}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                    {hoveredSavedId === img.id && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                backgroundColor: 'rgba(0,0,0,0.4)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'opacity 0.2s ease',
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveSavedImage(img.id);
                                                                }}
                                                                style={{
                                                                    width: '44px',
                                                                    height: '44px',
                                                                    borderRadius: '50%',
                                                                    border: 'none',
                                                                    backgroundColor: '#EF4444',
                                                                    color: '#FFFFFF',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#DC2626';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#EF4444';
                                                                }}
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 오른쪽: 사이드바 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <StyleSettings selectedStyle={selectedStyle} onStyleChange={handleStyleChange} />
                                <ProductImageAttachment
                                    productImages={productImages}
                                    onProductImagesChange={setProductImages}
                                />
                                <AIPrompt
                                    activeStep={activeStep}
                                    prompt={aiPromptByStep[activeStep] ?? ''}
                                    onPromptChange={(value) =>
                                        setAiPromptByStep((prev) => ({ ...prev, [activeStep]: value }))
                                    }
                                    onGeneratePrompt={handleGeneratePrompt}
                                    isGeneratePromptLoading={generatePromptLoading}
                                    onGenerate={handleGenerate}
                                    isGenerateLoading={generateImageLoading}
                                    onRefresh={() =>
                                        setAiPromptByStep((prev) => ({ ...prev, [activeStep]: defaultPromptText }))
                                    }
                                />
                                {/* 생성된 이미지 섹션 */}
                                <GeneratedImages
                                    activeStep={activeStep}
                                    images={currentGeneratedImages}
                                    selectedImages={currentSelectedImages}
                                    onImageSelect={handleImageSelect}
                                    onSave={handleSave}
                                />
                            </div>
                        </div>

                        {/* 하단 네비게이션 버튼 */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginTop: '40px',
                                paddingTop: '24px',
                                borderTop: '1px solid #E5E7EB',
                            }}
                        >
                            <button
                                onClick={() => navigateToPage && navigateToPage('Modify')}
                                style={{
                                    padding: '14px 24px',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#374151',
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
                                <ArrowLeft className="w-5 h-5" />
                                {t('aiPlan.aiImageGeneration.previousStep')}
                            </button>

                            <button
                                onClick={() => navigateToPage && navigateToPage('FinalReview')}
                                style={{
                                    padding: '14px 24px',
                                    backgroundColor: '#B9A8FF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#FFFFFF',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#A08FFF';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#B9A8FF';
                                }}
                            >
                                {t('aiPlan.aiImageGeneration.nextStep')}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
