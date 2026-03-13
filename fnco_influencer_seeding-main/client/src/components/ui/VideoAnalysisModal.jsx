import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog.jsx';
import { Badge } from './badge.jsx';
import { Button } from './button.jsx';
import { ChevronDown, ChevronUp, AlertCircle, Lightbulb, Leaf, X, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { parseUrl } from '@common/utils.js';
import { markdownComponents } from './markdownStyles.jsx';
import { useAppSelector } from '../../store/hooks.js';
import { useTranslation } from '../../hooks/useTranslation.js';

// 우선순위 설정 (동적 번역을 위해 함수로 변경)
const getPriorityConfig = (t) => ({
    high: {
        label: t('videoAnalysis.priority.labels.high'),
        textColor: 'text-red-600 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        iconHoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30',
        icon: <Lightbulb className="w-4 h-4" />,
        title: t('videoAnalysis.priority.high'),
        titleIcon: <Star className="w-5 h-5" fill="currentColor" />,
    },
    medium: {
        label: t('videoAnalysis.priority.labels.medium'),
        textColor: 'text-yellow-600 dark:text-yellow-400',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconHoverColor: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
        icon: <Lightbulb className="w-4 h-4" />,
        title: t('videoAnalysis.priority.medium'),
        titleIcon: <Star className="w-5 h-5" fill="currentColor" />,
    },
    low: {
        label: t('videoAnalysis.priority.labels.low'),
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800',
        iconHoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
        icon: <Lightbulb className="w-4 h-4" />,
        title: t('videoAnalysis.priority.low'),
        titleIcon: <Star className="w-5 h-5" fill="currentColor" />,
    },
});

export function VideoAnalysisModal({ open, onOpenChange, content }) {
    const [expandedItems, setExpandedItems] = useState({});
    const [analysisData, setAnalysisData] = useState({
        highPriority: [],
        mediumPriority: [],
        lowPriority: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apiBase = import.meta.env.VITE_API_BASE_URL;

    // 현재 언어 가져오기
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');

    // 번역 훅
    const t = useTranslation();

    // 모달이 열릴 때마다 expandedItems 초기화
    useEffect(() => {
        if (open) {
            setExpandedItems({});
        }
    }, [open, content]);

    // API에서 분석 데이터 가져오기
    useEffect(() => {
        if (!open || !content) return;

        const fetchAnalysisData = async () => {
            setLoading(true);
            setError(null);

            try {
                // content.post_id 사용 (content.id는 테이블의 id이므로 post_id를 사용)
                const postId = content.post_id;
                if (!postId) {
                    console.warn('post_id가 없습니다:', content);
                    return;
                }

                // 현재 언어를 쿼리 파라미터로 전달
                const languageParam = currentLanguage === 'ko' ? 'ko' : currentLanguage === 'zh' ? 'zh' : 'en';
                const response = await fetch(
                    `${apiBase}/contents/videoAnalysis?post_id=${postId}&language=${languageParam}`
                );
                if (!response.ok) {
                    throw new Error(t('videoAnalysis.error.fetchFailed'));
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    // 영상 분석 데이터가 있으면 완료된 것
                    const analysis = data[0];
                    const mappedData = {
                        highPriority: [
                            analysis.analysis_high_a
                                ? {
                                      id: 'hook',
                                      title: t('videoAnalysis.items.hook'),
                                      description: analysis.analysis_high_a,
                                  }
                                : null,
                            analysis.analysis_high_b
                                ? {
                                      id: 'storytelling',
                                      title: t('videoAnalysis.items.ending'),
                                      description: analysis.analysis_high_b,
                                  }
                                : null,
                            analysis.analysis_high_c
                                ? {
                                      id: 'platform',
                                      title: t('videoAnalysis.items.essential'),
                                      description: analysis.analysis_high_c,
                                  }
                                : null,
                        ].filter(Boolean),
                        mediumPriority: [
                            analysis.analysis_medium_d
                                ? {
                                      id: 'product',
                                      title: t('videoAnalysis.items.product'),
                                      description: analysis.analysis_medium_d,
                                  }
                                : null,
                            analysis.analysis_medium_e
                                ? {
                                      id: 'audio',
                                      title: t('videoAnalysis.items.audio'),
                                      description: analysis.analysis_medium_e,
                                  }
                                : null,
                        ].filter(Boolean),
                        lowPriority: [
                            analysis.analysis_low_f
                                ? {
                                      id: 'competition',
                                      title: t('videoAnalysis.items.competition'),
                                      description: analysis.analysis_low_f,
                                  }
                                : null,
                            analysis.analysis_low_g
                                ? {
                                      id: 'conversion',
                                      title: t('videoAnalysis.items.conversion'),
                                      description: analysis.analysis_low_g,
                                  }
                                : null,
                            analysis.analysis_low_h
                                ? {
                                      id: 'abtest',
                                      title: t('videoAnalysis.items.abtest'),
                                      description: analysis.analysis_low_h,
                                  }
                                : null,
                        ].filter(Boolean),
                    };

                    setAnalysisData(mappedData);
                }
            } catch (err) {
                console.error(t('videoAnalysis.error.fetchError'), err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysisData();
    }, [open, content, apiBase, currentLanguage]);

    const toggleItem = (id) => {
        setExpandedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // 우선순위별 아이템 렌더링 컴포넌트
    const PrioritySection = ({ priority, items }) => {
        if (!items || items.length === 0) return null;
        const config = getPriorityConfig(t)[priority];

        // 제목 색상 및 아이콘 색상 설정
        const titleColorClass = priority === 'high' ? 'text-black dark:text-gray-100' : config.textColor;
        const iconColorStyle =
            priority === 'high'
                ? { color: '#ef4444', fill: '#ef4444' } // 빨간색 (채운 별)
                : priority === 'medium'
                ? { color: '#eab308', fill: '#eab308' } // 노란색 (채운 별)
                : priority === 'low'
                ? { color: '#16a34a', fill: '#16a34a' } // 초록색 (채운 별)
                : {};

        return (
            <div className="space-y-4">
                <h4 className={`text-lg font-semibold flex items-center gap-2 ${titleColorClass}`}>
                    <span style={iconColorStyle}>{config.titleIcon}</span>
                    {config.title}
                </h4>
                <div className="space-y-3">
                    {items.map((item) => (
                        <PriorityItem
                            key={item.id}
                            item={item}
                            priority={priority}
                            expandedItems={expandedItems}
                            onToggle={toggleItem}
                        />
                    ))}
                </div>
            </div>
        );
    };

    // 개별 우선순위 아이템 컴포넌트
    const PriorityItem = ({ item, priority, expandedItems, onToggle }) => {
        const config = getPriorityConfig(t)[priority];
        const isExpanded = expandedItems[item.id];

        // 우선순위별 배경색 스타일 (파스텔 색상)
        const bgStyle = {
            high: { backgroundColor: '#fef2f2' }, // 파스텔 빨간색 (매우 연한 핑크)
            medium: { backgroundColor: '#fffbeb' }, // 파스텔 노란색 (매우 연한 크림)
            low: { backgroundColor: '#f0fdfa' }, // 파스텔 초록색 (매우 연한 민트)
        };

        return (
            <div
                className={`border-2 ${config.borderColor} rounded-xl transition-all shadow-sm hover:shadow-md`}
                style={{ ...bgStyle[priority], padding: '0.8rem' }}
            >
                <div className="flex items-center justify-between cursor-pointer" onClick={() => onToggle(item.id)}>
                    <div className="flex items-center gap-3 flex-1">
                        <div className={config.textColor}>{config.icon}</div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-base">{item.title}</span>
                                {item.timeRange && (
                                    <span className="text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {item.timeRange}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            className="text-xs font-semibold px-2 py-1 border text-white"
                            style={{
                                backgroundColor:
                                    priority === 'high'
                                        ? 'rgba(239, 68, 68, 1.5)' // bg-red-500 with opacity
                                        : priority === 'medium'
                                        ? 'rgba(250, 204, 21, 1.5)' // bg-yellow-400 with opacity
                                        : 'rgba(34, 197, 94, 1.5)', // bg-green-500 with opacity
                                borderColor:
                                    priority === 'high'
                                        ? '#dc2626' // border-red-600
                                        : priority === 'medium'
                                        ? '#eab308' // border-yellow-500
                                        : '#16a34a', // border-green-600
                            }}
                        >
                            {config.label}
                        </Badge>
                        <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${config.iconHoverColor}`}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="bg-white/60 dark:bg-gray-800/30 rounded-lg p-4 text-sm">
                            <ReactMarkdown components={markdownComponents}>{item.description}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // YouTube URL을 임베드 URL로 변환 (common/utils.js의 parseUrl 재사용)
    const getYoutubeEmbedUrl = (url) => {
        if (!url) return null;

        const parsed = parseUrl(url);
        if (parsed && parsed.platform === 'youtube' && parsed.id) {
            return `https://www.youtube.com/embed/${parsed.id}`;
        }

        return null;
    };

    const getVideoUrl = () => {
        if (!content?.media_url) return null;
        const videoUrl = content.media_url.find((url) => url?.endsWith('.mp4') || url?.includes('.mp4'));
        return videoUrl || content.media_url[0];
    };

    const isYoutube = content?.platform?.toLowerCase() === 'youtube';
    const videoUrl = getVideoUrl();
    const fullVideoUrl = videoUrl?.startsWith('http') ? videoUrl : `${apiBase}/images/${videoUrl}`;
    const youtubeEmbedUrl = isYoutube ? getYoutubeEmbedUrl(content?.post_url) : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                style={{
                    maxWidth: '48rem',
                    maxHeight: '90vh',
                }}
                className="overflow-y-auto p-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            >
                <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <DialogTitle
                        className="mt-15 text-left text-gray-900 dark:text-gray-100"
                        style={{ fontWeight: 800, fontSize: '1.5rem' }}
                    >
                        {t('videoAnalysis.title')}
                    </DialogTitle>
                    <DialogDescription
                        className="text-sm mt-2 text-left text-gray-500 dark:text-gray-400"
                        style={{ color: '#6b7280', marginBottom: '2rem' }}
                    >
                        {t('videoAnalysis.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* 비디오 플레이어 */}
                    {isYoutube && youtubeEmbedUrl ? (
                        <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                            <iframe
                                className="w-full h-full"
                                src={youtubeEmbedUrl}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    ) : videoUrl ? (
                        <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                            <video controls className="w-full h-full object-contain" src={fullVideoUrl}>
                                {t('videoAnalysis.video.notSupported')}
                            </video>
                        </div>
                    ) : null}

                    {/* 콘텐츠 최적화 개선안 */}
                    {!loading && !error && (
                        <div className="space-y-6">
                            <h3
                                className="text-xl font-bold pb-3 border-gray-200 dark:border-gray-700 text-center"
                                style={{ fontSize: '1.2rem' }}
                            >
                                {t('videoAnalysis.sections.optimization')}
                            </h3>
                            <PrioritySection priority="high" items={analysisData.highPriority} />
                            <PrioritySection priority="medium" items={analysisData.mediumPriority} />
                            <PrioritySection priority="low" items={analysisData.lowPriority} />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
