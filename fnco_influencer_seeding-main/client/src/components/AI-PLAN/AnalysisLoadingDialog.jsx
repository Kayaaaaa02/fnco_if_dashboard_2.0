import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog.jsx';

/**
 * AI 분석 진행 중 로딩 다이얼로그
 * @param {boolean} open - 다이얼로그 열림 상태
 * @param {string} title - 다이얼로그 제목
 * @param {string} description - 다이얼로그 설명 (줄바꿈 지원)
 */
export function AnalysisLoadingDialog({
    open = false,
    title = 'AI 분석 진행중..',
    description = '잠시만 기다려주세요.',
}) {
    return (
        <Dialog open={open} onOpenChange={() => {}}>
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
                    {/* 애니메이션 로딩 영역 */}
                    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                        {/* 외부 회전하는 원 */}
                        <div
                            style={{
                                position: 'absolute',
                                width: '80px',
                                height: '80px',
                                border: '3px solid #E5DEFF',
                                borderTop: '3px solid #B9A8FF',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        {/* 중간 펄스 원 */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#F3F0FF',
                                borderRadius: '50%',
                                animation: 'pulse 1.5s ease-in-out infinite',
                            }}
                        />
                        {/* 중앙 Sparkles 아이콘 */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <Sparkles style={{ width: '32px', height: '32px', color: '#9F7AEA' }} />
                        </div>
                    </div>

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
                </div>

                {/* CSS 애니메이션 */}
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes pulse {
                            0%, 100% { opacity: 0.4; transform: scale(0.95); }
                            50% { opacity: 0.8; transform: scale(1.05); }
                        }
                    `}
                </style>
            </DialogContent>
        </Dialog>
    );
}
