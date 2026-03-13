import { useTranslation } from '../../../hooks/useTranslation.js';

export function StepContent({ step, data }) {
    const t = useTranslation();
    const safe = data || {};
    const visual = safe.visual ?? '';
    const audio = safe.audio ?? '';
    const emotion = safe.emotion ?? '';

    return (
        <div
            style={{
                border: '1px solid rgb(235, 229, 231)',
                borderRadius: '12px',
                padding: '24px',
                backgroundColor: '#FFF0F5',
            }}
        >
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                {t(`aiPlan.aiImageGeneration.step${step}`)}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Visual / Action */}
                <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        📹 {t('aiPlan.aiImageGeneration.visualAction')}
                    </h4>
                    <div
                        style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '16px',
                            fontSize: '14px',
                            color: '#374151',
                            lineHeight: '1.8',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {visual || '—'}
                    </div>
                </div>

                {/* Audio / Narration */}
                <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        🎵 {t('aiPlan.aiImageGeneration.audioNarration')}
                    </h4>
                    <div
                        style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '16px',
                            fontSize: '14px',
                            color: '#374151',
                            lineHeight: '1.8',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {audio || '—'}
                    </div>
                </div>

                {/* Emotion / Note */}
                <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        💡 {t('aiPlan.aiImageGeneration.emotionNote')}
                    </h4>
                    <div
                        style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '16px',
                            fontSize: '14px',
                            color: '#374151',
                            lineHeight: '1.8',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {emotion || '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}
