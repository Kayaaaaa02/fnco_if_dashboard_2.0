import { useMemo, useState, useEffect } from 'react';
import { useTranslation, useLanguage } from '../../../hooks/useTranslation.js';
import defaultProfileImage from '../../../assets/images/profile/default_profile.png';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab.jsx';
import { ContentAnalysisTab } from './tabs/ContentAnalysisTab.jsx';
import { BestPlanTab } from './tabs/BestPlanTab.jsx';

export function InfluencerDetailAnalysis({
    influencer,
    allInfluencers,
    /** 심층 분석하기 버튼으로 요청에 포함된 profile_id 목록만 표시 (리스트 체크만으로는 추가 안 됨) */
    analysisTargetIds = [],
    onSelectInfluencer,
    onClose,
    /** 최종 기획안 탭에서 선택한 기획안을 부모에 전달 (다음 버튼 → modify API용) */
    onSelectedFinalPlanChange,
    /** BEST 릴스 기획안 10선 전체 목록 */
    allReelsPlans = [],
}) {
    const t = useTranslation();
    const language = useLanguage();

    // localStorage에서 활성 탭 복원
    const [activeTab, setActiveTab] = useState(() => {
        try {
            const stored = localStorage.getItem('influencer_detail_active_tab');
            const restoredTab = stored ? JSON.parse(stored) : 'overview';
            return restoredTab;
        } catch {
            return 'overview';
        }
    });

    const [isExpanded, setIsExpanded] = useState(true);

    // 팔로워 수를 K 단위로 포맷
    const formatFollowers = (count) => {
        if (!count) return '0';
        const num = typeof count === 'string' ? parseFloat(count.replace(/,/g, '')) : count;
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    const selectedInfluencerId = typeof influencer === 'object' && influencer !== null ? influencer.id : influencer;

    const selectedInfluencer = useMemo(() => {
        if (typeof influencer === 'object' && influencer !== null) return influencer;
        return allInfluencers.find((inf) => inf.id === selectedInfluencerId);
    }, [allInfluencers, influencer, selectedInfluencerId]);

    if (!selectedInfluencer) return null;

    // 언어별 deep_analysis 선택 (eng/cn 없으면 한글 fallback)
    const resolvedDeepAnalysis = useMemo(() => {
        if (language === 'zh') return selectedInfluencer.deepAnalysisCn ?? selectedInfluencer.deepAnalysis;
        if (language === 'en') return selectedInfluencer.deepAnalysisEng ?? selectedInfluencer.deepAnalysis;
        return selectedInfluencer.deepAnalysis;
    }, [
        language,
        selectedInfluencer?.deepAnalysis,
        selectedInfluencer?.deepAnalysisEng,
        selectedInfluencer?.deepAnalysisCn,
    ]);

    const analysisTargets = useMemo(() => {
        if (!analysisTargetIds || analysisTargetIds.length === 0) return [];
        return analysisTargetIds.map((id) => allInfluencers.find((inf) => inf.id === id)).filter(Boolean);
    }, [analysisTargetIds, allInfluencers]);

    // activeTab 변경 시 localStorage에 저장
    useEffect(() => {
        try {
            localStorage.setItem('influencer_detail_active_tab', JSON.stringify(activeTab));
        } catch (error) {
            console.error('[활성 탭 저장 오류]', error);
        }
    }, [activeTab]);

    return (
        <div
            id="influencer-detail"
            style={{
                marginTop: '30px',
                marginBottom: '30px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                padding: '24px',
            }}
        >
            {/* 선택된 인플루언서 정보 헤더 */}
            <div
                style={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                        src={selectedInfluencer.profileImage || defaultProfileImage}
                        alt="profile"
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                        }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                                {selectedInfluencer.name}
                            </h3>
                            <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                {formatFollowers(selectedInfluencer.followers)}{' '}
                                {t('aiPlan.influencerAnalysis.followers')} · {selectedInfluencer.posts}{' '}
                                {t('aiPlan.influencerAnalysis.posts')}
                            </p>
                            {(language === 'ko'
                                ? selectedInfluencer.quickSummary
                                : selectedInfluencer.quickSummaryEng || selectedInfluencer.quickSummary) && (
                                <p
                                    style={{
                                        fontSize: '13px',
                                        color: '#6B7280',
                                        lineHeight: '1.5',
                                        marginTop: '8px',
                                        maxWidth: '480px',
                                    }}
                                >
                                    {language === 'ko'
                                        ? selectedInfluencer.quickSummary
                                        : selectedInfluencer.quickSummaryEng || selectedInfluencer.quickSummary}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#F3F4F6',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#E5E7EB';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                >
                    {isExpanded ? (
                        <>
                            {t('aiPlan.influencerAnalysis.collapseLabel')}
                            <ChevronUp className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            {t('aiPlan.influencerAnalysis.expandLabel')}
                            <ChevronDown className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>

            {/* 펼침/숨김 가능한 콘텐츠 영역 */}
            {isExpanded && (
                <>
                    {/* 심층 분석하기 버튼으로 요청한 인플루언서만 분석 대상으로 표시 */}
                    <div style={{ marginBottom: '16px' }}>
                        <span
                            style={{
                                fontSize: '13px',
                                color: '#6B7280',
                                fontWeight: '600',
                                display: 'block',
                                marginBottom: '10px',
                            }}
                        >
                            {t('aiPlan.influencerAnalysis.analysisTarget')}:
                        </span>
                        {analysisTargets.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
                                {t('aiPlan.influencerAnalysis.analysisTargetEmpty')}
                            </p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                    {analysisTargets.map((inf) => {
                                        const isCurrent = inf.id === selectedInfluencer.id;
                                        return (
                                            <div
                                                key={inf.id}
                                                onClick={() => onSelectInfluencer?.(inf.id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ')
                                                        onSelectInfluencer?.(inf.id);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 14px',
                                                    borderRadius: '10px',
                                                    border: `2px solid ${isCurrent ? '#B9A8FF' : '#E5E7EB'}`,
                                                    backgroundColor: isCurrent ? '#F5F3FF' : '#FFFFFF',
                                                    cursor: analysisTargets.length > 1 ? 'pointer' : 'default',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <img
                                                    src={inf.profileImage || defaultProfileImage}
                                                    alt={inf.name}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            color: '#111827',
                                                        }}
                                                    >
                                                        {inf.name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                                        {formatFollowers(inf.followers)}{' '}
                                                        {t('aiPlan.influencerAnalysis.followers')}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {analysisTargets.length > 1 && (
                                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
                                        {t('aiPlan.influencerAnalysis.analysisTargetClickHint')}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    {/* 탭 네비게이션 */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '0px',
                            borderBottom: '1px solid #E5E7EB',
                            marginBottom: '24px',
                        }}
                    >
                        {[
                            { id: 'overview', label: t('aiPlan.influencerAnalysis.tabOverview') },
                            { id: 'content', label: t('aiPlan.influencerAnalysis.tabContent') },
                            { id: 'bestPlan', label: t('aiPlan.influencerAnalysis.tabBestPlan') },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === tab.id ? '3px solid #B9A8FF' : '3px solid transparent',
                                    color: activeTab === tab.id ? '#7C3AED' : '#6B7280',
                                    fontSize: '15px',
                                    fontWeight: activeTab === tab.id ? '700' : '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.color = '#374151';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.color = '#6B7280';
                                    }
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 탭 콘텐츠 */}
                    {activeTab === 'overview' && (
                        <OverviewTab t={t} overview={resolvedDeepAnalysis?.overview ?? null} />
                    )}

                    {activeTab === 'content' && (
                        <ContentAnalysisTab
                            t={t}
                            topContent={selectedInfluencer.topContent ?? null}
                            contentStats={selectedInfluencer.contentStats ?? null}
                            contentAnalysis={resolvedDeepAnalysis?.contentAnalysis ?? null}
                            overview={resolvedDeepAnalysis?.overview ?? null}
                        />
                    )}

                    {activeTab === 'bestPlan' && (
                        <BestPlanTab
                            t={t}
                            bestOfBestPlan={resolvedDeepAnalysis?.bestOfBestPlan ?? null}
                            overview={resolvedDeepAnalysis?.overview ?? null}
                            onSelectedFinalPlanChange={onSelectedFinalPlanChange}
                            allReelsPlans={allReelsPlans}
                        />
                    )}
                </>
            )}
        </div>
    );
}
