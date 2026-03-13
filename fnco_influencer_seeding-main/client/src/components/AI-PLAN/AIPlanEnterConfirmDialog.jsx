import { Dialog, DialogContent } from '../ui/dialog.jsx';

/**
 * AI 기획안 대시보드 이동 확인 다이얼로그 (AnalysisLoadingDialog와 동일한 톤/스타일)
 */
export function AIPlanEnterConfirmDialog({
    open = false,
    onOpenChange,
    title,
    description,
    cancelLabel,
    confirmLabel,
    onConfirm,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                style={{
                    maxWidth: '420px',
                    padding: '40px',
                    textAlign: 'center',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
                hideCloseButton={true}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                    <div>
                        <h3
                            style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#111827',
                                marginBottom: '8px',
                            }}
                        >
                            {title}
                        </h3>
                        <p
                            style={{
                                fontSize: '14px',
                                color: '#6B7280',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-line',
                            }}
                        >
                            {description}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={() => onOpenChange?.(false)}
                            style={{
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                backgroundColor: '#F3F4F6',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onConfirm?.();
                                onOpenChange?.(false);
                            }}
                            style={{
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#FFFFFF',
                                backgroundColor: '#8B7FFF',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(139, 127, 255, 0.3)',
                            }}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
