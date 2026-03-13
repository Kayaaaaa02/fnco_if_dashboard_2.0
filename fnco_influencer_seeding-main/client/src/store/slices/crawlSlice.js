import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // 크롤링 결과 데이터들 (임시)
    crawledData: [],

    // 시딩 콘텐츠 데이터들 (임시)
    seedingContents: [],

    // Preview 콘텐츠 데이터들
    previewContents: [],

    // UGC 콘텐츠 데이터들
    ugcContents: [],

    // 성과 우수 콘텐츠 데이터들
    performanceContents: [],

    // 폼 상태
    formData: {
        author_nm: '',
        post_url: '',
        platform: '',
        seeding_product: '',
        keyword: '',
        title: '',
        crawling_start_dt: new Date().toLocaleDateString('sv-SE', {
            timeZone: 'Asia/Seoul',
        }),
        crawling_end_dt: new Date(new Date().setDate(new Date().getDate() + 14)).toLocaleDateString('sv-SE', {
            timeZone: 'Asia/Seoul',
        }),
        seeding_cost: 0,
        agency_nm: '',
        campaign_name: '',
        second_crawling_start_dt: '',
        second_crawling_end_dt: '',
        is_fnco_edit: false,
        content_summary: '',
        user_id: '',
        seeding_cntry: '',
    },

    // UGC 폼 상태
    ugcFormData: {
        post_url: '',
        author_nm: '',
        seeding_product: '',
        content_summary: '',
        crawling_start_dt: new Date().toLocaleDateString('sv-SE', {
            timeZone: 'Asia/Seoul',
        }),
        crawling_end_dt: new Date(new Date().setDate(new Date().getDate() + 14)).toLocaleDateString('sv-SE', {
            timeZone: 'Asia/Seoul',
        }),
        campaign_name: '',
    },

    // 엑셀 업로드 상태
    excelData: [],
    selectedFile: null,
    isProcessingExcel: false,

    // 크롤링 상태
    crawlStatus: {
        isLoading: false,
        error: null,
        currentUrl: null,
    },

    // UI 상태
    isDone: false,
};

const crawlSlice = createSlice({
    name: 'crawl',
    initialState,
    reducers: {
        // 크롤링 데이터 관리
        addCrawledData: (state, action) => {
            state.crawledData.push(action.payload);
        },
        removeCrawledData: (state, action) => {
            state.crawledData = state.crawledData.filter((_, index) => index !== action.payload);
        },
        clearCrawledData: (state) => {
            state.crawledData = [];
        },
        updateCrawledData: (state, action) => {
            const { index, updates } = action.payload;
            if (state.crawledData[index]) {
                state.crawledData[index] = { ...state.crawledData[index], ...updates };
            }
        },
        // 시딩 콘텐츠 데이터 관리
        setSeedingContents: (state, action) => {
            state.seedingContents = action.payload;
        },
        addSeedingContent: (state, action) => {
            state.seedingContents = [action.payload, ...state.seedingContents];
        },
        updateSeedingContent: (state, action) => {
            state.seedingContents = state.seedingContents.map((content) =>
                content.id === action.payload.id ? action.payload : content
            );
        },
        deleteSeedingContent: (state, action) => {
            state.seedingContents = state.seedingContents.filter((content) => content.id !== action.payload);
        },

        // Preview 콘텐츠 데이터 관리
        setPreviewContents: (state, action) => {
            state.previewContents = action.payload;
        },
        addPreviewContent: (state, action) => {
            state.previewContents = [action.payload, ...state.previewContents];
        },
        updatePreviewContent: (state, action) => {
            state.previewContents = state.previewContents.map((content) =>
                content.id === action.payload.id ? action.payload : content
            );
        },
        deletePreviewContent: (state, action) => {
            state.previewContents = state.previewContents.filter((content) => content.id !== action.payload);
        },

        // UGC 콘텐츠 데이터 관리
        setUgcContents: (state, action) => {
            state.ugcContents = action.payload;
        },
        addUgcContent: (state, action) => {
            state.ugcContents = [action.payload, ...state.ugcContents];
        },
        updateUgcContent: (state, action) => {
            state.ugcContents = state.ugcContents.map((content) =>
                content.id === action.payload.id ? action.payload : content
            );
        },
        deleteUgcContent: (state, action) => {
            state.ugcContents = state.ugcContents.filter((content) => content.id !== action.payload);
        },
        // 성과 우수 콘텐츠 데이터 관리
        setPerformanceContents: (state, action) => {
            state.performanceContents = action.payload;
        },

        // 폼 데이터 관리
        updateFormData: (state, action) => {
            const { field, value } = action.payload;
            state.formData[field] = value;
        },
        setFormData: (state, action) => {
            state.formData = { ...state.formData, ...action.payload };
        },
        resetFormData: (state) => {
            state.formData = initialState.formData;
        },

        // UGC 폼 데이터 관리
        updateUgcFormData: (state, action) => {
            const { field, value } = action.payload;
            state.ugcFormData[field] = value;
        },
        setUgcFormData: (state, action) => {
            state.ugcFormData = { ...state.ugcFormData, ...action.payload };
        },
        resetUgcFormData: (state) => {
            state.ugcFormData = initialState.ugcFormData;
        },

        // 엑셀 업로드 관리
        setExcelData: (state, action) => {
            state.excelData = action.payload;
        },
        addExcelRow: (state, action) => {
            state.excelData.push(action.payload);
        },
        removeExcelRow: (state, action) => {
            state.excelData = state.excelData.filter((_, index) => index !== action.payload);
        },
        clearExcelData: (state) => {
            state.excelData = [];
        },
        setSelectedFile: (state, action) => {
            state.selectedFile = action.payload;
        },
        setIsProcessingExcel: (state, action) => {
            state.isProcessingExcel = action.payload;
        },

        // 크롤링 상태 관리
        setCrawlLoading: (state, action) => {
            state.crawlStatus.isLoading = action.payload;
        },
        setCrawlError: (state, action) => {
            state.crawlStatus.error = action.payload;
        },
        clearCrawlError: (state) => {
            state.crawlStatus.error = null;
        },
        setCurrentUrl: (state, action) => {
            state.crawlStatus.currentUrl = action.payload;
        },

        // UI 상태
        setIsDone: (state, action) => {
            state.isDone = action.payload;
        },

        // 전체 초기화
        resetCrawlState: (state) => {
            return initialState;
        },
    },
});

export const {
    addCrawledData,
    removeCrawledData,
    clearCrawledData,
    updateCrawledData,
    setSeedingContents,
    addSeedingContent,
    updateSeedingContent,
    deleteSeedingContent,
    setPreviewContents,
    addPreviewContent,
    updatePreviewContent,
    deletePreviewContent,
    setUgcContents,
    addUgcContent,
    updateUgcContent,
    deleteUgcContent,
    updateFormData,
    setPerformanceContents,
    setFormData,
    resetFormData,
    updateUgcFormData,
    setUgcFormData,
    resetUgcFormData,
    setExcelData,
    addExcelRow,
    removeExcelRow,
    clearExcelData,
    setSelectedFile,
    setIsProcessingExcel,
    setCrawlLoading,
    setCrawlError,
    clearCrawlError,
    setCurrentUrl,
    setIsDone,
    resetCrawlState,
} = crawlSlice.actions;

export default crawlSlice.reducer;
