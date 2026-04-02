import { useState } from 'react';
import { RotateCcw, CheckCircle2, X, Info } from 'lucide-react';
import {
    CREATOR_TYPE_OPTIONS,
    PLATFORM_OPTIONS,
    CHANNEL_SIZE_OPTIONS,
    HIDDEN_GEM_OPTIONS,
    COUNTRY_OPTIONS,
    HUB_STATUS_OPTIONS,
    ANALYSIS_STATUS_OPTIONS,
} from './constants';

function PillSelect({ label, tooltip, options, value, onChange }) {
    const [open, setOpen] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const selected = options.find((o) => o.value === value) || options[0];
    const isActive = value !== 'all';

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
                style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#111111',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                }}
            >
                {label}
                {tooltip && (
                    <span
                        style={{ position: 'relative', display: 'inline-flex' }}
                        onMouseEnter={() => setShowTip(true)}
                        onMouseLeave={() => setShowTip(false)}
                    >
                        <Info size={12} style={{ color: '#888888' }} />
                        {showTip && (
                            <span
                                style={{
                                    position: 'absolute',
                                    bottom: 'calc(100% + 6px)',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    padding: '6px 10px',
                                    background: '#222222',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 400,
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                    zIndex: 20,
                                    pointerEvents: 'none',
                                }}
                            >
                                {tooltip}
                            </span>
                        )}
                    </span>
                )}
            </span>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: isActive ? '1.5px solid #111111' : '1px solid #E8E8E8',
                    background: isActive ? '#F5F5F5' : '#ffffff',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#111111' : '#666666',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = '#C0C0C0';
                }}
                onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = '#E8E8E8';
                }}
            >
                <span>{selected.label}</span>
                <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    style={{
                        opacity: 0.4,
                        transition: 'transform 0.2s',
                        transform: open ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                >
                    <path
                        d="M1 1L5 5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            minWidth: '150px',
                            background: '#ffffff',
                            border: '1px solid #E8E8E8',
                            borderRadius: '8px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                            zIndex: 11,
                            padding: '4px',
                        }}
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: value === opt.value ? '#F5F5F5' : 'transparent',
                                    fontSize: '12px',
                                    fontWeight: value === opt.value ? 600 : 400,
                                    color: '#222222',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#F5F5F5';
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {opt.color && opt.value !== 'all' && (
                                    <span
                                        style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: opt.color,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                <span>{opt.label}</span>
                                {value === opt.value && (
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        <path
                                            d="M2 6L5 9L10 3"
                                            stroke="#111111"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function Divider() {
    return <div style={{ width: '1px', height: '18px', background: '#E8E8E8', margin: '0 2px', flexShrink: 0 }} />;
}

export function InfluencerPoolFilter({
    filters,
    onFilterChange,
    activeFilterCount,
    onReset,
    totalCount,
    resultCount,
    selectedCount = 0,
    selectionMode = null, // 'confirm' | 'cancel' | null
    onConfirmHub,
    onCancelHub,
    onClearSelection,
    dynamicOptions = {},
}) {
    const platformOpts = dynamicOptions.platformOptions || PLATFORM_OPTIONS;
    const channelSizeOpts = dynamicOptions.channelSizeOptions || CHANNEL_SIZE_OPTIONS;
    const countryOpts = dynamicOptions.countryOptions || COUNTRY_OPTIONS;
    const isCancel = selectionMode === 'cancel';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: '100%' }}>
            {/* 크리에이터 */}
            <PillSelect
                label="크리에이터"
                options={CREATOR_TYPE_OPTIONS}
                value={filters.creatorType}
                onChange={(v) => onFilterChange('creatorType', v)}
            />

            <Divider />

            {/* 플랫폼 */}
            <PillSelect
                label="플랫폼"
                options={platformOpts}
                value={filters.platform}
                onChange={(v) => onFilterChange('platform', v)}
            />

            {/* 채널 규모 */}
            <PillSelect
                label="채널규모"
                options={channelSizeOpts}
                value={filters.channelSize}
                onChange={(v) => onFilterChange('channelSize', v)}
            />

            <Divider />

            {/* 사용언어 */}
            <PillSelect
                label="사용언어"
                options={countryOpts}
                value={filters.country}
                onChange={(v) => onFilterChange('country', v)}
            />

            {/* Hidden GEM */}
            <PillSelect
                label="Hidden GEM"
                options={HIDDEN_GEM_OPTIONS}
                value={filters.hiddenGem}
                onChange={(v) => onFilterChange('hiddenGem', v)}
            />

            <Divider />

            {/* 심층 분석 */}
            <PillSelect
                label="심층분석"
                tooltip="최근 30일 간 업로드한 콘텐츠의 특징&페르소나 AI 분석"
                options={ANALYSIS_STATUS_OPTIONS}
                value={filters.analysisStatus}
                onChange={(v) => onFilterChange('analysisStatus', v)}
            />

            {/* 필터 초기화 */}
            {activeFilterCount > 0 && (
                <button
                    onClick={onReset}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #E0E0E0',
                        background: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#888888',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F5F5F5';
                        e.currentTarget.style.color = '#111111';
                        e.currentTarget.style.borderColor = '#C0C0C0';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.color = '#888888';
                        e.currentTarget.style.borderColor = '#E0E0E0';
                    }}
                >
                    <RotateCcw style={{ width: '10px', height: '10px' }} />
                    초기화
                </button>
            )}

            {/* 오른쪽: 선택/확정 + 결과 수 */}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedCount > 0 && (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 6px 4px 10px',
                                borderRadius: 8,
                                background: isCancel ? '#fef2f2' : '#eef2ff',
                                border: isCancel ? '1px solid #fca5a5' : '1px solid #c7d2fe',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span style={{ fontSize: 12, fontWeight: 600, color: isCancel ? '#ef4444' : '#4f46e5' }}>
                                {selectedCount}명 선택
                            </span>
                            <button
                                onClick={onClearSelection}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: isCancel ? '#fca5a5' : '#a5b4fc',
                                    padding: '2px',
                                    display: 'flex',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = isCancel ? '#ef4444' : '#6366f1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = isCancel ? '#fca5a5' : '#a5b4fc';
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                        <button
                            onClick={isCancel ? onCancelHub : onConfirmHub}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 14px',
                                borderRadius: 8,
                                whiteSpace: 'nowrap',
                                background: isCancel ? '#ffffff' : '#111111',
                                color: isCancel ? '#ef4444' : '#ffffff',
                                border: isCancel ? '1px solid #fca5a5' : 'none',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                if (isCancel) {
                                    e.currentTarget.style.background = '#fef2f2';
                                    e.currentTarget.style.borderColor = '#ef4444';
                                } else {
                                    e.currentTarget.style.background = '#333333';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (isCancel) {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.borderColor = '#fca5a5';
                                } else {
                                    e.currentTarget.style.background = '#111111';
                                }
                            }}
                        >
                            {isCancel ? <X size={13} /> : <CheckCircle2 size={13} />}
                            {isCancel ? '허브 대상 취소' : '허브 대상 확정'}
                        </button>
                        <div style={{ width: 1, height: 20, background: '#E0E0E0' }} />
                    </>
                )}

                {/* 결과 수 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 14px',
                        background: '#EBF5FF',
                        borderRadius: '8px',
                        border: '1px solid #BFDBFE',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#3B82F6' }}>전체</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1D4ED8' }}>
                        {totalCount.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#3B82F6' }}>명 중 결과</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1D4ED8' }}>
                        {resultCount.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#3B82F6' }}>명</span>
                </div>
            </div>
        </div>
    );
}
