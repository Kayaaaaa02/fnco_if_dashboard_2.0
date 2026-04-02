import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Lightbulb, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { PLATFORM_MAP, formatNumber } from './constants';
import { PlatformIcon } from './InfluencerPoolCard';
import { fetchDeepAnalysisResult } from './deepAnalysisMock';

/* ─────────────────────────────────────────────
   색상 팔레트
   ───────────────────────────────────────────── */
const C = {
    accent: '#7C3AED',
    accentLight: '#EDE9FE',
    accentSoft: '#F5F3FF',
    green: '#059669',
    greenLight: '#D1FAE5',
    greenSoft: '#ECFDF5',
    blue: '#2563EB',
    blueLight: '#DBEAFE',
    blueSoft: '#EFF6FF',
    pink: '#DB2777',
    pinkLight: '#FCE7F3',
    amber: '#D97706',
    amberLight: '#FEF3C7',
    amberSoft: '#FFFBEB',
    bar: ['#7C3AED', '#6366F1', '#818CF8', '#A78BFA'],
    text1: '#111111',
    text2: '#222222',
    text3: '#666666',
    text4: '#888888',
    border: '#F0F0F0',
    bg: '#F9FAFB',
};

/* ─────────────────────────────────────────────
   간이 마크다운 렌더러
   ───────────────────────────────────────────── */
const PRIORITY_CONFIG = {
    '🔴': { key: 'high', label: 'High Priority', accentColor: '#ef4444', tintBg: '#FFF8F8' },
    '🟡': { key: 'medium', label: 'Medium Priority', accentColor: '#eab308', tintBg: '#FFFDF0' },
    '🟢': { key: 'low', label: 'Low Priority', accentColor: '#22c55e', tintBg: '#F4FDF6' },
};

/** 마크다운 텍스트를 우선순위별 구조화 데이터로 파싱. */
function parseImprovementMarkdown(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const groups = [];
    let currentEmoji = null;
    let currentHeading = '';
    let currentItems = [];
    let currentItem = null;

    const flushItem = () => {
        if (currentItem) { currentItems.push(currentItem); currentItem = null; }
    };
    const flushGroup = () => {
        flushItem();
        if (currentItems.length > 0 && currentEmoji) {
            groups.push({ emoji: currentEmoji, heading: currentHeading, items: currentItems });
        }
        currentItems = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('### ')) {
            flushGroup();
            const emoji = trimmed.match(/🔴|🟡|🟢/)?.[0];
            if (emoji) currentEmoji = emoji;
            currentHeading = trimmed.replace(/^###\s*/, '').replace(/🔴|🟡|🟢/g, '').trim();
            continue;
        }

        if (trimmed.startsWith('**') && trimmed.includes(')')) {
            flushItem();
            const title = trimmed.replace(/\*\*/g, '').trim().replace(/^[a-z]\)\s*/i, '');
            currentItem = { id: `imp-${groups.length}-${currentItems.length}`, title, lines: [] };
            continue;
        }

        if (currentItem) {
            currentItem.lines.push(trimmed);
        } else if (currentEmoji) {
            currentItem = { id: `imp-${groups.length}-${currentItems.length}`, title: null, lines: [trimmed] };
        }
    }
    flushGroup();
    return groups;
}

