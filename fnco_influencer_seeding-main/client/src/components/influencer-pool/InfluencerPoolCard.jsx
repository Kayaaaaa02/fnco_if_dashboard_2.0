import { useState } from 'react';
import { PLATFORM_MAP, formatNumber, getEngagementColor } from './constants';
import { DeepAnalysisModal } from './DeepAnalysisModal';

const CREATOR_TYPE_MAP = {
    fnco: { label: 'FNCO', color: '#10b981' },
    excluded: { label: '타브랜드', color: '#6366f1' },
};

/* ───── 카드 고정 높이 상수 ───── */
const PROFILE_HEIGHT = 76;   // 아바타 + 이름 + 태그
const BIO_HEIGHT = 48;       // 바이오 2줄 고정 영역
const STATS_HEIGHT = 58;     // 통계 3칸
const BUTTON_HEIGHT = 42;    // 심층 분석 버튼

function ProfileAvatar({ name, image, platform }) {
    const [imgError, setImgError] = useState(false);
    const initial = name?.charAt(0)?.toUpperCase() || '?';
    const platformColor = PLATFORM_MAP[platform]?.color || '#667eea';

    const badge = (
        <div style={{
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: platformColor,
            border: '2px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <PlatformIcon platform={platform} size={7} />
        </div>
    );

    if (image && !imgError) {
        return (
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                    src={image}
                    alt={name}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #F0F0F0',
                    }}
                    onError={() => setImgError(true)}
                />
                {badge}
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888888',
                fontSize: '16px',
                fontWeight: 600,
                border: '2px solid #F0F0F0',
            }}>
                {initial}
            </div>
            {badge}
        </div>
    );
}

export function PlatformIcon({ platform, size = 10 }) {
    if (platform === 'tiktok') {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.92a8.2 8.2 0 004.76 1.52V7a4.84 4.84 0 01-1-.31z"/>
            </svg>
        );
    }
    if (platform === 'instagram') {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
            </svg>
        );
    }
    if (platform === 'youtube') {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff">
                <path d="M23 9.71a8.5 8.5 0 00-.91-4.13 2.92 2.92 0 00-1.72-1A78.36 78.36 0 0012 4.27a78.45 78.45 0 00-8.34.3 2.87 2.87 0 00-1.46.74c-.9.83-1 2.25-1.1 3.45a48.29 48.29 0 000 6.48 9.55 9.55 0 00.3 2 3.14 3.14 0 00.71 1.36 2.86 2.86 0 001.49.78A45.18 45.18 0 0012 19.73a45.18 45.18 0 008.34-.3 2.86 2.86 0 001.49-.78 3.14 3.14 0 00.71-1.36 9.55 9.55 0 00.46-2 48.29 48.29 0 000-5.58zM9.74 14.85V8.78l5.53 3-5.53 3.07z"/>
            </svg>
        );
    }
    return null;
}

function StatCell({ label, value, color, isLast }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '7px 4px',
            borderRight: isLast ? 'none' : '1px solid #F0F0F0',
        }}>
            <div style={{ fontSize: '10px', color: '#888888', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: color || '#222222' }}>{value}</div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   메인 카드
   ═══════════════════════════════════════════════ */
