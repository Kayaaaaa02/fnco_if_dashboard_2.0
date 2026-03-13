import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Film, Image as ImageIcon, FileText, Trash2, Sparkles, CheckCircle2, Play, Loader2, X } from 'lucide-react';
import { tokens } from '@/styles/designTokens.js';

const STATUS_CFG = {
  draft:         { label: '가이드 초안',       color: '#6b7280', bg: '#f3f4f6' },
  ai_generated:  { label: 'AI 이미지/영상 생성',  color: '#2563eb', bg: '#dbeafe' },
  human_edited:  { label: '최종 편집',         color: '#d97706', bg: '#fef3c7' },
  approved:      { label: '완료',             color: '#059669', bg: '#d1fae5' },
};

const FUNNEL_CFG = {
  TOFU: { label: 'TOFU', color: '#0284c7', bg: '#e0f2fe', border: '#0284c7' },
  MOFU: { label: 'MOFU', color: '#7c3aed', bg: '#ede9fe', border: '#7c3aed' },
  BOFU: { label: 'BOFU', color: '#059669', bg: '#d1fae5', border: '#059669' },
};

const FORMAT_ICON = { video: Film, image: ImageIcon, text: FileText };

/* campaign_placement → SNS 채널 표시명 매핑 */
const CHANNEL_MAP = {
  tiktok: { label: 'TikTok', color: '#000000', bg: '#f0f0f0', icon: '🎵' },
  instagram_reels: { label: 'Instagram Reels', color: '#E1306C', bg: '#fce4ec', icon: '📸' },
  instagram: { label: 'Instagram', color: '#E1306C', bg: '#fce4ec', icon: '📸' },
  youtube: { label: 'YouTube', color: '#FF0000', bg: '#ffebee', icon: '▶️' },
  youtube_shorts: { label: 'YouTube Shorts', color: '#FF0000', bg: '#ffebee', icon: '▶️' },
  blog: { label: 'Blog', color: '#2DB400', bg: '#e8f5e9', icon: '📝' },
  naver_blog: { label: 'Naver Blog', color: '#2DB400', bg: '#e8f5e9', icon: '📝' },
  twitter: { label: 'X (Twitter)', color: '#1DA1F2', bg: '#e3f2fd', icon: '🐦' },
  x: { label: 'X', color: '#000000', bg: '#f0f0f0', icon: '✖️' },
};

function getChannelInfo(placement) {
  if (!placement) return null;
  const key = placement.toLowerCase().replace(/[\s-]/g, '_');
  if (CHANNEL_MAP[key]) return CHANNEL_MAP[key];
  for (const [k, v] of Object.entries(CHANNEL_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { label: placement, color: '#6b7280', bg: '#f3f4f6', icon: '📢' };
}

function Pill({ children, color, bg, tooltip }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} className={tooltip ? 'pda-pill-wrap' : undefined}>
      <span
        style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
          color, background: bg, whiteSpace: 'nowrap',
          cursor: tooltip ? 'pointer' : undefined,
        }}
      >
        {children}
      </span>
      {tooltip && (
        <span className="pda-pill-tip" style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 6, padding: '4px 10px', borderRadius: 6,
          background: '#1e293b', color: '#fff',
          fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
          pointerEvents: 'none', opacity: 0, transition: 'opacity .15s',
          zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        }}>
          {tooltip}
          <span style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            border: '4px solid transparent', borderTopColor: '#1e293b',
          }} />
        </span>
      )}
    </span>
  );
}

/* Inject hover + animation styles once */
if (typeof document !== 'undefined' && !document.getElementById('pda-pill-style')) {
  const s = document.createElement('style');
  s.id = 'pda-pill-style';
  s.textContent = `
    .pda-pill-wrap:hover .pda-pill-tip{opacity:1!important}
    @keyframes ccPulse{0%,100%{opacity:.85}50%{opacity:1}}
    @keyframes ccSpin{to{transform:rotate(360deg)}}
    @keyframes ccDot{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}
    @keyframes ccPop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
  `;
  document.head.appendChild(s);
}

