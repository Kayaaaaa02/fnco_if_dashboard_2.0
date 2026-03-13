import { CheckCircle, BookmarkCheck, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation, useLanguage } from '../../../hooks/useTranslation.js';
import defaultProfileImage from '../../../assets/images/profile/default_profile.png';

export function InfluencerCard({ influencer, isSelected, isSaved, onToggle, getCategoryColor }) {
    const t = useTranslation();
    const language = useLanguage();
    const categoryColor = getCategoryColor(influencer.category);

    // 카테고리 표시명을 현재 언어로 번역 (메가/매크로/마이크로 ↔ Mega/Macro/Micro ↔ 头部/腰部/尾部)
    const getCategoryDisplay = (category) => {
        if (category === '메가' || category === 'Mega' || category === '头部')
            return t('aiPlan.dashboard.categoryMega');
        if (category === '매크로' || category === 'Macro' || category === '腰部')
            return t('aiPlan.dashboard.categoryMacro');
        if (category === '마이크로' || category === 'Micro' || category === '尾部')
            return t('aiPlan.dashboard.categoryMicro');
        return category;
    };

    const displaySummary =
        language === 'ko' ? influencer.quickSummary : influencer.quickSummaryEng || influencer.quickSummary;
    const [isHovered, setIsHovered] = useState(false);

    // 콘텐츠 유형 한글 -> 영문/중문 매핑
    const contentTypeMapping = {
        GRWM: 'grwm',
        루틴: 'routine',
        '일상/브이로그': 'daily',
        '리뷰/튜토리얼': 'review',
        정보형: 'info',
        ASMR: 'asmr',
        추천템: 'recommend',
        '하울/언박싱': 'haul',
        비포앤에프터: 'beforeafter',
    };

    // 콘텐츠 유형을 현재 언어로 번역
    const translateContentType = (type) => {
        const key = contentTypeMapping[type];
        if (key) {
            return t(`aiPlan.influencerAnalysis.contentTypes.${key}`);
        }
        return type; // 매핑되지 않은 경우 원본 반환
    };

    // 팔로워 수를 K 단위로 포맷
    const formatFollowers = (count) => {
        if (!count) return '0';
        const num = typeof count === 'string' ? parseFloat(count.replace(/,/g, '')) : count;
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    // 조회수를 포맷 (K, M 단위)
    const formatViews = (count) => {
        if (!count) return '0';
        const num = typeof count === 'string' ? parseFloat(count.replace(/,/g, '')) : count;
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return Math.round(num).toLocaleString();
    };

    // 플랫폼 표시명 및 배경색 (YouTube 빨강, Instagram 분홍, TikTok 검정)
    const platformLabel = (platform) => {
        const p = (platform || 'instagram').toString().toLowerCase();
        if (p === 'youtube') return 'YouTube';
        if (p === 'tiktok') return 'TikTok';
        return 'Instagram';
    };
    const getPlatformStyle = (platform) => {
        const p = (platform || 'instagram').toString().toLowerCase();
        if (p === 'youtube') return { backgroundColor: '#FECACA', color: '#B91C1C' }; // 파스텔 빨강
        if (p === 'tiktok') return { backgroundColor: '#E5E7EB', color: '#374151' }; // 파스텔 검정(회색)
        return { backgroundColor: '#FBCFE8', color: '#9D174D' }; // 파스텔 분홍
    };

    // 날짜 포맷 (YYYY-MM-DD)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date
                .toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                })
                .replace(/\. /g, '-')
                .replace('.', '');
        } catch {
            return '-';
        }
    };

    return (
        <div
            className="bg-white border rounded-lg transition-all"
            style={{
                position: 'relative',
                borderColor: isSelected ? '#B9A8FF' : '#E5E7EB',
                borderWidth: isSelected ? '2px' : '1px',
                boxShadow: isSelected ? '0 4px 6px rgba(185, 168, 255, 0.2)' : 'none',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onClick={onToggle}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#D1C4FF';
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                }
            }}
        >
            {isSaved && (
                <div
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 6px',
                        backgroundColor: '#B9A8FF',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(185, 168, 255, 0.3)',
                    }}
                >
                    <BookmarkCheck size={11} />
                </div>
            )}
            <div className="flex items-start gap-4" style={{ marginBottom: '12px' }}>
                <div
                    style={{ position: 'relative', padding: '6px' }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <img
                        src={influencer.profileImage || defaultProfileImage}
                        alt={influencer.name}
                        className="w-15 h-15 rounded-full"
                        style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            backgroundColor: '#E5E7EB',
                            transition: 'transform 0.2s ease',
                            transform: isHovered && !isSelected ? 'scale(1.05)' : 'scale(1)',
                        }}
                        onError={(e) => {
                            e.target.src = defaultProfileImage;
                        }}
                    />
                    {(isSelected || isHovered) && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '-4px',
                                left: '-4px',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: isSelected ? '#B9A8FF' : 'rgba(185, 168, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #FFFFFF',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s ease',
                                opacity: isSelected ? 1 : 0.8,
                            }}
                        >
                            <CheckCircle
                                className="w-4 h-4"
                                style={{
                                    color: '#FFFFFF',
                                    fill: isSelected ? '#B9A8FF' : 'rgba(185, 168, 255, 0.3)',
                                    strokeWidth: 2,
                                    transition: 'all 0.2s ease',
                                }}
                            />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold" style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                            {influencer.name}
                        </h4>
                        {influencer.profileUrl && (
                            <a
                                href={influencer.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={t('aiPlan.influencerAnalysis.openProfile')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '3px',
                                    borderRadius: '6px',
                                    color: '#8B5CF6',
                                    backgroundColor: '#F5F3FF',
                                }}
                            >
                                <ExternalLink size={13} />
                            </a>
                        )}
                        <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                                backgroundColor: categoryColor.bg,
                                color: categoryColor.text,
                                fontSize: '10px',
                                fontWeight: '500',
                            }}
                        >
                            {getCategoryDisplay(influencer.category)}
                        </span>
                        <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                                marginLeft: '6px',
                                fontSize: '10px',
                                fontWeight: '500',
                                ...getPlatformStyle(influencer.platform),
                            }}
                        >
                            {platformLabel(influencer.platform)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                    {t('aiPlan.influencerAnalysis.followers')} :
                                </span>
                                <span style={{ color: '#374151', fontWeight: '600' }}>
                                    {formatFollowers(influencer.followers)}
                                </span>
                            </div>
                            <span style={{ color: '#D1D5DB', fontWeight: '400' }}>/</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                    {t('aiPlan.influencerAnalysis.posts')} :
                                </span>
                                <span style={{ color: '#374151', fontWeight: '600' }}>
                                    {influencer.posts}
                                    {t('aiPlan.influencerAnalysis.postsCount')}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                {t('aiPlan.influencerAnalysis.recentUploads')} :
                            </span>
                            <span
                                style={{
                                    fontWeight: '700',
                                    fontSize: '13px',
                                }}
                            >
                                {influencer.recentPostsCount || 0}
                            </span>
                            <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                {t('aiPlan.influencerAnalysis.recentUploadsCount')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', fontSize: '12px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                    {t('aiPlan.influencerAnalysis.engagementRateLabel')} :
                                </span>
                                <span style={{ color: '#374151', fontWeight: '600' }}>
                                    {Math.round(parseFloat(influencer.engagementRate) || 0)}
                                    {t('aiPlan.influencerAnalysis.engagementCount')}
                                </span>
                            </div>
                            <span style={{ color: '#D1D5DB', fontWeight: '400' }}>/</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                    {t('aiPlan.influencerAnalysis.avgViews')} :
                                </span>
                                <span style={{ color: '#374151', fontWeight: '600' }}>
                                    {formatViews(influencer.avgViews)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '5px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '12px', color: '#374151', marginBottom: '5px' }}>
                    {t('aiPlan.influencerAnalysis.contentTypeLabel')}:{' '}
                    {(influencer.contentTypes || []).map((type) => translateContentType(type)).join(', ') || '-'}
                </p>
                {displaySummary && (
                    <p
                        style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            lineHeight: '1.4',
                            marginBottom: '5px',
                        }}
                    >
                        {displaySummary}
                    </p>
                )}
                <div className="flex flex-wrap gap-2" style={{ marginTop: '5px', marginBottom: '5px' }}>
                    {influencer.keywords.map((keyword, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs"
                            style={{
                                backgroundColor: '#F3F4F6',
                                color: '#374151',
                                fontSize: '11px',
                            }}
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
                <div
                    style={{
                        fontSize: '11px',
                        color: '#9CA3AF',
                        fontWeight: '500',
                        marginTop: '5px',
                    }}
                >
                    {t('aiPlan.influencerAnalysis.dataCollectionDate')} : {formatDate(influencer.updatedAt)}
                </div>
            </div>
        </div>
    );
}
