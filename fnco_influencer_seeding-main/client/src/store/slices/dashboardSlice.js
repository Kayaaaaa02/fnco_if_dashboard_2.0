import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // 시딩 콘텐츠 필터/정렬
    seeding: {
        sortBy: 'default',
        sortDirection: 'desc',
        loadedCount: 12,
        searchQuery: '',
        countryFilter: 'all',
        campaignFilter: 'all',
        platformFilter: '',
    },

    // UGC 콘텐츠 필터/정렬
    ugc: {
        sortBy: 'default',
        sortDirection: 'desc',
        loadedCount: 12,
        searchQuery: '',
        countryFilter: 'all',
        campaignFilter: 'all',
        platformFilter: '',
    },

    // 성과 우수 콘텐츠 필터/정렬
    performance: {
        sortBy: 'performance_score',
        sortDirection: 'desc',
        loadedCount: 12,
        searchQuery: '',
        countryFilter: 'all',
        campaignFilter: 'all',
        platformFilter: 'instagram',
        followerSizeFilter: '0K-10K',
    },

    // 현재 활성 탭
    activeTab: 'seeding-dashboard',

    // UI 상태
    isLoading: false,
    refreshing: false,
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        // 시딩 콘텐츠 필터/정렬
        setSeedingSortBy: (state, action) => {
            state.seeding.sortBy = action.payload;
        },
        setSeedingSortDirection: (state, action) => {
            state.seeding.sortDirection = action.payload;
        },
        toggleSeedingSortDirection: (state) => {
            state.seeding.sortDirection = state.seeding.sortDirection === 'asc' ? 'desc' : 'asc';
        },
        setSeedingLoadedCount: (state, action) => {
            state.seeding.loadedCount = action.payload;
        },
        loadMoreSeeding: (state) => {
            state.seeding.loadedCount += 12;
        },
        setSeedingSearchQuery: (state, action) => {
            state.seeding.searchQuery = action.payload;
        },
        setSeedingPlatformFilter: (state, action) => {
            state.seeding.platformFilter = action.payload;
        },
        setSeedingCountryFilter: (state, action) => {
            state.seeding.countryFilter = action.payload;
            state.seeding.campaignFilter = 'all'; // 국가 변경 시 캠페인 필터 초기화
        },
        setSeedingCampaignFilter: (state, action) => {
            state.seeding.campaignFilter = action.payload;
        },

        // UGC 콘텐츠 필터/정렬
        setUgcSortBy: (state, action) => {
            state.ugc.sortBy = action.payload;
        },
        setUgcSortDirection: (state, action) => {
            state.ugc.sortDirection = action.payload;
        },
        toggleUgcSortDirection: (state) => {
            state.ugc.sortDirection = state.ugc.sortDirection === 'asc' ? 'desc' : 'asc';
        },
        setUgcLoadedCount: (state, action) => {
            state.ugc.loadedCount = action.payload;
        },
        loadMoreUgc: (state) => {
            state.ugc.loadedCount += 12;
        },
        setUgcSearchQuery: (state, action) => {
            state.ugc.searchQuery = action.payload;
        },
        setUgcPlatformFilter: (state, action) => {
            state.ugc.platformFilter = action.payload;
        },
        setUgcCountryFilter: (state, action) => {
            state.ugc.countryFilter = action.payload;
            state.ugc.campaignFilter = 'all';
        },
        setUgcCampaignFilter: (state, action) => {
            state.ugc.campaignFilter = action.payload;
        },

        // 성과 우수 콘텐츠 필터/정렬
        setPerformanceSortBy: (state, action) => {
            state.performance.sortBy = action.payload;
        },
        setPerformanceSortDirection: (state, action) => {
            state.performance.sortDirection = action.payload;
        },
        togglePerformanceSortDirection: (state) => {
            state.performance.sortDirection = state.performance.sortDirection === 'asc' ? 'desc' : 'asc';
        },
        setPerformanceLoadedCount: (state, action) => {
            state.performance.loadedCount = action.payload;
        },
        loadMorePerformance: (state) => {
            state.performance.loadedCount += 12;
        },
        setPerformanceSearchQuery: (state, action) => {
            state.performance.searchQuery = action.payload;
        },
        setPerformancePlatformFilter: (state, action) => {
            state.performance.platformFilter = action.payload;
        },
        setPerformanceCountryFilter: (state, action) => {
            state.performance.countryFilter = action.payload;
            state.performance.campaignFilter = 'all';
        },
        setPerformanceCampaignFilter: (state, action) => {
            state.performance.campaignFilter = action.payload;
        },
        setPerformanceFollowerSizeFilter: (state, action) => {
            state.performance.followerSizeFilter = action.payload;
        },

        // 공통
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        setIsLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setRefreshing: (state, action) => {
            state.refreshing = action.payload;
        },

        // 필터 초기화
        resetSeedingFilters: (state) => {
            state.seeding = initialState.seeding;
        },
        resetUgcFilters: (state) => {
            state.ugc = initialState.ugc;
        },
        resetPerformanceFilters: (state) => {
            state.performance = initialState.performance;
        },
        resetAllFilters: (state) => {
            state.seeding = initialState.seeding;
            state.ugc = initialState.ugc;
            state.performance = initialState.performance;
        },
    },
});

export const {
    setSeedingSortBy,
    setSeedingSortDirection,
    toggleSeedingSortDirection,
    setSeedingLoadedCount,
    loadMoreSeeding,
    setSeedingSearchQuery,
    setSeedingPlatformFilter,
    setSeedingCountryFilter,
    setSeedingCampaignFilter,
    setUgcSortBy,
    setUgcSortDirection,
    toggleUgcSortDirection,
    setUgcLoadedCount,
    loadMoreUgc,
    setUgcSearchQuery,
    setUgcPlatformFilter,
    setUgcCountryFilter,
    setUgcCampaignFilter,
    setPerformanceSortBy,
    setPerformanceSortDirection,
    togglePerformanceSortDirection,
    setPerformanceLoadedCount,
    loadMorePerformance,
    setPerformanceSearchQuery,
    setPerformancePlatformFilter,
    setPerformanceCountryFilter,
    setPerformanceCampaignFilter,
    setPerformanceFollowerSizeFilter,
    setActiveTab,
    setIsLoading,
    setRefreshing,
    resetSeedingFilters,
    resetUgcFilters,
    resetPerformanceFilters,
    resetAllFilters,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