export default function CreativeCard({ creative, campaignId, isSelected, onToggleSelect, personaMap = {}, desireMap = {}, onDelete, onGenerateGuide, generatingId, videoStates = {}, onVideoGenerate, onApprove }) {
  const navigate = useNavigate();
  const status = STATUS_CFG[creative.status] || STATUS_CFG.draft;
  const funnel = FUNNEL_CFG[creative.funnel] || FUNNEL_CFG.TOFU;
  const FormatIcon = FORMAT_ICON[creative.format] || FileText;

  const cId = creative.creative_id || creative.id;
  const variantCount = creative.copy_variants?.length || 0;
  const copyPreview = (creative.copy_text || '').split('\n')[0];
  const isDraft = creative.status === 'draft';
  const hasGuide = !!creative.production_guide;
  const isAiGenerated = creative.status === 'ai_generated';
  const isHumanEdited = creative.status === 'human_edited';

  // 이 카드의 로딩/완료 상태
  const isLoading = generatingId === cId;
  const isDone = generatingId === `done-${cId}`;

  // 영상 생성 상태
  const videoState = videoStates[cId]; // 'generating' | 'done' | undefined

  // 삭제 확인 팝업
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // SNS 채널 정보
  const channel = getChannelInfo(creative.campaign_placement);

  // 로딩 중: 카드 전체를 로딩 상태로 표시
  if (isLoading) {
    return (
      <div style={{
        borderRadius: 12,
        border: `1.5px solid #a78bfa`,
        borderLeft: `4px solid #7c3aed`,
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        overflow: 'hidden',
        animation: 'ccPulse 2s ease-in-out infinite',
        minHeight: 140,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: '28px 20px',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid #ddd6fe', borderBottomColor: '#7c3aed',
          animation: 'ccSpin 1s linear infinite',
        }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', margin: 0 }}>
          AI 가이드 생성 중
        </p>
        <p style={{ fontSize: 12, color: '#8b5cf6', margin: 0, textAlign: 'center' }}>
          {creative.concept_name || '컨셉'}
        </p>
        <div style={{ display: 'flex', gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%', background: '#7c3aed',
              animation: `ccDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // 완료: 카드 전체를 완료 상태로 표시
  if (isDone) {
    return (
      <div
        onClick={() => navigate(`/campaigns/${campaignId}/creative/${cId}`)}
        style={{
          borderRadius: 12,
          border: `1.5px solid #86efac`,
          borderLeft: `4px solid #059669`,
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          overflow: 'hidden',
          cursor: 'pointer',
          minHeight: 140,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '28px 20px',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669, #34d399)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'ccPop .4s ease-out',
        }}>
          <CheckCircle2 style={{ width: 22, height: 22, color: '#fff' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#059669', margin: 0 }}>
          AI 가이드 생성 완료
        </p>
        <p style={{ fontSize: 12, color: '#10b981', margin: 0 }}>
          {creative.concept_name || '컨셉'}
        </p>
      </div>
    );
  }

  // 영상 생성 중
  if (videoState === 'generating') {
    return (
      <div style={{
        borderRadius: 12,
        border: '1.5px solid #7dd3fc',
        borderLeft: '4px solid #0284c7',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        overflow: 'hidden',
        animation: 'ccPulse 2s ease-in-out infinite',
        minHeight: 140,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: '28px 20px',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid #bae6fd', borderBottomColor: '#0284c7',
          animation: 'ccSpin 1s linear infinite',
        }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0284c7', margin: 0 }}>
          AI 영상 생성 중
        </p>
        <p style={{ fontSize: 12, color: '#0ea5e9', margin: 0, textAlign: 'center' }}>
          {creative.concept_name || '컨셉'}
        </p>
        <div style={{ display: 'flex', gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%', background: '#0284c7',
              animation: `ccDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // 영상 생성 완료
  if (videoState === 'done') {
    return (
      <div style={{
        borderRadius: 12,
        border: '1.5px solid #7dd3fc',
        borderLeft: '4px solid #0284c7',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        overflow: 'hidden',
        minHeight: 140,
        padding: '20px',
      }}>
        {/* 완료 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ccPop .4s ease-out',
          }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', margin: 0 }}>AI 영상 생성 완료</p>
            <p style={{ fontSize: 11, color: '#0ea5e9', margin: 0 }}>{creative.concept_name || '컨셉'}</p>
          </div>
        </div>

        {/* 영상 썸네일 미리보기 */}
        <div style={{
          borderRadius: 10, overflow: 'hidden',
          background: '#000', aspectRatio: '16/9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', marginBottom: 12,
          border: '1px solid #334155',
        }}>
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Film style={{ width: 32, height: 32, color: '#64748b' }} />
          </div>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,.3)',
          }}>
            <Play style={{ width: 18, height: 18, color: '#1e293b', marginLeft: 2 }} />
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/campaigns/${campaignId}/creative/${cId}?view=video`);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff', cursor: 'pointer',
            }}
          >
            <Play style={{ width: 12, height: 12 }} />
            영상 확인하기
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/campaigns/${campaignId}/creative/${cId}`);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: '#fff', cursor: 'pointer',
            }}
          >
            <Pencil style={{ width: 12, height: 12 }} />
            최종 편집하기
          </button>
        </div>
      </div>
    );
  }

  // 일반 상태
  return (
    <div
      onClick={() => navigate(`/campaigns/${campaignId}/creative/${cId}`)}
      style={{
        borderRadius: 12,
        border: `1px solid ${isSelected ? funnel.border + '60' : tokens.color.border}`,
        borderLeft: `4px solid ${funnel.border}`,
        background: isSelected ? funnel.bg + '40' : tokens.color.surface,
        cursor: 'pointer',
        transition: 'all .15s',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Header Row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onToggleSelect && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: isSelected ? '2px solid #6366f1' : `2px solid ${tokens.color.border}`,
                background: isSelected ? '#6366f1' : '#fff',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {isSelected && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )}
          {creative.persona_code && (
            <Pill color="#fff" bg="#7c3aed" tooltip={personaMap[creative.persona_code]}>{creative.persona_code}</Pill>
          )}
          {creative.desire_code && (
            <Pill color="#fff" bg="#d97706" tooltip={desireMap[creative.desire_code]}>{creative.desire_code}</Pill>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Pill color={status.color} bg={status.bg}>{status.label}</Pill>
          <Pill color={funnel.color} bg={funnel.bg}>{funnel.label}</Pill>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                border: 'none', background: 'transparent',
                color: '#94a3b8', cursor: 'pointer', transition: 'all .15s',
                marginLeft: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px 12px' }}>
        <p style={{
          fontSize: 14, fontWeight: 700, color: tokens.color.text,
          margin: '0 0 4px', lineHeight: 1.3,
        }}>
          {creative.concept_name || '제목 없음'}
        </p>

        {copyPreview && (
          <p style={{
            fontSize: 12, color: tokens.color.textSubtle,
            margin: '0 0 10px', lineHeight: 1.5,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {copyPreview}
          </p>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 8,
          borderTop: `1px solid ${tokens.color.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {channel ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, color: channel.color,
                padding: '2px 10px', borderRadius: 6,
                background: channel.bg,
              }}>
                <span style={{ fontSize: 12 }}>{channel.icon}</span>
                {channel.label}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: tokens.color.textSubtle }}>
                <FormatIcon style={{ width: 13, height: 13 }} />
                {creative.format || '미정'}
              </span>
            )}
            {variantCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: tokens.color.textSubtle }}>
                <FileText style={{ width: 12, height: 12 }} />
                AI 변형 {variantCount}개
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isHumanEdited ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/campaigns/${campaignId}/creative/${cId}`);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#fff',
                    padding: '4px 12px', borderRadius: 6,
                    border: 'none',
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    cursor: 'pointer', transition: 'all .15s',
                    boxShadow: '0 2px 6px rgba(217,119,6,.25)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Pencil style={{ width: 12, height: 12 }} />
                  편집
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onApprove) onApprove(creative);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#fff',
                    padding: '4px 12px', borderRadius: 6,
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    cursor: 'pointer', transition: 'all .15s',
                    boxShadow: '0 2px 6px rgba(5,150,105,.25)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <CheckCircle2 style={{ width: 12, height: 12 }} />
                  승인
                </button>
              </>
            ) : isAiGenerated ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/campaigns/${campaignId}/creative/${cId}`);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#fff',
                    padding: '4px 12px', borderRadius: 6,
                    border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    cursor: 'pointer', transition: 'all .15s',
                    boxShadow: '0 2px 6px rgba(124,58,237,.25)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <ImageIcon style={{ width: 12, height: 12 }} />
                  이미지 생성
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onVideoGenerate) onVideoGenerate(creative);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#fff',
                    padding: '4px 12px', borderRadius: 6,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                    cursor: 'pointer', transition: 'all .15s',
                    boxShadow: '0 2px 6px rgba(37,99,235,.25)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Film style={{ width: 12, height: 12 }} />
                  영상 생성
                </button>
              </>
            ) : isDraft && !hasGuide ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGenerateGuide) onGenerateGuide(creative);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700, color: '#fff',
                  padding: '4px 12px', borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  cursor: 'pointer', transition: 'all .15s',
                  boxShadow: '0 2px 6px rgba(124,58,237,.25)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <Sparkles style={{ width: 12, height: 12 }} />
                AI 가이드 생성
              </button>
            ) : hasGuide ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/campaigns/${campaignId}/creative/${cId}`);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700, color: '#059669',
                  padding: '3px 10px', borderRadius: 6,
                  border: '1px solid #a7f3d0', background: '#ecfdf5',
                  cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#d1fae5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ecfdf5'; }}
              >
                <CheckCircle2 style={{ width: 11, height: 11 }} />
                AI 가이드 생성 완료
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/campaigns/${campaignId}/creative/${cId}`);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, color: '#6366f1',
                  padding: '3px 10px', borderRadius: 6,
                  border: '1px solid #e0e7ff', background: '#eef2ff',
                  cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#c7d2fe'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
              >
                <Pencil style={{ width: 11, height: 11 }} />
                편집
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 삭제 확인 팝업 ── */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,.4)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 360, borderRadius: 16, background: '#fff',
            boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            overflow: 'hidden',
          }}>
            {/* 팝업 헤더 */}
            <div style={{
              padding: '20px 24px 16px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Trash2 style={{ width: 20, height: 20, color: '#dc2626' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>기획안 삭제</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 8,
                  border: 'none', background: '#f1f5f9',
                  color: '#64748b', cursor: 'pointer',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* 팝업 내용 */}
            <div style={{ padding: '0 24px 20px' }}>
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: '#fef2f2', border: '1px solid #fecaca',
                marginBottom: 20,
              }}>
                <p style={{ fontSize: 13, color: '#991b1b', margin: 0, lineHeight: 1.6 }}>
                  <strong>"{creative.concept_name || '제목 없음'}"</strong> 콘텐츠 기획안을 삭제하시겠습니까?
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${tokens.color.border}`, background: '#fff',
                    color: tokens.color.text, cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete();
                  }}
                  style={{
                    padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: 'none', background: '#dc2626',
                    color: '#fff', cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
