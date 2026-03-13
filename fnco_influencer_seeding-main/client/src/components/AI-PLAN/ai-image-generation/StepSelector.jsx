import { useTranslation } from '../../../hooks/useTranslation.js';

export function StepSelector({ activeStep, onStepChange }) {
    const t = useTranslation();
    const steps = [
        { id: 1, labelKey: 'step1' },
        { id: 2, labelKey: 'step2' },
        { id: 3, labelKey: 'step3' },
        { id: 4, labelKey: 'step4' }
    ];

    return (
        <div style={{ marginBottom: '24px' ,
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: '#FFFFFF',
        }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                {t('aiPlan.aiImageGeneration.stepSelectorTitle')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {steps.map((step) => (
                    <button
                        key={step.id}
                        onClick={() => onStepChange(step.id)}
                        style={{
                            padding: '16px',
                            backgroundColor: activeStep === step.id ? '#F3E8FF' : '#FFFFFF',
                            border: activeStep === step.id ? '2px solid #B9A8FF' : '1px solid #E5E7EB',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: activeStep === step.id ? '700' : '500',
                            color: activeStep === step.id ? '#7C3AED' : '#374151',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                            if (activeStep !== step.id) {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                                e.currentTarget.style.borderColor = '#D1C4FF';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeStep !== step.id) {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#E5E7EB';
                            }
                        }}
                    >
                        {t(`aiPlan.aiImageGeneration.${step.labelKey}`)}
                    </button>
                ))}
            </div>
        </div>
    );
}

