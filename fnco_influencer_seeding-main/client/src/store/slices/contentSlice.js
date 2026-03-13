import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    contents: [], // 시딩 콘텐츠
    ugcContents: [], // UGC 콘텐츠
    performanceContents: [], // 성과 우수 콘텐츠
    loading: false,
    error: null,
};

const contentSlice = createSlice({
    name: 'content',
    initialState,
    reducers: {
        // 시딩 콘텐츠 관련
        addContent: (state, action) => {
            state.contents.push(action.payload);
        },
        updateContent: (state, action) => {
            const { id, updates } = action.payload;
            const contentIndex = state.contents.findIndex((content) => content.id === id);
            if (contentIndex !== -1) {
                state.contents[contentIndex] = { ...state.contents[contentIndex], ...updates };
            }
        },
        removeContent: (state, action) => {
            state.contents = state.contents.filter((content) => content.id !== action.payload);
        },
        setContents: (state, action) => {
            state.contents = action.payload;
        },
        addBulkContents: (state, action) => {
            state.contents.push(...action.payload);
        },

        // UGC 콘텐츠 관련
        addUgcContent: (state, action) => {
            state.ugcContents.push(action.payload);
        },
        updateUgcContent: (state, action) => {
            const { id, updates } = action.payload;
            const contentIndex = state.ugcContents.findIndex((content) => content.id === id);
            if (contentIndex !== -1) {
                state.ugcContents[contentIndex] = { ...state.ugcContents[contentIndex], ...updates };
            }
        },
        removeUgcContent: (state, action) => {
            state.ugcContents = state.ugcContents.filter((content) => content.id !== action.payload);
        },
        setUgcContents: (state, action) => {
            state.ugcContents = action.payload;
        },

        // 로딩 및 에러 상태
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },

        // 통계 데이터 업데이트
        updateContentStats: (state, action) => {
            const { id, stats, isUgc = false } = action.payload;
            const contents = isUgc ? state.ugcContents : state.contents;
            const contentIndex = contents.findIndex((content) => content.id === id);
            if (contentIndex !== -1) {
                contents[contentIndex] = { ...contents[contentIndex], ...stats };
            }
        },
    },
});

export const {
    addContent,
    updateContent,
    removeContent,
    setContents,
    addBulkContents,
    addUgcContent,
    updateUgcContent,
    removeUgcContent,
    setUgcContents,
    setLoading,
    setError,
    clearError,
    updateContentStats,
} = contentSlice.actions;

export default contentSlice.reducer;
