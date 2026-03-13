import { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { usePDA, useGeneratePDA, useUpdatePersonas, useUpdateDesires, useGenerateConcepts, useUpdateConceptStatuses } from '@/hooks/usePDA';
import { useGenerateStrategy } from '@/hooks/useStrategy.js';
import { api } from '@/services/api.js';
import { Button } from '@/components/ui/button.jsx';
import { Sparkles, Loader2, Users, Heart, Eye, Lightbulb, FileText, CheckCircle2, ArrowRight, X, Calendar, Tag, MapPin, Megaphone, Paperclip } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import PersonaEditor from '@/components/pda/PersonaEditor.jsx';
import DesireEditor from '@/components/pda/DesireEditor.jsx';
import ConceptGrid from '@/components/pda/ConceptGrid.jsx';
import PDAMatrix from '@/components/pda/PDAMatrix.jsx';
import ProductBrief from '@/components/pda/ProductBrief.jsx';

const AWARENESS_FUNNEL_COLORS = {
  TOFU: { color: '#0284c7', bg: '#e0f2fe' },
  MOFU: { color: '#7c3aed', bg: '#ede9fe' },
  BOFU: { color: '#059669', bg: '#d1fae5' },
};

const AWARENESS_STAGE_COLORS = {
  A1: { color: '#f59e0b', bg: '#fef3c7' },
  A2: { color: '#3b82f6', bg: '#dbeafe' },
  A3: { color: '#8b5cf6', bg: '#ede9fe' },
  A4: { color: '#10b981', bg: '#d1fae5' },
};

function CampaignInfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon && <span style={{ color: tokens.color.textSubtle, display: 'flex' }}>{icon}</span>}
      <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle, minWidth: 60 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: tokens.color.text }}>{value || '-'}</span>
    </div>
  );
}

function CampaignInfoBlock({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle, display: 'block', marginBottom: 3 }}>{label}</span>
      <p style={{
        fontSize: 12, color: tokens.color.text, lineHeight: 1.6,
        margin: 0, padding: '6px 10px',
        background: '#fff', borderRadius: 8,
        border: `1px solid ${tokens.color.border}`,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {value}
      </p>
    </div>
  );
}