/** 영상분석 스타일 우선순위 아이템 카드. */
function ImprovementItem({ item, config }) {
    const [expanded, setExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);

    const description = item.lines.join('\n');

    return (
        <div
            style={{
                backgroundColor: config.tintBg,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: hovered ? config.accentColor + '55' : '#EEEEEE',
                borderLeft: `4px solid ${config.accentColor}`,
                boxShadow: hovered ? `0 3px 10px ${config.accentColor}22` : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s, border-color 0.2s',
                overflow: 'hidden',
                marginBottom: '0.6rem',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                className="flex items-center justify-between cursor-pointer"
                style={{ padding: '0.85rem 1rem' }}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3 flex-1">
                    <div style={{
                        color: config.accentColor, display: 'flex',
                        backgroundColor: config.accentColor + '18',
                        borderRadius: '6px', padding: '4px',
                    }}>
                        <Lightbulb className="w-4 h-4" />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#111111' }}>
                        {(item.title || item.lines[0]?.replace(/^-\s*/, '').replace(/\*\*/g, '') || '').replace(/^[a-z]\)\s*/i, '')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        backgroundColor: config.accentColor + '18',
                        borderRadius: '9999px', padding: '3px 10px',
                        fontSize: '11px', fontWeight: 600, color: config.accentColor,
                    }}>
                        <span style={{
                            width: '5px', height: '5px', borderRadius: '50%',
                            backgroundColor: config.accentColor, display: 'inline-block', flexShrink: 0,
                        }} />
                        {config.label}
                    </div>
                    <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        backgroundColor: config.accentColor + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: config.accentColor, flexShrink: 0,
                    }}>
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                </div>
            </div>
            {expanded && (
                <div style={{
                    borderTop: `1px solid ${config.accentColor}33`,
                    padding: '0.85rem 1rem',
                    backgroundColor: config.accentColor + '0D',
                }}>
                    <div className="text-sm" style={{ color: '#333333', lineHeight: '1.7' }}>
                        {item.lines.map((line, i) => (
                            <div key={i} style={{ paddingLeft: line.startsWith('-') ? '8px' : 0, marginBottom: '2px' }}>
                                <FormatInline text={line} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/** 우선순위 섹션 (High/Medium/Low 그룹). */
function ImprovementSection({ group }) {
    const config = PRIORITY_CONFIG[group.emoji] || PRIORITY_CONFIG['🟡'];
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h4
                className="flex items-center gap-2"
                style={{
                    color: '#111111', fontWeight: 700, fontSize: '14px',
                    marginBottom: '0.7rem', paddingLeft: '2px',
                }}
            >
                <span style={{ color: config.accentColor, display: 'flex' }}>
                    <Star className="w-5 h-5" fill="currentColor" />
                </span>
                {group.heading || config.label}
            </h4>
            <div>
                {group.items.map((item) => (
                    <ImprovementItem key={item.id} item={item} config={config} />
                ))}
            </div>
        </div>
    );
}

/** **bold** 처리 — React 엘리먼트 반환 (XSS-safe) */
function FormatInline({ text }) {
    if (!text) return null;
    const line = text.startsWith('- ') ? '\u2022 ' + text.slice(2) : text;
    const parts = line.split(/(\*\*.+?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} style={{ color: '#222222' }}>{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

/* ─────────────────────────────────────────────
   섹션 헤더 — 왼쪽 컬러 바 스타일
   ───────────────────────────────────────────── */
function SectionHeader({ title, color }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '14px',
        }}>
            <div style={{
                width: '3px', height: '16px', borderRadius: '2px',
                background: color || C.accent,
            }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: C.text1, letterSpacing: '-0.01em' }}>
                {title}
            </span>
        </div>
    );
}

/* ─────────────────────────────────────────────
   FR-01: 모달 헤더
   ───────────────────────────────────────────── */
function ModalHeader({ data, onClose }) {
    const platformInfo = PLATFORM_MAP[data.platform] || {};
    const pad = (n) => String(n).padStart(2, '0');
    let dateStr = '';
    if (data.analyzedAt) {
        const date = new Date(data.analyzedAt);
        dateStr = `분석일 ${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    return (
        <div style={{
            position: 'sticky', top: 0, zIndex: 2,
            background: '#ffffff',
            borderBottom: '1px solid #F0F0F0',
        }}>
            {/* 상단 그라디언트 악센트 바 */}
            <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, #7C3AED 0%, #6366F1 35%, #3B82F6 65%, #10B981 100%)',
            }} />

            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 36px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* 아바타 */}
                    <div style={{
                        width: '46px', height: '46px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${platformInfo.color || '#8B5CF6'}20, ${platformInfo.color || '#8B5CF6'}08)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${platformInfo.color || '#E0E0E0'}30`,
                        fontSize: '18px', fontWeight: 700, color: C.text3,
                        overflow: 'hidden', flexShrink: 0,
                    }}>
                        {data.profileImage ? (
                            <img src={data.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            data.influencerName?.charAt(0)?.toUpperCase() || '?'
                        )}
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: C.text1 }}>
                                {data.influencerName}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: C.text4 }}>심층 분석</span>
                            <span style={{
                                fontSize: '11px', fontWeight: 600, padding: '3px 10px',
                                borderRadius: '6px',
                                background: platformInfo.bg || '#F5F5F5',
                                color: platformInfo.color || '#888888',
                            }}>
                                {platformInfo.label || data.platform}
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: C.text4, marginTop: '3px' }}>
                            {dateStr}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        border: '1px solid #E8E8E8', background: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.borderColor = '#D0D0D0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#E8E8E8'; }}
                >
                    <X size={16} color="#666666" />
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   FR-02: 요약 카드
   ───────────────────────────────────────────── */
