import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../../ui/tooltip.jsx';

export function BestPlanTab({ t, bestOfBestPlan, overview, onSelectedFinalPlanChange, allReelsPlans = [] }) {
    const COLORS = {
        purple: '#8B5CF6',
        purple2: '#B9A8FF',
        purpleBg: '#F5F3FF',
        purpleBorder: '#DDD6FE',
        border: '#E5E7EB',
        text: '#111827',
        sub: '#6B7280',
        white: '#FFFFFF',
        track: '#E5E7EB',
    };

    const hasData = bestOfBestPlan && typeof bestOfBestPlan === 'object';

    // 기획안 타이틀에서 Hook 타입 추출
    const extractHookType = (title) => {
        if (!title) return null;
        // "[기획안 X: Hook타입 + ...]" 형식에서 Hook 타입 추출
        const match = title.match(/\[기획안\s*\d+:\s*([^+\]]+)/);
        if (match) {
            const hookText = match[1].trim();
            // "Visual Shock", "Pain", "Myth", "Trend", "ASMR & Sensory", etc.
            return hookText;
        }
        return null;
    };

    // 마크다운에서 섹션 파싱
    const parseMarkdown = (markdown) => {
        if (!markdown) return null;

        // Matching Summary 추출
        const summaryMatch = markdown.match(/##\s*Matching Summary\s*([\s\S]*?)(?=\n\s*---\s*\n|\n\s*##\s|$)/);
        const summaryText = summaryMatch ? summaryMatch[1].trim() : '';

        // 기획안명, 인플루언서명, 매칭 점수, Why This Match 추출
        const planNameMatch = summaryText.match(/\*\*기획안명\*\*:\s*(.+?)(?=\n|$)/);
        const influencerMatch = summaryText.match(/\*\*인플루언서명\*\*:\s*(.+?)(?=\n|$)/);
        const scoreMatch = summaryText.match(/\*\*Matching Score\*\*:\s*(\d+)\/100\s*\((.+?)\)/);
        // Why This Match? 다음 줄부터 --- 또는 ## 직전까지 추출 (개행+\공백+구분자 패턴)
        const whyMatch = summaryText.match(/###\s*Why This Match\?\s*\n+([\s\S]*?)(?=\n+\s*---|\n+\s*##|$)/);

        // 매칭 사유 상세 추출
        const detailsMatch = markdown.match(/##\s*매칭 사유 상세([\s\S]*?)$/);
        const detailsText = detailsMatch ? detailsMatch[1].trim() : '';

        // 각 항목 파싱 (1. 콘텐츠 스타일 적합도, 2. Hook 타입 궁합 등)
        const detailItems = [];
        const itemRegex =
            /###\s*(\d+)\.\s*(.+?)\s*\((\d+)%\)\s*\n\*\*점수\*\*:\s*(\d+)\/(\d+)점\s*\n\*\*분석\*\*:\s*([\s\S]*?)(?=###|$)/g;
        let match;
        while ((match = itemRegex.exec(detailsText)) !== null) {
            detailItems.push({
                number: match[1],
                title: match[2].trim(),
                weight: parseInt(match[3], 10),
                score: parseInt(match[4], 10),
                max: parseInt(match[5], 10),
                analysis: match[6].trim(),
            });
        }

        const planName = planNameMatch ? planNameMatch[1].trim() : '';
        const influencerName = influencerMatch ? influencerMatch[1].trim() : '';
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
        const grade = scoreMatch ? scoreMatch[2].trim() : '';
        const whyThisMatch = whyMatch ? whyMatch[1].trim() : '';

        return {
            planName,
            influencerName,
            score,
            grade,
            whyThisMatch,
            details: detailItems,
        };
    };

    // 매칭 사유 상세 고정 순서 (1~6) 및 제목 → 번역 키 매핑
    const CRITERIA_KEYS_ORDER = [
        'contentStyleFit',
        'hookTypeCompatibility',
        'toneMoodAlignment',
        'targetAudienceMatching',
        'productUSPInfluencerTrust',
        'brandingAlignment',
    ];
    const titleToKeyMap = [
        { key: 'contentStyleFit', patterns: ['콘텐츠 스타일', 'content style', '内容风格'] },
        { key: 'hookTypeCompatibility', patterns: ['Hook 타입', 'hook type', '钩子类型'] },
        { key: 'toneMoodAlignment', patterns: ['톤앤무드', 'tone', 'mood', '风格调性'] },
        { key: 'targetAudienceMatching', patterns: ['타겟 오디언스', 'target audience', '目标受众'] },
        { key: 'productUSPInfluencerTrust', patterns: ['USP', '신뢰도', 'trust', 'USP', '可信度'] },
        { key: 'brandingAlignment', patterns: ['브랜딩', 'branding', '品牌'] },
    ];
    const getTitleKey = (title) => {
        if (!title || typeof title !== 'string') return null;
        const lower = title.toLowerCase().trim();
        for (const { key, patterns } of titleToKeyMap) {
            if (patterns.some((p) => lower.includes(p.toLowerCase()))) return key;
        }
        return null;
    };

    const parsedData = hasData ? parseMarkdown(bestOfBestPlan['마크다운']) : null;

    const matching = useMemo(() => {
        if (!parsedData) {
            return null;
        }
        const detailsWithKey = parsedData.details.map((d) => {
            const titleKey = getTitleKey(d.title);
            return {
                title: d.title,
                titleKey,
                current: d.score,
                max: d.max,
                analysis: d.analysis,
                tags: [],
            };
        });
        const sortedDetails = [...detailsWithKey].sort((a, b) => {
            const idxA = CRITERIA_KEYS_ORDER.indexOf(a.titleKey || '');
            const idxB = CRITERIA_KEYS_ORDER.indexOf(b.titleKey || '');
            const i = idxA === -1 ? 999 : idxA;
            const j = idxB === -1 ? 999 : idxB;
            return i - j;
        });
        return {
            planName: parsedData.planName,
            influencerName: parsedData.influencerName,
            score: parsedData.score,
            label: parsedData.grade,
            summary: parsedData.whyThisMatch,
            details: sortedDetails,
        };
    }, [parsedData]);

    // 가이드별 매칭률 - top3_rankings 표시 (AI가 이미 해당 인플루언서에 맞게 선정한 Top 3)
    const guideMatches = useMemo(() => {
        if (!hasData || !bestOfBestPlan['top3_rankings']) return [];
        return bestOfBestPlan['top3_rankings'].map((r) => ({
            id: r.plan_id,
            title: r.plan_title,
            subtitle: '',
            percent: r.score,
            hookType: extractHookType(r.plan_title),
        }));
    }, [hasData, bestOfBestPlan]);

    // 최종 기획안 - allReelsPlans (BEST 릴스 기획안 10선 전체) 또는 top3_rankings 사용
    const finalPlans = useMemo(() => {
        // allReelsPlans가 있으면 전체 10개 기획안 사용
        if (allReelsPlans && allReelsPlans.length > 0) {
            return allReelsPlans.map((plan) => ({
                id: plan.id,
                title: plan.title,
                subtitle: plan.message || '',
                hook: plan.hook,
                usp: plan.usp,
                message: plan.message,
                cuts: plan.cuts,
                summary: plan.summary,
                hookType: extractHookType(plan.title),
            }));
        }
        // allReelsPlans가 없으면 기존 top3_rankings 사용 (하위 호환성)
        if (!hasData || !bestOfBestPlan['top3_rankings']) return [];
        return bestOfBestPlan['top3_rankings'].map((r) => ({
            id: r.plan_id,
            title: r.plan_title,
            subtitle: '',
            hookType: extractHookType(r.plan_title),
        }));
    }, [allReelsPlans, hasData, bestOfBestPlan]);

    const [selectedPlanId, setSelectedPlanId] = useState(finalPlans.length > 0 ? finalPlans[0].id : null);
    const selectedPlan = finalPlans.find((p) => p.id === selectedPlanId) ?? finalPlans[0];

    useEffect(() => {
        if (finalPlans.length > 0 && (selectedPlanId == null || !finalPlans.some((p) => p.id === selectedPlanId))) {
            setSelectedPlanId(finalPlans[0].id);
        }
    }, [finalPlans]);

    // 부모에 선택된 최종 기획안 전달 (다음 버튼에서 modify API 호출 시 사용)
    useEffect(() => {
        if (onSelectedFinalPlanChange && selectedPlan) {
            onSelectedFinalPlanChange(selectedPlan);
        }
    }, [selectedPlan, onSelectedFinalPlanChange]);

    if (!hasData) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                Best of Best 기획안 데이터가 없습니다. AI 심층 분석을 실행해 주세요.
            </div>
        );
    }

    return (
        <div>
            {/* Matching Summary */}
            {matching && (
                <div
                    style={{
                        backgroundColor: COLORS.purpleBg,
                        border: `1px solid ${COLORS.purpleBorder}`,
                        borderRadius: '12px',
                        padding: '22px',
                        marginBottom: '20px',
                    }}
                >
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: COLORS.text, marginBottom: '12px' }}>
                        {t('aiPlan.influencerAnalysis.matchingSummary')}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: '8px' }}>
                        <div style={{ fontSize: '14px', color: COLORS.sub }}>
                            {t('aiPlan.influencerAnalysis.strategyName')}:
                        </div>
                        <div style={{ fontSize: '14px', color: COLORS.text, fontWeight: '600' }}>
                            {matching.planName}
                        </div>

                        <div style={{ fontSize: '14px', color: COLORS.sub }}>
                            {t('aiPlan.influencerAnalysis.influencerName')}:
                        </div>
                        <div style={{ fontSize: '14px', color: COLORS.text, fontWeight: '600' }}>
                            {matching.influencerName}
                        </div>
                    </div>

                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '14px', color: COLORS.sub, minWidth: '118px' }}>
                            {t('aiPlan.influencerAnalysis.matchingScore')}:
                        </div>
                        <div
                            style={{
                                flex: 1,
                                height: '10px',
                                background: 'linear-gradient(180deg, #F3F4F6 0%, #E5E7EB 100%)',
                                borderRadius: '999px',
                                overflow: 'hidden',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.10)',
                                border: '1px solid rgba(0,0,0,0.06)',
                            }}
                        >
                            <div
                                style={{
                                    width: `${matching.score}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #B9A8FF 0%, #8B5CF6 100%)',
                                    boxShadow: '0 2px 6px rgba(139, 92, 246, 0.25)',
                                    borderRadius: '999px',
                                }}
                            />
                        </div>
                        <div style={{ fontSize: '14px', color: COLORS.text, fontWeight: '800' }}>
                            {matching.score}/100
                        </div>
                        <div style={{ fontSize: '14px', color: COLORS.purple, fontWeight: '800', marginLeft: '6px' }}>
                            {matching.label}
                        </div>
                    </div>

                    <div
                        style={{
                            marginTop: '16px',
                            backgroundColor: COLORS.white,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: '10px',
                            padding: '14px 16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <CheckCircle2 size={18} style={{ color: '#22C55E' }} />
                            <div style={{ fontSize: '14px', color: COLORS.text, fontWeight: '800' }}>
                                {t('aiPlan.influencerAnalysis.matchingRationale')}
                            </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.75' }}>{matching.summary}</div>
                    </div>

                    <div
                        style={{
                            marginTop: '14px',
                            backgroundColor: COLORS.white,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: '10px',
                            padding: '14px 16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <CheckCircle2 size={18} style={{ color: '#22C55E' }} />
                            <div
                                style={{
                                    fontSize: '14px',
                                    color: COLORS.text,
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                {t('aiPlan.influencerAnalysis.matchingReasonDetails')}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle size={16} style={{ color: COLORS.sub, cursor: 'pointer' }} />
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="right"
                                            align="start"
                                            style={{
                                                backgroundColor: '#1F2937',
                                                color: '#FFFFFF',
                                                borderColor: '#374151',
                                                padding: '16px',
                                                minWidth: '300px',
                                                maxWidth: '400px',
                                                fontSize: '13px',
                                                lineHeight: '1.6',
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                                                    {t('aiPlan.influencerAnalysis.bestOfBestSelectionCriteria')}
                                                </div>
                                                <div>{t('aiPlan.influencerAnalysis.contentStyleFit30')}</div>
                                                <div>{t('aiPlan.influencerAnalysis.hookTypeCompatibility20')}</div>
                                                <div>{t('aiPlan.influencerAnalysis.toneMoodAlignment15')}</div>
                                                <div>{t('aiPlan.influencerAnalysis.targetAudienceMatching15')}</div>
                                                <div>{t('aiPlan.influencerAnalysis.productUSPInfluencerTrust10')}</div>
                                                <div>{t('aiPlan.influencerAnalysis.brandingAlignment10')}</div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {matching.details.map((d, idx) => {
                                const percent = Math.round((d.current / d.max) * 100);
                                return (
                                    <div key={idx}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            <div style={{ fontSize: '14px', color: COLORS.text, fontWeight: '800' }}>
                                                {d.titleKey ? t(`aiPlan.influencerAnalysis.${d.titleKey}`) : d.title}
                                            </div>
                                            <div style={{ fontSize: '14px', color: COLORS.purple, fontWeight: '800' }}>
                                                {d.current}
                                                {t('aiPlan.influencerAnalysis.pointsUnit')} / {d.max}
                                                {t('aiPlan.influencerAnalysis.pointsUnit')}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '10px',
                                                background: 'linear-gradient(180deg, #F3F4F6 0%, #E5E7EB 100%)',
                                                borderRadius: '999px',
                                                overflow: 'hidden',
                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.10)',
                                                border: '1px solid rgba(0,0,0,0.06)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${percent}%`,
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #B9A8FF 0%, #8B5CF6 100%)',
                                                    boxShadow: '0 2px 6px rgba(139, 92, 246, 0.25)',
                                                    borderRadius: '999px',
                                                }}
                                            />
                                        </div>
                                        {d.analysis && (
                                            <div
                                                style={{
                                                    marginTop: '10px',
                                                    fontSize: '13px',
                                                    color: '#374151',
                                                    lineHeight: '1.6',
                                                }}
                                            >
                                                {d.analysis}
                                            </div>
                                        )}
                                        {d.tags && d.tags.length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    flexWrap: 'wrap',
                                                    marginTop: '10px',
                                                }}
                                            >
                                                {d.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        style={{
                                                            padding: '6px 10px',
                                                            backgroundColor: COLORS.purpleBg,
                                                            border: `1px solid ${COLORS.purpleBorder}`,
                                                            color: COLORS.purple,
                                                            borderRadius: '999px',
                                                            fontSize: '13px',
                                                            fontWeight: '700',
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 가이드별 매칭률 */}
            <div
                style={{
                    backgroundColor: COLORS.purpleBg,
                    border: `1px solid ${COLORS.purpleBorder}`,
                    borderRadius: '12px',
                    padding: '22px',
                    marginBottom: '18px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '16px' }}>📈</span>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: COLORS.text }}>
                        {t('aiPlan.influencerAnalysis.matchingRateByGuide')}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {guideMatches.map((g) => (
                        <div
                            key={g.id}
                            style={{
                                backgroundColor: COLORS.white,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: '10px',
                                padding: '14px 16px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '14px', color: COLORS.text, fontWeight: '900' }}>
                                        {g.title}
                                    </div>
                                    <div style={{ fontSize: '13px', color: COLORS.sub, marginTop: '4px' }}>
                                        {g.subtitle}
                                    </div>
                                </div>
                                <div style={{ fontSize: '14px', color: COLORS.text, fontWeight: '900' }}>
                                    {g.percent}%
                                </div>
                            </div>
                            <div
                                style={{
                                    marginTop: '10px',
                                    height: '10px',
                                    background: 'linear-gradient(180deg, #F3F4F6 0%, #E5E7EB 100%)',
                                    borderRadius: '999px',
                                    overflow: 'hidden',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.10)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${g.percent}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #B9A8FF 0%, #8B5CF6 100%)',
                                        boxShadow: '0 2px 6px rgba(139, 92, 246, 0.25)',
                                        borderRadius: '999px',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 최종 기획안 */}
            <div
                style={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '12px',
                    backgroundColor: COLORS.white,
                    padding: '22px',
                }}
            >
                <div style={{ fontSize: '16px', fontWeight: '800', color: COLORS.text, marginBottom: '12px' }}>
                    {t('aiPlan.influencerAnalysis.finalStrategyPlan')}
                </div>

                {finalPlans.length > 0 ? (
                    <select
                        value={selectedPlanId ?? ''}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            setSelectedPlanId(id);
                            const plan = finalPlans.find((p) => p.id === id);
                            if (plan && onSelectedFinalPlanChange) onSelectedFinalPlanChange(plan);
                        }}
                        style={{
                            width: '100%',
                            padding: '12px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${COLORS.border}`,
                            backgroundColor: COLORS.white,
                            fontSize: '14px',
                            color: COLORS.text,
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {finalPlans.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.title}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div style={{ padding: '12px', color: COLORS.sub }}>
                        {t('aiPlan.influencerAnalysis.noPlanData')}
                    </div>
                )}

                {selectedPlan && (
                    <div
                        style={{
                            marginTop: '12px',
                            backgroundColor: COLORS.purpleBg,
                            border: `1px solid ${COLORS.purpleBorder}`,
                            borderRadius: '12px',
                            padding: '16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <CheckCircle2 size={18} style={{ color: COLORS.purple }} />
                            <div style={{ fontSize: '14px', color: COLORS.purple, fontWeight: '900' }}>
                                {t('aiPlan.influencerAnalysis.selectedPlan')}
                            </div>
                        </div>
                        <div style={{ fontSize: '14px', color: COLORS.text, fontWeight: '900', marginBottom: '8px' }}>
                            {selectedPlan.title}
                        </div>
                        {selectedPlan.hook && (
                            <div style={{ marginTop: '12px' }}>
                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: COLORS.sub,
                                        fontWeight: '700',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Hook
                                </div>
                                <div style={{ fontSize: '13px', color: COLORS.text }}>{selectedPlan.hook}</div>
                            </div>
                        )}
                        {selectedPlan.usp && (
                            <div style={{ marginTop: '12px' }}>
                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: COLORS.sub,
                                        fontWeight: '700',
                                        marginBottom: '4px',
                                    }}
                                >
                                    USP
                                </div>
                                <div style={{ fontSize: '13px', color: COLORS.text }}>{selectedPlan.usp}</div>
                            </div>
                        )}
                        {selectedPlan.message && (
                            <div style={{ marginTop: '12px' }}>
                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: COLORS.sub,
                                        fontWeight: '700',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Message
                                </div>
                                <div style={{ fontSize: '13px', color: COLORS.text }}>{selectedPlan.message}</div>
                            </div>
                        )}
                        {selectedPlan.cuts && selectedPlan.cuts.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: COLORS.sub,
                                        fontWeight: '700',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Cuts
                                </div>
                                <div style={{ fontSize: '13px', color: COLORS.text }}>
                                    {selectedPlan.cuts.map((cut, idx) => (
                                        <div key={idx} style={{ marginTop: '4px' }}>
                                            • {cut}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {selectedPlan.subtitle && !selectedPlan.hook && (
                            <div style={{ fontSize: '13px', color: COLORS.sub, marginTop: '6px' }}>
                                {selectedPlan.subtitle}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
