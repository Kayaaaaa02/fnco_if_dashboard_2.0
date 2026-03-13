import { useMemo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useRegion, useTranslation } from '../../../hooks/useTranslation.js';

export function ContentFormatStrategy({ contentFormatStrategy, contentFormatStrategyCn, contentFormatStrategyEng }) {
    const currentRegion = useRegion();
    const t = useTranslation();

    // Dashboard의 언어 필터 상태에 따라 데이터 선택
    const currentStrategy = useMemo(() => {
        // 중국어 필터인 경우
        if (currentRegion === 'china') {
            // 중국어 데이터가 있으면 사용
            if (
                contentFormatStrategyCn &&
                typeof contentFormatStrategyCn === 'object' &&
                (contentFormatStrategyCn.best_practices || contentFormatStrategyCn.worst_practices)
            ) {
                return contentFormatStrategyCn;
            }
            // 없으면 한국어 데이터 fallback
            return contentFormatStrategy;
        }

        // 영문 필터인 경우
        if (currentRegion === 'global') {
            // 영문 데이터가 있으면 사용
            if (
                contentFormatStrategyEng &&
                typeof contentFormatStrategyEng === 'object' &&
                (contentFormatStrategyEng.best_practices || contentFormatStrategyEng.worst_practices)
            ) {
                return contentFormatStrategyEng;
            }
            // 없으면 한국어 데이터 fallback
            return contentFormatStrategy;
        }

        // 'korea' 또는 기본값
        return contentFormatStrategy;
    }, [currentRegion, contentFormatStrategy, contentFormatStrategyCn, contentFormatStrategyEng]);

    const bestPractices = currentStrategy?.best_practices || [];
    const worstPractices = currentStrategy?.worst_practices || [];

    return (
        <div className="mb-8">
            {/* 섹션 헤더 */}
            <div
                style={{
                    backgroundColor: '#B9A8FF',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    borderBottomLeftRadius: '0px',
                    borderBottomRightRadius: '0px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: 'white' }} />
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                            {t('aiPlan.productAnalysis.contentFormatStrategy.title')}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', marginTop: '4px' }}>
                            {t('aiPlan.productAnalysis.contentFormatStrategy.subtitle')}
                        </div>
                    </div>
                </div>
            </div>

            {/* 콘텐츠 영역 - 흰색 박스로 감싸기 */}
            <div
                style={{
                    backgroundColor: 'white',
                    border: '1px solid #E9D5FF',
                    borderTop: 'none',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px',
                    borderTopLeftRadius: '0px',
                    borderTopRightRadius: '0px',
                    padding: '24px',
                }}
            >
                {/* 효과적 콘텐츠 패턴 */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', fontSize: '16px' }}>
                        {t('aiPlan.productAnalysis.contentFormatStrategy.bestPractice')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {bestPractices.length > 0 ? (
                            bestPractices.map((practice, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E9D5FF',
                                        borderRadius: '8px',
                                        padding: '16px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: '600',
                                            color: '#B9A8FF',
                                            marginBottom: '8px',
                                            fontSize: '15px',
                                        }}
                                    >
                                        {practice.name || t('aiPlan.productAnalysis.contentFormatStrategy.noTitle')}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
                                        {practice.description || (
                                            <span style={{ color: '#9ca3af' }}>
                                                {t('aiPlan.productAnalysis.contentFormatStrategy.noData')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #E9D5FF',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                                    {t('aiPlan.productAnalysis.contentFormatStrategy.noData')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 피해야 할 콘텐츠 패턴 */}
                <div>
                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', fontSize: '16px' }}>
                        {t('aiPlan.productAnalysis.contentFormatStrategy.worstPractice')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {worstPractices.length > 0 ? (
                            worstPractices.map((practice, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        borderRadius: '8px',
                                        padding: '16px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: '600',
                                            color: '#DC2626',
                                            marginBottom: '8px',
                                            fontSize: '15px',
                                        }}
                                    >
                                        {practice.name || t('aiPlan.productAnalysis.contentFormatStrategy.noTitle')}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
                                        {practice.description || (
                                            <span style={{ color: '#9ca3af' }}>
                                                {t('aiPlan.productAnalysis.contentFormatStrategy.noData')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div
                                style={{
                                    backgroundColor: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                                    {t('aiPlan.productAnalysis.contentFormatStrategy.noData')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
