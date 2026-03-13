import { useState } from 'react';
import { useProductAnalysis } from '@/hooks/useAIPlan';
import { FileText, ChevronDown, ChevronUp, Package, Star, Target, Loader2 } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

function CollapsibleSection({ title, icon: Icon, iconColor, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${tokens.color.border}`, overflow: 'hidden', background: '#ffffff' }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '12px 16px',
          background: open ? '#f8f9fa' : '#ffffff',
          border: 'none',
          cursor: 'pointer',
          transition: 'background .15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon style={{ width: 15, height: 15, color: iconColor }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>{title}</span>
        </div>
        {open
          ? <ChevronUp style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />
          : <ChevronDown style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />}
      </button>
      {open && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${tokens.color.border}`, background: '#ffffff' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProductBrief({ planDocId, campaign }) {
  const { data: aiPlanData, isLoading } = useProductAnalysis(planDocId);
  const [collapsed, setCollapsed] = useState(false);

  const brandDna = campaign?.brand_dna || {};
  const hasBrandDna = !!(brandDna.mission || brandDna.tone_of_voice || brandDna.visual_style || brandDna.key_messages);

  // brand_dna.product_analysis: PDA 생성 시 Gemini가 첨부 기획안을 분석한 결과
  const productAnalysis = brandDna.product_analysis || null;

  // 데이터 소스 우선순위: AI-PLAN 분석 > brand_dna.product_analysis > brand_dna fallback
  const analysisData = aiPlanData || productAnalysis || null;

  // AI 분석 데이터가 없으면 렌더링하지 않음 (브랜드 DNA fallback 제거)
  if (!planDocId && !productAnalysis) return null;

  if (planDocId && isLoading) {
    return (
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <FileText style={{ width: 18, height: 18, color: '#6366f1' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text, margin: 0 }}>제품 분석 결과 Brief</h2>
        </div>
        <div style={{ borderRadius: 14, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: tokens.color.textSubtle }} />
        </div>
      </section>
    );
  }

  // Normalize data — support AI-PLAN, product_analysis (from PDA generation), mockProductAnalysis
  const introduction = analysisData?.introduction || analysisData?.summary || '';
  const productName = analysisData?.product_name || campaign?.product_name || '';
  const categoryLabel = analysisData?.category || (campaign?.category ? `${campaign.category}${campaign.subcategory ? ' > ' + campaign.subcategory : ''}` : '');
  // USP / best_plans — top 5
  const uspItems = (analysisData?.usp || analysisData?.best_plans || []).slice(0, 5);

  // key_messages — only from AI analysis data
  const keyMessages = [];

  // Target data — support both object (target_persona) and string (target_audience)
  const targetPersona = analysisData?.target_persona || null;
  const targetAudience = analysisData?.target_audience || '';

  return (
    <section>
      {/* Section Header (collapsible outer) */}
      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: collapsed ? 0 : 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText style={{ width: 18, height: 18, color: '#6366f1' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text, margin: 0 }}>제품 분석 결과 Brief</h2>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#eef2ff', color: '#6366f1' }}>
            AI 분석
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>{collapsed ? '펼치기' : '접기'}</span>
          {collapsed
            ? <ChevronDown style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />
            : <ChevronUp style={{ width: 16, height: 16, color: tokens.color.textSubtle }} />}
        </div>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* 1. 제품 소개 */}
          <CollapsibleSection title="제품 소개" icon={Package} iconColor="#6366f1" defaultOpen>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Basic info row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px' }}>
                {(campaign?.brand_cd) && (
                  <div>
                    <span style={{ fontSize: 10, color: tokens.color.textSubtle }}>브랜드</span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text, margin: 0 }}>{campaign.brand_cd}</p>
                  </div>
                )}
                {productName && (
                  <div>
                    <span style={{ fontSize: 10, color: tokens.color.textSubtle }}>제품명</span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text, margin: 0 }}>{productName}</p>
                  </div>
                )}
                {categoryLabel && (
                  <div>
                    <span style={{ fontSize: 10, color: tokens.color.textSubtle }}>카테고리</span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text, margin: 0 }}>{categoryLabel}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {introduction && (
                <p style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{introduction}</p>
              )}
            </div>
          </CollapsibleSection>

          {/* 2. 핵심 노출 포인트 TOP 5 (AI 분석 있을 때) 또는 Key Messages (brand_dna fallback) */}
          {uspItems.length > 0 ? (
            <CollapsibleSection title="핵심 노출 포인트 TOP 5" icon={Star} iconColor="#eab308" defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {uspItems.map((item, idx) => {
                  const isString = typeof item === 'string';
                  const title = isString ? item : item.title;
                  const hook = !isString ? item.hook : null;
                  const score = !isString ? item.score : null;
                  const contentType = !isString ? item.content_type : null;

                  return (
                    <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: idx === 0 ? '#eab308' : idx === 1 ? '#a3a3a3' : idx === 2 ? '#b45309' : tokens.color.surfaceMuted,
                        color: idx < 3 ? '#fff' : tokens.color.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800,
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{title}</span>
                          {contentType && (
                            <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 999, border: `1px solid ${tokens.color.border}`, color: tokens.color.textSubtle }}>{contentType}</span>
                          )}
                          {score != null && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: '#fef3c7', color: '#92400e' }}>{score}점</span>
                          )}
                        </div>
                        {hook && <p style={{ fontSize: 11, color: tokens.color.textSubtle, marginTop: 2, lineHeight: 1.5, fontStyle: 'italic' }}>"{hook}"</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          ) : keyMessages.length > 0 && (
            <CollapsibleSection title="핵심 메시지" icon={Star} iconColor="#eab308" defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {keyMessages.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: idx === 0 ? '#eab308' : idx === 1 ? '#a3a3a3' : tokens.color.surfaceMuted,
                      color: idx < 2 ? '#fff' : tokens.color.text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800,
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{msg}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* 3. 타겟 & 니즈 — 3가지 영역으로 구분 */}
          <CollapsibleSection title="타겟 & 니즈" icon={Target} iconColor="#059669" defaultOpen>
            {(targetPersona || targetAudience) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* ① 타겟 */}
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>타겟</span>
                  {targetAudience && (
                    <p style={{ fontSize: 12, fontWeight: 500, color: tokens.color.text, lineHeight: 1.6, margin: 0 }}>{targetAudience}</p>
                  )}
                  {targetPersona && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(targetPersona.age_range || targetPersona.age) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: tokens.color.textSubtle, minWidth: 36 }}>연령</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{targetPersona.age_range || targetPersona.age}</span>
                        </div>
                      )}
                      {targetPersona.description && (
                        <p style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.6, margin: 0 }}>{targetPersona.description}</p>
                      )}
                      {targetPersona.target && (
                        <p style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text, margin: 0 }}>{targetPersona.target}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* ② 페인포인트 */}
                {targetPersona?.pain_points && (
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>페인포인트</span>
                    {Array.isArray(targetPersona.pain_points) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {targetPersona.pain_points.map((p, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginTop: 2, flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.5 }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.5, margin: 0 }}>{targetPersona.pain_points}</p>
                    )}
                  </div>
                )}

                {/* ③ 니즈 */}
                {targetPersona?.needs && (
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>니즈</span>
                    {Array.isArray(targetPersona.needs) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {targetPersona.needs.map((n, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', marginTop: 2, flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.5 }}>{n}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: tokens.color.text, lineHeight: 1.5, margin: 0 }}>{targetPersona.needs}</p>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <p style={{ fontSize: 12, color: tokens.color.textSubtle }}>제품 기획안을 업로드하면 타겟 정보가 자동 분석됩니다.</p>
            )}
          </CollapsibleSection>
        </div>
      )}
    </section>
  );
}
