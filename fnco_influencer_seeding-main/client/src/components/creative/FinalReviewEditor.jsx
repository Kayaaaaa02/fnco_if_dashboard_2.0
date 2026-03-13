import { useState, useRef, useCallback } from 'react';
import {
  Film, Play, Image as ImageIcon, ChevronDown, ChevronUp,
  FileText, Save, ArrowLeft, CheckCircle2, Loader2, Lightbulb,
  Eye, Music, Heart, Sparkles, AlertTriangle, Wrench, Target, Zap,
  BookOpen, Trash2, Upload, EyeOff, Eye as EyeIcon, RotateCcw,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const ACCENT = '#7c3aed';
const ACCENT_BG = '#f5f3ff';
const ACCENT_BORDER = '#ddd6fe';

const FUNNEL_CFG = {
  TOFU: { label: 'TOFU', color: '#0284c7', bg: '#e0f2fe' },
  MOFU: { label: 'MOFU', color: '#7c3aed', bg: '#ede9fe' },
  BOFU: { label: 'BOFU', color: '#059669', bg: '#d1fae5' },
};

/* Placeholder images for demo */
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b8?w=200&h=260&fit=crop',
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&h=260&fit=crop',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=200&h=260&fit=crop',
];

/* ── Collapsible Section ── */
function Section({ icon: Icon, title, defaultOpen = true, accentColor = ACCENT, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface, overflow: 'hidden',
      boxShadow: tokens.shadow.card,
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', border: 'none', cursor: 'pointer',
          background: open ? '#f8f9fa' : tokens.color.surface,
          borderBottom: open ? `1px solid ${tokens.color.border}` : 'none',
          textAlign: 'left', transition: 'background .15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: 15, height: 15, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>{title}</span>
        </div>
        {open
          ? <ChevronUp style={{ width: 14, height: 14, color: '#94a3b8' }} />
          : <ChevronDown style={{ width: 14, height: 14, color: '#94a3b8' }} />}
      </button>
      {open && <div style={{ padding: '20px 24px' }}>{children}</div>}
    </div>
  );
}

/* ── Image Action Button ── */
function ImgActionBtn({ icon: Icon, label, onClick, color = '#64748b', bg = '#f1f5f9', hoverBg }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: 6, border: 'none',
        background: bg, cursor: 'pointer', padding: 0,
        transition: 'background .15s, transform .1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg || '#e2e8f0'; e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = bg; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <Icon style={{ width: 13, height: 13, color }} />
    </button>
  );
}

