import { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

export function Toast({ message, type = 'success', isVisible, onClose, duration = 3000 }) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const typeConfig = {
        success: {
            icon: CheckCircle,
            bgColor: '#10B981',
            iconColor: 'white',
        },
        error: {
            icon: AlertCircle,
            bgColor: '#EF4444',
            iconColor: 'white',
        },
        info: {
            icon: Info,
            bgColor: '#3B82F6',
            iconColor: 'white',
        },
    };

    const config = typeConfig[type] || typeConfig.success;
    const Icon = config.icon;

    return (
        <div
            style={{
                position: 'fixed',
                top: '40%',
                left: '55%',
                transform: 'translateX(-50%)',
                zIndex: 10000,
                animation: 'fadeIn 0.3s ease-in-out',
            }}
        >
            <div
                style={{
                    backgroundColor: config.bgColor,
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    minWidth: '350px',
                    maxWidth: '600px',
                }}
            >
                <Icon className="w-5 h-5" style={{ color: config.iconColor, flexShrink: 0, marginTop: '2px' }} />
                <div
                    style={{
                        flex: 1,
                        fontSize: '14px',
                        fontWeight: '500',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word',
                    }}
                >
                    {message}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                        marginTop: '2px',
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <style>
                {`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateX(-50%) translateY(-20px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(-50%) translateY(0) scale(1);
                        }
                    }
                `}
            </style>
        </div>
    );
}
