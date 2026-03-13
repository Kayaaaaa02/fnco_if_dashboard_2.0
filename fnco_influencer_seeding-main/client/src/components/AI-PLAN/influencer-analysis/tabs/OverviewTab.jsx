/**
 * deep_analysis.overview 구조에 맞춰 개요 탭 렌더링
 * overview 없으면 "데이터 없음" 표시
 */
export function OverviewTab({ t, overview }) {
    const hasOverview = overview && typeof overview === 'object';

    // 상단 4개 카드용 데이터 (overview 기반)
    const profileLabel =
        hasOverview && [overview['연령대'], overview['성별']].filter(Boolean).length > 0
            ? [overview['연령대'], overview['성별']].filter(Boolean).join(' ')
            : null;
    const lifestyleLabel =
        hasOverview && Array.isArray(overview['라이프스타일']) && overview['라이프스타일'].length > 0
            ? overview['라이프스타일'].join(', ')
            : hasOverview && overview['라이프스타일']
            ? String(overview['라이프스타일'])
            : null;
    const channelFeatures =
        hasOverview && overview['채널 특징'] && typeof overview['채널 특징'] === 'object'
            ? [overview['채널 특징']['특징'], overview['채널 특징']['톤앤무드'], overview['채널 특징']['연출 스타일']]
                  .filter(Boolean)
                  .join(' · ') || null
            : null;
    const skinLabel =
        hasOverview && overview['피부특성']
            ? typeof overview['피부특성'] === 'object'
                ? [overview['피부특성']['피부타입'], overview['피부특성']['피부특징']].filter(Boolean).join(' · ') ||
                  null
                : String(overview['피부특성'])
            : null;

    const topCards = [
        {
            icon: '👤',
            titleKey: 'profile',
            subtitle: profileLabel,
            detail: t('aiPlan.influencerAnalysis.mainTargetGroup'),
        },
        {
            icon: '💗',
            titleKey: 'lifestyle',
            subtitle: lifestyleLabel,
            detail: t('aiPlan.influencerAnalysis.mainContent'),
        },
        {
            icon: '✨',
            titleKey: 'channelFeatures',
            subtitle: channelFeatures,
            detail: t('aiPlan.influencerAnalysis.contentStyle'),
        },
        {
            icon: '🍪',
            titleKey: 'skinCharacteristics',
            subtitle: skinLabel,
            detail: t('aiPlan.influencerAnalysis.interest'),
        },
    ];

    // 타겟 오디언스
    const targetDesc =
        hasOverview && overview['타겟_오디언스'] && typeof overview['타겟_오디언스'] === 'object'
            ? overview['타겟_오디언스']['설명'] || null
            : hasOverview && overview['타겟_오디언스']
            ? String(overview['타겟_오디언스'])
            : null;
    const targetTags =
        hasOverview && overview['타겟_오디언스'] && Array.isArray(overview['타겟_오디언스']['태그'])
            ? overview['타겟_오디언스']['태그']
            : [];

    // 콘텐츠 강점 (객체 키-값을 배열로) — 키는 "콘텐츠 강점"
    const contentStrengthTitleKeys = {
        '팔로워 특징': 'contentStrengthFollower',
        팔로워_특징: 'contentStrengthFollower',
        '인게이지먼트 최근30일': 'contentStrengthEngagement',
        인게이지먼트_최근30일: 'contentStrengthEngagement',
        '주간 컨텐츠 업로드 평균 회수 최근30일': 'contentStrengthWeeklyUpload',
        주간_컨텐츠_업로드_평균_회수_최근30일: 'contentStrengthWeeklyUpload',
    };
    const contentStrengthsRaw = hasOverview && (overview['콘텐츠 강점'] ?? overview['콘텐츠_강점']);
    const contentStrengthsList =
        contentStrengthsRaw && typeof contentStrengthsRaw === 'object'
            ? Object.entries(contentStrengthsRaw).map(([key, value]) => {
                  const titleDisplay = key.replace(/_/g, ' ');
                  const tKey = contentStrengthTitleKeys[titleDisplay] ?? contentStrengthTitleKeys[key];
                  return {
                      title: tKey ? t(`aiPlan.influencerAnalysis.${tKey}`) : titleDisplay,
                      desc: value,
                  };
              })
            : [];

    // 콘텐츠 유형 분포 (유형별_비중) — 비중이 "46%" 형태일 수 있음
    const parsePercent = (v) => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        const s = String(v).replace(/%/g, '');
        return parseInt(s, 10) || 0;
    };
    const typeDistribution =
        hasOverview && overview['콘텐츠_유형_분포'] && Array.isArray(overview['콘텐츠_유형_분포']['유형별_비중'])
            ? overview['콘텐츠_유형_분포']['유형별_비중'].map((item) => ({
                  label: item['유형'] ?? item.유형 ?? '—',
                  value: parsePercent(item['비중'] ?? item.비중),
              }))
            : [];
    const analysisPostCount =
        hasOverview && overview['콘텐츠_유형_분포'] && overview['콘텐츠_유형_분포']['분석_게시물_수'] != null
            ? overview['콘텐츠_유형_분포']['분석_게시물_수']
            : null;
    // 같은 콘텐츠_유형_분포에서 수와 비중 문구를 맞추기 위해 유형별_비중으로 설명 문구 생성 (다른 객체와 섞이지 않도록)
    const recent30DescFromDistribution =
        typeDistribution.length > 0 ? typeDistribution.map((t) => `${t.label} ${t.value}%`).join(', ') : null;

    // 주요 토픽 및 키워드
    const keywords =
        hasOverview && Array.isArray(overview['주요_토픽_및_키워드']) ? overview['주요_토픽_및_키워드'] : [];

    const colors = ['#B9A8FF', '#9F7AEA', '#DDD6FE', '#C4B5FD', '#A78BFA'];

    if (!hasOverview) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                {t('aiPlan.influencerAnalysis.noOverviewData') ||
                    '개요 데이터가 없습니다. AI 심층 분석을 실행해 주세요.'}
            </div>
        );
    }

    return (
        <div>
            {/* 개요 요약 한 줄 (콘텐츠 설명) */}
            {overview['콘텐츠'] && (
                <div
                    style={{
                        marginBottom: '20px',
                        padding: '16px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                    }}
                >
                    <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
                        {overview['콘텐츠']}
                    </p>
                </div>
            )}

            {/* 개요 카드 4개 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {topCards.map((card, idx) => (
                    <div
                        key={idx}
                        style={{
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            padding: '20px',
                            backgroundColor: '#FFFFFF',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.icon}</div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                            {t(`aiPlan.influencerAnalysis.${card.titleKey}`)}
                        </h4>
                        {card.subtitle ? (
                            <p
                                style={{
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    color:
                                        card.titleKey === 'lifestyle'
                                            ? '#EC4899'
                                            : card.titleKey === 'skinCharacteristics'
                                            ? '#F59E0B'
                                            : '#7C3AED',
                                    marginBottom: '2px',
                                }}
                            >
                                {card.subtitle}
                            </p>
                        ) : (
                            <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '2px' }}>
                                {t('aiPlan.influencerAnalysis.noData')}
                            </p>
                        )}
                        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{card.detail}</p>
                    </div>
                ))}
            </div>

            {/* 타겟 오디언스 */}
            {targetDesc && (
                <div
                    style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        padding: '20px',
                        backgroundColor: '#FFFFFF',
                        marginBottom: '24px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '18px' }}>🎯</span>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                            {t('aiPlan.influencerAnalysis.targetAudience')}
                        </h3>
                    </div>
                    <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{targetDesc}</p>
                    {targetTags.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                            {targetTags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#F3E8FF',
                                        color: '#7C3AED',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 콘텐츠 강점 */}
            {contentStrengthsList.length > 0 && (
                <div
                    style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        padding: '24px',
                        backgroundColor: '#FFFFFF',
                        marginBottom: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            paddingBottom: '12px',
                            borderBottom: '2px solid #F3E8FF',
                        }}
                    >
                        <span
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                backgroundColor: '#F3E8FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                            }}
                        >
                            ✨
                        </span>
                        <h3
                            style={{
                                fontSize: '17px',
                                fontWeight: '800',
                                color: '#111827',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {t('aiPlan.influencerAnalysis.contentStrengths')}
                        </h3>
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '20px',
                        }}
                    >
                        {contentStrengthsList.map((item, idx) => {
                            const cardStyles = [
                                { icon: '👥', color: '#8B5CF6', bg: '#F3E8FF' },
                                { icon: '💗', color: '#EC4899', bg: '#FCE7F3' },
                                { icon: '⚡', color: '#F59E0B', bg: '#FFFBEB' },
                            ];
                            const s = cardStyles[idx % 3];
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '20px',
                                        borderRadius: '10px',
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                backgroundColor: s.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '20px',
                                            }}
                                        >
                                            {s.icon}
                                        </span>
                                        <h4
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: '700',
                                                color: s.color,
                                                margin: 0,
                                                flex: 1,
                                            }}
                                        >
                                            {item.title}
                                        </h4>
                                    </div>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            color: '#6B7280',
                                            lineHeight: '1.6',
                                            margin: 0,
                                        }}
                                    >
                                        {item.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 최근 30일 콘텐츠 유형 분포 */}
            {(typeDistribution.length > 0 || analysisPostCount != null) && (
                <div
                    style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        padding: '20px',
                        backgroundColor: '#FFFFFF',
                        marginBottom: '24px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '18px' }}>📊</span>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                            {t('aiPlan.influencerAnalysis.recentTrends')}
                        </h3>
                    </div>
                    {(analysisPostCount != null || recent30DescFromDistribution) && (
                        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                            {analysisPostCount != null &&
                                `${t('aiPlan.influencerAnalysis.analysisPostCount')} ${analysisPostCount}${t(
                                    'aiPlan.influencerAnalysis.postsCount'
                                )}`}
                            {analysisPostCount != null && recent30DescFromDistribution && ' · '}
                            {recent30DescFromDistribution ||
                                (analysisPostCount == null ? t('aiPlan.influencerAnalysis.uploadCount') : '')}
                        </p>
                    )}
                    {typeDistribution.length > 0 &&
                        typeDistribution.map((trend, idx) => (
                            <div key={idx} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                                        {trend.label}
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#7C3AED', fontWeight: '700' }}>
                                        {trend.value}%
                                    </span>
                                </div>
                                <div
                                    style={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: '#F3F4F6',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${Math.min(100, trend.value)}%`,
                                            height: '100%',
                                            backgroundColor: colors[idx % colors.length],
                                            transition: 'width 0.3s ease',
                                            borderRadius: '4px',
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* 주요 토픽 및 키워드 */}
            {keywords.length > 0 && (
                <div
                    style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        padding: '20px',
                        backgroundColor: '#FFFFFF',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '18px' }}>🔑</span>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                            {t('aiPlan.influencerAnalysis.keyTopics')}
                        </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {keywords.map((keyword, idx) => (
                            <span
                                key={idx}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    color: '#7C3AED',
                                    fontWeight: '500',
                                }}
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
