import { useTranslation } from '../../../hooks/useTranslation.js';

export function StyleSettings({ selectedStyle, onStyleChange }) {
    const t = useTranslation();
    const styles = [
        { key: 'friendly', labelKey: 'friendly' },
        { key: 'professional', labelKey: 'professional' },
        { key: 'luxury', labelKey: 'luxury' },
        { key: 'funHumor', labelKey: 'funHumor' },
        { key: 'realNoFilter', labelKey: 'realNoFilter' },
        { key: 'minimal', labelKey: 'minimal' },
    ];

    const currentStyle = styles.find(
        (style) => selectedStyle === style.key || selectedStyle === t(`aiPlan.aiImageGeneration.${style.labelKey}`)
    );

    return (
        <div
            style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
            }}
        >
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                {t('aiPlan.aiImageGeneration.setStyle')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {styles.map((style) => {
                    const isSelected =
                        selectedStyle === style.key ||
                        selectedStyle === t(`aiPlan.aiImageGeneration.${style.labelKey}`);
                    return (
                        <button
                            key={style.key}
                            onClick={() => onStyleChange(t(`aiPlan.aiImageGeneration.${style.labelKey}`))}
                            style={{
                                padding: '12px 16px',
                                backgroundColor: isSelected ? '#E0E7FF' : '#F9FAFB',
                                border: isSelected ? '2px solid #B9A8FF' : '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: isSelected ? '600' : '500',
                                color: isSelected ? '#7C3AED' : '#374151',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                                }
                            }}
                        >
                            {t(`aiPlan.aiImageGeneration.${style.labelKey}`)}
                        </button>
                    );
                })}
            </div>
            {currentStyle && (
                <div
                    style={{
                        marginTop: '14px',
                        backgroundColor: '#F5F3FF',
                        border: '1px solid #DDD6FE',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                    }}
                >
                    <div style={{ color: '#374151', lineHeight: 1.6 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                            {t(`aiPlan.aiImageGeneration.styleDescriptions.${currentStyle.labelKey}.title`)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>
                            {t(`aiPlan.aiImageGeneration.styleDescriptions.${currentStyle.labelKey}.desc`)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
