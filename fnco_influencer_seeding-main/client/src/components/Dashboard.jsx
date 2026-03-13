import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { setActiveTab } from '../store/slices/dashboardSlice.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import { VideoAnalysisModal } from './ui/VideoAnalysisModal.jsx';
import { toast } from 'sonner@2.0.3';
import { SeedingContentTab } from './dashboard/SeedingContentTab.jsx';
import { SeedingPreviewTab } from './dashboard/SeedingPreviewTab.jsx';
import { UGCContentTab } from './dashboard/UGCContentTab.jsx';
import { PerformanceContentTab } from './dashboard/PerformanceContentTab.jsx';
import { hasVideoFile } from '../utils/contentUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';

export function Dashboard({ contents = [], ugcContents = [], performanceContents = [], previewContents = [] }) {
    const dispatch = useAppDispatch();
    const { activeTab } = useAppSelector((state) => state.dashboard);
    const t = useTranslation();

    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);
    const [videoAnalysisStatuses, setVideoAnalysisStatuses] = useState({});
    const prevStatusesRef = useRef({});
    const isInitialLoadRef = useRef(true);
    const notifiedPostIdsRef = useRef(new Set());

    const apiBase = import.meta.env.VITE_API_BASE_URL;

    // 영상 분석 상태 조회 (크롤링된 post_id 추적)
    useEffect(() => {
        // 모든 콘텐츠 타입 통합
        const allContents = [...contents, ...ugcContents, ...performanceContents, ...previewContents];

        if (allContents.length === 0) return;

        // 동영상 게시물만 필터링 (YouTube, TikTok, mp4 파일 있는 게시물)
        const allPostIds = allContents
            .filter((content) => content?.post_id && hasVideoFile(content))
            .map((content) => content.post_id);

        if (allPostIds.length === 0) return;

        // 상태 조회 함수
        const fetchStatuses = async (postIdsToCheck, isInitial = false) => {
            if (postIdsToCheck.length === 0) return;

            try {
                // POST로 변경 (URL 길이 제한 회피)
                const response = await fetch(`${apiBase}/contents/videoAnalysis/statuses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ post_ids: postIdsToCheck }),
                });
                if (response.ok) {
                    const statusMap = await response.json();

                    setVideoAnalysisStatuses((prev) => {
                        const updated = { ...prev, ...statusMap };

                        // 초기 로드인 경우, prevStatusesRef 설정 및 알림 대상 제외
                        if (isInitial) {
                            prevStatusesRef.current = { ...updated };
                            // 이미 completed 상태인 post_id는 알림 대상에서 제외
                            Object.keys(updated).forEach((postId) => {
                                const status = updated[postId]?.toLowerCase() || '';
                                if (status === 'completed' || status === 'complete') {
                                    notifiedPostIdsRef.current.add(postId);
                                }
                            });
                            isInitialLoadRef.current = false;
                        }

                        return updated;
                    });
                }
            } catch (error) {
                console.error('영상 분석 상태 조회 실패:', error);
            }
        };

        // 초기 조회: 모든 post_id 상태 확인
        fetchStatuses(allPostIds, true);

        // 5초마다 체크: 분석 중인(pending/processing) post_id만 체https://www.instagram.com/reel/DIX0kHOhNx_/크
        let interval = setInterval(() => {
            setVideoAnalysisStatuses((currentStatuses) => {
                // 1. 상태가 없는 post_id (아직 분석 요청 안 됨)
                // 2. pending 상태인 post_id (EC2 서버에서 분석 중)
                const pendingPostIds = allPostIds.filter((post_id) => {
                    const status = currentStatuses[post_id]?.toLowerCase() || '';
                    // pending만 계속 체크
                    // completed/failed/not_requested는 체크 안 함
                    // 상태가 없으면 1번만 체크 후 not_requested 받음
                    return status === 'pending';
                });

                // 분석 중인 영상이 있을 때만 API 호출
                if (pendingPostIds.length > 0) {
                    fetchStatuses(pendingPostIds);
                } else {
                    // ✅ 모든 영상이 분석 완료(completed/failed)되면 polling 중지
                    clearInterval(interval);
                    interval = null;
                }

                return currentStatuses;
            });
        }, 5000); // 5초마다 체크

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [contents, ugcContents, performanceContents, previewContents, apiBase]);

    // 영상 분석 완료 토스트 표시
    useEffect(() => {
        if (isInitialLoadRef.current) {
            return;
        }

        const prevStatuses = prevStatusesRef.current;
        const currentStatuses = videoAnalysisStatuses;

        if (Object.keys(prevStatuses).length === 0 && Object.keys(currentStatuses).length > 0) {
            prevStatusesRef.current = { ...currentStatuses };
            Object.keys(currentStatuses).forEach((postId) => {
                const status = currentStatuses[postId]?.toLowerCase() || '';
                if (status === 'completed' || status === 'complete') {
                    notifiedPostIdsRef.current.add(postId);
                }
            });
            return;
        }

        const completedPostIds = [];
        Object.keys(currentStatuses).forEach((postId) => {
            const prevStatus = prevStatuses[postId]?.toLowerCase() || '';
            const currentStatus = currentStatuses[postId]?.toLowerCase() || '';
            const alreadyNotified = notifiedPostIdsRef.current.has(postId);

            if (
                prevStatus !== 'completed' &&
                prevStatus !== 'complete' &&
                (currentStatus === 'completed' || currentStatus === 'complete') &&
                !alreadyNotified
            ) {
                completedPostIds.push(postId);
                notifiedPostIdsRef.current.add(postId);
            }
        });

        if (completedPostIds.length > 0) {
            // 모든 콘텐츠 타입에서 author_nm 찾기
            const allContents = [...contents, ...ugcContents, ...performanceContents, ...previewContents];
            const completedAuthors = completedPostIds
                .map((postId) => {
                    const content = allContents.find((c) => c.post_id === postId);
                    return content?.author_nm;
                })
                .filter(Boolean);

            if (completedAuthors.length === 1) {
                toast.success(t('dashboard.videoAnalysis.completedSingle', { author: completedAuthors[0] }));
            } else {
                toast.success(t('dashboard.videoAnalysis.completed'));
            }
        }

        prevStatusesRef.current = { ...currentStatuses };
    }, [videoAnalysisStatuses, contents, ugcContents, performanceContents, previewContents]);

    // 영상 분석 모달 열기 핸들러
    const handleOpenVideoAnalysis = (content) => {
        setSelectedContent(content);
        setVideoDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2>{t('dashboard.title')}</h2>
                <p className="text-muted-foreground">
                    {t('dashboard.description', {
                        seeding: contents.length,
                        preview: previewContents.length,
                        ugc: ugcContents.length,
                        performance: performanceContents.length,
                    })}
                </p>
            </div>

            <Tabs
                defaultValue="seeding-dashboard"
                value={activeTab}
                onValueChange={(value) => dispatch(setActiveTab(value))}
                className="w-full"
            >
                <TabsList className="flex w-full gap-2" style={{ display: 'flex', flexDirection: 'row' }}>
                    <TabsTrigger value="seeding-dashboard" className="flex-1 whitespace-nowrap">
                        {t('dashboard.tabs.seeding')}
                    </TabsTrigger>
                    <TabsTrigger value="preview-dashboard" className="flex-1 whitespace-nowrap">
                        {t('dashboard.tabs.preview')}
                    </TabsTrigger>
                    <TabsTrigger value="ugc-dashboard" className="flex-1 whitespace-nowrap">
                        {t('dashboard.tabs.ugc')}
                    </TabsTrigger>
                    <TabsTrigger value="performance-dashboard" className="flex-1 whitespace-nowrap">
                        {t('dashboard.tabs.performance')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="seeding-dashboard" className="mt-6">
                    <SeedingContentTab
                        contents={contents}
                        videoAnalysisStatuses={videoAnalysisStatuses}
                        onOpenVideoAnalysis={handleOpenVideoAnalysis}
                    />
                </TabsContent>

                <TabsContent value="preview-dashboard" className="mt-6">
                    <SeedingPreviewTab
                        contents={previewContents}
                        videoAnalysisStatuses={videoAnalysisStatuses}
                        onOpenVideoAnalysis={handleOpenVideoAnalysis}
                    />
                </TabsContent>

                <TabsContent value="ugc-dashboard" className="mt-6">
                    <UGCContentTab
                        contents={ugcContents}
                        videoAnalysisStatuses={videoAnalysisStatuses}
                        onOpenVideoAnalysis={handleOpenVideoAnalysis}
                    />
                </TabsContent>

                <TabsContent value="performance-dashboard" className="mt-6">
                    <PerformanceContentTab
                        contents={performanceContents}
                        videoAnalysisStatuses={videoAnalysisStatuses}
                        onOpenVideoAnalysis={handleOpenVideoAnalysis}
                    />
                </TabsContent>
            </Tabs>

            {/* 영상 분석 Modal */}
            <VideoAnalysisModal open={videoDialogOpen} onOpenChange={setVideoDialogOpen} content={selectedContent} />
        </div>
    );
}

