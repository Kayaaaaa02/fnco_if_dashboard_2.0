import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useRegion, useTranslation } from '../../../hooks/useTranslation.js';

export function DeepAnalysis({ analysisData, analysisDataCn, analysisDataEng }) {
    const currentRegion = useRegion();
    const t = useTranslation();

    // Dashboard의 언어 필터 상태에 따라 데이터 선택
    const currentData = useMemo(() => {
        // region: 'korea' -> 'ko', 'china' -> 'cn', 'global' -> 'eng'
        if (currentRegion === 'china' && analysisDataCn) {
            return analysisDataCn;
        }
        if (currentRegion === 'global' && analysisDataEng) {
            return analysisDataEng;
        }
        // 'korea' 또는 기본값
        return analysisData;
    }, [currentRegion, analysisData, analysisDataCn, analysisDataEng]);

    // currentData에서 데이터 추출
    const introduction = currentData?.introduction || '';
    const usp = currentData?.usp || [];
    const targetPersona = currentData?.target_persona || {};
    const keyMessages = currentData?.key_messages || [];
    const visualDirection = currentData?.visual_direction || {};
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
                    <Sparkles className="w-5 h-5" style={{ color: 'white' }} />
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                            {t('aiPlan.productAnalysis.deepAnalysis.title')}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', marginTop: '4px' }}>
                            {t('aiPlan.productAnalysis.deepAnalysis.subtitle')}
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
                {/* 소개 */}
                <div
                    style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E9D5FF',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '20px',
                    }}
                >
                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        {t('aiPlan.productAnalysis.deepAnalysis.introduction')}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
                        {introduction || (
                            <span className="text-gray-500">{t('aiPlan.productAnalysis.deepAnalysis.noData')}</span>
                        )}
                    </div>
                </div>

                {/* 핵심 노출 포인트 Top 5 */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', fontSize: '16px' }}>
                        {t('aiPlan.productAnalysis.deepAnalysis.keyExposurePoints')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {usp.length > 0 ? (
                            usp.map((item, index) => {
                                // 언어별 패턴 정의
                                // 한국어: "핵심 노출 포인트 1:"
                                // 영문: "Key Exposure Point 1:"
                                // 중국어: "核心曝光点1："
                                let matchWithBracket = null;
                                let matchWithoutBracket = null;

                                if (currentRegion === 'korea') {
                                    // 한국어 패턴
                                    matchWithBracket = item.match(/핵심 노출 포인트 \d+:\s*\[([^\]]+)\]\s*(.+)/);
                                    matchWithoutBracket = item.match(/핵심 노출 포인트 \d+:\s*(.+)/);
                                } else if (currentRegion === 'global') {
                                    // 영문 패턴
                                    matchWithBracket = item.match(/Key Exposure Point \d+:\s*\[([^\]]+)\]\s*(.+)/i);
                                    matchWithoutBracket = item.match(/Key Exposure Point \d+:\s*(.+)/i);
                                } else if (currentRegion === 'china') {
                                    // 중국어 패턴
                                    matchWithBracket = item.match(/核心曝光点\d+[：:]\s*\[([^\]]+)\]\s*(.+)/);
                                    matchWithoutBracket = item.match(/核心曝光点\d+[：:]\s*(.+)/);
                                }

                                if (matchWithBracket) {
                                    const [, title, content] = matchWithBracket;
                                    return (
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
                                                {title}
                                            </div>
                                            <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
                                                {content}
                                            </div>
                                        </div>
                                    );
                                }
                                if (matchWithoutBracket) {
                                    const [, content] = matchWithoutBracket;
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E9D5FF',
                                                borderRadius: '8px',
                                                padding: '16px',
                                            }}
                                        >
                                            <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
                                                {content}
                                            </div>
                                        </div>
                                    );
                                }
                                // 형식이 맞지 않으면 전체 텍스트 표시
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            backgroundColor: 'white',
                                            border: '1px solid #E9D5FF',
                                            borderRadius: '8px',
                                            padding: '16px',
                                        }}
                                    >
                                        <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
                                            {item}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #E9D5FF',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                                    {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 타겟 페르소나 & 니즈 */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', fontSize: '16px' }}>
                        {t('aiPlan.productAnalysis.deepAnalysis.targetPersona')}
                    </div>
                    <div
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #E9D5FF',
                            borderRadius: '8px',
                            padding: '16px',
                        }}
                    >
                        {targetPersona && Object.keys(targetPersona).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={{ fontWeight: '600', color: '#374151' }}>
                                        {t('aiPlan.productAnalysis.deepAnalysis.target')}{' '}
                                    </span>
                                    <span style={{ color: '#6b7280', fontSize: '13px' }}>
                                        {targetPersona.age_range || (
                                            <span style={{ color: '#9ca3af' }}>
                                                {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: '600', color: '#374151' }}>
                                        {t('aiPlan.productAnalysis.deepAnalysis.painPoint')}{' '}
                                    </span>
                                    <span style={{ color: '#6b7280', fontSize: '13px' }}>
                                        {targetPersona.pain_points && targetPersona.pain_points.length > 0 ? (
                                            targetPersona.pain_points.map((point, index) => (
                                                <span key={index}>
                                                    "{point}"{index < targetPersona.pain_points.length - 1 ? ', ' : ''}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ color: '#9ca3af' }}>
                                                {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: '600', color: '#374151' }}>
                                        {t('aiPlan.productAnalysis.deepAnalysis.needs')}{' '}
                                    </span>
                                    <span style={{ color: '#6b7280', fontSize: '13px' }}>
                                        {targetPersona.needs || (
                                            <span style={{ color: '#9ca3af' }}>
                                                {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                                {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                            </div>
                        )}
                    </div>
                </div>

                {/* 소비자 언어 기반 핵심 카피 */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', fontSize: '16px' }}>
                        {t('aiPlan.productAnalysis.deepAnalysis.keyCopywriting')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {keyMessages.length > 0 ? (
                            keyMessages.map((message, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: '#F3E8FF',
                                        border: '1px solid #E9D5FF',
                                        borderLeft: '4px solid #B9A8FF',
                                        borderRadius: '8px',
                                        padding: '16px',
                                    }}
                                >
                                    <div
                                        style={{
                                            color: '#6b7280',
                                            fontSize: '13px',
                                            lineHeight: '1.6',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        "{message}"
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
                                <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                                    {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 비주얼 & 무드 디렉팅 */}
                <div>
                    <div style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', fontSize: '16px' }}>
                        {t('aiPlan.productAnalysis.deepAnalysis.visualDirection')}
                    </div>
                    <div
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #E9D5FF',
                            borderRadius: '8px',
                            padding: '16px',
                        }}
                    >
                        {visualDirection && Object.keys(visualDirection).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <span style={{ fontWeight: '600', color: '#374151' }}>
                                        {t('aiPlan.productAnalysis.deepAnalysis.toneAndManner')}{' '}
                                    </span>
                                    <span style={{ color: '#6b7280', fontSize: '13px' }}>
                                        {visualDirection.tone_and_manner || (
                                            <span style={{ color: '#9ca3af' }}>
                                                {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {visualDirection.mood_description && (
                                    <div>
                                        <span style={{ fontWeight: '600', color: '#374151' }}>
                                            {t('aiPlan.productAnalysis.deepAnalysis.moodDescription')}{' '}
                                        </span>
                                        <span style={{ color: '#6b7280', fontSize: '13px' }}>
                                            {visualDirection.mood_description}
                                        </span>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                    <div
                                        style={{
                                            backgroundColor: '#F3E8FF',
                                            border: '1px solid #E9D5FF',
                                            borderRadius: '8px',
                                            padding: '12px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#374151',
                                                marginBottom: '8px',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.deepAnalysis.lightingStrategy')}
                                        </div>
                                        <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                                            {visualDirection.lighting_strategy || (
                                                <span style={{ color: '#9ca3af' }}>
                                                    {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            backgroundColor: '#EFF6FF',
                                            border: '1px solid #DBEAFE',
                                            borderRadius: '8px',
                                            padding: '12px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#374151',
                                                marginBottom: '8px',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.deepAnalysis.audioStrategy')}
                                        </div>
                                        <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                                            {visualDirection.audio_strategy || (
                                                <span style={{ color: '#9ca3af' }}>
                                                    {t('aiPlan.productAnalysis.deepAnalysis.noData')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#9ca3af', fontSize: '13px' }}>데이터가 없습니다.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
