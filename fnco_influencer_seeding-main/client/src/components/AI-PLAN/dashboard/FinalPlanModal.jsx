import { useState } from 'react';
import { ArrowRight, Sparkles, FileText, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '../../ui/dialog.jsx';
import { useTranslation } from '../../../hooks/useTranslation.js';
import { useAppDispatch } from '../../../store/hooks.js';
import { setRegion } from '../../../store/slices/i18nSlice.js';

// target_lang → 표시 라벨
const TARGET_LANG_LABELS = { ko: '한국어', eng: '영어', cn: '중국어' };
function getTargetLangLabel(targetLang) {
    if (!targetLang) return '-';
    return TARGET_LANG_LABELS[targetLang] ?? targetLang;
}

// 언어 선택 시 Redux region (LanguageRegionSelect와 동일)
const LANG_TO_REGION = { ko: 'korea', eng: 'global', cn: 'china' };

const langBtnBase = {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#4B5563',
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};
const langBtnSelected = {
    ...langBtnBase,
    borderColor: '#B9A8FF',
    background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    color: '#6D28D9',
    boxShadow: '0 1px 3px rgba(147, 51, 234, 0.15)',
};

function formatPlanDate(value) {
    if (value == null) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
}

// 기본 선택: 왼쪽 옵션 (eng → 영어, cn → 중국어, ko → 한국어)
function getDefaultRegionForPlan(plan) {
    return LANG_TO_REGION[plan.target_lang] ?? 'korea';
}

export function FinalPlanModal({ open, onOpenChange, plans = [], loading = false, onContinueWorking, onRefetchList }) {
    const t = useTranslation();
    const dispatch = useAppDispatch();
    // 행별로 선택한 언어(region). 없으면 기본값(왼쪽 버튼) 사용
    const [selectedRegionByPlanDocId, setSelectedRegionByPlanDocId] = useState({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [removingId, setRemovingId] = useState(null);

    const getEffectiveRegion = (plan) => selectedRegionByPlanDocId[plan.plan_doc_id] ?? getDefaultRegionForPlan(plan);

    const handleLanguageSelect = (plan, region) => {
        setSelectedRegionByPlanDocId((prev) => ({ ...prev, [plan.plan_doc_id]: region }));
    };

    const handleContinueWorking = (plan) => {
        const region = getEffectiveRegion(plan);
        dispatch(setRegion(region));
        if (onContinueWorking) onContinueWorking(plan);
        onOpenChange(false);
    };

    const handleDeleteClick = (plan) => {
        setItemToDelete(plan);
        setDeleteConfirmOpen(true);
    };

    const handleCancelDelete = () => {
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            setRemovingId(itemToDelete.plan_doc_id);

            const response = await fetch('/api/ai-plan/unmark-selected', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_doc_id: itemToDelete.plan_doc_id }),
            });

            if (!response.ok) {
                throw new Error('Failed to remove plan');
            }

            const data = await response.json();
            if (data?.success) {
                // 부모 컴포넌트에 목록 새로고침 요청
                if (typeof onRefetchList === 'function') {
                    await onRefetchList();
                }
            }
        } catch (error) {
            console.error('Failed to remove plan:', error);
        } finally {
            setRemovingId(null);
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        }
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
                                    backgroundColor: '#F3E8FF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Sparkles className="w-5 h-5" style={{ color: '#8B5CF6' }} />
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
                                    {t('aiPlan.dashboard.finalPlanModalTitle')}
                                </h2>
                                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                    {t('aiPlan.dashboard.finalPlanModalSubtitle')}
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
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '14px' }}>
                                {t('aiPlan.dashboard.loading')}
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
                            plans.map((plan) => (
                                <div
                                    key={plan.plan_doc_id || plan.product_name}
                                    style={{
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        backgroundColor: 'white',
                                        position: 'relative',
                                    }}
                                >
                                    <button
                                        onClick={() => handleDeleteClick(plan)}
                                        disabled={removingId === plan.plan_doc_id}
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
                                            cursor: removingId === plan.plan_doc_id ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'background-color 0.15s, color 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (removingId !== plan.plan_doc_id) {
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
                                    <h3
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            color: '#111827',
                                            marginBottom: '8px',
                                            paddingRight: '40px',
                                        }}
                                    >
                                        {plan.product_name || plan.productName || '-'}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            color: '#6B7280',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <FileText className="w-4 h-4" style={{ color: '#9CA3AF', flexShrink: 0 }} />
                                        <span>{plan.brand_cd || plan.brand || '-'}</span>
                                        <span style={{ color: '#D1D5DB' }}>·</span>
                                        <span>{plan.category || '-'}</span>
                                        <span style={{ color: '#D1D5DB' }}>·</span>
                                        <span>{formatPlanDate(plan.created_dt)}</span>
                                    </p>
                                    <div
                                        style={{
                                            borderTop: '1px solid #E5E7EB',
                                            marginTop: '12px',
                                            marginBottom: '12px',
                                        }}
                                    />
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '12px',
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: '14px',
                                                color: '#6B7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                flexWrap: 'wrap',
                                                flex: 1,
                                            }}
                                        >
                                            <span>
                                                {t('aiPlan.dashboard.creator')}: {plan.user_nm || '-'}
                                            </span>
                                            <span style={{ color: '#D1D5DB' }}>|</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {t('aiPlan.dashboard.language')}:
                                                {plan.target_lang === 'eng' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLanguageSelect(plan, 'global')}
                                                            style={
                                                                getEffectiveRegion(plan) === 'global'
                                                                    ? langBtnSelected
                                                                    : langBtnBase
                                                            }
                                                            onMouseEnter={(e) => {
                                                                if (getEffectiveRegion(plan) !== 'global') {
                                                                    e.currentTarget.style.background = '#F9FAFB';
                                                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (getEffectiveRegion(plan) !== 'global') {
                                                                    e.currentTarget.style.background = '#fff';
                                                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                                                }
                                                            }}
                                                        >
                                                            영어
                                                        </button>
                                                        <span
                                                            style={{
                                                                color: '#D1D5DB',
                                                                fontSize: '12px',
                                                                margin: '0 2px',
                                                            }}
                                                        >
                                                            OR
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLanguageSelect(plan, 'korea')}
                                                            style={
                                                                getEffectiveRegion(plan) === 'korea'
                                                                    ? langBtnSelected
                                                                    : langBtnBase
                                                            }
                                                            onMouseEnter={(e) => {
                                                                if (getEffectiveRegion(plan) !== 'korea') {
                                                                    e.currentTarget.style.background = '#F9FAFB';
                                                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (getEffectiveRegion(plan) !== 'korea') {
                                                                    e.currentTarget.style.background = '#fff';
                                                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                                                }
                                                            }}
                                                        >
                                                            한국어
                                                        </button>
                                                    </>
                                                )}
                                                {plan.target_lang === 'cn' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLanguageSelect(plan, 'china')}
                                                            style={
                                                                getEffectiveRegion(plan) === 'china'
                                                                    ? langBtnSelected
                                                                    : langBtnBase
                                                            }
                                                            onMouseEnter={(e) => {
                                                                if (getEffectiveRegion(plan) !== 'china') {
                                                                    e.currentTarget.style.background = '#F9FAFB';
                                                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (getEffectiveRegion(plan) !== 'china') {
                                                                    e.currentTarget.style.background = '#fff';
                                                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                                                }
                                                            }}
                                                        >
                                                            중국어
                                                        </button>
                                                        <span
                                                            style={{
                                                                color: '#D1D5DB',
                                                                fontSize: '12px',
                                                                margin: '0 2px',
                                                            }}
                                                        >
                                                            OR
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLanguageSelect(plan, 'korea')}
                                                            style={
                                                                getEffectiveRegion(plan) === 'korea'
                                                                    ? langBtnSelected
                                                                    : langBtnBase
                                                            }
                                                            onMouseEnter={(e) => {
                                                                if (getEffectiveRegion(plan) !== 'korea') {
                                                                    e.currentTarget.style.background = '#F9FAFB';
                                                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (getEffectiveRegion(plan) !== 'korea') {
                                                                    e.currentTarget.style.background = '#fff';
                                                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                                                }
                                                            }}
                                                        >
                                                            한국어
                                                        </button>
                                                    </>
                                                )}
                                                {(plan.target_lang === 'ko' || !plan.target_lang) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleLanguageSelect(plan, 'korea')}
                                                        style={
                                                            getEffectiveRegion(plan) === 'korea'
                                                                ? langBtnSelected
                                                                : langBtnBase
                                                        }
                                                        onMouseEnter={(e) => {
                                                            if (getEffectiveRegion(plan) !== 'korea') {
                                                                e.currentTarget.style.background = '#F9FAFB';
                                                                e.currentTarget.style.borderColor = '#D1D5DB';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (getEffectiveRegion(plan) !== 'korea') {
                                                                e.currentTarget.style.background = '#fff';
                                                                e.currentTarget.style.borderColor = '#E5E7EB';
                                                            }
                                                        }}
                                                    >
                                                        한국어
                                                    </button>
                                                )}
                                            </span>
                                        </p>
                                        <button
                                            onClick={() => handleContinueWorking(plan)}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '12px 24px',
                                                background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '10px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.45)';
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.35)';
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)';
                                            }}
                                        >
                                            {t('aiPlan.dashboard.continueWorking')}
                                            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            ))
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
                        maxWidth: '400px',
                        padding: 0,
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                        }}
                    >
                        <h3
                            style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#111827',
                                textAlign: 'center',
                            }}
                        >
                            {t('aiPlan.dashboard.confirmDelete')}
                        </h3>
                        <p
                            style={{
                                fontSize: '14px',
                                color: '#6B7280',
                                textAlign: 'center',
                                lineHeight: '1.5',
                            }}
                        >
                            {t('aiPlan.dashboard.confirmDeletePlanMessage')}
                        </p>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            borderTop: '1px solid #E5E7EB',
                        }}
                    >
                        <button
                            onClick={handleCancelDelete}
                            style={{
                                flex: 1,
                                padding: '16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#6B7280',
                                backgroundColor: '#F9FAFB',
                                border: 'none',
                                borderRight: '1px solid #E5E7EB',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F3F4F6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                            }}
                        >
                            {t('aiPlan.dashboard.cancel')}
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            style={{
                                flex: 1,
                                padding: '16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#DC2626',
                                backgroundColor: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEF2F2';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff';
                            }}
                        >
                            {t('aiPlan.dashboard.delete')}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
