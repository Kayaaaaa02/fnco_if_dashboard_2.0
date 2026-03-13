import { useState, useEffect, useRef } from 'react';
import { Film, Clock, Upload, Trash2 } from 'lucide-react';
import { preprocessMarkdown } from '../utils/markdownComponents.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';

/** variant: 'default' = 최종 검수용(섹션 카드+표+이미지). 'legacy' = 수정용 이전 형식(단일 표만). imagesByStep 등은 default일 때만 사용 */
export function ScenarioCreation({
    data,
    isEditing,
    onEditToggle,
    onSave,
    showToast,
    imagesByStep,
    planDocId,
    apiBase,
    onImagesChange,
    createdBy,
    variant = 'default',
}) {
    const t = useTranslation();
    const fileInputRefs = useRef({});
    /** 섹션별 이미지 숨김: { 1: true, 2: false, ... } true면 해당 step 이미지 영역 숨김 */
    const [imageHiddenByStep, setImageHiddenByStep] = useState({});

    // data.data에 구조화된 데이터가 있으면 우선 사용
    const structuredData = data?.data;
    const hasTimeline = structuredData?.timeline && structuredData.timeline.length > 0;
    const hasMarkdown = data?.content_md && !hasTimeline;

    // 편집 가능한 데이터 상태
    const [editingData, setEditingData] = useState({
        scenario_title: '',
        runtime_sec: 0,
        timeline: [],
    });

    // 초기 데이터 설정
    useEffect(() => {
        if (structuredData) {
            // runtime_sec 계산: timeline의 마지막 time_end_sec 사용
            let calculatedRuntime = 0;
            if (structuredData.timeline && structuredData.timeline.length > 0) {
                const lastCut = structuredData.timeline[structuredData.timeline.length - 1];
                calculatedRuntime = lastCut.time_end_sec || 0;
            }

            setEditingData({
                scenario_title: structuredData.scenario_title || structuredData.scenario_title_raw || '',
                runtime_sec: structuredData.runtime_sec || calculatedRuntime,
                timeline: structuredData.timeline ? structuredData.timeline.map((t) => ({ ...t })) : [],
            });
        }
    }, [structuredData]);

    // 표시할 데이터
    const displayData = editingData;

    // 타임라인 수정 핸들러
    const handleTimelineChange = (index, field, value) => {
        const newTimeline = [...editingData.timeline];
        newTimeline[index][field] = value;
        setEditingData({ ...editingData, timeline: newTimeline });
    };

    const handleScenarioTitleChange = (value) => {
        setEditingData({ ...editingData, scenario_title: value });
    };

    // emotion_md 처리: # 다음에 줄바꿈 추가
    const processEmotionMd = (text) => {
        if (!text) return '';
        // # 다음에 단어(한글 포함)가 오고 그 다음에 공백이 있으면 줄바꿈 추가
        // 예: "#승리감 "..." -> "#승리감\n"..."
        // 예: "#승리감 ..." -> "#승리감\n..."
        return text.replace(/(#[\w가-힣]+)\s+/g, '$1\n');
    };

    // 저장
    const handleSave = () => {
        if (onSave) {
            onSave('scenario', editingData);
        }

        if (showToast) {
            showToast(t('aiPlan.productAnalysis.modifyPage.scenarioCreation.sectionSaved'), 'success');
        }
        onEditToggle();
    };

    // 취소
    const handleCancel = () => {
        if (structuredData) {
            // runtime_sec 계산: timeline의 마지막 time_end_sec 사용
            let calculatedRuntime = 0;
            if (structuredData.timeline && structuredData.timeline.length > 0) {
                const lastCut = structuredData.timeline[structuredData.timeline.length - 1];
                calculatedRuntime = lastCut.time_end_sec || 0;
            }

            setEditingData({
                scenario_title: structuredData.scenario_title || structuredData.scenario_title_raw || '',
                runtime_sec: structuredData.runtime_sec || calculatedRuntime,
                timeline: structuredData.timeline ? structuredData.timeline.map((t) => ({ ...t })) : [],
            });
        }
        onEditToggle();
    };

    return (
        <div className="mb-8">
            {/* 섹션 헤더 - SectionHeader 사용 */}
            <SectionHeader
                title={t('aiPlan.productAnalysis.modifyPage.scenarioCreation.title')}
                subtitle={t('aiPlan.productAnalysis.modifyPage.scenarioCreation.subtitle')}
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
                {hasTimeline || (isEditing && displayData.timeline.length > 0) ? (
                    // data.data.timeline에 구조화된 데이터가 있으면 카드 형식으로 표시
                    <>
                        {/* 시나리오 제목 */}
                        {(isEditing || displayData.scenario_title) && (
                            <div
                                className="scenario-title-card"
                                style={{
                                    backgroundColor: '#F3F4F6',
                                    border: '2px solid #E9D5FF',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div
                                    className="scenario-title-text"
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}
                                >
                                    <Film className="w-6 h-6" style={{ color: '#B9A8FF' }} />
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={displayData.scenario_title}
                                            onChange={(e) => handleScenarioTitleChange(e.target.value)}
                                            style={{
                                                flex: 1,
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: '#374151',
                                                border: '1px solid #D1D5DB',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                outline: 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: '#374151',
                                            }}
                                        >
                                            {displayData.scenario_title}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 이전 형식(수정용): 단일 표 - 구간 + Visual / Audio / Emotion, default와 동일 필드(visual_action_md) 사용 */}
                        {variant === 'legacy' && (
                            <div style={{ overflowX: 'auto' }}>
                                <table
                                    className="scenario-section-table"
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        border: '1px solid #E5E7EB',
                                        fontSize: '14px',
                                        tableLayout: 'fixed',
                                    }}
                                >
                                    <thead>
                                        <tr style={{ backgroundColor: '#F9FAFB' }}>
                                            <th
                                                style={{
                                                    border: '1px solid #E5E7EB',
                                                    padding: '10px 16px',
                                                    textAlign: 'left',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    color: '#6B7280',
                                                    width: '100px',
                                                }}
                                            >
                                                {t('aiPlan.productAnalysis.modifyPage.scenarioCreation.section') ||
                                                    '구간'}
                                            </th>
                                            <th
                                                style={{
                                                    border: '1px solid #E5E7EB',
                                                    padding: '10px 16px',
                                                    textAlign: 'left',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    color: '#6B7280',
                                                }}
                                            >
                                                {t(
                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.tableHeaders.visualAction'
                                                ) || 'Visual / Action'}
                                            </th>
                                            <th
                                                style={{
                                                    border: '1px solid #E5E7EB',
                                                    padding: '10px 16px',
                                                    textAlign: 'left',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    color: '#6B7280',
                                                }}
                                            >
                                                {t(
                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.tableHeaders.audioNarration'
                                                ) || 'Audio / Narration'}
                                            </th>
                                            <th
                                                style={{
                                                    border: '1px solid #E5E7EB',
                                                    padding: '10px 16px',
                                                    textAlign: 'left',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    color: '#6B7280',
                                                }}
                                            >
                                                {t(
                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.tableHeaders.emotionNote'
                                                ) || 'Emotion / Key Point'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayData.timeline.map((cut, index) => {
                                            const sectionLabels = ['HOOK', 'Middle', 'Highlight', 'CTA'];
                                            const sectionLabel = sectionLabels[index] ?? `Section ${index + 1}`;
                                            const timeStr =
                                                cut.time_raw || `${cut.time_start_sec ?? 0}-${cut.time_end_sec ?? 0}s`;
                                            const sectionCell = `${sectionLabel} (${timeStr})`;
                                            return (
                                                <tr key={cut.cut_id || index} style={{ backgroundColor: 'white' }}>
                                                    <td
                                                        style={{
                                                            border: '1px solid #E5E7EB',
                                                            padding: '10px 16px',
                                                            verticalAlign: 'middle',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: '#4B5563',
                                                        }}
                                                    >
                                                        {sectionCell}
                                                    </td>
                                                    <td
                                                        style={{
                                                            border: '1px solid #E5E7EB',
                                                            padding: '12px 16px',
                                                            verticalAlign: 'top',
                                                        }}
                                                    >
                                                        {isEditing ? (
                                                            <textarea
                                                                value={cut.visual_action_md ?? cut.visual_md ?? ''}
                                                                onChange={(e) =>
                                                                    handleTimelineChange(
                                                                        index,
                                                                        'visual_action_md',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                rows={4}
                                                                placeholder={t(
                                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.visualActionPlaceholder'
                                                                )}
                                                                style={{
                                                                    width: '100%',
                                                                    border: '1px solid #D1D5DB',
                                                                    borderRadius: '6px',
                                                                    padding: '10px 12px',
                                                                    fontSize: '13px',
                                                                    lineHeight: '1.7',
                                                                    color: '#4B5563',
                                                                    resize: 'vertical',
                                                                }}
                                                            />
                                                        ) : cut.visual_action_md || cut.visual_md ? (
                                                            <div
                                                                style={{
                                                                    color: '#4B5563',
                                                                    fontSize: '13px',
                                                                    lineHeight: '1.7',
                                                                }}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: preprocessMarkdown(
                                                                        cut.visual_action_md || cut.visual_md || ''
                                                                    ),
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{ color: '#9CA3AF', fontSize: '13px' }}>-</div>
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            border: '1px solid #E5E7EB',
                                                            padding: '12px 16px',
                                                            verticalAlign: 'top',
                                                        }}
                                                    >
                                                        {isEditing ? (
                                                            <textarea
                                                                value={cut.audio_md ?? ''}
                                                                onChange={(e) =>
                                                                    handleTimelineChange(
                                                                        index,
                                                                        'audio_md',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                rows={4}
                                                                style={{
                                                                    width: '100%',
                                                                    border: '1px solid #D1D5DB',
                                                                    borderRadius: '6px',
                                                                    padding: '10px 12px',
                                                                    fontSize: '13px',
                                                                    lineHeight: '1.7',
                                                                    color: '#4B5563',
                                                                    resize: 'vertical',
                                                                }}
                                                            />
                                                        ) : cut.audio_md ? (
                                                            <div
                                                                style={{
                                                                    color: '#4B5563',
                                                                    fontSize: '13px',
                                                                    lineHeight: '1.7',
                                                                }}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: preprocessMarkdown(cut.audio_md),
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{ color: '#9CA3AF', fontSize: '13px' }}>-</div>
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            border: '1px solid #E5E7EB',
                                                            padding: '12px 16px',
                                                            verticalAlign: 'top',
                                                        }}
                                                    >
                                                        {isEditing ? (
                                                            <textarea
                                                                value={cut.emotion_md ?? ''}
                                                                onChange={(e) =>
                                                                    handleTimelineChange(
                                                                        index,
                                                                        'emotion_md',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                rows={4}
                                                                style={{
                                                                    width: '100%',
                                                                    border: '1px solid #D1D5DB',
                                                                    borderRadius: '6px',
                                                                    padding: '10px 12px',
                                                                    fontSize: '13px',
                                                                    lineHeight: '1.7',
                                                                    color: '#4B5563',
                                                                    resize: 'vertical',
                                                                }}
                                                            />
                                                        ) : cut.emotion_md ? (
                                                            <div
                                                                style={{
                                                                    color: '#4B5563',
                                                                    fontSize: '13px',
                                                                    lineHeight: '1.7',
                                                                }}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: preprocessMarkdown(
                                                                        processEmotionMd(cut.emotion_md)
                                                                    ),
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{ color: '#9CA3AF', fontSize: '13px' }}>-</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 타임라인: 섹션별 카드 (Hook, Middle 등) - 최종 검수용(default) */}
                        {variant !== 'legacy' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {displayData.timeline.map((cut, index) => {
                                    const sectionTitle =
                                        cut.time_raw ||
                                        `Section ${index + 1} (${cut.time_start_sec ?? 0}-${cut.time_end_sec ?? 0}s)`;
                                    const sectionLabels = ['HOOK', 'Middle', 'Highlight', 'CTA'];
                                    const sectionLabel = sectionLabels[index] ?? `Section ${index + 1}`;
                                    const displayTitle = `${sectionLabel} (${sectionTitle})`;
                                    return (
                                        <div
                                            key={cut.cut_id || index}
                                            className="timeline-section-card"
                                            style={{
                                                backgroundColor: 'white',
                                                border: '2px solid #E9D5FF',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* 섹션 제목 (Hook 0-3s, Middle 3-9s 등) + 이미지 숨기기 토글 (PDF에서 연보라 통일용 클래스) */}
                                            <div
                                                className="scenario-card-header"
                                                style={{
                                                    padding: '12px 20px',
                                                    backgroundColor: '#F5F3FF',
                                                    borderBottom: '1px solid #E9D5FF',
                                                    fontWeight: '700',
                                                    fontSize: '15px',
                                                    color: '#374151',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '8px',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Clock className="w-5 h-5" style={{ color: '#B9A8FF' }} />
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: preprocessMarkdown(displayTitle),
                                                        }}
                                                    />
                                                </div>
                                                {imagesByStep && (
                                                    <div
                                                        className="no-print"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: '10px',
                                                                fontWeight: '600',
                                                                color: '#6B7280',
                                                            }}
                                                        >
                                                            {imageHiddenByStep[index + 1]
                                                                ? t(
                                                                      'aiPlan.productAnalysis.modifyPage.scenarioCreation.showImages'
                                                                  ) || '이미지 표시'
                                                                : t(
                                                                      'aiPlan.productAnalysis.modifyPage.scenarioCreation.hideImages'
                                                                  ) || '이미지 숨기기'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={!!imageHiddenByStep[index + 1]}
                                                            onClick={() =>
                                                                setImageHiddenByStep((prev) => ({
                                                                    ...prev,
                                                                    [index + 1]: !prev[index + 1],
                                                                }))
                                                            }
                                                            style={{
                                                                position: 'relative',
                                                                width: '44px',
                                                                height: '24px',
                                                                borderRadius: '12px',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: 0,
                                                                flexShrink: 0,
                                                                backgroundColor: imageHiddenByStep[index + 1]
                                                                    ? '#22C55E'
                                                                    : '#D1D5DB',
                                                                transition: 'background-color 0.2s ease',
                                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '2px',
                                                                    left: imageHiddenByStep[index + 1] ? '22px' : '2px',
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: '#fff',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                                                    transition: 'left 0.2s ease',
                                                                }}
                                                            />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {/* 시나리오 표 (PDF에서 표 형식으로 인쇄) */}
                                            <div style={{ borderTop: '1px solid #E5E7EB', overflow: 'hidden' }}>
                                                <table
                                                    className="scenario-section-table"
                                                    style={{
                                                        width: '100%',
                                                        borderCollapse: 'collapse',
                                                        tableLayout: 'fixed',
                                                    }}
                                                >
                                                    <thead>
                                                        <tr>
                                                            <th
                                                                style={{
                                                                    padding: '10px 16px',
                                                                    borderRight: '1px solid #E5E7EB',
                                                                    borderBottom: '1px solid #E5E7EB',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#6B7280',
                                                                    backgroundColor: '#F9FAFB',
                                                                    textAlign: 'left',
                                                                }}
                                                            >
                                                                {t(
                                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.tableHeaders.visualAction'
                                                                )}
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: '10px 16px',
                                                                    borderRight: '1px solid #E5E7EB',
                                                                    borderBottom: '1px solid #E5E7EB',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#6B7280',
                                                                    backgroundColor: '#F9FAFB',
                                                                    textAlign: 'left',
                                                                }}
                                                            >
                                                                {t(
                                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.tableHeaders.audioNarration'
                                                                )}
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: '10px 16px',
                                                                    borderBottom: '1px solid #E5E7EB',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    color: '#6B7280',
                                                                    backgroundColor: '#F9FAFB',
                                                                    textAlign: 'left',
                                                                }}
                                                            >
                                                                {t(
                                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.tableHeaders.emotionNote'
                                                                )}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td
                                                                style={{
                                                                    padding: '12px 16px',
                                                                    borderRight: '1px solid #E5E7EB',
                                                                    verticalAlign: 'top',
                                                                    width: '33.33%',
                                                                }}
                                                            >
                                                                {isEditing ? (
                                                                    <textarea
                                                                        value={cut.visual_action_md || ''}
                                                                        onChange={(e) =>
                                                                            handleTimelineChange(
                                                                                index,
                                                                                'visual_action_md',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        rows={4}
                                                                        placeholder={t(
                                                                            'aiPlan.productAnalysis.modifyPage.scenarioCreation.visualActionPlaceholder'
                                                                        )}
                                                                        style={{
                                                                            width: '100%',
                                                                            border: '1px solid #D1D5DB',
                                                                            borderRadius: '6px',
                                                                            padding: '10px 12px',
                                                                            fontSize: '13px',
                                                                            lineHeight: '1.7',
                                                                            color: '#4B5563',
                                                                            resize: 'vertical',
                                                                            fontFamily: 'inherit',
                                                                            outline: 'none',
                                                                            minHeight: '80px',
                                                                        }}
                                                                    />
                                                                ) : cut.visual_action_md ? (
                                                                    <div
                                                                        style={{
                                                                            color: '#4B5563',
                                                                            fontSize: '13px',
                                                                            lineHeight: '1.7',
                                                                        }}
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: preprocessMarkdown(
                                                                                cut.visual_action_md
                                                                            ),
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ color: '#9CA3AF', fontSize: '13px' }}>
                                                                        -
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding: '12px 16px',
                                                                    borderRight: '1px solid #E5E7EB',
                                                                    verticalAlign: 'top',
                                                                    width: '33.33%',
                                                                }}
                                                            >
                                                                {isEditing ? (
                                                                    <textarea
                                                                        value={cut.audio_md || ''}
                                                                        onChange={(e) =>
                                                                            handleTimelineChange(
                                                                                index,
                                                                                'audio_md',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        rows={4}
                                                                        style={{
                                                                            width: '100%',
                                                                            border: '1px solid #D1D5DB',
                                                                            borderRadius: '6px',
                                                                            padding: '10px 12px',
                                                                            fontSize: '13px',
                                                                            lineHeight: '1.7',
                                                                            color: '#4B5563',
                                                                            resize: 'vertical',
                                                                            fontFamily: 'inherit',
                                                                            outline: 'none',
                                                                            minHeight: '80px',
                                                                        }}
                                                                    />
                                                                ) : cut.audio_md ? (
                                                                    <div
                                                                        style={{
                                                                            color: '#4B5563',
                                                                            fontSize: '13px',
                                                                            lineHeight: '1.7',
                                                                        }}
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: preprocessMarkdown(cut.audio_md),
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ color: '#9CA3AF', fontSize: '13px' }}>
                                                                        -
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding: '12px 16px',
                                                                    verticalAlign: 'top',
                                                                    width: '33.33%',
                                                                }}
                                                            >
                                                                {isEditing ? (
                                                                    <textarea
                                                                        value={cut.emotion_md || ''}
                                                                        onChange={(e) =>
                                                                            handleTimelineChange(
                                                                                index,
                                                                                'emotion_md',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        rows={4}
                                                                        style={{
                                                                            width: '100%',
                                                                            border: '1px solid #D1D5DB',
                                                                            borderRadius: '6px',
                                                                            padding: '10px 12px',
                                                                            fontSize: '13px',
                                                                            lineHeight: '1.7',
                                                                            color: '#4B5563',
                                                                            resize: 'vertical',
                                                                            fontFamily: 'inherit',
                                                                            outline: 'none',
                                                                            minHeight: '80px',
                                                                        }}
                                                                    />
                                                                ) : cut.emotion_md ? (
                                                                    <div
                                                                        style={{
                                                                            color: '#4B5563',
                                                                            fontSize: '13px',
                                                                            lineHeight: '1.7',
                                                                        }}
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: preprocessMarkdown(cut.emotion_md),
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ color: '#9CA3AF', fontSize: '13px' }}>
                                                                        -
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            {/* 섹션별 생성 이미지 (imagesByStep 전달 시, is_selected !== false 만 표시. 토글로 숨김 시 미표시) */}
                                            {imagesByStep &&
                                                !imageHiddenByStep[index + 1] &&
                                                (() => {
                                                    const step = index + 1;
                                                    const allImages = imagesByStep[step] || [];
                                                    const selectedImages = allImages.filter(
                                                        (i) => i.is_selected !== false
                                                    );
                                                    const slots = [...selectedImages.slice(0, 3)];
                                                    while (slots.length < 3) slots.push(null);
                                                    const canEditImages =
                                                        planDocId && apiBase && typeof onImagesChange === 'function';

                                                    const handleDelete = async (imgUrl) => {
                                                        if (!imgUrl || !canEditImages) return;
                                                        try {
                                                            const res = await fetch(
                                                                `${apiBase}/ai-image/image/select`,
                                                                {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        img_url: imgUrl,
                                                                        is_selected: false,
                                                                        plan_doc_id: planDocId,
                                                                        step,
                                                                    }),
                                                                }
                                                            );
                                                            if (res.ok) onImagesChange();
                                                            else
                                                                showToast?.(
                                                                    t(
                                                                        'aiPlan.productAnalysis.modifyPage.scenarioCreation.deleteFailed'
                                                                    ) || '삭제 실패',
                                                                    'error'
                                                                );
                                                        } catch (e) {
                                                            showToast?.(e?.message || '삭제 실패', 'error');
                                                        }
                                                    };

                                                    const handleUpload = (slotIndex) => {
                                                        const key = `${step}-${slotIndex}`;
                                                        fileInputRefs.current[key]?.click();
                                                    };

                                                    const onFileChange = async (e, slotIndex) => {
                                                        const file = e.target?.files?.[0];
                                                        if (!file || !canEditImages) return;
                                                        e.target.value = '';
                                                        try {
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            formData.append('plan_doc_id', planDocId);
                                                            formData.append('step', String(step));
                                                            if (createdBy && String(createdBy).trim()) {
                                                                formData.append('created_by', String(createdBy).trim());
                                                            }
                                                            const res = await fetch(`${apiBase}/ai-image/upload`, {
                                                                method: 'POST',
                                                                body: formData,
                                                            });
                                                            if (res.ok) onImagesChange();
                                                            else {
                                                                const err = await res.json().catch(() => ({}));
                                                                showToast?.(err?.error || '업로드 실패', 'error');
                                                            }
                                                        } catch (err) {
                                                            showToast?.(err?.message || '업로드 실패', 'error');
                                                        }
                                                    };

                                                    return (
                                                        <div
                                                            style={{
                                                                borderTop: '1px solid #E9D5FF',
                                                                padding: '16px 20px',
                                                                backgroundColor: '#FAFAFA',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: '1fr 1fr 1fr',
                                                                    gap: '12px',
                                                                }}
                                                            >
                                                                {slots.map((img, idx) => {
                                                                    const fileInputKey = `${step}-${idx}`;
                                                                    return (
                                                                        <div
                                                                            key={fileInputKey}
                                                                            style={{
                                                                                width: '100%',
                                                                                aspectRatio: '9/16',
                                                                                borderRadius: '8px',
                                                                                overflow: 'hidden',
                                                                                border: '1px solid #E5E7EB',
                                                                                position: 'relative',
                                                                                backgroundColor: img
                                                                                    ? undefined
                                                                                    : '#F3F4F6',
                                                                            }}
                                                                        >
                                                                            {img?.url ? (
                                                                                <>
                                                                                    <img
                                                                                        src={img.url}
                                                                                        alt=""
                                                                                        style={{
                                                                                            width: '100%',
                                                                                            height: '100%',
                                                                                            objectFit: 'cover',
                                                                                        }}
                                                                                    />
                                                                                    {canEditImages && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                handleDelete(img.url)
                                                                                            }
                                                                                            title={
                                                                                                t(
                                                                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.delete'
                                                                                                ) || '삭제'
                                                                                            }
                                                                                            style={{
                                                                                                position: 'absolute',
                                                                                                top: '6px',
                                                                                                right: '6px',
                                                                                                padding: '4px 8px',
                                                                                                background:
                                                                                                    'rgba(220,38,38,0.9)',
                                                                                                color: 'white',
                                                                                                border: 'none',
                                                                                                borderRadius: '6px',
                                                                                                cursor: 'pointer',
                                                                                                fontSize: '12px',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                gap: '4px',
                                                                                            }}
                                                                                        >
                                                                                            <Trash2 className="w-4 h-4" />
                                                                                            {t(
                                                                                                'aiPlan.productAnalysis.modifyPage.scenarioCreation.delete'
                                                                                            ) || '삭제'}
                                                                                        </button>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    {canEditImages && (
                                                                                        <>
                                                                                            <input
                                                                                                ref={(el) =>
                                                                                                    (fileInputRefs.current[
                                                                                                        fileInputKey
                                                                                                    ] = el)
                                                                                                }
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                style={{
                                                                                                    display: 'none',
                                                                                                }}
                                                                                                onChange={(e) =>
                                                                                                    onFileChange(e, idx)
                                                                                                }
                                                                                            />
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleUpload(idx)
                                                                                                }
                                                                                                style={{
                                                                                                    width: '100%',
                                                                                                    height: '100%',
                                                                                                    display: 'flex',
                                                                                                    flexDirection:
                                                                                                        'column',
                                                                                                    alignItems:
                                                                                                        'center',
                                                                                                    justifyContent:
                                                                                                        'center',
                                                                                                    gap: '8px',
                                                                                                    background:
                                                                                                        '#F3F4F6',
                                                                                                    border: '1px dashed #D1D5DB',
                                                                                                    borderRadius: '8px',
                                                                                                    cursor: 'pointer',
                                                                                                    color: '#6B7280',
                                                                                                    fontSize: '13px',
                                                                                                }}
                                                                                            >
                                                                                                <Upload className="w-8 h-8" />
                                                                                                {t(
                                                                                                    'aiPlan.productAnalysis.modifyPage.scenarioCreation.upload'
                                                                                                ) || '업로드'}
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                    {!canEditImages && (
                                                                                        <div
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                height: '100%',
                                                                                                border: '1px dashed #D1D5DB',
                                                                                                borderRadius: '8px',
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                        </div>
                                    );
                                })}
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
                            overflowX: 'auto',
                        }}
                        dangerouslySetInnerHTML={{ __html: preprocessMarkdown(data.content_md) }}
                    />
                ) : (
                    <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px' }}>
                        {t('aiPlan.productAnalysis.modifyPage.scenarioCreation.noData')}
                    </div>
                )}
            </div>
        </div>
    );
}
