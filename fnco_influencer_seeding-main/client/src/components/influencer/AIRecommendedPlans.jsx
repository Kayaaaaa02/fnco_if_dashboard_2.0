import { useTopContent } from '@/hooks/useAIPlan';
import { CONTENT_TYPE_TO_HOOKS } from '@/lib/aiPlanConstants';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { tokens } from '@/styles/designTokens.js';
import { Brain, Sparkles, Hash, TrendingUp, Lightbulb, ArrowRight } from 'lucide-react';

/* ── 콘텐츠 타입별 컬러 팔레트 ── */
const TYPE_PALETTE = {
  grwm:        { gradient: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', accent: '#ec4899', accentSoft: '#fce7f3', icon: '💄' },
  routine:     { gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', accent: '#22c55e', accentSoft: '#dcfce7', icon: '🌿' },
  daily:       { gradient: 'linear-gradient(135deg, #fefce8, #fef9c3)', accent: '#eab308', accentSoft: '#fef9c3', icon: '☀️' },
  review:      { gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', accent: '#3b82f6', accentSoft: '#dbeafe', icon: '⭐' },
  info:        { gradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', accent: '#8b5cf6', accentSoft: '#ede9fe', icon: '💡' },
  asmr:        { gradient: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', accent: '#a855f7', accentSoft: '#f3e8ff', icon: '🎧' },
  recommend:   { gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)', accent: '#f97316', accentSoft: '#ffedd5', icon: '🔥' },
  haul:        { gradient: 'linear-gradient(135deg, #fef2f2, #fecaca)', accent: '#ef4444', accentSoft: '#fecaca', icon: '🛍️' },
  beforeafter: { gradient: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', accent: '#10b981', accentSoft: '#d1fae5', icon: '✨' },
};
const DEFAULT_PALETTE = { gradient: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', accent: '#64748b', accentSoft: '#f1f5f9', icon: '📋' };

/* ── 스코어 링 SVG ── */
function ScoreRing({ score, color, size = 44 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: 11, fontWeight: 700, fill: color }}
      >
        {score}
      </text>
    </svg>
  );
}

export default function AIRecommendedPlans({ planDocId }) {
  const { data: topContent, isLoading } = useTopContent(planDocId);
  const recommendations = topContent?.recommendations || [];

  const fallbackItems = Object.entries(CONTENT_TYPE_TO_HOOKS)
    .slice(0, 5)
    .map(([key, value]) => ({
      contentType: key,
      title: `${value.label} 콘텐츠`,
      description: `${value.label} 형식의 콘텐츠를 기획해보세요`,
      matchScore: null,
      hooks: value.hooks,
    }));

  if (!planDocId) return null;

  /* ── 로딩 스켈레톤 ── */
  if (isLoading) {
    return (
      <div style={{
        borderRadius: 16, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const displayItems = recommendations.length > 0 ? recommendations : fallbackItems;
  const hasAIData = recommendations.length > 0;

  return (
    <div style={{
      borderRadius: 16,
      border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface,
      overflow: 'hidden',
    }}>
      {/* ── 헤더 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px',
        background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%)',
        borderBottom: `1px solid ${tokens.color.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
          }}>
            <Brain style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text, margin: 0, lineHeight: 1.3 }}>
              AI 추천 기획안
            </h3>
            <p style={{ fontSize: 11, color: tokens.color.textSubtle, margin: 0, lineHeight: 1.3 }}>
              브랜드 DNA · PDA 분석 기반 콘텐츠 전략
            </p>
          </div>
        </div>
        {hasAIData && (
          <Badge style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: '#fff', border: 'none', fontSize: 10, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
          }}>
            <Sparkles style={{ width: 10, height: 10, marginRight: 4 }} />
            AI 분석 완료
          </Badge>
        )}
      </div>

      {/* ── 카드 그리드 ── */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{
          display: 'grid', gap: 14,
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}>
          {displayItems.map((item, idx) => {
            const typeInfo = CONTENT_TYPE_TO_HOOKS[item.contentType];
            const typeLabel = typeInfo?.label || item.contentType;
            const palette = TYPE_PALETTE[item.contentType] || DEFAULT_PALETTE;
            const allHooks = [...new Set([...(typeInfo?.hooks || []), ...(item.hooks || [])])];

            return (
              <div
                key={idx}
                style={{
                  borderRadius: 14,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.surface,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = palette.accent + '40';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = tokens.color.border;
                }}
              >
                {/* 카드 상단 — 타입 + 스코어 */}
                <div style={{
                  background: palette.gradient,
                  padding: '14px 16px 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{palette.icon}</span>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        fontSize: 11, fontWeight: 700, color: palette.accent,
                        background: '#fff', borderRadius: 6,
                        padding: '2px 8px',
                        boxShadow: `0 1px 3px ${palette.accent}20`,
                      }}>
                        {typeLabel}
                      </span>
                    </div>
                  </div>
                  {item.matchScore != null && (
                    <ScoreRing score={item.matchScore} color={palette.accent} />
                  )}
                </div>

                {/* 카드 본문 */}
                <div style={{ padding: '14px 16px 16px' }}>
                  {/* 제목 */}
                  <p style={{
                    fontSize: 13, fontWeight: 700, color: tokens.color.text,
                    margin: '0 0 6px', lineHeight: 1.4,
                  }}>
                    {item.title}
                  </p>
                  {/* 설명 */}
                  <p style={{
                    fontSize: 11, color: tokens.color.textSubtle,
                    margin: '0 0 14px', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {item.description}
                  </p>

                  {/* 구분선 */}
                  <div style={{
                    height: 1, background: tokens.color.border,
                    margin: '0 0 12px',
                  }} />

                  {/* 추천 훅 */}
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      marginBottom: 8,
                    }}>
                      <Lightbulb style={{ width: 12, height: 12, color: palette.accent }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: palette.accent, letterSpacing: 0.3 }}>
                        추천 훅
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {allHooks.slice(0, 3).map((hook, hIdx) => (
                        <div
                          key={hIdx}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontSize: 11, color: tokens.color.text,
                            padding: '6px 10px', borderRadius: 8,
                            background: palette.accentSoft,
                            lineHeight: 1.3,
                          }}
                        >
                          <ArrowRight style={{ width: 10, height: 10, color: palette.accent, flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{hook}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI 분석 미완료 안내 */}
        {!hasAIData && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 18, padding: '10px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, #faf5ff, #eff6ff)',
            border: '1px dashed #c4b5fd',
          }}>
            <Sparkles style={{ width: 13, height: 13, color: '#8b5cf6' }} />
            <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 500 }}>
              AI 분석이 완료되면 맞춤 기획안이 표시됩니다 — 위 항목은 기본 제안입니다
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
