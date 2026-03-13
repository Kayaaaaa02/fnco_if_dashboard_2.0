import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  crawledData: [],
  crawlStatus: {
    isLoading: false,
    error: null,
    currentUrl: null,
  },
  isDone: false,
};

const crawlingSlice = createSlice({
  name: 'crawling',
  initialState,
  reducers: {
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
    setIsDone: (state, action) => {
      state.isDone = action.payload;
    },
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
  setCrawlLoading,
  setCrawlError,
  clearCrawlError,
  setCurrentUrl,
  setIsDone,
  resetCrawlState,
} = crawlingSlice.actions;

export default crawlingSlice.reducer;