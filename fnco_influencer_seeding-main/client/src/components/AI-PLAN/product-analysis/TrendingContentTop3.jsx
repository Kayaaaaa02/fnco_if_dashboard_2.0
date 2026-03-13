import { useState, useMemo } from 'react';
import { Youtube, Play, Music, BarChart3, HelpCircle, Instagram } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ContentDetailModal } from './ContentDetailModal.jsx';
import { simpleMarkdownComponents, preprocessMarkdown } from '../utils/markdownComponents.jsx';
import { getMediaUrl, getYoutubeThumbnailUrl } from '../utils/contentUtils.js';
import { parsePostSummary } from '../utils/parsePostSummary.js';
import { useRegion, useTranslation } from '../../../hooks/useTranslation.js';

export function TrendingContentTop3({ topContents = {}, planDocId, category }) {
    const currentRegion = useRegion();
    const t = useTranslation();
    const [selectedPlatform, setSelectedPlatform] = useState('Youtube');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);
    const [selectedParsedSummary, setSelectedParsedSummary] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);

    // 플랫폼 이름 매핑
    const platformMap = {
        Youtube: 'youtube',
        Instagram: 'instagram',
        Tiktok: 'tiktok',
    };

    // 현재 선택된 플랫폼의 데이터 가져오기
    const rawPlatformData = topContents[platformMap[selectedPlatform]] || [];

    // 언어 필터에 맞게 데이터 변환 (ai_post_summary, ai_channel_summary 선택)
    const currentPlatformData = useMemo(() => {
        return rawPlatformData.map((item) => {
            let aiPostSummary = item.ai_post_summary;
            let aiChannelSummary = item.ai_channel_summary;

            // 중국어 필터인 경우
            if (currentRegion === 'china') {
                if (item.ai_post_summary_cn) {
                    aiPostSummary = item.ai_post_summary_cn;
                }
                if (item.ai_channel_summary_cn) {
                    aiChannelSummary = item.ai_channel_summary_cn;
                }
            }
            // 영문 필터인 경우
            else if (currentRegion === 'global') {
                if (item.ai_post_summary_eng) {
                    aiPostSummary = item.ai_post_summary_eng;
                }
                if (item.ai_channel_summary_eng) {
                    aiChannelSummary = item.ai_channel_summary_eng;
                }
            }
            // 한국어 또는 기본값은 원본 데이터 사용

            return {
                ...item,
                ai_post_summary: aiPostSummary,
                ai_channel_summary: aiChannelSummary,
            };
        });
    }, [rawPlatformData, currentRegion]);

    // 플랫폼별 최신 업데이트 날짜 가져오기 (max(created_dt))
    const getLatestUpdateDate = (platformData) => {
        if (!platformData || platformData.length === 0) return null;
        const dates = platformData
            .map((item) => item.created_dt)
            .filter((dt) => dt)
            .sort((a, b) => new Date(b) - new Date(a));
        return dates.length > 0 ? dates[0] : null;
    };

    const latestUpdateDate = getLatestUpdateDate(currentPlatformData);
    const formattedUpdateDate = latestUpdateDate
        ? (() => {
              const date = new Date(latestUpdateDate);
              return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
                  date.getDate()
              ).padStart(2, '0')}`;
          })()
        : '-';

    // ai_channel_summary 가져오기 (rank_no=1인 항목의 summary 사용, 모두 같은 데이터)
    const channelSummary =
        currentPlatformData.length > 0 && currentPlatformData[0].ai_channel_summary
            ? currentPlatformData[0].ai_channel_summary
            : null;

    // rank_no별 항목 가져오기 헬퍼 함수
    const getItemByRank = (rankNo) => {
        // rank_no가 숫자 또는 문자열일 수 있으므로 둘 다 비교
        return currentPlatformData.find((item) => {
            const itemRankNo = item.rank_no;
            return itemRankNo === rankNo || Number(itemRankNo) === rankNo || String(itemRankNo) === String(rankNo);
        });
    };

    // 플랫폼별 스타일 설정
    const platformStyles = {
        Youtube: {
            icon: Youtube,
            iconColor: 'text-red-600',
            headerBg: 'bg-red-50',
            headerBorder: 'border-red-200',
            headerText: 'text-red-900',
            border: 'border-red-200',
            emptyBg: 'bg-red-50',
        },
        Instagram: {
            icon: Instagram,
            iconColor: 'text-pink-600',
            headerBg: 'bg-pink-50',
            headerBorder: 'border-pink-200',
            headerText: 'text-pink-900',
            border: 'border-pink-200',
            emptyBg: 'bg-pink-50',
        },
        Tiktok: {
            icon: Music,
            iconColor: 'text-gray-700',
            headerBg: 'bg-gray-50',
            headerBorder: 'border-gray-200',
            headerText: 'text-gray-900',
            border: 'border-gray-200',
            emptyBg: 'bg-gray-50',
        },
    };

    // 공통 카드 렌더링 함수
    const renderContentCards = (platformName) => {
        const styles = platformStyles[platformName];
        const IconComponent = styles.icon;
        const platformLabel =
            platformName === 'Youtube' ? 'Youtube Shorts' : platformName === 'Tiktok' ? 'TikTok' : 'Instagram';

        return (
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((rankNo) => {
                    const item = getItemByRank(rankNo);
                    const mediaUrl = item ? getMediaUrl(item) : null;

                    if (!item) {
                        return (
                            <div
                                key={rankNo}
                                className={`bg-white border-2 ${styles.border} rounded-lg overflow-hidden opacity-50`}
                            >
                                <div
                                    className={`p-4 ${styles.headerBg} border-b ${styles.headerBorder} flex items-center justify-center gap-2`}
                                >
                                    <IconComponent className={`w-5 h-5 ${styles.iconColor}`} />
                                    <span className={`text-sm ${styles.headerText}`}>{platformLabel}</span>
                                </div>
                                <div className="p-4">
                                    <div className="relative mb-3 bg-gray-200 aspect-[9/16] rounded-lg flex items-center justify-center">
                                        <span className="text-xs text-gray-500">
                                            {t('aiPlan.productAnalysis.trendingContentTop3.noData')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={item.id || rankNo}
                            className={`bg-white border-2 ${styles.border} rounded-lg overflow-hidden`}
                        >
                            <div
                                className={`p-4 ${styles.headerBg} border-b ${styles.headerBorder} flex items-center justify-center gap-2`}
                            >
                                <IconComponent className={`w-5 h-5 ${styles.iconColor}`} />
                                <span className={`text-sm ${styles.headerText}`}>{platformLabel}</span>
                            </div>
                            <div className="p-4">
                                <div className="relative mb-3">
                                    {platformName === 'Youtube' && item?.post_url ? (
                                        // YouTube인 경우 썸네일 표시
                                        <>
                                            <a
                                                href={item.post_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full bg-gray-900 rounded-xl overflow-hidden shadow-lg relative group cursor-pointer"
                                                style={{ height: '600px', minHeight: '600px' }}
                                            >
                                                <img
                                                    src={
                                                        getYoutubeThumbnailUrl(item.post_url, 'maxresdefault') ||
                                                        getYoutubeThumbnailUrl(item.post_url, 'hqdefault') ||
                                                        ''
                                                    }
                                                    alt={item.title || `TOP ${rankNo} YouTube video`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // 썸네일 로드 실패 시 대체 이미지
                                                        const fallback = getYoutubeThumbnailUrl(
                                                            item.post_url,
                                                            'hqdefault'
                                                        );
                                                        if (fallback && e.target.src !== fallback) {
                                                            e.target.src = fallback;
                                                        }
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                        <Play className="w-8 h-8 text-white ml-1" fill="white" />
                                                    </div>
                                                </div>
                                                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs z-10">
                                                    TOP {rankNo}
                                                </div>
                                            </a>
                                        </>
                                    ) : mediaUrl ? (
                                        // YouTube가 아닌 경우 video 태그 사용
                                        <>
                                            <video
                                                src={mediaUrl}
                                                className="w-full aspect-[9/16] object-cover rounded-lg"
                                                controls
                                                muted
                                                loop
                                                playsInline
                                            />
                                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                                                TOP {rankNo}
                                            </div>
                                        </>
                                    ) : (
                                        // 미디어가 없는 경우
                                        <>
                                            <img
                                                src="https://images.unsplash.com/photo-1673338585546-818cce22e1a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBtYWtldXAlMjBwb3J0cmFpdCUyMHZlcnRpY2FsfGVufDF8fHx8MTc2NTQyNjA2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                                alt={`TOP ${rankNo}`}
                                                className="w-full aspect-[9/16] object-cover rounded-lg"
                                            />
                                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                                                TOP {rankNo}
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                                    <Play className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="mb-3 space-y-2">
                                    {/* 게시물 제목 */}
                                    {item.title && (
                                        <div
                                            style={{
                                                backgroundColor: '#F9FAFB',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                padding: '14px 16px',
                                                marginBottom: '16px',
                                            }}
                                        >
                                            <h4
                                                style={{
                                                    fontSize: '15px',
                                                    fontWeight: '700',
                                                    color: '#111827',
                                                    margin: 0,
                                                    lineHeight: '1.5',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    maxHeight: '4.5em',
                                                }}
                                                title={item.title}
                                            >
                                                {item.title.length > 100
                                                    ? `${item.title.substring(0, 100)}...`
                                                    : item.title}
                                            </h4>
                                        </div>
                                    )}

                                    {/* 채널명과 조회수 정보 */}
                                    {(item.author_nm || item.view_count) && (
                                        <div
                                            style={{
                                                backgroundColor: '#F9FAFB',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                marginBottom: '16px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {item.author_nm && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span
                                                            style={{
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                color: '#6B7280',
                                                                minWidth: '50px',
                                                            }}
                                                        >
                                                            {t('aiPlan.productAnalysis.trendingContentTop3.channel')}:
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: '13px',
                                                                color: '#374151',
                                                                fontWeight: '500',
                                                            }}
                                                        >
                                                            {item.author_nm}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.view_count && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span
                                                            style={{
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                color: '#6B7280',
                                                                minWidth: '50px',
                                                            }}
                                                        >
                                                            {t('aiPlan.productAnalysis.trendingContentTop3.views')}:
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: '13px',
                                                                color: '#374151',
                                                                fontWeight: '500',
                                                            }}
                                                        >
                                                            {typeof item.view_count === 'number'
                                                                ? item.view_count.toLocaleString()
                                                                : typeof item.view_count === 'string'
                                                                ? Number(
                                                                      item.view_count.replace(/,/g, '')
                                                                  ).toLocaleString()
                                                                : item.view_count}
                                                            {t('aiPlan.productAnalysis.trendingContentTop3.viewsUnit')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {(() => {
                                        const parsedSummary = item.ai_post_summary
                                            ? parsePostSummary(item.ai_post_summary)
                                            : null;

                                        if (!parsedSummary) return null;

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {parsedSummary.핵심내용알고리즘진단 && (
                                                    <div
                                                        style={{
                                                            backgroundColor: '#FEF3F2',
                                                            borderLeft: '3px solid #EF4444',
                                                            borderRadius: '6px',
                                                            padding: '12px',
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                fontSize: '13px',
                                                                fontWeight: '700',
                                                                color: '#991B1B',
                                                                marginBottom: '8px',
                                                            }}
                                                        >
                                                            {t(
                                                                'aiPlan.productAnalysis.trendingContentTop3.coreInsights'
                                                            )}
                                                            :
                                                        </p>
                                                        <div
                                                            style={{
                                                                fontSize: '13px',
                                                                color: '#374151',
                                                                lineHeight: '1.6',
                                                            }}
                                                            dangerouslySetInnerHTML={{
                                                                __html: preprocessMarkdown(
                                                                    parsedSummary.핵심내용알고리즘진단
                                                                ),
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {parsedSummary.핵심메시지 && (
                                                    <div
                                                        style={{
                                                            backgroundColor: '#F0F9FF',
                                                            borderLeft: '3px solid #3B82F6',
                                                            borderRadius: '6px',
                                                            padding: '12px',
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                fontSize: '13px',
                                                                fontWeight: '700',
                                                                color: '#1E40AF',
                                                                marginBottom: '8px',
                                                            }}
                                                        >
                                                            {t(
                                                                'aiPlan.productAnalysis.trendingContentTop3.coreMessage'
                                                            )}
                                                            :
                                                        </p>
                                                        <div
                                                            style={{
                                                                fontSize: '13px',
                                                                color: '#374151',
                                                                lineHeight: '1.6',
                                                            }}
                                                            dangerouslySetInnerHTML={{
                                                                __html: preprocessMarkdown(parsedSummary.핵심메시지),
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {parsedSummary.벤치마킹요소 && (
                                                    <div
                                                        style={{
                                                            backgroundColor: '#F5F3FF',
                                                            borderLeft: '3px solid #B9A8FF',
                                                            borderRadius: '6px',
                                                            padding: '12px',
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                fontSize: '13px',
                                                                fontWeight: '700',
                                                                color: '#7C3AED',
                                                                marginBottom: '8px',
                                                            }}
                                                        >
                                                            벤치마킹 요소:
                                                        </p>
                                                        <div
                                                            style={{
                                                                fontSize: '13px',
                                                                color: '#374151',
                                                                lineHeight: '1.6',
                                                            }}
                                                            dangerouslySetInnerHTML={{
                                                                __html: preprocessMarkdown(parsedSummary.벤치마킹요소),
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {parsedSummary.톤앤무드 && parsedSummary.콘텐츠특징 && (
                                                    <div
                                                        style={{
                                                            backgroundColor: '#F0FDF4',
                                                            borderLeft: '3px solid #10B981',
                                                            borderRadius: '6px',
                                                            padding: '12px',
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                fontSize: '13px',
                                                                fontWeight: '700',
                                                                color: '#047857',
                                                                marginBottom: '8px',
                                                            }}
                                                        >
                                                            {t(
                                                                'aiPlan.productAnalysis.trendingContentTop3.toneMoodFeatures'
                                                            )}
                                                            :
                                                        </p>
                                                        <div
                                                            style={{
                                                                fontSize: '13px',
                                                                color: '#374151',
                                                                lineHeight: '1.6',
                                                            }}
                                                            dangerouslySetInnerHTML={{
                                                                __html: preprocessMarkdown(
                                                                    [parsedSummary.톤앤무드, parsedSummary.콘텐츠특징]
                                                                        .filter(Boolean)
                                                                        .join(', ')
                                                                ),
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex gap-2" style={{ marginTop: '12px', width: '100%' }}>
                                    {item.post_url && (
                                        <a
                                            href={item.post_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px 16px',
                                                backgroundColor: 'white',
                                                border: '1px solid #B9A8FF',
                                                borderRadius: '6px',
                                                color: '#B9A8FF',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                textDecoration: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#B9A8FF';
                                                e.target.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'white';
                                                e.target.style.color = '#B9A8FF';
                                            }}
                                        >
                                            🔗 {t('aiPlan.productAnalysis.trendingContentTop3.watchVideo')}
                                        </a>
                                    )}
                                    <button
                                        onClick={() => {
                                            const parsed = item.ai_post_summary
                                                ? parsePostSummary(item.ai_post_summary)
                                                : null;
                                            setSelectedContent(item);
                                            setSelectedParsedSummary(parsed);
                                            setModalOpen(true);
                                        }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            padding: '8px 24px',
                                            backgroundColor: '#B9A8FF',
                                            border: '1px solid #B9A8FF',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            flex: 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#A08FFF';
                                            e.target.style.borderColor = '#A08FFF';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#B9A8FF';
                                            e.target.style.borderColor = '#B9A8FF';
                                        }}
                                    >
                                        {t('aiPlan.productAnalysis.trendingContentTop3.viewMore')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // category가 'ETC'인 경우 전체 컴포넌트 숨김 처리
    if (category === 'ETC') {
        return null;
    }

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
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <BarChart3 className="w-5 h-5" style={{ color: 'white' }} />
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                }}
                            >
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                                    {t('aiPlan.productAnalysis.trendingContentTop3.title')}
                                </div>
                                <div
                                    style={{
                                        color: 'rgba(255, 255, 255, 0.75)',
                                        fontSize: '10px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {t('aiPlan.productAnalysis.trendingContentTop3.dataUpdateDate')}:{' '}
                                    {formattedUpdateDate} /{' '}
                                    {t('aiPlan.productAnalysis.trendingContentTop3.collectionTime')}
                                </div>
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', marginTop: '4px' }}>
                                {t('aiPlan.productAnalysis.trendingContentTop3.subtitle')}
                            </div>
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
                {/* 플랫폼 탭 */}
                <div className="flex gap-2 items-center mb-6" style={{ position: 'relative' }}>
                    {['Youtube', 'Instagram', 'Tiktok'].map((platform) => (
                        <button
                            key={platform}
                            onClick={() => setSelectedPlatform(platform)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: selectedPlatform === platform ? '600' : '500',
                                transition: 'all 0.2s ease',
                                backgroundColor: selectedPlatform === platform ? '#8B7FFF' : '#F3F4F6',
                                color: selectedPlatform === platform ? 'white' : '#6B7285',
                                border: selectedPlatform === platform ? 'none' : '1px solid #E5E7EB',
                                cursor: 'pointer',
                                boxShadow:
                                    selectedPlatform === platform ? '0 2px 4px rgba(139, 127, 255, 0.3)' : 'none',
                                marginBottom: '10px',
                            }}
                            onMouseEnter={(e) => {
                                if (selectedPlatform !== platform) {
                                    e.target.style.backgroundColor = '#E5E7EB';
                                    e.target.style.color = '#374151';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedPlatform !== platform) {
                                    e.target.style.backgroundColor = '#F3F4F6';
                                    e.target.style.color = '#6B7280';
                                }
                            }}
                        >
                            {platform}
                        </button>
                    ))}
                    <div
                        style={{ position: 'relative', display: 'inline-block' }}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <HelpCircle
                            className="w-5 h-5 cursor-pointer"
                            style={{ marginBottom: '10px', color: '#6B7280' }}
                            onMouseEnter={(e) => (e.target.style.color = '#4B5563')}
                            onMouseLeave={(e) => (e.target.style.color = '#6B7280')}
                        />
                        {showTooltip && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '30px',
                                    top: '0',
                                    backgroundColor: 'white',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    zIndex: 1000,
                                    minWidth: '600px',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                }}
                            >
                                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#1F2937' }}>
                                    {t('aiPlan.productAnalysis.trendingContentTop3.tooltipTitle')}
                                </div>
                                <div style={{ marginBottom: '8px', color: '#374151' }}>
                                    {t('aiPlan.productAnalysis.trendingContentTop3.tooltipTiktok')}
                                </div>
                                <div style={{ marginBottom: '8px', color: '#374151' }}>
                                    {t('aiPlan.productAnalysis.trendingContentTop3.tooltipYoutube')}
                                </div>
                                <div style={{ color: '#374151' }}>
                                    {t('aiPlan.productAnalysis.trendingContentTop3.tooltipInstagram')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Youtube 콘텐츠 */}
                {selectedPlatform === 'Youtube' && (
                    <div>
                        <div
                            style={{
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '24px',
                            }}
                        >
                            <div
                                style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}
                                dangerouslySetInnerHTML={{
                                    __html: channelSummary
                                        ? `<p>${preprocessMarkdown(channelSummary)}</p>`
                                        : `<span style="color: #9CA3AF">${t(
                                              'aiPlan.productAnalysis.trendingContentTop3.noData'
                                          )}</span>`,
                                }}
                            />
                        </div>

                        {renderContentCards('Youtube')}
                    </div>
                )}

                {/* Tiktok 콘텐츠 */}
                {selectedPlatform === 'Tiktok' && (
                    <div>
                        <div
                            style={{
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '24px',
                            }}
                        >
                            <div
                                style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}
                                dangerouslySetInnerHTML={{
                                    __html: channelSummary
                                        ? `<p>${preprocessMarkdown(channelSummary)}</p>`
                                        : `<span style="color: #9CA3AF">${t(
                                              'aiPlan.productAnalysis.trendingContentTop3.noData'
                                          )}</span>`,
                                }}
                            />
                        </div>

                        {renderContentCards('Tiktok')}
                    </div>
                )}

                {/* Instagram 콘텐츠 */}
                {selectedPlatform === 'Instagram' && (
                    <div>
                        <div
                            style={{
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '24px',
                            }}
                        >
                            <div
                                style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}
                                dangerouslySetInnerHTML={{
                                    __html: channelSummary
                                        ? `<p>${preprocessMarkdown(channelSummary)}</p>`
                                        : `<span style="color: #9CA3AF">${t(
                                              'aiPlan.productAnalysis.trendingContentTop3.noData'
                                          )}</span>`,
                                }}
                            />
                        </div>

                        {renderContentCards('Instagram')}
                    </div>
                )}

                {/* 콘텐츠 상세 분석 모달 */}
                <ContentDetailModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    content={selectedContent}
                    parsedSummary={selectedParsedSummary}
                />
            </div>
        </div>
    );
}
