import { Card, CardContent } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { Heart, MessageCircle, Share, Eye, Trophy, ExternalLink, Users } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback.jsx';
import { VideoAnalysisButton } from '../ui/VideoAnalysisButton.jsx';
import {
    formatNumber,
    formatDate,
    formatDateTime,
    getPlatformLabel,
    getPlatformColor,
    hasVideoFile,
    getCountryName,
    formatRank,
} from '../../utils/contentUtils.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { useAppSelector } from '../../store/hooks.js';

export function ContentCard({ content, type = 'seeding', videoAnalysisStatus, onOpenVideoAnalysis }) {
    const t = useTranslation();
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');

    // 성과 우수 콘텐츠 순위에 따른 그라데이션 색상 결정
    const getColorByRank = (rank_grp) => {
        const rank = Number(rank_grp);
        if (rank <= 5) return 'linear-gradient(to right, #facc15, #f97316)'; // 노랑→주황 (1-5위)
        if (rank <= 10) return 'linear-gradient(to right, #a855f7, #ec4899)'; // 보라→핑크 (6-10위)
        if (rank <= 20) return 'linear-gradient(to right, #3b82f6, #a855f7)'; // 파랑→보라 (11-20위)
        return 'linear-gradient(to right, #10b981, #14b8a6)'; // 초록→청록 (21위 이상)
    };

    return (
        <Card
            className="overflow-hidden hover:shadow-lg transition-shadow"
            style={type === 'preview' ? { border: '2px solid #f97316' } : undefined}
        >
            <div className="relative aspect-video bg-muted">
                <ImageWithFallback
                    src={content.thumbnail_url}
                    imageList={content.media_url || []}
                    alt={content.title || content.description}
                    className="w-full h-full object-cover"
                />
                {type !== 'preview' && (
                    <div className="absolute top-2 right-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white border-none"
                            onClick={() => window.open(content.post_url, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </div>
                )}
                <div className="absolute top-2 left-2" style={{ display: 'flex', gap: '6px' }}>
                    {type === 'seeding' ? (
                        <Badge
                            className="text-xs"
                            style={{
                                background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontWeight: '600',
                            }}
                        >
                            {t('dashboard.contentCard.badges.seeding')}
                        </Badge>
                    ) : type === 'ugc' ? (
                        <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                            {t('dashboard.contentCard.badges.ugc')}
                        </Badge>
                    ) : type === 'preview' ? (
                        <Badge
                            className="text-xs"
                            style={{
                                background: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                marginLeft: '6px',
                                fontWeight: '600',
                                boxShadow: '0 2px 4px rgba(249, 115, 22, 0.25)',
                            }}
                        >
                            {t('dashboard.contentCard.badges.preview')}
                        </Badge>
                    ) : (
                        <>
                            <Badge
                                className="text-xs"
                                style={{
                                    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontWeight: '600',
                                }}
                            >
                                {t('dashboard.contentCard.badges.seeding')}
                            </Badge>
                            <Badge
                                className="text-xs"
                                style={{
                                    background: 'linear-gradient(to right, #facc15, #f97316)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginLeft: '6px',
                                    fontWeight: '600',
                                }}
                            >
                                <Trophy style={{ width: '12px', height: '12px', marginRight: '4px' }} />{' '}
                                {t('dashboard.contentCard.badges.performance')}
                            </Badge>
                            {content.follower_size && (
                                <Badge
                                    className="text-xs"
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginLeft: '6px',
                                        borderRadius: '6px',
                                        padding: '4px 10px',
                                        boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
                                        fontWeight: '600',
                                    }}
                                >
                                    <Users style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                    {content.follower_size}
                                </Badge>
                            )}
                        </>
                    )}
                </div>
            </div>

            <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-2 leading-tight flex-1">
                            {type === 'preview' && t('dashboard.contentCard.title.previewPrefix')}
                            {content.title ||
                                content.description ||
                                content.seeding_product ||
                                t('dashboard.contentCard.title.noTitle')}
                        </h4>
                        <Badge className={`${getPlatformColor(content.platform)} text-xs`}>
                            {getPlatformLabel(content.platform)}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {type === 'preview'
                            ? content.user_nm || t('dashboard.contentCard.author.noInfo')
                            : type === 'seeding'
                            ? `@${content.author_nm}`
                            : content.author_nm}
                    </p>
                    {type === 'preview' ? (
                        <p className="text-xs text-muted-foreground">
                            {content.scheduled_date || content.crawling_start_dt
                                ? `${formatDate(
                                      content.scheduled_date || content.crawling_start_dt,
                                      currentLanguage
                                  )} ${t('dashboard.contentCard.date.scheduled')}`
                                : t('dashboard.contentCard.date.notSet')}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            {formatDate(content.upload_dt, currentLanguage)}{' '}
                            {type === 'seeding'
                                ? t('dashboard.contentCard.date.upload')
                                : t('dashboard.contentCard.date.register')}
                        </p>
                    )}
                </div>

                {/* 가편 콘텐츠 정보 박스 */}
                {type === 'preview' && (
                    <div
                        style={{
                            backgroundColor: '#fff7ed',
                            border: '1px solid #fed7aa',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>📊</span>
                        <span style={{ fontSize: '12px', color: '#9a3412', lineHeight: '1.4' }}>
                            {t('dashboard.contentCard.preview.message')}
                        </span>
                    </div>
                )}

                {/* 통계 정보 */}
                {type !== 'preview' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span>{formatNumber(content.view_count)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>
                                {content.like_count < 0
                                    ? t('dashboard.contentCard.stats.private')
                                    : formatNumber(content.like_count)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                            <span>{formatNumber(content.comment_count)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Share className="w-4 h-4 text-green-500" />
                            <span>{formatNumber(content.share_count)}</span>
                        </div>
                    </div>
                )}

                {/* 성과 지수 (우수 콘텐츠만) */}
                {type === 'performance' && content.performance_score != null && content.rank_grp != null && (
                    <div style={{ marginTop: '12px' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                            }}
                        >
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {t('dashboard.contentCard.performance.score')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '11px',
                                        background: getColorByRank(content.rank_grp),
                                    }}
                                >
                                    {currentLanguage === 'zh' || currentLanguage === 'en'
                                        ? formatRank(content.rank_grp, currentLanguage)
                                        : `${formatRank(content.rank_grp, currentLanguage)}${t(
                                              'dashboard.contentCard.performance.rank'
                                          )}`}
                                </div>
                                <span style={{ fontSize: '14px' }}>
                                    {Number(content.performance_score || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div
                            style={{
                                height: '12px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '9999px',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${Math.max(0, Math.min(100, 101 - Number(content.rank_grp || 0)))}%`,
                                    background: getColorByRank(content.rank_grp),
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* 키워드 */}
                {content.keyword && content.keyword.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                            {content.keyword
                                .split(',')
                                .filter((tag) => tag && tag.trim())
                                .slice(0, 3)
                                .map((keyword, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700"
                                    >
                                        {keyword.trim().startsWith('#') ? keyword.trim() : `#${keyword.trim()}`}
                                    </Badge>
                                ))}
                            {content.keyword.split(',').filter((tag) => tag && tag.trim()).length > 3 && (
                                <Badge variant="outline" className="text-xs bg-gray-50">
                                    +{content.keyword.split(',').filter((tag) => tag && tag.trim()).length - 3}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* 시딩 정보 */}
                <div className="pt-2 border-t space-y-2">
                    {/* 가편: 시딩 품목/국가만 노출 (최근 업데이트 제외) */}
                    {type === 'preview' ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        {t('dashboard.contentCard.seeding.product')}
                                    </p>
                                    <p className="text-sm truncate">{content.seeding_product || '-'}</p>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                    <p className="text-xs text-muted-foreground">
                                        {t('dashboard.contentCard.seeding.country')}
                                    </p>
                                    <p className="text-sm">{getCountryName(content.seeding_cntry, currentLanguage)}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    {t('dashboard.contentCard.seeding.campaign')}
                                </p>
                                <p className="text-sm truncate">{content.campaign_name || '-'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        {t('dashboard.contentCard.seeding.product')}
                                    </p>
                                    <p className="text-sm truncate">{content.seeding_product || '-'}</p>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                    <p className="text-xs text-muted-foreground">
                                        {t('dashboard.contentCard.seeding.lastUpdate')}
                                    </p>
                                    <p className="text-sm">{formatDateTime(content.created_dt)}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('dashboard.contentCard.seeding.country')}
                                    </p>
                                    <p className="text-sm">{getCountryName(content.seeding_cntry, currentLanguage)}</p>
                                </div>
                            </div>
                            {/* 시딩 콘텐츠: 시딩 국가 아래 캠페인명 항상 표시 */}
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    {t('dashboard.contentCard.seeding.campaign')}
                                </p>
                                <p className="text-sm truncate">{content.campaign_name || '-'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 영상 분석 버튼 */}
                {hasVideoFile(content) && (
                    <div className="pt-3">
                        <VideoAnalysisButton
                            content={content}
                            status={videoAnalysisStatus}
                            onOpenModal={onOpenVideoAnalysis}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
