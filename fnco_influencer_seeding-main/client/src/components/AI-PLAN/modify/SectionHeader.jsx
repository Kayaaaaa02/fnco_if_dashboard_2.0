import { Edit, Save, X } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation.js';

/**
 * 공통 섹션 헤더 컴포넌트
 * @param {Object} props
 * @param {React.Component} props.icon - 헤더 아이콘 컴포넌트 (Lucide Icon)
 * @param {string} props.title - 섹션 제목
 * @param {string} props.subtitle - 섹션 부제목
 * @param {string} props.bgColor - 배경색
 * @param {string} props.iconColor - 아이콘 색상
 * @param {boolean} props.isEditing - 편집 모드 여부
 * @param {Function} props.onEditToggle - 편집 토글 핸들러
 * @param {Function} props.onSave - 저장 핸들러
 * @param {Function} props.onCancel - 취소 핸들러
 */
export function SectionHeader({
    title,
    subtitle,
    icon: Icon,
    bgColor,
    iconColor,
    isEditing,
    onEditToggle,
    onSave,
    onCancel,
}) {
    const t = useTranslation();

    return (
        <div
            style={{
                backgroundColor: bgColor,
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {Icon && <Icon className="w-5 h-5" style={{ color: iconColor }} />}
                <div>
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{title}</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', marginTop: '4px' }}>
                        {subtitle}
                    </div>
                </div>
            </div>

            {/* 편집 모드에 따라 버튼 변경 */}
            <div style={{ display: 'flex', gap: '8px' }}>
                {isEditing ? (
                    <>
                        <button
                            onClick={onSave}
                            style={{
                                backgroundColor: bgColor,
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.5)',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: '500',
                                fontSize: '14px',
                            }}
                        >
                            <Save className="w-4 h-4" />
                            {t('common.save')}
                        </button>
                        <button
                            onClick={onCancel}
                            style={{
                                backgroundColor: 'white',
                                color: '#6b7280',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: '500',
                                fontSize: '14px',
                            }}
                        >
                            <X className="w-4 h-4" />
                            {t('common.cancel')}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onEditToggle}
                        style={{
                            backgroundColor: 'white',
                            color: bgColor,
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '500',
                            fontSize: '14px',
                        }}
                    >
                        <Edit className="w-4 h-4" />
                        {t('common.edit')}
                    </button>
                )}
            </div>
        </div>
    );
}
