import { useState, useEffect, useMemo } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { FileText } from 'lucide-react';
import { preprocessMarkdown } from '../utils/markdownComponents.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';

// 마크다운 텍스트에서 구조화된 데이터 추출
const parseEmotionMarkdown = (markdown) => {
    if (!markdown) return null;

    const result = {
        emotionKeywords: [],
        emotionalRewardStages: [],
    };

    // 감정 단어 5개 추출: "1.  **안도감(Relief):** '설명'"
    // 1. 2. 3. 4. 5. 번호 패턴으로 시작하는 항목만 추출
    // **안도감(Relief):** 형식을 고려한 패턴
    const keywordRegex = /([1-5])\.\s+\*\*([^(]+)\(([^)]+)\):\*\*\s*(.+?)(?=\n\s*[1-5]\.\s+\*\*|\n\n|$)/gs;
    let keywordMatch;
    while ((keywordMatch = keywordRegex.exec(markdown)) !== null) {
        // 번호가 1-5 범위인지 확인 (추가 검증)
        const num = parseInt(keywordMatch[1], 10);
        if (num >= 1 && num <= 5) {
            result.emotionKeywords.push({
                keyword: `#${keywordMatch[2].trim()} (${keywordMatch[3].trim()})`,
                description: keywordMatch[4].trim().replace(/^['"]|['"]$/g, ''), // 앞뒤 따옴표 제거
            });
        }
    }

    // 감정 리워드 3단계 추출
    // 실제 형식: 1.  **(시각적 첫 반응) 와, 이건 뭐지?:** \"인용구\" — 설명
    // 1. 2. 3. 번호 패턴으로 시작하는 항목만 추출
    const rewardIndex = markdown.search(/소비자.*?리워드/i);
    const rewardSection = rewardIndex > -1 ? markdown.substring(rewardIndex) : markdown;

    // 패턴: 1.  **(시각적 첫 반응) 와, 이건 뭐지?:** \"인용구\" — 설명
    // ([1-3])\.\s+\*\*\(([^)]+)\) - 번호(1-3)와 subtitle 추출: 1.  **(시각적 첫 반응)
    // \s+([^:]+?):\*\* - title 추출: 와, 이건 뭐지?
    // \s*\\"([^"]+)\\" - 인용구 추출: \"인용구\"
    const stageRegex = /([1-3])\.\s+\*\*\(([^)]+)\)\s+([^:]+?):\*\*\s*\\"([^"]+)\\"/gs;
    let stageMatch;
    while ((stageMatch = stageRegex.exec(rewardSection)) !== null) {
        // 번호가 1-3 범위인지 확인 (추가 검증)
        const num = parseInt(stageMatch[1], 10);
        if (num >= 1 && num <= 3) {
            result.emotionalRewardStages.push({
                stage: stageMatch[1],
                subtitle: stageMatch[2].trim(),
                title: stageMatch[3].trim(),
                quote: stageMatch[4].trim(),
            });
        }
    }

    return result;
};

