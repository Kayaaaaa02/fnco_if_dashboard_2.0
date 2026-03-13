import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlignment, useRunAlignment } from '@/hooks/useAlignment.js';
import {
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

/* ── Score helpers ── */
function scoreColor(s) {
  if (s >= 85) return '#10b981';
  if (s >= 70) return '#f59e0b';
  return '#ef4444';
}
function scoreBg(s) {
  if (s >= 85) return '#ecfdf5';
  if (s >= 70) return '#fffbeb';
  return '#fef2f2';
}
function scoreLabel(s) {
  if (s >= 85) return '양호';
  if (s >= 70) return '주의';
  return '위험';
}

/* ── Tooltip ── */
function AlignmentTooltip() {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info style={{ width: 13, height: 13, color: tokens.color.textSubtle, cursor: 'help' }} />
      {show && (
        <span style={{
          position: 'absolute', left: '50%', top: 'calc(100% + 6px)', transform: 'translateX(-50%)',
          width: 280, padding: '8px 12px', borderRadius: 8,
          background: '#1e293b', color: '#fff',
          fontSize: 11, lineHeight: 1.5, fontWeight: 400,
          pointerEvents: 'none',
          zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,.25)',
          whiteSpace: 'normal',
        }}>
          브랜드 톤·타겟 적합성·비주얼·메시지·경쟁 차별화 5개 차원에서 전략의 일관성을 AI가 점검합니다. 85점 이상이면 양호, 70점 미만이면 위험입니다.
        </span>
      )}
    </span>
  );
}

