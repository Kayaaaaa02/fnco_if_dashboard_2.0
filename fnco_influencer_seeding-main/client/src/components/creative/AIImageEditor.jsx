import { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, SkipForward, ArrowLeft, ArrowRight, Upload, RefreshCw, Save, AlertTriangle, Eye, Music, Heart, Image as ImageIcon, User, Film, Play, CheckCircle2, Loader2, Mic, Volume2, X } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';
import { useGenerateNarration } from '@/hooks/useTypecast.js';
import { useGeneratePrompt, useGenerateImages, useSaveImage, useAIImages } from '@/hooks/useAIImage.js';
import { useGenerateVideo, useGenerateStep, useMergeVideo, useVideoStatus } from '@/hooks/useVideo.js';

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

const VOICE_GENDER = [
  { value: 'female', label: '여자' },
  { value: 'male', label: '남자' },
];
const VOICE_TONE = [
  { value: 'bright', label: '밝은' },
  { value: 'calm', label: '차분한' },
];
const EMOTION_PRESETS = [
  { value: 'normal', label: 'Normal', color: '#6b7280' },
  { value: 'happy', label: 'Happy', color: '#f59e0b' },
  { value: 'sad', label: 'Sad', color: '#6366f1' },
  { value: 'angry', label: 'Angry', color: '#ef4444' },
  { value: 'whisper', label: 'Whisper', color: '#8b5cf6' },
  { value: 'toneup', label: 'Tone Up', color: '#10b981' },
  { value: 'tonedown', label: 'Tone Down', color: '#0ea5e9' },
];

/* ── Placeholder generated images ── */
const PLACEHOLDER_IMAGES = [
  '/ref-image-1.jfif',
  '/ref-image-1.jfif',
  '/ref-image-1.jfif',
  '/ref-image-1.jfif',
];

