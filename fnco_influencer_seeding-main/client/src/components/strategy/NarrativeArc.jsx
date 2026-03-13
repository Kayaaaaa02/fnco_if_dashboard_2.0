import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  useNarrativeArc,
  useGenerateNarrativeArc,
  useUpdateNarrativeArc,
} from '@/hooks/useNarrativeArc.js';
import { useCampaign } from '@/hooks/useCampaign.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Film, Sparkles, Loader2, Pencil, Check, X, ChevronRight, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const PHASE_META = {
  tease: { label: '티징', subtitle: '문제 인지', funnel: 'TOFU', accent: '#8b5cf6', soft: '#ede9fe', desc: 'Pain Point 자극으로 문제 인식' },
  reveal: { label: '공개', subtitle: '해결책 인지', funnel: 'MOFU', accent: '#3b82f6', soft: '#dbeafe', desc: '해결 메커니즘과 제품 원리 교육' },
  validate: { label: '검증', subtitle: '제품 인지', funnel: 'MOFU', accent: '#10b981', soft: '#d1fae5', desc: '사회적 증거로 신뢰 강화' },
  amplify: { label: '확산', subtitle: '구매 유도', funnel: 'BOFU', accent: '#f59e0b', soft: '#fef3c7', desc: '데이터 기반 전환 극대화' },
};

const FUNNEL_STYLE = {
  TOFU: { color: '#7c3aed', bg: '#ede9fe' },
  MOFU: { color: '#0d9488', bg: '#f0fdfa' },
  BOFU: { color: '#dc2626', bg: '#fef2f2' },
};

/* ── KPI 문자열 파싱 ── */
function parsePhaseKpis(kpiString) {
  if (!kpiString) return [];
  return kpiString.split(',').map((s) => s.trim()).filter(Boolean).map((part) => {
    const [name, ...rest] = part.split(/\s+/);
    return { name, target: rest.join(' ') };
  });
}

/* ── 캠페인 기간 → 4단계 자동 타이밍 ── */
function computeArcTiming(scheduledStart, scheduledEnd) {
  if (!scheduledStart || !scheduledEnd) return null;
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);
  const totalDays = Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)), 1);

  const teaseDays = Math.max(Math.round(totalDays * 0.2), 1);
  const revealDays = Math.max(Math.round(totalDays * 0.3), 1);
  const validateDays = Math.max(Math.round(totalDays * 0.25), 1);
  const amplifyDays = Math.max(totalDays - teaseDays - revealDays - validateDays, 1);

  const fmt = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

  const d1 = new Date(start);
  const d1e = new Date(d1); d1e.setDate(d1e.getDate() + teaseDays - 1);
  const d2 = new Date(d1e); d2.setDate(d2.getDate() + 1);
  const d2e = new Date(d2); d2e.setDate(d2e.getDate() + revealDays - 1);
  const d3 = new Date(d2e); d3.setDate(d3.getDate() + 1);
  const d3e = new Date(d3); d3e.setDate(d3e.getDate() + validateDays - 1);
  const d4 = new Date(d3e); d4.setDate(d4.getDate() + 1);

  return {
    tease: `${fmt(d1)}~${fmt(d1e)}`,
    reveal: `${fmt(d2)}~${fmt(d2e)}`,
    validate: `${fmt(d3)}~${fmt(d3e)}`,
    amplify: `${fmt(d4)}~${fmt(end)}`,
  };
}

/* ── 툴팁 ── */
function NarrativeTooltip() {
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
          position: 'absolute', left: '50%', bottom: 'calc(100% + 6px)', transform: 'translateX(-50%)',
          width: 280, padding: '8px 12px', borderRadius: 8,
          background: '#1e293b', color: '#fff',
          fontSize: 11, lineHeight: 1.5, fontWeight: 400,
          pointerEvents: 'none', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,.25)',
          whiteSpace: 'normal',
        }}>
          인지단계(A1~A4)와 론칭 서사(Tease→Reveal→Validate→Amplify)를 통합하여 콘텐츠 타임라인을 설계합니다.
        </span>
      )}
    </span>
  );
}

