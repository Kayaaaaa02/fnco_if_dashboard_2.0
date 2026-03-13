import { useState, useMemo } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useOutreach, useGenerateOutreach, useUpdateOutreach, useBulkSendOutreach, useBulkDeleteOutreach } from '@/hooks/useOutreach';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import OutreachCard from '@/components/outreach/OutreachCard.jsx';
import BriefEditor from '@/components/outreach/BriefEditor.jsx';
import BulkActionBar from '@/components/bulk/BulkActionBar.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import {
  Sparkles,
  Loader2,
  Mail,
  Send,
  Trash2,
  MessageCircle,
  HelpCircle,
  FileCheck,
  Package,
  Upload,
  ChevronRight,
  Users,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

/* ── 5-step Pipeline ── */
export const PIPELINE_STAGES = [
  { key: 'contact',    label: '컨택',      icon: MessageCircle, color: '#6366f1', bg: '#eef2ff', desc: '인플루언서에게 협업 제안' },
  { key: 'pending',    label: '진행여부',   icon: HelpCircle,    color: '#f59e0b', bg: '#fffbeb', desc: '응답 대기 및 진행 확인' },
  { key: 'contracted', label: '계약완료',   icon: FileCheck,     color: '#10b981', bg: '#ecfdf5', desc: '계약 체결 완료' },
  { key: 'shipped',    label: '제품 발송',  icon: Package,       color: '#0d9488', bg: '#f0fdfa', desc: '제품 발송 완료' },
  { key: 'uploaded',   label: '업로드 완료', icon: Upload,       color: '#8b5cf6', bg: '#f5f3ff', desc: '콘텐츠 업로드 완료' },
];

/* status 매핑 (기존 데이터 호환) */
function normalizeStatus(status) {
  const map = {
    draft: 'contact',
    sent: 'contact',
    responded: 'pending',
    contracted: 'contracted',
    completed: 'uploaded',
  };
  return map[status] || status || 'contact';
}

