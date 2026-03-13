import { useState, useEffect } from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import { preprocessMarkdown } from '../utils/markdownComponents.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function Caution({ data, isEditing, onEditToggle, onSave, showToast }) {
    const t = useTranslation();

    // data가 null이면 빈 객체로 처리
    if (!data) {
        data = { content_md: null };
    }

    // data.data에 구조화된 데이터가 있으면 우선 사용
    const structuredData = data?.data;
    const hasCautions = structuredData?.cautions && structuredData.cautions.length > 0;
    const hasMarkdown = data?.content_md && !hasCautions;

    // 편집 상태 관리
    const [editingData, setEditingData] = useState({
        cautions: [],
        directors_tip_md: '',
    });

    // 초기 데이터 설정
    useEffect(() => {
        if (structuredData?.cautions) {
            setEditingData({
                cautions: structuredData.cautions.map((c) => ({ ...c })),
                directors_tip_md: structuredData.directors_tip_md || '',
            });
        }
    }, [structuredData]);

    // 표시할 데이터: 편집 모드면 editingData, 아니면 editingData (저장된 내용 유지)
    const displayData = editingData;

    // 유의사항 수정
    const handleCautionChange = (index, field, value) => {
        const updated = [...editingData.cautions];
        updated[index] = { ...updated[index], [field]: value };
        setEditingData({ ...editingData, cautions: updated });
    };

    // Director's Tip 수정
    const handleDirectorsTipChange = (value) => {
        setEditingData({ ...editingData, directors_tip_md: value });
    };

    // 저장
    const handleSave = () => {
        if (onSave) {
            onSave('caution', editingData);
        }

        if (showToast) {
            showToast(t('aiPlan.productAnalysis.modifyPage.caution.sectionSaved'), 'success');
        }
        onEditToggle();
    };

    // 취소
    const handleCancel = () => {
        // 원래 데이터로 복원
        if (structuredData?.cautions) {
            setEditingData({
                cautions: structuredData.cautions.map((c) => ({ ...c })),
                directors_tip_md: structuredData.directors_tip_md || '',
            });
        }
        onEditToggle();
    };

    // 각 유의사항별 색상 지정
    const getCautionStyle = (num) => {
        switch (num) {
            case 1:
                return { bgColor: '#FFFBEB', borderColor: '#FCD34D', leftBorderColor: '#F59E0B' }; // 노란색
            case 2:
                return { bgColor: '#FEE2E2', borderColor: '#FCA5A5', leftBorderColor: '#EF4444' }; // 빨간색
            case 3:
                return { bgColor: '#DBEAFE', borderColor: '#93C5FD', leftBorderColor: '#3B82F6' }; // 파란색
            default:
                return { bgColor: '#F3F4F6', borderColor: '#D1D5DB', leftBorderColor: '#6B7280' }; // 회색
        }
    };

    return (
        <div className="mb-8">
            {/* 섹션 헤더 */}
            <SectionHeader
                title={t('aiPlan.productAnalysis.modifyPage.caution.title')}
                subtitle={t('aiPlan.productAnalysis.modifyPage.caution.subtitle')}
                icon={AlertTriangle}
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
                {hasCautions ? (
                    <>
                        {/* 유의사항 제목 */}
                        <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px', marginBottom: '16px' }}>
                            {t('aiPlan.productAnalysis.modifyPage.caution.cautionsTitle')}
                        </div>

                        {/* 유의사항 카드들 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {isEditing
                                ? displayData.cautions.map((caution, index) => {
                                      const { bgColor, borderColor, leftBorderColor } = getCautionStyle(caution.num);
                                      return (
                                          <div
                                              key={caution.num}
                                              style={{
                                                  backgroundColor: bgColor,
                                                  border: `1px solid ${borderColor}`,
                                                  borderLeft: `4px solid ${leftBorderColor}`,
                                                  borderRadius: '8px',
                                                  padding: '16px',
                                              }}
                                          >
                                              {/* 제목 박스 */}
                                              <div
                                                  style={{
                                                      backgroundColor: 'white',
                                                      border: `1px solid ${borderColor}`,
                                                      borderRadius: '6px',
                                                      padding: '8px 12px',
                                                      marginBottom: '12px',
                                                  }}
                                              >
                                                  <input
                                                      type="text"
                                                      value={`${caution.num}. ${caution.title}`}
                                                      onChange={(e) => {
                                                          const newValue = e.target.value.replace(/^\d+\.\s*/, '');
                                                          handleCautionChange(index, 'title', newValue);
                                                      }}
                                                      style={{
                                                          width: '100%',
                                                          padding: '0',
                                                          border: 'none',
                                                          backgroundColor: 'transparent',
                                                          fontWeight: '600',
                                                          color: '#374151',
                                                          fontSize: '14px',
                                                          outline: 'none',
                                                      }}
                                                  />
                                              </div>

                                              {/* 설명 박스 */}
                                              <div
                                                  style={{
                                                      backgroundColor: 'white',
                                                      border: `1px solid ${borderColor}`,
                                                      borderRadius: '6px',
                                                      padding: '8px 12px',
                                                  }}
                                              >
                                                  <textarea
                                                      value={caution.description_md}
                                                      onChange={(e) =>
                                                          handleCautionChange(index, 'description_md', e.target.value)
                                                      }
                                                      rows={4}
                                                      style={{
                                                          width: '100%',
                                                          padding: '0',
                                                          border: 'none',
                                                          backgroundColor: 'transparent',
                                                          color: '#4B5563',
                                                          fontSize: '14px',
                                                          lineHeight: '1.8',
                                                          resize: 'vertical',
                                                          fontFamily: 'inherit',
                                                          outline: 'none',
                                                      }}
                                                  />
                                              </div>
                                          </div>
                                      );
                                  })
                                : displayData.cautions.map((caution) => {
                                      const { bgColor, borderColor, leftBorderColor } = getCautionStyle(caution.num);
                                      return (
                                          <div
                                              key={caution.num}
                                              style={{
                                                  backgroundColor: bgColor,
                                                  border: `1px solid ${borderColor}`,
                                                  borderLeft: `4px solid ${leftBorderColor}`,
                                                  borderRadius: '8px',
                                                  padding: '16px',
                                              }}
                                          >
                                              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                                  {caution.num}. {caution.title}:
                                              </div>
                                              <div
                                                  className="content-guide-text"
                                                  style={{
                                                      color: '#4B5563',
                                                      fontSize: '14px',
                                                      lineHeight: '1.8',
                                                  }}
                                                  dangerouslySetInnerHTML={{
                                                      __html: preprocessMarkdown(caution.description_md || ''),
                                                  }}
                                              />
                                          </div>
                                      );
                                  })}
                        </div>

                        {/* Director's Tip */}
                        {(isEditing || displayData.directors_tip_md) && (
                            <div>
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '16px',
                                        marginBottom: '12px',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.modifyPage.caution.directorsTip')}
                                </div>
                                <div
                                    style={{
                                        backgroundColor: '#F3E8FF',
                                        border: '2px solid #DDD6FE',
                                        borderRadius: '12px',
                                        padding: '20px',
                                    }}
                                >
                                    {isEditing ? (
                                        <div
                                            style={{
                                                backgroundColor: 'white',
                                                border: '1px solid #DDD6FE',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                            }}
                                        >
                                            <textarea
                                                value={displayData.directors_tip_md}
                                                onChange={(e) => handleDirectorsTipChange(e.target.value)}
                                                rows={4}
                                                style={{
                                                    width: '100%',
                                                    padding: '0',
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    color: '#4B5563',
                                                    fontSize: '14px',
                                                    lineHeight: '1.8',
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit',
                                                    outline: 'none',
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <Lightbulb
                                                className="w-5 h-5"
                                                style={{ color: '#8B5CF6', marginTop: '2px', flexShrink: 0 }}
                                            />
                                            <div
                                                className="content-guide-text"
                                                style={{
                                                    color: '#4B5563',
                                                    fontSize: '14px',
                                                    lineHeight: '1.8',
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html: preprocessMarkdown(displayData.directors_tip_md),
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
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
                        {t('aiPlan.productAnalysis.modifyPage.caution.noData')}
                    </div>
                )}
            </div>
        </div>
    );
}
