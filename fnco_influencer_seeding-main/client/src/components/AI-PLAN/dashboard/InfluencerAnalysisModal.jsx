import { useState } from 'react';
import { CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '../../ui/dialog.jsx';
import { useTranslation, useLanguage } from '../../../hooks/useTranslation.js';

export function InfluencerAnalysisModal({
    open,
    onOpenChange,
    plans = [],
    loading = false,
    apiBase = '',
    user = null,
    onRemoved,
    onRefetchList,
}) {
    const t = useTranslation();
    const language = useLanguage();
    const [removingId, setRemovingId] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // 콘텐츠 유형 한글 -> 영문/중문 매핑
    const contentTypeMapping = {
        GRWM: 'grwm',
        루틴: 'routine',
        '일상/브이로그': 'daily',
        '리뷰/튜토리얼': 'review',
        정보형: 'info',
        ASMR: 'asmr',
        추천템: 'recommend',
        '하울/언박싱': 'haul',
        비포앤에프터: 'beforeafter',
    };

    // 콘텐츠 유형을 현재 언어로 번역
    const translateContentType = (type) => {
        const key = contentTypeMapping[type];
        if (key) {
            return t(`aiPlan.influencerAnalysis.contentTypes.${key}`);
        }
        return type; // 매핑되지 않은 경우 원본 반환
    };

    // 팔로워 수를 K 단위로 포맷
    const formatFollowers = (count) => {
        if (!count) return '0';
        const num = typeof count === 'string' ? parseFloat(count.replace(/,/g, '')) : count;
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    // 조회수를 포맷 (K, M 단위)
    const formatViews = (count) => {
        if (!count) return '0';
        const num = typeof count === 'string' ? parseFloat(count.replace(/,/g, '')) : count;
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return Math.round(num).toLocaleString();
    };

    // 날짜 포맷 (YYYY-MM-DD)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date
                .toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                })
                .replace(/\. /g, '-')
                .replace('.', '');
        } catch {
            return '-';
        }
    };

    const handleRemove = async (item) => {
        const profileId = item?.id != null ? String(item.id) : '';
        if (!apiBase || !profileId) return;
        setRemovingId(profileId);
        try {
            const updatedBy = user?.user_id ?? user?.name ?? user?.email ?? 'unknown';
            const res = await fetch(`${apiBase}/influencer/unmark-selected`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_ids: [profileId], updated_by: updatedBy }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                console.error('[인플루언서 저장 해제]', data?.error || data?.details || res.status);
                return;
            }
            if (data?.success) {
                if (typeof onRefetchList === 'function') {
                    await onRefetchList();
                } else if (typeof onRemoved === 'function') {
                    onRemoved(profileId);
                }
            }
        } catch (err) {
            console.error('[인플루언서 저장 해제]', err);
        } finally {
            setRemovingId(null);
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteConfirmOpen(true);
    };

    const handleCancelDelete = () => {
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            handleRemove(itemToDelete);
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case '메가':
            case 'Mega':
            case '头部':
                return { bg: '#EDE9FE', text: '#7C3AED' };
            case '매크로':
            case 'Macro':
            case '腰部':
                return { bg: '#DBEAFE', text: '#2563EB' };
            case '마이크로':
            case 'Micro':
            case '尾部':
                return { bg: '#D1FAE5', text: '#059669' };
            default:
                return { bg: '#F3F4F6', text: '#4B5563' };
        }
    };

    const getCategoryTranslation = (category) => {
        if (category === '메가' || category === 'Mega' || category === '头部') {
            return t('aiPlan.dashboard.categoryMega');
        } else if (category === '매크로' || category === 'Macro' || category === '腰部') {
            return t('aiPlan.dashboard.categoryMacro');
        } else if (category === '마이크로' || category === 'Micro' || category === '尾部') {
            return t('aiPlan.dashboard.categoryMicro');
        }
        return category;
    };

    // 플랫폼 표시명 및 파스텔 배경색 (InfluencerCard와 동일)
    const platformLabel = (platform) => {
        const p = (platform || 'instagram').toString().toLowerCase();
        if (p === 'youtube') return 'YouTube';
        if (p === 'tiktok') return 'TikTok';
        return 'Instagram';
    };
    const getPlatformStyle = (platform) => {
        const p = (platform || 'instagram').toString().toLowerCase();
        if (p === 'youtube') return { backgroundColor: '#FECACA', color: '#B91C1C' };
        if (p === 'tiktok') return { backgroundColor: '#E5E7EB', color: '#374151' };
        return { backgroundColor: '#FBCFE8', color: '#9D174D' };
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    style={{
                        maxWidth: '800px',
                        width: '90%',
                        maxHeight: '90vh',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            padding: '24px',
                            borderBottom: '1px solid #E5E7EB',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '8px',
                                    backgroundColor: '#D1FAE5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />
                            </div>
                            <div>
                                <h2
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color: '#111827',
                                        marginBottom: '2px',
                                    }}
                                >
                                    {t('aiPlan.dashboard.influencerAnalysisModalTitle')}
                                </h2>
                                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                    {t('aiPlan.dashboard.influencerAnalysisModalSubtitle')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                        }}
                    >
                        {loading ? (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '40px',
                                    color: '#6B7280',
                                    fontSize: '14px',
                                }}
                            >
                                {t('aiPlan.dashboard.loading') || 'Loading...'}
                            </div>
                        ) : plans.length === 0 ? (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '40px',
                                    color: '#6B7280',
                                    fontSize: '14px',
                                }}
                            >
                                {t('aiPlan.dashboard.noData')}
                            </div>
                        ) : (
                            plans.map((item) => {
                                const categoryColor = getCategoryColor(item.category);
                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            position: 'relative',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            backgroundColor: '#FFFFFF',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                            transition: 'box-shadow 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(item)}
                                            disabled={removingId === String(item.id)}
                                            title={t('aiPlan.dashboard.removeFromSaved') || 'Remove from saved'}
                                            style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                border: '1px solid #E5E7EB',
                                                backgroundColor: '#FFFFFF',
                                                color: '#6B7280',
                                                cursor: removingId === String(item.id) ? 'wait' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'background-color 0.15s, color 0.15s',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (removingId !== String(item.id)) {
                                                    e.currentTarget.style.backgroundColor = '#FEE2E2';
                                                    e.currentTarget.style.color = '#DC2626';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                                e.currentTarget.style.color = '#6B7280';
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '16px',
                                            }}
                                        >
                                            {item.profileImage && (
                                                <img
                                                    src={item.profileImage}
                                                    alt=""
                                                    style={{
                                                        width: '90px',
                                                        height: '200px',
                                                        borderRadius: '12px',
                                                        objectFit: 'cover',
                                                        border: '1px solid #E5E7EB',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        flexWrap: 'wrap',
                                                        marginBottom: '6px',
                                                    }}
                                                >
                                                    <h3
                                                        style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            color: '#111827',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {item.name || '-'}
                                                    </h3>
                                                    <span
                                                        style={{
                                                            backgroundColor: categoryColor.bg,
                                                            color: categoryColor.text,
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        {getCategoryTranslation(item.category)}
                                                    </span>
                                                    <span
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '500',
                                                            ...getPlatformStyle(item.platform),
                                                        }}
                                                    >
                                                        {platformLabel(item.platform)}
                                                    </span>
                                                    {item.profileUrl && (
                                                        <a
                                                            href={item.profileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '13px',
                                                                color: '#6366f1',
                                                                fontWeight: '500',
                                                                textDecoration: 'none',
                                                                transition: 'color 0.15s ease',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.color = '#4f46e5';
                                                                e.currentTarget.style.textDecoration = 'underline';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.color = '#6366f1';
                                                                e.currentTarget.style.textDecoration = 'none';
                                                            }}
                                                        >
                                                            {t('aiPlan.influencerAnalysis.openProfile')}
                                                            <ExternalLink
                                                                className="w-4 h-4"
                                                                style={{ flexShrink: 0 }}
                                                            />
                                                        </a>
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '8px',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            gap: '16px',
                                                            flexWrap: 'wrap',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '13px',
                                                            }}
                                                        >
                                                            <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                                                {t('aiPlan.dashboard.followers')} :
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color: '#374151',
                                                                    fontWeight: '700',
                                                                    fontSize: '14px',
                                                                }}
                                                            >
                                                                {formatFollowers(item.followers)}
                                                            </span>
                                                        </div>
                                                        <span style={{ color: '#D1D5DB', fontWeight: '400' }}>/</span>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '13px',
                                                            }}
                                                        >
                                                            <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                                                {t('aiPlan.dashboard.totalPosts')} :
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color: '#374151',
                                                                    fontWeight: '700',
                                                                    fontSize: '14px',
                                                                }}
                                                            >
                                                                {item.posts != null
                                                                    ? Number(item.posts).toLocaleString()
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            fontSize: '13px',
                                                        }}
                                                    >
                                                        <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                                            {t('aiPlan.dashboard.recentUploads')} :
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontWeight: '700',
                                                                fontSize: '14px',
                                                            }}
                                                        >
                                                            {item.recentPostsCount || 0}
                                                        </span>
                                                        <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                                            {t('aiPlan.dashboard.recentUploadsCount')}
                                                        </span>
                                                    </div>

                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            gap: '16px',
                                                            flexWrap: 'wrap',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '13px',
                                                            }}
                                                        >
                                                            <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                                                {t('aiPlan.dashboard.avgEngagementLast10Days')} :
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color: '#374151',
                                                                    fontWeight: '700',
                                                                    fontSize: '14px',
                                                                }}
                                                            >
                                                                {item.engagementRate != null
                                                                    ? `${Math.round(Number(item.engagementRate))}${t(
                                                                          'aiPlan.dashboard.engagementCount'
                                                                      )}`
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                        <span style={{ color: '#D1D5DB', fontWeight: '400' }}>/</span>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '13px',
                                                            }}
                                                        >
                                                            <span style={{ color: '#6B7280', fontWeight: '500' }}>
                                                                {t('aiPlan.dashboard.avgViews')} :
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color: '#374151',
                                                                    fontWeight: '600',
                                                                }}
                                                            >
                                                                {formatViews(item.avgViews)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: '12px',
                                                            color: '#9CA3AF',
                                                            fontWeight: '500',
                                                            marginTop: '2px',
                                                        }}
                                                    >
                                                        {t('aiPlan.dashboard.dataCollectionDate')} :{' '}
                                                        {formatDate(item.updatedAt)}
                                                    </div>
                                                </div>
                                                {Array.isArray(item.contentTypes) && item.contentTypes.length > 0 && (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: '6px',
                                                            marginTop: '10px',
                                                        }}
                                                    >
                                                        {item.contentTypes.map((type, idx) => (
                                                            <span
                                                                key={idx}
                                                                style={{
                                                                    backgroundColor: '#EEF2FF',
                                                                    color: '#4338ca',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '500',
                                                                }}
                                                            >
                                                                {translateContentType(type)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {(language === 'ko'
                                                    ? item.quickSummary
                                                    : item.quickSummaryEng || item.quickSummary) && (
                                                    <p
                                                        style={{
                                                            fontSize: '13px',
                                                            color: '#4B5563',
                                                            marginTop: '12px',
                                                            marginBottom: 0,
                                                            lineHeight: 1.55,
                                                            paddingTop: '12px',
                                                            borderTop: '1px solid #E5E7EB',
                                                        }}
                                                    >
                                                        {language === 'ko'
                                                            ? item.quickSummary
                                                            : item.quickSummaryEng || item.quickSummary}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div
                        style={{
                            padding: '20px 24px',
                            borderTop: '1px solid #E5E7EB',
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <button
                            onClick={() => onOpenChange(false)}
                            style={{
                                padding: '10px 24px',
                                backgroundColor: '#F3F4F6',
                                color: '#374151',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#E5E7EB';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#F3F4F6';
                            }}
                        >
                            {t('aiPlan.dashboard.close')}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent
                    style={{
                        maxWidth: '480px',
                        padding: '32px',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <h3
                            style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#111827',
                                marginBottom: '12px',
                            }}
                        >
                            {t('aiPlan.dashboard.confirmDelete')}
                        </h3>
                        <p
                            style={{
                                fontSize: '15px',
                                color: '#374151',
                                marginBottom: '28px',
                                lineHeight: '1.6',
                            }}
                        >
                            {t('aiPlan.dashboard.confirmDeleteMessage')}
                        </p>
                        {itemToDelete && (
                            <div
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '24px',
                                    textAlign: 'left',
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#111827',
                                        marginBottom: '4px',
                                    }}
                                >
                                    {itemToDelete.name || '-'}
                                </p>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                                    {t('aiPlan.dashboard.followers')}: {formatFollowers(itemToDelete.followers)}
                                </p>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={handleCancelDelete}
                                disabled={removingId !== null}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    backgroundColor: '#FFFFFF',
                                    color: '#374151',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: removingId !== null ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (removingId === null) {
                                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }}
                            >
                                {t('aiPlan.dashboard.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={removingId !== null}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    backgroundColor: removingId !== null ? '#FCA5A5' : '#DC2626',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: removingId !== null ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: removingId !== null ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (removingId === null) {
                                        e.currentTarget.style.backgroundColor = '#B91C1C';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (removingId === null) {
                                        e.currentTarget.style.backgroundColor = '#DC2626';
                                    }
                                }}
                            >
                                {removingId !== null ? t('aiPlan.dashboard.loading') : t('aiPlan.dashboard.delete')}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
