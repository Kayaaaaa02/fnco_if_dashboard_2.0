import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateInfluencerStatus, useDeepAnalysis } from '@/hooks/useInfluencers';
import { Button } from '@/components/ui/button.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import {
  UserCheck,
  UserX,
  Search,
  ChevronDown,
  ChevronUp,
  Instagram,
  Youtube,
  Loader2,
} from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const STATUS_MAP = {
  suggested: { label: '추천', color: '#6366f1', bg: '#eef2ff' },
  selected: { label: '선택됨', color: '#10b981', bg: '#ecfdf5' },
  contacted: { label: '컨택됨', color: '#f59e0b', bg: '#fffbeb' },
  confirmed: { label: '확정됨', color: '#0d9488', bg: '#f0fdfa' },
  declined: { label: '거절됨', color: '#ef4444', bg: '#fef2f2' },
};

const PLATFORM_META = {
  instagram: { icon: Instagram, color: '#E4405F', bg: '#fdf2f4', label: 'Instagram' },
  youtube: { icon: Youtube, color: '#FF0000', bg: '#fef2f2', label: 'YouTube' },
};

function ScoreRing({ score }) {
  const s = Math.min(100, Math.max(0, score || 0));
  const color = s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (s / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r="20" fill="none" stroke={tokens.color.border} strokeWidth="4" />
        <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color,
      }}>
        {s}
      </span>
    </div>
  );
}

export default function InfluencerMatchCard({ influencer, campaignId, isSelected: isBulkSelected, onToggleSelect }) {
  const navigate = useNavigate();
  const updateStatus = useUpdateInfluencerStatus();
  const deepAnalysis = useDeepAnalysis();
  const [expanded, setExpanded] = useState(false);

  const status = STATUS_MAP[influencer.status] || STATUS_MAP.suggested;
  const platform = PLATFORM_META[influencer.platform] || PLATFORM_META.instagram;
  const PlatformIcon = platform.icon;
  const matchedConcepts = influencer.matched_concepts || [];

  const handleSelect = (e) => {
    e.stopPropagation();
    updateStatus.mutate({ campaignId, profileId: influencer.profile_id || influencer.id, status: 'selected' });
  };
  const handleDecline = (e) => {
    e.stopPropagation();
    updateStatus.mutate({ campaignId, profileId: influencer.profile_id || influencer.id, status: 'declined' });
  };
  const handleDeepAnalysis = (e) => {
    e.stopPropagation();
    deepAnalysis.mutate({ campaignId, profileId: influencer.profile_id || influencer.id });
  };

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${tokens.color.border}`,
      background: tokens.color.surface, boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      transition: 'box-shadow .15s, border-color .15s',
      overflow: 'hidden',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor = status.color + '60'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'; e.currentTarget.style.borderColor = tokens.color.border; }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* ── Left: Score accent bar ── */}
        <div style={{
          width: 4, flexShrink: 0,
          background: status.color,
        }} />

        <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 160 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
              background: '#f1f5f9', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${status.color}30`,
            }}>
              {influencer.profile_image ? (
                <img src={influencer.profile_image} alt={influencer.name}
                  style={{ width: 48, height: 48, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>
                  {(influencer.name || '?').charAt(0)}
                </span>
              )}
            </div>
            <div>
              <button
                onClick={() => navigate(`/campaigns/${campaignId}/influencers/${influencer.profile_id || influencer.id}`)}
                style={{
                  fontSize: 13, fontWeight: 700, color: tokens.color.text,
                  border: 'none', background: 'none', padding: 0, cursor: 'pointer',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { e.target.style.color = '#6366f1'; }}
                onMouseLeave={(e) => { e.target.style.color = tokens.color.text; }}
              >
                {influencer.name || '이름 없음'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                  background: platform.bg, color: platform.color,
                }}>
                  <PlatformIcon style={{ width: 10, height: 10 }} />
                  {platform.label}
                </span>
                {influencer.followers && (
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    {Number(influencer.followers).toLocaleString()} 팔로워
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score Ring */}
          <ScoreRing score={influencer.match_score} />

          {/* Center: Concepts + Reason */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* PDA Concepts */}
            {matchedConcepts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {matchedConcepts.map((concept, idx) => {
                  const pdaLabel = [
                    concept.pain_point && `P${concept.pain_point}`,
                    concept.desire && `D${concept.desire}`,
                    concept.awareness_stage,
                  ].filter(Boolean).join('×');
                  return (
                    <span key={idx} style={{
                      fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
                      padding: '2px 7px', borderRadius: 6,
                      background: '#f1f5f9', color: '#475569',
                      border: `1px solid ${tokens.color.border}`,
                    }}>
                      {pdaLabel || concept.name || `컨셉 ${idx + 1}`}
                    </span>
                  );
                })}
              </div>
            )}
            {/* Match reason */}
            {influencer.match_reason && (
              <p style={{
                fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.45,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {influencer.match_reason}
              </p>
            )}
          </div>

          {/* Right: Status + Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: status.bg, color: status.color,
            }}>
              {status.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={handleSelect}
                disabled={updateStatus.isPending || influencer.status === 'selected'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  height: 28, padding: '0 10px', borderRadius: 7,
                  border: `1px solid #10b98140`, background: influencer.status === 'selected' ? '#ecfdf5' : '#fff',
                  fontSize: 11, fontWeight: 600, color: '#10b981', cursor: 'pointer',
                  opacity: influencer.status === 'selected' ? 0.5 : 1,
                }}>
                <UserCheck style={{ width: 12, height: 12 }} />
                선택
              </button>
              <button onClick={handleDecline}
                disabled={updateStatus.isPending || influencer.status === 'declined'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  height: 28, padding: '0 10px', borderRadius: 7,
                  border: `1px solid ${tokens.color.border}`, background: '#fff',
                  fontSize: 11, fontWeight: 600, color: '#94a3b8', cursor: 'pointer',
                  opacity: influencer.status === 'declined' ? 0.5 : 1,
                }}>
                <UserX style={{ width: 12, height: 12 }} />
                제외
              </button>
              <button onClick={handleDeepAnalysis}
                disabled={deepAnalysis.isPending}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  height: 28, padding: '0 10px', borderRadius: 7,
                  border: `1px solid ${tokens.color.border}`, background: '#fff',
                  fontSize: 11, fontWeight: 600, color: '#6366f1', cursor: 'pointer',
                }}>
                {deepAnalysis.isPending
                  ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                  : <Search style={{ width: 12, height: 12 }} />}
                딥분석
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expandable deep analysis ── */}
      {influencer.deep_analysis && (
        <div style={{ borderTop: `1px solid ${tokens.color.border}` }}>
          <button onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, width: '100%',
              padding: '8px 22px', border: 'none', background: tokens.color.surfaceMuted,
              fontSize: 11, fontWeight: 600, color: tokens.color.textSubtle, cursor: 'pointer',
            }}>
            {expanded ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
            딥분석 결과
          </button>
          {expanded && (
            <div style={{
              padding: '12px 22px',
              fontSize: 12, lineHeight: 1.7, color: '#475569',
              whiteSpace: 'pre-wrap', background: tokens.color.surfaceMuted,
            }}>
              {typeof influencer.deep_analysis === 'string'
                ? influencer.deep_analysis
                : JSON.stringify(influencer.deep_analysis, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
