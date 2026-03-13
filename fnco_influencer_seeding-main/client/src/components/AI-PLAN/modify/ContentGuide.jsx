import { useState, useEffect } from 'react';
import { Film } from 'lucide-react';
import { preprocessMarkdown } from '../utils/markdownComponents.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function ContentGuide({ data, isEditing, onEditToggle, onSave, showToast }) {
    const t = useTranslation();

    // data.data에 구조화된 데이터가 있으면 우선 사용
    const structuredData = data?.data;
    const hasSubsections = structuredData?.subsections && structuredData.subsections.length > 0;
    const hasMarkdown = data?.content_md && !hasSubsections;

    // 편집 가능한 데이터 상태
    const [editingData, setEditingData] = useState({
        subsections: [],
    });

    // 초기 데이터 설정
    useEffect(() => {
        if (structuredData?.subsections) {
            setEditingData({
                subsections: structuredData.subsections.map((s) => ({ ...s })),
            });
        }
    }, [structuredData]);

    // 표시할 데이터
    const displayData = editingData;

    // 서브섹션 내용 수정
    const handleSubsectionChange = (index, value) => {
        const newSubsections = [...editingData.subsections];
        newSubsections[index].content_md = value;
        setEditingData({ subsections: newSubsections });
    };

    // 저장
    const handleSave = () => {
        if (onSave) {
            onSave('content_guide', editingData);
        }

        if (showToast) {
            showToast(t('aiPlan.productAnalysis.modifyPage.contentGuide.sectionSaved'), 'success');
        }
        onEditToggle();
    };

    // 취소
    const handleCancel = () => {
        if (structuredData?.subsections) {
            setEditingData({
                subsections: structuredData.subsections.map((s) => ({ ...s })),
            });
        }
        onEditToggle();
    };

    return (
        <div className="mb-8">
            {/* 섹션 헤더 - SectionHeader 사용 */}
            <SectionHeader
                title={t('aiPlan.productAnalysis.modifyPage.contentGuide.title')}
                subtitle={t('aiPlan.productAnalysis.modifyPage.contentGuide.subtitle')}
                icon={Film}
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
                {hasSubsections && displayData.subsections.length > 0 ? (
                    // data.data.subsections에 구조화된 데이터가 있으면 카드 형식으로 표시
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {displayData.subsections.map((subsection, index) => {
                            return (
                                <div
                                    key={index}
                                    // style={{
                                    //     padding: '20px',
                                    // }}
                                >
                                    <div
                                        style={{
                                            fontWeight: '600',
                                            color: '#374151',
                                            fontSize: '16px',
                                            paddingBottom: '8px',
                                            borderBottom: '1px solid #E5E7EB',
                                        }}
                                    >
                                        {index + 1}. {subsection.title}
                                    </div>
                                    {isEditing ? (
                                        <div
                                            style={{
                                                backgroundColor: 'white',
                                                border: '1px solid #D1D5DB',
                                                borderRadius: '8px',
                                                padding: '12px',
                                            }}
                                        >
                                            <textarea
                                                value={subsection.content_md}
                                                onChange={(e) => handleSubsectionChange(index, e.target.value)}
                                                rows={6}
                                                style={{
                                                    width: '100%',
                                                    border: 'none',
                                                    fontSize: '14px',
                                                    lineHeight: '1.8',
                                                    color: '#4B5563',
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit',
                                                    outline: 'none',
                                                    backgroundColor: 'transparent',
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                color: '#4B5563',
                                                fontSize: '14px',
                                                lineHeight: '1.8',
                                                backgroundColor: 'white',
                                                padding: '16px',
                                                borderRadius: '8px',
                                            }}
                                            className="content-guide-text"
                                            dangerouslySetInnerHTML={{
                                                __html: preprocessMarkdown(subsection.content_md || ''),
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
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
                        {t('aiPlan.productAnalysis.modifyPage.contentGuide.noData')}
                    </div>
                )}
            </div>
        </div>
    );
}
