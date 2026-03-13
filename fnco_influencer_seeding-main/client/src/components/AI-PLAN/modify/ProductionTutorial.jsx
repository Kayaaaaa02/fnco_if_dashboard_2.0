import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { preprocessMarkdown } from '../utils/markdownComponents.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function ProductionTutorial({ data, isEditing, onEditToggle, onSave, showToast }) {
    const t = useTranslation();

    // data가 null이면 빈 객체로 처리
    if (!data) {
        data = { content_md: null };
    }

    // data.data에 구조화된 데이터가 있으면 우선 사용
    const structuredData = data?.data;
    const hasStructuredData =
        structuredData && (structuredData.materials || structuredData.checklist || structuredData.cut_editing);
    const hasMarkdown = data?.content_md && !hasStructuredData;

    // 편집 가능한 데이터 상태
    const [editingData, setEditingData] = useState({
        materials: '',
        checklist: '',
        cut_editing: '',
    });

    // 초기 데이터 설정
    useEffect(() => {
        if (structuredData) {
            setEditingData({
                materials: structuredData.materials || '',
                checklist: structuredData.checklist || '',
                cut_editing: structuredData.cut_editing || '',
            });
        }
    }, [structuredData]);

    // 표시할 데이터: editingData (저장된 내용 유지)
    const displayData = editingData;

    // 필드 수정 핸들러
    const handleFieldChange = (field, value) => {
        setEditingData({ ...editingData, [field]: value });
    };

    // 저장
    const handleSave = () => {
        if (onSave) {
            onSave('technical', editingData);
        }

        if (showToast) {
            showToast(t('aiPlan.productAnalysis.modifyPage.productionTutorial.sectionSaved'), 'success');
        }
        onEditToggle();
    };

    // 취소
    const handleCancel = () => {
        // 원래 데이터로 복원
        if (structuredData) {
            setEditingData({
                materials: structuredData.materials || '',
                checklist: structuredData.checklist || '',
                cut_editing: structuredData.cut_editing || '',
            });
        }
        onEditToggle();
    };

    return (
        <div className="mb-8">
            {/* 섹션 헤더 - SectionHeader 사용 */}
            <SectionHeader
                title={t('aiPlan.productAnalysis.modifyPage.productionTutorial.title')}
                subtitle={t('aiPlan.productAnalysis.modifyPage.productionTutorial.subtitle')}
                icon={Camera}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* 1. Pre-Production */}
                        {(displayData.materials || displayData.checklist || isEditing) && (
                            <div style={{ marginBottom: '8px' }}>
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '16px',
                                        paddingBottom: '8px',
                                        borderBottom: '1px solid #E5E7EB',
                                    }}
                                >
                                    1. {t('aiPlan.productAnalysis.modifyPage.productionTutorial.preProduction')}
                                </div>

                                {/* Materials */}
                                {(displayData.materials || isEditing) && (
                                    <div style={{ marginTop: '12px', marginLeft: '12px' }}>
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#374151',
                                                fontSize: '14px',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.modifyPage.productionTutorial.materials')}
                                        </div>
                                        {isEditing ? (
                                            <textarea
                                                value={displayData.materials}
                                                onChange={(e) => handleFieldChange('materials', e.target.value)}
                                                rows={2}
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
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    color: '#374151',
                                                    fontSize: '14px',
                                                    lineHeight: '1.6',
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html: preprocessMarkdown(displayData.materials || ''),
                                                }}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Checklist */}
                                {(displayData.checklist || isEditing) && (
                                    <div style={{ marginTop: '16px', marginLeft: '12px' }}>
                                        <div
                                            style={{
                                                fontWeight: '600',
                                                color: '#374151',
                                                fontSize: '14px',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            {t('aiPlan.productAnalysis.modifyPage.productionTutorial.checklist')}
                                        </div>
                                        {isEditing ? (
                                            <textarea
                                                value={displayData.checklist}
                                                onChange={(e) => handleFieldChange('checklist', e.target.value)}
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
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    color: '#374151',
                                                    fontSize: '14px',
                                                    lineHeight: '1.6',
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html: preprocessMarkdown(displayData.checklist || ''),
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. Cut Editing */}
                        {(displayData.cut_editing || isEditing) && (
                            <div style={{ marginBottom: '8px' }}>
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '16px',
                                        paddingBottom: '8px',
                                        borderBottom: '1px solid #E5E7EB',
                                    }}
                                >
                                    2. {t('aiPlan.productAnalysis.modifyPage.productionTutorial.cutEditing')}
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={displayData.cut_editing}
                                        onChange={(e) => handleFieldChange('cut_editing', e.target.value)}
                                        rows={4}
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
                                            marginTop: '8px',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            color: '#374151',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            marginLeft: '12px',
                                            marginTop: '8px',
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: preprocessMarkdown(displayData.cut_editing || ''),
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ) : hasMarkdown ? (
                    <div
                        className="content-guide-text"
                        style={{
                            color: '#374151',
                            fontSize: '14px',
                            lineHeight: '1.8',
                        }}
                        dangerouslySetInnerHTML={{ __html: preprocessMarkdown(data.content_md) }}
                    />
                ) : (
                    <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px' }}>
                        {t('aiPlan.productAnalysis.modifyPage.productionTutorial.noData')}
                    </div>
                )}
            </div>
        </div>
    );
}
