import { useState, useEffect, useMemo } from 'react';
import PptxGenJS from 'pptxgenjs';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { ArrowLeft, Download, CheckCircle, Loader2, CheckCircle2, Edit, FileText } from 'lucide-react';
import { EmotionAnalysis } from './modify/EmotionAnalysis.jsx';
import { HookingStrategy } from './modify/HookingStrategy.jsx';
import { ContentGuide } from './modify/ContentGuide.jsx';
import { ScenarioCreation } from './modify/ScenarioCreation.jsx';
import { ProductionTutorial } from './modify/ProductionTutorial.jsx';
import { Caution } from './modify/Caution.jsx';
import { Toast } from './modify/Toast.jsx';
import { CurrentStepCard } from './CurrentStepCard.jsx';
import { StepProgressBar } from './StepProgressBar.jsx';
import { useTranslation, useRegion } from '../../hooks/useTranslation.js';

export function FinalReview({ navigateToPage, user, onLogout, onBack, completionStatus }) {
    const t = useTranslation();
    const currentRegion = useRegion();
    const [editingSection, setEditingSection] = useState(null);
    const [refinedData, setRefinedData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modifiedSections, setModifiedSections] = useState({});
    const [scenarioImagesByStep, setScenarioImagesByStep] = useState({ 1: [], 2: [], 3: [], 4: [] });
    const [isSaving, setIsSaving] = useState(false);
    const [isPptDownloading, setIsPptDownloading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [productName, setProductName] = useState(''); // 제품명
    const [targetPlatform, setTargetPlatform] = useState('instagram'); // 타겟 플랫폼
    const [promotionText, setPromotionText] = useState(''); // 프로모션 내용
    const [scheduledStartDate, setScheduledStartDate] = useState(''); // 게시 시작일
    const [scheduledEndDate, setScheduledEndDate] = useState(''); // 게시 종료일
    const [isEditingDates, setIsEditingDates] = useState(false); // 날짜 수정 모드
    const [tempStartDate, setTempStartDate] = useState(''); // 임시 시작일
    const [tempEndDate, setTempEndDate] = useState(''); // 임시 종료일
    const [isSavingDates, setIsSavingDates] = useState(false); // 날짜 저장 중
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    // 브라우저 줌 레벨 감지
    useEffect(() => {
        const handleResize = () => {
            const zoom = window.devicePixelRatio;
            setZoomLevel(zoom);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // 초기 실행

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 컴포넌트 마운트 시 body에 폰트 크기 설정
    useEffect(() => {
        document.body.style.fontSize = '16px';
        return () => {
            document.body.style.fontSize = '';
        };
    }, []);

    // 토스트 표시 함수
    const showToast = (message, type = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    // 토스트 닫기 함수
    const hideToast = () => {
        setToast((prev) => ({ ...prev, isVisible: false }));
    };

    // Refined 데이터 조회 함수
    const fetchRefinedData = async (shouldResetEditing = false) => {
        // 로딩 상태 시작
        setIsLoading(true);

        try {
            // localStorage에서 plan_doc_id 가져오기
            const planDocId = localStorage.getItem('current_plan_doc_id');

            if (!planDocId) {
                setIsLoading(false);
                return;
            }

            // API 호출 (Modify에서 저장한 최신 데이터 조회 - 캐시 사용 안 함)
            const response = await fetch(`${apiBase}/ai-plan/refined?plan_doc_id=${planDocId}&_t=${Date.now()}`, {
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(
                    `${t('aiPlan.productAnalysis.modifyPage.refinedDataFetchFailedWithStatus')}: ${response.status}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || t('aiPlan.productAnalysis.modifyPage.refinedDataFetchFailed'));
            }

            setRefinedData(result.data);

            if (shouldResetEditing) {
                setModifiedSections({}); // 수정된 섹션 초기화
                setEditingSection(null); // 편집 모드 종료
            }
        } catch (error) {
            // 에러가 발생해도 계속 진행 (임시 데이터 사용)
        } finally {
            setIsLoading(false);
        }
    };

    // 제품 정보 조회 함수
    const fetchProductInfo = async () => {
        try {
            const planDocId = localStorage.getItem('current_plan_doc_id');
            if (!planDocId) return;

            const response = await fetch(`${apiBase}/ai-plan/plan-product?plan_doc_id=${planDocId}`);
            if (response.ok) {
                const data = await response.json();
                setProductName(data.product_name || '');
                setTargetPlatform(data.target_platform || 'instagram');
                setPromotionText(data.promotion_text || '');
                setScheduledStartDate(data.scheduled_start_date || '');
                setScheduledEndDate(data.scheduled_end_date || '');
            }
        } catch (error) {
            console.error('[제품 정보 조회 실패]', error);
        }
    };

    // 날짜 수정 시작 핸들러
    const handleEditDates = () => {
        setTempStartDate(scheduledStartDate ? scheduledStartDate.split('T')[0] : '');
        setTempEndDate(scheduledEndDate ? scheduledEndDate.split('T')[0] : '');
        setIsEditingDates(true);
    };

    // 날짜 수정 취소 핸들러
    const handleCancelEditDates = () => {
        setIsEditingDates(false);
        setTempStartDate('');
        setTempEndDate('');
    };

    // 날짜 업데이트 핸들러
    const handleSaveDates = async () => {
        try {
            setIsSavingDates(true);
            const planDocId = localStorage.getItem('current_plan_doc_id');

            if (!planDocId || !tempStartDate || !tempEndDate) {
                setToast({
                    message: '날짜를 모두 입력해주세요.',
                    type: 'error',
                    isVisible: true,
                });
                return;
            }

            const response = await fetch(`${apiBase}/ai-plan/update-scheduled-dates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan_doc_id: planDocId,
                    scheduled_start_date: tempStartDate,
                    scheduled_end_date: tempEndDate,
                }),
            });

            if (response.ok) {
                setScheduledStartDate(tempStartDate);
                setScheduledEndDate(tempEndDate);
                setIsEditingDates(false);
                setToast({
                    message: '게시 기간이 성공적으로 업데이트되었습니다.',
                    type: 'success',
                    isVisible: true,
                });
            } else {
                throw new Error('날짜 업데이트 실패');
            }
        } catch (error) {
            console.error('[날짜 업데이트 실패]', error);
            setToast({
                message: '날짜 업데이트에 실패했습니다.',
                type: 'error',
                isVisible: true,
            });
        } finally {
            setIsSavingDates(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchRefinedData();
        fetchProductInfo();
    }, []);

    // 시나리오별 AI 생성 이미지 조회 (STEP1~4)
    useEffect(() => {
        const planDocId = localStorage.getItem('current_plan_doc_id');
        if (!planDocId || !apiBase) return;
        fetch(`${apiBase}/ai-image/images?plan_doc_id=${planDocId}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then((result) => {
                if (result?.success && result?.data) setScenarioImagesByStep(result.data);
            })
            .catch(() => setScenarioImagesByStep({ 1: [], 2: [], 3: [], 4: [] }));
    }, [apiBase]);

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            alert(t('aiPlan.productAnalysis.productAnalysisPage.logoutMessage'));
        }
    };

    // 각 섹션에서 수정된 데이터 받기
    const handleSectionSave = (sectionKey, sectionData) => {
        setModifiedSections((prev) => ({
            ...prev,
            [sectionKey]: sectionData,
        }));
    };

    // 전체 저장하기
    const handleSaveAll = async () => {
        try {
            setIsSaving(true);

            const planDocId = localStorage.getItem('current_plan_doc_id');

            if (!planDocId) {
                showToast(t('aiPlan.productAnalysis.modifyPage.planDocIdNotFound'), 'error');
                setIsSaving(false);
                return;
            }

            // 기존 sections와 수정된 데이터 병합 (수정된 내용이 없어도 기존 데이터 저장)
            // 다국어 구조를 유지하면서 현재 언어의 데이터만 업데이트
            const updatedSections =
                refinedData?.sections?.map((section) => {
                    if (modifiedSections[section.key]) {
                        // 현재 언어에 따라 적절한 위치에 데이터 저장
                        const langKey = currentRegion === 'china' ? 'cn' : currentRegion === 'global' ? 'eng' : 'ko';

                        // 기존 data 구조 유지
                        const existingData = section.data || {};
                        const updatedData = {
                            ...existingData,
                            [langKey]: modifiedSections[section.key],
                        };

                        return {
                            ...section,
                            data: updatedData,
                        };
                    }
                    return section;
                }) || [];

            // 서버로 전송
            const response = await fetch(`${apiBase}/ai-plan/update-refined`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan_doc_id: planDocId,
                    sections: updatedSections,
                    refined_plan: refinedData?.refined_plan,
                    set_complete: true, // 최종 검수: status = 'compleate' 로 업데이트
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || t('aiPlan.productAnalysis.modifyPage.saveFailed'));
            }

            const result = await response.json();

            // S3 전파 대기 (버전별 폴더라 짧게 가능)
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // 데이터 다시 불러오기 (편집 모드 종료 포함)
            await fetchRefinedData(true);

            showToast(t('aiPlan.productAnalysis.modifyPage.saveSuccess'), 'success');
        } catch (error) {
            showToast(`${t('aiPlan.productAnalysis.modifyPage.saveError')}${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // refinedData에서 sections 추출하여 각 섹션별 데이터 매핑
    // 현재 선택된 언어에 따라 적절한 content_md와 data를 반환
    const getSectionByKey = useMemo(() => {
        return (key) => {
            if (!refinedData || !refinedData.sections) return null;
            const section = refinedData.sections.find((section) => section.key === key);
            if (!section) return null;

            // 현재 선택된 언어에 따라 content_md와 data 선택
            let contentMd = section.content_md || '';
            let sectionData = section.data?.ko || section.data || {};

            if (currentRegion === 'china') {
                // 중국어 데이터가 있으면 사용, 없으면 한국어 fallback
                contentMd = section.content_md_cn || section.content_md || '';
                sectionData = section.data?.cn || section.data?.ko || section.data || {};
            } else if (currentRegion === 'global') {
                // 영어 데이터가 있으면 사용, 없으면 한국어 fallback
                contentMd = section.content_md_eng || section.content_md || '';
                sectionData = section.data?.eng || section.data?.ko || section.data || {};
            }

            // 언어별로 선택된 데이터를 반환
            return {
                ...section,
                content_md: contentMd,
                data: sectionData,
            };
        };
    }, [refinedData, currentRegion]);

    // 섹션별 데이터 추출 (언어 변경 시 자동 업데이트)
    const indexSection = useMemo(() => getSectionByKey('index'), [getSectionByKey]);
    const emotionSection = useMemo(() => getSectionByKey('emotion'), [getSectionByKey]);
    const hookingSection = useMemo(() => getSectionByKey('hooking'), [getSectionByKey]);
    const contentGuideSection = useMemo(() => getSectionByKey('content_guide'), [getSectionByKey]);
    const scenarioSection = useMemo(() => getSectionByKey('scenario'), [getSectionByKey]);
    const technicalSection = useMemo(() => getSectionByKey('technical'), [getSectionByKey]);
    const cautionSection = useMemo(() => getSectionByKey('caution'), [getSectionByKey]);

    const handleEditToggle = (sectionId) => {
        setEditingSection(editingSection === sectionId ? null : sectionId);
    };

    // PDF 다운로드 함수 (브라우저 프린트 사용)
    const handlePdfDownload = () => {
        // 편집 모드 종료 (읽기 모드로 전환)
        setEditingSection(null);

        // DOM이 업데이트될 시간을 주고 프린트
        setTimeout(() => {
            window.print();
        }, 100);
    };

    // emotion 섹션에서 카드형 PPT용 구조화 데이터 추출 (EmotionAnalysis와 동일 로직)
    const getStructuredEmotionData = (section) => {
        if (!section) return null;
        const data = section.data || {};
        if (data.emotion_words?.length || data.emotion_rewards?.length) {
            return {
                emotionKeywords: (data.emotion_words || []).map((item) => ({
                    keyword: item.word || '',
                    description: item.description || '',
                })),
                emotionalRewardStages: (data.emotion_rewards || []).map((item) => ({
                    stage: String(item.num ?? ''),
                    subtitle: item.stage_type || '',
                    title: item.title || '',
                    quote: item.description || '',
                })),
            };
        }
        const md = section.content_md || '';
        if (!md) return null;
        const result = { emotionKeywords: [], emotionalRewardStages: [] };
        const keywordRegex = /([1-5])\.\s+\*\*([^(]+)\(([^)]+)\):\*\*\s*(.+?)(?=\n\s*[1-5]\.\s+\*\*|\n\n|$)/gs;
        let m;
        while ((m = keywordRegex.exec(md)) !== null) {
            const num = parseInt(m[1], 10);
            if (num >= 1 && num <= 5) {
                result.emotionKeywords.push({
                    keyword: `#${m[2].trim()} (${m[3].trim()})`,
                    description: m[4].trim().replace(/^['"]|['"]$/g, ''),
                });
            }
        }
        const rewardIdx = md.search(/소비자.*?리워드/i);
        const rewardSection = rewardIdx > -1 ? md.substring(rewardIdx) : md;
        const stageRegex = /([1-3])\.\s+\*\*\(([^)]+)\)\s+([^:]+?):\*\*\s*\\"([^"]+)\\"/gs;
        while ((m = stageRegex.exec(rewardSection)) !== null) {
            const num = parseInt(m[1], 10);
            if (num >= 1 && num <= 3) {
                result.emotionalRewardStages.push({
                    stage: m[1],
                    subtitle: m[2].trim(),
                    title: m[3].trim(),
                    quote: m[4].trim(),
                });
            }
        }
        return result.emotionKeywords.length > 0 || result.emotionalRewardStages.length > 0 ? result : null;
    };

    // 마크다운을 PPT용 일반 텍스트로 간단 변환
    const mdToSlideText = (md) => {
        if (!md || typeof md !== 'string') return '';
        return md
            .replace(/#{1,6}\s*/g, '')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/^-\s+/gm, '• ')
            .trim();
    };

    // PPT 다운로드 함수 (기능 준비 중 — 클릭 시 안내만)
    const handlePptDownload = async () => {
        showToast(t('aiPlan.finalReview.pptPreparing') || '준비 중입니다.', 'info');
        return;
        if (!refinedData) {
            showToast(t('aiPlan.finalReview.pptDownloadNeedData') || '데이터를 불러온 후 다운로드해 주세요.', 'error');
            return;
        }
        setIsPptDownloading(true);
        try {
            const pptx = new PptxGenJS();
            // A4 가로 (landscape): 11.7" x 8.27"
            pptx.defineLayout({ name: 'A4', width: 11.7, height: 8.27 });
            pptx.layout = 'A4';
            pptx.author = 'Influencer Seeding CMS';

            const title = productName || t('aiPlan.finalReview.seedingGuide') || '릴스 시딩 가이드';
            const platform =
                (targetPlatform || 'instagram').charAt(0).toUpperCase() + (targetPlatform || 'instagram').slice(1);
            const period =
                scheduledStartDate && scheduledEndDate
                    ? `${scheduledStartDate.split('T')[0].replace(/-/g, '.')} - ${scheduledEndDate
                          .split('T')[0]
                          .replace(/-/g, '.')}`
                    : t('aiPlan.finalReview.noPostingPeriod') || '-';

            const sections = [
                { key: 'emotion', section: emotionSection, titleKey: 'aiPlan.finalReview.guideOverview' },
                { key: 'hooking', section: hookingSection, titleKey: 'aiPlan.finalReview.coreHookingStrategy' },
                { key: 'content_guide', section: contentGuideSection, titleKey: 'aiPlan.finalReview.contentGuide' },
                { key: 'scenario', section: scenarioSection, titleKey: 'aiPlan.finalReview.scenario' },
                {
                    key: 'technical',
                    section: technicalSection,
                    titleKey: 'aiPlan.finalReview.technicalShootingEditing',
                },
                { key: 'caution', section: cautionSection, titleKey: 'aiPlan.finalReview.importantNotesDirectorsTip' },
            ];

            for (const { key, section, titleKey } of sections) {
                if (!section) continue;

                // 가이드 개요(emotion): 화면과 동일한 카드형 레이아웃 슬라이드
                if (key === 'emotion') {
                    const emotionData = getStructuredEmotionData(section);
                    if (emotionData?.emotionKeywords?.length || emotionData?.emotionalRewardStages?.length) {
                        const slide = pptx.addSlide();
                        const SW = 11.7;
                        const SH = 8.27;
                        const cardW = (SW - 1 - 0.5) / 3;
                        const gap = 0.2;
                        const col1 = 0.5;
                        const col2 = 0.5 + cardW + gap;
                        const col3 = 0.5 + (cardW + gap) * 2;
                        // 헤더 바 (연보라)
                        slide.addShape(pptx.ShapeType.rect, {
                            x: 0,
                            y: 0,
                            w: SW,
                            h: 0.9,
                            fill: { color: 'B9A8FF' },
                        });
                        slide.addText(t('aiPlan.finalReview.guideOverview'), {
                            x: 0.5,
                            y: 0.2,
                            w: SW - 1,
                            h: 0.4,
                            fontSize: 18,
                            bold: true,
                            color: 'FFFFFF',
                        });
                        slide.addText(
                            t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.subtitle') ||
                                'Core Emotion Keywords & Emotional Reward Stages',
                            {
                                x: 0.5,
                                y: 0.52,
                                w: SW - 1,
                                h: 0.35,
                                fontSize: 12,
                                color: 'FFFFFF',
                            }
                        );
                        // 감정 키워드 5가지
                        const keywords = emotionData.emotionKeywords.slice(0, 5);
                        if (keywords.length > 0) {
                            slide.addText(t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.emotionKeywords'), {
                                x: 0.5,
                                y: 1.0,
                                w: 12,
                                h: 0.35,
                                fontSize: 14,
                                bold: true,
                                color: '374151',
                            });
                            const cardH = 1.2;
                            // 3열 그리드 (A4 기준): 1행 3개, 2행 2개
                            const positions = [
                                { x: col1, y: 1.35 },
                                { x: col2, y: 1.35 },
                                { x: col3, y: 1.35 },
                                { x: col1, y: 2.6 },
                                { x: col2, y: 2.6 },
                            ];
                            keywords.forEach((item, i) => {
                                const pos = positions[i];
                                slide.addShape(pptx.ShapeType.rect, {
                                    x: pos.x,
                                    y: pos.y,
                                    w: cardW,
                                    h: cardH,
                                    fill: { color: 'F9FAFB' },
                                    line: { color: 'E9D5FF', pt: 0.5 },
                                });
                                slide.addText((item.keyword || '').slice(0, 80), {
                                    x: pos.x + 0.1,
                                    y: pos.y + 0.08,
                                    w: cardW - 0.2,
                                    h: 0.4,
                                    fontSize: 11,
                                    bold: true,
                                    color: 'B9A8FF',
                                    shrinkText: true,
                                });
                                slide.addText((item.description || '').slice(0, 120), {
                                    x: pos.x + 0.1,
                                    y: pos.y + 0.5,
                                    w: cardW - 0.2,
                                    h: cardH - 0.6,
                                    fontSize: 9,
                                    color: '6B7280',
                                    valign: 'top',
                                    shrinkText: true,
                                });
                            });
                        }
                        // 감정적 리워드 3단계
                        const stages = emotionData.emotionalRewardStages.slice(0, 3);
                        if (stages.length > 0) {
                            slide.addText(
                                t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.emotionalRewardStages'),
                                {
                                    x: 0.5,
                                    y: 3.85,
                                    w: SW - 1,
                                    h: 0.35,
                                    fontSize: 14,
                                    bold: true,
                                    color: '374151',
                                }
                            );
                            const stageCardW = cardW;
                            const stageCardH = 2.15;
                            [col1, col2, col3].forEach((baseX, i) => {
                                const stage = stages[i];
                                if (!stage) return;
                                const x = baseX;
                                const y = 4.2;
                                slide.addShape(pptx.ShapeType.rect, {
                                    x,
                                    y,
                                    w: stageCardW,
                                    h: stageCardH,
                                    fill: { color: 'F9FAFB' },
                                    line: { color: 'E9D5FF', pt: 0.5 },
                                });
                                slide.addShape(pptx.ShapeType.ellipse, {
                                    x: x + 0.12,
                                    y: y + 0.12,
                                    w: 0.35,
                                    h: 0.35,
                                    fill: { color: 'B9A8FF' },
                                });
                                slide.addText(stage.stage, {
                                    x: x + 0.12,
                                    y: y + 0.12,
                                    w: 0.35,
                                    h: 0.35,
                                    fontSize: 12,
                                    bold: true,
                                    color: 'FFFFFF',
                                    align: 'center',
                                    valign: 'middle',
                                });
                                slide.addText(stage.title || '', {
                                    x: x + 0.55,
                                    y: y + 0.1,
                                    w: stageCardW - 0.65,
                                    h: 0.4,
                                    fontSize: 11,
                                    bold: true,
                                    color: '374151',
                                    shrinkText: true,
                                });
                                slide.addText(stage.subtitle || '', {
                                    x: x + 0.55,
                                    y: y + 0.42,
                                    w: stageCardW - 0.65,
                                    h: 0.3,
                                    fontSize: 9,
                                    color: '9CA3AF',
                                    italic: true,
                                    shrinkText: true,
                                });
                                slide.addText(`"${(stage.quote || '').slice(0, 150)}"`, {
                                    x: x + 0.12,
                                    y: y + 0.85,
                                    w: stageCardW - 0.24,
                                    h: stageCardH - 1.0,
                                    fontSize: 9,
                                    color: '6B7280',
                                    italic: true,
                                    valign: 'top',
                                    shrinkText: true,
                                });
                            });
                        }
                        continue;
                    }
                }

                // 그 외 섹션: 제목 + 본문 텍스트 슬라이드 (A4: 11.7 x 8.27)
                const slide = pptx.addSlide();
                const slideTitle = t(titleKey) || titleKey;
                const body = mdToSlideText(section.content_md || '');
                const slideW = 10.7;
                const slideH = 7;
                slide.addText(slideTitle, { x: 0.5, y: 0.3, w: slideW, h: 0.7, fontSize: 20, bold: true });
                if (body) {
                    slide.addText(body, {
                        x: 0.5,
                        y: 1.1,
                        w: slideW,
                        h: slideH,
                        fontSize: 12,
                        valign: 'top',
                        shrinkText: true,
                    });
                }
            }

            // 시나리오 이미지가 있으면 이미지 슬라이드 추가 (URL은 CORS 이슈 시 스킵)
            const stepLabels = { 1: 'STEP 1', 2: 'STEP 2', 3: 'STEP 3', 4: 'STEP 4' };
            for (let step = 1; step <= 4; step++) {
                const images = scenarioImagesByStep[step] || [];
                const urls = images.map((img) => img?.url).filter(Boolean);
                if (urls.length === 0) continue;
                const imgSlide = pptx.addSlide();
                imgSlide.addText(`${t('aiPlan.finalReview.scenario')} - ${stepLabels[step]}`, {
                    x: 0.5,
                    y: 0.2,
                    w: 10.7,
                    h: 0.5,
                    fontSize: 16,
                    bold: true,
                });
                try {
                    imgSlide.addImage({ path: urls[0], x: 3.35, y: 1.2, w: 5, h: 4 });
                } catch {
                    // CORS 등으로 이미지 로드 실패 시 스킵
                }
            }

            const fileName = `${(productName || 'FinalReview').replace(/[/\\?%*:|"<>]/g, '_')}_시딩가이드.pptx`;
            await pptx.writeFile({ fileName });
            showToast(t('aiPlan.finalReview.pptDownloadComplete'), 'success');
        } catch (err) {
            console.error('PPT download error:', err);
            showToast(t('aiPlan.finalReview.pptDownloadFailed') || 'PPT 다운로드에 실패했습니다.', 'error');
        } finally {
            setIsPptDownloading(false);
        }
    };

    return (
        <>
            <style>
                {`
    @media print {
  /* ========== 기본 설정 ========== */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  @page {
    margin: 8mm;
    size: A4;
  }

  html,
  body {
    background: white !important;
    font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif !important;
    font-size: 6pt !important;
    line-height: 1.3 !important;
    color: #333 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* ========== 숨기기 ========== */
  .no-print,
  header,
  aside,
  nav,
  button,
  [role="button"],
  .flex.min-h-screen > div:first-child,
  .flex.min-h-screen > div:last-child > div:first-child {
    display: none !important;
  }

  /* ========== 레이아웃 ========== */
  .flex.min-h-screen {
    display: block !important;
  }

.flex.min-h-screen > div { 
    width: 100% !important;
    flex: none !important;
  }

  main {
        width: 100% !important;          /* ✅ 핵심 */
    max-width: none !important;       /* ✅ inline maxWidth 70% 무력화 */
    margin: 0 !important;             /* ✅ auto 제거 */
    padding: 0 !important;
    left: 0 !important;
    right: 0 !important;
  }

  /* ========== 섹션 ========== */
  .print-section {
    margin-bottom: 10pt !important;
    page-break-inside: avoid !important;
  }

  /* 릴스 시딩 가이드 상단 (PDF 포함) - 연보라 배경 유지 */
  .print-section.seeding-guide-header * {
    background: transparent !important;
  }
  .print-section.seeding-guide-header > div {
    background: #f3e8ff !important;
    border: 1pt solid #c4b5fd !important;
    border-radius: 6pt !important;
    overflow: hidden !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-section.seeding-guide-header .seeding-guide-cards > div {
    background: #f3e8ff !important;
    border: 0.5pt solid #ddd6fe !important;
    border-radius: 4pt !important;
    padding: 6pt 8pt !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-section.seeding-guide-header button,
  .print-section.seeding-guide-header input,
  .print-section.seeding-guide-header svg {
    display: none !important;
  }
  .print-section.seeding-guide-header h3 {
    font-size: 10pt !important;
    font-weight: 700 !important;
    color: #7c3aed !important;
    margin-bottom: 6pt !important;
  }
  .print-section.seeding-guide-header p {
    font-size: 8pt !important;
    line-height: 1.4 !important;
    color: #374151 !important;
  }
  .print-section.seeding-guide-header [style*="color: #9333EA"] {
    color: #7c3aed !important;
  }
  .print-section.seeding-guide-header [style*="fontWeight: '600'"],
  .print-section.seeding-guide-header [style*="fontWeight: \"600\""] {
    font-size: 7pt !important;
  }

  .print-section > div {
    border: 1pt solid #c4b5fd !important;
    border-radius: 6pt !important;
    overflow: hidden !important;
    background: white !important;
  }

  /* ========== 섹션 헤더 강제 스타일 ========== */
  .print-section > div > div:first-child {
    background: #b9a8ff !important;
    padding: 6pt 10pt !important;
    page-break-after: avoid !important;
  }

  .print-section > div > div:first-child * {
    color: white !important;
    font-size: inherit !important;
  }

  .print-section > div > div:first-child > div:first-child > div:first-child,
  .print-section > div > div:first-child div[style*="fontSize: 18px"],
  .print-section > div > div:first-child div[style*="fontWeight: bold"] {
    font-size: 9pt !important;
    font-weight: 700 !important;
  }

  .print-section > div > div:first-child > div:first-child > div:last-child,
  .print-section > div > div:first-child div[style*="fontSize: 14px"],
  .print-section > div > div:first-child div[style*="marginTop: 4px"] {
    font-size: 7pt !important;
    font-weight: 400 !important;
  }

  .print-section > div > div:first-child svg {
    width: 8pt !important;
    height: 8pt !important;
    margin-right: 4pt !important;
    filter: brightness(0) invert(1) !important;
  }

  /* ========== 콘텐츠 영역 ========== */
  .print-section > div > div:nth-child(2) {
    background-color: white !important;
    padding: 8pt !important;
    page-break-inside: auto !important;
  }

  .print-section > div > div:nth-child(2) > div > div:first-child {
    font-size: 7pt !important;
    font-weight: 700 !important;
    color: #333 !important;
    margin-bottom: 4pt !important;
    margin-top: 0 !important;
    padding-bottom: 3pt !important;
    page-break-after: avoid !important;
    background: white !important;
  }

  /* ========== 가이드 개요 Index (Target/Concept/멘션 가이드) PDF 출력 ========== */
  .print-section.guide-overview-index > div.guide-overview-index-wrapper {
    border: 1pt solid #c4b5fd !important;
    border-radius: 6pt !important;
    overflow: hidden !important;
    background: white !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:first-child {
    background: #b9a8ff !important;
    padding: 6pt 10pt !important;
    page-break-after: avoid !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:first-child * {
    color: white !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:first-child svg {
    width: 8pt !important;
    height: 8pt !important;
    filter: brightness(0) invert(1) !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) {
    background: white !important;
    padding: 8pt !important;
    display: block !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) * {
    font-size: 6.5pt !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) > div {
    margin-bottom: 5pt !important;
    page-break-inside: avoid !important;
    border: 0.5pt solid #e9d5ff !important;
    border-radius: 4pt !important;
    padding: 4pt 6pt !important;
    background: white !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) > div:last-child {
    margin-bottom: 0 !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) > div[style*="F3E8FF"],
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) > div[style*="f3e8ff"] {
    background: #f3e8ff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) > div > div:first-child {
    font-size: 7pt !important;
    font-weight: 700 !important;
    color: #7c3aed !important;
    margin-bottom: 2pt !important;
    background: transparent !important;
  }
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) > div > div:last-child,
  .print-section.guide-overview-index .guide-overview-index-wrapper > div:nth-child(2) > div > div:last-child * {
    font-size: 6.5pt !important;
    line-height: 1.35 !important;
    color: #374151 !important;
    background: transparent !important;
  }

  /* =========================================================================
     ✅ 전역 grid 규칙이 타임라인 표를 깨는 문제 방지
     - timeline-table-container 내부는 전역 grid 규칙 적용 제외
     ========================================================================= */

  /* 전역 grid: 타임라인·릴스 시딩 가이드 카드 제외 */
  .print-section
    div[style*="grid"]:not(.timeline-table-header):not(.timeline-table-row):not(.timeline-table-container):not(
      .timeline-table-container *
    ):not(.seeding-guide-cards) {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 5pt !important;
    margin: 5pt 0 !important;
  }

  /* 전역 grid 카드 스타일: 타임라인·릴스 시딩 가이드 카드 제외 */
  .print-section
    div[style*="grid"]:not(.timeline-table-header):not(.timeline-table-row):not(.timeline-table-container):not(
      .timeline-table-container *
    ):not(.seeding-guide-cards)
    > div {
    background: white !important;
    border: 0.5pt solid #e5e7eb !important;
    border-radius: 3pt !important;
    padding: 6pt !important;
    page-break-inside: avoid !important;
    min-height: 0 !important;
  }

  .print-section
    div[style*="grid"]:not(.timeline-table-header):not(.timeline-table-row):not(.timeline-table-container):not(
      .timeline-table-container *
    ):not(.seeding-guide-cards)
    > div
    > div:first-child {
    font-weight: 700 !important;
    color: #8b5cf6 !important;
    font-size: 6.5pt !important;
    margin-bottom: 3pt !important;
    background: white !important;
  }

  .print-section
    div[style*="grid"]:not(.timeline-table-header):not(.timeline-table-row):not(.timeline-table-container):not(
      .timeline-table-container *
    ):not(.seeding-guide-cards)
    > div
    > div:last-child {
    color: #4b5563 !important;
    font-size: 6pt !important;
    line-height: 1.3 !important;
    background: white !important;
  }

  /* ========== 감정 리워드 3단계 카드 스타일 ========== */
  .print-section div[style*="grid"]:not(.timeline-table-container *) > div > div:first-child > div:first-child {
    width: 12pt !important;
    height: 12pt !important;
    min-width: 12pt !important;
    min-height: 12pt !important;
    font-size: 7pt !important;
    border-radius: 50% !important;
    background-color: #b9a8ff !important;
    color: white !important;
    flex-shrink: 0 !important;
  }

  .print-section
    div[style*="grid"]:not(.timeline-table-container *)
    > div
    > div:first-child
    > div:last-child
    > div:first-child {
    font-size: 6.5pt !important;
    font-weight: 700 !important;
    color: #1f2937 !important;
    line-height: 1.3 !important;
  }

  .print-section
    div[style*="grid"]:not(.timeline-table-container *)
    > div
    > div:first-child
    > div:last-child
    > div:last-child {
    font-size: 5pt !important;
    font-style: italic !important;
    color: #6b7280 !important;
    line-height: 1.2 !important;
    margin-top: 2pt !important;
  }

  .print-section div[style*="grid"]:not(.timeline-table-container *) > div > div:last-child {
    font-size: 5pt !important;
    line-height: 1.4 !important;
    color: #4b5563 !important;
  }

  /* ========== HookingStrategy 섹션 스타일 조정 ========== */
  .print-section > div > div:nth-child(2) * {
    font-size: 6pt !important;
  }

  .print-section > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }

  .print-section > div > div:nth-child(2) [style*="fontSize: 14px"],
  .print-section > div > div:nth-child(2) [style*="font-size: 14px"],
  .print-section > div > div:nth-child(2) [style*="fontSize:14px"],
  .print-section > div > div:nth-child(2) [style*="font-size:14px"] {
    font-size: 6pt !important;
    line-height: 1.4 !important;
  }

  .print-section > div > div:nth-child(2) [style*="fontSize: 16px"],
  .print-section > div > div:nth-child(2) [style*="font-size: 16px"],
  .print-section > div > div:nth-child(2) [style*="fontSize:16px"],
  .print-section > div > div:nth-child(2) [style*="font-size:16px"] {
    font-size: 7pt !important;
    font-weight: 700 !important;
  }

  /* Focus 박스 */
  .print-section > div > div:nth-child(2) [style*="rgb(254, 243, 199)"][style*="12px"] {
  background: #fef3c7 !important;
  border: 1pt solid #fcd34d !important;
  border-radius: 6pt !important;
  padding: 8pt !important;
  margin: 5pt 0 !important;
}
 .print-section > div > div:nth-child(2) [style*="rgb(254, 243, 199)"][style*="12px"] * {
  background: transparent !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  box-shadow: none !important;
}

  .print-section > div > div:nth-child(2) [style*="#FEF3C7"][style*="12px"] [style*="fontSize: 16px"],
  .print-section > div > div:nth-child(2) [style*="#fef3c7"][style*="12px"] [style*="font-size: 16px"] {
    font-size: 7pt !important;
    font-weight: 700 !important;
    color: #92400e !important;
  }

  .print-section > div > div:nth-child(2) [style*="#FEF3C7"][style*="12px"] [style*="fontSize: 14px"],
  .print-section > div > div:nth-child(2) [style*="#fef3c7"][style*="12px"] [style*="font-size: 14px"] {
    font-size: 6pt !important;
    line-height: 1.5 !important;
    color: #78350f !important;
  }

  /* ✅ 유의사항 노란색 카드 (1. 노출 고정 필수) */
  .print-section > div > div:nth-child(2) [style*="#FFFBEB"][style*="8px"],
  .print-section > div > div:nth-child(2) [style*="#fffbeb"][style*="8px"],
  .print-section > div > div:nth-child(2) [style*="rgb(255, 251, 235)"][style*="8px"] {
    background: #fffbeb !important;
    border: 1pt solid #fcd34d !important;
    border-left: 2pt solid #f59e0b !important;
    border-radius: 4pt !important;
    padding: 8pt !important;
    margin: 5pt 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .print-section > div > div:nth-child(2) [style*="#FFFBEB"][style*="8px"] *,
  .print-section > div > div:nth-child(2) [style*="#fffbeb"][style*="8px"] *,
  .print-section > div > div:nth-child(2) [style*="rgb(255, 251, 235)"][style*="8px"] * {
    background: transparent !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }

  /* ========== 테이블 ========== */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 5pt 0 !important;
    font-size: 6pt !important;
    page-break-inside: auto !important;
  }

  thead {
    display: table-header-group !important;
  }

  th {
    background: #e9d5ff !important;
    color: #333 !important;
    padding: 4pt 6pt !important;
    font-weight: 600 !important;
    text-align: left !important;
    border: 0.5pt solid #d8b4fe !important;
    font-size: 6.5pt !important;
  }

  td {
    padding: 4pt 6pt !important;
    border: 0.5pt solid #e5e7eb !important;
    vertical-align: top !important;
    background-color: white !important;
    font-size: 6pt !important;
    line-height: 1.3 !important;
    word-wrap: break-word !important;
  }

/* =========================================================================
   ✅ 시나리오 섹션 표 (Visual/Audio/Emotion) - 실제 table이라 print에서 표 형식 유지
   ========================================================================= */
.print-section .scenario-section-table {
  width: 100% !important;
  border-collapse: collapse !important;
  table-layout: fixed !important;
  border: 1pt solid #e5e7eb !important;
  page-break-inside: avoid !important;
}
.print-section .scenario-section-table th,
.print-section .scenario-section-table td {
  border: 1pt solid #e5e7eb !important;
  padding: 6pt 8pt !important;
  vertical-align: top !important;
  font-size: 6pt !important;
  line-height: 1.3 !important;
  word-wrap: break-word !important;
}
.print-section .scenario-section-table th {
  background: #f9fafb !important;
  font-weight: 700 !important;
  color: #374151 !important;
}
.print-section .scenario-section-table td {
  background: white !important;
  color: #4b5563 !important;
}

/* 시나리오 카드 헤더 (Hook, Middle, Highlight, CTA) - 클래스로 지정해 PDF에서 연보라 전체 적용 */
.print-section .scenario-card-header,
.print-section .scenario-card-header * {
  background: #F5F3FF !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
.print-section .scenario-card-header {
  padding: 6pt 10pt !important;
}
.print-section .scenario-card-header svg {
  width: 10pt !important;
  height: 10pt !important;
  min-width: 10pt !important;
  min-height: 10pt !important;
}
.print-section .scenario-card-header span {
  font-size: 8pt !important;
  font-weight: 700 !important;
}

/* =========================================================================
   ✅ 타임라인 표(ScenarioCreation) - print에서 "진짜 table"처럼 보이게 고정
   ✅ 첫 행 높이 깨짐 + 세로선 끊김 해결 포함(최종/수정본)
   ========================================================================= */

.print-section .timeline-table-container {
  display: table !important;
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border: 1.5pt solid #e9d5ff !important;
  border-radius: 6pt !important;
  overflow: visible !important;
  background: white !important;
  page-break-inside: avoid !important;
  margin: 5pt 0 !important;
  table-layout: fixed !important;
}

.print-section .timeline-table-container .timeline-table-header {
  display: table-row !important;
  background: #f9fafb !important;
  page-break-after: avoid !important;
}

.print-section .timeline-table-container .timeline-table-header > div {
  display: table-cell !important;
  padding: 6pt 6pt !important;
  font-weight: 700 !important;
  font-size: 7pt !important;
  color: #374151 !important;
  border-right: 1pt solid #e5e7eb !important;
  border-bottom: 1.5pt solid #e9d5ff !important;
  background: #f9fafb !important;
  vertical-align: middle !important;
  text-align: left !important;
  word-wrap: break-word !important;
  position: relative !important;
}


.print-section .timeline-table-container .timeline-table-header > div:first-child {
  width: 10% !important;
}

.print-section .timeline-table-container .timeline-table-header > div:nth-child(2),
.print-section .timeline-table-container .timeline-table-header > div:nth-child(3),
.print-section .timeline-table-container .timeline-table-header > div:nth-child(4) {
  width: 30% !important;
}

.print-section .timeline-table-container .timeline-table-header > div:last-child {
  border-right: none !important;
}

/* ✅ table-row는 height/min-height가 잘 안먹는 경우가 많아서 "셀"에서 높이를 잡는다 */
.print-section .timeline-table-container .timeline-table-row {
  display: table-row !important;
  page-break-inside: avoid !important;
}

/* ✅ 행 높이 기준용 더미: ::after 쓰면 세로선 ::after랑 충돌 → ::before로 변경 */
.print-section .timeline-table-container .timeline-table-row > div::before {
  content: "" !important;
  display: block !important;
  height: 14pt !important;   /* ← 행 최소 높이(원하면 12~18pt 조절) */
}

/* ✅ body cell */
.print-section .timeline-table-container .timeline-table-row > div {
  display: table-cell !important;

  padding: 6pt 6pt !important;
  border-right: 1pt solid #e5e7eb !important;
  border-bottom: 1pt solid #e5e7eb !important;
  background: white !important;

  font-size: 6pt !important;      /* ✅ 바디 글씨 기본 */
  line-height: 1.25 !important;
  color: #4b5563 !important;

  vertical-align: top !important; /* ✅ 중앙쏠림 방지 */
  text-align: left !important;    /* ✅ 가독성 */

  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;

  position: relative !important;  /* ✅ 세로선 pseudo */
}

.print-section .timeline-table-container .timeline-table-row > div:last-child {
  border-right: none !important;
}

.print-section .timeline-table-container .timeline-table-row:last-child > div {
  border-bottom: none !important;
}

/* ✅ Time 컬럼만 중앙 + 약간 강조 */
.print-section .timeline-table-container .timeline-table-row > div:first-child {
  width: 10% !important;
  font-weight: 700 !important;
  font-size: 6pt !important;
  color: #374151 !important;
  text-align: center !important;
  vertical-align: middle !important;
}

/* ✅ 세로 구분선 끊김 방지 (Chrome print border 씹힘 대비) */
.print-section .timeline-table-container .timeline-table-row > div:not(:last-child)::after,
.print-section .timeline-table-container .timeline-table-header > div:not(:last-child)::after {
  content: "" !important;
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  width: 1pt !important;
  height: 100% !important;
  background: #e5e7eb !important;
}

/* ✅ 셀(border)은 유지하고, 내부 콘텐츠만 정리 */
.print-section .timeline-table-container .timeline-table-row > div > *,
.print-section .timeline-table-container .timeline-table-header > div > * {
  border: none !important;
  background: transparent !important;
}

/* ✅ 마크다운 기본 margin/padding 제거(첫 행만 튐 방지) */
.print-section .timeline-table-container p,
.print-section .timeline-table-container ul,
.print-section .timeline-table-container ol,
.print-section .timeline-table-container li {
  margin: 0 !important;
  padding: 0 !important;
}

.print-section .timeline-table-container ul,
.print-section .timeline-table-container ol {
  padding-left: 10pt !important;
}

/* ✅ 타임라인 내부 텍스트 통일 */
.print-section .timeline-table-container div {
  font-size: inherit !important;
  line-height: inherit !important;
  color: inherit !important;
  background: transparent !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
}

/* ✅ 혹시 인라인 fontSize가 들어와도 바디 기준 유지 */
.print-section .timeline-table-container [style*="fontSize: 14px"],
.print-section .timeline-table-container [style*="font-size: 14px"],
.print-section .timeline-table-container [style*="fontSize:14px"],
.print-section .timeline-table-container [style*="font-size:14px"],
.print-section .timeline-table-container [style*="fontSize: 13px"],
.print-section .timeline-table-container [style*="font-size: 13px"],
.print-section .timeline-table-container [style*="fontSize:13px"],
.print-section .timeline-table-container [style*="font-size:13px"] {
  font-size: 6pt !important;
  line-height: 1.25 !important;
}

/* ✅ textarea도 바디 기준으로 */
.print-section .timeline-table-container .timeline-table-row > div textarea {
  font-size: 6pt !important;
  line-height: 1.25 !important;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  resize: none !important;
  overflow: visible !important;
}

/* ✅ 첫 번째 바디 행 아래 라인 강제 */
.print-section .timeline-table-container .timeline-table-header + .timeline-table-row > div {
  border-top: 1pt solid #e5e7eb !important;
  border-bottom: 1pt solid #e5e7eb !important;
}



  /* ========== 텍스트 ========== */
  h1,
  h2,
  h3 {
    font-size: 7pt !important;
    font-weight: 700 !important;
    color: #333 !important;
    margin: 5pt 0 3pt 0 !important;
    page-break-after: avoid !important;
    background: white !important;
  }

  p {
    margin: 2pt 0 !important;
    font-size: 6pt !important;
    line-height: 1.4 !important;
    color: #4b5563 !important;
    background: white !important;
  }

  ul,
  ol {
    margin: 3pt 0 !important;
    padding-left: 12pt !important;
  }

  li {
    margin: 1.5pt 0 !important;
    font-size: 6pt !important;
    line-height: 1.3 !important;
  }

  strong {
    font-weight: 700 !important;
    background: white !important;
  }

  /* ========== 색상 박스 (노랑/분홍/파랑) ========== */
  .print-section div[style*="background-color: rgb(254, 252, 232)"]:not([style*="border: 2px"]):not(
      [style*="border:2px"]
    ),
  .print-section div[style*="background-color: #fef3c7"]:not([style*="border: 2px"]):not(
      [style*="border:2px"]
    ):not([style*="borderRadius: 12px"]):not([style*="border-radius: 12px"]),
  .print-section div[style*="background-color: #fef9c3"]:not([style*="border: 2px"]):not([style*="border:2px"]) {
    background: #fef9c3 !important;
    border-left: 2pt solid #facc15 !important;
    padding: 6pt !important;
    border-radius: 3pt !important;
    margin: 5pt 0 !important;
    page-break-inside: avoid !important;
    border: 1pt solid #fde047 !important;
  }

  .print-section div[style*="background-color: rgb(254, 242, 242)"],
  .print-section div[style*="background-color: #fce7f3"] {
    background: #fce7f3 !important;
    border-left: 2pt solid #ec4899 !important;
    padding: 6pt !important;
    border-radius: 3pt !important;
    margin: 5pt 0 !important;
    page-break-inside: avoid !important;
    border: 1pt solid #f9a8d4 !important;
  }

  .print-section div[style*="background-color: rgb(239, 246, 255)"],
  .print-section div[style*="background-color: #dbeafe"] {
    background: #dbeafe !important;
    border-left: 2pt solid #3b82f6 !important;
    padding: 6pt !important;
    border-radius: 3pt !important;
    margin: 5pt 0 !important;
    page-break-inside: avoid !important;
    border: 1pt solid #93c5fd !important;
  }

  /* ========== 입력 필드 숨기기 ========== */
  input,
  textarea,
  [contenteditable="true"] {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
    outline: none !important;
    box-shadow: none !important;
    resize: none !important;
    appearance: none !important;
    -webkit-appearance: none !important;
  }

  /* 타임라인 표 내부 textarea 완전 읽기 모드 */
  .print-section .timeline-table-container textarea {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    outline: none !important;
    box-shadow: none !important;
    resize: none !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    font-size: inherit !important;
    line-height: inherit !important;
    color: inherit !important;
    font-family: inherit !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }

  ::placeholder {
    color: transparent !important;
  }

  /* ========== 아이콘/버튼 숨김 ========== */
  svg:not(.print-section > div > div:first-child svg):not(.print-section div[style*="grid"] svg):not(.print-section .timeline-section-card > div:first-child svg) {
    display: none !important;
  }

  .print-section button,
  .print-section [role="button"] {
    display: none !important;
  }

  /* ========== 페이지 나누기 ========== */
  .print-section {
    page-break-before: auto !important;
    page-break-after: auto !important;
    page-break-inside: auto !important;
  }

  .print-section > div > div:first-child {
    page-break-after: avoid !important;
  }

  h1,
  h2,
  h3 {
    page-break-after: avoid !important;
  }

  /* ========== 코드/기타 ========== */
  code {
    font-size: 5.5pt !important;
    background: #f3f4f6 !important;
    padding: 1pt !important;
    border-radius: 1pt !important;
  }

  pre {
    font-size: 5.5pt !important;
    padding: 4pt !important;
    background: #f3f4f6 !important;
    border-radius: 2pt !important;
    page-break-inside: avoid !important;
  }

  hr {
    margin: 4pt 0 !important;
    border: none !important;
    border-top: 0.5pt solid #e5e7eb !important;
  }



      /* 시나리오 제목 카드: Focus */
  
  .print-section > div > div:nth-child(2) [style*="#F3F4F6"][style*="12px"] *,
  .print-section > div > div:nth-child(2) [style*="#f3f4f6"][style*="12px"] *,
  .print-section > div > div:nth-child(2) [style*="rgb(243, 244, 246)"][style*="12px"] * {
    background: transparent !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }

    

    } /* ✅ @media print 닫기 */    
`}
            </style>
            <div className="flex min-h-screen bg-gray-50">
                <div className="no-print" style={{ width: '15%', flexShrink: 0, borderRight: '1px solid #e5e7eb' }}>
                    <Sidebar
                        currentPage="final-review"
                        navigateToPage={navigateToPage}
                        completionStatus={completionStatus}
                    />
                </div>
                <div style={{ width: '85%', flexShrink: 0 }}>
                    <div className="no-print" style={{ backgroundColor: '#FFFFFF' }}>
                        <Header
                            title={t('aiPlan.finalReview.pageTitle')}
                            onLogout={handleLogout}
                            showBackButton={false}
                            onBackToDashboard={onBack}
                            user={user}
                            noBorder={true}
                        />
                    </div>
                    <div className="no-print">
                        <StepProgressBar currentStep={6} attached={true} />
                        {/* 헤더 섹션 */}
                        <CurrentStepCard
                            icon={CheckCircle2}
                            title={t('aiPlan.finalReview.managersFinalReview')}
                            description={t('aiPlan.finalReview.reviewDescription')}
                            attached={true}
                        />
                    </div>

                    {isLoading ? (
                        // 로딩 화면
                        <div
                            style={{
                                backgroundColor: '#f9fafb',
                                minHeight: 'calc(100vh - 80px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '40px',
                                }}
                            >
                                <Loader2
                                    className="w-16 h-16 animate-spin"
                                    style={{
                                        color: '#B9A8FF',
                                        margin: '0 auto 24px',
                                    }}
                                />
                                <h3
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#374151',
                                        marginBottom: '8px',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.modifyPage.loadingTitle')}
                                </h3>
                                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                    {t('aiPlan.productAnalysis.modifyPage.loadingMessage')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 80px)' }}>
                            <main
                                className="p-8 mx-auto"
                                style={{
                                    maxWidth: zoomLevel > 1 ? `${70 + (zoomLevel - 1) * 20}%` : '70%',
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                }}
                            >
                                {/* 릴스 시딩 가이드 (PDF 포함) */}
                                <div
                                    className="print-section seeding-guide-header"
                                    style={{
                                        marginBottom: '24px',
                                    }}
                                >
                                    <div
                                        style={{
                                            backgroundColor: '#F3E8FF',
                                            borderRadius: '8px',
                                            padding: '20px 24px',
                                        }}
                                    >
                                        <h3
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                color: '#9333EA',
                                                marginBottom: '16px',
                                                backgroundColor: 'transparent',
                                            }}
                                        >
                                            {t('aiPlan.finalReview.seedingGuide')}
                                        </h3>
                                        <p
                                            style={{
                                                fontSize: '16px',
                                                color: '#9333EA',
                                                marginBottom: '20px',
                                                backgroundColor: 'transparent',
                                            }}
                                        >
                                            {productName || t('aiPlan.finalReview.noProductName')}
                                        </p>

                                        {/* 정보 카드들 */}
                                        <div
                                            className="seeding-guide-cards"
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '16px',
                                            }}
                                        >
                                            {/* 업로드 플랫폼 */}
                                            <div
                                                style={{
                                                    backgroundColor: '#F3E8FF',
                                                    borderRadius: '6px',
                                                    padding: '12px 14px',
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        fontSize: '14px',
                                                        color: '#9333EA',
                                                        marginBottom: '8px',
                                                        fontWeight: '600',
                                                        backgroundColor: 'transparent',
                                                    }}
                                                >
                                                    {t('aiPlan.finalReview.uploadPlatform')}
                                                </p>
                                                <p
                                                    style={{
                                                        fontSize: '16px',
                                                        color: '#111827',
                                                        fontWeight: '500',
                                                        backgroundColor: 'transparent',
                                                    }}
                                                >
                                                    {(targetPlatform || 'instagram').charAt(0).toUpperCase() +
                                                        (targetPlatform || 'instagram').slice(1)}
                                                </p>
                                            </div>

                                            {/* 게시 기간 */}
                                            <div
                                                style={{
                                                    backgroundColor: '#F3E8FF',
                                                    borderRadius: '6px',
                                                    padding: '12px 14px',
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        fontSize: '14px',
                                                        color: '#9333EA',
                                                        marginBottom: '8px',
                                                        fontWeight: '600',
                                                        backgroundColor: 'transparent',
                                                    }}
                                                >
                                                    {t('aiPlan.finalReview.postingPeriod')}
                                                </p>
                                                {!isEditingDates ? (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            backgroundColor: 'transparent',
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                fontSize: '16px',
                                                                color: '#111827',
                                                                fontWeight: '500',
                                                                backgroundColor: 'transparent',
                                                            }}
                                                        >
                                                            {scheduledStartDate && scheduledEndDate
                                                                ? `${scheduledStartDate
                                                                      .split('T')[0]
                                                                      .replace(/-/g, '.')} - ${scheduledEndDate
                                                                      .split('T')[0]
                                                                      .replace(/-/g, '.')}`
                                                                : t('aiPlan.finalReview.noPostingPeriod')}
                                                        </p>
                                                        <Edit
                                                            className="w-4 h-4"
                                                            style={{ color: '#9333EA', cursor: 'pointer' }}
                                                            onClick={handleEditDates}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                gap: '8px',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <input
                                                                type="date"
                                                                value={tempStartDate}
                                                                onChange={(e) => setTempStartDate(e.target.value)}
                                                                style={{
                                                                    padding: '6px 8px',
                                                                    border: '1px solid #D1D5DB',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    outline: 'none',
                                                                }}
                                                            />
                                                            <span style={{ color: '#6B7280' }}>-</span>
                                                            <input
                                                                type="date"
                                                                value={tempEndDate}
                                                                onChange={(e) => setTempEndDate(e.target.value)}
                                                                style={{
                                                                    padding: '6px 8px',
                                                                    border: '1px solid #D1D5DB',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    outline: 'none',
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={handleCancelEditDates}
                                                                disabled={isSavingDates}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: '#F3F4F6',
                                                                    color: '#374151',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '13px',
                                                                    cursor: isSavingDates ? 'not-allowed' : 'pointer',
                                                                }}
                                                            >
                                                                {t('aiPlan.finalReview.cancel')}
                                                            </button>
                                                            <button
                                                                onClick={handleSaveDates}
                                                                disabled={isSavingDates}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: '#B9A8FF',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '13px',
                                                                    cursor: isSavingDates ? 'not-allowed' : 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    opacity: isSavingDates ? 0.6 : 1,
                                                                }}
                                                            >
                                                                {isSavingDates ? (
                                                                    <>
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                        {t('aiPlan.finalReview.saving')}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        {t('aiPlan.finalReview.saveButton')}
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 프로모션 내용 */}
                                            <div
                                                style={{
                                                    backgroundColor: '#F3E8FF',
                                                    borderRadius: '6px',
                                                    padding: '12px 14px',
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        fontSize: '14px',
                                                        color: '#9333EA',
                                                        marginBottom: '8px',
                                                        fontWeight: '600',
                                                        backgroundColor: 'transparent',
                                                    }}
                                                >
                                                    {t('aiPlan.finalReview.promotionDetails')}
                                                </p>
                                                <p
                                                    style={{
                                                        fontSize: '16px',
                                                        color: '#111827',
                                                        fontWeight: '500',
                                                        backgroundColor: 'transparent',
                                                    }}
                                                >
                                                    {promotionText || t('aiPlan.finalReview.noPromotionDetails')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ① 가이드 개요: index 있으면 Target/Concept/멘션 가이드, 없으면 감정 키워드 5가지·감정적 리워드 3단계 */}
                                <div
                                    className={`print-section${indexSection?.data ? ' guide-overview-index' : ''}`}
                                    style={{ marginBottom: '24px' }}
                                >
                                    {indexSection?.data ? (
                                        <div className="guide-overview-index-wrapper">
                                            <div
                                                style={{
                                                    backgroundColor: '#B9A8FF',
                                                    borderTopLeftRadius: '8px',
                                                    borderTopRightRadius: '8px',
                                                    padding: '16px 20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <FileText className="w-5 h-5" style={{ color: 'white' }} />
                                                    <div>
                                                        <div
                                                            style={{
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '18px',
                                                            }}
                                                        >
                                                            {t('aiPlan.finalReview.guideOverview')}
                                                        </div>
                                                        <div
                                                            style={{
                                                                color: 'rgba(255, 255, 255, 0.9)',
                                                                fontSize: '14px',
                                                                marginTop: '4px',
                                                            }}
                                                        >
                                                            {t(
                                                                'aiPlan.productAnalysis.modifyPage.emotionAnalysis.subtitle'
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #E9D5FF',
                                                    borderTop: 'none',
                                                    borderBottomLeftRadius: '8px',
                                                    borderBottomRightRadius: '8px',
                                                    padding: '20px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '12px',
                                                }}
                                            >
                                                {indexSection.data.target != null &&
                                                    indexSection.data.target !== '' && (
                                                        <div
                                                            style={{
                                                                border: '1px solid #E9D5FF',
                                                                borderRadius: '8px',
                                                                padding: '12px',
                                                                backgroundColor: 'white',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: '700',
                                                                    color: '#9333EA',
                                                                    marginBottom: '6px',
                                                                }}
                                                            >
                                                                {t('aiPlan.finalReview.target')}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: '12px',
                                                                    color: '#374151',
                                                                    lineHeight: 1.5,
                                                                }}
                                                            >
                                                                {indexSection.data.target}
                                                            </div>
                                                        </div>
                                                    )}
                                                {indexSection.data.concept != null &&
                                                    indexSection.data.concept !== '' && (
                                                        <div
                                                            style={{
                                                                border: '1px solid #E9D5FF',
                                                                borderRadius: '8px',
                                                                padding: '12px',
                                                                backgroundColor: 'white',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: '700',
                                                                    color: '#9333EA',
                                                                    marginBottom: '6px',
                                                                }}
                                                            >
                                                                {t('aiPlan.finalReview.concept')}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: '12px',
                                                                    color: '#374151',
                                                                    lineHeight: 1.5,
                                                                }}
                                                            >
                                                                "{indexSection.data.concept}"
                                                            </div>
                                                        </div>
                                                    )}
                                                {((indexSection.data.mention_guide_raw != null &&
                                                    indexSection.data.mention_guide_raw !== '') ||
                                                    (indexSection.data.required_hashtags != null &&
                                                        indexSection.data.required_hashtags !== '')) && (
                                                    <div
                                                        style={{
                                                            border: '1px solid #E9D5FF',
                                                            borderRadius: '8px',
                                                            padding: '12px',
                                                            backgroundColor: '#F3E8FF',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                color: '#7C3AED',
                                                                marginBottom: '6px',
                                                            }}
                                                        >
                                                            {t('aiPlan.finalReview.mentionGuide')}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: '12px',
                                                                color: '#374151',
                                                                lineHeight: 1.5,
                                                            }}
                                                        >
                                                            {indexSection.data.mention_guide_raw != null &&
                                                                indexSection.data.mention_guide_raw !== '' && (
                                                                    <div style={{ marginBottom: '6px' }}>
                                                                        <span style={{ fontWeight: '600' }}>
                                                                            {t('aiPlan.finalReview.officialAccount')}:
                                                                        </span>{' '}
                                                                        {indexSection.data.mention_guide_raw}
                                                                    </div>
                                                                )}
                                                            {indexSection.data.required_hashtags != null &&
                                                                indexSection.data.required_hashtags !== '' && (
                                                                    <div>
                                                                        <span style={{ fontWeight: '600' }}>
                                                                            {t('aiPlan.finalReview.hashtag')}:
                                                                        </span>{' '}
                                                                        {indexSection.data.required_hashtags}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <EmotionAnalysis
                                            data={
                                                emotionSection
                                                    ? {
                                                          content_md: emotionSection.content_md,
                                                          data: emotionSection.data,
                                                      }
                                                    : null
                                            }
                                            isEditing={editingSection === 'emotion-analysis'}
                                            onEditToggle={() => handleEditToggle('emotion-analysis')}
                                            onSave={handleSectionSave}
                                            showToast={showToast}
                                            title={t('aiPlan.finalReview.guideOverview')}
                                        />
                                    )}
                                </div>

                                {/* ② 후킹 핵심 전략 설계 */}
                                <div className="print-section">
                                    <HookingStrategy
                                        data={
                                            hookingSection
                                                ? {
                                                      content_md: hookingSection.content_md,
                                                      data: hookingSection.data,
                                                  }
                                                : null
                                        }
                                        isEditing={editingSection === 'hooking-strategy'}
                                        onEditToggle={() => handleEditToggle('hooking-strategy')}
                                        onSave={handleSectionSave}
                                        showToast={showToast}
                                    />
                                </div>

                                {/* ③ 콘텐츠 가이드 */}
                                <div className="print-section">
                                    <ContentGuide
                                        data={
                                            contentGuideSection
                                                ? {
                                                      content_md: contentGuideSection.content_md,
                                                      data: contentGuideSection.data,
                                                  }
                                                : null
                                        }
                                        isEditing={editingSection === 'content-guide'}
                                        onEditToggle={() => handleEditToggle('content-guide')}
                                        onSave={handleSectionSave}
                                        showToast={showToast}
                                    />
                                </div>

                                {/* ④ 시나리오 생성 */}
                                <div className="print-section">
                                    <ScenarioCreation
                                        data={
                                            scenarioSection
                                                ? {
                                                      content_md: scenarioSection.content_md,
                                                      data: scenarioSection.data,
                                                  }
                                                : null
                                        }
                                        isEditing={editingSection === 'scenario'}
                                        onEditToggle={() => handleEditToggle('scenario')}
                                        onSave={handleSectionSave}
                                        showToast={showToast}
                                        imagesByStep={scenarioImagesByStep}
                                        planDocId={
                                            typeof localStorage !== 'undefined'
                                                ? localStorage.getItem('current_plan_doc_id')
                                                : null
                                        }
                                        apiBase={apiBase}
                                        createdBy={user?.email ?? user?.user_id ?? user?.name ?? ''}
                                        onImagesChange={() => {
                                            const pid =
                                                typeof localStorage !== 'undefined'
                                                    ? localStorage.getItem('current_plan_doc_id')
                                                    : null;
                                            if (!pid || !apiBase) return;
                                            fetch(`${apiBase}/ai-image/images?plan_doc_id=${pid}`)
                                                .then((r) => r.json())
                                                .then((json) => json?.data && setScenarioImagesByStep(json.data))
                                                .catch(() => {});
                                        }}
                                    />
                                </div>

                                {/* ⑤ 테크니컬 슈팅 & 에디팅 가이드 */}
                                <div className="print-section">
                                    <ProductionTutorial
                                        data={
                                            technicalSection
                                                ? {
                                                      content_md: technicalSection.content_md,
                                                      data: technicalSection.data,
                                                  }
                                                : null
                                        }
                                        isEditing={editingSection === 'production-tutorial'}
                                        onEditToggle={() => handleEditToggle('production-tutorial')}
                                        onSave={handleSectionSave}
                                        showToast={showToast}
                                    />
                                </div>

                                {/* ⑦ 유의사항 */}
                                <div className="print-section">
                                    <Caution
                                        data={
                                            cautionSection
                                                ? {
                                                      content_md: cautionSection.content_md,
                                                      data: cautionSection.data,
                                                  }
                                                : null
                                        }
                                        isEditing={editingSection === 'caution'}
                                        onEditToggle={() => handleEditToggle('caution')}
                                        onSave={handleSectionSave}
                                        showToast={showToast}
                                    />
                                </div>

                                {/* 하단 버튼 */}
                                <div
                                    className="no-print"
                                    style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px' }}
                                >
                                    {/* 상단 행: 이전 단계, PPT 다운로드, PDF 다운로드 */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => navigateToPage('AIImageGeneration')}
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
                                                color: '#374151',
                                            }}
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                            <span>{t('aiPlan.finalReview.previousStep')}</span>
                                        </button>

                                        <button
                                            onClick={handlePptDownload}
                                            disabled={isPptDownloading}
                                            style={{
                                                display: 'flex',
                                                flex: 1,
                                                paddingTop: '12px',
                                                paddingBottom: '12px',
                                                backgroundColor: isPptDownloading ? '#93C5FD' : '#3B82F6',
                                                color: 'white',
                                                borderRadius: '6px',
                                                border: 'none',
                                                cursor: isPptDownloading ? 'wait' : 'pointer',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                transition: 'background-color 0.2s ease',
                                            }}
                                        >
                                            {isPptDownloading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Download className="w-5 h-5" />
                                            )}
                                            <span>
                                                {isPptDownloading
                                                    ? t('aiPlan.finalReview.pptGenerating')
                                                    : t('aiPlan.finalReview.pptDownload')}
                                            </span>
                                        </button>

                                        <button
                                            onClick={handlePdfDownload}
                                            style={{
                                                flex: 1,
                                                paddingTop: '12px',
                                                paddingBottom: '12px',
                                                backgroundColor: '#6B7280',
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
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#4B5563')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = '#6B7280')}
                                        >
                                            <Download className="w-5 h-5" />
                                            <span>{t('aiPlan.finalReview.pdfDownload')}</span>
                                        </button>
                                    </div>

                                    {/* 하단 행: 저장하기 */}
                                    <button
                                        onClick={handleSaveAll}
                                        disabled={isSaving}
                                        style={{
                                            width: '100%',
                                            paddingTop: '12px',
                                            paddingBottom: '12px',
                                            backgroundColor: isSaving ? '#D1D5DB' : '#B9A8FF',
                                            color: 'white',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'background-color 0.2s ease',
                                            opacity: isSaving ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSaving) {
                                                e.target.style.backgroundColor = '#A08FFF';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSaving) {
                                                e.target.style.backgroundColor = '#B9A8FF';
                                            }
                                        }}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>{t('aiPlan.productAnalysis.modifyPage.saving')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                <span>{t('aiPlan.finalReview.save')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </main>
                        </div>
                    )}
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
        </>
    );
}

export default FinalReview;
