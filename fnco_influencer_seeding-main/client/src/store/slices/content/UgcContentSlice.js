import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ugcContents: [],
  loading: false,
  error: null,
};

const ugcContentSlice = createSlice({
  name: 'ugcContent',
  initialState,
  reducers: {
    addUgcContent: (state, action) => {
      state.ugcContents.push(action.payload);
    },
    updateUgcContent: (state, action) => {
      const { id, updates } = action.payload;
      const contentIndex = state.ugcContents.findIndex(content => content.id === id);
      if (contentIndex !== -1) {
        state.ugcContents[contentIndex] = { ...state.ugcContents[contentIndex], ...updates };
      }
    },
    removeUgcContent: (state, action) => {
      state.ugcContents = state.ugcContents.filter(content => content.id !== action.payload);
    },
    setUgcContents: (state, action) => {
      state.ugcContents = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUgcContentStats: (state, action) => {
      const { id, stats } = action.payload;
      const contentIndex = state.ugcContents.findIndex(content => content.id === id);
      if (contentIndex !== -1) {
        state.ugcContents[contentIndex] = { ...state.ugcContents[contentIndex], ...stats };
      }
    },
  },
});

export const {
  addUgcContent,
  updateUgcContent,
  removeUgcContent,
  setUgcContents,
  setLoading,
  setError,
  clearError,
  updateUgcContentStats,
} = ugcContentSlice.actions;

export default ugcContentSlice.reducer;