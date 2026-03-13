import { Sparkles } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function InformationSection() {
    const t = useTranslation();

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6" style={{ marginBottom: '32px' }}>
            <div className="flex items-start gap-0">
                <div
                    className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                        width: '25px',
                        height: '25px',
                        marginLeft: '10px',
                        marginTop: '20px',
                    }}
                >
                    <Sparkles className="w-5 h-5 text-white" style={{ color: '#9333ea' }}/>
                </div>
                <div style={{ flex: 1, marginLeft: '8px' }}>
                    <div
                        className="mb-3"
                        style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginTop: '20px',
                        }}
                    >
                        {t('aiPlan.influencerAnalysis.howToUse')}
                    </div>
                    <ul
                        className="space-y-2"
                        style={{
                            fontSize: '14px',
                            color: '#374151',
                            marginTop: '10px',
                            marginBottom: '25px',
                        }}
                    >
                        <li>{t('aiPlan.influencerAnalysis.step1')}</li>
                        <li>{t('aiPlan.influencerAnalysis.step2')}</li>
                        <li>{t('aiPlan.influencerAnalysis.step3')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

