import { useState, useMemo } from 'react';
import { Sparkles, SkipForward, ArrowLeft, ArrowRight, Upload, RefreshCw, Save, AlertTriangle, Eye, Music, Heart, Image as ImageIcon, User, Film, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const ACCENT = '#7c3aed';
const ACCENT_BG = '#f5f3ff';
const ACCENT_BORDER = '#ddd6fe';

const DEFAULT_STEPS = [
  { key: 1, label: 'STEP 1 Hook' },
  { key: 2, label: 'STEP 2 Middle' },
  { key: 3, label: 'STEP 3 Highlight' },
  { key: 4, label: 'STEP 4 CTA' },
];

const STYLE_OPTIONS = [
  { value: '친근함', desc: '따뜻하고 편안한 집을 배경으로 자연스러운 분위기를 강조하는 스타일' },
  { value: '전문성', desc: '전문적이고 신뢰감 있는 클리닉/랩 배경의 깔끔한 스타일' },
  { value: '럭셔리', desc: '고급스럽고 세련된 대리석/골드 톤의 프리미엄 스타일' },
  { value: '예능/유머', desc: '밝고 유쾌한 컬러풀 배경의 재미있는 스타일' },
  { value: '리얼/노필터', desc: '꾸밈없는 일상 배경의 자연스럽고 솔직한 스타일' },
  { value: '미니멀', desc: '깔끔한 화이트/그레이 배경의 미니멀한 스타일' },
];

/* ── 시나리오 데이터: production_guide가 있으면 활용, 없으면 fallback ── */
function buildStepScenario(creative) {
  // production_guide에 scenarioRows가 있으면 우선 사용
  const guide = creative?.production_guide;
  if (guide?.scenarioRows && guide.scenarioRows.length > 0) {
    return guide.scenarioRows;
  }

  const format = creative?.format || '15s Reels';
  const isShort = format.includes('15s') || format.includes('Shorts');

  const rows = isShort
    ? [
        { section: 'HOOK', time: '00-03s', visual: '[Extreme Close-up] 요공이 두드러진 코 옆 나비존에 선스틱이 \'슥\' 지나가는 순간.\n지나간 자리만 마법처럼 매끈하게 블러 처리되는 실시간 화면.', audio: '(Effect) 부드러운 \'슈슉\' 슬라이딩 사운드 + (NAR) "아직도 사진 찍을 때 필터 쓰세요?"', emotion: '#신기함 #시각적쾌감\n가장 강력한 USP인 \'블러링 효과\'를 초반 1초에 배치하여 이탈 방지' },
        { section: 'Middle', time: '03-09s', visual: '[Quick Cut] 이마→볼→턱 라인까지 슬라이딩하며 사용 시연.\n워터프루프 테스트: 분무기로 물 분사 → 제품 유지.', audio: '(Effect) 경쾌한 패트 사운드 + (NAR) "물에도 이 피부 그대로"', emotion: '#해방감 #만족감\n워터프루프 시연으로 제품 신뢰도 강화' },
        { section: 'Highlight', time: '09-13s', visual: '[Slow Motion] 자연광 아래서 자신감 넘치는 미소.\n프라이머 바른 듯한 윤광 피부 클로즈업.', audio: '(NAR) "글로스, 거친 모공도 이 피부 비결"', emotion: '#자신감\n사용 후 \'이상적인 피부\' 비주얼' },
        { section: 'CTA', time: '13-15s', visual: '[Product Shot] 깔끔한 화이트 배경에 제품 스틸컷.\n핸드에 올려진 가벼운 조명.', audio: '(NAR) "지금 올리브영에서 확인해보세요."', emotion: '#행동유도\n올리브영 프로필 링크 전달' },
      ]
    : [
        { section: 'HOOK', time: '00-05s', visual: '질문형 텍스트 + 피부 클로즈업', audio: 'Hook 질문 내레이션', emotion: '궁금증 유발' },
        { section: 'Problem', time: '05-12s', visual: '문제 상황 시연', audio: '공감 BGM + 내레이션', emotion: '공감/문제 인식' },
        { section: 'Solution', time: '12-22s', visual: '제품 사용 시연 + Before/After', audio: '제품명 언급 + 효과 설명', emotion: '기대감/놀라움' },
        { section: 'CTA', time: '22-30s', visual: '제품 패키지 + 구매 링크', audio: 'CTA 내레이션', emotion: '행동 유도' },
      ];

  return rows;
}

/* ── 기본 AI 프롬프트 생성 ── */
function generateDefaultPrompt(creative, stepIdx) {
  const name = creative?.concept_name || '';
  const product = creative?.product_name || '바닐라코 UV 디펜스 워터프루프 선스틱';
  return `Natural smartphone selfie, iPhone 15 Pro front camera 12MP TrueDepth camera, still frame from a high-quality viral beauty review. Extreme macro close-up focusing on the butterfly zone-the area beside the nose and inner cheek-of a young Korean woman in her early 20s. She has a sophisticated and confident expression, styled as a skincare expert with neat hair and a clean white elegant blouse. The physical action is the application of ${product} in a smooth sliding motion across the nose bridge and cheek area.`;
}

/* ── Placeholder generated images ── */
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b8?w=200&h=260&fit=crop',
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&h=260&fit=crop',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=200&h=260&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=260&fit=crop',
];