export default function Outreach() {
  const { id: campaignId } = useParams();
  const context = useOutletContext();
  const campaign = context?.campaign;
  const { data: outreachItems, isLoading } = useOutreach(campaignId);
  const generateOutreach = useGenerateOutreach();
  const updateOutreach = useUpdateOutreach();
  const bulkSend = useBulkSendOutreach();
  const bulkDelete = useBulkDeleteOutreach();

  const [editingOutreach, setEditingOutreach] = useState(null);
  const [activeStage, setActiveStage] = useState(null); // null = all

  const items = useMemo(() => {
    const raw = Array.isArray(outreachItems) ? outreachItems : [];
    return raw.map((item) => ({ ...item, pipeline_stage: normalizeStatus(item.status) }));
  }, [outreachItems]);

  const { selectedIds, isSelected, toggle, toggleAll, clearSelection, isAllSelected, selectedCount } =
    useBulkSelection(items, 'id');

  /* ── Stage counts ── */
  const stageCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach((s) => { counts[s.key] = 0; });
    items.forEach((item) => { counts[item.pipeline_stage] = (counts[item.pipeline_stage] || 0) + 1; });
    return counts;
  }, [items]);

  /* ── Filtered by active stage ── */
  const filteredItems = useMemo(() => {
    if (!activeStage) return items;
    return items.filter((item) => item.pipeline_stage === activeStage);
  }, [items, activeStage]);

  const handleGenerate = () => { generateOutreach.mutate(campaignId); };
  const handleBulkSend = () => {
    bulkSend.mutate({ campaignId, outreachIds: [...selectedIds] }, { onSuccess: clearSelection });
  };
  const handleBulkDelete = () => {
    bulkDelete.mutate({ campaignId, outreachIds: [...selectedIds] }, { onSuccess: clearSelection });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${tokens.color.border}`, borderBottomColor: tokens.color.primary }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>

      {/* ══════════ Header ══════════ */}
      <div style={{
        borderRadius: 14, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, boxShadow: tokens.shadow.card,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 22px',
          background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ecfdf5 100%)',
          borderBottom: `1px solid ${tokens.color.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>인플루언서 소통</h2>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: '#e0e7ff', color: '#4338ca',
              }}>
                총 {items.length}명
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              컨택부터 콘텐츠 업로드까지 인플루언서 협업 파이프라인을 관리합니다
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={generateOutreach.isPending}
            style={{ borderRadius: 8, fontSize: 12, fontWeight: 600, height: 34 }}>
            {generateOutreach.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <Sparkles className="size-4" />}
            <span>브리프 자동 생성</span>
          </Button>
        </div>

        {/* ── Pipeline Progress Bar ── */}
        <div style={{ padding: '0px 0', display: 'flex', alignItems: 'stretch' }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const count = stageCounts[stage.key] || 0;
            const isActive = activeStage === stage.key;
            const Icon = stage.icon;
            return (
              <button
                key={stage.key}
                onClick={() => setActiveStage(isActive ? null : stage.key)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', cursor: 'pointer', border: 'none',
                  background: isActive ? stage.bg : 'transparent',
                  borderRight: idx < PIPELINE_STAGES.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                  transition: 'background .15s',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: stage.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon style={{ width: 16, height: 16, color: stage.color }} />
                </div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', margin: 0, whiteSpace: 'nowrap' }}>{stage.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: count > 0 ? stage.color : '#cbd5e1', margin: 0, lineHeight: 1.1 }}>{count}</p>
                </div>
                {/* Arrow connector */}
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight style={{
                    position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)',
                    width: 14, height: 14, color: tokens.color.border, zIndex: 1,
                    background: tokens.color.surface, borderRadius: 999,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════ Stepper Visual ══════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        padding: '8px 22px',
        borderRadius: 12, border: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
      }}>
        {PIPELINE_STAGES.map((stage, idx) => {
          const count = stageCounts[stage.key] || 0;
          const total = items.length || 1;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={stage.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: stage.color }}>{stage.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: stage.color,
                    width: `${pct}%`,
                    transition: 'width .4s ease',
                  }} />
                </div>
              </div>
              {idx < PIPELINE_STAGES.length - 1 && (
                <ChevronRight style={{ width: 14, height: 14, color: '#cbd5e1', flexShrink: 0, margin: '0 4px' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ══════════ Select All ══════════ */}
      {filteredItems.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
          <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} aria-label="전체 선택" />
          <span style={{ fontSize: 11, color: tokens.color.textSubtle }}>전체 선택</span>
          {activeStage && (
            <button
              onClick={() => setActiveStage(null)}
              style={{
                marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#6366f1',
                border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                textDecoration: 'underline',
              }}
            >
              전체 보기
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: tokens.color.textSubtle }}>
            {filteredItems.length}명
          </span>
        </div>
      )}

      {/* ══════════ Card List (grouped by stage) ══════════ */}
      {filteredItems.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '64px 0', color: tokens.color.textSubtle,
          borderRadius: 14, border: `2px dashed ${tokens.color.border}`,
        }}>
          <Users style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>아웃리치 항목이 없습니다</p>
          <p style={{ fontSize: 13, marginTop: 4, color: '#94a3b8' }}>
            브리프 자동 생성을 실행하여 인플루언서별 브리프를 만들어보세요
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(activeStage ? [PIPELINE_STAGES.find((s) => s.key === activeStage)] : PIPELINE_STAGES).map((stage) => {
            const stageItems = filteredItems.filter((item) => item.pipeline_stage === stage.key);
            if (stageItems.length === 0) return null;
            const Icon = stage.icon;
            const stageIdx = PIPELINE_STAGES.findIndex((s) => s.key === stage.key);
            const nextStage = stageIdx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[stageIdx + 1] : null;
            const NextIcon = nextStage?.icon;

            const handleBulkMoveNext = () => {
              stageItems.forEach((item) => {
                updateOutreach.mutate({
                  campaignId,
                  outreachId: item.id || item.outreach_id,
                  status: nextStage.key,
                });
              });
            };

            return (
              <div key={stage.key} style={{
                borderRadius: 14, border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface, overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}>
                {/* Stage Section Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 18px',
                  background: stage.bg + '80',
                  borderBottom: `1px solid ${tokens.color.border}`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: stage.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${stage.color}30`,
                  }}>
                    <Icon style={{ width: 13, height: 13, color: stage.color }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: stage.color }}>
                    {stage.label}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: stage.bg, color: stage.color,
                    border: `1px solid ${stage.color}30`,
                  }}>
                    {stageItems.length}명
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{stage.desc}</span>

                  {/* ── 다음단계 이동 버튼 (우측 끝) ── */}
                  <div style={{ marginLeft: 'auto' }}>
                    {nextStage ? (
                      <button
                        onClick={handleBulkMoveNext}
                        disabled={updateOutreach.isPending}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          height: 32, padding: '0 14px', borderRadius: 8,
                          border: `1.5px solid ${nextStage.color}50`,
                          background: '#fff',
                          fontSize: 12, fontWeight: 700, color: nextStage.color,
                          cursor: 'pointer',
                          opacity: updateOutreach.isPending ? 0.5 : 1,
                          transition: 'all .15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = nextStage.bg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                      >
                        다음단계 이동
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '1px 6px', borderRadius: 5,
                          background: nextStage.bg, fontSize: 10,
                        }}>
                          <NextIcon style={{ width: 10, height: 10 }} />
                          {nextStage.label}
                        </span>
                        <ChevronRight style={{ width: 14, height: 14 }} />
                      </button>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 600, color: '#10b981',
                        padding: '4px 12px', borderRadius: 8,
                        background: '#ecfdf5',
                      }}>
                        완료
                      </span>
                    )}
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {stageItems.map((item, idx) => (
                    <div key={item.id || item.outreach_id} style={{
                      borderBottom: idx < stageItems.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                    }}>
                      <OutreachCard
                        outreach={item}
                        campaignId={campaignId}
                        stageIndex={stageIdx}
                        onEdit={setEditingOutreach}
                        isSelected={isSelected(item.id || item.outreach_id)}
                        onToggleSelect={() => toggle(item.id || item.outreach_id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ Brief Editor Dialog ══════════ */}
      <Dialog
        open={!!editingOutreach}
        onOpenChange={(open) => { if (!open) setEditingOutreach(null); }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              브리프 편집 — {editingOutreach?.influencer_name || '인플루언서'}
            </DialogTitle>
          </DialogHeader>
          {editingOutreach && (
            <BriefEditor
              outreach={editingOutreach}
              campaignId={campaignId}
              brandDna={campaign?.brand_dna}
              onClose={() => setEditingOutreach(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════ Bulk Action Bar ══════════ */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        actions={[
          { label: '일괄 발송', icon: <Send className="size-3.5" />, onClick: handleBulkSend, disabled: bulkSend.isPending },
          { label: '일괄 삭제', icon: <Trash2 className="size-3.5" />, onClick: handleBulkDelete, variant: 'destructive', disabled: bulkDelete.isPending },
        ]}
      />
    </div>
  );
}
