import { useTranslation } from '../../hooks/useTranslation.js';

export function CurrentStepCard({ icon: Icon, title, description, iconColor = '#B9A8FF', attached = false }) {
    const t = useTranslation();

    return (
        <div
            className="no-print"
            style={{
                backgroundColor: '#FFFFFF',
                borderRadius: attached ? '0' : '8px',
                padding: '20px 24px',

                marginBottom: attached ? '0px' : '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                ...(attached
                    ? {
                          borderLeft: '1px solid #E5E7EB',
                          borderRight: '1px solid #E5E7EB',
                          borderBottom: '1px solid #E5E7EB',
                      }
                    : { border: 'none' }),
            }}
        >
            <div
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon className="w-6 h-6" style={{ color: '#FFFFFF' }} />
            </div>
            <div>
                <h2
                    style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '4px',
                    }}
                >
                    {title}
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>{description}</p>
            </div>
        </div>
    );
}
