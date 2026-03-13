import { Button } from '../ui/button.jsx';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation.js';

export function AIPlanConfirm({ onBack }) {
    const t = useTranslation();
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" onClick={onBack} className="mb-4 flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {t('aiPlan.confirmPage.back')}
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">{t('aiPlan.confirmPage.title')}</h1>
                    <p className="text-muted-foreground">{t('aiPlan.confirmPage.subtitle')}</p>
                </div>
                <div className="bg-card rounded-lg border p-6">
                    <p className="text-muted-foreground">{t('aiPlan.confirmPage.contentPlaceholder')}</p>
                </div>
            </div>
        </div>
    );
}
