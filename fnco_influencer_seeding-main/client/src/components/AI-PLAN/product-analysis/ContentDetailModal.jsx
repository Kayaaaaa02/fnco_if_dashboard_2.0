import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog.jsx';
import ReactMarkdown from 'react-markdown';
import { simpleMarkdownComponents } from '../utils/markdownComponents.jsx';
import { formatViewCount } from '../utils/contentUtils.js';
import { useTranslation, useLanguage } from '../../../hooks/useTranslation.js';

export function ContentDetailModal({ open, onOpenChange, content, parsedSummary }) {
    const t = useTranslation();
    const language = useLanguage();
    if (!content) return null;

    // 언어별 조회수 포맷팅
    const formatViewCountByLanguage = (count) => {
        if (!count) return '';
        const num = typeof count === 'number' ? count : parseInt(count);
        if (isNaN(num)) return count;

        const formatTemplate = t('aiPlan.productAnalysis.contentDetailModal.videoViewsFormat');

        if (num >= 10000) {
            if (language === 'en') {
                // 영어: Million 단위
                const millions = (num / 1000000).toFixed(1);
                return formatTemplate.replace('N', millions);
            } else if (language === 'zh') {
                // 중국어: 万 단위
                const wan = (num / 10000).toFixed(1);
                return formatTemplate.replace('N', wan);
            } else {
                // 한국어: 만 단위
                const man = (num / 10000).toFixed(1);
                return formatTemplate.replace('N', man);
            }
        } else {
            // 10000 미만인 경우
            if (language === 'en') {
                return `${num.toLocaleString()}`;
            } else if (language === 'zh') {
                return `${num.toLocaleString()}次`;
            } else {
                return `${num.toLocaleString()}회`;
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                style={{
                    maxWidth: '48rem',
                    maxHeight: '90vh',
                }}
                className="overflow-y-auto p-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            >
                <DialogHeader className="pb-4 border-b border-gray-200">
                    <DialogTitle
                        className="text-left text-gray-900"
                        style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '12px' }}
                    >
                        {t('aiPlan.productAnalysis.contentDetailModal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* 0. 기본 정보 */}
                    <div className="space-y-3">
                        <h4
                            style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#111827',
                                marginBottom: '12px',
                            }}
                        >
                            0. {t('aiPlan.productAnalysis.contentDetailModal.basicInfo')}
                        </h4>
                        <div
                            style={{
                                backgroundColor: '#F9FAFB',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                padding: '16px',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {content.title && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#6B7280',
                                                minWidth: '110px',
                                                flexShrink: 0,
                                            }}
                                        >
                                            1) {t('aiPlan.productAnalysis.contentDetailModal.contentTitle')}:
                                        </span>
                                        <span
                                            style={{ fontSize: '13px', color: '#111827', fontWeight: '500', flex: 1 }}
                                        >
                                            {content.title}
                                        </span>
                                    </div>
                                )}
                                {content.author_nm && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#6B7280',
                                                minWidth: '110px',
                                                flexShrink: 0,
                                            }}
                                        >
                                            2) {t('aiPlan.productAnalysis.contentDetailModal.channelName')}:
                                        </span>
                                        <span
                                            style={{ fontSize: '13px', color: '#111827', fontWeight: '500', flex: 1 }}
                                        >
                                            {content.author_nm}
                                        </span>
                                    </div>
                                )}
                                {content.view_count && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#6B7280',
                                                minWidth: '110px',
                                                flexShrink: 0,
                                            }}
                                        >
                                            3) {t('aiPlan.productAnalysis.contentDetailModal.videoViews')}:
                                        </span>
                                        <span
                                            style={{ fontSize: '13px', color: '#111827', fontWeight: '500', flex: 1 }}
                                        >
                                            {formatViewCountByLanguage(content.view_count)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 1. 퍼포먼스 & 알고리즘 진단 */}
                    {(parsedSummary?.핵심내용알고리즘진단 || parsedSummary?.타겟오디언스) && (
                        <div className="space-y-3">
                            <h4
                                style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#111827',
                                    marginBottom: '12px',
                                }}
                            >
                                1. 🔍 {t('aiPlan.productAnalysis.contentDetailModal.performanceDiagnosis')}
                            </h4>
                            <div
                                style={{
                                    backgroundColor: '#FEF3F2',
                                    border: '1px solid #FEE2E2',
                                    borderLeft: '4px solid #EF4444',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {parsedSummary?.핵심내용알고리즘진단 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#991B1B',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                1) {t('aiPlan.productAnalysis.contentDetailModal.algorithmDiagnosis')}:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.핵심내용알고리즘진단}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {parsedSummary?.타겟오디언스 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#991B1B',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                2) {t('aiPlan.productAnalysis.contentDetailModal.targetAudience')}:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.타겟오디언스}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. ⚡ 핵심 구조 분석 */}
                    {(parsedSummary?.핵심메시지 || parsedSummary?.초반3초후킹 || parsedSummary?.킬링포인트) && (
                        <div className="space-y-3">
                            <h4
                                style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#111827',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                2.<span>⚡</span> {t('aiPlan.productAnalysis.contentDetailModal.coreStructureAnalysis')}
                            </h4>
                            <div
                                style={{
                                    backgroundColor: '#F0F9FF',
                                    border: '1px solid #DBEAFE',
                                    borderLeft: '4px solid #3B82F6',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {parsedSummary?.핵심메시지 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#1E40AF',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                1) {t('aiPlan.productAnalysis.contentDetailModal.coreMessage')}:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.핵심메시지}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {parsedSummary?.초반3초후킹 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#1E40AF',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                2) 초반 3초 후킹:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.초반3초후킹}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {parsedSummary?.킬링포인트 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#1E40AF',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                3) 킬링 포인트:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.킬링포인트}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. 🎨 톤 & 스타일 */}
                    {(parsedSummary?.콘텐츠스타일 || parsedSummary?.톤앤무드 || parsedSummary?.콘텐츠특징) && (
                        <div className="space-y-3">
                            <h4
                                style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#111827',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                3.<span>🎨</span> {t('aiPlan.productAnalysis.contentDetailModal.toneAndStyle')}
                            </h4>
                            <div
                                style={{
                                    backgroundColor: '#FDF4FF',
                                    border: '1px solid #FAE8FF',
                                    borderLeft: '4px solid #C084FC',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {parsedSummary?.콘텐츠스타일 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#7C3AED',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                1) {t('aiPlan.productAnalysis.contentDetailModal.contentStyle')}:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.콘텐츠스타일}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {parsedSummary?.톤앤무드 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#7C3AED',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                2) {t('aiPlan.productAnalysis.contentDetailModal.toneAndMood')}:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.톤앤무드}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {parsedSummary?.콘텐츠특징 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#7C3AED',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                3) {t('aiPlan.productAnalysis.contentDetailModal.contentFeatures')}:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.콘텐츠특징}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. 💡 크리에이티브 디렉터의 Action Plan */}
                    {(parsedSummary?.벤치마킹요소 || parsedSummary?.적용제안) && (
                        <div className="space-y-3">
                            <h4
                                style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#111827',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                4.<span>💡</span> 크리에이티브 디렉터의 Action Plan
                            </h4>
                            <div
                                style={{
                                    backgroundColor: '#F0FDF4',
                                    border: '1px solid #D1FAE5',
                                    borderLeft: '4px solid #10B981',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {parsedSummary?.벤치마킹요소 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#047857',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                1) 벤치마킹 요소:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.벤치마킹요소}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {parsedSummary?.적용제안 && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#047857',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                2) 적용 제안:
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                                <ReactMarkdown components={simpleMarkdownComponents}>
                                                    {parsedSummary.적용제안}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
