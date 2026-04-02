import { STAGE_LIST } from './constants';

export function StageStatsCards({ counts, activeStage, onStageClick, total }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
            {STAGE_LIST.map((stage) => {
                const isActive = activeStage === stage.key;
                const count = counts[stage.key] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                    <button
                        key={stage.key}
                        onClick={() => onStageClick(stage.key)}
                        style={{
                            background: isActive ? '#FAFAFA' : '#ffffff',
                            border: isActive ? `1.5px solid ${stage.color}` : '1px solid #E8E8E8',
                            borderRadius: '12px',
                            padding: '14px 16px 12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            boxShadow: isActive
                                ? `0 2px 8px ${stage.color}15`
                                : '0 1px 3px rgba(0,0,0,0.04)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.08)`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = isActive
                                ? `0 2px 8px ${stage.color}15`
                                : '0 1px 3px rgba(0,0,0,0.04)';
                        }}
                    >
                        {/* 상단 악센트 바 */}
                        {isActive && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0,
                                height: '2px',
                                background: stage.color,
                            }} />
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '13px' }}>{stage.icon}</span>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? '#111111' : '#888888',
                                }}>
                                    {stage.label}
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#999999' }}>
                                {pct}%
                            </span>
                        </div>

                        <div style={{
                            fontSize: '11px',
                            color: '#666666',
                            fontWeight: 400,
                            lineHeight: 1.4,
                            marginBottom: '8px',
                        }}>
                            {stage.desc}
                        </div>

                        <div style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#111111',
                            lineHeight: 1,
                            marginBottom: '8px',
                        }}>
                            {count}
                            <span style={{ fontSize: '11px', fontWeight: 400, color: '#888888', marginLeft: '2px' }}>명</span>
                        </div>

                        {/* 프로그레스 바 */}
                        <div style={{
                            height: '3px',
                            background: '#F0F0F0',
                            borderRadius: '2px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: stage.color,
                                borderRadius: '2px',
                                transition: 'width 0.4s ease',
                            }} />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
