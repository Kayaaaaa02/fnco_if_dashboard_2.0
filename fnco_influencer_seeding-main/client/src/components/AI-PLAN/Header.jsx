import { Button } from '../ui/button.jsx';
import { User, LogOut, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation.js';

export function Header({ title, onLogout, showBackButton = false, onBack, user, onBackToDashboard, noBorder = false }) {
    const t = useTranslation();
    return (
        <div
            className={`${noBorder ? '' : 'border-b border-gray-200'} bg-white px-8 flex justify-between items-center`}
            style={{ paddingTop: '13px', paddingBottom: '13px' }}
        >
            <div className="flex items-center gap-4">
                {showBackButton && onBack && (
                    <Button
                        variant="outline"
                        onClick={onBack}
                        size="sm"
                        className="flex items-center gap-2"
                        style={{ marginLeft: '10px' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('app.buttons.previousStep')}
                    </Button>
                )}
                <h1
                    className="text-2xl font-semibold"
                    style={{ color: '#B9A8FF', fontSize: '18px', marginLeft: '30px' }}
                >
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                {user && (
                    <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{user?.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{user?.email}</div>
                    </div>
                )}
                {onLogout && (
                    <Button variant="outline" size="sm" onClick={onLogout} className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        {t('app.buttons.logout')}
                    </Button>
                )}
                {onBackToDashboard && (
                    <Button
                        variant="outline"
                        onClick={onBackToDashboard}
                        size="sm"
                        className="flex items-center gap-2"
                        style={{ marginRight: '30px' }}
                    >
                        {t('app.buttons.backToDashboard')}
                    </Button>
                )}
            </div>
        </div>
    );
}
