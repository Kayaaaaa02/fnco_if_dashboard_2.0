import { createSlice } from '@reduxjs/toolkit';

const getInitialFilterState = () => ({
    sortBy: 'default',
    sortDirection: 'desc',
    loadedCount: 12,
    searchQuery: '',
    platformFilter: '',
});

const initialState = {
    seedingFilters: getInitialFilterState(),
    ugcFilters: getInitialFilterState(),
    activeTab: 'seeding-dashboard',
    isLoading: false,
    refreshing: false,
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        // 시딩 콘텐츠 필터/정렬
        setSeedingSortBy: (state, action) => {
            state.seedingFilters.sortBy = action.payload;
        },
        setSeedingSortDirection: (state, action) => {
            state.seedingFilters.sortDirection = action.payload;
        },
        toggleSeedingSortDirection: (state) => {
            state.seedingFilters.sortDirection = state.seedingFilters.sortDirection === 'asc' ? 'desc' : 'asc';
        },
        setSeedingLoadedCount: (state, action) => {
            state.seedingFilters.loadedCount = action.payload;
        },
        loadMoreSeeding: (state) => {
            state.seedingFilters.loadedCount += 12;
        },
        setSeedingSearchQuery: (state, action) => {
            state.seedingFilters.searchQuery = action.payload;
        },
        setSeedingPlatformFilter: (state, action) => {
            state.seedingFilters.platformFilter = action.payload;
        },

        // UGC 콘텐츠 필터/정렬
        setUgcSortBy: (state, action) => {
            state.ugcFilters.sortBy = action.payload;
        },
        setUgcSortDirection: (state, action) => {
            state.ugcFilters.sortDirection = action.payload;
        },
        toggleUgcSortDirection: (state) => {
            state.ugcFilters.sortDirection = state.ugcFilters.sortDirection === 'asc' ? 'desc' : 'asc';
        },
        setUgcLoadedCount: (state, action) => {
            state.ugcFilters.loadedCount = action.payload;
        },
        loadMoreUgc: (state) => {
            state.ugcFilters.loadedCount += 12;
        },
        setUgcSearchQuery: (state, action) => {
            state.ugcFilters.searchQuery = action.payload;
        },
        setUgcPlatformFilter: (state, action) => {
            state.ugcFilters.platformFilter = action.payload;
        },

        // 공통 UI 상태
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
            state.seedingFilters = getInitialFilterState();
        },
        resetUgcFilters: (state) => {
            state.ugcFilters = getInitialFilterState();
        },
        resetAllFilters: (state) => {
            state.seedingFilters = getInitialFilterState();
            state.ugcFilters = getInitialFilterState();
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
    setUgcSortBy,
    setUgcSortDirection,
    toggleUgcSortDirection,
    setUgcLoadedCount,
    loadMoreUgc,
    setUgcSearchQuery,
    setUgcPlatformFilter,
    setActiveTab,
    setIsLoading,
    setRefreshing,
    resetSeedingFilters,
    resetUgcFilters,
    resetAllFilters,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
