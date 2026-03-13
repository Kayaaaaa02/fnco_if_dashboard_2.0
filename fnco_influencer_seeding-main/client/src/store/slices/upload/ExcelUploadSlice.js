import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  excelData: [],
  selectedFile: null,
  isProcessingExcel: false,
  uploadError: null,
};

const excelUploadSlice = createSlice({
  name: 'excelUpload',
  initialState,
  reducers: {
    setExcelData: (state, action) => {
      state.excelData = action.payload;
    },
    addExcelRow: (state, action) => {
      state.excelData.push(action.payload);
    },
    removeExcelRow: (state, action) => {
      state.excelData = state.excelData.filter((_, index) => index !== action.payload);
    },
    updateExcelRow: (state, action) => {
      const { index, updates } = action.payload;
      if (state.excelData[index]) {
        state.excelData[index] = { ...state.excelData[index], ...updates };
      }
    },
    clearExcelData: (state) => {
      state.excelData = [];
      state.selectedFile = null;
      state.uploadError = null;
    },
    setSelectedFile: (state, action) => {
      state.selectedFile = action.payload;
    },
    setIsProcessingExcel: (state, action) => {
      state.isProcessingExcel = action.payload;
    },
    setUploadError: (state, action) => {
      state.uploadError = action.payload;
    },
    clearUploadError: (state) => {
      state.uploadError = null;
    },
    resetUploadState: (state) => {
      return initialState;
    },
  },
});

export const {
  setExcelData,
  addExcelRow,
  removeExcelRow,
  updateExcelRow,
  clearExcelData,
  setSelectedFile,
  setIsProcessingExcel,
  setUploadError,
  clearUploadError,
  resetUploadState,
} = excelUploadSlice.actions;

export default excelUploadSlice.reducer;