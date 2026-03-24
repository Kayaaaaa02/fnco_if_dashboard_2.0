import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useCreative, useUpdateCreative, useGenerateGuide } from '@/hooks/useCreatives';
import CopyEditor from '@/components/creative/CopyEditor.jsx';
import ProductionGuide from '@/components/creative/ProductionGuide.jsx';
import AIImageEditor from '@/components/creative/AIImageEditor.jsx';
import FinalReviewEditor from '@/components/creative/FinalReviewEditor.jsx';
import DiffViewer from '@/components/diff/DiffViewer.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.jsx';
import { ArrowLeft, Save, CheckCircle2, Loader2, GitCompare } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const STATUS_MAP = {
  draft: { label: '가이드 초안', className: 'bg-muted text-muted-foreground', color: '#6b7280', bg: '#f3f4f6' },
  ai_generated: { label: 'AI 이미지/영상 생성', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', color: '#2563eb', bg: '#dbeafe' },
  human_edited: { label: '최종 편집', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', color: '#d97706', bg: '#fef3c7' },
  approved: { label: '완료', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', color: '#059669', bg: '#d1fae5' },
};

const NEXT_LABEL = {
  draft: 'AI 이미지/영상 생성으로',
  ai_generated: '최종 편집으로',
  human_edited: '완료 처리',
  approved: '완료됨',
};

const FUNNEL_CFG = {
  TOFU: { label: 'TOFU', color: '#0284c7', bg: '#e0f2fe' },
  MOFU: { label: 'MOFU', color: '#7c3aed', bg: '#ede9fe' },
  BOFU: { label: 'BOFU', color: '#059669', bg: '#d1fae5' },
};

function generateMockPreviousCreative(current) {
  if (!current) return null;
  const prev = JSON.parse(JSON.stringify(current));
  prev.version = (prev.version || 1) - 1;
  prev.status = 'ai_generated';
  if (prev.copy_title) prev.copy_title = prev.copy_title + ' (초안)';
  if (prev.copy_body) prev.copy_body = prev.copy_body.slice(0, Math.max(20, prev.copy_body.length - 30)) + '...';
  if (prev.hashtags && Array.isArray(prev.hashtags) && prev.hashtags.length > 0) {
    prev.hashtags = prev.hashtags.slice(0, -1);
  }
  return prev;
}

export default function CreativeEditor() {
  const { id: campaignId, creativeId } = useParams();
  const navigate = useNavigate();
  const { data: creative, isLoading } = useCreative(campaignId, creativeId);
  const updateCreative = useUpdateCreative();
  const generateGuide = useGenerateGuide();

  const { campaign } = useOutletContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingChanges, setPendingChanges] = useState({});
  const [showDiff, setShowDiff] = useState(false);
  const [guideData, setGuideData] = useState(null);
  const autoGenerateTriggered = useRef(false);

  const handleGenerateGuide = useCallback(() => {
    if (!campaignId || !creativeId) return;
    generateGuide.mutate(
      { campaignId, creativeId },
      {
        onSuccess: (res) => {
          setGuideData(res.production_guide || res.data || res);
        },
      },
    );
  }, [campaignId, creativeId, generateGuide]);

  // autoGenerate 쿼리 파라미터가 있으면 자동으로 AI 가이드 생성 실행
  useEffect(() => {
    if (
      searchParams.get('autoGenerate') === 'true' &&
      !autoGenerateTriggered.current &&
      creative &&
      !creative.production_guide &&
      creative.status === 'draft'
    ) {
      autoGenerateTriggered.current = true;
      // URL에서 autoGenerate 파라미터 제거
      searchParams.delete('autoGenerate');
      setSearchParams(searchParams, { replace: true });
      handleGenerateGuide();
    }
  }, [searchParams, setSearchParams, creative, handleGenerateGuide]);

  const handleFieldUpdate = useCallback((fields) => {
    setPendingChanges((prev) => ({ ...prev, ...fields }));
  }, []);

  const handleSave = () => {
    if (!campaignId || !creativeId) return;
    const saveData = { ...pendingChanges };
    // 가이드가 생성되어 있으면 production_guide도 함께 저장
    if (guideData) {
      saveData.production_guide = guideData;
    }
    updateCreative.mutate(
      {
        campaignId,
        creativeId,
        ...saveData,
      },
      {
        onSuccess: () => {
          setPendingChanges({});
        },
      },
    );
  };

  const handleApprove = () => {
    if (!campaignId || !creativeId) return;
    const currentStatus = creative?.status || 'draft';
    // Determine next status in workflow: draft → ai_generated → human_edited → approved
    const nextStatusMap = {
      draft: 'ai_generated',
      ai_generated: 'human_edited',
      human_edited: 'approved',
      approved: 'approved',
    };
    const nextStatus = nextStatusMap[currentStatus] || 'ai_generated';
    const approveData = { ...pendingChanges, status: nextStatus };
    // 가이드가 생성되어 있으면 production_guide도 함께 저장
    if (guideData) {
      approveData.production_guide = guideData;
    }
    updateCreative.mutate(
      {
        campaignId,
        creativeId,
        ...approveData,
      },
      {
        onSuccess: () => {
          // Navigate back to creative list with the next tab active
          navigate(`/campaigns/${campaignId}/creative?tab=${nextStatus}`);
        },
      },
    );
    setPendingChanges({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!creative) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">크리에이티브를 찾을 수 없습니다</p>
      </div>
    );
  }

  const mergedCreative = { ...creative, ...pendingChanges };
  const status = STATUS_MAP[mergedCreative.status] || STATUS_MAP.draft;
  const funnel = FUNNEL_CFG[creative.funnel] || FUNNEL_CFG.TOFU;
  const hasPending = Object.keys(pendingChanges).length > 0;
  const hasGuide = !!(creative.production_guide || guideData);

  // AI 이미지/영상 생성 탭에서는 항상 AIImageEditor 표시
  const showAIImageEditor = creative.status === 'ai_generated';
  // 최종 편집 탭에서는 FinalReviewEditor 표시
  const showFinalReview = creative.status === 'human_edited';

  // AI Image Editor view
  if (showAIImageEditor) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => navigate(`/campaigns/${campaignId}/creative?tab=ai_generated`)}
          style={{ alignSelf: 'flex-start', marginBottom: 16 }}
        >
          <ArrowLeft className="size-4" />
          <span>목록으로 돌아가기</span>
        </Button>
        <AIImageEditor
          creative={mergedCreative}
          campaign={campaign}
          initialView={searchParams.get('view') || undefined}
          onBack={() => navigate(`/campaigns/${campaignId}/creative?tab=ai_generated`)}
          onPrev={() => {
            updateCreative.mutate(
              { campaignId, creativeId, status: 'draft' },
              { onSuccess: () => navigate(`/campaigns/${campaignId}/creative/${creativeId}`) },
            );
          }}
          onSave={(editorData) => {
            return new Promise((resolve, reject) => {
              const existingGuide = creative?.production_guide || {};
              updateCreative.mutate(
                {
                  campaignId,
                  creativeId,
                  production_guide: { ...existingGuide, ...editorData.ai_editor_data },
                },
                {
                  onSuccess: () => resolve(),
                  onError: (err) => reject(err),
                },
              );
            });
          }}
          onNext={() => {
            // 최종 편집하기: 현재 AI 에디터 데이터 저장 + 상태를 human_edited로 변경
            updateCreative.mutate(
              { campaignId, creativeId, status: 'human_edited' },
              { onSuccess: () => navigate(`/campaigns/${campaignId}/creative?tab=human_edited`) },
            );
          }}
        />
      </div>
    );
  }

  // Final Review Editor view (human_edited)
  if (showFinalReview) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => navigate(`/campaigns/${campaignId}/creative?tab=human_edited`)}
          style={{ alignSelf: 'flex-start', marginBottom: 16 }}
        >
          <ArrowLeft className="size-4" />
          <span>목록으로 돌아가기</span>
        </Button>
        <FinalReviewEditor
          creative={mergedCreative}
          campaign={campaign}
          onBack={() => {
            updateCreative.mutate(
              { campaignId, creativeId, status: 'ai_generated' },
              { onSuccess: () => navigate(`/campaigns/${campaignId}/creative/${creativeId}`) },
            );
          }}
          isSaving={updateCreative.isPending}
          onSave={(saveData) => {
            return new Promise((resolve, reject) => {
              updateCreative.mutate(
                { campaignId, creativeId, ...saveData },
                {
                  onSuccess: () => resolve(),
                  onError: (err) => reject(err),
                },
              );
            });
          }}
          onApprove={() => {
            updateCreative.mutate(
              { campaignId, creativeId, status: 'approved' },
              { onSuccess: () => navigate(`/campaigns/${campaignId}/creative?tab=approved`) },
            );
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 840, margin: '0 auto' }}>

      {/* ── Back button ── */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => navigate(`/campaigns/${campaignId}/creative`)}
        style={{ alignSelf: 'flex-start', marginBottom: 16 }}
      >
        <ArrowLeft className="size-4" />
        <span>크리에이티브 목록</span>
      </Button>

      {/* ── Header Card ── */}
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        marginBottom: 20,
      }}>
        {/* Top accent */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${funnel.color}, #6366f1)` }} />
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: tokens.color.text, margin: 0, lineHeight: 1.3 }}>
                {creative.concept_name || '제목 없음'}
              </h2>
              {creative.copy_text && (
                <p style={{ fontSize: 12, color: tokens.color.textSubtle, marginTop: 4, lineHeight: 1.5 }}>
                  {creative.copy_text.split('\n')[0]}
                </p>
              )}
            </div>
            {(creative.version || 1) > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50 shrink-0"
                onClick={() => setShowDiff(true)}
              >
                <GitCompare className="size-3" />
                버전 비교
              </Button>
            )}
          </div>
          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {creative.persona_code && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#7c3aed', color: '#fff' }}>{creative.persona_code}</span>}
            {creative.desire_code && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#d97706', color: '#fff' }}>{creative.desire_code}</span>}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: funnel.bg, color: funnel.color }}>{funnel.label}</span>
            {creative.format && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>{creative.format}</span>}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: status.bg, color: status.color }}>{status.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#f8fafc', color: '#94a3b8' }}>v{creative.version || 1}</span>
          </div>
        </div>
      </div>

      {/* ── Copy Editor Section ── */}
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        boxShadow: tokens.shadow.card,
        padding: '20px 24px',
        marginBottom: 20,
      }}>
        <CopyEditor creative={mergedCreative} onUpdate={handleFieldUpdate} />
      </div>

      {/* ── Production Guide (초안 컨셉 클릭 시 표시) ── */}
      <ProductionGuide
        creative={mergedCreative}
        guideData={guideData}
        isGenerating={generateGuide.isPending}
        onGenerate={handleGenerateGuide}
      />

      {/* ── Bottom Action Bar ── */}
      <div style={{
        borderRadius: 14,
        border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: tokens.shadow.card,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: status.bg, color: status.color }}>{status.label}</span>
          {hasPending && (
            <span style={{ fontSize: 11, color: '#d97706', fontWeight: 500 }}>
              저장되지 않은 변경사항이 있습니다
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={updateCreative.isPending || (!hasPending && !hasGuide)}
            style={{ borderRadius: 8, fontSize: 12, fontWeight: 600, gap: 4 }}
          >
            {updateCreative.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            저장
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={updateCreative.isPending || mergedCreative.status === 'approved'}
            style={{ borderRadius: 8, fontSize: 12, fontWeight: 700, gap: 4 }}
          >
            {updateCreative.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            {NEXT_LABEL[mergedCreative.status] || '승인'}
          </Button>
        </div>
      </div>

      {/* ── Version Diff Dialog ── */}
      {(creative.version || 1) > 1 && (
        <Dialog open={showDiff} onOpenChange={setShowDiff}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-blue-600" />
                크리에이티브 버전 비교
              </DialogTitle>
              <DialogDescription>
                v{(creative.version || 1) - 1}과 v{creative.version || 1} 사이의 변경사항입니다.
              </DialogDescription>
            </DialogHeader>
            <DiffViewer
              oldData={generateMockPreviousCreative(creative)}
              newData={creative}
              oldLabel={`v${(creative.version || 1) - 1}`}
              newLabel={`v${creative.version || 1}`}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
