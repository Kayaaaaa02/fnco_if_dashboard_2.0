import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  contents: [],
  loading: false,
  error: null,
};

const seedingContentSlice = createSlice({
  name: "seedingContent",
  initialState,
  reducers: {
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
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateContentStats: (state, action) => {
      const { id, stats } = action.payload;
      const contentIndex = state.contents.findIndex((content) => content.id === id);
      if (contentIndex !== -1) {
        state.contents[contentIndex] = { ...state.contents[contentIndex], ...stats };
      }
    },
  },
});

export const { addContent, updateContent, removeContent, setContents, addBulkContents, setLoading, setError, clearError, updateContentStats } = seedingContentSlice.actions;

export default seedingContentSlice.reducer;
