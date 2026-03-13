import { useState } from 'react';
import { Save, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation.js';

export function GeneratedImages({ activeStep, images, selectedImages, onImageSelect, onSave }) {
    const t = useTranslation();
    const [previewId, setPreviewId] = useState(null);

    const selectedList = images.filter((img) => selectedImages.includes(img.id));
    const currentIndex = selectedList.findIndex((img) => img.id === previewId);
    const previewIndex = currentIndex >= 0 ? currentIndex : 0;
    // 선택된 이미지만 미리보기에 표시
    const previewImage =
        (previewId && selectedImages.includes(previewId) && images.find((img) => img.id === previewId)) ||
        selectedList[previewIndex] ||
        null;
    if (images.length === 0) {
        return (
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6B7280',
                }}
            >
                <p style={{ fontSize: '14px' }}>{t('aiPlan.aiImageGeneration.noImagesMessage')}</p>
            </div>
        );
    }

    return (
        <div
            style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
            }}
        >
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
            >
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {t('aiPlan.aiImageGeneration.generatedImages')}
                    {activeStep != null && ` (STEP ${activeStep})`}
                </h3>
                <button
                    onClick={onSave}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#7C3AED',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#6D28D9';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#7C3AED';
                    }}
                >
                    <Save className="w-4 h-4" />
                    {t('aiPlan.aiImageGeneration.save')}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {images.map((image) => {
                    const isSelected = selectedImages.includes(image.id);
                    return (
                        <div
                            key={image.id}
                            onClick={() => {
                                const willBeSelected = !isSelected;
                                onImageSelect(image.id);

                                if (willBeSelected) {
                                    // 선택: 해당 이미지를 미리보기에 표시
                                    setPreviewId(image.id);
                                } else {
                                    // 해제: 미리보기를 다른 선택된 이미지로 변경 (없으면 null)
                                    const remainingSelected = selectedImages.filter((id) => id !== image.id);
                                    if (remainingSelected.length > 0) {
                                        // 남은 선택된 이미지 중 첫 번째를 미리보기로
                                        setPreviewId(remainingSelected[0]);
                                    } else {
                                        // 선택된 이미지가 없으면 미리보기 제거
                                        setPreviewId(null);
                                    }
                                }
                            }}
                            style={{
                                position: 'relative',
                                aspectRatio: '9/16',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: isSelected ? '3px solid #B9A8FF' : '1px solid #E5E7EB',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#D1C4FF';
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }
                            }}
                        >
                            <img
                                src={image.url}
                                alt={`Generated ${image.id}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            {isSelected && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: '#B9A8FF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                    }}
                                >
                                    <CheckCircle2 className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 선택 이미지 크게 미리보기 */}
            {selectedList.length > 0 && previewImage && (
                <div
                    style={{
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '1px solid #E5E7EB',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                        }}
                    >
                        {selectedList.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const prevIdx = previewIndex <= 0 ? selectedList.length - 1 : previewIndex - 1;
                                    setPreviewId(selectedList[prevIdx].id);
                                }}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: '#FFFFFF',
                                    color: '#6B7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F5F3FF';
                                    e.currentTarget.style.borderColor = '#B9A8FF';
                                    e.currentTarget.style.color = '#7C3AED';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.color = '#6B7280';
                                }}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div
                            style={{
                                maxWidth: '400px',
                                aspectRatio: '9/16',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '2px solid #B9A8FF',
                                backgroundColor: '#F9FAFB',
                            }}
                        >
                            {previewImage && (
                                <img
                                    src={previewImage.url}
                                    alt={`Preview ${previewImage.id}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            )}
                        </div>
                        {selectedList.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const nextIdx = previewIndex >= selectedList.length - 1 ? 0 : previewIndex + 1;
                                    setPreviewId(selectedList[nextIdx].id);
                                }}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: '#FFFFFF',
                                    color: '#6B7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F5F3FF';
                                    e.currentTarget.style.borderColor = '#B9A8FF';
                                    e.currentTarget.style.color = '#7C3AED';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.color = '#6B7280';
                                }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {selectedList.length > 1 && (
                        <p
                            style={{
                                fontSize: '12px',
                                color: '#9CA3AF',
                                marginTop: '8px',
                                textAlign: 'center',
                            }}
                        >
                            {previewIndex + 1} / {selectedList.length}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
