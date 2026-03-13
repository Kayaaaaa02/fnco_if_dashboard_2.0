/**
 * 영상 분석 패널
 * 영상 업로드 (드래그 앤 드롭) + 분석 결과 표시 (8개 섹션, Accordion)
 */
import { useState, useCallback, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, Film, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion.jsx';
import { useUploadVideo, useVideoAnalysis, useVideoAnalysisStatuses } from '@/hooks/useVideoAnalysis.js';
import { tokens } from '@/styles/designTokens.js';

/** 허용 확장자 및 최대 크기 */
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
const ACCEPTED_EXT = '.mp4, .mov, .avi, .wmv';
const MAX_SIZE_MB = 500;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/** 분석 결과 8개 섹션 정의 */
const ANALYSIS_SECTIONS = [
  { key: 'opening', title: '시작점 (첫 3초: 이탈률 방지)', icon: '1' },
  { key: 'ending', title: '엔딩 (결말)', icon: '2' },
  { key: 'essentials', title: '필수 요소 (반전 매력)', icon: '3' },
  { key: 'product_storytelling', title: '제품 노출 및 스토리텔링', icon: '4' },
  { key: 'platform_audio', title: '플랫폼 및 오디오 최적화', icon: '5' },
  { key: 'competition', title: '경쟁력 분석', icon: '6' },
  { key: 'conversion', title: '전환율 최적화', icon: '7' },
  { key: 'ab_test', title: 'A/B 테스트 제안', icon: '8' },
];

export default function VideoAnalysisPanel() {
  const [uploadedPostId, setUploadedPostId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const uploadVideo = useUploadVideo();
  const analysisStatuses = useVideoAnalysisStatuses(uploadedPostId ? [uploadedPostId] : []);
  const analysisResult = useVideoAnalysis(uploadedPostId);

  /** 파일 검증 */
  const validateFile = useCallback((file) => {
    if (!file) return '파일을 선택해주세요.';
    if (!ACCEPTED_TYPES.includes(file.type)) return `지원하지 않는 형식입니다. (${ACCEPTED_EXT})`;
    if (file.size > MAX_SIZE_BYTES) return `파일 크기가 ${MAX_SIZE_MB}MB를 초과합니다.`;
    return '';
  }, []);

  /** 파일 업로드 처리 */
  const handleFile = useCallback(
    (file) => {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }
      setFileError('');
      setFileName(file.name);

      const formData = new FormData();
      formData.append('video', file);

      uploadVideo.mutate(formData, {
        onSuccess: (data) => {
          const postId = data?.postId || data?.post_id || data?.id;
          if (postId) setUploadedPostId(postId);
        },
      });
    },
    [validateFile, uploadVideo],
  );

  /** 드래그 앤 드롭 핸들러 */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  /** 클릭 업로드 핸들러 */
  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  /** 분석 상태 계산 */
  const statusData = analysisStatuses.data;
  const currentStatus = statusData
    ? Array.isArray(statusData)
      ? statusData[0]
      : statusData
    : null;
  const isAnalyzing = currentStatus?.status === 'processing' || currentStatus?.status === 'pending';
  const isComplete = currentStatus?.status === 'completed' || analysisResult.data;

  /** 분석 결과 데이터 */
  const resultData = analysisResult.data;
  const sections = resultData?.sections || resultData?.analysis || resultData || {};

  return (
    <div className="space-y-6">
      {/* 업로드 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors"
        style={{
          borderColor: dragOver ? tokens.color.primary : tokens.color.border,
          background: dragOver ? tokens.color.primarySoft : tokens.color.surfaceMuted,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXT}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadVideo.isPending ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: tokens.color.primary }} />
            <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
              업로드 중... ({fileName})
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10" style={{ color: tokens.color.textSubtle }} />
            <div>
              <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                영상 파일을 드래그하거나 클릭하여 선택
              </p>
              <p className="mt-1 text-xs" style={{ color: tokens.color.textSubtle }}>
                MP4, MOV, AVI, WMV (최대 {MAX_SIZE_MB}MB)
              </p>
            </div>
          </div>
        )}

        {fileError && (
          <p className="mt-3 flex items-center justify-center gap-1 text-xs" style={{ color: tokens.color.danger }}>
            <AlertCircle className="h-3.5 w-3.5" />
            {fileError}
          </p>
        )}

        {uploadVideo.isError && (
          <p className="mt-3 text-xs" style={{ color: tokens.color.danger }}>
            업로드 실패: {uploadVideo.error?.message}
          </p>
        )}
      </div>

      {/* 업로드 완료 + 분석 진행 상태 */}
      {uploadedPostId && !isComplete && (
        <div
          className="flex items-center gap-3 rounded-xl border p-4"
          style={{ borderColor: tokens.color.border, background: tokens.color.surface }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: tokens.color.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                  영상 분석 진행 중...
                </p>
                <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                  AI가 영상을 분석하고 있습니다. 잠시 기다려주세요. (5초마다 갱신)
                </p>
              </div>
            </>
          ) : (
            <>
              <Film className="h-5 w-5" style={{ color: tokens.color.textSubtle }} />
              <div>
                <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                  업로드 완료 — {fileName}
                </p>
                <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                  분석 대기 중입니다.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 분석 완료 — 결과 표시 */}
      {isComplete && resultData && (
        <div className="space-y-4">
          <div
            className="flex items-center gap-2 rounded-xl border p-4"
            style={{ borderColor: tokens.color.border, background: tokens.color.successSoft }}
          >
            <CheckCircle2 className="h-5 w-5" style={{ color: tokens.color.success }} />
            <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
              분석 완료 — {fileName || '영상'}
            </p>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {ANALYSIS_SECTIONS.map((section) => {
              const sectionData = sections[section.key];
              if (!sectionData) return null;

              const content =
                typeof sectionData === 'string'
                  ? sectionData
                  : sectionData.content || sectionData.summary || JSON.stringify(sectionData, null, 2);

              return (
                <AccordionItem key={section.key} value={section.key} className="rounded-lg border px-4" style={{ borderColor: tokens.color.border }}>
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: tokens.color.primarySoft, color: tokens.color.primary }}
                      >
                        {section.icon}
                      </span>
                      {section.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: tokens.color.text }}>
                      {content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}

      {/* 분석 결과 없을 때 안내 */}
      {!uploadedPostId && (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: tokens.color.border, background: tokens.color.surface }}
        >
          <Film className="mx-auto h-12 w-12" style={{ color: tokens.color.textSubtle }} />
          <p className="mt-3 text-sm font-medium" style={{ color: tokens.color.text }}>
            영상을 업로드하면 AI 분석 결과가 여기에 표시됩니다.
          </p>
          <p className="mt-1 text-xs" style={{ color: tokens.color.textSubtle }}>
            8개 항목으로 콘텐츠 품질을 분석합니다.
          </p>
        </div>
      )}
    </div>
  );
}
