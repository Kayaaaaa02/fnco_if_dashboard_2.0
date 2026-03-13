import { useRef } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export function ProductImageAttachment({ productImages = [], onProductImagesChange }) {
    const t = useTranslation();
    const inputRef = useRef(null);

    const validateFile = (file) => {
        if (!ACCEPT_TYPES.includes(file.type)) {
            return { valid: false, error: t('aiPlan.aiImageGeneration.productImageInvalidType') };
        }
        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: t('aiPlan.aiImageGeneration.productImageTooLarge') };
        }
        return { valid: true };
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const validFiles = [];
        for (const file of files) {
            const { valid } = validateFile(file);
            if (valid) validFiles.push(file);
        }
        if (validFiles.length > 0) {
            onProductImagesChange?.([...(productImages || []), ...validFiles]);
        }
        e.target.value = '';
    };

    const handleRemove = (index) => {
        const next = productImages.filter((_, i) => i !== index);
        onProductImagesChange?.(next);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        const validFiles = [];
        for (const file of files) {
            const { valid } = validateFile(file);
            if (valid) validFiles.push(file);
        }
        if (validFiles.length > 0) {
            onProductImagesChange?.([...(productImages || []), ...validFiles]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div
            style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '12px 16px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                }}
            >
                <ImagePlus style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {t('aiPlan.aiImageGeneration.productImageAttachmentTitle')}
                </h3>
            </div>
            <p
                style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    marginBottom: '8px',
                    lineHeight: '1.4',
                }}
            >
                {t('aiPlan.aiImageGeneration.productImageAttachmentDescription')}
            </p>
            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                style={{
                    border: '2px dashed #D1D5DB',
                    borderRadius: '10px',
                    padding: '14px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#F9FAFB',
                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#9CA3AF';
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <Upload
                    style={{ width: '28px', height: '28px', color: '#9CA3AF', margin: '0 auto 6px', display: 'block' }}
                />
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    {t('aiPlan.aiImageGeneration.productImageUploadHint')}
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {t('aiPlan.aiImageGeneration.productImageUploadFormat')}
                </div>
            </div>
            {productImages?.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {productImages.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            style={{
                                position: 'relative',
                                width: '72px',
                                height: '72px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #E5E7EB',
                                backgroundColor: '#F9FAFB',
                            }}
                        >
                            <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(index);
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    color: '#fff',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1,
                                }}
                                aria-label={t('aiPlan.aiImageGeneration.delete')}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
