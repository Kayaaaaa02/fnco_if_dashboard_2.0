import { RefreshCw, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function AIPrompt({
    activeStep,
    prompt,
    onPromptChange,
    onRefresh,
    onGenerate,
    onGeneratePrompt,
    isGeneratePromptLoading,
    isGenerateLoading,
}) {
    const t = useTranslation();
    const stepLabel = activeStep != null ? t(`aiPlan.aiImageGeneration.step${activeStep}`) : '';
    return (
        <div
            style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {t('aiPlan.aiImageGeneration.aiPrompt')}
                    {stepLabel ? ` (${stepLabel})` : ''}
                </h3>
                <button
                    type="button"
                    onClick={onGeneratePrompt || onRefresh}
                    disabled={isGeneratePromptLoading}
                    style={{
                        padding: '8px 14px',
                        backgroundColor: isGeneratePromptLoading ? '#E5E7EB' : '#F5F3FF',
                        border: '1px solid #DDD6FE',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: isGeneratePromptLoading ? '#9CA3AF' : '#6D28D9',
                        cursor: isGeneratePromptLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        if (!isGeneratePromptLoading) e.currentTarget.style.backgroundColor = '#EDE9FE';
                    }}
                    onMouseLeave={(e) => {
                        if (!isGeneratePromptLoading) e.currentTarget.style.backgroundColor = '#F5F3FF';
                    }}
                >
                    <Sparkles style={{ width: '14px', height: '14px' }} />
                    {isGeneratePromptLoading
                        ? t('aiPlan.aiImageGeneration.generatePromptLoading')
                        : t('aiPlan.aiImageGeneration.generatePrompt')}
                </button>
            </div>
            <p
                style={{
                    fontSize: '12px',
                    color: '#9CA3AF',
                    margin: 0,
                    marginBottom: '12px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line',
                }}
            >
                {t('aiPlan.aiImageGeneration.aiPromptDescription')}
            </p>
            <textarea
                value={
                    isGeneratePromptLoading
                        ? t('aiPlan.aiImageGeneration.generatePromptLoading')
                        : isGenerateLoading
                        ? t('aiPlan.aiImageGeneration.generateImageLoading')
                        : prompt
                }
                onChange={(e) => onPromptChange(e.target.value)}
                readOnly={isGeneratePromptLoading || isGenerateLoading}
                style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: isGeneratePromptLoading || isGenerateLoading ? '#9CA3AF' : '#374151',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    marginBottom: '12px',
                    lineHeight: '1.6',
                }}
                placeholder={`${t('aiPlan.aiImageGeneration.aiPrompt')}...`}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={onRefresh}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
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
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                >
                    <RefreshCw className="w-4 h-4" />
                    {t('aiPlan.aiImageGeneration.refresh')}
                </button>
                <button
                    onClick={onGenerate}
                    disabled={isGenerateLoading}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: isGenerateLoading ? '#D1D5DB' : 'linear-gradient(135deg, #B9A8FF 0%, #9F7AEA 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        cursor: isGenerateLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(185, 168, 255, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                        if (!isGenerateLoading) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(185, 168, 255, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(185, 168, 255, 0.3)';
                    }}
                >
                    <Sparkles className="w-4 h-4" />
                    {isGenerateLoading
                        ? t('aiPlan.aiImageGeneration.generateImageLoading')
                        : t('aiPlan.aiImageGeneration.generate')}
                </button>
            </div>
        </div>
    );
}