/* ── Scenario Step with Images (with manage actions) ── */
function ScenarioStep({ row, stepIndex, images, hiddenMap, onDelete, onUpload, onToggleHide, onRestore }) {
  const imgs = images || [];
  const fileInputRefs = useRef([]);

  const handleFileSelect = (imgIndex, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpload(stepIndex, imgIndex, ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${tokens.color.border}`,
      background: '#fff', overflow: 'hidden',
    }}>
      {/* Step Header */}
      <div style={{
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #7c3aed10, #6366f110)',
        borderBottom: `1px solid ${tokens.color.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 800, color: '#fff',
            background: ACCENT, padding: '2px 10px', borderRadius: 6,
          }}>
            {row.section}
          </span>
          <span style={{ fontSize: 11, color: '#64748b' }}>{row.time}</span>
        </div>
      </div>

      {/* 3-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${tokens.color.border}` }}>
        <div style={{ padding: '12px 14px', borderRight: `1px solid ${tokens.color.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Eye style={{ width: 12, height: 12, color: '#475569' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Visual / Action</span>
          </div>
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{row.visual}</p>
        </div>
        <div style={{ padding: '12px 14px', borderRight: `1px solid ${tokens.color.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Music style={{ width: 12, height: 12, color: '#475569' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Audio / Narration / Text</span>
          </div>
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{row.audio}</p>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Heart style={{ width: 12, height: 12, color: '#475569' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Emotion / Big Note</span>
          </div>
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{row.emotion}</p>
        </div>
      </div>

      {/* AI Images for this step — with manage actions */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[0, 1, 2].map((i) => {
            const isHidden = hiddenMap?.[`${stepIndex}-${i}`];
            const hasImage = !!imgs[i];
            const isDeleted = imgs[i] === null;

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Image container */}
                <div style={{
                  borderRadius: 10, overflow: 'hidden',
                  border: `1px solid ${isHidden ? '#fde68a' : tokens.color.border}`,
                  aspectRatio: '3/4', background: '#f8fafc',
                  position: 'relative',
                }}>
                  {hasImage && !isDeleted ? (
                    <>
                      <img
                        src={imgs[i]}
                        alt={`step-${stepIndex}-${i}`}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          filter: isHidden ? 'blur(8px) brightness(0.5)' : 'none',
                          transition: 'filter .2s',
                        }}
                      />
                      {isHidden && (
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        }}>
                          <EyeOff style={{ width: 24, height: 24, color: '#fbbf24' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>숨김 처리됨</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      height: '100%', gap: 4,
                    }}>
                      <ImageIcon style={{ width: 24, height: 24, color: '#cbd5e1' }} />
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>
                        {isDeleted ? '삭제됨' : '이미지'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                  {hasImage && !isDeleted ? (
                    <>
                      <ImgActionBtn
                        icon={isHidden ? EyeIcon : EyeOff}
                        label={isHidden ? '숨김 해제' : '숨김 처리'}
                        onClick={() => onToggleHide(stepIndex, i)}
                        color={isHidden ? '#059669' : '#d97706'}
                        bg={isHidden ? '#d1fae5' : '#fef3c7'}
                        hoverBg={isHidden ? '#a7f3d0' : '#fde68a'}
                      />
                      <ImgActionBtn
                        icon={Trash2}
                        label="삭제"
                        onClick={() => onDelete(stepIndex, i)}
                        color="#dc2626"
                        bg="#fef2f2"
                        hoverBg="#fecaca"
                      />
                      {/* Hidden file input for replace/upload */}
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => { if (!fileInputRefs.current[i]) fileInputRefs.current[i] = el; else fileInputRefs.current[i] = el; }}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(i, e)}
                      />
                      <ImgActionBtn
                        icon={Upload}
                        label="교체"
                        onClick={() => fileInputRefs.current[i]?.click()}
                        color="#2563eb"
                        bg="#eff6ff"
                        hoverBg="#bfdbfe"
                      />
                    </>
                  ) : (
                    <>
                      {/* Upload new or Restore */}
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => { fileInputRefs.current[i] = el; }}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(i, e)}
                      />
                      <ImgActionBtn
                        icon={Upload}
                        label="업로드"
                        onClick={() => fileInputRefs.current[i]?.click()}
                        color="#2563eb"
                        bg="#eff6ff"
                        hoverBg="#bfdbfe"
                      />
                      {isDeleted && onRestore && (
                        <ImgActionBtn
                          icon={RotateCcw}
                          label="복원"
                          onClick={() => onRestore(stepIndex, i)}
                          color="#059669"
                          bg="#d1fae5"
                          hoverBg="#a7f3d0"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Labeled Info Block ── */
function InfoBlock({ label, children, bg = '#f8fafc', borderColor = tokens.color.border, labelColor = ACCENT }) {
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 700, color: labelColor, display: 'block', marginBottom: 6 }}>{label}</span>
      <div style={{
        padding: '10px 14px', borderRadius: 8,
        background: bg, border: `1px solid ${borderColor}`,
        fontSize: 12, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Numbered Sub-heading ── */
function SubHeading({ number, title }) {
  return (
    <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 20, height: 20, borderRadius: 6, background: ACCENT, color: '#fff',
        fontSize: 11, fontWeight: 800,
      }}>{number}</span>
      {title}
    </h4>
  );
}

export default function FinalReviewEditor({ creative, campaign, onBack, onSave, onApprove, isSaving }) {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const guide = creative?.production_guide || {};
  const funnel = FUNNEL_CFG[creative?.funnel] || FUNNEL_CFG.TOFU;

  // Scenario data
  const scenarioRows = guide.scenarioRows || [];
  const scenarioTitle = guide.scenarioTitle || creative?.concept_name || '';
  const format = creative?.format || '15s Reels';

  // AI editor data (saved from previous step)
  const originalSavedImages = guide.saved_images || {};
  const videoGenerated = guide.video_generated || false;

  // Guide data
  const guideIndex = guide.guideIndex || {};
  const copywriting = guide.copywriting || {};

  // ── Image management state ──
  // imageOverrides: { [stepIndex]: { [imgIndex]: url | null } }
  //   null = deleted, string = replaced/uploaded
  const [imageOverrides, setImageOverrides] = useState({});
  // hiddenImages: { "stepIndex-imgIndex": true }
  const [hiddenImages, setHiddenImages] = useState(() => {
    // Restore from production_guide if previously saved
    const h = guide.hidden_images || {};
    return h;
  });

  // Merge original + overrides to get current images per step
  const getStepImages = useCallback((stepIndex) => {
    const original = originalSavedImages[stepIndex] || PLACEHOLDER_IMAGES;
    const overrides = imageOverrides[stepIndex] || {};
    return [0, 1, 2].map((i) =>
      overrides[i] !== undefined ? overrides[i] : original[i] || null,
    );
  }, [originalSavedImages, imageOverrides]);

  const handleImageDelete = useCallback((stepIndex, imgIndex) => {
    setImageOverrides((prev) => ({
      ...prev,
      [stepIndex]: { ...(prev[stepIndex] || {}), [imgIndex]: null },
    }));
  }, []);

  const handleImageUpload = useCallback((stepIndex, imgIndex, dataUrl) => {
    setImageOverrides((prev) => ({
      ...prev,
      [stepIndex]: { ...(prev[stepIndex] || {}), [imgIndex]: dataUrl },
    }));
  }, []);

  const handleToggleHide = useCallback((stepIndex, imgIndex) => {
    const key = `${stepIndex}-${imgIndex}`;
    setHiddenImages((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  }, []);

  const handleImageRestore = useCallback((stepIndex, imgIndex) => {
    setImageOverrides((prev) => {
      const stepOverrides = { ...(prev[stepIndex] || {}) };
      delete stepOverrides[imgIndex];
      const next = { ...prev };
      if (Object.keys(stepOverrides).length === 0) {
        delete next[stepIndex];
      } else {
        next[stepIndex] = stepOverrides;
      }
      return next;
    });
  }, []);

  // Check if images have been modified
  const hasImageChanges = Object.keys(imageOverrides).length > 0 ||
    JSON.stringify(hiddenImages) !== JSON.stringify(guide.hidden_images || {});

  const handleSave = async () => {
    if (!onSave) return;
    try {
      // Build updated saved_images by merging overrides
      const updatedImages = {};
      scenarioRows.forEach((_, idx) => {
        const stepIdx = idx + 1;
        updatedImages[stepIdx] = getStepImages(stepIdx);
      });

      await onSave({
        production_guide: {
          ...guide,
          saved_images: updatedImages,
          hidden_images: hiddenImages,
        },
      });
      // Clear overrides after successful save (now baked into production_guide)
      setImageOverrides({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ══════ Header Card ══════ */}
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
        boxShadow: '0 4px 20px rgba(124,58,237,.2)',
      }}>
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.7)', margin: '0 0 4px' }}>시딩 카피라이드</p>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
            {creative?.concept_name || '최종 검수'}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
            <InfoPill label="플랫폼" value={creative?.campaign_placement || 'Instagram'} />
            <InfoPill label="퍼널" value={funnel.label} />
            {creative?.persona_code && <InfoPill label="페르소나" value={creative.persona_code} />}
            {creative?.desire_code && <InfoPill label="욕구" value={creative.desire_code} />}
          </div>
        </div>
      </div>

      {/* ══════ 1. 가이드 개요 ══════ */}
      <Section icon={Target} title="가이드 개요" accentColor="#7c3aed">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 타겟 */}
          <InfoBlock label="타겟 (Target)" bg={ACCENT_BG} borderColor={ACCENT_BORDER}>
            {guideIndex.target || '타겟 정보 없음'}
          </InfoBlock>

          {/* 컨셉 */}
          <InfoBlock label="컨셉 (Concept)" bg={ACCENT_BG} borderColor={ACCENT_BORDER}>
            {guideIndex.concept || creative?.concept_name || '컨셉 정보 없음'}
          </InfoBlock>

          {/* 멘션 가이드 */}
          <InfoBlock label="멘션 가이드" bg="#eff6ff" borderColor="#bfdbfe" labelColor="#2563eb">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {guideIndex.mentionGuide && <div>{guideIndex.mentionGuide}</div>}
              {guideIndex.requiredHashtags && (
                <div style={{ color: '#2563eb', fontWeight: 600 }}>{guideIndex.requiredHashtags}</div>
              )}
              {!guideIndex.mentionGuide && !guideIndex.requiredHashtags && '멘션 가이드 정보 없음'}
            </div>
          </InfoBlock>
        </div>
      </Section>

      {/* ══════ 2. 후킹 핵심 전략 설계 ══════ */}
      <Section icon={Zap} title="후킹 핵심 전략 설계" accentColor="#f59e0b">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InfoBlock label="Hooking Logic" bg="#fffbeb" borderColor="#fde68a" labelColor="#d97706">
            {guide.hookingLogic || '후킹 로직 정보 없음'}
          </InfoBlock>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InfoBlock label="Trigger Points" bg="#fffbeb" borderColor="#fde68a" labelColor="#d97706">
              {Array.isArray(guide.triggerPoints) && guide.triggerPoints.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {guide.triggerPoints.map((tp, i) => (
                    <div key={i}>{tp}</div>
                  ))}
                </div>
              ) : (
                'Trigger Points 정보 없음'
              )}
            </InfoBlock>
            <InfoBlock label="Focus" bg="#fffbeb" borderColor="#fde68a" labelColor="#d97706">
              {guide.focusText || 'Focus 정보 없음'}
            </InfoBlock>
          </div>
        </div>
      </Section>

      {/* ══════ 3. 콘텐츠 가이드 ══════ */}
      <Section icon={Sparkles} title="콘텐츠 가이드" accentColor="#6366f1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 3-1. 비주얼 디렉팅 */}
          <div>
            <SubHeading number="1" title="비주얼 디렉팅" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guide.visualDirecting?.lighting && (
                <InfoBlock label="피부/질감 표현 (Lighting)" bg="#f8fafc" borderColor={tokens.color.border}>
                  {guide.visualDirecting.lighting}
                </InfoBlock>
              )}
              {guide.visualDirecting?.miseEnScene && (
                <InfoBlock label="미장센 (Mise-en-scene)" bg="#f8fafc" borderColor={tokens.color.border}>
                  {guide.visualDirecting.miseEnScene}
                </InfoBlock>
              )}
              {guide.visualDirecting?.colorGrading && (
                <InfoBlock label="컬러 그레이딩" bg="#f8fafc" borderColor={tokens.color.border}>
                  {guide.visualDirecting.colorGrading}
                </InfoBlock>
              )}
              {!guide.visualDirecting && (
                <InfoBlock label="비주얼 디렉팅" bg="#f8fafc" borderColor={tokens.color.border}>
                  비주얼 디렉팅 정보 없음
                </InfoBlock>
              )}
            </div>
          </div>

          {/* 3-2. 카피라이팅 & 캡션 */}
          <div>
            <SubHeading number="2" title="카피라이팅 & 캡션" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {copywriting.onScreen && (
                <InfoBlock label="On-Screen Copy" bg="#f8fafc" borderColor={tokens.color.border}>
                  {copywriting.onScreen}
                </InfoBlock>
              )}
              {copywriting.captionGuide && (
                <InfoBlock label="캡션 가이드 (Caption Guide)" bg="#f8fafc" borderColor={tokens.color.border}>
                  {copywriting.captionGuide}
                </InfoBlock>
              )}
              {creative?.copy_text && (
                <InfoBlock label="캡션 (Caption)" bg="#f8fafc" borderColor={tokens.color.border}>
                  {creative.copy_text}
                </InfoBlock>
              )}
              {guideIndex.requiredHashtags && (
                <InfoBlock label="해시태그" bg="#f0fdf4" borderColor="#bbf7d0" labelColor="#16a34a">
                  {guideIndex.requiredHashtags}
                </InfoBlock>
              )}
            </div>
          </div>

          {/* 3-3. 업로드 전략 */}
          <div>
            <SubHeading number="3" title="업로드 전략" />
            <InfoBlock label="업로드 전략" bg="#eff6ff" borderColor="#bfdbfe" labelColor="#2563eb">
              {(typeof guide.uploadStrategy === 'object' ? guide.uploadStrategy?.format : guide.uploadStrategy) || '업로드 전략 정보 없음'}
            </InfoBlock>
          </div>
        </div>
      </Section>

      {/* ══════ 4. 시나리오 테이블 ══════ */}
      {scenarioRows.length > 0 && (
        <Section icon={Film} title="시나리오 테이블" accentColor="#2563eb">
          {/* Scenario title bar */}
          {scenarioTitle && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
              padding: '10px 16px', borderRadius: 10,
              background: '#1e1b4b', color: '#fff',
            }}>
              <Film style={{ width: 14, height: 14, color: '#a78bfa' }} />
              <span style={{ fontSize: 12, color: '#c4b5fd' }}>[Concealment]</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{scenarioTitle} 인플루언서 맞춤형 콘텐츠 제작 가이드</span>
            </div>
          )}

          {/* Scenario steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {scenarioRows.map((row, idx) => (
              <ScenarioStep
                key={idx}
                row={row}
                stepIndex={idx + 1}
                images={getStepImages(idx + 1)}
                hiddenMap={hiddenImages}
                onDelete={handleImageDelete}
                onUpload={handleImageUpload}
                onToggleHide={handleToggleHide}
                onRestore={handleImageRestore}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ══════ 5. 테크니컬 슈팅 & 에디팅 가이드 ══════ */}
      <Section icon={Wrench} title="테크니컬 슈팅 & 에디팅 가이드" accentColor="#475569" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <SubHeading number="1" title="Pre-Production" />
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: '#f8fafc', border: `1px solid ${tokens.color.border}`,
              fontSize: 11, color: '#64748b', lineHeight: 1.7, whiteSpace: 'pre-line',
            }}>
              {guide.techGuide?.preProduction || '정보 없음'}
            </div>
          </div>
          <div>
            <SubHeading number="2" title="Cut Editing" />
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: '#f8fafc', border: `1px solid ${tokens.color.border}`,
              fontSize: 11, color: '#64748b', lineHeight: 1.7, whiteSpace: 'pre-line',
            }}>
              {guide.techGuide?.cutEditing || '정보 없음'}
            </div>
          </div>
        </div>
      </Section>

      {/* ══════ 6. 유의사항 & Director's Tip ══════ */}
      <Section icon={Lightbulb} title="유의사항 & Director's Tip" accentColor="#16a34a" defaultOpen={false}>
        {/* 유의사항 */}
        <div style={{ marginBottom: guide.directorTip ? 16 : 0 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 10px' }}>영상 촬영 시 주의사항</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {guide.cautions && guide.cautions.length > 0 ? (
              guide.cautions.map((c, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: '#fff7ed', border: '1px solid #fed7aa',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', margin: '0 0 2px' }}>{i + 1}. {c.title}</p>
                  <p style={{ fontSize: 11, color: '#9a3412', margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
                </div>
              ))
            ) : (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: '#f8fafc', border: `1px solid ${tokens.color.border}`,
                fontSize: 11, color: '#94a3b8',
              }}>
                유의사항 정보 없음
              </div>
            )}
          </div>
        </div>
        {/* Director's Tip */}
        <div style={{ padding: '14px 18px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Lightbulb style={{ width: 14, height: 14, color: '#16a34a' }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', margin: 0 }}>Director&apos;s Tip</p>
          </div>
          <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
            {guide.directorTip || 'Director\'s Tip 정보 없음'}
          </p>
        </div>
      </Section>

      {/* ══════ 7. AI 영상 가이드 ══════ */}
      <Section icon={Film} title="AI 영상 가이드" accentColor="#0284c7">
        <div style={{
          borderRadius: 12, overflow: 'hidden',
          background: '#000', aspectRatio: '16/9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', cursor: 'pointer',
          border: '1px solid #334155',
        }}>
          {/* Thumbnail */}
          {(savedImages[1]?.[0] || PLACEHOLDER_IMAGES[0]) && (
            <img
              src={savedImages[1]?.[0] || PLACEHOLDER_IMAGES[0]}
              alt="video-thumbnail"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
            />
          )}
          {/* Play overlay */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,.3)',
          }}>
            <Play style={{ width: 28, height: 28, color: '#1e293b', marginLeft: 3 }} />
          </div>
          {/* Bottom bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 16px',
            background: 'linear-gradient(transparent, rgba(0,0,0,.7))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{scenarioTitle}</span>
          </div>
        </div>
        {!videoGenerated && (
          <div style={{
            marginTop: 12, padding: '10px 16px', borderRadius: 8,
            background: '#fffbeb', border: '1px solid #fde68a',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle style={{ width: 14, height: 14, color: '#d97706', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#92400e' }}>이전 단계에서 영상 생성이 완료되지 않았습니다.</span>
          </div>
        )}
      </Section>

      {/* ══════ Bottom Action Bar ══════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
        padding: '16px 0',
        borderTop: `1px solid ${tokens.color.border}`,
        marginTop: 8,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: `1px solid ${tokens.color.border}`,
            background: '#fff', color: tokens.color.text, cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          이전 단계
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: 'none',
            background: saveSuccess ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #2563eb, #0ea5e9)',
            color: '#fff', cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'background .3s',
          }}
        >
          {isSaving ? (
            <Loader2 style={{ width: 16, height: 16, animation: 'spin 1.5s linear infinite' }} />
          ) : saveSuccess ? (
            <CheckCircle2 style={{ width: 16, height: 16 }} />
          ) : (
            <Save style={{ width: 16, height: 16 }} />
          )}
          {isSaving ? '저장 중...' : saveSuccess ? '저장 완료!' : hasImageChanges ? '변경사항 저장' : '저장하기'}
        </button>
        <button
          onClick={onApprove}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: 'none',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#fff', cursor: 'pointer',
          }}
        >
          <CheckCircle2 style={{ width: 16, height: 16 }} />
          최종 검수 요청하기
        </button>
      </div>
    </div>
  );
}

/* ── Helper: Info Pill for header ── */
function InfoPill({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', display: 'block' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{value}</span>
    </div>
  );
}