export default function AIImageEditor({ creative, campaign, onBack, onNext, onSave, initialView }) {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState('친근함');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imageSaved, setImageSaved] = useState(false);
  const [promptByStep, setPromptByStep] = useState(() => {
    const obj = {};
    DEFAULT_STEPS.forEach((s) => { obj[s.key] = generateDefaultPrompt(creative, s.key); });
    return obj;
  });
  const [savedImagesByStep, setSavedImagesByStep] = useState({});
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  // 영상 생성 관련 상태: 'idle' | 'generating' | 'done'
  const [videoState, setVideoState] = useState(initialView === 'video' ? 'done' : 'idle');
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  const scenarioRows = useMemo(() => buildStepScenario(creative), [creative]);
  const STEPS = useMemo(() => {
    if (scenarioRows.length > 0) {
      return scenarioRows.map((row, i) => ({
        key: i + 1,
        label: `STEP ${i + 1} ${row.section}`,
      }));
    }
    return DEFAULT_STEPS;
  }, [scenarioRows]);
  const currentRow = scenarioRows[activeStep - 1] || scenarioRows[0];
  const styleInfo = STYLE_OPTIONS.find((s) => s.value === selectedStyle) || STYLE_OPTIONS[0];

  const productCategory = campaign?.category || creative?.category || '선케어';
  const productSubcategory = campaign?.subcategory || creative?.subcategory || '선스틱';
  const productName = campaign?.product_name || creative?.product_name || '바닐라코 UV 디펜스 워터프루프 선스틱';
  const scenarioTitle = creative?.production_guide?.scenarioTitle || creative?.concept_name || '1초 만에 완성되는 현실판 피부 보정 필터, 바닐라코 선스틱';
  const format = creative?.format || '15s Reels';
  const runtime = format.includes('15s') ? '15초 (Shorts/Reels 최적화)' : format.includes('30s') ? '30초 (YouTube/Reels)' : format;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedImages(PLACEHOLDER_IMAGES);
      setIsGenerating(false);
    }, 1500);
  };

  const handleRefreshPrompt = () => {
    setPromptByStep((prev) => ({
      ...prev,
      [activeStep]: generateDefaultPrompt(creative, activeStep),
    }));
  };

  const handleStartVideoGeneration = () => {
    setVideoState('generating');
    // 영상 생성 시뮬레이션 (5초)
    setTimeout(() => {
      setVideoState('done');
    }, 5000);
  };

  const handleSaveImage = (imgUrl) => {
    setSavedImagesByStep((prev) => {
      const current = prev[activeStep] || [];
      if (current.length >= 3) return prev;
      if (current.includes(imgUrl)) return prev;
      return { ...prev, [activeStep]: [...current, imgUrl] };
    });
  };

  // DB 저장 핸들러
  const handleSaveToDB = async () => {
    if (!onSave) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave({
        ai_editor_data: {
          saved_images: savedImagesByStep,
          selected_style: selectedStyle,
          prompts: promptByStep,
          video_generated: videoState === 'done',
        },
      });
      setImageSaved(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('[AIImageEditor] 저장 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  /* ── 영상 생성 중 / 완료 화면 ── */
  if (videoState === 'generating' || videoState === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderRadius: 14,
          background: `linear-gradient(135deg, #2563eb, #0ea5e9)`,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Film style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>AI 영상 생성</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', margin: '2px 0 0' }}>
                생성된 이미지를 기반으로 AI 영상을 제작합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Scenario Info Bar */}
        <div style={{
          padding: '14px 20px', borderRadius: 10,
          background: '#1e1b4b', color: '#fff', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles style={{ width: 14, height: 14, color: '#a78bfa' }} />
            <span style={{ fontSize: 12, color: '#c4b5fd' }}>시나리오 제목:</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{scenarioTitle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#a5b4fc' }}>⏱ 러닝타임:</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{runtime}</span>
          </div>
        </div>

        {/* Main Content */}
        {videoState === 'generating' ? (
          <div style={{
            borderRadius: 14, border: `1px solid ${ACCENT_BORDER}`,
            background: '#f8fafc', padding: '80px 40px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            marginBottom: 20,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              <Loader2 style={{ width: 36, height: 36, color: '#fff', animation: 'spin 1.5s linear infinite' }} />
            </div>
            <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.85; } }`}</style>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
                AI 영상 생성 중...
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 4px' }}>
                생성된 이미지와 시나리오를 기반으로 영상을 제작하고 있습니다.
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                약 1~3분 정도 소요될 수 있습니다. 잠시만 기다려 주세요.
              </p>
            </div>
            <div style={{
              width: '100%', maxWidth: 400, height: 6, borderRadius: 3,
              background: '#e2e8f0', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #2563eb, #0ea5e9)',
                animation: 'progress 3s ease-in-out infinite',
              }} />
            </div>
            <style>{`@keyframes progress { 0% { width: 5%; } 50% { width: 70%; } 100% { width: 95%; } }`}</style>
          </div>
        ) : (
          /* videoState === 'done' */
          <div style={{
            borderRadius: 14, border: `1px solid ${ACCENT_BORDER}`,
            background: '#fff', overflow: 'hidden',
            marginBottom: 20,
          }}>
            {/* 완료 배너 */}
            <div style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: '1px solid #6ee7b7',
            }}>
              <CheckCircle2 style={{ width: 24, height: 24, color: '#059669' }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#065f46', margin: 0 }}>AI 영상 생성이 완료되었습니다!</p>
                <p style={{ fontSize: 12, color: '#047857', margin: '2px 0 0' }}>아래에서 생성된 영상을 확인하세요.</p>
              </div>
            </div>

            {/* 영상 미리보기 영역 */}
            <div style={{ padding: '24px' }}>
              <div style={{
                borderRadius: 12, overflow: 'hidden',
                background: '#000', aspectRatio: '16/9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', cursor: 'pointer',
                border: '1px solid #334155',
              }}
                onClick={() => setShowVideoPreview(!showVideoPreview)}
              >
                {/* 썸네일 이미지 (저장된 첫번째 이미지 또는 placeholder) */}
                {(savedImagesByStep[1]?.[0] || PLACEHOLDER_IMAGES[0]) && (
                  <img
                    src={savedImagesByStep[1]?.[0] || PLACEHOLDER_IMAGES[0]}
                    alt="video-thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                  />
                )}
                {/* 재생 버튼 오버레이 */}
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
                {/* 하단 정보 바 */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '12px 16px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,.7))',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{scenarioTitle}</span>
                  <span style={{ fontSize: 11, color: '#cbd5e1', background: 'rgba(0,0,0,.4)', padding: '2px 8px', borderRadius: 4 }}>{runtime}</span>
                </div>
              </div>

              {/* STEP별 사용된 이미지 요약 */}
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>STEP별 사용 이미지</p>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 10 }}>
                  {STEPS.map((step) => (
                    <div key={step.key} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: ACCENT, margin: '0 0 6px' }}>{step.label}</p>
                      <div style={{
                        borderRadius: 8, overflow: 'hidden',
                        border: `1px solid ${ACCENT_BORDER}`,
                        aspectRatio: '3/4', background: '#f8fafc',
                      }}>
                        {(savedImagesByStep[step.key] || [])[0] ? (
                          <img src={savedImagesByStep[step.key][0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <ImageIcon style={{ width: 20, height: 20, color: '#cbd5e1' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: videoState === 'done' ? '1fr 1fr' : '1fr', gap: 12 }}>
          {videoState === 'done' && (
            <button
              onClick={handleSaveToDB}
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
              {isSaving ? '저장 중...' : saveSuccess ? '저장 완료!' : '저장하기'}
            </button>
          )}
          {videoState === 'done' && (
            <button
              onClick={onNext}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                border: 'none',
                background: `linear-gradient(135deg, ${ACCENT}, #6366f1)`,
                color: '#fff', cursor: 'pointer',
              }}
            >
              <ArrowRight style={{ width: 16, height: 16 }} />
              최종 편집하기
            </button>
          )}
          {videoState === 'generating' && (
            <button
              disabled
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                border: 'none',
                background: '#94a3b8',
                color: '#fff', cursor: 'not-allowed', opacity: 0.7,
              }}
            >
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1.5s linear infinite' }} />
              영상 생성 중...
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', borderRadius: 14,
        background: `linear-gradient(135deg, ${ACCENT}, #a78bfa)`,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>AI 이미지 생성</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', margin: '2px 0 0' }}>
              생성된 AI 기획안을 기반으로, 최적화된 레퍼런스 이미지를 생성하세요!
            </p>
          </div>
        </div>
      </div>

      {/* ── Scenario Info Bar ── */}
      <div style={{
        padding: '14px 20px', borderRadius: 10,
        background: '#1e1b4b', color: '#fff', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Sparkles style={{ width: 14, height: 14, color: '#a78bfa' }} />
          <span style={{ fontSize: 12, color: '#c4b5fd' }}>시나리오 제목:</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{scenarioTitle}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#a5b4fc' }}>⏱ 러닝타임:</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{runtime}</span>
        </div>
      </div>

      {/* ── Step Selector ── */}
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, marginBottom: 16,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: '0 0 12px' }}>
          AI이미지 생성 STEP 선택
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {STEPS.map((step) => {
            const isActive = activeStep === step.key;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => setActiveStep(step.key)}
                style={{
                  padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: isActive ? `2px solid ${ACCENT}` : `1px solid ${tokens.color.border}`,
                  background: isActive ? ACCENT_BG : '#fff',
                  color: isActive ? ACCENT : tokens.color.textSubtle,
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '14px 18px', borderRadius: 10,
        background: '#fffbeb', border: '1px solid #fde68a',
        marginBottom: 20,
      }}>
        <AlertTriangle style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', margin: 0 }}>
            원하는 이미지의 스타일을 설정하고 AI프롬프트의 '새로고침' 버튼을 클릭 후 '생성' 버튼을 클릭하세요.
          </p>
          <p style={{ fontSize: 12, color: '#a16207', margin: '4px 0 0' }}>
            TIP: AI 프롬프트는 직접 수정도 가능합니다.
          </p>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Product Info */}
          <div style={{
            padding: '18px 20px', borderRadius: 12,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles style={{ width: 14, height: 14, color: ACCENT }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>생성 제품</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, color: tokens.color.textSubtle, margin: '0 0 4px' }}>제품 카테고리</p>
                <div style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT_BORDER}`,
                }}>
                  {productCategory}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, color: tokens.color.textSubtle, margin: '0 0 4px' }}>세부 카테고리</p>
                <div style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT_BORDER}`,
                }}>
                  {productSubcategory}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, color: tokens.color.textSubtle, margin: '0 0 4px' }}>제품명</p>
                <div style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                }}>
                  {productName}
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Content for current step */}
          <div style={{
            padding: '18px 20px', borderRadius: 12,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: tokens.color.text, margin: '0 0 16px' }}>
              AI 이미지 생성
            </h3>
            <p style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: '0 0 14px' }}>
              {STEPS[activeStep - 1]?.label}
            </p>

            {/* Visual / Action */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Eye style={{ width: 14, height: 14, color: '#475569' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Visual / Action</span>
              </div>
              <p style={{
                fontSize: 12, color: '#475569', lineHeight: 1.7, margin: 0,
                padding: '12px 16px', borderRadius: 8,
                background: '#f8fafc', border: `1px solid ${tokens.color.border}`,
                whiteSpace: 'pre-line',
              }}>
                {currentRow.visual}
              </p>
            </div>

            {/* Audio / Narration */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Music style={{ width: 14, height: 14, color: '#475569' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Audio / Narration</span>
              </div>
              <p style={{
                fontSize: 12, color: '#475569', lineHeight: 1.7, margin: 0,
                padding: '12px 16px', borderRadius: 8,
                background: '#f8fafc', border: `1px solid ${tokens.color.border}`,
                whiteSpace: 'pre-line',
              }}>
                {currentRow.audio}
              </p>
            </div>

            {/* Emotion / Note */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Heart style={{ width: 14, height: 14, color: '#475569' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Emotion / Note</span>
              </div>
              <p style={{
                fontSize: 12, color: '#475569', lineHeight: 1.7, margin: 0,
                padding: '12px 16px', borderRadius: 8,
                background: '#f8fafc', border: `1px solid ${tokens.color.border}`,
                whiteSpace: 'pre-line',
              }}>
                {currentRow.emotion}
              </p>
            </div>
          </div>

          {/* Saved Images */}
          <div style={{
            padding: '18px 20px', borderRadius: 12,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: '0 0 4px' }}>
              저장된 이미지 ({STEPS[activeStep - 1]?.label})
            </h4>
            <p style={{ fontSize: 11, color: tokens.color.textSubtle, margin: '0 0 12px' }}>
              최대 3개까지 저장 가능합니다.
            </p>
            {(savedImagesByStep[activeStep] || []).length === 0 ? (
              <div style={{
                padding: '30px 20px', borderRadius: 10,
                border: `2px dashed ${tokens.color.border}`,
                textAlign: 'center', color: tokens.color.textSubtle, fontSize: 12,
              }}>
                아직 저장된 이미지가 없습니다
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {savedImagesByStep[activeStep].map((img, i) => (
                  <div key={i} style={{
                    borderRadius: 10, overflow: 'hidden',
                    border: `1px solid ${tokens.color.border}`,
                    aspectRatio: '3/4',
                  }}>
                    <img src={img} alt={`saved-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Style Settings */}
          <div style={{
            padding: '18px 20px', borderRadius: 12,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: '0 0 12px' }}>
              스타일 설정하기
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {STYLE_OPTIONS.map((opt) => {
                const isActive = selectedStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedStyle(opt.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: isActive ? `2px solid ${ACCENT}` : `1px solid ${tokens.color.border}`,
                      background: isActive ? ACCENT_BG : '#fff',
                      color: isActive ? ACCENT : tokens.color.textSubtle,
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    {opt.value}
                  </button>
                );
              })}
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT, margin: '0 0 4px' }}>{selectedStyle}</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{styleInfo.desc}</p>
            </div>
          </div>

          {/* Image Attachments: Product + Model */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Product Image */}
            <div style={{
              padding: '16px', borderRadius: 12,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surface,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <ImageIcon style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
                  제품 이미지 첨부
                </h4>
              </div>
              <p style={{ fontSize: 10, color: tokens.color.textSubtle, margin: '0 0 10px' }}>
                제품 이미지를 참고하여 프롬프트를 생성합니다 (선택사항)
              </p>
              <div style={{
                padding: '24px 12px', borderRadius: 10,
                border: `2px dashed ${tokens.color.border}`,
                textAlign: 'center', cursor: 'pointer',
                transition: 'border-color .15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.color.border; }}
              >
                <Upload style={{ width: 22, height: 22, color: tokens.color.textSubtle, margin: '0 auto 6px' }} />
                <p style={{ fontSize: 11, fontWeight: 600, color: tokens.color.text, margin: '0 0 3px' }}>
                  클릭하여 이미지 업로드
                </p>
                <p style={{ fontSize: 9, color: tokens.color.textSubtle, margin: 0 }}>
                  PNG, JPG (최대 10MB)
                </p>
              </div>
            </div>

            {/* Model Image */}
            <div style={{
              padding: '16px', borderRadius: 12,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surface,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <User style={{ width: 14, height: 14, color: tokens.color.textSubtle }} />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
                  모델 이미지 첨부
                </h4>
              </div>
              <p style={{ fontSize: 10, color: tokens.color.textSubtle, margin: '0 0 10px' }}>
                모델 이미지를 참고하여 프롬프트를 생성합니다 (선택사항)
              </p>
              <div style={{
                padding: '24px 12px', borderRadius: 10,
                border: `2px dashed ${tokens.color.border}`,
                textAlign: 'center', cursor: 'pointer',
                transition: 'border-color .15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.color.border; }}
              >
                <Upload style={{ width: 22, height: 22, color: tokens.color.textSubtle, margin: '0 auto 6px' }} />
                <p style={{ fontSize: 11, fontWeight: 600, color: tokens.color.text, margin: '0 0 3px' }}>
                  클릭하여 이미지 업로드
                </p>
                <p style={{ fontSize: 9, color: tokens.color.textSubtle, margin: 0 }}>
                  PNG, JPG (최대 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* AI Prompt */}
          <div style={{
            padding: '18px 20px', borderRadius: 12,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
                AI 프롬프트 ({STEPS[activeStep - 1]?.label})
              </h4>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: ACCENT, color: '#fff', border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.7 : 1,
                }}
              >
                <Sparkles style={{ width: 12, height: 12 }} />
                AI 프롬프트 생성
              </button>
            </div>
            <p style={{ fontSize: 11, color: tokens.color.textSubtle, margin: '0 0 4px' }}>
              Gemini가 시나리오를 분석해 최적의 프롬프트를 생성합니다
            </p>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 10px' }}>
              원하는 대로 수정하거나, 결과가 아쉬우면 다시 생성해 보세요!
            </p>
            <textarea
              value={promptByStep[activeStep] || ''}
              onChange={(e) => setPromptByStep((prev) => ({ ...prev, [activeStep]: e.target.value }))}
              style={{
                width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 8,
                border: `1px solid ${tokens.color.border}`,
                fontSize: 12, lineHeight: 1.6, color: tokens.color.text,
                resize: 'vertical', fontFamily: 'monospace',
                background: '#fafafa',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <button
                onClick={handleRefreshPrompt}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `1px solid ${tokens.color.border}`, background: '#fff',
                  color: tokens.color.text, cursor: 'pointer',
                }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                새로고침
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: 'none',
                  background: `linear-gradient(135deg, ${ACCENT}, #a78bfa)`,
                  color: '#fff', cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.7 : 1,
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                {isGenerating ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>

          {/* Generated Images */}
          <div style={{
            padding: '18px 20px', borderRadius: 12,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
                생성된 이미지 ({STEPS[activeStep - 1]?.label})
              </h4>
              {generatedImages.length > 0 && (
                <button
                  onClick={() => generatedImages.forEach((img) => handleSaveImage(img))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer',
                  }}
                >
                  <Save style={{ width: 12, height: 12 }} />
                  저장하기
                </button>
              )}
            </div>
            {generatedImages.length === 0 ? (
              <div style={{
                padding: '40px 20px', borderRadius: 10,
                border: `2px dashed ${tokens.color.border}`,
                textAlign: 'center', color: tokens.color.textSubtle, fontSize: 12,
              }}>
                {isGenerating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, border: `3px solid ${ACCENT_BORDER}`,
                      borderTopColor: ACCENT, borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <span>이미지를 생성하고 있습니다...</span>
                  </div>
                ) : (
                  'AI 프롬프트를 작성하고 \'생성\' 버튼을 클릭하세요'
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {generatedImages.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => handleSaveImage(img)}
                    style={{
                      borderRadius: 10, overflow: 'hidden',
                      border: `2px solid ${(savedImagesByStep[activeStep] || []).includes(img) ? ACCENT : tokens.color.border}`,
                      aspectRatio: '3/4', cursor: 'pointer',
                      position: 'relative',
                      transition: 'border-color .15s',
                    }}
                  >
                    <img src={img} alt={`gen-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {(savedImagesByStep[activeStep] || []).includes(img) && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(124,58,237,.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button
          onClick={handleStartVideoGeneration}
          disabled={!imageSaved}
          title={!imageSaved ? '이미지 저장 후 영상 생성이 가능합니다' : ''}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: 'none',
            background: imageSaved ? 'linear-gradient(135deg, #2563eb, #0ea5e9)' : '#cbd5e1',
            color: '#fff', cursor: imageSaved ? 'pointer' : 'not-allowed',
            opacity: imageSaved ? 1 : 0.6,
            transition: 'all .3s',
          }}
        >
          <Film style={{ width: 16, height: 16 }} />
          영상으로 제작하기
        </button>
        <button
          onClick={handleSaveToDB}
          disabled={isSaving}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: 'none',
            background: saveSuccess ? 'linear-gradient(135deg, #059669, #10b981)' : `linear-gradient(135deg, ${ACCENT}, #6366f1)`,
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
          {isSaving ? '저장 중...' : saveSuccess ? '저장 완료!' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