export default function PDASetup() {
  const { id: campaignId } = useParams();
  const { campaign } = useOutletContext();
  const { data: pdaData, isLoading } = usePDA(campaignId);
  const [campaignInfoOpen, setCampaignInfoOpen] = useState(false);
  const [savePopup, setSavePopup] = useState({ open: false, confirmedCount: 0 });
  const [isSavingConfirmed, setIsSavingConfirmed] = useState(false);
  const generatePDA = useGeneratePDA();
  const updatePersonas = useUpdatePersonas();
  const updateDesires = useUpdateDesires();
  const generateConcepts = useGenerateConcepts();
  const updateConceptStatuses = useUpdateConceptStatuses();
  const generateStrategy = useGenerateStrategy();
  const navigate = useNavigate();

  const personas = pdaData?.personas || [];
  const desires = pdaData?.desires || [];
  const awareness = pdaData?.awareness || [];
  const concepts = pdaData?.concepts || [];

  const isGenerating = generatePDA.isPending;
  const isGeneratingConcepts = generateConcepts.isPending;

  // 캠페인 생성 직후 PDA 데이터가 없으면 자동으로 AI 생성 시작
  const autoGenTriggered = useRef(false);
  useEffect(() => {
    if (autoGenTriggered.current) return;
    if (isLoading) return; // 아직 로딩 중
    if (isGenerating) return; // 이미 생성 중
    const hasData = personas.length > 0 || desires.length > 0 || awareness.length > 0 || concepts.length > 0;
    if (!hasData && campaignId) {
      autoGenTriggered.current = true;
      generatePDA.mutate(campaignId);
    }
  }, [isLoading, campaignId, personas.length, desires.length, awareness.length, concepts.length]);

  // Handlers
  const handleGeneratePDA = () => {
    generatePDA.mutate(campaignId);
  };

  const handleGenerateConcepts = () => {
    generateConcepts.mutate(campaignId);
  };

  const handleUpdatePersona = (updated) => {
    const newPersonas = personas.map((p) =>
      p.code === updated.code ? updated : p
    );
    updatePersonas.mutate({ campaignId, personas: newPersonas });
  };

  const handleDeletePersona = (persona) => {
    const newPersonas = personas.filter((p) => p.code !== persona.code);
    updatePersonas.mutate({ campaignId, personas: newPersonas });
  };

  const handleUpdateDesire = (updated) => {
    const newDesires = desires.map((d) =>
      d.code === updated.code ? updated : d
    );
    updateDesires.mutate({ campaignId, desires: newDesires });
  };

  const handleDeleteDesire = (desire) => {
    const newDesires = desires.filter((d) => d.code !== desire.code);
    updateDesires.mutate({ campaignId, desires: newDesires });
  };

  const handleToggleStatus = (conceptIds, status) => {
    updateConceptStatuses.mutate({ campaignId, concept_ids: conceptIds, status });
  };

  const handleSaveConfirmed = async (confirmedIds) => {
    setIsSavingConfirmed(true);
    try {
      // 1. 확정/미확정 상태 DB 저장
      const allIds = concepts.map((c) => c.concept_id ?? c.id);
      const uncheckedIds = allIds.filter((id) => !confirmedIds.includes(id));

      const statusPromises = [];
      if (confirmedIds.length > 0) {
        statusPromises.push(
          api.patch(`/campaigns/${campaignId}/pda/concepts/status`, { concept_ids: confirmedIds, status: 'confirmed' })
        );
      }
      if (uncheckedIds.length > 0) {
        statusPromises.push(
          api.patch(`/campaigns/${campaignId}/pda/concepts/status`, { concept_ids: uncheckedIds, status: 'draft' })
        );
      }
      await Promise.all(statusPromises);

      // 2. 전략 생성
      await api.post(`/campaigns/${campaignId}/strategy/generate`, { confirmed_concept_ids: confirmedIds });

      // 3. 팝업 표시
      setSavePopup({ open: true, confirmedCount: confirmedIds.length });
    } catch (err) {
      console.error('[handleSaveConfirmed] 실패:', err);
      alert('저장 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSavingConfirmed(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>P.D.A. 프레임워크 설정</h1>
            <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 3 }}>
              페르소나(Persona), 욕구(Desire), 인지도(Awareness)를 정의하여 타겟 전략을 수립합니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGeneratePDA}
              disabled={isGenerating}
              className="gap-2"
              style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600 }}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? 'AI 분석 중...' : 'AI 자동 생성'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCampaignInfoOpen(true)}
              className="gap-2"
              style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600 }}
            >
              <FileText className="h-4 w-4" />
              캠페인 내용 확인
            </Button>
          </div>
        </div>
      </div>

      {/* 제품 분석 결과 Brief */}
      <ProductBrief planDocId={campaign?.plan_doc_id} campaign={campaign} />

      <div style={{ borderTop: '1px solid ' + tokens.color.border, margin: '24px 0' }} />

      {/* Persona Section */}
      <section className="space-y-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users style={{ width: 18, height: 18, color: '#7c3aed' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text, margin: 0 }}>페르소나 (Persona)</h2>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: tokens.color.surfaceMuted, color: tokens.color.textSubtle }}>{personas.length}개</span>
        </div>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>
          캠페인 타겟 고객의 프로필을 정의합니다. AI가 자동 생성한 페르소나를 검토하고 수정할 수 있습니다.
        </p>
        {personas.length === 0 ? (
          <div style={{ borderRadius: 14, border: '2px dashed ' + tokens.color.border, padding: '32px 20px', textAlign: 'center' }}>
              <Users style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4, color: tokens.color.textSubtle }} />
              <p style={{ fontSize: 14, color: tokens.color.textSubtle, margin: 0 }}>페르소나가 없습니다</p>
              <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>"AI 자동 생성" 버튼을 클릭하여 페르소나를 생성하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {personas.map((persona) => (
              <PersonaEditor
                key={persona.code}
                persona={persona}
                onUpdate={handleUpdatePersona}
                onDelete={handleDeletePersona}
              />
            ))}
          </div>
        )}
      </section>

      <div style={{ borderTop: '1px solid ' + tokens.color.border, margin: '24px 0' }} />

      {/* Desire Section */}
      <section className="space-y-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Heart style={{ width: 18, height: 18, color: '#d97706' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text, margin: 0 }}>욕구 (Desire)</h2>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: tokens.color.surfaceMuted, color: tokens.color.textSubtle }}>{desires.length}개</span>
        </div>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>
          타겟 고객이 가진 핵심 욕구와 감정 트리거를 정의합니다.
        </p>
        {desires.length === 0 ? (
          <div style={{ borderRadius: 14, border: '2px dashed ' + tokens.color.border, padding: '32px 20px', textAlign: 'center' }}>
              <Heart style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4, color: tokens.color.textSubtle }} />
              <p style={{ fontSize: 14, color: tokens.color.textSubtle, margin: 0 }}>욕구가 없습니다</p>
              <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>"AI 자동 생성" 버튼을 클릭하여 욕구를 생성하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {desires.map((desire) => (
              <DesireEditor
                key={desire.code}
                desire={desire}
                onUpdate={handleUpdateDesire}
                onDelete={handleDeleteDesire}
              />
            ))}
          </div>
        )}
      </section>

      <div style={{ borderTop: '1px solid ' + tokens.color.border, margin: '24px 0' }} />

      {/* Awareness Section — 4단계 인지 여정 */}
      <section className="space-y-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye style={{ width: 18, height: 18, color: '#0d9488' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text, margin: 0 }}>인지 여정 (Awareness Funnel)</h2>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: tokens.color.surfaceMuted, color: tokens.color.textSubtle }}>{awareness.length}단계</span>
        </div>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>
          고객의 구매 여정을 4단계로 나누어 각 단계별 콘텐츠 전략을 설계합니다.
        </p>
        {awareness.length === 0 ? (
          <div style={{ borderRadius: 14, border: '2px dashed ' + tokens.color.border, padding: '32px 20px', textAlign: 'center' }}>
            <Eye style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4, color: tokens.color.textSubtle }} />
            <p style={{ fontSize: 14, color: tokens.color.textSubtle, margin: 0 }}>인지 여정이 없습니다</p>
            <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>"AI 자동 생성" 버튼을 클릭하여 생성하세요</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Funnel Flow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              {awareness.map((item, idx) => {
                const stageColor = AWARENESS_STAGE_COLORS[item.code] || { color: '#0d9488', bg: '#ccfbf1' };
                const funnelColor = AWARENESS_FUNNEL_COLORS[item.funnel] || { color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <div key={item.code || idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      borderRadius: 10, border: `1px solid ${tokens.color.border}`,
                      padding: '6px 14px', background: stageColor.bg,
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        background: stageColor.color, padding: '1px 8px', borderRadius: 6,
                      }}>
                        {item.code}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.text }}>{item.name}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: funnelColor.color,
                        background: '#fff', padding: '1px 6px', borderRadius: 4,
                      }}>
                        {item.funnel}
                      </span>
                    </div>
                    {idx < awareness.length - 1 && (
                      <span style={{ fontSize: 14, color: tokens.color.textSubtle, fontWeight: 700 }}>&rarr;</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Detail Cards */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {awareness.map((item, idx) => {
                const stageColor = AWARENESS_STAGE_COLORS[item.code] || { color: '#0d9488', bg: '#ccfbf1' };
                return (
                  <div key={item.code || idx} style={{
                    borderRadius: 12,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.surface,
                    boxShadow: tokens.shadow.card,
                    padding: 14,
                    borderTop: `3px solid ${stageColor.color}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#fff',
                        background: stageColor.color, padding: '2px 8px', borderRadius: 999,
                      }}>
                        {item.code}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text }}>{item.name}</span>
                    </div>
                    {item.strategy && (
                      <p style={{ fontSize: 11, color: tokens.color.textSubtle, lineHeight: 1.5, marginBottom: 6, wordBreak: 'break-word' }}>
                        {item.strategy}
                      </p>
                    )}
                    {item.tone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: tokens.color.textSubtle }}>톤:</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: stageColor.color,
                          background: stageColor.bg, padding: '1px 8px', borderRadius: 999,
                        }}>
                          {item.tone}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div style={{ borderTop: '1px solid ' + tokens.color.border, margin: '24px 0' }} />

      {/* Concept Generation + P.D.A. Matrix */}
      <section className="space-y-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb style={{ width: 18, height: 18, color: tokens.color.primary }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.color.text, margin: 0 }}>컨셉 설계</h2>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: tokens.color.surfaceMuted, color: tokens.color.textSubtle }}>{concepts.length}개</span>
          </div>
          <Button
            onClick={handleGenerateConcepts}
            disabled={isGeneratingConcepts || personas.length === 0 || desires.length === 0}
            variant="outline"
            className="gap-2"
            style={{ height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600 }}
          >
            {isGeneratingConcepts ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGeneratingConcepts ? '컨셉 생성 중...' : '컨셉 자동 생성'}
          </Button>
        </div>
        <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4 }}>
          페르소나 × 욕구 × 인지 여정 조합을 기반으로 AI가 콘텐츠 컨셉을 자동 생성합니다.
        </p>

        {/* P.D.A. Matrix (컨셉 섹션 내부) */}
        <PDAMatrix
          personas={personas}
          desires={desires}
          awareness={awareness}
          concepts={concepts}
        />

        <ConceptGrid
          concepts={concepts}
          personas={personas}
          desires={desires}
          onSaveConfirmed={handleSaveConfirmed}
          onToggleStatus={handleToggleStatus}
          isSaving={isSavingConfirmed}
        />
      </section>

      {/* 캠페인 내용 확인 팝업 */}
      {campaignInfoOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setCampaignInfoOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              width: 600,
              maxWidth: '92vw',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              animation: 'fadeInUp .25s ease-out',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 팝업 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: `1px solid ${tokens.color.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Megaphone style={{ width: 18, height: 18, color: tokens.color.primary }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: tokens.color.text }}>캠페인 정보</span>
              </div>
              <button
                type="button"
                onClick={() => setCampaignInfoOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: tokens.color.textSubtle, padding: 4,
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* 팝업 내용 */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 기본 정보 */}
                <div style={{
                  padding: 16, borderRadius: 12,
                  background: tokens.color.surfaceMuted,
                  border: `1px solid ${tokens.color.border}`,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.primary, marginBottom: 12, display: 'block' }}>
                    기본 정보
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                    <CampaignInfoRow icon={<Megaphone style={{ width: 13, height: 13 }} />} label="캠페인명" value={campaign?.campaign_name} />
                    <CampaignInfoRow icon={<Tag style={{ width: 13, height: 13 }} />} label="브랜드" value={campaign?.brand_cd} />
                    <CampaignInfoRow icon={<Tag style={{ width: 13, height: 13 }} />} label="제품명" value={campaign?.product_name} />
                    <CampaignInfoRow icon={<MapPin style={{ width: 13, height: 13 }} />} label="국가" value={campaign?.country || '미설정'} />
                    <CampaignInfoRow label="카테고리" value={campaign?.category} />
                    <CampaignInfoRow label="서브카테고리" value={campaign?.subcategory} />
                    <CampaignInfoRow icon={<Calendar style={{ width: 13, height: 13 }} />} label="시작일" value={campaign?.scheduled_start?.slice(0, 10)} />
                    <CampaignInfoRow icon={<Calendar style={{ width: 13, height: 13 }} />} label="종료일" value={campaign?.scheduled_end?.slice(0, 10)} />
                  </div>
                </div>

                {/* Brand DNA */}
                {campaign?.brand_dna && (
                  <div style={{
                    padding: 16, borderRadius: 12,
                    background: tokens.color.surfaceMuted,
                    border: `1px solid ${tokens.color.border}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 12, display: 'block' }}>
                      Brand DNA
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <CampaignInfoBlock label="미션" value={campaign.brand_dna.mission} />
                      <CampaignInfoBlock label="톤 & 매너" value={campaign.brand_dna.tone_of_voice} />
                      <CampaignInfoBlock label="비주얼 스타일" value={campaign.brand_dna.visual_style} />
                      <CampaignInfoBlock label="핵심 메시지" value={campaign.brand_dna.key_messages} />
                    </div>
                  </div>
                )}

                {/* 제품 기획안 */}
                {campaign?.brand_dna?.product_file_path && (
                  <div style={{
                    padding: 16, borderRadius: 12,
                    background: tokens.color.surfaceMuted,
                    border: `1px solid ${tokens.color.border}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 12, display: 'block' }}>
                      첨부 제품 기획안
                    </span>

                    {/* 파일 정보 */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 8,
                      background: '#fff', border: `1px solid ${tokens.color.border}`,
                      marginBottom: 0,
                    }}>
                      <Paperclip style={{ width: 14, height: 14, color: '#059669', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: tokens.color.text, wordBreak: 'break-all' }}>
                        {campaign.brand_dna.product_file_path.split('/').pop()}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                        background: '#d1fae5', color: '#059669', marginLeft: 'auto', flexShrink: 0,
                      }}>
                        {campaign.brand_dna.product_file_path.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div style={{
              padding: '14px 24px',
              borderTop: `1px solid ${tokens.color.border}`,
              display: 'flex', justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => setCampaignInfoOpen(false)}
                style={{
                  padding: '8px 20px', borderRadius: 8,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.surface,
                  color: tokens.color.text,
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 저장 완료 팝업 */}
      {savePopup.open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSavePopup({ open: false, confirmedCount: 0 })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '36px 32px 28px',
              width: 380,
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              textAlign: 'center',
              position: 'relative',
              animation: 'fadeInUp .25s ease-out',
            }}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => setSavePopup({ open: false, confirmedCount: 0 })}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tokens.color.textSubtle, padding: 4,
              }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>

            {/* 체크 아이콘 */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#d1fae5', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: '#10b981' }} />
            </div>

            {/* 텍스트 */}
            <h3 style={{
              fontSize: 18, fontWeight: 700, color: tokens.color.text,
              margin: '0 0 8px',
            }}>
              저장되었습니다
            </h3>
            <p style={{
              fontSize: 13, color: tokens.color.textSubtle,
              margin: '0 0 24px', lineHeight: 1.5,
            }}>
              {savePopup.confirmedCount}개 컨셉이 확정되었습니다.
              <br />전략 설계 화면으로 이동하시겠습니까?
            </p>

            {/* 버튼 영역 */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setSavePopup({ open: false, confirmedCount: 0 })}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.surface,
                  color: tokens.color.textSubtle,
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                현재 화면 유지
              </button>
              <button
                type="button"
                onClick={() => {
                  setSavePopup({ open: false, confirmedCount: 0 });
                  navigate(`/campaigns/${campaignId}/strategy`);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 24px', borderRadius: 10,
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                }}
              >
                다음단계 이동
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
