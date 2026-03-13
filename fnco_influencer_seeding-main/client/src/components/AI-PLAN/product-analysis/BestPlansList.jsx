import { useMemo } from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Film } from 'lucide-react';
import { bestPlans } from './bestPlansData.js';
import { useRegion, useTranslation } from '../../../hooks/useTranslation.js';

export function BestPlansList({ reelsPlans = [], reelsPlansCn = [], reelsPlansEng = [] }) {
    const [expandedPlan, setExpandedPlan] = useState(null);
    const currentRegion = useRegion();
    const t = useTranslation();

    const toggleExpand = (id) => {
        setExpandedPlan(expandedPlan === id ? null : id);
    };

    // Dashboard의 언어 필터 상태에 따라 데이터 선택
    const plansToDisplay = useMemo(() => {
        let plans = [];
        if (currentRegion === 'china' && reelsPlansCn.length > 0) {
            plans = reelsPlansCn;
        } else if (currentRegion === 'global' && reelsPlansEng.length > 0) {
            plans = reelsPlansEng;
        } else if (reelsPlans.length > 0) {
            plans = reelsPlans;
        }

        // 데이터가 없으면 기본 데이터 사용
        return plans.length > 0 ? plans : bestPlans;
    }, [currentRegion, reelsPlans, reelsPlansCn, reelsPlansEng]);

    return (
        <div className="mb-8">
            {/* 섹션 헤더 */}
            <div
                style={{
                    backgroundColor: '#B9A8FF',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    borderBottomLeftRadius: '0px',
                    borderBottomRightRadius: '0px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Film className="w-5 h-5" style={{ color: 'white' }} />
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                            {t('aiPlan.productAnalysis.bestPlansList.title')}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', marginTop: '4px' }}>
                            {t('aiPlan.productAnalysis.bestPlansList.subtitle')}
                        </div>
                    </div>
                </div>
            </div>

            {/* 콘텐츠 영역 - 흰색 박스로 감싸기 */}
            <div
                style={{
                    backgroundColor: 'white',
                    border: '1px solid #E9D5FF',
                    borderTop: 'none',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px',
                    borderTopLeftRadius: '0px',
                    borderTopRightRadius: '0px',
                    padding: '24px',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {plansToDisplay.map((plan, index) => (
                        <div
                            key={plan.id}
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid #E9D5FF',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                transition: 'border-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B9A8FF')}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E9D5FF')}
                        >
                            {/* 헤더 */}
                            <div style={{ padding: '16px' }}>
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        marginBottom: '8px',
                                        fontSize: '15px',
                                    }}
                                >
                                    {plan.title || t('aiPlan.productAnalysis.bestPlansList.noTitle')}
                                </div>
                                {plan.video_url && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        <span style={{ color: '#6b7280', fontSize: '13px' }}>{plan.video_url}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => toggleExpand(plan.id)}
                                    style={{
                                        color: '#B9A8FF',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                    onMouseEnter={(e) => (e.target.style.color = '#A08FFF')}
                                    onMouseLeave={(e) => (e.target.style.color = '#B9A8FF')}
                                >
                                    {expandedPlan === plan.id ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            <span>{t('aiPlan.productAnalysis.bestPlansList.collapse')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            <span>{t('aiPlan.productAnalysis.bestPlansList.expand')}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 확장 영역 */}
                            {expandedPlan === plan.id && (
                                <div
                                    style={{
                                        padding: '16px',
                                        borderTop: '1px solid #F3F4F6',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px',
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#6b7280',
                                                marginBottom: '8px',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.bestPlansList.hook')}
                                        </div>
                                        <div
                                            style={{
                                                backgroundColor: '#F9FAFB',
                                                padding: '12px',
                                                borderRadius: '6px',
                                                color: '#374151',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {plan.hook || (
                                                <span style={{ color: '#9ca3af' }}>
                                                    {t('aiPlan.productAnalysis.bestPlansList.noData')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#6b7280',
                                                marginBottom: '8px',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.bestPlansList.usp')}
                                        </div>
                                        <div style={{ color: '#374151', fontSize: '13px', lineHeight: '1.6' }}>
                                            {plan.usp || (
                                                <span style={{ color: '#9ca3af' }}>
                                                    {t('aiPlan.productAnalysis.bestPlansList.noData')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#6b7280',
                                                marginBottom: '8px',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.bestPlansList.keyMessage')}
                                        </div>
                                        <div
                                            style={{
                                                backgroundColor: '#F3E8FF',
                                                padding: '12px',
                                                borderRadius: '6px',
                                                color: '#374151',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {plan.message || (
                                                <span style={{ color: '#9ca3af' }}>
                                                    {t('aiPlan.productAnalysis.bestPlansList.noData')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#6b7280',
                                                marginBottom: '8px',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.bestPlansList.cutComposition')}
                                        </div>
                                        {plan.cuts && plan.cuts.length > 0 ? (
                                            <ul
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px',
                                                    paddingLeft: 0,
                                                }}
                                            >
                                                {plan.cuts.map((cut, idx) => (
                                                    <li
                                                        key={idx}
                                                        style={{
                                                            color: '#374151',
                                                            fontSize: '13px',
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '8px',
                                                            listStyle: 'none',
                                                        }}
                                                    >
                                                        <span style={{ color: '#B9A8FF', fontWeight: 'bold' }}>•</span>
                                                        <span>{cut}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                {t('aiPlan.productAnalysis.bestPlansList.noData')}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#6b7280',
                                                marginBottom: '8px',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.bestPlansList.scenarioSummary')}
                                        </div>
                                        <div
                                            style={{
                                                color: '#374151',
                                                fontSize: '13px',
                                                fontStyle: 'italic',
                                                lineHeight: '1.6',
                                            }}
                                        >
                                            {plan.summary || (
                                                <span style={{ color: '#9ca3af' }}>
                                                    {t('aiPlan.productAnalysis.bestPlansList.noData')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