function SummarySection({ overview }) {
    const colors = [C.accent, C.green, C.blue, C.pink, C.amber];
    // 태그 조합: 연령대 + 성별 + 라이프스타일 + 톤앤무드
    const tags = [
        overview.age_group,
        overview.gender,
        ...(overview.lifestyle || []),
        overview.channel?.tone,
    ].filter(Boolean);

    const channel = overview.channel;
    const skin = overview.skin;

    return (
        <div style={{ padding: '24px 36px' }}>
            <SectionHeader title="요약 카드" color={C.accent} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {tags.map((tag, i) => {
                    const c = colors[i % colors.length];
                    return (
                        <span key={i} style={{
                            fontSize: '12px', fontWeight: 600,
                            padding: '5px 14px', borderRadius: '16px',
                            background: `${c}10`, color: c,
                            border: `1px solid ${c}28`,
                        }}>
                            {tag}
                        </span>
                    );
                })}
            </div>
            <p style={{ fontSize: '13px', color: C.text3, lineHeight: 1.7, margin: '0 0 14px' }}>
                {overview.summary}
            </p>

            {/* 채널/피부 특성 (요약 하위) */}
            {(channel || skin) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {channel && (
                        <div style={{
                            background: C.bg, borderRadius: '10px',
                            padding: '12px 14px', border: `1px solid ${C.border}`,
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: C.text4, marginBottom: '6px', letterSpacing: '0.03em' }}>
                                채널 특성
                            </div>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                {(channel.content_style || []).map((tag, i) => (
                                    <span key={i} style={{
                                        fontSize: '10px', padding: '3px 8px', borderRadius: '5px',
                                        background: C.accentLight, color: C.accent, fontWeight: 500,
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                                {channel.production_style && (
                                    <span style={{
                                        fontSize: '10px', padding: '3px 8px', borderRadius: '5px',
                                        background: C.blueLight, color: C.blue, fontWeight: 500,
                                    }}>
                                        {channel.production_style}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '11px', color: C.text3, margin: 0, lineHeight: 1.5 }}>
                                톤앤무드: {channel.tone}
                            </p>
                        </div>
                    )}

                    {skin && (
                        <div style={{
                            background: C.bg, borderRadius: '10px',
                            padding: '12px 14px', border: `1px solid ${C.border}`,
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: C.text4, marginBottom: '6px', letterSpacing: '0.03em' }}>
                                피부 특성
                            </div>
                            <span style={{
                                display: 'inline-block',
                                fontSize: '10px', padding: '3px 8px', borderRadius: '5px',
                                background: C.pinkLight, color: C.pink, fontWeight: 600,
                                marginBottom: '6px',
                            }}>
                                타입: {skin.type}
                            </span>
                            <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.5 }}>
                                특징: {(skin.features || []).join(', ')}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   FR-04: 핵심 페르소나
   ───────────────────────────────────────────── */
function PersonasSection({ personas }) {
    const pals = [
        { bg: '#F0EBFF', border: '#D4BBFF', accent: C.accent, tagBg: '#EDE9FE' },
        { bg: '#EFF6FF', border: '#BFDBFE', accent: C.blue, tagBg: '#DBEAFE' },
    ];
    return (
        <div style={{ padding: '24px 36px' }}>
            <SectionHeader title="핵심 페르소나" color={C.pink} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                {personas.map((p, i) => {
                    const pal = pals[i % pals.length];
                    return (
                        <div key={p.id} style={{
                            padding: '14px 16px', borderRadius: '12px',
                            background: pal.bg, border: `1px solid ${pal.border}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{
                                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.02em',
                                    padding: '3px 8px', borderRadius: '5px',
                                    background: pal.accent, color: '#ffffff',
                                }}>
                                    {p.id}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: C.text2 }}>
                                    {p.name}
                                </span>
                            </div>
                            <div style={{ fontSize: '12px', color: C.text3, lineHeight: 1.5, marginBottom: '8px' }}>
                                {p.desc}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {(p.tags || p.hashtags || []).map((tag, j) => (
                                    <span key={j} style={{
                                        fontSize: '10px', padding: '2px 8px', borderRadius: '8px',
                                        background: pal.tagBg, color: pal.accent, fontWeight: 500,
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   FR-05: 콘텐츠 강점
   ───────────────────────────────────────────── */
function ContentStrengthSection({ strength }) {
    const items = [
        {
            label: '팔로워 특징',
            value: strength.follower_traits,
            color: C.accent,
            bg: C.accentSoft,
        },
        {
            label: '발행 주기',
            value: strength.posting_frequency,
            color: C.blue,
            bg: C.blueSoft,
        },
        {
            label: '인게이지먼트',
            value: strength.engagement,
            color: C.green,
            bg: C.greenSoft,
        },
    ];

    return (
        <div style={{ padding: '24px 36px' }}>
            <SectionHeader title="콘텐츠 강점" color={C.green} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {items.map((item, i) => (
                    <div key={i} style={{
                        background: item.bg, borderRadius: '12px',
                        padding: '16px 14px', textAlign: 'center',
                        border: `1px solid ${item.color}18`,
                    }}>
                        <div style={{ fontSize: '11px', color: C.text4, marginBottom: '8px', fontWeight: 500 }}>
                            {item.label}
                        </div>
                        <div style={{
                            fontSize: '13px', fontWeight: 600, color: C.text2,
                            marginBottom: '6px', lineHeight: 1.4,
                        }}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   FR-06: 콘텐츠 유형 분포 (가로 바)
   ───────────────────────────────────────────── */
function ContentDistributionSection({ distribution }) {
    const maxPct = Math.max(...distribution.map((d) => d.percentage));
    return (
        <div style={{ padding: '24px 36px' }}>
            <SectionHeader title="콘텐츠 유형 분포" color={C.accent} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {distribution.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '12px', color: C.text3, width: '100px',
                            textAlign: 'right', flexShrink: 0, fontWeight: 500,
                        }}>
                            {item.type || item.label}
                        </span>
                        <div style={{
                            flex: 1, height: '26px', background: '#F3F4F6',
                            borderRadius: '8px', overflow: 'hidden', position: 'relative',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${(item.percentage / maxPct) * 100}%`,
                                minWidth: '24px',
                                background: `linear-gradient(90deg, ${C.bar[i % C.bar.length]}, ${C.bar[(i + 1) % C.bar.length]}CC)`,
                                borderRadius: '8px',
                                transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                paddingRight: '8px',
                            }}>
                                {item.percentage >= 15 && (
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                                        {item.percentage}%
                                    </span>
                                )}
                            </div>
                        </div>
                        {item.percentage < 15 && (
                            <span style={{
                                fontSize: '12px', fontWeight: 700, color: C.text2,
                                width: '36px', textAlign: 'right', flexShrink: 0,
                            }}>
                                {item.percentage}%
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   FR-07: 주요 토픽 & 키워드
   ───────────────────────────────────────────── */
function TopicKeywordsSection({ keywords }) {
    const colors = [C.accent, C.blue, C.green, C.pink, C.amber, '#6366F1'];
    return (
        <div style={{ padding: '24px 36px' }}>
            <SectionHeader title="주요 토픽 & 키워드" color={C.amber} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {keywords.map((kw, i) => {
                    const c = colors[i % colors.length];
                    return (
                        <span key={i} style={{
                            fontSize: '12px', fontWeight: 500,
                            padding: '6px 14px', borderRadius: '18px',
                            background: `${c}0C`, color: c,
                            border: `1px solid ${c}22`,
                            transition: 'all 0.2s',
                            cursor: 'default',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${c}18`; e.currentTarget.style.borderColor = `${c}40`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = `${c}0C`; e.currentTarget.style.borderColor = `${c}22`; }}
                        >
                            {kw}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   FR-09: 최고 성과 콘텐츠 상세 분석
   ───────────────────────────────────────────── */
function StatBadge({ label, value, icon }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 8px', background: '#ffffff',
            borderRadius: '10px', border: `1px solid ${C.border}`,
            flex: 1, minWidth: 0,
        }}>
            <div style={{ fontSize: '10px', color: C.text4, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {icon}
                {label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.text1 }}>
                {value != null && !isNaN(Number(value)) ? Number(value).toLocaleString() : (value ?? '-')}
            </div>
        </div>
    );
}

function TopContentAnalysisSection({ topContent, improvements, campaignPoints }) {
    return (
        <div style={{ padding: '24px 36px 36px' }}>
            <SectionHeader title="최고 성과 콘텐츠 상세 분석" color={C.accent} />
            <p style={{ fontSize: '12px', color: '#666666', margin: '-10px 0 14px 13px' }}>최근 30일 영상 콘텐츠 분석 요약</p>

            {/* 콘텐츠 정보 카드 */}
            <div style={{
                background: C.bg, borderRadius: '12px',
                padding: '16px', border: `1px solid ${C.border}`,
                marginBottom: '14px',
            }}>
                {/* 제목 + 메타 */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{
                        fontSize: '14px', fontWeight: 600, color: C.text1,
                        marginBottom: '6px', lineHeight: 1.5,
                    }}>
                        {topContent.title}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '10px', fontWeight: 600, padding: '3px 8px',
                            borderRadius: '5px', background: C.accentLight, color: C.accent,
                        }}>
                            {topContent.content_type}
                        </span>
                        <span style={{ fontSize: '11px', color: C.text4 }}>
                            {topContent.upload_date}
                        </span>
                        {topContent.url && (
                            <a
                                href={topContent.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    fontSize: '11px', fontWeight: 500, color: '#111111',
                                    textDecoration: 'none', marginLeft: 'auto',
                                    padding: '4px 10px', borderRadius: '6px',
                                    border: '1px solid #E0E0E0', background: '#ffffff',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#F5F5F5';
                                    e.currentTarget.style.borderColor = '#C0C0C0';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.borderColor = '#E0E0E0';
                                }}
                            >
                                원본 보기
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </a>
                        )}
                    </div>
                </div>

                {/* 수치 배지 4개 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    <StatBadge
                        label="좋아요"
                        value={topContent.likes}
                        icon={<svg width="10" height="10" viewBox="0 0 24 24" fill={C.pink} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
                    />
                    <StatBadge
                        label="댓글"
                        value={topContent.comments}
                        icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
                    />
                    <StatBadge
                        label="조회수"
                        value={topContent.views}
                        icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    />
                    <StatBadge
                        label="공유"
                        value={topContent.saves_shares}
                        icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>}
                    />
                </div>
            </div>

            {/* 시딩 캠페인 적용 포인트 */}
            {(topContent.campaign_points || campaignPoints)?.length > 0 && (
                <div style={{
                    background: C.blueSoft, borderRadius: '12px',
                    padding: '14px 16px', border: `1px solid ${C.blueLight}`,
                    marginBottom: '14px',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: C.blue, marginBottom: '8px' }}>
                        시딩 캠페인 적용 포인트
                    </div>
                    {(topContent.campaign_points || campaignPoints).map((point, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: '8px', alignItems: 'flex-start',
                            marginBottom: i < (topContent.campaign_points || campaignPoints).length - 1 ? '6px' : 0,
                        }}>
                            <span style={{
                                width: '18px', height: '18px', borderRadius: '5px',
                                background: C.blueLight, color: C.blue,
                                fontSize: '10px', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, marginTop: '1px',
                            }}>
                                {i + 1}
                            </span>
                            <span style={{ fontSize: '12px', color: '#1E40AF', lineHeight: 1.5 }}>
                                {point}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* 콘텐츠 최적화 개선안 (영상분석 스타일 우선순위 카드) */}
            {improvements && (() => {
                const groups = parseImprovementMarkdown(improvements);
                if (groups.length === 0) return null;
                return (
                    <div style={{ marginTop: '8px' }}>
                        <SectionHeader title="콘텐츠 최적화 개선안" color={C.amber} />
                        {groups.map((group, i) => (
                            <ImprovementSection key={i} group={group} />
                        ))}
                    </div>
                );
            })()}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   메인 모달
   ═══════════════════════════════════════════════ */
export function DeepAnalysisModal({ influencer, open, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || !influencer) return;
        setLoading(true);
        setError(null);
        fetchDeepAnalysisResult(influencer.id, influencer.platform)
            .then((result) => { setData(result); setLoading(false); })
            .catch((err) => { setError(err.message); setLoading(false); });
    }, [open, influencer]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
        <>
            {/* 오버레이 */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(4px)',
                    animation: 'daFadeIn 0.2s ease-out',
                }}
            />

            {/* 모달 */}
            <div
                className="deep-analysis-modal"
                style={{
                    position: 'fixed',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '94%', maxWidth: '860px',
                    maxHeight: '92vh',
                    background: '#ffffff',
                    borderRadius: '18px',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)',
                    zIndex: 1000,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'daSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
            >
                {/* 로딩 */}
                {loading && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '100px 20px',
                    }}>
                        <Loader2 style={{
                            width: '32px', height: '32px', color: C.accent,
                            animation: 'daSpin 1s linear infinite',
                        }} />
                        <p style={{ margin: '14px 0 0', fontSize: '14px', color: C.text4 }}>
                            심층 분석 데이터를 불러오는 중...
                        </p>
                    </div>
                )}

                {/* 에러 */}
                {error && !loading && (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <p style={{ fontSize: '14px', color: '#ef4444', marginBottom: '14px' }}>
                            분석 데이터를 불러오지 못했습니다
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 20px', borderRadius: '10px',
                                border: '1px solid #E0E0E0', background: '#fff',
                                fontSize: '13px', cursor: 'pointer',
                            }}
                        >
                            닫기
                        </button>
                    </div>
                )}

                {/* 10개 섹션 */}
                {data && !loading && (
                    <>
                        <ModalHeader data={{
                            influencerName: influencer.displayName,
                            platform: influencer.platform,
                            profileImage: influencer.profileImage,
                            analyzedAt: data.analyzed_at,
                        }} onClose={onClose} />

                        <div className="deep-analysis-scroll" style={{
                            flex: 1, overflowY: 'auto', overflowX: 'hidden',
                        }}>
                            {(() => {
                                const ov = data.deep_analysis?.overview || {};
                                const ca = data.deep_analysis?.content_analysis || {};
                                return (
                                    <>
                                        <SummarySection overview={ov} />
                                        <Divider />
                                        {ov.personas?.length > 0 && (<><PersonasSection personas={ov.personas} /><Divider /></>)}
                                        {ov.content_strength && (<><ContentStrengthSection strength={ov.content_strength} /><Divider /></>)}
                                        {ov.content_distribution?.length > 0 && (<><ContentDistributionSection distribution={ov.content_distribution} /><Divider /></>)}
                                        {ov.topic_keywords?.length > 0 && (<><TopicKeywordsSection keywords={ov.topic_keywords} /><Divider /></>)}
                                        <TopContentAnalysisSection
                                            topContent={{
                                                ...(ca.top_content || {}),
                                                // DB 컬럼 우선, JSONB 폴백
                                                url: data.top_content?.url || ca.top_content?.url,
                                                title: data.top_content?.caption || ca.top_content?.title,
                                                content_type: data.top_content?.type || ca.top_content?.content_type,
                                                likes: data.top_content?.likes ?? ca.top_content?.likes,
                                                comments: data.top_content?.comments ?? ca.top_content?.comments,
                                                views: data.top_content?.views ?? ca.top_content?.views,
                                                saves_shares: data.top_content?.shares ?? ca.top_content?.saves_shares,
                                                upload_date: data.top_content?.posted_at || ca.top_content?.upload_date,
                                            }}
                                            improvements={ca.improvement_markdown}
                                            campaignPoints={ov.campaign_points}
                                        />
                                    </>
                                );
                            })()}
                        </div>
                    </>
                )}
            </div>

            {/* 스타일 */}
            <style>{`
                @keyframes daFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes daSlideUp {
                    from { opacity: 0; transform: translate(-50%, -46%); }
                    to   { opacity: 1; transform: translate(-50%, -50%); }
                }
                @keyframes daSpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                .deep-analysis-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .deep-analysis-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .deep-analysis-scroll::-webkit-scrollbar-thumb {
                    background: #D0D0D0;
                    border-radius: 3px;
                }
                .deep-analysis-scroll::-webkit-scrollbar-thumb:hover {
                    background: #AAAAAA;
                }
            `}</style>
        </>
    );
}

function Divider() {
    return (
        <div style={{
            height: '1px', margin: '0 36px',
            background: 'linear-gradient(90deg, transparent, #E8E8E8 15%, #E8E8E8 85%, transparent)',
        }} />
    );
}
