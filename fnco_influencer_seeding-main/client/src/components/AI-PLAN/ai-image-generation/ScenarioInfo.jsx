import { Sparkles, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function ScenarioInfo({ title, runningTime }) {
    const t = useTranslation();
    return (
        <div style={{
            backgroundColor: '#F3E8FF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
        }}>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles style={{ color: '#9333ea', width: '18px', height: '18px' }} />
                <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>{t('aiPlan.aiImageGeneration.scenarioTitle')}: </span>
                <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle style={{ width: '14px', height: '14px', color: '#9333ea' }} />
                <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>{t('aiPlan.aiImageGeneration.runtime')}: </span>
                <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{runningTime}</span>
            </div>
        </div>
    );
}

