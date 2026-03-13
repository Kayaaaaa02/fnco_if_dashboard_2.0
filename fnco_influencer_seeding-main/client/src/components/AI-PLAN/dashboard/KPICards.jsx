export function KPICards({ kpiData }) {
    return (
        <div className="grid grid-cols-3 gap-6 mb-8">
            {kpiData.map((kpi, index) => {
                const Icon = kpi.icon;
                return (
                    <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-6"
                        style={{
                            cursor: kpi.onClick ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                        }}
                        onClick={kpi.onClick}
                        onMouseEnter={(e) => {
                            if (kpi.onClick) {
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (kpi.onClick) {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className={`w-12 h-12 rounded-lg ${kpi.color} flex items-center justify-center`}
                                style={{ marginLeft: '20px', marginTop: '20px', ...(kpi.style || {}) }}
                            >
                                <Icon className="w-6 h-6" style={kpi.style?.color ? { color: kpi.style.color } : {}} />
                            </div>
                        </div>
                        <div
                            className="text-gray-600 mb-1"
                            style={{ marginLeft: '20px', fontSize: '16px', color: '#6b7280' }}
                        >
                            {kpi.label}
                        </div>
                        <div
                            className="text-[32px]"
                            style={{ marginLeft: '20px', marginBottom: '20px', fontSize: '32px' }}
                        >
                            {kpi.value}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
