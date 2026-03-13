import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { useUpdateOutreach } from '@/hooks/useOutreach';
import { PIPELINE_STAGES } from '@/components/outreach/Outreach.jsx';
import {
  Pencil,
  ChevronRight,
  ChevronLeft,
  Instagram,
  Youtube,
  MessageCircle,
  Calendar,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const PLATFORM_META = {
  instagram: { icon: Instagram, color: '#E4405F', bg: '#fdf2f4', label: 'Instagram' },
  youtube: { icon: Youtube, color: '#FF0000', bg: '#fef2f2', label: 'YouTube' },
  tiktok: { icon: MessageCircle, color: '#000000', bg: '#f5f5f5', label: 'TikTok' },
};

export default function OutreachCard({ outreach, campaignId, stageIndex, onEdit, isSelected: isBulkSelected, onToggleSelect }) {
  const updateOutreach = useUpdateOutreach();
  const [hovered, setHovered] = useState(false);

  const currentStage = PIPELINE_STAGES[stageIndex] || PIPELINE_STAGES[0];
  const prevStage = stageIndex > 0 ? PIPELINE_STAGES[stageIndex - 1] : null;
  const nextStage = stageIndex < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[stageIndex + 1] : null;

  const platform = PLATFORM_META[outreach.platform] || PLATFORM_META.instagram;
  const PlatformIcon = platform.icon;

  const handleMoveStage = (targetStageKey, e) => {
    e.stopPropagation();
    if (!campaignId) return;
    updateOutreach.mutate({
      campaignId,
      outreachId: outreach.id || outreach.outreach_id,
      status: targetStageKey,
    });
  };

  const deliverables = outreach.brief_content?.deliverables || [];
  const contractAmount = outreach.contract_amount;
  const sentAt = outreach.sent_at;

  return (
    <div
      style={{
        background: hovered ? currentStage.bg + '30' : tokens.color.surface,
        transition: 'background .15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Left accent bar */}
        <div style={{ width: 4, flexShrink: 0, background: currentStage.color }} />

        <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Checkbox */}
          {onToggleSelect && (
            <div style={{ flexShrink: 0 }}>
              <Checkbox
                checked={!!isBulkSelected}
                onCheckedChange={onToggleSelect}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
              background: '#f1f5f9', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${currentStage.color}30`,
            }}>
              {outreach.influencer_image ? (
                <img src={outreach.influencer_image} alt={outreach.influencer_name}
                  style={{ width: 44, height: 44, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>
                  {(outreach.influencer_name || '?').charAt(0)}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: tokens.color.text }}>
                {outreach.influencer_name || '인플루언서'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                  background: platform.bg, color: platform.color,
                }}>
                  <PlatformIcon style={{ width: 10, height: 10 }} />
                  {platform.label}
                </span>
                {outreach.followers && (
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    {Number(outreach.followers).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stage Badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: currentStage.bg, color: currentStage.color,
            flexShrink: 0,
          }}>
            {currentStage.label}
          </span>

          {/* Center Info */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Deliverables */}
            {deliverables.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {deliverables.slice(0, 3).map((d, idx) => (
                  <span key={idx} style={{
                    fontSize: 9, fontWeight: 600,
                    padding: '2px 7px', borderRadius: 6,
                    background: '#f1f5f9', color: '#475569',
                    border: `1px solid ${tokens.color.border}`,
                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {d}
                  </span>
                ))}
              </div>
            )}
            {/* Brief subject */}
            {outreach.brief_content?.subject && (
              <p style={{
                fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {outreach.brief_content.subject}
              </p>
            )}
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              {contractAmount && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#10b981' }}>
                  <DollarSign style={{ width: 10, height: 10 }} />
                  {Number(contractAmount).toLocaleString()}원
                </span>
              )}
              {sentAt && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#94a3b8' }}>
                  <Calendar style={{ width: 10, height: 10 }} />
                  {new Date(sentAt).toLocaleDateString('ko-KR')}
                </span>
              )}
              {outreach.brief_version > 0 && (
                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                  v{outreach.brief_version}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {/* Move to previous stage */}
            {prevStage && (
              <button
                onClick={(e) => handleMoveStage(prevStage.key, e)}
                disabled={updateOutreach.isPending}
                title={`← ${prevStage.label}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 7,
                  border: `1px solid ${tokens.color.border}`, background: '#fff',
                  cursor: 'pointer', color: '#94a3b8',
                  opacity: updateOutreach.isPending ? 0.4 : 1,
                }}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
            )}

            {/* Move to next stage */}
            {nextStage && (
              <button
                onClick={(e) => handleMoveStage(nextStage.key, e)}
                disabled={updateOutreach.isPending}
                title={`${nextStage.label} →`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  height: 28, padding: '0 10px', borderRadius: 7,
                  border: `1px solid ${nextStage.color}40`,
                  background: nextStage.bg,
                  fontSize: 11, fontWeight: 600, color: nextStage.color,
                  cursor: 'pointer',
                  opacity: updateOutreach.isPending ? 0.4 : 1,
                }}
              >
                {nextStage.label}
                <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            )}

            {/* Edit */}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(outreach); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                height: 28, padding: '0 10px', borderRadius: 7,
                border: `1px solid ${tokens.color.border}`, background: '#fff',
                fontSize: 11, fontWeight: 600, color: '#6366f1',
                cursor: 'pointer',
              }}
            >
              <Pencil style={{ width: 11, height: 11 }} />
              편집
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
