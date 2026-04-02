import { useState, useMemo, useCallback, useRef } from 'react';
import { Search, Users, CheckCircle2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { STAGE_LIST, PLATFORM_MAP, PLATFORM_OPTIONS, CHANNEL_SIZE_OPTIONS, getChannelSize, getPageRange } from './constants';
import { StageStatsCards } from './StageStatsCards';
import { InfluencerPoolCard } from './InfluencerPoolCard';
import { InfluencerPoolFilter } from './InfluencerPoolFilter';
import {
    useBrandCollabs,
    useCollaborators,
    useConfirmedCount,
    useConfirmHubTargets,
    useCancelHubTargets,
    useConfirmedInfluencers,
    useCompletedAnalysisData,
    useRequestDeepAnalysis,
    usePollingAnalysisStatus,
} from '@/hooks/useInfluencerPool';
import { useAppSelector } from '@/store/hooks.js';

const DEFAULT_FILTERS = {
    creatorType: 'all',
    platform: 'all',
    channelSize: 'all',
    country: 'all',
    hiddenGem: 'all',
    hubStatus: 'all',
    analysisStatus: 'all',
};

const PAGE_SIZE = 24;

export function InfluencerPool() {
    const userName = useAppSelector((state) => state.user.name);

    // --- API 호출 ---
    const brandCollabsQuery = useBrandCollabs();
    const collaboratorsQuery = useCollaborators();
    const confirmedCountQuery = useConfirmedCount();
    const confirmedQuery = useConfirmedInfluencers();
    const confirmMutation = useConfirmHubTargets();
    const cancelMutation = useCancelHubTargets();

    // --- 심층 분석 ---
    const { data: analysisData } = useCompletedAnalysisData();
    const completedIds = analysisData?.completedIds || new Set();
    const dbProcessingIds = analysisData?.processingIds || new Set();
    const analysisStatsMap = analysisData?.statsMap || {};
    const requestAnalysis = useRequestDeepAnalysis();
    const [localProcessingIds, setLocalProcessingIds] = useState(new Set());

    const handleRequestAnalysis = useCallback(
        (inf) => {
            setLocalProcessingIds((prev) => new Set([...prev, inf.id]));
            requestAnalysis.mutate(
                {
                    profile_id: inf.id,
                    platform: inf.platform,
                    username: inf.username,
                    display_name: inf.displayName,
                    profile_url: inf.profileUrl || (inf.platform === 'tiktok' ? `https://www.tiktok.com/@${inf.username}` : `https://www.${inf.platform}.com/${inf.username}`),
                    followers_count: inf.followers || 0,
                },
                {
                    onError: () => {
                        toast.error('심층 분석 요청 실패');
                        setLocalProcessingIds((prev) => {
                            const n = new Set(prev);
                            n.delete(inf.id);
                            return n;
                        });
                    },
                },
            );
            toast(`${inf.displayName} 심층 분석 시작...`, { duration: 3000 });
        },
        [requestAnalysis],
    );

    const handlePollingCompleted = useCallback((results) => {
        setLocalProcessingIds((prev) => {
            const next = new Set(prev);
            results.forEach(({ id, status }) => {
                next.delete(id);
                if (status === 'completed') toast.success('심층 분석 완료');
                if (status === 'failed') toast.error('심층 분석 실패');
            });
            return next;
        });
    }, []);

    // DB processing + 로컬 processing 합산
    const processingIds = useMemo(() => {
        const merged = new Set(dbProcessingIds);
        for (const id of localProcessingIds) merged.add(id);
        // completed 되면 processing에서 제거
        for (const id of completedIds) merged.delete(id);
        return merged;
    }, [dbProcessingIds, localProcessingIds, completedIds]);

    const processingIdsArray = useMemo(() => [...processingIds], [processingIds]);
    usePollingAnalysisStatus(processingIdsArray, handlePollingCompleted);

    const getAnalysisStatus = useCallback(
        (infId) => {
            if (processingIds.has(infId)) return 'processing';
            if (completedIds.has(infId)) return 'completed';
            return 'none';
        },
        [processingIds, completedIds],
    );

    const isLoading = brandCollabsQuery.isLoading || collaboratorsQuery.isLoading;
    const isServerCollecting = (brandCollabsQuery.data?._loading || collaboratorsQuery.data?._loading) && !isLoading;
    const isError = brandCollabsQuery.isError || collaboratorsQuery.isError;

    // --- 확정 인원 ID Set ---
    const confirmedIds = useMemo(() => {
        const ids = new Set();
        (confirmedQuery.data || []).forEach((inf) => ids.add(inf.profile_id));
        return ids;
    }, [confirmedQuery.data]);

    // --- 데이터 합산 + 확정 여부 표시 ---
    const allInfluencers = useMemo(() => {
        const brandCollabs = brandCollabsQuery.data?.influencers || [];
        const collaborators = collaboratorsQuery.data?.influencers || [];
        return [...collaborators, ...brandCollabs].map((inf) => ({
            ...inf,
            isConfirmed: confirmedIds.has(inf.id),
        }));
    }, [brandCollabsQuery.data, collaboratorsQuery.data, confirmedIds]);

    // --- 동적 필터 옵션 (실제 데이터 기반) ---
    const dynamicFilterOptions = useMemo(() => {
        const platforms = new Set();
        const channelSizes = new Set();
        const countries = new Map(); // code → label

        const COUNTRY_LABELS = {
            KR: '🇰🇷 한국어', JP: '🇯🇵 일본어', CN: '🇨🇳 중국어', TH: '🇹🇭 태국어', VN: '🇻🇳 베트남어',
            'Lang:KO': '🇰🇷 한국어', 'Lang:JA': '🇯🇵 일본어', 'Lang:ZH': '🇨🇳 중국어', 'Lang:TH': '🇹🇭 태국어', 'Lang:EN': '🇺🇸 영어', 'Lang:VI': '🇻🇳 베트남어',
        };

        allInfluencers.forEach((inf) => {
            if (inf.platform) platforms.add(inf.platform);
            if (inf.followers != null) channelSizes.add(getChannelSize(inf.followers));
            if (inf.country) countries.set(inf.country, COUNTRY_LABELS[inf.country] || inf.country);
        });

        const platformOptions = PLATFORM_OPTIONS;

        const sizeOrder = ['mega', 'macro', 'micro', 'nano'];
        const channelSizeOptions = [
            { value: 'all', label: '전체' },
            ...CHANNEL_SIZE_OPTIONS.filter((o) => o.value !== 'all' && channelSizes.has(o.value))
                .sort((a, b) => sizeOrder.indexOf(a.value) - sizeOrder.indexOf(b.value)),
        ];

        const countryOptions = [
            { value: 'all', label: '전체' },
            ...[...countries.entries()].map(([code, label]) => ({ value: code, label })),
        ];

        return { platformOptions, channelSizeOptions, countryOptions };
    }, [allInfluencers]);

    // --- 필터 상태 ---
    const [activeStage, setActiveStage] = useState(null);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // --- 허브 대상 선택 ---
    const [selectedIds, setSelectedIds] = useState(new Set());

    // 현재 선택된 인원이 확정인지 미확정인지 판별
    const selectionMode = useMemo(() => {
        if (selectedIds.size === 0) return null; // 'confirm' | 'cancel' | null
        const firstId = [...selectedIds][0];
        const firstInf = allInfluencers.find((inf) => inf.id === firstId);
        return firstInf?.isConfirmed ? 'cancel' : 'confirm';
    }, [selectedIds, allInfluencers]);

    const toggleSelect = useCallback(
        (id) => {
            const target = allInfluencers.find((inf) => inf.id === id);
            if (!target) return;

            // 새로 선택 시: 심층 분석 미완료면 차단 (해제는 허용)
            if (!selectedIds.has(id) && getAnalysisStatus(id) !== 'completed') {
                toast.warning(
                    '심층 분석을 먼저 완료해주세요. 허브 대상은 분석 완료된 인플루언서만 선택할 수 있습니다.',
                );
                return;
            }

            setSelectedIds((prev) => {
                // 이미 선택된 걸 해제하는 건 항상 허용
                if (prev.has(id)) {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                }

                // 새로 선택 시: 기존 선택과 확정 상태가 다르면 차단
                if (prev.size > 0) {
                    const firstId = [...prev][0];
                    const firstInf = allInfluencers.find((inf) => inf.id === firstId);
                    const isMixed = firstInf?.isConfirmed !== target.isConfirmed;
                    if (isMixed) {
                        toast.warning('확정 인원과 미확정 인원을 함께 선택할 수 없습니다.');
                        return prev;
                    }
                }

                const next = new Set(prev);
                next.add(id);
                return next;
            });
        },
        [allInfluencers, selectedIds, getAnalysisStatus],
    );
    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    const handleConfirmHubTargets = useCallback(() => {
        const selected = allInfluencers.filter((inf) => selectedIds.has(inf.id));
        if (!selected.length) return;

        confirmMutation.mutate(
            { influencers: selected, created_by: userName || 'unknown' },
            {
                onSuccess: (data) => {
                    toast.success(`${data.count}명이 허브 대상으로 확정되었습니다`);
                    clearSelection();
                },
                onError: (error) => {
                    toast.error('허브 대상 확정 실패: ' + error.message);
                },
            },
        );
    }, [allInfluencers, selectedIds, clearSelection, confirmMutation, userName]);

    const handleCancelHubTargets = useCallback(() => {
        const selected = allInfluencers.filter((inf) => selectedIds.has(inf.id));
        if (!selected.length) return;

        const profileIds = selected.map((inf) => inf.id);
        cancelMutation.mutate(
            { profileIds, updated_by: userName || 'unknown' },
            {
                onSuccess: (data) => {
                    toast.success(`${data.count}명의 허브 대상이 취소되었습니다`);
                    clearSelection();
                },
                onError: (error) => {
                    toast.error('허브 대상 취소 실패: ' + error.message);
                },
            },
        );
    }, [allInfluencers, selectedIds, clearSelection, cancelMutation, userName]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    }, []);

    // --- 스테이지 카운트 ---
    const stageCounts = useMemo(() => {
        const totalCount = allInfluencers.length;
        const confirmedCount = confirmedCountQuery.data || 0;
        const hiddenGemCount = allInfluencers.filter((inf) => inf.isHiddenGem).length;
        return {
            candidate_pool: totalCount,
            partnered: confirmedCount,
            hidden_gem: hiddenGemCount,
        };
    }, [allInfluencers, confirmedCountQuery.data]);

    // --- 스테이지 필터 → creatorType 매핑 ---
    const getStageFilter = useCallback((stage) => {
        if (stage === 'candidate_pool') return 'excluded';
        if (stage === 'partnered') return 'fnco';
        if (stage === 'hidden_gem') return 'hidden_gem';
        return null;
    }, []);

    // --- 필터 적용 ---
    const filteredInfluencers = useMemo(() => {
        return allInfluencers
            .filter((inf) => {
                if (!activeStage) return true;
                if (activeStage === 'candidate_pool') return true; // 전체
                if (activeStage === 'partnered') return inf.isConfirmed;
                if (activeStage === 'hidden_gem') return inf.isHiddenGem;
                return true;
            })
            .filter((inf) => filters.creatorType === 'all' || inf.creator_type === filters.creatorType)
            .filter((inf) => filters.platform === 'all' || inf.platform === filters.platform)
            .filter((inf) => filters.channelSize === 'all' || getChannelSize(inf.followers) === filters.channelSize)
            .filter((inf) => filters.country === 'all' || inf.country === filters.country)
            .filter((inf) => filters.hiddenGem === 'all' || inf.isHiddenGem)
            .filter((inf) => {
                if (filters.hubStatus === 'all') return true;
                if (filters.hubStatus === 'confirmed') return inf.isConfirmed;
                if (filters.hubStatus === 'unconfirmed') return !inf.isConfirmed;
                return true;
            })
            .filter((inf) => {
                if (filters.analysisStatus === 'all') return true;
                const status = getAnalysisStatus(inf.id);
                return status === filters.analysisStatus;
            })
            .filter((inf) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                    (inf.displayName || '').toLowerCase().includes(q) || (inf.username || '').toLowerCase().includes(q)
                );
            });
    }, [allInfluencers, activeStage, filters, searchQuery, getStageFilter, getAnalysisStatus]);

    // --- 페이지네이션 ---
    const totalPages = Math.ceil(filteredInfluencers.length / PAGE_SIZE);
    const paginatedInfluencers = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredInfluencers.slice(start, start + PAGE_SIZE);
    }, [filteredInfluencers, currentPage]);

    // 활성 필터 카운트
    const activeFilterCount = Object.values(filters).filter((v) => v !== 'all').length + (activeStage !== null ? 1 : 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', padding: '24px 28px' }}>
            {/* 헤더 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 0 20px',
                    borderBottom: '1px solid #E8E8E8',
                    marginBottom: '20px',
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111111', margin: 0 }}>
                            인플루언서 풀
                        </h1>
                        <span
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#666666',
                                background: '#F5F5F5',
                                padding: '2px 8px',
                                borderRadius: '4px',
                            }}
                        >
                            {isLoading ? '...' : `${allInfluencers.length}명`}
                        </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#888888', margin: 0 }}>
                        브랜드 성격에 최적화 된 협업 후보군을 한눈에 파악할 수 있는 통합 리스트를 제공합니다 협업을
                        진행하고 싶은 인플루언서를 심층 분석하신 후, 허브 대상으로 확정하면 캠페인 빌더에서
                        기획안-인플루언서 매칭이 가능합니다.
                    </p>
                </div>
                <div />
            </div>

            {/* 콘텐츠 영역 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {/* 서버 수집 중 배너 */}
                {isServerCollecting && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 14px', marginBottom: '12px',
                        background: '#FFF7ED', border: '1px solid #FED7AA',
                        borderRadius: '10px', fontSize: '12px', color: '#92400E',
                    }}>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        데이터를 불러오는 중입니다. 잠시만 기다려주세요.
                    </div>
                )}

                {/* 스테이지 통계 카드 */}
                <StageStatsCards
                    counts={stageCounts}
                    total={allInfluencers.length}
                    activeStage={activeStage}
                    onStageClick={(stage) => {
                        setActiveStage((prev) => (prev === stage ? null : stage));
                        setCurrentPage(1);
                    }}
                />

                {/* 검색바 */}
                <div
                    style={{
                        position: 'relative',
                        marginBottom: '12px',
                        borderRadius: '10px',
                        transition: 'box-shadow 0.2s ease',
                        boxShadow: searchFocused ? '0 0 0 3px rgba(0,0,0,0.06)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                        if (!searchFocused) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={(e) => {
                        if (!searchFocused) e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Search
                        style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '15px',
                            height: '15px',
                            color: searchFocused ? '#111111' : '#999999',
                            transition: 'color 0.15s',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="이름 또는 유저네임으로 검색..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            border: searchFocused ? '1.5px solid #111111' : '1px solid #E8E8E8',
                            borderRadius: '10px',
                            fontSize: '13px',
                            color: '#222222',
                            background: searchFocused ? '#ffffff' : '#F5F5F5',
                            outline: 'none',
                            transition: 'all 0.15s ease',
                            boxSizing: 'border-box',
                            cursor: 'text',
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setCurrentPage(1);
                            }}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: 'none',
                                background: '#E0E0E0',
                                color: '#666666',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#CCCCCC';
                                e.currentTarget.style.color = '#333333';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#E0E0E0';
                                e.currentTarget.style.color = '#666666';
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* 필터 바 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                    }}
                >
                    <InfluencerPoolFilter
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        activeFilterCount={activeFilterCount}
                        onReset={() => {
                            setActiveStage(null);
                            setFilters(DEFAULT_FILTERS);
                            setCurrentPage(1);
                        }}
                        totalCount={allInfluencers.length}
                        resultCount={filteredInfluencers.length}
                        selectedCount={selectedIds.size}
                        selectionMode={selectionMode}
                        onConfirmHub={handleConfirmHubTargets}
                        onCancelHub={handleCancelHubTargets}
                        onClearSelection={clearSelection}
                        dynamicOptions={dynamicFilterOptions}
                    />
                </div>

                {/* 로딩 상태 */}
                {isLoading && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '80px 20px',
                        }}
                    >
                        <Loader2
                            style={{
                                width: '28px',
                                height: '28px',
                                color: '#888888',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#888888' }}>
                            인플루언서 데이터를 불러오는 중...
                        </p>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes daSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* 에러 상태 */}
                {isError && !isLoading && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            border: '1px dashed #E0E0E0',
                            borderRadius: '12px',
                        }}
                    >
                        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 500, color: '#ef4444' }}>
                            데이터를 불러오지 못했습니다
                        </p>
                        <button
                            onClick={() => {
                                brandCollabsQuery.refetch();
                                collaboratorsQuery.refetch();
                            }}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px',
                                border: '1px solid #E0E0E0',
                                background: '#ffffff',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {/* 카드 그리드 */}
                {!isLoading && !isError && (
                    <>
                        {paginatedInfluencers.length > 0 ? (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '14px',
                                }}
                            >
                                {paginatedInfluencers.map((inf) => (
                                    <InfluencerPoolCard
                                        key={`${inf.creator_type}-${inf.id}`}
                                        influencer={inf}
                                        selectable
                                        isSelected={selectedIds.has(inf.id)}
                                        onToggleSelect={toggleSelect}
                                        analysisStatus={getAnalysisStatus(inf.id)}
                                        analysisStats={analysisStatsMap[inf.id]}
                                        onRequestAnalysis={handleRequestAnalysis}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '60px 20px',
                                    border: '1px dashed #E0E0E0',
                                    borderRadius: '12px',
                                }}
                            >
                                <Users
                                    style={{ width: '32px', height: '32px', color: '#CCCCCC', marginBottom: '10px' }}
                                />
                                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 500, color: '#666666' }}>
                                    조건에 맞는 인플루언서가 없습니다
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#888888' }}>
                                    필터 조건을 변경해보세요
                                </p>
                            </div>
                        )}

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: '24px',
                                    paddingBottom: '20px',
                                }}
                            >
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #E0E0E0',
                                        background: '#ffffff',
                                        fontSize: '12px',
                                        color: currentPage === 1 ? '#CCCCCC' : '#666666',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    이전
                                </button>
                                {getPageRange(currentPage, totalPages).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '6px',
                                            border: page === currentPage ? '1.5px solid #111111' : '1px solid #E0E0E0',
                                            background: page === currentPage ? '#111111' : '#ffffff',
                                            color: page === currentPage ? '#ffffff' : '#666666',
                                            fontSize: '12px',
                                            fontWeight: page === currentPage ? 600 : 400,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #E0E0E0',
                                        background: '#ffffff',
                                        fontSize: '12px',
                                        color: currentPage === totalPages ? '#CCCCCC' : '#666666',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
