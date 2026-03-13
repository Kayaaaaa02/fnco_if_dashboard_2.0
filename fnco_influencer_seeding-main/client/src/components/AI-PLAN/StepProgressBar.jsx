import { CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation.js';

export function StepProgressBar({ currentStep, attached = false }) {
    const t = useTranslation();

    // 전체 단계 정의 (대시보드 제외)
    const allSteps = [
        { id: 1, label: t('aiPlan.sidebar.productAnalysis') },
        { id: 2, label: t('aiPlan.sidebar.influencerAnalysis') },
        { id: 3, label: t('aiPlan.sidebar.modify') },
        { id: 4, label: t('aiPlan.sidebar.aiImageGeneration') },
        { id: 5, label: t('aiPlan.sidebar.finalReview') },
    ];

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',

                marginBottom: attached ? '0px' : '30px',
                padding: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: attached ? '0' : '12px',
                ...(attached
                    ? {
                          borderTop: '1px solid #E5E7EB',
                          borderLeft: '1px solid #E5E7EB',
                          borderRight: '1px solid #E5E7EB',
                      }
                    : { border: '1px solid #E5E7EB' }),
            }}
        >
            {allSteps.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                const isFuture = step.id > currentStep;

                return (
                    <div
                        key={step.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}
                    >
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: isCompleted ? '#dcfce7' : isCurrent ? '#B9A8FF' : '#E5E7EB',
                                color: isCompleted ? '#16a34a' : isCurrent ? '#FFFFFF' : '#6B7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: '700',
                                flexShrink: 0,
                            }}
                        >
                            {isCompleted ? <CheckCircle className="w-5 h-5" style={{ color: '#16a34a' }} /> : step.id}
                        </div>
                        {(isCurrent || isFuture) && (
                            <span
                                style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: isCurrent ? '#374151' : '#6B7280',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {step.label}
                            </span>
                        )}
                        {index < allSteps.length - 1 && (
                            <div
                                style={{
                                    width: '60px',
                                    height: '2px',
                                    backgroundColor: isCompleted ? '#16a34a' : '#E5E7EB',
                                    flexShrink: 0,
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
