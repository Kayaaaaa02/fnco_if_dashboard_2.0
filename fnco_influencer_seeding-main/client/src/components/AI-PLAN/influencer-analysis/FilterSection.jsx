import { useTranslation } from '../../../hooks/useTranslation.js';
import { useState } from 'react';

export function FilterSection({
    categories,
    contentTypes,
    selectedCategory,
    selectedContentType,
    onCategoryChange,
    onContentTypeChange,
    selectedInfluencers = [],
}) {
    const t = useTranslation();
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <>
            {/* 인플루언서 리스트 카테고리 */}
            <div
                style={{
                    marginBottom: '10px',
                }}
            >
                {/* 제목 */}
                <div className="flex items-center gap-2 mb-4">
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                        {t('aiPlan.influencerAnalysis.listTitle')}
                        <span
                            style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: selectedInfluencers.length > 0 ? '#7C3AED' : '#6B7280',
                                marginLeft: '8px',
                            }}
                        >
                            ({selectedInfluencers.length}
                            {t('aiPlan.influencerAnalysis.selectedCount')})
                        </span>
                    </h3>
                </div>

                {/* 카테고리 필터 */}
                <div>
                    <div className="flex gap-2 flex-wrap items-center">
                        {categories.map((category) => {
                            const isActive = selectedCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => onCategoryChange(category.id)}
                                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                                    style={{
                                        backgroundColor: isActive ? '#B9A8FF' : '#F3F4F6',
                                        color: isActive ? '#FFFFFF' : '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    {category.label} ({category.count})
                                </button>
                            );
                        })}
                        {/* 인플루언서 구분 기준 정보 */}
                        <div
                            style={{ position: 'relative', display: 'inline-block' }}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            <div
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: '#9CA3AF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: '#FFFFFF',
                                }}
                            >
                                ?
                            </div>
                            {showTooltip && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '28px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: '#374151',
                                        color: '#FFFFFF',
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        whiteSpace: 'nowrap',
                                        zIndex: 1000,
                                        boxShadow:
                                            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    }}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                                        {t('aiPlan.influencerAnalysis.influencerCategoryTooltip.title')}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div>{t('aiPlan.influencerAnalysis.influencerCategoryTooltip.mega')}</div>
                                        <div>{t('aiPlan.influencerAnalysis.influencerCategoryTooltip.macro')}</div>
                                        <div>{t('aiPlan.influencerAnalysis.influencerCategoryTooltip.micro')}</div>
                                    </div>
                                    {/* 말풍선 꼬리 */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '-6px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '0',
                                            height: '0',
                                            borderLeft: '6px solid transparent',
                                            borderRight: '6px solid transparent',
                                            borderBottom: '6px solid #374151',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 콘텐츠 유형별 필터 */}
            <div
                style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#F9F5FF',
                    padding: '20px',
                    marginBottom: '20px',
                }}
            >
                {/* 콘텐츠 유형별 필터 */}
                <div className="mb-4">
                    <p
                        className="text-sm font-medium mb-3 flex items-center gap-2"
                        style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}
                    >
                        <span style={{ fontSize: '16px' }}>📹</span>
                        {t('aiPlan.influencerAnalysis.contentTypeFilter')}
                    </p>
                    <div className="flex gap-2 flex-wrap" style={{ marginTop: '8px' }}>
                        {contentTypes.map((type) => {
                            const isActive = selectedContentType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => onContentTypeChange(type.id)}
                                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                                    style={{
                                        backgroundColor: isActive ? '#B9A8FF' : '#FFFFFF',
                                        color: isActive ? '#FFFFFF' : '#374151',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        border: isActive ? 'none' : '1px solid #E5E7EB',
                                    }}
                                >
                                    {type.label} ({type.count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                <p className="text-sm" style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                    {t('aiPlan.influencerAnalysis.filterDescription')}
                </p>
            </div>
        </>
    );
}