export function InfluencerPoolCard({ influencer, selectable, isSelected, onToggleSelect, analysisStatus, analysisStats, onRequestAnalysis }) {
    const inf = influencer;
    const [modalOpen, setModalOpen] = useState(false);
    // analysisStatus: 'none' | 'processing' | 'completed' | 'failed'
    const status = analysisStatus || 'none';
    const canSelect = status === 'completed' || inf.isConfirmed;
    const creatorInfo = CREATOR_TYPE_MAP[inf.creator_type] || { label: inf.creator_type, color: '#94a3b8' };
    const engColor = inf.engagementRate != null ? getEngagementColor(inf.engagementRate) : '#888888';

    return (
        <>
            <div
                style={{
                    background: '#ffffff',
                    border: isSelected ? '1.5px solid #6366f1' : '1px solid #E8E8E8',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    cursor: 'default',
                    boxShadow: isSelected ? '0 2px 8px rgba(99,102,241,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isSelected
                        ? '0 2px 8px rgba(99,102,241,0.15)'
                        : '0 1px 3px rgba(0,0,0,0.06)';
                }}
            >
                {/* 체크박스 */}
                {selectable && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onToggleSelect?.(inf.id); }}
                        title={!canSelect ? '심층 분석을 먼저 완료해주세요.' : ''}
                        style={{
                            position: 'absolute', top: '10px', left: '10px', zIndex: 3,
                            width: 18, height: 18, borderRadius: 5,
                            cursor: canSelect ? 'pointer' : 'not-allowed',
                            opacity: canSelect ? 1 : 0.4,
                            background: isSelected ? '#6366f1' : 'rgba(255,255,255,0.85)',
                            border: isSelected ? '2px solid #6366f1' : '2px solid #D0D0D0',
                            backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                            boxShadow: isSelected
                                ? '0 2px 8px rgba(99,102,241,0.35)'
                                : '0 1px 4px rgba(0,0,0,0.08)',
                        }}
                        onMouseEnter={(e) => {
                            if (!isSelected && canSelect) {
                                e.currentTarget.style.borderColor = '#6366f1';
                                e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSelected && canSelect) {
                                e.currentTarget.style.borderColor = '#D0D0D0';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                            }
                        }}
                    >
                        {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                )}

                {/* 즐겨찾기 별 (허브 확정 시 노란색) */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24"
                        fill={inf.isConfirmed ? '#f59e0b' : 'none'}
                        stroke={inf.isConfirmed ? '#f59e0b' : '#CCCCCC'}
                        strokeWidth="1.5"
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </div>

                {/* ── 프로필 영역 (고정 높이) ── */}
                <div style={{
                    padding: '16px 16px 0',
                    height: `${PROFILE_HEIGHT}px`,
                    display: 'flex',
                    gap: '10px',
                    overflow: 'hidden',
                }}>
                    <ProfileAvatar name={inf.displayName} image={inf.profileImage} platform={inf.platform} />

                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#111111',
                            marginBottom: '1px',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {inf.displayName}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#888888',
                            marginBottom: '6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            @{inf.username}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                            <span style={{
                                fontSize: '10px',
                                padding: '1px 7px',
                                borderRadius: '4px',
                                background: PLATFORM_MAP[inf.platform]?.bg || '#F5F5F5',
                                color: PLATFORM_MAP[inf.platform]?.color || '#888888',
                                fontWeight: 600,
                                flexShrink: 0,
                            }}>
                                {PLATFORM_MAP[inf.platform]?.label || inf.platform}
                            </span>
                            <span style={{
                                fontSize: '10px',
                                padding: '1px 7px',
                                borderRadius: '4px',
                                background: `${creatorInfo.color}10`,
                                color: creatorInfo.color,
                                fontWeight: 600,
                                flexShrink: 0,
                            }}>
                                {creatorInfo.label}
                            </span>
                            {inf.country && (
                                <span style={{
                                    fontSize: '10px',
                                    padding: '1px 7px',
                                    borderRadius: '4px',
                                    background: '#F5F5F5',
                                    color: '#888888',
                                    fontWeight: 500,
                                    flexShrink: 0,
                                }}>
                                    {inf.country}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 바이오 영역 (고정 높이) ── */}
                <div style={{
                    padding: '8px 16px 10px',
                    height: `${BIO_HEIGHT}px`,
                    overflow: 'hidden',
                }}>
                    {inf.biography ? (
                        <div style={{
                            fontSize: '12px',
                            color: '#666666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.5',
                        }}>
                            {inf.biography}
                        </div>
                    ) : (
                        <div style={{
                            fontSize: '11px',
                            color: '#CCCCCC',
                            fontStyle: 'italic',
                            lineHeight: '1.5',
                        }}>
                            바이오 정보 없음
                        </div>
                    )}
                </div>

                {/* ── 통계 영역 ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    background: '#FAFAFA',
                    borderTop: '1px solid #F0F0F0',
                    height: `${STATS_HEIGHT}px`,
                }}>
                    <StatCell label="팔로워" value={formatNumber(inf.followers)} isLast={false} />
                    <StatCell
                        label="평균 조회수"
                        value={analysisStats?.avg_views ? formatNumber(analysisStats.avg_views) : '수집전'}
                        color={analysisStats?.avg_views ? '#222222' : '#AAAAAA'}
                        isLast={false}
                    />
                    <StatCell
                        label="참여율"
                        value={inf.engagementRate != null ? `${inf.engagementRate}%` : '-'}
                        color={engColor}
                        isLast
                    />
                </div>

                {/* ── 하단 액션 버튼 (2열) ── */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    borderTop: '1px solid #F0F0F0',
                }}>
                    {/* 프로필 보기 */}
                    <a
                        href={inf.profileUrl || (inf.platform === 'tiktok' ? `https://www.tiktok.com/@${inf.username}` : `https://www.${inf.platform}.com/${inf.username}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '5px', height: '36px',
                            background: '#F5F5F5', fontSize: '11px', fontWeight: 500,
                            color: '#111111', textDecoration: 'none',
                            borderRight: '1px solid #F0F0F0',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#E8E8E8';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F5F5F5';
                        }}
                    >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        프로필
                    </a>

                    {/* 심층 분석 (3상태) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (status === 'completed') setModalOpen(true);
                            else if (status === 'none' || status === 'failed') onRequestAnalysis?.(inf);
                        }}
                        disabled={status === 'processing'}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '5px', height: '36px', border: 'none',
                            background: status === 'processing' ? '#FFF7ED'
                                : status === 'completed' ? '#F0FDF4'
                                : '#EEF2FF',
                            fontSize: '11px',
                            fontWeight: status === 'completed' ? 600 : 500,
                            color: status === 'processing' ? '#D97706'
                                : status === 'completed' ? '#16A34A'
                                : '#4F46E5',
                            cursor: status === 'processing' ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (status === 'completed') {
                                e.currentTarget.style.background = '#DCFCE7';
                                e.currentTarget.style.color = '#15803D';
                            } else if (status === 'none' || status === 'failed') {
                                e.currentTarget.style.background = '#FDF2F8';
                                e.currentTarget.style.color = '#EC4899';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (status === 'processing') return;
                            e.currentTarget.style.background = status === 'completed' ? '#F0FDF4' : '#EEF2FF';
                            e.currentTarget.style.color = status === 'completed' ? '#16A34A' : '#4F46E5';
                        }}
                    >
                        {status === 'processing' ? (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'daSpin 1s linear infinite' }}>
                                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                                </svg>
                                분석중...
                            </>
                        ) : status === 'completed' ? (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                분석 보기
                            </>
                        ) : (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    <line x1="11" y1="8" x2="11" y2="14" />
                                    <line x1="8" y1="11" x2="14" y2="11" />
                                </svg>
                                {status === 'failed' ? '재분석' : '심층 분석'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 심층 분석 모달 */}
            <DeepAnalysisModal
                influencer={inf}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}