/* ── 시나리오 토글 컴포넌트 (영상 생성 화면용) ── */
function ScenarioToggle({ scenarioRows, steps }) {
  const [open, setOpen] = useState(false);
  if (!scenarioRows || scenarioRows.length === 0) return null;
  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface, marginBottom: 16, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', border: 'none', cursor: 'pointer',
          background: open ? '#f8f9fa' : tokens.color.surface, textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye style={{ width: 14, height: 14, color: ACCENT }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>시나리오 상세</span>
          <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>({scenarioRows.length} STEP)</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
          <path d="M3 5L7 9L11 5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scenarioRows.map((row, i) => (
            <div key={i} style={{
              borderRadius: 10, border: `1px solid ${tokens.color.border}`,
              overflow: 'hidden', background: '#fff',
            }}>
              <div style={{
                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #7c3aed10, #6366f110)',
                borderBottom: `1px solid ${tokens.color.border}`,
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: ACCENT, padding: '2px 10px', borderRadius: 6 }}>
                  {row.section}
                </span>
                <span style={{ fontSize: 10, color: '#64748b' }}>{row.time}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                <div style={{ padding: '10px 12px', borderRight: `1px solid ${tokens.color.border}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>Visual / Action</p>
                  <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>{row.visual}</p>
                </div>
                <div style={{ padding: '10px 12px', borderRight: `1px solid ${tokens.color.border}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>Audio / Narration</p>
                  <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>{row.audio}</p>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>Emotion / Note</p>
                  <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>{row.emotion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 영상 생성 진행률 패널 (경과 시간 기반) ── */
function VideoProgressPanel({ videoState, videoByStep = {}, steps = [] }) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // STEP별 실제 진행률 계산
  const totalSteps = steps.length || 4;
  const doneSteps = steps.filter((s) => {
    const st = videoByStep[s.key]?.status;
    return st === 'done' || st === 'approved';
  }).length;
  const generatingSteps = steps.filter((s) => videoByStep[s.key]?.status === 'generating').length;

  // 완료 STEP 100% + 생성중 STEP 50% 가중치
  const stepPercent = Math.round(((doneSteps + generatingSteps * 0.5) / totalSteps) * 100);
  const percent = Math.min(stepPercent, 99);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // 현재 상태 메시지
  let stage, stageDetail;
  if (doneSteps === totalSteps) {
    stage = '모든 STEP 영상 생성 완료!';
    stageDetail = '잠시 후 결과 화면으로 이동합니다.';
  } else if (generatingSteps > 0) {
    stage = `STEP 영상 렌더링 중 (${doneSteps}/${totalSteps} 완료)`;
    stageDetail = `${generatingSteps}개 STEP이 AI 서버에서 렌더링 중입니다.`;
  } else {
    stage = 'AI 영상 생성 요청 중';
    stageDetail = 'STEP별 이미지를 AI 서버에 전송합니다.';
  }

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${ACCENT_BORDER}`,
      background: '#f8fafc', padding: '40px', marginBottom: 16,
    }}>
      {/* 아이콘 + 제목 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 style={{ width: 32, height: 32, color: '#fff', animation: 'spin 1.5s linear infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>{stage}</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{stageDetail}</p>
        </div>
      </div>

      {/* 진행률 바 */}
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>{percent}%</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeStr} 경과</span>
        </div>
        <div style={{ width: '100%', height: 10, borderRadius: 5, background: '#e2e8f0', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 5,
            background: 'linear-gradient(90deg, #2563eb, #0ea5e9)',
            width: `${percent}%`,
            transition: 'width 1s ease-out',
          }} />
        </div>

        {/* STEP별 진행 상태 표시 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          {steps.map((s) => {
            const st = videoByStep[s.key]?.status;
            const isDone = st === 'done' || st === 'approved';
            const isGen = st === 'generating';
            return (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isDone ? '#059669' : isGen ? '#2563eb' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .3s',
                }}>
                  {isDone ? (
                    <CheckCircle2 style={{ width: 16, height: 16, color: '#fff' }} />
                  ) : isGen ? (
                    <Loader2 style={{ width: 14, height: 14, color: '#fff', animation: 'spin 1.5s linear infinite' }} />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{s.key}</span>
                  )}
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: isDone ? '#059669' : isGen ? '#2563eb' : '#94a3b8' }}>
                  {isDone ? '완료' : isGen ? '생성중' : '대기'}
                </span>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', margin: '12px 0 0', textAlign: 'center' }}>
          STEP당 약 2~4분 소요 (AI Image-to-Video)
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AIImageEditor({ creative, campaign, onBack, onPrev, onNext, onSave, initialView }) {
  const guide = creative?.production_guide || {};
  const [activeStep, setActiveStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState(guide.selected_style || '친근함');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imageSaved, setImageSaved] = useState(false);
  const [promptByStep, setPromptByStep] = useState(() => {
    // production_guide에 저장된 프롬프트가 있으면 복원
    if (guide.prompts && Object.keys(guide.prompts).length > 0) {
      return guide.prompts;
    }
    const obj = {};
    DEFAULT_STEPS.forEach((s) => { obj[s.key] = generateDefaultPrompt(creative, s.key); });
    return obj;
  });
  const [savedImagesByStep, setSavedImagesByStep] = useState(() => {
    // production_guide에 저장된 이미지가 있으면 복원
    if (guide.saved_images && Object.keys(guide.saved_images).length > 0) {
      return guide.saved_images;
    }
    const init = {};
    const imgs = creative?.ai_images || [];
    imgs.forEach((img) => {
      if (img.is_selected && img.url) {
        const step = img.step || 1;
        if (!init[step]) init[step] = [];
        if (init[step].length < 3) init[step].push(img.url);
      }
    });
    return init;
  });
  const [generatedImagesByStep, setGeneratedImagesByStep] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const generatedImages = generatedImagesByStep[activeStep] || [];
  const setGeneratedImages = (imgs) => setGeneratedImagesByStep((prev) => ({ ...prev, [activeStep]: imgs }));
  // 영상 생성 관련 상태: 'idle' | 'generating' | 'polling' | 'done'
  const [videoState, setVideoState] = useState(initialView === 'video' ? 'done' : 'idle');
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [klingTaskId, setKlingTaskId] = useState(null);
  // 나레이션 설정
  const [narrationByStep, setNarrationByStep] = useState({});
  const [voiceGender, setVoiceGender] = useState('female');
  const [voiceTone, setVoiceTone] = useState('bright');
  // STEP별 나레이션 생성 상태: { [stepKey]: 'idle' | 'generating' | 'done' }
  const [narrationGenState, setNarrationGenState] = useState({});
  // STEP별 생성된 오디오 URL
  const [audioByStep, setAudioByStep] = useState({});
  // STEP별 감정 프리셋
  const [emotionByStep, setEmotionByStep] = useState({});
  const getEmotion = (stepKey) => emotionByStep[stepKey] || 'normal';
  // STEP별 자막 텍스트
  const [subtitleByStep, setSubtitleByStep] = useState({});

  // 제품 이미지 첨부 상태
  const [productImageFiles, setProductImageFiles] = useState([]);
  const [modelImageFiles, setModelImageFiles] = useState([]);
  const productInputRef = useRef(null);
  const modelInputRef = useRef(null);
  // 프롬프트/이미지 생성 에러 메시지
  const [genError, setGenError] = useState(null);

  // plan_doc_id: 서버에 이미지 저장/조회 시 사용하는 키
  const planDocId = creative?.creative_id || '';
  const { data: dbImages } = useAIImages(planDocId);

  // DB에서 불러온 이미지로 STEP별 생성 이미지 + 저장 이미지 초기화
  const dbImagesLoaded = useRef(false);
  useEffect(() => {
    if (!dbImages?.data || dbImagesLoaded.current) return;
    dbImagesLoaded.current = true;
    const byStep = dbImages.data; // { 1: [{url, is_selected}], 2: [...], ... }
    const genInit = {};
    const savedInit = {};
    Object.entries(byStep).forEach(([step, imgs]) => {
      const stepNum = Number(step);
      if (!Array.isArray(imgs) || imgs.length === 0) return;
      genInit[stepNum] = imgs.map((img) => img.url);
      const selected = imgs.filter((img) => img.is_selected).map((img) => img.url);
      if (selected.length > 0) savedInit[stepNum] = selected;
    });
    setGeneratedImagesByStep((prev) => {
      const merged = { ...prev };
      Object.entries(genInit).forEach(([step, urls]) => {
        if (!merged[step] || merged[step].length === 0) merged[step] = urls;
      });
      return merged;
    });
    setSavedImagesByStep((prev) => {
      const merged = { ...prev };
      Object.entries(savedInit).forEach(([step, urls]) => {
        if (!merged[step] || merged[step].length === 0) merged[step] = urls;
      });
      return merged;
    });
  }, [dbImages]);

  // STEP별 영상 관리: { [stepKey]: { url, status: 'idle'|'generating'|'done'|'approved', error? } }
  const [videoByStep, setVideoByStep] = useState({});
  // 최종 합성 상태
  const [mergeState, setMergeState] = useState('idle'); // idle | merging | done

  const tts = useGenerateNarration();
  const promptMutation = useGeneratePrompt();
  const imageMutation = useGenerateImages();
  const saveImageMutation = useSaveImage();
  const videoMutation = useGenerateVideo();
  const stepVideoMutation = useGenerateStep();
  const mergeMutation = useMergeVideo();

  // Kling 영상 생성 상태 폴링 (polling / generating 상태일 때만)
  const isPolling = videoState === 'polling' || videoState === 'generating';
  const klingStatus = useVideoStatus(klingTaskId, isPolling && !!klingTaskId);

  useEffect(() => {
    if (!klingStatus.data) return;
    const { status, video_url } = klingStatus.data;
    if (status === 'succeed' && video_url) {
      setVideoUrl(video_url);
      setVideoState('done');
      setKlingTaskId(null);
    } else if (status === 'failed') {
      setVideoError(`Kling 영상 생성 실패: ${klingStatus.data.message || '알 수 없는 오류'}`);
      setVideoState('idle');
      setKlingTaskId(null);
    }
  }, [klingStatus.data]);

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

  // 나레이션 초기값을 시나리오 audio에서 가져오기
  const getNarration = (stepKey) => narrationByStep[stepKey] ?? (scenarioRows[stepKey - 1]?.audio || '');

  // 나레이션 텍스트에서 자막용 순수 텍스트 자동 추출
  const extractSubtitle = (text) => {
    if (!text) return '';
    const narMatches = text.match(/\(NAR\)\s*[""]([^""]+)[""]/g);
    if (narMatches && narMatches.length > 0) {
      return narMatches.map((m) => m.replace(/\(NAR\)\s*[""]/, '').replace(/[""]$/, '').trim()).join(' ');
    }
    return text.replace(/\(Effect\)[^+\n]*/gi, '').replace(/\(NAR\)\s*/gi, '').replace(/["""]/g, '').replace(/\+/g, '').trim();
  };

  // 자막 getter: 사용자 수정값 > 나레이션 자동 추출
  const getSubtitle = (stepKey) => subtitleByStep[stepKey] ?? extractSubtitle(getNarration(stepKey));

  // STEP별 나레이션 Typecast TTS 생성 + 자동 저장
  // STEP별 나레이션 Typecast TTS 생성
  const handleGenerateNarration = (stepKey) => {
    const text = getNarration(stepKey);
    if (!text || text.trim().length === 0) {
      alert('나레이션 텍스트를 입력해주세요.');
      return;
    }

    setNarrationGenState((prev) => ({ ...prev, [stepKey]: 'generating' }));

    tts.mutate(
      { text, gender: voiceGender, tone: voiceTone, emotion: getEmotion(stepKey) },
      {
        onSuccess: (data) => {
          const url = data?.audio_url || data;
          setNarrationGenState((prev) => ({ ...prev, [stepKey]: 'done' }));
          if (url) {
            setAudioByStep((prev) => ({ ...prev, [stepKey]: url }));
          }
          // 자동 저장
          if (onSave) {
            onSave({
              ai_editor_data: {
                saved_images: savedImagesByStep,
                selected_style: selectedStyle,
                prompts: promptByStep,
                video_generated: videoState === 'done',
                narrations: Object.fromEntries(STEPS.map((s) => [s.key, getNarration(s.key)])),
                emotions: Object.fromEntries(STEPS.map((s) => [s.key, getEmotion(s.key)])),
                voice: { gender: voiceGender, tone: voiceTone },
                audio_urls: { ...audioByStep, [stepKey]: url },
              },
            }).catch(() => {});
          }
        },
        onError: (err) => {
          console.error('[TTS] 나레이션 생성 실패:', err);
          setNarrationGenState((prev) => ({ ...prev, [stepKey]: 'error' }));
          setTimeout(() => {
            setNarrationGenState((prev) => ({ ...prev, [stepKey]: 'idle' }));
          }, 3000);
        },
      },
    );
  };

  // 오디오 재생
  const handlePlayAudio = (stepKey) => {
    const url = audioByStep[stepKey];
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch((e) => console.error('[Audio] 재생 실패:', e));
  };

  const productCategory = campaign?.category || creative?.category || '선케어';
  const productSubcategory = campaign?.subcategory || creative?.subcategory || '선스틱';
  const productName = campaign?.product_name || creative?.product_name || '바닐라코 UV 디펜스 워터프루프 선스틱';
  const scenarioTitle = creative?.production_guide?.scenarioTitle || creative?.concept_name || '1초 만에 완성되는 현실판 피부 보정 필터, 바닐라코 선스틱';
  const format = creative?.format || '15s Reels';
  const runtime = format.includes('15s') ? '15초 (Shorts/Reels 최적화)' : format.includes('30s') ? '30초 (YouTube/Reels)' : format;

  // AI 프롬프트 생성 (FastAPI 연동)
  const handleGeneratePrompt = () => {
    setGenError(null);
    const stepData = scenarioRows[activeStep - 1] || {};
    const stepLabels = { 1: 'Hook', 2: 'Middle', 3: 'Highlight', 4: 'CTA' };

    promptMutation.mutate(
      {
        product: {
          category: productCategory,
          subcategory: productSubcategory,
          product_name: productName,
        },
        step: {
          step_number: activeStep,
          step_label: `STEP ${activeStep} ${stepLabels[activeStep] || ''}`,
          visual_action: stepData.visual || '',
          audio_narration: stepData.audio || '',
          emotion_note: stepData.emotion || '',
        },
        style: selectedStyle,
        productImages: productImageFiles,
        modelImages: modelImageFiles,
      },
      {
        onSuccess: (data) => {
          if (data?.prompt != null) {
            setPromptByStep((prev) => ({ ...prev, [activeStep]: String(data.prompt) }));
          }
        },
        onError: (err) => {
          console.error('[AI 프롬프트 생성]', err);
          setGenError(`프롬프트 생성 실패: ${err.message}`);
        },
      },
    );
  };

  // AI 이미지 생성 (FastAPI → Imagen 연동)
  const handleGenerate = () => {
    const currentPrompt = promptByStep[activeStep];
    if (!currentPrompt || !currentPrompt.trim()) {
      setGenError('프롬프트를 먼저 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setGenError(null);

    imageMutation.mutate(
      {
        prompt: currentPrompt.trim(),
        step_number: activeStep,
        num_images: 4,
        plan_doc_id: planDocId,
        productImages: productImageFiles,
        modelImages: modelImageFiles,
      },
      {
        onSuccess: (data) => {
          const rawImages = data?.images ?? [];
          if (rawImages.length > 0) {
            const urls = rawImages.map((img) => img.url || img);
            setGeneratedImages(urls);
            // 자동으로 production_guide에도 저장
            if (onSave) {
              onSave({
                ai_editor_data: {
                  saved_images: { ...savedImagesByStep, [activeStep]: urls.slice(0, 3) },
                  selected_style: selectedStyle,
                  prompts: promptByStep,
                },
              }).catch(() => {});
            }
          } else {
            setGenError('이미지가 생성되지 않았습니다. 다시 시도해주세요.');
          }
          setIsGenerating(false);
        },
        onError: (err) => {
          console.error('[AI 이미지 생성]', err);
          setGenError(`이미지 생성 실패: ${err.message}`);
          setIsGenerating(false);
        },
      },
    );
  };

  const handleRefreshPrompt = () => {
    handleGeneratePrompt();
  };

  // STEP별 개별 I2V 생성
  const handleGenerateStepVideo = (stepKey) => {
    const imgUrl = (savedImagesByStep[stepKey] || [])[0]
      || (generatedImagesByStep[stepKey] || [])[0];
    if (!imgUrl) {
      setVideoError(`STEP ${stepKey}에 이미지가 없습니다.`);
      return;
    }
    const row = scenarioRows[stepKey - 1] || {};
    // Kling API는 5초 또는 10초만 허용
    const duration = 5;
    // 시나리오 기반 영상 모션 프롬프트
    const motionPrompt = `Smooth cinematic motion for a beauty product short-form video. Scene: ${row.visual || ''}. The camera moves naturally with subtle zoom. Photorealistic, high quality, 9:16 vertical.`;

    setVideoByStep((prev) => ({ ...prev, [stepKey]: { status: 'generating', url: null, error: null } }));

    stepVideoMutation.mutate(
      {
        image_url: imgUrl,
        prompt: motionPrompt,
        step: stepKey,
        plan_doc_id: creative?.creative_id || `plan_${Date.now()}`,
        duration,
      },
      {
        onSuccess: (data) => {
          setVideoByStep((prev) => ({ ...prev, [stepKey]: { status: 'done', url: data.video_url, error: null } }));
        },
        onError: (err) => {
          setVideoByStep((prev) => ({ ...prev, [stepKey]: { status: 'idle', url: null, error: err.message } }));
        },
      }
    );
  };

  // 모든 STEP 순차 생성 (Kling 동시 태스크 제한 방지)
  const videoQueueRef = useRef(false);
  const handleStartVideoGeneration = async () => {
    const stepsWithImages = STEPS.filter((s) =>
      (savedImagesByStep[s.key] || [])[0] || (generatedImagesByStep[s.key] || [])[0]
    );
    if (stepsWithImages.length === 0) {
      setVideoError('영상을 생성하려면 각 STEP에 이미지를 먼저 생성/선택해주세요.');
      return;
    }
    if (videoQueueRef.current) return;
    videoQueueRef.current = true;
    setVideoError(null);
    setVideoState('generating');

    for (const s of stepsWithImages) {
      const imgUrl = (savedImagesByStep[s.key] || [])[0] || (generatedImagesByStep[s.key] || [])[0];
      const row = scenarioRows[s.key - 1] || {};
      const motionPrompt = `Smooth cinematic motion for a beauty product short-form video. Scene: ${row.visual || ''}. The camera moves naturally with subtle zoom. Photorealistic, high quality, 9:16 vertical.`;

      setVideoByStep((prev) => ({ ...prev, [s.key]: { status: 'generating', url: null, error: null } }));

      // 최대 2회 시도 (1회 실패 시 30초 대기 후 재시도)
      let lastErr = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[Video] STEP ${s.key} 재시도 (${attempt + 1}/2) — 30초 대기`);
            await new Promise((r) => setTimeout(r, 30000));
          }
          const data = await stepVideoMutation.mutateAsync({
            image_url: imgUrl,
            prompt: motionPrompt,
            step: s.key,
            plan_doc_id: creative?.creative_id || `plan_${Date.now()}`,
            duration: 5,
          });
          setVideoByStep((prev) => ({ ...prev, [s.key]: { status: 'done', url: data.video_url, error: null } }));
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (lastErr) {
        setVideoByStep((prev) => ({ ...prev, [s.key]: { status: 'idle', url: null, error: `생성 실패 — ${lastErr.message}` } }));
      }
    }
    videoQueueRef.current = false;
  };

  // STEP 승인/해제
  const handleApproveStep = (stepKey) => {
    setVideoByStep((prev) => {
      const current = prev[stepKey];
      if (!current || current.status !== 'done') return prev;
      return { ...prev, [stepKey]: { ...current, status: 'approved' } };
    });
  };

  // 전체 승인 → 최종 합성 (나레이션 + concat)
  const handleMergeAll = () => {
    const approvedSteps = STEPS
      .filter((s) => videoByStep[s.key]?.status === 'approved' && videoByStep[s.key]?.url)
      .map((s) => ({
        video_url: videoByStep[s.key].url,
        audio_url: audioByStep[s.key] || null,
      }));

    if (approvedSteps.length === 0) {
      setVideoError('승인된 STEP 영상이 없습니다. STEP별 영상을 먼저 승인해주세요.');
      return;
    }

    setMergeState('merging');
    setVideoError(null);

    mergeMutation.mutate(
      { steps: approvedSteps, plan_doc_id: creative?.creative_id || `merge_${Date.now()}` },
      {
        onSuccess: (data) => {
          setVideoUrl(data.video_url);
          setVideoState('done');
          setMergeState('done');
        },
        onError: (err) => {
          setVideoError(`최종 합성 실패: ${err.message}`);
          setMergeState('idle');
        },
      }
    );
  };

  // 생성 중인 STEP이 있는지 / 모든 STEP이 완료+승인인지 체크
  const isAnyStepGenerating = STEPS.some((s) => videoByStep[s.key]?.status === 'generating');
  const allStepsApproved = STEPS.filter((s) =>
    (savedImagesByStep[s.key] || [])[0] || (generatedImagesByStep[s.key] || [])[0]
  ).every((s) => videoByStep[s.key]?.status === 'approved');

  // 순차 생성 완료 시 자동으로 ready로 전환
  useEffect(() => {
    if (videoState !== 'generating') return;
    // 순차 생성 큐가 아직 진행 중이면 대기
    if (videoQueueRef.current) return;
    // videoByStep에 generating인 STEP이 있으면 대기
    if (isAnyStepGenerating) return;
    const hasAnyDone = STEPS.some((s) => {
      const st = videoByStep[s.key]?.status;
      return st === 'done' || st === 'approved';
    });
    if (hasAnyDone) setVideoState('ready');
  }, [videoByStep, videoState, isAnyStepGenerating]);

  const handleSaveImage = (imgUrl) => {
    setSavedImagesByStep((prev) => {
      const current = prev[activeStep] || [];
      if (current.length >= 3) return prev;
      if (current.includes(imgUrl)) return prev;
      const updated = { ...prev, [activeStep]: [...current, imgUrl] };
      // DB에 is_selected 반영
      saveImageMutation.mutate({ planDocId, step: activeStep, imageUrl: imgUrl });
      // production_guide에도 자동 저장
      if (onSave) {
        onSave({
          ai_editor_data: {
            saved_images: updated,
            selected_style: selectedStyle,
            prompts: promptByStep,
          },
        }).catch(() => {});
      }
      return updated;
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
          video_url: videoUrl || null,
          narrations: Object.fromEntries(STEPS.map((s) => [s.key, getNarration(s.key)])),
          emotions: Object.fromEntries(STEPS.map((s) => [s.key, getEmotion(s.key)])),
          voice: { gender: voiceGender, tone: voiceTone },
          audio_urls: audioByStep,
          subtitles: Object.fromEntries(STEPS.map((s) => [s.key, getSubtitle(s.key)])),
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

  /* ── AI 통합 영상 생성 페이지 ── */
  if (videoState !== 'idle') {
    const allStepImages = STEPS.map((s) => (savedImagesByStep[s.key] || [])[0] || (generatedImagesByStep[s.key] || [])[0]).filter(Boolean);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderRadius: 14,
          background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
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
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>AI 영상 + 나레이션 생성</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', margin: '2px 0 0' }}>
                AI 이미지와 시나리오를 기반으로 나레이션 포함 통영상을 생성합니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => setVideoState('idle')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            이미지 편집으로
          </button>
        </div>

        {/* Scenario Info Bar */}
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

        {/* 시나리오 상세 (토글) */}
        <ScenarioToggle scenarioRows={scenarioRows} steps={STEPS} />

        {/* STEP별 참고 이미지 요약 */}
        <div style={{
          padding: '18px 20px', borderRadius: 12,
          border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ImageIcon style={{ width: 14, height: 14, color: ACCENT }} />
            <h4 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>STEP별 참고 이미지</h4>
            {allStepImages.length === 0 && (
              <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>이미지를 먼저 생성해주세요</span>
            )}
          </div>
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

        {/* 목소리 설정 + STEP별 나레이션 */}
        <div style={{
          padding: '18px 20px', borderRadius: 12,
          border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mic style={{ width: 14, height: 14, color: ACCENT }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: tokens.color.text, margin: 0 }}>나레이션 설정</h4>
            </div>
          </div>

          {/* 성별 + 톤 선택 (공통) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
            padding: '12px 16px', borderRadius: 10,
            background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text }}>성별</span>
              {VOICE_GENDER.map((g) => (
                <button key={g.value} type="button" onClick={() => setVoiceGender(g.value)} style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: voiceGender === g.value ? `2px solid ${ACCENT}` : `1px solid ${tokens.color.border}`,
                  background: voiceGender === g.value ? '#fff' : '#f8fafc',
                  color: voiceGender === g.value ? ACCENT : tokens.color.textSubtle,
                  cursor: 'pointer',
                }}>{g.label}</button>
              ))}
            </div>
            <div style={{ width: 1, height: 24, background: ACCENT_BORDER }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: tokens.color.text }}>톤</span>
              {VOICE_TONE.map((t) => (
                <button key={t.value} type="button" onClick={() => setVoiceTone(t.value)} style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: voiceTone === t.value ? `2px solid ${ACCENT}` : `1px solid ${tokens.color.border}`,
                  background: voiceTone === t.value ? '#fff' : '#f8fafc',
                  color: voiceTone === t.value ? ACCENT : tokens.color.textSubtle,
                  cursor: 'pointer',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* STEP별 나레이션 + 감정 프리셋 */}
          {STEPS.map((step) => {
            const genState = narrationGenState[step.key] || 'idle';
            const currentEmotion = getEmotion(step.key);
            return (
              <div key={step.key} style={{
                padding: '12px 14px', borderRadius: 8,
                border: `1px solid ${tokens.color.border}`,
                background: '#fafafa', marginBottom: step.key < STEPS.length ? 8 : 0,
              }}>
                {/* 상단: STEP 라벨 + 텍스트 + 생성 버튼 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 5,
                    background: ACCENT, color: '#fff', whiteSpace: 'nowrap', marginTop: 4,
                  }}>{step.label}</span>
                  <textarea
                    value={getNarration(step.key)}
                    onChange={(e) => setNarrationByStep((prev) => ({ ...prev, [step.key]: e.target.value }))}
                    placeholder="나레이션 내용..."
                    rows={2}
                    style={{
                      flex: 1, padding: '6px 10px', borderRadius: 6,
                      border: `1px solid ${tokens.color.border}`,
                      fontSize: 12, lineHeight: 1.5, color: tokens.color.text,
                      resize: 'vertical', background: '#fff',
                    }}
                  />
                  {(genState === 'done' || genState === 'saved') && audioByStep[step.key] ? (
                    genState === 'saved' ? (
                      /* 저장 완료: 저장완료 + 재생만 */
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                          disabled
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            border: 'none', whiteSpace: 'nowrap',
                            background: '#059669', color: '#fff', cursor: 'default',
                          }}
                        >
                          <CheckCircle2 style={{ width: 10, height: 10 }} /> 저장완료
                        </button>
                        <button
                          onClick={() => handlePlayAudio(step.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            border: 'none', whiteSpace: 'nowrap',
                            background: '#2563eb', color: '#fff', cursor: 'pointer',
                          }}
                        >
                          <Play style={{ width: 10, height: 10 }} /> 재생
                        </button>
                      </div>
                    ) : (
                      /* 생성 완료: 재생성 + 재생 + 저장 */
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                          onClick={() => handleGenerateNarration(step.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            border: `1px solid ${tokens.color.border}`, whiteSpace: 'nowrap',
                            background: '#fff', color: tokens.color.text, cursor: 'pointer',
                          }}
                        >
                          <RefreshCw style={{ width: 10, height: 10 }} /> 재생성
                        </button>
                        <button
                          onClick={() => handlePlayAudio(step.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            border: 'none', whiteSpace: 'nowrap',
                            background: '#2563eb', color: '#fff', cursor: 'pointer',
                          }}
                        >
                          <Play style={{ width: 10, height: 10 }} /> 재생
                        </button>
                        <button
                          onClick={() => {
                            if (onSave) {
                              onSave({
                                ai_editor_data: {
                                  saved_images: savedImagesByStep,
                                  selected_style: selectedStyle,
                                  prompts: promptByStep,
                                  narrations: Object.fromEntries(STEPS.map((s) => [s.key, getNarration(s.key)])),
                                  emotions: Object.fromEntries(STEPS.map((s) => [s.key, getEmotion(s.key)])),
                                  voice: { gender: voiceGender, tone: voiceTone },
                                  audio_urls: audioByStep,
                                },
                              }).then(() => {
                                setNarrationGenState((prev) => ({ ...prev, [step.key]: 'saved' }));
                              }).catch(() => {});
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            border: 'none', whiteSpace: 'nowrap',
                            background: '#10b981', color: '#fff', cursor: 'pointer',
                          }}
                        >
                          <Save style={{ width: 10, height: 10 }} /> 저장
                        </button>
                      </div>
                    )
                  ) : (
                    /* 생성 전/생성 중: 생성 버튼만 */
                    <button
                      onClick={() => handleGenerateNarration(step.key)}
                      disabled={genState === 'generating'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        border: 'none', whiteSpace: 'nowrap', marginTop: 4,
                        background: genState === 'error' ? '#ef4444'
                          : genState === 'generating' ? '#94a3b8'
                          : ACCENT,
                        color: '#fff', cursor: genState === 'generating' ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {genState === 'generating' ? (
                        <><Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> 생성중</>
                      ) : genState === 'error' ? (
                        <><AlertTriangle style={{ width: 12, height: 12 }} /> 실패 (재시도)</>
                      ) : (
                        <><Mic style={{ width: 12, height: 12 }} /> 나레이션 생성</>
                      )}
                    </button>
                  )}
                </div>
                {/* 하단: 감정 프리셋 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, paddingLeft: 60 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginRight: 2 }}>감정</span>
                  {EMOTION_PRESETS.map((preset) => {
                    const isActive = currentEmotion === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setEmotionByStep((prev) => ({ ...prev, [step.key]: preset.value }))}
                        style={{
                          padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                          border: isActive ? `2px solid ${preset.color}` : `1px solid ${tokens.color.border}`,
                          background: isActive ? `${preset.color}18` : '#fff',
                          color: isActive ? preset.color : '#94a3b8',
                          cursor: 'pointer', transition: 'all .12s',
                        }}
                      >{preset.label}</button>
                    );
                  })}
                </div>
                {/* 자막 입력 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8, paddingLeft: 60 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#0ea5e9',
                    padding: '4px 6px', borderRadius: 4,
                    background: '#f0f9ff', border: '1px solid #bae6fd',
                    whiteSpace: 'nowrap', marginTop: 2,
                  }}>자막</span>
                  <input
                    type="text"
                    value={getSubtitle(step.key)}
                    onChange={(e) => setSubtitleByStep((prev) => ({ ...prev, [step.key]: e.target.value }))}
                    placeholder="영상에 표시될 자막 (나레이션에서 자동 추출)"
                    style={{
                      flex: 1, padding: '5px 10px', borderRadius: 6,
                      border: `1px solid ${tokens.color.border}`,
                      fontSize: 11, color: tokens.color.text, background: '#fff',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 영상 생성 에러 */}
        {videoError && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 16,
            background: '#fef2f2', border: '1px solid #fecaca',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: '#dc2626', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#dc2626', flex: 1 }}>{videoError}</span>
            <button onClick={() => setVideoError(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626',
            }}><X style={{ width: 14, height: 14 }} /></button>
          </div>
        )}

        {/* 영상 생성 결과 / 생성 중 */}
        {(videoState === 'generating' || videoState === 'polling') && (
          <VideoProgressPanel videoState={videoState} videoByStep={videoByStep} steps={STEPS} />
        )}

        {/* STEP별 영상 미리보기 + 승인 */}
        {(videoState === 'ready' || videoState === 'done') && (
          <div style={{
            borderRadius: 14, border: `1px solid ${ACCENT_BORDER}`,
            background: '#fff', overflow: 'hidden', marginBottom: 16,
          }}>
            {/* 헤더 + 전체 생성 버튼 */}
            <div style={{
              padding: '14px 20px',
              background: videoState === 'done' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: videoState === 'done' ? '1px solid #6ee7b7' : '1px solid #93c5fd',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {videoState === 'done' ? <CheckCircle2 style={{ width: 20, height: 20, color: '#059669' }} /> : <Film style={{ width: 20, height: 20, color: '#2563eb' }} />}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: videoState === 'done' ? '#065f46' : '#1e40af', margin: 0 }}>
                    {videoState === 'done' ? '최종 영상 합성 완료!' : 'STEP별 영상 확인 및 승인'}
                  </p>
                  <p style={{ fontSize: 11, color: videoState === 'done' ? '#047857' : '#3b82f6', margin: '2px 0 0' }}>
                    {videoState === 'done' ? '나레이션이 포함된 최종 영상입니다.' : '전체 영상 생성 후 각 STEP을 확인하고 승인하세요.'}
                  </p>
                </div>
              </div>
              {videoState !== 'done' && (
                <button
                  onClick={handleStartVideoGeneration}
                  disabled={videoQueueRef.current || isAnyStepGenerating}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: 'none', whiteSpace: 'nowrap',
                    background: (videoQueueRef.current || isAnyStepGenerating) ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                    color: '#fff', cursor: (videoQueueRef.current || isAnyStepGenerating) ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Film style={{ width: 14, height: 14 }} />
                  {Object.values(videoByStep).some((v) => v.status === 'done' || v.status === 'approved') ? '전체 다시 생성' : '전체 영상 생성'}
                </button>
              )}
            </div>

            {/* 최종 합성 영상 (done 상태) */}
            {videoState === 'done' && videoUrl && (
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000', maxWidth: 270, aspectRatio: '9/16' }}>
                  <video src={videoUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            )}

            {/* STEP별 영상 카드 */}
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 12 }}>
              {STEPS.map((step) => {
                const sv = videoByStep[step.key] || {};
                const imgUrl = (savedImagesByStep[step.key] || [])[0] || (generatedImagesByStep[step.key] || [])[0];
                const isApproved = sv.status === 'approved';
                const isDone = sv.status === 'done';
                const isGen = sv.status === 'generating';
                return (
                  <div key={step.key} style={{
                    borderRadius: 10, border: `2px solid ${isApproved ? '#059669' : isDone ? '#2563eb' : tokens.color.border}`,
                    overflow: 'hidden', background: '#fff',
                  }}>
                    {/* 영상/이미지 미리보기 */}
                    <div style={{ aspectRatio: '9/16', background: '#000', position: 'relative', overflow: 'hidden' }}>
                      {sv.url ? (
                        <video src={sv.url} controls playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : imgUrl ? (
                        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isGen ? 0.4 : 0.7 }} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon style={{ width: 24, height: 24, color: '#475569' }} />
                        </div>
                      )}
                      {isGen && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.4)' }}>
                          <Loader2 style={{ width: 28, height: 28, color: '#fff', animation: 'spin 1.5s linear infinite' }} />
                        </div>
                      )}
                      {(isDone || isApproved) && (
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: isApproved ? '#059669' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 style={{ width: 14, height: 14, color: '#fff' }} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: ACCENT, color: '#fff' }}>
                        {step.label}
                      </div>
                    </div>

                    {/* 하단: 상태 + 재생성 버튼 */}
                    <div style={{ padding: '8px', display: 'flex', gap: 4 }}>
                      {isApproved ? (
                        <button disabled style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: 'none', background: '#d1fae5', color: '#059669', cursor: 'default' }}>
                          승인됨
                        </button>
                      ) : isDone ? (
                        <>
                          <button onClick={() => handleApproveStep(step.key)} style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer' }}>
                            승인
                          </button>
                          <button
                            onClick={() => handleGenerateStepVideo(step.key)}
                            disabled={isAnyStepGenerating}
                            style={{ padding: '6px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: `1px solid ${tokens.color.border}`, background: '#fff', color: tokens.color.text, cursor: isAnyStepGenerating ? 'not-allowed' : 'pointer', opacity: isAnyStepGenerating ? 0.5 : 1 }}
                          >
                            <RefreshCw style={{ width: 10, height: 10 }} />
                          </button>
                        </>
                      ) : isGen ? (
                        <button disabled style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: 'none', background: '#2563eb', color: '#fff', cursor: 'not-allowed' }}>
                          <Loader2 style={{ width: 10, height: 10, animation: 'spin 1s linear infinite', display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                          생성 중...
                        </button>
                      ) : (
                        <button disabled style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: 'none', background: '#f1f5f9', color: '#94a3b8', cursor: 'default' }}>
                          대기 중
                        </button>
                      )}
                    </div>
                    {sv.error && <p style={{ fontSize: 9, color: '#ef4444', padding: '0 8px 6px', margin: 0 }}>{sv.error}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={() => setVideoState('idle')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: `1px solid ${tokens.color.border}`,
              background: '#fff', color: tokens.color.text, cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            이미지 편집으로
          </button>
          {(videoState === 'generating' || videoState === 'polling') ? (
            <button disabled style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff', cursor: 'not-allowed', opacity: 0.85,
            }}>
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1.5s linear infinite' }} />
              영상 생성 진행 중...
            </button>
          ) : (
            <>
              {/* 전체 승인 → 최종 합성 */}
              {allStepsApproved && videoState !== 'done' && (
                <button
                  onClick={handleMergeAll}
                  disabled={mergeState === 'merging'}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    border: 'none',
                    background: mergeState === 'merging' ? '#94a3b8' : 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#fff', cursor: mergeState === 'merging' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {mergeState === 'merging' ? (
                    <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1.5s linear infinite' }} /> 최종 합성 중...</>
                  ) : (
                    <><Sparkles style={{ width: 16, height: 16 }} /> 나레이션 + 영상 최종 합성</>
                  )}
                </button>
              )}

              {/* 최종 합성 완료 후 */}
              {videoState === 'done' && (
                <>
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
                    }}
                  >
                    {isSaving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1.5s linear infinite' }} /> :
                      saveSuccess ? <CheckCircle2 style={{ width: 16, height: 16 }} /> :
                      <Save style={{ width: 16, height: 16 }} />}
                    {isSaving ? '저장 중...' : saveSuccess ? '저장 완료!' : '저장하기'}
                  </button>
                  <button
                    onClick={onNext}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                      border: 'none', background: '#1e293b', color: '#fff', cursor: 'pointer',
                    }}
                  >
                    <ArrowRight style={{ width: 16, height: 16 }} />
                    최종 편집하기
                  </button>
                </>
              )}
            </>
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
                    aspectRatio: '3/4', position: 'relative',
                  }}
                    onMouseEnter={(e) => { const btn = e.currentTarget.querySelector('.del-btn'); if (btn) btn.style.opacity = '1'; }}
                    onMouseLeave={(e) => { const btn = e.currentTarget.querySelector('.del-btn'); if (btn) btn.style.opacity = '0'; }}
                  >
                    <img src={img} alt={`saved-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      className="del-btn"
                      onClick={() => setSavedImagesByStep((prev) => ({
                        ...prev,
                        [activeStep]: (prev[activeStep] || []).filter((_, idx) => idx !== i),
                      }))}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(0,0,0,.6)', border: 'none',
                        color: '#fff', fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity .15s',
                      }}
                    ><X style={{ width: 12, height: 12 }} /></button>
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

          {/* Image Attachments: Product + Model + Reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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
                프롬프트 생성 시 참고 (선택)
              </p>
              <input
                ref={productInputRef}
                type="file"
                accept="image/png,image/jpeg"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 10 * 1024 * 1024) {
                    setProductImageFiles((prev) => [...prev, file]);
                  }
                  e.target.value = '';
                }}
              />
              {productImageFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {productImageFiles.map((file, i) => (
                    <div key={i} style={{
                      position: 'relative', width: 56, height: 56, borderRadius: 8, overflow: 'hidden',
                      border: `1px solid ${tokens.color.border}`,
                    }}>
                      <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => setProductImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{
                          position: 'absolute', top: 2, right: 2,
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'rgba(0,0,0,.5)', border: 'none',
                          color: '#fff', fontSize: 9, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      ><X style={{ width: 10, height: 10 }} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div
                onClick={() => productInputRef.current?.click()}
                style={{
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
                  클릭하여 업로드
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
                모델 이미지 참고용 (선택)
              </p>
              <input
                ref={modelInputRef}
                type="file"
                accept="image/png,image/jpeg"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 10 * 1024 * 1024) {
                    setModelImageFiles((prev) => [...prev, file]);
                  }
                  e.target.value = '';
                }}
              />
              {modelImageFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {modelImageFiles.map((file, i) => (
                    <div key={i} style={{
                      position: 'relative', width: 56, height: 56, borderRadius: 8, overflow: 'hidden',
                      border: `1px solid ${tokens.color.border}`,
                    }}>
                      <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => setModelImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{
                          position: 'absolute', top: 2, right: 2,
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'rgba(0,0,0,.5)', border: 'none',
                          color: '#fff', fontSize: 9, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      ><X style={{ width: 10, height: 10 }} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div
                onClick={() => modelInputRef.current?.click()}
                style={{
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
                  클릭하여 업로드
                </p>
                <p style={{ fontSize: 9, color: tokens.color.textSubtle, margin: 0 }}>
                  PNG, JPG (최대 10MB)
                </p>
              </div>
            </div>

            {/* Reference Image (upload + generated) */}
            <div style={{
              padding: '16px', borderRadius: 12,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surface,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles style={{ width: 14, height: 14, color: ACCENT }} />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
                  참고 이미지 첨부
                </h4>
              </div>
              <p style={{ fontSize: 10, color: tokens.color.textSubtle, margin: '0 0 10px' }}>
                직접 업로드 또는 생성된 이미지 클릭 (최대 3개)
              </p>
              {/* 등록된 참고 이미지 목록 */}
              {(savedImagesByStep[activeStep] || []).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
                  {(savedImagesByStep[activeStep] || []).map((img, i) => (
                    <div key={i} style={{
                      borderRadius: 8, overflow: 'hidden',
                      border: `2px solid ${ACCENT}`,
                      aspectRatio: '3/4', position: 'relative',
                    }}>
                      <img src={img} alt={`ref-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => setSavedImagesByStep((prev) => ({
                          ...prev,
                          [activeStep]: (prev[activeStep] || []).filter((_, idx) => idx !== i),
                        }))}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 18, height: 18, borderRadius: '50%',
                          background: 'rgba(0,0,0,.5)', border: 'none',
                          color: '#fff', fontSize: 10, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              {/* 업로드 영역 (3개 미만일 때) */}
              {(savedImagesByStep[activeStep] || []).length < 3 && (
                <div
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/png,image/jpeg,image/webp';
                    input.onchange = (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setSavedImagesByStep((prev) => {
                        const current = prev[activeStep] || [];
                        if (current.length >= 3) return prev;
                        return { ...prev, [activeStep]: [...current, url] };
                      });
                    };
                    input.click();
                  }}
                  style={{
                    padding: '16px 12px', borderRadius: 10,
                    border: `2px dashed ${ACCENT_BORDER}`,
                    textAlign: 'center', cursor: 'pointer',
                    background: ACCENT_BG,
                    transition: 'border-color .15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = ACCENT_BORDER; }}
                >
                  <Upload style={{ width: 18, height: 18, color: ACCENT, margin: '0 auto 4px', opacity: 0.6 }} />
                  <p style={{ fontSize: 10, fontWeight: 600, color: ACCENT, margin: '0 0 2px' }}>
                    클릭하여 업로드
                  </p>
                  <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>
                    또는 아래 생성된 이미지 클릭
                  </p>
                </div>
              )}
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
                onClick={handleGeneratePrompt}
                disabled={promptMutation.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: ACCENT, color: '#fff', border: 'none',
                  cursor: promptMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: promptMutation.isPending ? 0.7 : 1,
                }}
              >
                {promptMutation.isPending ? (
                  <><Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> 생성 중...</>
                ) : (
                  <><Sparkles style={{ width: 12, height: 12 }} /> AI 프롬프트 생성</>
                )}
              </button>
            </div>
            <p style={{ fontSize: 11, color: tokens.color.textSubtle, margin: '0 0 4px' }}>
              Gemini가 시나리오를 분석해 최적의 프롬프트를 생성합니다
            </p>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 10px' }}>
              원하는 대로 수정하거나, 결과가 아쉬우면 다시 생성해 보세요!
            </p>
            {genError && (
              <div style={{
                padding: '8px 12px', borderRadius: 6, marginBottom: 8,
                background: '#fef2f2', border: '1px solid #fecaca',
                fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0 }} />
                {genError}
                <button onClick={() => setGenError(null)} style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#dc2626', fontSize: 10,
                }}><X style={{ width: 12, height: 12 }} /></button>
              </div>
            )}
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
                disabled={promptMutation.isPending}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `1px solid ${tokens.color.border}`, background: '#fff',
                  color: tokens.color.text,
                  cursor: promptMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: promptMutation.isPending ? 0.7 : 1,
                }}
              >
                {promptMutation.isPending ? (
                  <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> 프롬프트 생성 중</>
                ) : (
                  <><RefreshCw style={{ width: 14, height: 14 }} /> 새로고침</>
                )}
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
                {isGenerating ? (
                  <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> 이미지 생성 중...</>
                ) : (
                  <><Sparkles style={{ width: 14, height: 14 }} /> 이미지 생성</>
                )}
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
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  클릭하면 참고 이미지로 추가됩니다
                </span>
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

      {/* Video error in main view */}
      {videoError && videoState === 'idle' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca',
        }}>
          <AlertTriangle style={{ width: 14, height: 14, color: '#dc2626', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#dc2626', flex: 1 }}>{videoError}</span>
          <button onClick={() => setVideoError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X style={{ width: 14, height: 14, color: '#dc2626' }} />
          </button>
        </div>
      )}

      {/* ── Bottom Navigation Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderRadius: 10,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
      }}>
        <button
          onClick={onPrev}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: `1px solid ${tokens.color.border}`, background: '#fff',
            color: tokens.color.text, cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          이전 단계
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setVideoState('ready')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff', cursor: 'pointer',
            }}
          >
            <Film style={{ width: 14, height: 14 }} />
            영상 생성 단계로 넘어가기
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
          <button
            onClick={onNext}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: `1px solid ${tokens.color.border}`,
              background: '#fff',
              color: tokens.color.textSubtle, cursor: 'pointer',
            }}
          >
            <SkipForward style={{ width: 14, height: 14 }} />
            영상생성 SKIP 하기
          </button>
        </div>
      </div>
    </div>
  );
}