/* ── 컨셉 토글 카드 ── */
function ConceptToggle({ concepts, accent, soft }) {
  const [open, setOpen] = useState(false);
  if (!concepts || concepts.length === 0) return null;

  return (
    <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${soft}` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          border: `1px solid ${accent}25`, background: soft,
          fontSize: 9, fontWeight: 700, color: accent,
          cursor: 'pointer',
        }}
      >
        컨셉 {concepts.length}개
        {open ? <ChevronUp style={{ width: 10, height: 10 }} /> : <ChevronDown style={{ width: 10, height: 10 }} />}
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
          {concepts.map((c, ci) => (
            <div key={ci} style={{
              borderRadius: 6, padding: '5px 8px',
              background: '#fff', border: `1px solid ${tokens.color.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {c.persona && (
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3, background: accent + '18', color: accent }}>
                    {c.persona}
                  </span>
                )}
                <span style={{ fontSize: 9, fontWeight: 600, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>
              </div>
              {c.head_copy && (
                <p style={{ fontSize: 8, color: tokens.color.textSubtle, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.head_copy}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export default function NarrativeArc() {
  const { id: campaignId } = useParams();
  const { data: arcData, isLoading } = useNarrativeArc(campaignId);
  const { data: campaignData } = useCampaign(campaignId);
  const generateArc = useGenerateNarrativeArc();
  const updateArc = useUpdateNarrativeArc();

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState([]);

  const arc = arcData;
  const phases = arc?.phases || [];
  const isGenerating = generateArc.isPending;

  const arcTiming = useMemo(
    () => computeArcTiming(campaignData?.scheduled_start, campaignData?.scheduled_end),
    [campaignData?.scheduled_start, campaignData?.scheduled_end],
  );

  const startEditing = () => {
    setEditDraft(JSON.parse(JSON.stringify(phases)));
    setIsEditing(true);
  };
  const cancelEditing = () => { setIsEditing(false); setEditDraft([]); };
  const saveEditing = () => {
    updateArc.mutate({ campaignId, phases: editDraft }, {
      onSuccess: () => { setIsEditing(false); setEditDraft([]); },
    });
  };
  const updateField = (idx, field, value) => {
    const u = [...editDraft];
    u[idx] = { ...u[idx], [field]: value };
    setEditDraft(u);
  };

  const displayPhases = isEditing ? editDraft : phases;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <div className="animate-spin" style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${tokens.color.border}`, borderBottomColor: tokens.color.primary }} />
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface, boxShadow: tokens.shadow.card,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: `1px solid ${tokens.color.border}`,
        background: tokens.color.surfaceMuted,
        borderRadius: '14px 14px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Film style={{ width: 16, height: 16, color: '#8b5cf6' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>론칭 서사 아크</span>
          <NarrativeTooltip />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {phases.length > 0 && !isEditing && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={startEditing}>
              <Pencil className="h-3.5 w-3.5" /> 편집
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={saveEditing} disabled={updateArc.isPending}>
                {updateArc.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" style={{ color: '#10b981' }} />}
                저장
              </Button>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={cancelEditing}>
                <X className="h-3.5 w-3.5" /> 취소
              </Button>
            </>
          )}
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => generateArc.mutate(campaignId)} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {isGenerating ? 'AI 생성 중...' : 'AI 서사 생성'}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px' }}>
        {phases.length === 0 ? (
          <div style={{
            padding: '36px 0', textAlign: 'center', color: tokens.color.textSubtle,
            border: `1px dashed ${tokens.color.border}`, borderRadius: 12,
          }}>
            <Film style={{ width: 28, height: 28, margin: '0 auto 8px', opacity: 0.4 }} />
            <p style={{ fontSize: 13, fontWeight: 500 }}>AI 서사 생성 버튼을 눌러 론칭 타임라인을 설계하세요</p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {displayPhases.map((phase, idx) => {
              const meta = PHASE_META[phase.phase] || { label: phase.phase, subtitle: '', funnel: 'TOFU', accent: '#8b5cf6', soft: '#ede9fe', desc: '' };
              const fStyle = FUNNEL_STYLE[meta.funnel] || FUNNEL_STYLE.TOFU;
              const timing = (arcTiming && arcTiming[phase.phase]) || phase.timing;

              return (
                <div key={phase.phase} style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0 }}>
                  {/* Phase card */}
                  <div style={{
                    flex: 1, minWidth: 0, borderRadius: 10,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.surface, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {/* Color bar */}
                    <div style={{ height: 3, background: meta.accent }} />

                    <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Row 1: 인지단계 + 서사 라벨 + 퍼널 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: meta.accent }}>{meta.label}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: tokens.color.textSubtle }}>·</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: tokens.color.textSubtle }}>{meta.subtitle}</span>
                        <span style={{
                          fontSize: 8, fontWeight: 800, marginLeft: 'auto', padding: '1px 6px', borderRadius: 999,
                          background: fStyle.bg, color: fStyle.color,
                        }}>{meta.funnel}</span>
                      </div>

                      {/* Row 2: 타이밍 */}
                      {isEditing ? (
                        <Input
                          value={phase.timing || ''}
                          onChange={(e) => updateField(idx, 'timing', e.target.value)}
                          className="h-5 text-[10px] mb-1"
                          style={{ color: tokens.color.textSubtle }}
                        />
                      ) : timing && (
                        <span style={{
                          display: 'inline-block', fontSize: 9, fontWeight: 600,
                          padding: '1px 7px', borderRadius: 999, marginBottom: 6,
                          background: meta.soft, color: meta.accent, alignSelf: 'flex-start',
                        }}>{timing}</span>
                      )}

                      {/* Row 3: 간략 설명 (30자 이내) */}
                      {isEditing ? (
                        <Textarea
                          value={phase.purpose || ''}
                          onChange={(e) => updateField(idx, 'purpose', e.target.value)}
                          className="text-xs min-h-[28px] mb-1"
                          style={{ fontSize: 10 }}
                        />
                      ) : (
                        <p style={{ fontSize: 10, lineHeight: 1.4, color: tokens.color.text, margin: '0 0 4px' }}>
                          {meta.desc}
                        </p>
                      )}

                      {/* Row 4: 톤 */}
                      {isEditing ? (
                        <Input
                          value={phase.message_tone || ''}
                          onChange={(e) => updateField(idx, 'message_tone', e.target.value)}
                          className="h-5 text-[9px] italic mb-1"
                        />
                      ) : phase.message_tone && (
                        <p style={{ fontSize: 9, fontStyle: 'italic', color: tokens.color.textSubtle, margin: '0 0 4px' }}>
                          &ldquo;{phase.message_tone}&rdquo;
                        </p>
                      )}

                      {/* Row 5: KPI 뱃지 */}
                      {isEditing ? (
                        <Input
                          value={phase.kpi || ''}
                          onChange={(e) => updateField(idx, 'kpi', e.target.value)}
                          className="h-5 text-[9px] flex-1 min-w-[60px]"
                          placeholder="KPI"
                        />
                      ) : (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
                          {parsePhaseKpis(phase.kpi).map((kpi) => (
                            <span key={kpi.name} style={{
                              fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                              background: meta.soft, color: meta.accent,
                              display: 'inline-flex', alignItems: 'center', gap: 2,
                            }}>
                              {kpi.name} <span style={{ fontWeight: 800 }}>{kpi.target}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Row 6: 컨셉 토글 */}
                      {!isEditing && (
                        <ConceptToggle concepts={phase.concepts} accent={meta.accent} soft={meta.soft} />
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  {idx < displayPhases.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 3px', flexShrink: 0 }}>
                      <ChevronRight style={{ width: 14, height: 14, color: tokens.color.border }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
