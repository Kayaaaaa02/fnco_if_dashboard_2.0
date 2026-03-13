import { useState } from 'react';
import { Pencil, Heart, Crosshair, BookOpen, Film, Wrench, ChevronDown, ChevronUp, ListChecks, AlertTriangle, Lightbulb } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const ACCENT = '#7c3aed';
const ACCENT_BG = '#f5f3ff';
const ACCENT_BORDER = '#ddd6fe';

const SECTION_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];

/* ── 접이식 섹션 ── */
function GuideSection({ icon: Icon, num, title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${ACCENT_BORDER}`,
      background: tokens.color.surface, overflow: 'hidden',
      boxShadow: tokens.shadow.card,
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', border: 'none', cursor: 'pointer',
          background: open ? ACCENT_BG : tokens.color.surface,
          borderBottom: open ? `1px solid ${ACCENT_BORDER}` : 'none',
          textAlign: 'left', transition: 'background .15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${ACCENT}, #a78bfa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT }}>{SECTION_NUMS[num - 1] || num}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>{title}</span>
            </div>
            {subtitle && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {open ? <ChevronUp style={{ width: 14, height: 14, color: '#94a3b8' }} /> : <ChevronDown style={{ width: 14, height: 14, color: '#94a3b8' }} />}
        </div>
      </button>
      {open && <div style={{ padding: '20px 24px' }}>{children}</div>}
    </div>
  );
}

/* ── Main Component ── */
export default function ProductionGuide({ creative, guideData: apiGuide, isGenerating, onGenerate }) {
  const savedGuide = creative?.production_guide;
  const guide = apiGuide || savedGuide;

  // 가이드 데이터가 없고 생성 중도 아닌 경우: 생성 버튼 표시
  if (!guide && creative?.status === 'draft') {
    return (
      <div style={{
        borderRadius: 14, border: `1px solid ${ACCENT_BORDER}`,
        background: ACCENT_BG, padding: '32px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        marginBottom: 20,
      }}>
        <Pencil style={{ width: 28, height: 28, color: ACCENT }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
          AI 최종 기획안 생성
        </p>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, margin: 0, textAlign: 'center' }}>
          Gemini AI가 컨셉 정보를 분석하여 최종 제작 기획안을 자동 생성합니다.
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          style={{
            marginTop: 4, padding: '10px 28px', borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${ACCENT}, #a78bfa)`,
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.6 : 1, transition: 'opacity .15s',
          }}
        >
          {isGenerating ? '생성 중...' : 'AI 기획안 생성하기'}
        </button>
      </div>
    );
  }

  // 생성 중 로딩 표시
  if (isGenerating && !guide) {
    return (
      <div style={{
        borderRadius: 14, border: `1px solid ${ACCENT_BORDER}`,
        background: ACCENT_BG, padding: '48px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        marginBottom: 20,
      }}>
        <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${ACCENT_BORDER}`, borderBottomColor: ACCENT }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
          AI 기획안 생성 중...
        </p>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, margin: 0 }}>
          Gemini AI가 최종 제작 기획안을 작성하고 있습니다. 잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  // 가이드가 없으면 빈 상태
  if (!guide) return null;

  const data = guide;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>

      {/* ── ① 소비자 감정 언어 해석 ── */}
      {data.emotionKeywords && (
        <GuideSection icon={Heart} num={1} title="소비자 감정 언어 해석" subtitle="Core Emotion Keywords & Emotional Reward Stages">
          <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 12px' }}>감정 키워드 5가지</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
            {(data.emotionKeywords || []).slice(0, 3).map((kw, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{kw.tag}</span>
                <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0', lineHeight: 1.5 }}>{kw.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 20 }}>
            {(data.emotionKeywords || []).slice(3).map((kw, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{kw.tag}</span>
                <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0', lineHeight: 1.5 }}>{kw.desc}</p>
              </div>
            ))}
          </div>

          {data.rewardSteps && (
            <>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 12px' }}>감성적 리워드 3단계</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {data.rewardSteps.map((step, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '14px 12px', borderRadius: 10, border: `1px solid ${tokens.color.border}`, background: '#fff' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 14, fontWeight: 800 }}>
                      {step.num || i + 1}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text, margin: '0 0 2px' }}>{step.title}</p>
                    <p style={{ fontSize: 10, color: ACCENT, fontWeight: 600, margin: '0 0 6px' }}>{step.sub}</p>
                    <p style={{ fontSize: 10, color: '#64748b', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </GuideSection>
      )}

      {/* ── ② 가이드 개요 INDEX ── */}
      {data.guideIndex && (
        <GuideSection icon={ListChecks} num={2} title="가이드 개요 INDEX" subtitle="Guide Overview">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: `1px solid ${tokens.color.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: ACCENT, margin: '0 0 4px', textTransform: 'uppercase' }}>Target</p>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{data.guideIndex.target}</p>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: `1px solid ${tokens.color.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: ACCENT, margin: '0 0 4px', textTransform: 'uppercase' }}>Concept</p>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{data.guideIndex.concept}</p>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: `1px solid ${tokens.color.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: ACCENT, margin: '0 0 4px', textTransform: 'uppercase' }}>Mention Guide</p>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{data.guideIndex.mentionGuide}</p>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: `1px solid ${tokens.color.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: ACCENT, margin: '0 0 4px', textTransform: 'uppercase' }}>Required Hashtags</p>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{data.guideIndex.requiredHashtags}</p>
            </div>
          </div>
        </GuideSection>
      )}

      {/* ── ③ 후킹 핵심 전략 설계 ── */}
      {data.hookingLogic && (
        <GuideSection icon={Crosshair} num={3} title="후킹 핵심 전략 설계" subtitle="Hooking Logic & Trigger Points">
          <h4 style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text, margin: '0 0 6px' }}>Hooking Logic</h4>
          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, margin: '0 0 16px' }}>{data.hookingLogic}</p>

          {data.triggerPoints && (
            <>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text, margin: '0 0 8px' }}>Trigger Points (Scroll Stopper)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {data.triggerPoints.map((tp, i) => (
                  <p key={i} style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, margin: 0, paddingLeft: 8, borderLeft: `3px solid ${ACCENT_BORDER}` }}>{tp}</p>
                ))}
              </div>
            </>
          )}

          {data.focusText && (
            <div style={{ padding: '14px 18px', borderRadius: 10, background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, margin: '0 0 4px' }}>Focus</p>
              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, margin: 0 }}>{data.focusText}</p>
            </div>
          )}
        </GuideSection>
      )}

      {/* ── ④ 콘텐츠 가이드 ── */}
      {data.visualDirecting && (
        <GuideSection icon={BookOpen} num={4} title="콘텐츠 가이드" subtitle="Beauty & Lifestyle Production Guide">
          <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 12px' }}>1. 비주얼 디렉팅</h4>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>피부/질감 표현 (Lighting)</p>
            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{data.visualDirecting.lighting}</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>미장센 (Mise-en-scene)</p>
            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{data.visualDirecting.miseEnScene}</p>
          </div>

          {data.copywriting && (
            <>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 12px' }}>2. 카피라이팅 & 캡션</h4>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>On-Screen Copy</p>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${tokens.color.border}`, fontSize: 12, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {data.copywriting.onScreen}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>Caption Guide</p>
                <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{data.copywriting.captionGuide}</p>
              </div>
            </>
          )}

          {data.uploadStrategy && (
            <>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 12px' }}>3. 업로드 전략</h4>
              <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{data.uploadStrategy.format}</p>
            </>
          )}
        </GuideSection>
      )}

      {/* ── ⑤ 시나리오 생성 ── */}
      {data.scenarioRows && (
        <GuideSection icon={Film} num={5} title="시나리오 생성" subtitle="Timeline-based Content Scenario">
          {data.scenarioTitle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ padding: '6px 12px', borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Film style={{ width: 12, height: 12, color: '#fbbf24' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {data.scenarioTitle}
                </span>
              </div>
            </div>
          )}

          <div style={{ borderRadius: 10, border: `1px solid ${tokens.color.border}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 1fr', background: '#f8fafc', borderBottom: `1px solid ${tokens.color.border}` }}>
              {['구간', 'Visual / Action', 'Audio / Narration', 'Emotion / Key Point'].map((h) => (
                <div key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#475569' }}>{h}</div>
              ))}
            </div>
            {data.scenarioRows.map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 1fr 1fr',
                borderBottom: i < data.scenarioRows.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafafa',
              }}>
                <div style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: ACCENT }}>{row.section}</span>
                  <br />
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>({row.time})</span>
                </div>
                <div style={{ padding: '10px 12px', fontSize: 10, color: '#475569', lineHeight: 1.6, borderLeft: `1px solid ${tokens.color.border}`, whiteSpace: 'pre-line' }}>{row.visual}</div>
                <div style={{ padding: '10px 12px', fontSize: 10, color: '#475569', lineHeight: 1.6, borderLeft: `1px solid ${tokens.color.border}`, whiteSpace: 'pre-line' }}>{row.audio}</div>
                <div style={{ padding: '10px 12px', fontSize: 10, color: '#475569', lineHeight: 1.6, borderLeft: `1px solid ${tokens.color.border}`, whiteSpace: 'pre-line' }}>{row.emotion}</div>
              </div>
            ))}
          </div>
        </GuideSection>
      )}

      {/* ── ⑥ 테크니컬 슈팅 & 에디팅 가이드 ── */}
      {data.techGuide && (
        <GuideSection icon={Wrench} num={6} title="테크니컬 슈팅 & 에디팅 가이드" subtitle="Production Tutorial for Influencers" defaultOpen={false}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 10px' }}>Pre-Production</h4>
          <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7, margin: '0 0 20px', whiteSpace: 'pre-line' }}>{data.techGuide.preProduction}</p>

          <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 10px' }}>Cut Editing</h4>
          <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{data.techGuide.cutEditing}</p>
        </GuideSection>
      )}

      {/* ── ⑦ 유의사항 ── */}
      {(data.cautions || data.directorTip) && (
        <GuideSection icon={AlertTriangle} num={7} title="유의사항" subtitle="Cautions & Director's Tip" defaultOpen={false}>
          {data.cautions && (
            <>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 12px' }}>영상 촬영 시 주의사항</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: data.directorTip ? 20 : 0 }}>
                {data.cautions.map((c, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', margin: '0 0 2px' }}>{i + 1}. {c.title}</p>
                    <p style={{ fontSize: 11, color: '#9a3412', margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {data.directorTip && (
            <div style={{ padding: '14px 18px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Lightbulb style={{ width: 14, height: 14, color: '#16a34a' }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', margin: 0 }}>Director&apos;s Tip</p>
              </div>
              <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.7, margin: 0 }}>{data.directorTip}</p>
            </div>
          )}
        </GuideSection>
      )}
    </div>
  );
}
