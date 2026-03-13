import { useState } from 'react';
import { useRefinedData, useUpdateRefined } from '@/hooks/useAIPlan';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  ClipboardList,
  Zap,
  BookOpen,
  Film,
  Camera,
  AlertTriangle,
  Pencil,
  Save,
  X,
  Loader2,
  Clock,
  Lightbulb,
} from 'lucide-react';

/* ── Design Tokens ── */
const C = {
  purple:  { main: '#7c3aed', light: '#f3e8ff', border: '#d8b4fe', text: '#5b21b6', soft: '#ede9fe' },
  amber:   { main: '#d97706', light: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  blue:    { main: '#2563eb', light: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  red:     { main: '#dc2626', light: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  gray:    { bg: '#f9fafb', border: '#e5e7eb', text: '#374151', subtle: '#6b7280' },
};

const SECTIONS = [
  { key: 'emotion',       num: '①', title: '가이드 개요',                  subtitle: 'Core Emotion Keywords & Emotional Reward Stages', Icon: ClipboardList },
  { key: 'hooking',       num: '②', title: '후킹 핵심 전략 설계',          subtitle: 'Hooking Logic & Trigger Points',                  Icon: Zap },
  { key: 'contentGuide',  num: '③', title: '콘텐츠 가이드',                subtitle: 'Beauty & Lifestyle Production Guide',              Icon: BookOpen },
  { key: 'scenario',      num: '④', title: '시나리오 생성',                subtitle: 'Timeline-based Content Scenario',                  Icon: Film },
  { key: 'production',    num: '⑤', title: '테크니컬 슈팅 & 에디팅 가이드', subtitle: 'Production Tutorial for Influencers',              Icon: Camera },
  { key: 'caution',       num: '⑥', title: '유의사항 & Director\'s Tip',   subtitle: 'Important Notes & Professional Advice',            Icon: AlertTriangle },
];

/* ── Reusable Sub-components ── */

function SectionHeader({ num, Icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
      background: C.purple.light, borderLeft: `4px solid ${C.purple.border}`,
      borderRadius: '0 8px 8px 0', marginBottom: 20,
    }}>
      <Icon style={{ width: 18, height: 18, color: C.purple.main, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.purple.text }}>
          {num} {title}
        </div>
        <div style={{ fontSize: 12, color: C.gray.subtle, marginTop: 1 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, children, color = 'purple' }) {
  const palette = color === 'amber' ? C.amber : color === 'blue' ? C.blue : C.purple;
  return (
    <div style={{
      borderLeft: `3px solid ${palette.main}`, background: palette.light,
      borderRadius: '0 8px 8px 0', padding: '12px 16px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

function SubHeading({ children }) {
  return (
    <h4 style={{
      fontSize: 14, fontWeight: 700, color: C.gray.text,
      margin: '20px 0 10px', paddingBottom: 8,
      borderBottom: `1px solid ${C.gray.border}`,
    }}>
      {children}
    </h4>
  );
}

function PlainText({ children }) {
  return (
    <pre style={{
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      fontSize: 13, lineHeight: 1.7, color: C.gray.text,
      background: C.gray.bg, borderRadius: 8, padding: 16,
      border: `1px solid ${C.gray.border}`, margin: 0, fontFamily: 'inherit',
    }}>
      {children}
    </pre>
  );
}

/* ── Section Renderers (structured data) ── */

function EmotionSection({ data }) {
  if (typeof data === 'string') return <PlainText>{data}</PlainText>;
  return (
    <div>
      <InfoBox label="타겟 (Target)" color="purple">{data.target}</InfoBox>
      <InfoBox label="컨셉 (Concept)" color="amber">{data.concept}</InfoBox>
      {data.mention && (
        <InfoBox label="멘션 가이드" color="blue">
          <div><strong>Official Account:</strong> {data.mention.account}</div>
          <div style={{ marginTop: 4 }}><strong>Hashtag:</strong> {data.mention.hashtags}</div>
        </InfoBox>
      )}
    </div>
  );
}

function HookingSection({ data }) {
  if (typeof data === 'string') return <PlainText>{data}</PlainText>;
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.gray.text, marginBottom: 6 }}>
          Hooking Logic:
        </div>
        <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.7 }}>
          {data.logic}
        </div>
      </div>

      {data.triggers && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray.text, marginBottom: 8 }}>
            Trigger Points (Scroll Stopper)
          </div>
          {data.triggers.map((t, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 13, color: C.gray.text, lineHeight: 1.6 }}>
              <span style={{
                fontWeight: 700, color: C.purple.text,
              }}>[{t.type}]</span>{' '}{t.content}
            </div>
          ))}
        </div>
      )}

      {data.focus && (
        <div style={{
          background: C.amber.light, border: `1px solid ${C.amber.border}`,
          borderRadius: 8, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.amber.text, marginBottom: 4 }}>
            Focus
          </div>
          <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.6 }}>
            {data.focus}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentGuideSection({ data }) {
  if (typeof data === 'string') return <PlainText>{data}</PlainText>;
  return (
    <div>
      {/* 1. 비주얼 디렉팅 */}
      <SubHeading>1. 비주얼 디렉팅</SubHeading>
      {data.visual && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: C.gray.text, marginBottom: 6,
              paddingLeft: 12, borderLeft: `2px solid ${C.purple.border}`,
            }}>
              피부/질감 표현 (Lighting):
            </div>
            <div style={{ paddingLeft: 20 }}>
              {data.visual.lighting?.map((line, i) => (
                <div key={i} style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.7, marginBottom: 2 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
          {data.visual.miseEnScene && (
            <div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: C.gray.text, marginBottom: 6,
                paddingLeft: 12, borderLeft: `2px solid ${C.purple.border}`,
              }}>
                미장센 (Mise-en-scène):
              </div>
              <div style={{ paddingLeft: 20, fontSize: 13, color: C.gray.text, lineHeight: 1.7 }}>
                <div><strong>배경:</strong> {data.visual.miseEnScene.background}</div>
                <div><strong>소품:</strong> {data.visual.miseEnScene.props}</div>
                <div><strong>의상:</strong> {data.visual.miseEnScene.costume}</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 2. 카피라이팅 & 캡션 */}
      {data.copywriting && (
        <>
          <SubHeading>2. 카피라이팅 & 캡션</SubHeading>
          {data.copywriting.onScreen && (
            <div style={{
              background: C.gray.bg, borderRadius: 8, padding: '12px 16px',
              border: `1px solid ${C.gray.border}`, marginBottom: 14,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.gray.subtle, marginBottom: 8 }}>
                On-Screen Copy:
              </div>
              {data.copywriting.onScreen.map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: C.gray.text, marginBottom: 2 }}>
                  {item.text} <span style={{ fontSize: 11, color: C.gray.subtle }}>({item.position})</span>
                </div>
              ))}
            </div>
          )}
          {data.copywriting.caption && (
            <div style={{
              background: C.gray.bg, borderRadius: 8, padding: '12px 16px',
              border: `1px solid ${C.gray.border}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.gray.subtle, marginBottom: 8 }}>
                Caption Guide:
              </div>
              <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.7 }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>첫 줄:</strong> {data.copywriting.caption.firstLine}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>본문:</strong> {data.copywriting.caption.body}
                </div>
                <div>
                  <strong>CTA:</strong> {data.copywriting.caption.cta}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 3. 업로드 전략 */}
      {data.uploadStrategy && (
        <>
          <SubHeading>3. 업로드 전략</SubHeading>
          <div style={{
            background: C.purple.soft, borderRadius: 8, padding: '14px 16px',
            border: `1px solid ${C.purple.border}`,
          }}>
            <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.7 }}>
              <div style={{ marginBottom: 6 }}>
                <strong>썸네일:</strong> {data.uploadStrategy.thumbnail}
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong>해시태그:</strong> {data.uploadStrategy.hashtags}
              </div>
              <div>
                <strong>첫 댓글:</strong> {data.uploadStrategy.firstComment}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScenarioSection({ data }) {
  if (typeof data === 'string') return <PlainText>{data}</PlainText>;
  return (
    <div>
      {/* Scenario title bar */}
      {data.title && (
        <div style={{
          background: C.gray.bg, border: `1px solid ${C.gray.border}`,
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          fontSize: 14, fontWeight: 600, color: C.gray.text,
        }}>
          {data.title}
        </div>
      )}

      {/* Timeline sections */}
      {data.timeline?.map((row, i) => (
        <div key={i} style={{ marginBottom: 24 }}>
          {/* Section label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', marginBottom: 12,
            background: C.purple.light, borderRadius: 8,
          }}>
            <Clock style={{ width: 14, height: 14, color: C.purple.main }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.purple.text }}>
              {row.section} ({row.time})
            </span>
          </div>

          {/* 3-column table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              border: `1px solid ${C.gray.border}`, borderRadius: 8,
              overflow: 'hidden', fontSize: 13,
            }}>
              <thead>
                <tr style={{ background: '#f5f3ff' }}>
                  <th style={thStyle}>Visual / Action</th>
                  <th style={thStyle}>Audio / Narration / Text</th>
                  <th style={thStyle}>Emotion / Key Point</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>{row.visual}</td>
                  <td style={tdStyle}>{row.audio}</td>
                  <td style={tdStyle}>
                    {row.emotion?.split('\n').map((line, j) => (
                      <div key={j} style={j === 0 ? { fontWeight: 600, color: C.purple.text } : {}}>
                        {line}
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Image placeholder grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8, marginTop: 10,
          }}>
            {[0, 1, 2].map((j) => (
              <div key={j} style={{
                aspectRatio: '4/5', borderRadius: 8,
                border: `1.5px dashed ${C.gray.border}`, background: C.gray.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#d1d5db', fontSize: 11,
              }}>
                이미지 {i * 3 + j + 1}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductionSection({ data }) {
  if (typeof data === 'string') return <PlainText>{data}</PlainText>;
  return (
    <div>
      {/* 1. Pre-Production */}
      <SubHeading>1. Pre-Production</SubHeading>
      {data.preProduction && (
        <div style={{
          background: C.gray.bg, borderRadius: 8, padding: '14px 16px',
          border: `1px solid ${C.gray.border}`, marginBottom: 14,
        }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.gray.text, marginBottom: 4 }}>
              준비물:
            </div>
            <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.7 }}>
              {data.preProduction.supplies}
            </div>
          </div>
          {data.preProduction.checklist && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.gray.text, marginBottom: 4 }}>
                체크리스트:
              </div>
              {data.preProduction.checklist.map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.7, marginBottom: 2 }}>
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Cut Editing */}
      <SubHeading>2. Cut Editing</SubHeading>
      {data.cutEditing && (
        <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.7, paddingLeft: 4 }}>
          {data.cutEditing}
        </div>
      )}
    </div>
  );
}

function CautionSection({ data }) {
  if (typeof data === 'string') return <PlainText>{data}</PlainText>;
  const borderColors = [C.red.main, C.amber.main, C.blue.main];
  const bgColors = [C.red.light, C.amber.light, C.blue.light];
  const textColors = [C.red.text, C.amber.text, C.blue.text];

  return (
    <div>
      {/* Caution title */}
      <div style={{ fontSize: 14, fontWeight: 700, color: C.gray.text, marginBottom: 14 }}>
        유의사항 {data.items?.length}가지:
      </div>

      {/* Numbered caution items */}
      {data.items?.map((item, i) => (
        <div key={i} style={{
          borderLeft: `4px solid ${borderColors[i % 3]}`,
          background: bgColors[i % 3], borderRadius: '0 8px 8px 0',
          padding: '12px 16px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textColors[i % 3], marginBottom: 4 }}>
            {i + 1}. {item.title}:
          </div>
          <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.6 }}>
            {item.content}
          </div>
        </div>
      ))}

      {/* Director's Tip */}
      {data.directorTip && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gray.text, marginBottom: 10 }}>
            Director&apos;s Tip:
          </div>
          <div style={{
            background: C.blue.light, border: `1px solid ${C.blue.border}`,
            borderRadius: 8, padding: '14px 16px',
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <Lightbulb style={{ width: 16, height: 16, color: C.blue.main, flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: C.gray.text, lineHeight: 1.7 }}>
                {data.directorTip}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Table styles ── */
const thStyle = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
  fontSize: 12, color: C.purple.text,
  borderBottom: `1px solid ${C.gray.border}`,
  borderRight: `1px solid ${C.gray.border}`,
};
const tdStyle = {
  padding: '12px 14px', verticalAlign: 'top',
  fontSize: 13, color: C.gray.text, lineHeight: 1.6,
  borderRight: `1px solid ${C.gray.border}`,
};

const RENDERERS = {
  emotion: EmotionSection,
  hooking: HookingSection,
  contentGuide: ContentGuideSection,
  scenario: ScenarioSection,
  production: ProductionSection,
  caution: CautionSection,
};

/* ── Main Component ── */

export default function ModifySections({ planDocId }) {
  const { data: refinedData, isLoading } = useRefinedData(planDocId);
  const updateRefined = useUpdateRefined();
  const [editingSection, setEditingSection] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!planDocId) return null;

  const meta = refinedData?.meta;
  const sectionData = refinedData?.data;

  const handleStartEdit = (sectionKey) => {
    const raw = sectionData?.[sectionKey];
    const val = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
    setEditValue(val);
    setEditingSection(sectionKey);
  };

  const handleCancelEdit = () => { setEditingSection(null); setEditValue(''); };

  const handleSave = (sectionKey) => {
    updateRefined.mutate(
      { planDocId, sectionKey, data: editValue },
      { onSuccess: () => { setEditingSection(null); setEditValue(''); } },
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', color: C.purple.main }} />
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', border: `1px solid ${C.gray.border}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* ── Document Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #ddd6fe 100%)',
        padding: '28px 28px 20px',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
          {meta?.title || '릴스 시딩 가이드'}
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: '4px 0 0' }}>
          {meta?.product || ''}
        </p>
      </div>

      {/* Meta info cards */}
      {meta && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, padding: '16px 28px 0',
        }}>
          {[
            { label: '업로드 플랫폼', value: meta.platform },
            { label: '게시 기간', value: meta.period },
            { label: '프로모션 내용', value: meta.promotion },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#fff', border: `1px solid ${C.gray.border}`,
              borderRadius: 8, padding: '10px 14px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.gray.subtle, marginBottom: 3 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.gray.text }}>
                {item.value || '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sections ── */}
      <div style={{ padding: '24px 28px' }}>
        {SECTIONS.map((sec) => {
          const content = sectionData?.[sec.key];
          const isEditing = editingSection === sec.key;
          const Renderer = RENDERERS[sec.key];

          return (
            <div key={sec.key} style={{ marginBottom: 32 }}>
              <SectionHeader num={sec.num} Icon={sec.Icon} title={sec.title} subtitle={sec.subtitle} />

              {isEditing ? (
                /* Edit mode */
                <div style={{
                  border: `1px solid ${C.purple.border}`, borderRadius: 8,
                  padding: 16, background: C.purple.light,
                }}>
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={12}
                    className="resize-y text-sm"
                    style={{ background: '#fff', fontFamily: 'monospace', fontSize: 12 }}
                    placeholder="내용을 입력하세요..."
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={updateRefined.isPending}>
                      <X className="h-3.5 w-3.5 mr-1" />취소
                    </Button>
                    <Button size="sm" onClick={() => handleSave(sec.key)} disabled={updateRefined.isPending}>
                      {updateRefined.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        : <Save className="h-3.5 w-3.5 mr-1" />
                      }저장
                    </Button>
                  </div>
                </div>
              ) : content != null ? (
                /* Rendered content */
                <div>
                  <Renderer data={content} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleStartEdit(sec.key)}
                      style={{ fontSize: 12, color: C.gray.subtle }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />수정
                    </Button>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div style={{
                  textAlign: 'center', padding: '28px 0', color: C.gray.subtle,
                }}>
                  <p style={{ fontSize: 13, margin: '0 0 8px' }}>아직 생성된 내용이 없습니다</p>
                  <Button variant="ghost" size="sm" onClick={() => handleStartEdit(sec.key)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />직접 작성
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
