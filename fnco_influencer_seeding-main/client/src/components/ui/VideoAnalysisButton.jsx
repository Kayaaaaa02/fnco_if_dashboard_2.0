import { Video, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation.js';

/**
 * 영상 분석 상태에 따라 다른 버튼을 렌더링하는 컴포넌트
 * @param {Object} props
 * @param {Object} props.content - 콘텐츠 정보
 * @param {string} props.status - 영상 분석 상태 (pending, completed, failed, etc.)
 * @param {Function} props.onOpenModal - 분석 결과 보기 클릭 시 실행할 함수
 */
export function VideoAnalysisButton({ content, status, onOpenModal }) {
    const t = useTranslation();
    const normalizedStatus = status?.toLowerCase() || '';

    // pending 상태: 진행중 버튼 (비활성화)
    if (normalizedStatus === 'pending') {
        return (
            <button
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 cursor-not-allowed opacity-75"
                disabled
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t('dashboard.videoAnalysis.button.processing')}</span>
            </button>
        );
    }

    // failed 상태: 실패 버튼 (비활성화)
    if (normalizedStatus === 'failed' || normalizedStatus === 'error') {
        return (
            <button
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-200 cursor-not-allowed"
                disabled
            >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{t('dashboard.videoAnalysis.button.failed')}</span>
            </button>
        );
    }

    // completed 상태: 활성화된 버튼 (클릭 가능)
    if (normalizedStatus === 'completed' || normalizedStatus === 'complete') {
        return (
            <button
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 cursor-pointer transition-colors"
                onClick={() => onOpenModal(content)}
            >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{t('dashboard.videoAnalysis.button.view')}</span>
            </button>
        );
    }

    // 기본 상태 (not_requested 등): 비활성화
    return (
        <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gray-50 text-gray-500 border border-gray-200 cursor-not-allowed"
            disabled
        >
            <Video className="w-4 h-4" />
            <span className="text-sm">{t('dashboard.videoAnalysis.button.waiting')}</span>
        </button>
    );
}
