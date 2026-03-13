import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, ExternalLink } from 'lucide-react';
import defaultProfileImage from '../../../../assets/images/profile/default_profile.png';

export function ContentAnalysisTab({ t, topContent, contentStats, contentAnalysis, overview }) {
    const [expandedItems, setExpandedItems] = useState([]);
    const [optimizationOpen, setOptimizationOpen] = useState(false);

    const hasData = topContent || contentStats || contentAnalysis;

    const COLORS = {
        purple: '#8B5CF6',
        purpleBg: '#F5F3FF',
        purpleBorder: '#DDD6FE',
        border: '#E5E7EB',
        text: '#111827',
        subText: '#6B7280',
        white: '#FFFFFF',
    };

    const toggleItem = (index) => {
        setExpandedItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
    };

    // 우선순위별 개선안 데이터
    // videoAnalysisController 기반 파싱 로직 (견고한 마크다운 파싱)
    const buildStartPattern = (letter) => {
        const l = String(letter || '')
            .toLowerCase()
            .trim()
            .replace(/\)\s*$/, '');
        return '^\\s*(?:#{1,6}\\s*)?(?:\\*\\*\\s*)?' + l + '\\)\\s+.*$';
    };

    const extractSection = (text, startPattern, nextLetter) => {
        if (!text) return null;
        const startRegex = startPattern instanceof RegExp ? startPattern : new RegExp(startPattern, 'im');
        const startMatch = text.match(startRegex);
        if (!startMatch) return null;

        const startIndex = startMatch.index + startMatch[0].length;
        let endIndex = text.length;

        if (nextLetter) {
            const escapedLetter = nextLetter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const endRegex = new RegExp(`^\\s*(?:#{1,6}\\s*)?(?:\\*\\*\\s*)?${escapedLetter}\\s+`, 'm');
            const remainingText = text.substring(startIndex);
            const endMatch = remainingText.match(endRegex);
            if (endMatch) endIndex = startIndex + endMatch.index;
        }

        let section = text.substring(startIndex, endIndex).trim();

        // Priority 관련 텍스트 제거
        section = section.replace(/###?\s*[🔴🟡🟢]\s*.*?Priority.*?(?:\(.*?\))?\s*\n*/gim, '').trim();
        section = section.replace(/[🔴🟡🟢]\s*.*?Priority.*?(?:\(.*?\))?\s*\n*/gim, '').trim();

        // 한국어/영어/중국어 텍스트 정리
        section = section.replace(/^\s*#?\s*\(개선 권장\)\s*\n*/gim, '').trim();
        section = section.replace(/^\s*#?\s*\(선택적 개선\)\s*\n*/gim, '').trim();
        section = section.replace(/^\s*#?\s*\(Recommended\s+Improvement\)\s*\n*/gim, '').trim();
        section = section.replace(/^\s*#?\s*\(Optional\s+Improvement\)\s*\n*/gim, '').trim();
        section = section.replace(/^\[.+?\]\s*\n*/i, '').trim();

        // 들여쓰기 정리
        section = section
            .split('\n')
            .map((line) => line.replace(/^[ ]{1,4}/, ''))
            .join('\n')
            .trim();

        return section || null;
    };

    const parseOptimizationSuggestions = (markdown) => {
        if (!markdown) return { high: [], medium: [], low: [] };

        // 실제 존재하는 섹션 헤더 스캔
        const headerScanRegex = new RegExp('^\\s*(?:#{1,6}\\s*)?(?:\\*\\*\\s*)?([a-h]\\))\\s+.*$', 'gim');
        const presentLetters = [];
        let m;
        while ((m = headerScanRegex.exec(markdown)) !== null) {
            presentLetters.push((m[1] || '').toLowerCase());
        }

        const nextExisting = (letterWithParen) => {
            const idx = presentLetters.indexOf(letterWithParen);
            if (idx === -1) return null;
            return presentLetters[idx + 1] || null;
        };

        // a, b, c = High Priority
        // d, e = Medium Priority
        // f, g, h = Low Priority
        const sections = {
            a: extractSection(markdown, buildStartPattern('a'), nextExisting('a)')),
            b: extractSection(markdown, buildStartPattern('b'), nextExisting('b)')),
            c: extractSection(markdown, buildStartPattern('c'), nextExisting('c)')),
            d: extractSection(markdown, buildStartPattern('d'), nextExisting('d)')),
            e: extractSection(markdown, buildStartPattern('e'), nextExisting('e)')),
            f: extractSection(markdown, buildStartPattern('f'), nextExisting('f)')),
            g: extractSection(markdown, buildStartPattern('g'), nextExisting('g)')),
            h: extractSection(markdown, buildStartPattern('h'), nextExisting('h)')),
        };

        // 각 섹션의 제목 추출 (원본 마크다운에서 "a) 시작점 (첫 3초: 이탈률 방지)" 형태 추출)
        const extractTitle = (letter) => {
            const pattern = new RegExp(
                `^\\s*(?:#{1,6}\\s*)?(?:\\*\\*\\s*)?${letter}\\)\\s+(.+?)(?:\\*\\*)?\\s*$`,
                'im'
            );
            const match = markdown.match(pattern);
            return match ? match[1].trim() : letter + ')';
        };

        return {
            high: [
                sections.a && { titleKey: extractTitle('a'), description: sections.a },
                sections.b && { titleKey: extractTitle('b'), description: sections.b },
                sections.c && { titleKey: extractTitle('c'), description: sections.c },
            ].filter(Boolean),
            medium: [
                sections.d && { titleKey: extractTitle('d'), description: sections.d },
                sections.e && { titleKey: extractTitle('e'), description: sections.e },
            ].filter(Boolean),
            low: [
                sections.f && { titleKey: extractTitle('f'), description: sections.f },
                sections.g && { titleKey: extractTitle('g'), description: sections.g },
                sections.h && { titleKey: extractTitle('h'), description: sections.h },
            ].filter(Boolean),
        };
    };

    const optimizationMarkdown = contentAnalysis?.['콘텐츠_최적화_개선안_마크다운'] ?? null;
    const parsedSuggestions = parseOptimizationSuggestions(optimizationMarkdown);

    const highPriorityItems = parsedSuggestions.high;
    const mediumPriorityItems = parsedSuggestions.medium;
    const lowPriorityItems = parsedSuggestions.low;

    const formatNumber = (num) => {
        if (num == null) return null;
        const n = Number(num);
        if (n === 0) return '0';
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toLocaleString();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return null;
        }
    };

    if (!hasData) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                콘텐츠 분석 데이터가 없습니다. AI 심층 분석을 실행해 주세요.
            </div>
        );
    }

    return (
        <div>
            {/* 최근 30일 영상 콘텐츠 분석 요약 */}
            <div
                style={{
                    backgroundColor: '#F9FAFB',
                    border: `1px solid ${COLORS.purpleBorder}`,
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                    }}
                >
                    <span style={{ fontSize: '18px' }}>📊</span>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                        {t('aiPlan.influencerAnalysis.contentAnalysisSummary')}
                    </h3>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '12px',
                        marginTop: '8px',
                    }}
                >
                    {[
                        {
                            labelKey: 'videoContentCount',
                            value:
                                contentStats?.videoPostsCount != null
                                    ? `${contentStats.videoPostsCount}${t('aiPlan.influencerAnalysis.unitCount')}`
                                    : '—',
                            color: '#B9A8FF',
                        },
                        {
                            labelKey: 'averageViews',
                            value: formatNumber(contentStats?.avgViews) || t('aiPlan.influencerAnalysis.noData'),
                            color: '#EC4899',
                        },
                        {
                            labelKey: 'averageLikes',
                            value: formatNumber(contentStats?.avgLikes) || t('aiPlan.influencerAnalysis.noData'),
                            color: '#F59E0B',
                        },
                        {
                            labelKey: 'comments',
                            value: formatNumber(contentStats?.avgComments) || t('aiPlan.influencerAnalysis.noData'),
                            color: '#10B981',
                        },
                        {
                            labelKey: 'shares',
                            value: formatNumber(contentStats?.avgShares) || t('aiPlan.influencerAnalysis.noData'),
                            color: '#3B82F6',
                        },
                        {
                            labelKey: 'adFrequency',
                            value:
                                contentStats?.adPostsCount != null
                                    ? `${contentStats.adPostsCount}${t('aiPlan.influencerAnalysis.unitTimes')}`
                                    : '—',
                            color: '#8B5CF6',
                        },
                    ].map((metric, idx) => (
                        <div
                            key={idx}
                            style={{
                                backgroundColor: COLORS.white,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: '8px',
                                padding: '16px 12px',
                                textAlign: 'center',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#6B7280',
                                    marginBottom: '8px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {t(`aiPlan.influencerAnalysis.${metric.labelKey}`)}
                            </p>
                            <p
                                style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: metric.color,
                                }}
                            >
                                {metric.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            {/* 시딩 캠페인 적용 포인트 */}
            <div
                style={{
                    backgroundColor: COLORS.purpleBg,
                    border: `1px solid ${COLORS.purpleBorder}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                    }}
                >
                    <span style={{ fontSize: '16px' }}>💡</span>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                        {t('aiPlan.influencerAnalysis.seedingStrategyInsights')}
                    </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(overview?.['시딩_캠페인_적용_포인트'] && Array.isArray(overview['시딩_캠페인_적용_포인트'])
                        ? overview['시딩_캠페인_적용_포인트']
                        : []
                    ).map((keyword, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                            }}
                        >
                            <CheckCircle2
                                size={18}
                                style={{ color: COLORS.purple, marginTop: '2px', flex: '0 0 auto' }}
                            />
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: '#374151',
                                    lineHeight: '1.6',
                                }}
                            >
                                {keyword}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            {/* 최근 성과 콘텐츠 상세 분석 */}
            <div
                style={{
                    marginBottom: '30px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '12px',
                    padding: '24px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '20px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>⚡</span>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                            {t('aiPlan.influencerAnalysis.bestPerformingContentAnalysis')}
                        </h3>
                    </div>
                    {topContent?.url && (
                        <a
                            href={topContent.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                color: '#8B5CF6',
                                backgroundColor: '#F5F3FF',
                                border: '1px solid #DDD6FE',
                                fontSize: '13px',
                                fontWeight: '600',
                                textDecoration: 'none',
                            }}
                        >
                            <ExternalLink size={14} />
                            {t('aiPlan.influencerAnalysis.viewOriginalPost')}
                        </a>
                    )}
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '0.6fr 1.5fr',
                        gap: '20px',
                        backgroundColor: COLORS.white,
                        minHeight: '500px',
                    }}
                >
                    {/* 왼쪽: 콘텐츠 이미지 */}
                    <div
                        style={{
                            backgroundColor: COLORS.purpleBg,
                            border: `1px solid ${COLORS.purpleBorder}`,
                            borderRadius: '12px',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '500px',
                        }}
                    >
                        <img
                            src={topContent?.thumbnailUrl || defaultProfileImage}
                            alt={t('aiPlan.influencerAnalysis.contentImage')}
                            style={{
                                width: '100%',
                                height: '900px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                            }}
                        />
                    </div>

                    {/* 오른쪽: 콘텐츠 정보 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* 콘텐츠 제목 */}
                        <div
                            style={{
                                backgroundColor: '#F9FAFB',
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: '8px',
                                padding: '16px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>💬</span>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                                    {t('aiPlan.influencerAnalysis.contentTitle')}
                                </h4>
                            </div>
                            <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                                {topContent?.caption || '—'}
                            </p>
                        </div>

                        {/* 통계 그리드 */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '12px',
                            }}
                        >
                            {[
                                { labelKey: 'likes', value: formatNumber(topContent?.likes), color: '#EC4899' },
                                { labelKey: 'comments', value: formatNumber(topContent?.comments), color: '#10B981' },
                                { labelKey: 'views', value: formatNumber(topContent?.views), color: '#3B82F6' },
                                {
                                    labelKey: 'savesAndShares',
                                    value: formatNumber(topContent?.shares),
                                    color: '#F59E0B',
                                },
                            ].map((stat, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        backgroundColor: COLORS.white,
                                        border: `1px solid ${COLORS.border}`,
                                        borderRadius: '8px',
                                        padding: '12px',
                                    }}
                                >
                                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                                        {t(`aiPlan.influencerAnalysis.${stat.labelKey}`)}
                                    </p>
                                    <p style={{ fontSize: '18px', fontWeight: '700', color: stat.color }}>
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* 콘텐츠 정보 */}
                        <div
                            style={{
                                backgroundColor: '#F9FAFB',
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: '8px',
                                padding: '16px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>📌 </span>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                                    {t('aiPlan.influencerAnalysis.contentInformation')}
                                </h4>
                            </div>
                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                                <p>
                                    <strong>{t('aiPlan.influencerAnalysis.contentType')}:</strong>{' '}
                                    {topContent?.type || '—'}
                                </p>
                                <p>
                                    <strong>{t('aiPlan.influencerAnalysis.uploadedAt')}:</strong>{' '}
                                    {formatDate(topContent?.postedAt)}
                                </p>
                            </div>
                        </div>
                        {/* 콘텐츠 최적화 개선안 — 토글 */}
                        <div
                            style={{
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: '12px',
                                overflow: 'hidden',
                            }}
                        >
                            {/* 토글 헤더 */}
                            <div
                                onClick={() => setOptimizationOpen((prev) => !prev)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 24px',
                                    cursor: 'pointer',
                                    backgroundColor: optimizationOpen ? '#FAFAFA' : COLORS.white,
                                    transition: 'background-color 0.2s ease',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>✨</span>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                        {t('aiPlan.influencerAnalysis.contentOptimizationSuggestions')}
                                    </h3>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        color: '#8B5CF6',
                                        backgroundColor: '#F5F3FF',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        marginLeft: '4px',
                                    }}>
                                        {highPriorityItems.length + mediumPriorityItems.length + lowPriorityItems.length}건
                                    </span>
                                </div>
                                {optimizationOpen
                                    ? <ChevronUp size={22} color="#6B7280" />
                                    : <ChevronDown size={22} color="#6B7280" />
                                }
                            </div>

                            {/* 토글 콘텐츠 */}
                            {optimizationOpen && (
                                <div style={{ padding: '0 24px 24px' }}>
                                    {/* 높은 우선순위 */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '12px',
                                                marginTop: '8px',
                                            }}
                                        >
                                            <span style={{ fontSize: '16px' }}>⭐</span>
                                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                                                {t('aiPlan.influencerAnalysis.highPrioritySuggestions')}
                                            </h4>
                                        </div>
                                        {highPriorityItems.length === 0 ? (
                                            <div
                                                style={{
                                                    padding: '16px',
                                                    textAlign: 'center',
                                                    color: '#6B7280',
                                                    fontSize: '14px',
                                                }}
                                            >
                                                데이터 없음
                                            </div>
                                        ) : (
                                            highPriorityItems.map((item, idx) => (
                                                <OptimizationItem
                                                    key={idx}
                                                    item={item}
                                                    index={`high-${idx}`}
                                                    priority="HIGH"
                                                    priorityLabel={t('aiPlan.influencerAnalysis.highPriorityLabel')}
                                                    expanded={expandedItems.includes(`high-${idx}`)}
                                                    onToggle={() => toggleItem(`high-${idx}`)}
                                                    t={t}
                                                />
                                            ))
                                        )}
                                    </div>

                                    {/* 중간 우선순위 */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '12px',
                                            }}
                                        >
                                            <span style={{ fontSize: '16px' }}>⭐</span>
                                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                                                {t('aiPlan.influencerAnalysis.mediumPrioritySuggestions')}
                                            </h4>
                                        </div>
                                        {mediumPriorityItems.length === 0 ? (
                                            <div
                                                style={{
                                                    padding: '16px',
                                                    textAlign: 'center',
                                                    color: '#6B7280',
                                                    fontSize: '14px',
                                                }}
                                            >
                                                데이터 없음
                                            </div>
                                        ) : (
                                            mediumPriorityItems.map((item, idx) => (
                                                <OptimizationItem
                                                    key={idx}
                                                    item={item}
                                                    index={`medium-${idx}`}
                                                    priority="MEDIUM"
                                                    priorityLabel={t('aiPlan.influencerAnalysis.mediumPriorityLabel')}
                                                    expanded={expandedItems.includes(`medium-${idx}`)}
                                                    onToggle={() => toggleItem(`medium-${idx}`)}
                                                    t={t}
                                                />
                                            ))
                                        )}
                                    </div>

                                    {/* 낮은 우선순위 */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '12px',
                                            }}
                                        >
                                            <span style={{ fontSize: '16px' }}>⭐</span>
                                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                                                {t('aiPlan.influencerAnalysis.lowPrioritySuggestions')}
                                            </h4>
                                        </div>
                                        {lowPriorityItems.length === 0 ? (
                                            <div
                                                style={{
                                                    padding: '16px',
                                                    textAlign: 'center',
                                                    color: '#6B7280',
                                                    fontSize: '14px',
                                                }}
                                            >
                                                데이터 없음
                                            </div>
                                        ) : (
                                            lowPriorityItems.map((item, idx) => (
                                                <OptimizationItem
                                                    key={idx}
                                                    item={item}
                                                    index={`low-${idx}`}
                                                    priority="LOW"
                                                    priorityLabel={t('aiPlan.influencerAnalysis.lowPriorityLabel')}
                                                    expanded={expandedItems.includes(`low-${idx}`)}
                                                    onToggle={() => toggleItem(`low-${idx}`)}
                                                    t={t}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 개선안 아이템 컴포넌트
function OptimizationItem({ item, index, priority, priorityLabel, expanded, onToggle, t }) {
    const priorityColors = {
        HIGH: { bg: '#FEF2F2', border: '#FEE2E2', badge: '#DC2626', badgeBg: '#DC2626' },
        MEDIUM: { bg: '#FFFBEB', border: '#FED7AA', badge: '#D97706', badgeBg: '#F59E0B' },
        LOW: { bg: '#F0FDF4', border: '#BBF7D0', badge: '#16A34A', badgeBg: '#10B981' },
    };

    const colors = priorityColors[priority] || priorityColors.HIGH;

    return (
        <div
            style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                marginBottom: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
            }}
        >
            <div
                onClick={onToggle}
                style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '16px' }}>💡</span>
                    <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{item.titleKey}</h5>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                        style={{
                            padding: '4px 12px',
                            backgroundColor: colors.badgeBg,
                            color: '#FFFFFF',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                        }}
                    >
                        {priorityLabel}
                    </span>
                    {expanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
                </div>
            </div>

            {expanded && (
                <div
                    style={{
                        padding: '0 16px 16px 48px',
                        fontSize: '13px',
                        color: '#374151',
                        lineHeight: '1.8',
                    }}
                >
                    {item.description.split('\n').map((line, idx) => {
                        // **텍스트**를 <strong>으로 변환
                        const renderLine = (text) => {
                            const parts = [];
                            let lastIndex = 0;
                            const boldRegex = /\*\*(.*?)\*\*/g;
                            let match;

                            while ((match = boldRegex.exec(text)) !== null) {
                                if (match.index > lastIndex) {
                                    parts.push(text.substring(lastIndex, match.index));
                                }
                                parts.push(<strong key={match.index}>{match[1]}</strong>);
                                lastIndex = match.index + match[0].length;
                            }

                            if (lastIndex < text.length) {
                                parts.push(text.substring(lastIndex));
                            }

                            return parts.length > 0 ? parts : text;
                        };

                        const trimmedLine = line.trim();
                        const isBullet = trimmedLine.startsWith('-');
                        const content = isBullet ? trimmedLine.substring(1).trim() : trimmedLine;

                        return (
                            <div
                                key={idx}
                                style={{
                                    marginBottom: isBullet ? '12px' : '6px',
                                    paddingLeft: isBullet ? '0px' : '0px',
                                    display: isBullet ? 'flex' : 'block',
                                    gap: isBullet ? '8px' : '0',
                                }}
                            >
                                {isBullet && (
                                    <span style={{ color: '#9CA3AF', fontSize: '14px', flexShrink: 0 }}>•</span>
                                )}
                                <span>{renderLine(content)}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
