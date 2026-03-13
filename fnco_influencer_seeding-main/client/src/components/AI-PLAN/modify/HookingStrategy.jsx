import { useState, useEffect } from 'react';
import { Zap, Eye, Volume2, Hand, Target } from 'lucide-react';
import { preprocessMarkdown } from '../utils/markdownComponents.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function HookingStrategy({ data, isEditing, onEditToggle, onSave, showToast }) {
    const t = useTranslation();

    // data.data에 구조화된 데이터가 있으면 우선 사용
    const structuredData = data?.data;
    const hasStructuredData = structuredData?.hooking_strategy || structuredData?.sensory_triggers;
    const hasMarkdown = data?.content_md && !hasStructuredData;

    // 편집 가능한 데이터 상태
    const [editingData, setEditingData] = useState({
        hooking_strategy: '',
        sensory_triggers: [],
        result_focus: '',
    });

    // 초기 데이터 설정
    useEffect(() => {
        if (structuredData) {
            setEditingData({
                hooking_strategy: structuredData.hooking_strategy || '',
                sensory_triggers: structuredData.sensory_triggers
                    ? structuredData.sensory_triggers.map((t) => ({ ...t }))
                    : [],
                result_focus: structuredData.result_focus || '',
            });
        }
    }, [structuredData]);

    // 표시할 데이터
    const displayData = editingData;

    // 각 필드 수정 핸들러
    const handleHookingStrategyChange = (value) => {
        setEditingData({ ...editingData, hooking_strategy: value });
    };

    const handleTriggerChange = (index, field, value) => {
        const newTriggers = [...editingData.sensory_triggers];
        newTriggers[index][field] = value;
        setEditingData({ ...editingData, sensory_triggers: newTriggers });
    };

    const handleResultFocusChange = (value) => {
        setEditingData({ ...editingData, result_focus: value });
    };

    // 저장
    const handleSave = () => {
        if (onSave) {
            onSave('hooking', editingData);
        }

        if (showToast) {
            showToast(t('aiPlan.productAnalysis.modifyPage.hookingStrategy.sectionSaved'), 'success');
        }
        onEditToggle();
    };

    // 취소
    const handleCancel = () => {
        if (structuredData) {
            setEditingData({
                hooking_strategy: structuredData.hooking_strategy || '',
                sensory_triggers: structuredData.sensory_triggers
                    ? structuredData.sensory_triggers.map((t) => ({ ...t }))
                    : [],
                result_focus: structuredData.result_focus || '',
            });
        }
        onEditToggle();
    };

    return (
        <div className="mb-8">
            {/* 섹션 헤더 - SectionHeader 사용 */}
            <SectionHeader
                title={t('aiPlan.productAnalysis.modifyPage.hookingStrategy.title')}
                subtitle={t('aiPlan.productAnalysis.modifyPage.hookingStrategy.subtitle')}
                icon={Zap}
                bgColor="#B9A8FF"
                iconColor="white"
                isEditing={isEditing}
                onEditToggle={onEditToggle}
                onSave={handleSave}
                onCancel={handleCancel}
            />

            {/* 섹션 콘텐츠 */}
            <div
                style={{
                    backgroundColor: 'white',
                    border: '1px solid #E9D5FF',
                    borderTop: 'none',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px',
                    padding: '24px',
                }}
            >
                {hasStructuredData ? (
                    // data.data에 구조화된 데이터가 있으면 카드 형식으로 표시
                    <>
                        {/* Hooking Logic */}
                        {(isEditing || displayData.hooking_strategy) && (
                            <div
                                style={{
                                    marginBottom: '20px',
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '16px',
                                        marginBottom: '8px',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.modifyPage.hookingStrategy.hookingLogic')}
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={displayData.hooking_strategy}
                                        onChange={(e) => handleHookingStrategyChange(e.target.value)}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            border: '1px solid #D1D5DB',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            color: '#374151',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                            marginLeft: '12px',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            color: '#374151',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            marginLeft: '12px',
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: preprocessMarkdown(displayData.hooking_strategy),
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Trigger Points (Scroll Stopper) */}
                        {displayData.sensory_triggers && displayData.sensory_triggers.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                                        {t('aiPlan.productAnalysis.modifyPage.hookingStrategy.triggerPoints')}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {displayData.sensory_triggers.map((trigger, index) => {
                                        const typeLabel = t(
                                            `aiPlan.productAnalysis.modifyPage.hookingStrategy.triggerTypes.${trigger.type}`
                                        );

                                        return (
                                            <div key={index} style={{ marginBottom: '8px' }}>
                                                {isEditing ? (
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontWeight: '600',
                                                                color: '#374151',
                                                                fontSize: '14px',
                                                                marginBottom: '6px',
                                                            }}
                                                        >
                                                            [{typeLabel}]
                                                        </div>
                                                        <textarea
                                                            value={trigger.description}
                                                            onChange={(e) =>
                                                                handleTriggerChange(
                                                                    index,
                                                                    'description',
                                                                    e.target.value
                                                                )
                                                            }
                                                            rows={3}
                                                            style={{
                                                                width: '100%',
                                                                border: '1px solid #D1D5DB',
                                                                borderRadius: '6px',
                                                                padding: '8px 12px',
                                                                fontSize: '14px',
                                                                lineHeight: '1.6',
                                                                color: '#4B5563',
                                                                resize: 'vertical',
                                                                fontFamily: 'inherit',
                                                                outline: 'none',
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            color: '#374151',
                                                            fontSize: '14px',
                                                            lineHeight: '1.6',
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: '600' }}>[{typeLabel}]</span>{' '}
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: preprocessMarkdown(trigger.description),
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Focus */}
                        {(isEditing || displayData.result_focus) && (
                            <div
                                style={{
                                    backgroundColor: '#FEF3C7',
                                    border: '2px solid #FCD34D',
                                    borderRadius: '12px',
                                    padding: '20px',
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#92400E',
                                        marginBottom: '12px',
                                        fontSize: '16px',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.modifyPage.hookingStrategy.focus')}
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={displayData.result_focus}
                                        onChange={(e) => handleResultFocusChange(e.target.value)}
                                        rows={4}
                                        style={{
                                            width: '100%',
                                            border: 'none',
                                            fontSize: '14px',
                                            lineHeight: '1.8',
                                            color: '#78350F',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                            backgroundColor: 'transparent', // 투명!
                                            padding: '0', // 패딩 제거
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            color: '#78350F',
                                            fontSize: '14px',
                                            lineHeight: '1.8',
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: preprocessMarkdown(displayData.result_focus),
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </>
                ) : hasMarkdown ? (
                    // content_md가 있으면 마크다운으로 렌더링
                    <div
                        style={{
                            color: '#374151',
                            fontSize: '14px',
                            lineHeight: '1.8',
                        }}
                        dangerouslySetInnerHTML={{ __html: preprocessMarkdown(data.content_md) }}
                    />
                ) : (
                    <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px' }}>
                        {t('aiPlan.productAnalysis.modifyPage.hookingStrategy.noData')}
                    </div>
                )}
            </div>
        </div>
    );
}