/* ── Main Component ── */
export default function AlignmentCheck() {
  const { id: campaignId } = useParams();
  const { data: alignmentResponse, isLoading } = useAlignment(campaignId);
  const runAlignment = useRunAlignment();

  const alignment = alignmentResponse;
  const checks = alignment?.checks || [];
  const overallScore = alignment?.overall_score || 0;
  const isRunning = runAlignment.isPending;

  const goodCount = checks.filter((c) => c.score >= 85).length;
  const warnCount = checks.filter((c) => c.score >= 70 && c.score < 85).length;
  const badCount = checks.filter((c) => c.score < 70).length;

  const allIssueCount = checks.reduce((s, c) => s + (c.issues?.length || 0), 0);

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface,
      boxShadow: tokens.shadow.card,
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: `1px solid ${tokens.color.border}`,
        background: tokens.color.surfaceMuted,
        borderRadius: '14px 14px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck style={{ width: 16, height: 16, color: '#3b82f6' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>전략 정합성 체크</span>
          <AlignmentTooltip />
          {alignment && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: scoreBg(overallScore), color: scoreColor(overallScore),
            }}>
              {scoreLabel(overallScore)}
            </span>
          )}
        </div>
        <button
          onClick={() => runAlignment.mutate(campaignId)}
          disabled={isRunning}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 30, padding: '0 14px', borderRadius: 8,
            background: '#3b82f6', color: '#fff',
            fontSize: 12, fontWeight: 600, border: 'none',
            cursor: isRunning ? 'wait' : 'pointer',
            opacity: isRunning ? 0.7 : 1,
          }}
        >
          {isRunning
            ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            : <Sparkles style={{ width: 14, height: 14 }} />}
          {isRunning ? '분석 중...' : '정합성 체크 실행'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '20px 18px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
            <Loader2 style={{ width: 24, height: 24, color: tokens.color.textSubtle, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : !alignment ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: tokens.color.textSubtle }}>
            <ShieldCheck style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4 }} />
            <p style={{ fontSize: 13 }}>정합성 체크를 실행하여 전략의 일관성을 검증하세요</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Overall Score Banner ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              borderRadius: 12, padding: '18px 22px',
              background: `linear-gradient(135deg, ${scoreBg(overallScore)} 0%, #fff 100%)`,
              border: `1px solid ${scoreColor(overallScore)}25`,
            }}>
              {/* Score ring */}
              <div style={{
                position: 'relative',
                width: 80, height: 80, flexShrink: 0,
              }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={scoreColor(overallScore)}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - overallScore / 100)}`}
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(overallScore), lineHeight: 1 }}>
                    {overallScore}
                  </span>
                  <span style={{ fontSize: 9, color: tokens.color.textSubtle }}>/ 100</span>
                </div>
              </div>

              {/* Right side: summary */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text }}>종합 정합성 점수</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                    background: scoreColor(overallScore), color: '#fff',
                  }}>
                    {scoreLabel(overallScore)}
                  </span>
                </div>
                {/* Summary counts */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {goodCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle2 style={{ width: 14, height: 14 }} />
                      {goodCount}개 양호
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                      <AlertTriangle style={{ width: 14, height: 14 }} />
                      {warnCount}개 주의
                    </span>
                  )}
                  {badCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                      <AlertTriangle style={{ width: 14, height: 14 }} />
                      {badCount}개 위험
                    </span>
                  )}
                  {allIssueCount > 0 && (
                    <span style={{ fontSize: 11, color: tokens.color.textSubtle, display: 'flex', alignItems: 'center' }}>
                      |&nbsp; 개선 필요 {allIssueCount}건
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── 5 Dimension Score Cards (Row) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${checks.length}, 1fr)`,
              gap: 10,
            }}>
              {checks.map((check) => {
                const color = scoreColor(check.score);
                const hasIssues = (check.issues || []).length > 0;
                return (
                  <div key={check.dimension} style={{
                    borderRadius: 10,
                    border: `1px solid ${tokens.color.border}`,
                    borderTop: `3px solid ${color}`,
                    padding: '14px 12px 12px',
                    background: '#fff',
                    textAlign: 'center',
                  }}>
                    {/* Score */}
                    <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
                      {check.score}
                    </span>
                    {/* Label */}
                    <p style={{
                      fontSize: 11, fontWeight: 600, color: tokens.color.text,
                      margin: '6px 0 8px', lineHeight: 1.2, wordBreak: 'keep-all',
                    }}>
                      {check.label}
                    </p>
                    {/* Mini bar */}
                    <div style={{
                      height: 4, borderRadius: 2,
                      background: '#f3f4f6', overflow: 'hidden',
                      margin: '0 auto', width: '100%',
                    }}>
                      <div style={{
                        width: `${check.score}%`, height: '100%', borderRadius: 2,
                        background: color,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    {/* Status */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 3, marginTop: 6,
                    }}>
                      {check.score >= 85
                        ? <CheckCircle2 style={{ width: 11, height: 11, color: '#10b981' }} />
                        : <AlertTriangle style={{ width: 11, height: 11, color }} />}
                      <span style={{ fontSize: 10, color: tokens.color.textSubtle }}>
                        {check.score >= 85 ? '통과' : hasIssues ? `이슈 ${check.issues.length}건` : '주의'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Dimension Detail Cards ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checks.map((check) => {
                const color = scoreColor(check.score);
                const issues = check.issues || [];
                return (
                  <div key={check.dimension} style={{
                    borderRadius: 10,
                    border: `1px solid ${tokens.color.border}`,
                    borderLeft: `3px solid ${color}`,
                    padding: '12px 16px',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    {/* Score badge */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: scoreBg(check.score),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color }}>{check.score}</span>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text }}>
                          {check.label}
                        </span>
                        {check.score >= 85
                          ? <CheckCircle2 style={{ width: 13, height: 13, color: '#10b981' }} />
                          : <AlertTriangle style={{ width: 13, height: 13, color }} />}
                      </div>
                      <p style={{
                        fontSize: 11, color: tokens.color.textSubtle, lineHeight: 1.55,
                        margin: 0, wordBreak: 'keep-all',
                      }}>
                        {check.details}
                      </p>

                      {/* Inline issues */}
                      {issues.length > 0 && (
                        <div style={{
                          marginTop: 8, padding: '6px 10px', borderRadius: 6,
                          background: '#fffbeb', border: '1px solid #fde68a',
                        }}>
                          {issues.map((issue, idx) => (
                            <div key={idx} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 6,
                              fontSize: 11, color: '#92400e', lineHeight: 1.5,
                              marginTop: idx > 0 ? 4 : 0,
                            }}>
                              <span style={{ color: '#d97706', flexShrink: 0 }}>•</span>
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI suggestions */}
                      {(check.suggestions || []).length > 0 && (
                        <div style={{
                          marginTop: 6, padding: '6px 10px', borderRadius: 6,
                          background: '#ecfdf5', border: '1px solid #a7f3d0',
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI 개선 제안</span>
                          {check.suggestions.map((sug, si) => (
                            <div key={si} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 6,
                              fontSize: 11, color: '#065f46', lineHeight: 1.5,
                              marginTop: 3,
                            }}>
                              <span style={{ color: '#10b981', flexShrink: 0 }}>→</span>
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CSS keyframe for spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