export function EmotionAnalysis({ data, isEditing, onEditToggle, onSave, showToast, title, subtitle }) {
    const t = useTranslation();

    // data.data에 구조화된 데이터가 있으면 우선 사용
    // 없으면 content_md를 파싱하여 구조화된 데이터로 변환
    const structuredData = useMemo(() => {
        if (data?.data?.emotion_words || data?.data?.emotion_rewards) {
            // data.data에서 구조화된 데이터 직접 사용
            const emotionWords = data.data.emotion_words || [];
            const emotionRewards = data.data.emotion_rewards || [];

            return {
                emotionKeywords: emotionWords.map((item) => ({
                    keyword: item.word || '',
                    description: item.description || '',
                })),
                emotionalRewardStages: emotionRewards.map((item) => ({
                    stage: String(item.num || ''),
                    subtitle: item.stage_type || '',
                    title: item.title || '',
                    quote: item.description || '',
                })),
            };
        } else if (data?.content_md) {
            // content_md가 있으면 파싱
            const parsedData = parseEmotionMarkdown(data.content_md);
            if (parsedData && (parsedData.emotionKeywords.length > 0 || parsedData.emotionalRewardStages.length > 0)) {
                return parsedData;
            }
        }
        return null;
    }, [data?.data?.emotion_words, data?.data?.emotion_rewards, data?.content_md]);

    const hasStructuredData = structuredData !== null;

    // 구조화된 데이터 우선 사용, 없으면 기존 data 사용
    const initialDisplayData = useMemo(() => {
        return hasStructuredData
            ? {
                  planningIntent: data?.planningIntent || '',
                  emotionKeywords: structuredData.emotionKeywords,
                  emotionalRewardStages: structuredData.emotionalRewardStages,
              }
            : data;
    }, [data, hasStructuredData, structuredData?.emotionKeywords, structuredData?.emotionalRewardStages]);

    // 편집 데이터 상태 관리
    const [editingData, setEditingData] = useState(initialDisplayData);

    // data가 변경되면 editingData도 업데이트
    useEffect(() => {
        setEditingData(initialDisplayData);
    }, [initialDisplayData]);

    const displayData = isEditing ? editingData : initialDisplayData;

    // 감정 키워드 편집 핸들러
    const handleKeywordChange = (index, field, value) => {
        const newKeywords = [...(editingData.emotionKeywords || [])];
        if (!newKeywords[index]) {
            newKeywords[index] = { keyword: '', description: '' };
        }

        if (field === 'keyword') {
            newKeywords[index].keyword = value;
        } else if (field === 'description') {
            newKeywords[index].description = value;
        }

        setEditingData({ ...editingData, emotionKeywords: newKeywords });
    };

    // 감정적 리워드 단계 편집 핸들러
    const handleRewardStageChange = (index, field, value) => {
        const newStages = [...(editingData.emotionalRewardStages || [])];
        if (!newStages[index]) {
            newStages[index] = { stage: String(index + 1), subtitle: '', title: '', quote: '' };
        }

        newStages[index][field] = value;
        setEditingData({ ...editingData, emotionalRewardStages: newStages });
    };

    // 저장 핸들러
    const handleSave = () => {
        // 수정된 데이터를 상위 컴포넌트로 전달
        if (onSave) {
            const savedData = {
                emotion_words:
                    editingData.emotionKeywords?.map((item, index) => ({
                        num: index + 1,
                        word: item.keyword,
                        description: item.description,
                    })) || [],
                emotion_rewards:
                    editingData.emotionalRewardStages?.map((item) => ({
                        num: parseInt(item.stage) || 1,
                        stage_type: item.subtitle,
                        title: item.title,
                        description: item.quote,
                    })) || [],
            };

            onSave('emotion', savedData);
        }

        if (showToast) {
            showToast(t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.sectionSaved'), 'success');
        }
        // 편집 모드 종료
        onEditToggle();
    };

    // 취소 핸들러
    const handleCancel = () => {
        setEditingData(initialDisplayData);
        onEditToggle();
    };

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
                    <FileText className="w-5 h-5" style={{ color: 'white' }} />
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                            {title || t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.title')}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', marginTop: '4px' }}>
                            {subtitle || t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.subtitle')}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                style={{
                                    backgroundColor: '#B9A8FF',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: '500',
                                    fontSize: '14px',
                                }}
                            >
                                <Save className="w-4 h-4" />
                                {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.save')}
                            </button>
                            <button
                                onClick={handleCancel}
                                style={{
                                    backgroundColor: 'white',
                                    color: '#6b7280',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: '500',
                                    fontSize: '14px',
                                }}
                            >
                                <X className="w-4 h-4" />
                                {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.cancel')}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onEditToggle}
                            style={{
                                backgroundColor: 'white',
                                color: '#B9A8FF',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: '500',
                                fontSize: '14px',
                            }}
                        >
                            <Edit className="w-4 h-4" />
                            {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.edit')}
                        </button>
                    )}
                </div>
            </div>

            {/* 섹션 콘텐츠 - 흰색 박스로 감싸기 */}
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
                {hasStructuredData ? (
                    <>
                        {/* 기획 의도 (있으면 표시) */}
                        {displayData?.planningIntent && (
                            <div
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    border: '1px solid #E9D5FF',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                }}
                            >
                                <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                    {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.planningIntent')}
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={editingData?.planningIntent || ''}
                                        onChange={(e) =>
                                            setEditingData({ ...editingData, planningIntent: e.target.value })
                                        }
                                        placeholder={t(
                                            'aiPlan.productAnalysis.modifyPage.emotionAnalysis.planningIntentPlaceholder'
                                        )}
                                        style={{
                                            color: '#6b7280',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            backgroundColor: 'white',
                                            border: '1px solid #E9D5FF',
                                            borderRadius: '4px',
                                            padding: '12px',
                                            width: '100%',
                                            minHeight: '80px',
                                            resize: 'vertical',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                ) : (
                                    <div style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                                        {displayData.planningIntent}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 감정 키워드 5가지 */}
                        {displayData?.emotionKeywords && displayData.emotionKeywords.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '16px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.emotionKeywords')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {displayData.emotionKeywords.slice(0, 5).map((item, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: '#F9FAFB',
                                                border: '1px solid #E9D5FF',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                minHeight: '120px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={item?.keyword || ''}
                                                        onChange={(e) =>
                                                            handleKeywordChange(index, 'keyword', e.target.value)
                                                        }
                                                        placeholder={t(
                                                            'aiPlan.productAnalysis.modifyPage.emotionAnalysis.emotionKeywordPlaceholder'
                                                        )}
                                                        style={{
                                                            fontWeight: '700',
                                                            color: '#B9A8FF',
                                                            marginBottom: '12px',
                                                            fontSize: '16px',
                                                            lineHeight: '1.4',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E9D5FF',
                                                            borderRadius: '4px',
                                                            padding: '8px',
                                                            outline: 'none',
                                                        }}
                                                    />
                                                    <textarea
                                                        value={item?.description || ''}
                                                        onChange={(e) =>
                                                            handleKeywordChange(index, 'description', e.target.value)
                                                        }
                                                        placeholder={t(
                                                            'aiPlan.productAnalysis.modifyPage.emotionAnalysis.descriptionPlaceholder'
                                                        )}
                                                        style={{
                                                            color: '#6b7280',
                                                            fontSize: '14px',
                                                            lineHeight: '1.6',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E9D5FF',
                                                            borderRadius: '4px',
                                                            padding: '8px',
                                                            minHeight: '60px',
                                                            resize: 'vertical',
                                                            outline: 'none',
                                                            fontFamily: 'inherit',
                                                        }}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        style={{
                                                            fontWeight: '700',
                                                            color: '#B9A8FF',
                                                            marginBottom: '12px',
                                                            fontSize: '16px',
                                                            lineHeight: '1.4',
                                                        }}
                                                    >
                                                        {item.keyword}
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: '#6b7280',
                                                            fontSize: '14px',
                                                            lineHeight: '1.6',
                                                        }}
                                                    >
                                                        {item.description}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 감정적 리워드 3단계 */}
                        {displayData?.emotionalRewardStages && displayData.emotionalRewardStages.length > 0 && (
                            <div>
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '16px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.emotionalRewardStages')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {displayData.emotionalRewardStages.slice(0, 3).map((stage, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: '#F9FAFB',
                                                border: '1px solid #E9D5FF',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginBottom: '16px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#B9A8FF',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: '16px',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {stage.stage}
                                                </div>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '8px',
                                                    }}
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={stage?.title || ''}
                                                                onChange={(e) =>
                                                                    handleRewardStageChange(
                                                                        index,
                                                                        'title',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'aiPlan.productAnalysis.modifyPage.emotionAnalysis.titlePlaceholder'
                                                                )}
                                                                style={{
                                                                    fontWeight: '700',
                                                                    color: '#374151',
                                                                    fontSize: '16px',
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #E9D5FF',
                                                                    borderRadius: '4px',
                                                                    padding: '8px',
                                                                    outline: 'none',
                                                                }}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={stage?.subtitle || ''}
                                                                onChange={(e) =>
                                                                    handleRewardStageChange(
                                                                        index,
                                                                        'subtitle',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'aiPlan.productAnalysis.modifyPage.emotionAnalysis.subtitlePlaceholder'
                                                                )}
                                                                style={{
                                                                    color: '#9ca3af',
                                                                    fontSize: '13px',
                                                                    fontStyle: 'italic',
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #E9D5FF',
                                                                    borderRadius: '4px',
                                                                    padding: '8px',
                                                                    outline: 'none',
                                                                }}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div
                                                                style={{
                                                                    fontWeight: '700',
                                                                    color: '#374151',
                                                                    fontSize: '16px',
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                {stage.title}
                                                            </div>
                                                            {stage.subtitle && (
                                                                <div
                                                                    style={{
                                                                        color: '#9ca3af',
                                                                        fontSize: '13px',
                                                                        fontStyle: 'italic',
                                                                    }}
                                                                >
                                                                    {stage.subtitle}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <textarea
                                                    value={stage?.quote || ''}
                                                    onChange={(e) =>
                                                        handleRewardStageChange(index, 'quote', e.target.value)
                                                    }
                                                    placeholder={t(
                                                        'aiPlan.productAnalysis.modifyPage.emotionAnalysis.quotePlaceholder'
                                                    )}
                                                    style={{
                                                        color: '#6b7280',
                                                        fontSize: '14px',
                                                        lineHeight: '1.7',
                                                        padding: '16px',
                                                        backgroundColor: 'white',
                                                        borderRadius: '6px',
                                                        border: '1px solid #F3F4F6',
                                                        fontStyle: 'italic',
                                                        minHeight: '100px',
                                                        resize: 'vertical',
                                                        outline: 'none',
                                                        fontFamily: 'inherit',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        color: '#6b7280',
                                                        fontSize: '14px',
                                                        lineHeight: '1.7',
                                                        padding: '16px',
                                                        backgroundColor: 'white',
                                                        borderRadius: '6px',
                                                        border: '1px solid #F3F4F6',
                                                        fontStyle: 'italic',
                                                    }}
                                                >
                                                    "{stage.quote}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : data?.content_md ? (
                    // 파싱 실패 시 마크다운으로 렌더링
                    <div
                        style={{
                            color: '#374151',
                            fontSize: '14px',
                            lineHeight: '1.8',
                        }}
                        dangerouslySetInnerHTML={{ __html: preprocessMarkdown(data.content_md) }}
                    />
                ) : (
                    // 기존 구조화된 데이터 사용
                    <>
                        {/* 기획 의도 */}
                        <div
                            style={{
                                backgroundColor: '#F9FAFB',
                                border: '1px solid #E9D5FF',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '24px',
                            }}
                        >
                            <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.planningIntent')}
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={editingData?.planningIntent || ''}
                                    onChange={(e) => setEditingData({ ...editingData, planningIntent: e.target.value })}
                                    placeholder={t(
                                        'aiPlan.productAnalysis.modifyPage.emotionAnalysis.planningIntentPlaceholder'
                                    )}
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        backgroundColor: 'white',
                                        border: '1px solid #E9D5FF',
                                        borderRadius: '4px',
                                        padding: '12px',
                                        width: '100%',
                                        minHeight: '80px',
                                        resize: 'vertical',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            ) : (
                                <div style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                                    {displayData?.planningIntent || ' '}
                                </div>
                            )}
                        </div>

                        {/* 감정 키워드 5가지 */}
                        {data?.emotionKeywords && data.emotionKeywords.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '16px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.emotionKeywords')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {displayData.emotionKeywords.slice(0, 5).map((item, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: '#F9FAFB',
                                                border: '1px solid #E9D5FF',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                minHeight: '120px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={item?.keyword || ''}
                                                        onChange={(e) =>
                                                            handleKeywordChange(index, 'keyword', e.target.value)
                                                        }
                                                        placeholder={t(
                                                            'aiPlan.productAnalysis.modifyPage.emotionAnalysis.emotionKeywordPlaceholder'
                                                        )}
                                                        style={{
                                                            fontWeight: '700',
                                                            color: '#B9A8FF',
                                                            marginBottom: '12px',
                                                            fontSize: '16px',
                                                            lineHeight: '1.4',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E9D5FF',
                                                            borderRadius: '4px',
                                                            padding: '8px',
                                                            outline: 'none',
                                                        }}
                                                    />
                                                    <textarea
                                                        value={item?.description || ''}
                                                        onChange={(e) =>
                                                            handleKeywordChange(index, 'description', e.target.value)
                                                        }
                                                        placeholder={t(
                                                            'aiPlan.productAnalysis.modifyPage.emotionAnalysis.descriptionPlaceholder'
                                                        )}
                                                        style={{
                                                            color: '#6b7280',
                                                            fontSize: '14px',
                                                            lineHeight: '1.6',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E9D5FF',
                                                            borderRadius: '4px',
                                                            padding: '8px',
                                                            minHeight: '60px',
                                                            resize: 'vertical',
                                                            outline: 'none',
                                                            fontFamily: 'inherit',
                                                        }}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        style={{
                                                            fontWeight: '700',
                                                            color: '#B9A8FF',
                                                            marginBottom: '12px',
                                                            fontSize: '16px',
                                                            lineHeight: '1.4',
                                                        }}
                                                    >
                                                        {item.keyword}
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: '#6b7280',
                                                            fontSize: '14px',
                                                            lineHeight: '1.6',
                                                        }}
                                                    >
                                                        {item.description}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 감정적 리워드 3단계 */}
                        {data?.emotionalRewardStages && data.emotionalRewardStages.length > 0 && (
                            <div>
                                <div
                                    style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '16px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.modifyPage.emotionAnalysis.emotionalRewardStages')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {displayData.emotionalRewardStages.slice(0, 3).map((stage, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: '#F9FAFB',
                                                border: '1px solid #E9D5FF',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginBottom: '16px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#B9A8FF',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: '16px',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {stage.stage}
                                                </div>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '8px',
                                                    }}
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={stage?.title || ''}
                                                                onChange={(e) =>
                                                                    handleRewardStageChange(
                                                                        index,
                                                                        'title',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'aiPlan.productAnalysis.modifyPage.emotionAnalysis.titlePlaceholder'
                                                                )}
                                                                style={{
                                                                    fontWeight: '700',
                                                                    color: '#374151',
                                                                    fontSize: '16px',
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #E9D5FF',
                                                                    borderRadius: '4px',
                                                                    padding: '8px',
                                                                    outline: 'none',
                                                                }}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={stage?.subtitle || ''}
                                                                onChange={(e) =>
                                                                    handleRewardStageChange(
                                                                        index,
                                                                        'subtitle',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'aiPlan.productAnalysis.modifyPage.emotionAnalysis.subtitlePlaceholder'
                                                                )}
                                                                style={{
                                                                    color: '#9ca3af',
                                                                    fontSize: '13px',
                                                                    fontStyle: 'italic',
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #E9D5FF',
                                                                    borderRadius: '4px',
                                                                    padding: '8px',
                                                                    outline: 'none',
                                                                }}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div
                                                                style={{
                                                                    fontWeight: '700',
                                                                    color: '#374151',
                                                                    fontSize: '16px',
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                {stage.title}
                                                            </div>
                                                            {stage.subtitle && (
                                                                <div
                                                                    style={{
                                                                        color: '#9ca3af',
                                                                        fontSize: '13px',
                                                                        fontStyle: 'italic',
                                                                    }}
                                                                >
                                                                    {stage.subtitle}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <textarea
                                                    value={stage?.quote || ''}
                                                    onChange={(e) =>
                                                        handleRewardStageChange(index, 'quote', e.target.value)
                                                    }
                                                    placeholder={t(
                                                        'aiPlan.productAnalysis.modifyPage.emotionAnalysis.quotePlaceholder'
                                                    )}
                                                    style={{
                                                        color: '#6b7280',
                                                        fontSize: '14px',
                                                        lineHeight: '1.7',
                                                        padding: '16px',
                                                        backgroundColor: 'white',
                                                        borderRadius: '6px',
                                                        border: '1px solid #F3F4F6',
                                                        fontStyle: 'italic',
                                                        minHeight: '100px',
                                                        resize: 'vertical',
                                                        outline: 'none',
                                                        fontFamily: 'inherit',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        color: '#6b7280',
                                                        fontSize: '14px',
                                                        lineHeight: '1.7',
                                                        padding: '16px',
                                                        backgroundColor: 'white',
                                                        borderRadius: '6px',
                                                        border: '1px solid #F3F4F6',
                                                        fontStyle: 'italic',
                                                    }}
                                                >
                                                    "{stage.quote}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
