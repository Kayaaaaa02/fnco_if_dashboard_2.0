import { useState, useEffect } from 'react';
import { FileText, BarChart3, Edit, Image as ImageIcon, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation.js';

export function Sidebar({ currentPage, navigateToPage, completionStatus }) {
    const t = useTranslation();

    // current_plan_doc_id 체크 (localStorage 변경 감지)
    const [hasPlanDocId, setHasPlanDocId] = useState(() => {
        if (typeof window !== 'undefined') {
            return !!localStorage.getItem('current_plan_doc_id');
        }
        return false;
    });

    // can_access_modify 플래그 체크 (localStorage 변경 감지)
    const [canAccessModify, setCanAccessModify] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('can_access_modify') === 'true';
        }
        return false;
    });

    // 기획별 "진입했던 최대 단계" (이 단계까지는 자유롭게 왔다갔다 가능) — plan_doc_id별 저장
    const [maxStepReached, setMaxStepReached] = useState(() => {
        if (typeof window !== 'undefined') {
            const planDocId = localStorage.getItem('current_plan_doc_id');
            if (!planDocId) return -1;
            const v = localStorage.getItem('ai_plan_max_step_' + planDocId);
            return v != null ? parseInt(v, 10) : -1;
        }
        return -1;
    });

    useEffect(() => {
        // localStorage 변경 감지를 위한 interval
        const checkLocalStorage = () => {
            if (typeof window !== 'undefined') {
                const planDocId = localStorage.getItem('current_plan_doc_id');
                setHasPlanDocId(!!planDocId);
                const canModify = localStorage.getItem('can_access_modify') === 'true';
                setCanAccessModify(canModify);
                if (planDocId) {
                    const v = localStorage.getItem('ai_plan_max_step_' + planDocId);
                    setMaxStepReached(v != null ? parseInt(v, 10) : -1);
                } else {
                    setMaxStepReached(-1);
                }
            }
        };

        // 초기 체크
        checkLocalStorage();

        // 주기적으로 체크 (500ms마다)
        const interval = setInterval(checkLocalStorage, 500);

        // storage 이벤트 리스너 (다른 탭에서 변경된 경우)
        window.addEventListener('storage', checkLocalStorage);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', checkLocalStorage);
        };
    }, []);

    const menuItems = [
        { id: 'dashboard', label: t('aiPlan.sidebar.dashboard'), icon: FileText, page: 'Dashboard' },
        {
            id: 'product-analysis',
            label: t('aiPlan.sidebar.productAnalysis'),
            icon: BarChart3,
            page: 'ProductAnalysis',
        },
        {
            id: 'influencer-analysis',
            label: t('aiPlan.sidebar.influencerAnalysis'),
            icon: Users,
            page: 'InfluencerAnalysis',
        },
        { id: 'modify', label: t('aiPlan.sidebar.modify'), icon: Edit, page: 'Modify' },
        {
            id: 'ai-image-generation',
            label: t('aiPlan.sidebar.aiImageGeneration'),
            icon: Sparkles,
            page: 'AIImageGeneration',
        },
        { id: 'final-review', label: t('aiPlan.sidebar.finalReview'), icon: CheckCircle2, page: 'FinalReview' },
    ];

    const progressSteps = [
        // { id: 'upload', label: t('aiPlan.sidebar.dashboard') },
        { id: 'product-analysis', label: t('aiPlan.sidebar.productAnalysis') },
        { id: 'influencer-analysis', label: t('aiPlan.sidebar.influencerAnalysis') },
        { id: 'modify', label: t('aiPlan.sidebar.modify') },
        { id: 'ai-image-generation', label: t('aiPlan.sidebar.aiImageGeneration') },
        { id: 'final-review', label: t('aiPlan.sidebar.finalReview') },
    ];

    // 현재 페이지에 따라 완료된 단계 수 계산 (진행상태에서는 대시보드 제외 → 5단계만 표시)
    const getCompletedSteps = () => {
        if (currentPage === 'final-review') {
            return 5;
        } else if (currentPage === 'ai-image-generation') {
            return 4;
        } else if (currentPage === 'modify') {
            return 3;
        } else if (currentPage === 'influencer-analysis') {
            return 2;
        } else if (currentPage === 'product-analysis') {
            return 1;
        }
        // 대시보드: 진행상태에서는 0/5 (대시보드 단계 없음)
        return 0;
    };

    const completedSteps = getCompletedSteps();
    const currentStepIndex = progressSteps.findIndex((s) => s.id === currentPage);

    // 현재 진입한 단계를 "최대 단계"로 반영 (이 기획에서 진입했던 최대 단계 갱신)
    useEffect(() => {
        if (typeof window === 'undefined' || currentStepIndex < 0) return;
        const planDocId = localStorage.getItem('current_plan_doc_id');
        if (!planDocId) return;
        const key = 'ai_plan_max_step_' + planDocId;
        const prev = parseInt(localStorage.getItem(key) || '-1', 10);
        const next = Math.max(prev, currentStepIndex);
        if (next > prev) localStorage.setItem(key, String(next));
        setMaxStepReached(next);
    }, [currentStepIndex]);

    return (
        <aside
            className="w-64 border-r border-gray-200"
            style={{ backgroundColor: '#f5f5f6', minHeight: '100vh', height: '100%' }}
        >
            <div className="p-4">
                <div
                    className="text-lg font-semibold text-gray-900"
                    style={{ marginTop: '6px', marginLeft: '10px', color: '#B9A8FF', fontWeight: 'bold' }}
                >
                    {t('aiPlan.sidebar.title')}
                </div>
                <nav className="space-y-2 mb-8" style={{ marginTop: '20px' }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            currentPage === item.id || (currentPage === 'dashboard' && item.id === 'dashboard');

                        // 대시보드: 항상 클릭 가능. 대시보드 제외: plan 없으면 전부 비활성.
                        // "진입했던 최대 단계"까지는 자유롭게 왔다갔다 가능 (예: 이어서 작업하기로 최종검수 진입 → 인플 분석 ↔ 최종검수 이동 가능)
                        // stepOrder 인덱스: product-analysis=0, influencer=1, modify=2, ai-image=3, final-review=4
                        let isDisabled = false;
                        if (item.page === 'Dashboard') {
                            isDisabled = false;
                        } else if (!hasPlanDocId) {
                            isDisabled = true;
                        } else {
                            const stepOrder = [
                                'product-analysis',
                                'influencer-analysis',
                                'modify',
                                'ai-image-generation',
                                'final-review',
                            ];
                            const itemStepIndex = stepOrder.indexOf(item.id);
                            if (itemStepIndex > maxStepReached) {
                                isDisabled = true; // 아직 한 번도 진입하지 않은 단계
                            } else if (item.page === 'Modify' && !canAccessModify && maxStepReached < 2) {
                                // can_access_modify: 인플루언서 분석에서 "다음"으로 들어올 때만 설정됨. 이미 기획안 수정 이후 단계(maxStepReached>=2)에 진입한 적 있으면 자유 이동 허용 (이어서 작업하기 등)
                                isDisabled = true;
                            }
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => !isDisabled && navigateToPage(item.page)}
                                disabled={isDisabled}
                                className={`w-full flex items-center justify-start gap-3 px-4 py-3 transition-colors text-left ${
                                    isActive
                                        ? 'text-white'
                                        : isDisabled
                                        ? 'text-gray-400'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                                style={
                                    isActive
                                        ? {
                                              backgroundColor: '#8B7FFF',
                                              boxShadow: '0 2px 4px rgba(139, 127, 255, 0.3)',
                                              borderRadius: '8px',
                                          }
                                        : isDisabled
                                        ? { borderRadius: '8px', cursor: 'not-allowed', opacity: 0.5 }
                                        : {}
                                }
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* 진행 상태 섹션 */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="text-sm font-medium text-gray-700 mb-3">
                            {t('aiPlan.sidebar.progressStatus')}
                        </div>

                        {/* 진행 바 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div
                                style={{
                                    flex: 1,
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '9999px',
                                    height: '10px',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: '#B9A8FF',
                                        borderRadius: '9999px',
                                        height: '10px',
                                        width: `${(completedSteps / 5) * 100}%`,
                                        transition: 'width 0.3s ease',
                                    }}
                                ></div>
                            </div>
                            <div
                                style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', whiteSpace: 'nowrap' }}
                            >
                                {completedSteps}/5
                            </div>
                        </div>

                        {/* 단계 리스트 - 현재 페이지와 일치하는 단계를 '현재'로 표시 */}
                        <div className="space-y-3">
                            {progressSteps.map((step, index) => {
                                const isCurrent = currentStepIndex >= 0 && index === currentStepIndex;
                                const isCompleted = currentStepIndex >= 0 && index < currentStepIndex;
                                // 완료된 것은 녹색, 현재 단계는 보라색, 대기 중은 회색
                                const bulletColor = isCompleted ? '#10b981' : isCurrent ? '#B9A8FF' : '#d1d5db';

                                return (
                                    <div key={step.id} className="flex items-center gap-3">
                                        <div
                                            className="rounded-full flex-shrink-0"
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                backgroundColor: bulletColor,
                                            }}
                                        />
                                        <span
                                            className="text-sm"
                                            style={{
                                                color: isCurrent ? '#B9A8FF' : isCompleted ? '#10b981' : '#6b7280',
                                                fontWeight: isCurrent ? '600' : '400',
                                            }}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
