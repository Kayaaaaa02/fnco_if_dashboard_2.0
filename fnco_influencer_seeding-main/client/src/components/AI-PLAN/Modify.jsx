import { useState, useEffect, useMemo } from 'react';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { ArrowLeft, ArrowRight, FileText, Download, CheckCircle, Loader2, Edit, Sparkles } from 'lucide-react';
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

export function Modify({ navigateToPage, user, onLogout, onBack, completionStatus }) {
    const t = useTranslation();
    const currentRegion = useRegion();
    const [editingSection, setEditingSection] = useState(null);
    const [refinedData, setRefinedData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modifiedSections, setModifiedSections] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
    const [scenarioImagesByStep, setScenarioImagesByStep] = useState({ 1: [], 2: [], 3: [], 4: [] });
    const [zoomLevel, setZoomLevel] = useState(1);
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

            // API 호출
            const response = await fetch(`${apiBase}/ai-plan/refined?plan_doc_id=${planDocId}`);

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

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchRefinedData();
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
        setIsSaved(false); // 수정 시 저장 상태 초기화
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
                    set_complete: true, // 저장 완료 시 mst_plan_doc.status = 'compleate' 로 업데이트
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

            setIsSaved(true);
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

  /* =========================================================================
     ✅ 전역 grid 규칙이 타임라인 표를 깨는 문제 방지
     - timeline-table-container 내부는 전역 grid 규칙 적용 제외
     ========================================================================= */

  /* 전역 grid: 타임라인 제외 */
  .print-section
    div[style*="grid"]:not(.timeline-table-header):not(.timeline-table-row):not(.timeline-table-container):not(
      .timeline-table-container *
    ) {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 5pt !important;
    margin: 5pt 0 !important;
  }

  /* 전역 grid 카드 스타일: 타임라인 제외 */
  .print-section
    div[style*="grid"]:not(.timeline-table-header):not(.timeline-table-row):not(.timeline-table-container):not(
      .timeline-table-container *
    )
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
    )
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
    )
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
  svg:not(.print-section > div > div:first-child svg):not(.print-section div[style*="grid"] svg) {
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
                    <Sidebar currentPage="modify" navigateToPage={navigateToPage} completionStatus={completionStatus} />
                </div>
                <div style={{ width: '85%', flexShrink: 0 }}>
                    <div className="no-print" style={{ backgroundColor: '#FFFFFF' }}>
                        <Header
                            title={t('aiPlan.productAnalysis.modifyPage.pageTitle')}
                            onLogout={handleLogout}
                            showBackButton={false}
                            onBackToDashboard={onBack}
                            user={user}
                            noBorder={true}
                        />
                    </div>
                    <div className="no-print">
                        <StepProgressBar currentStep={4} attached={true} />
                        {/* 현재 단계 정보 카드 */}
                        <CurrentStepCard
                            icon={Edit}
                            title={t('aiPlan.productAnalysis.modifyPage.headerTitle')}
                            description={t('aiPlan.productAnalysis.modifyPage.headerDescription')}
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
                                {/* ① 소비자 감정 언어 해석 */}
                                <div className="print-section">
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
                                    />
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

                                {/* ④ 시나리오 생성 - 수정용 이전 형식(단일 표) */}
                                <div className="print-section">
                                    <ScenarioCreation
                                        variant="legacy"
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

                                {/* 저장하기 버튼 */}
                                <button
                                    onClick={handleSaveAll}
                                    disabled={isSaving || isSaved}
                                    style={{
                                        width: '100%',
                                        paddingTop: '14px',
                                        paddingBottom: '14px',
                                        background: isSaved
                                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                            : isSaving
                                            ? '#D1D5DB'
                                            : 'linear-gradient(135deg, #D5BAFF 0%, #C5B3FF 25%, #B5ADFF 50%, #A5B8FF 75%, #9BC8FF 100%)',
                                        color: 'white',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: isSaving || isSaved ? 'default' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSaved
                                            ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                                            : isSaving
                                            ? 'none'
                                            : '0 2px 8px rgba(185, 168, 255, 0.3)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSaving && !isSaved) {
                                            e.target.style.background =
                                                'linear-gradient(135deg, #C9AEFF 0%, #B9A7FF 25%, #A9A1FF 50%, #99ACFF 75%, #8FBCFF 100%)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(185, 168, 255, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSaving && !isSaved) {
                                            e.target.style.background =
                                                'linear-gradient(135deg, #D5BAFF 0%, #C5B3FF 25%, #B5ADFF 50%, #A5B8FF 75%, #9BC8FF 100%)';
                                            e.target.style.boxShadow = '0 2px 8px rgba(185, 168, 255, 0.3)';
                                        }
                                    }}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>{t('aiPlan.productAnalysis.modifyPage.saving')}</span>
                                        </>
                                    ) : isSaved ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            <span>{t('aiPlan.productAnalysis.productAnalysisPage.saveCompleted')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            <span>{t('aiPlan.productAnalysis.modifyPage.save')}</span>
                                            <CheckCircle className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                {/* 하단 버튼 */}
                                <div className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <button
                                        onClick={() => navigateToPage('ProductAnalysis')}
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
                                            fontSize: '14px',
                                            fontWeight: '500',
                                        }}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9fafb')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                        <span>{t('aiPlan.productAnalysis.modifyPage.previousStep')}</span>
                                    </button>

                                    <button
                                        onClick={() => navigateToPage('AIImageGeneration')}
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
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'background-color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#A08FFF')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#B9A8FF')}
                                    >
                                        <span>{t('aiPlan.sidebar.aiImageGeneration')}</span>
                                        <ArrowRight className="w-5 h-5" />
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

export default Modify;
