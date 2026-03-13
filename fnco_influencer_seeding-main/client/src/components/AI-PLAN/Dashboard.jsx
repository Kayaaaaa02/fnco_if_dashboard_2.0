import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { FileText, Sparkles, Info, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { User, LogOut, ArrowLeft } from 'lucide-react';
import { KPICards } from './dashboard/KPICards.jsx';
import { UploadForm } from './dashboard/UploadForm.jsx';
import { ProductAnalysisModal } from './dashboard/ProductAnalysisModal.jsx';
import { InfluencerAnalysisModal } from './dashboard/InfluencerAnalysisModal.jsx';
import { FinalPlanModal } from './dashboard/FinalPlanModal.jsx';
import { useTranslation } from '../../hooks/useTranslation.js';
export function AIPlanDashboard({
    onBack,
    user,
    onLogout,
    onNavigate,
    completionStatus = {},
    pendingUploadData,
    onSetPendingUploadData,
}) {
    const t = useTranslation();
    const [planDocCount, setPlanDocCount] = useState(0);
    const [completedPlanDocCount, setCompletedPlanDocCount] = useState(0);
    const [uploadedPlanDocCount, setUploadedPlanDocCount] = useState(0);
    const [completedPlanDocCountSimple, setCompletedPlanDocCountSimple] = useState(0);
    const [isProductAnalysisModalOpen, setIsProductAnalysisModalOpen] = useState(false);
    const [isInfluencerAnalysisModalOpen, setIsInfluencerAnalysisModalOpen] = useState(false);
    const [isFinalPlanModalOpen, setIsFinalPlanModalOpen] = useState(false);
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    const [productAnalysisData, setProductAnalysisData] = useState([]);
    const [productAnalysisLoading, setProductAnalysisLoading] = useState(false);
    const [influencerSelectedCount, setInfluencerSelectedCount] = useState(0);
    const [influencerAnalysisData, setInfluencerAnalysisData] = useState([]);
    const [influencerAnalysisLoading, setInfluencerAnalysisLoading] = useState(false);
    const [finalPlanData, setFinalPlanData] = useState([]);
    const [finalPlanLoading, setFinalPlanLoading] = useState(false);

    const navigateToPage = (page) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    // 업로드된 제품 수 조회
    useEffect(() => {
        const fetchPlanDocCount = async () => {
            try {
                const response = await fetch(`${apiBase}/ai-plan/count`);
                if (response.ok) {
                    const data = await response.json();
                    setPlanDocCount(data.count || 0);
                }
            } catch (error) {
                // 에러 무시
            }
        };

        fetchPlanDocCount();
    }, [apiBase]);

    // 완료된 기획안 수 조회
    useEffect(() => {
        const fetchCompletedPlanDocCount = async () => {
            try {
                const response = await fetch(`${apiBase}/ai-plan/count/completed`);
                if (response.ok) {
                    const data = await response.json();
                    setCompletedPlanDocCount(data.count || 0);
                }
            } catch (error) {
                // 에러 무시
            }
        };

        fetchCompletedPlanDocCount();
    }, [apiBase]);

    // KPI용: 업로드 완료(status=uploaded) 건수
    useEffect(() => {
        if (!apiBase) return;
        fetch(`${apiBase}/ai-plan/count/uploaded`)
            .then((res) => (res.ok ? res.json() : { count: 0 }))
            .then((data) => setUploadedPlanDocCount(data.count ?? 0))
            .catch(() => setUploadedPlanDocCount(0));
    }, [apiBase]);

    // KPI용: 완료(status=compleate) 건수 (단순 COUNT)
    useEffect(() => {
        if (!apiBase) return;
        fetch(`${apiBase}/ai-plan/count/completed-simple`)
            .then((res) => (res.ok ? res.json() : { count: 0 }))
            .then((data) => setCompletedPlanDocCountSimple(data.count ?? 0))
            .catch(() => setCompletedPlanDocCountSimple(0));
    }, [apiBase]);

    // KPI용: 인플루언서 기초 프로필 수 (is_selected = true)
    useEffect(() => {
        if (!apiBase) return;
        fetch(`${apiBase}/influencer/count`)
            .then((res) => (res.ok ? res.json() : {}))
            .then((data) => setInfluencerSelectedCount(data.count ?? 0))
            .catch(() => setInfluencerSelectedCount(0));
    }, [apiBase]);

    // AI제품 분석 완료 건 모달 열릴 때 업로드 완료 기획안 목록 조회
    useEffect(() => {
        if (!isProductAnalysisModalOpen || !apiBase) return;
        setProductAnalysisLoading(true);
        fetch(`${apiBase}/ai-plan/list/uploaded`)
            .then((res) => (res.ok ? res.json() : []))
            .then((rows) => setProductAnalysisData(Array.isArray(rows) ? rows : []))
            .catch(() => setProductAnalysisData([]))
            .finally(() => setProductAnalysisLoading(false));
    }, [isProductAnalysisModalOpen, apiBase]);

    // 인플루언서 기초 프로필 모달 열릴 때 선택된 인플루언서 목록 조회 (is_selected = true)
    useEffect(() => {
        if (!isInfluencerAnalysisModalOpen || !apiBase) return;
        setInfluencerAnalysisLoading(true);
        fetch(`${apiBase}/influencer/list`)
            .then((res) => (res.ok ? res.json() : {}))
            .then((data) => setInfluencerAnalysisData(Array.isArray(data?.list) ? data.list : []))
            .catch(() => setInfluencerAnalysisData([]))
            .finally(() => setInfluencerAnalysisLoading(false));
    }, [isInfluencerAnalysisModalOpen, apiBase]);

    // 최종 기획안 완료 건 모달 열릴 때 완료(status=compleate) 기획안 목록 조회
    useEffect(() => {
        if (!isFinalPlanModalOpen || !apiBase) return;
        setFinalPlanLoading(true);
        fetch(`${apiBase}/ai-plan/list/completed`)
            .then((res) => (res.ok ? res.json() : []))
            .then((rows) => setFinalPlanData(Array.isArray(rows) ? rows : []))
            .catch(() => setFinalPlanData([]))
            .finally(() => setFinalPlanLoading(false));
    }, [isFinalPlanModalOpen, apiBase]);

    const kpiData = [
        {
            label: t('aiPlan.dashboard.productAnalysisCompleted'),
            value: String(uploadedPlanDocCount),
            icon: FileText,
            color: 'bg-blue-100 text-blue-600',
            style: { backgroundColor: '#dbeafe', color: '#2563eb' },
            onClick: () => setIsProductAnalysisModalOpen(true),
        },
        {
            label: t('aiPlan.dashboard.influencerAnalysisCompleted'),
            value: String(influencerSelectedCount),
            icon: CheckCircle,
            color: 'bg-green-100 text-green-600',
            style: { backgroundColor: '#dcfce7', color: '#16a34a' },
            onClick: () => setIsInfluencerAnalysisModalOpen(true),
        },
        {
            label: t('aiPlan.dashboard.finalPlanCompleted'),
            value: String(completedPlanDocCountSimple),
            icon: Sparkles,
            color: 'bg-purple-100 text-purple-600',
            style: { backgroundColor: '#f3e8ff', color: '#9333ea' },
            onClick: () => setIsFinalPlanModalOpen(true),
        },
    ];

    return (
        <div className="flex min-h-screen">
            <div style={{ width: '15%', flexShrink: 0, borderRight: '1px solid #e5e7eb' }}>
                <Sidebar currentPage="dashboard" navigateToPage={navigateToPage} completionStatus={completionStatus} />
            </div>
            <div style={{ width: '85%', flexShrink: 0 }}>
                <div
                    className="border-b border-gray-200 bg-white px-8"
                    style={{ paddingTop: '13px', paddingBottom: '13px' }}
                >
                    <div className="flex justify-between items-center">
                        <h1
                            className="text-2xl font-semibold"
                            style={{ color: '#B9A8FF', fontSize: '18px', marginLeft: '30px' }}
                        >
                            {t('aiPlan.dashboard.systemTitle')}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{user?.name}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">{user?.email}</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={onLogout} className="flex items-center gap-2">
                                <LogOut className="w-4 h-4" />
                                {t('app.buttons.logout')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onBack}
                                size="sm"
                                className="flex items-center gap-2"
                                style={{ marginRight: '30px' }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t('aiPlan.dashboard.contentDashboard')}
                            </Button>
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 80px)' }}>
                    <main className="p-8">
                        <KPICards kpiData={kpiData} />
                        <UploadForm onNavigate={onNavigate} onSetPendingUploadData={onSetPendingUploadData} />
                        {/* AI Analysis Feature Description */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6" style={{ marginTop: '20px' }}>
                            <div className="flex items-start gap-0">
                                <div
                                    className="rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                        width: '25px',
                                        height: '25px',
                                        backgroundColor: '#2563eb',
                                        marginLeft: '10px',
                                        marginTop: '20px',
                                    }}
                                >
                                    <Info className="w-5 h-5 text-white" />
                                </div>
                                <div style={{ flex: 1, marginLeft: '8px' }}>
                                    <div
                                        className="mb-3"
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#1f2937',
                                            marginTop: '20px',
                                        }}
                                    >
                                        {t('aiPlan.dashboard.aiAnalysisDescription')}
                                    </div>
                                    <ul
                                        className="space-y-2"
                                        style={{
                                            fontSize: '14px',
                                            color: '#374151',
                                            marginTop: '10px',
                                            marginBottom: '25px',
                                        }}
                                    >
                                        <li>{t('aiPlan.dashboard.feature1')}</li>
                                        <li>{t('aiPlan.dashboard.feature2')}</li>
                                        <li>{t('aiPlan.dashboard.feature3')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* AI제품 분석&기획안 완료 건 모달 */}
            <ProductAnalysisModal
                open={isProductAnalysisModalOpen}
                onOpenChange={setIsProductAnalysisModalOpen}
                plans={productAnalysisData}
                loading={productAnalysisLoading}
                onContinueWorking={(plan) => {
                    if (plan?.plan_doc_id && onNavigate) {
                        localStorage.setItem('current_plan_doc_id', plan.plan_doc_id);
                        onNavigate('ProductAnalysis');
                    }
                }}
                onRefetchList={async () => {
                    if (!apiBase) return;
                    const cacheBust = `?_t=${Date.now()}`;
                    const [listRes, countRes] = await Promise.all([
                        fetch(`${apiBase}/ai-plan/list/uploaded${cacheBust}`),
                        fetch(`${apiBase}/ai-plan/count/uploaded${cacheBust}`),
                    ]);
                    const listData = listRes.ok ? await listRes.json() : [];
                    const countData = countRes.ok ? await countRes.json() : {};
                    setProductAnalysisData(Array.isArray(listData) ? listData : []);
                    setUploadedPlanDocCount(countData?.count ?? 0);
                }}
            />

            {/* 인플루언서 기초 프로필 모달 */}
            <InfluencerAnalysisModal
                open={isInfluencerAnalysisModalOpen}
                onOpenChange={setIsInfluencerAnalysisModalOpen}
                plans={influencerAnalysisData}
                loading={influencerAnalysisLoading}
                apiBase={apiBase}
                user={user}
                onRefetchList={async () => {
                    if (!apiBase) return;
                    const cacheBust = `?_t=${Date.now()}`;
                    const [listRes, countRes] = await Promise.all([
                        fetch(`${apiBase}/influencer/list${cacheBust}`),
                        fetch(`${apiBase}/influencer/count${cacheBust}`),
                    ]);
                    const listData = listRes.ok ? await listRes.json() : {};
                    const countData = countRes.ok ? await countRes.json() : {};
                    setInfluencerAnalysisData(Array.isArray(listData?.list) ? listData.list : []);
                    setInfluencerSelectedCount(countData?.count ?? 0);
                }}
            />

            {/* 최종 기획안 완료 건 모달 */}
            <FinalPlanModal
                open={isFinalPlanModalOpen}
                onOpenChange={setIsFinalPlanModalOpen}
                plans={finalPlanData}
                loading={finalPlanLoading}
                onContinueWorking={(plan) => {
                    if (plan?.plan_doc_id && onNavigate) {
                        localStorage.setItem('current_plan_doc_id', plan.plan_doc_id);
                        onNavigate('FinalReview');
                    }
                }}
                onRefetchList={async () => {
                    if (!apiBase) return;
                    const cacheBust = `?_t=${Date.now()}`;
                    const [listRes, countRes] = await Promise.all([
                        fetch(`${apiBase}/ai-plan/list/completed${cacheBust}`),
                        fetch(`${apiBase}/ai-plan/count/completed-simple${cacheBust}`),
                    ]);
                    const listData = listRes.ok ? await listRes.json() : [];
                    const countData = countRes.ok ? await countRes.json() : {};
                    setFinalPlanData(Array.isArray(listData) ? listData : []);
                    setCompletedPlanDocCountSimple(countData?.count ?? 0);
                }}
            />
        </div>
    );
}
