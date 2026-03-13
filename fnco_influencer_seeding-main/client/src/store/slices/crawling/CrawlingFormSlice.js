import { createSlice } from '@reduxjs/toolkit';

const getInitialFormData = () => ({
  author_nm: "",
  post_url: "",
  platform: "",
  seeding_product: "",
  keyword: "",
  title: "",
  crawling_start_dt: new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  }),
  crawling_end_dt: new Date(
    new Date().setDate(new Date().getDate() + 14)
  ).toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  }),
  seeding_cost: 0,
  agency_nm: "",
  second_crawling_start_dt: "",
  second_crawling_end_dt: "",
  is_fnco_edit: false,
  content_summary: "",
  user_id: "",
  seeding_cntry: "",
});

const getInitialUgcFormData = () => ({
  post_url: "",
  author_nm: "",
  seeding_product: "",
  content_summary: "",
  crawling_start_dt: new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  }),
  crawling_end_dt: new Date(
    new Date().setDate(new Date().getDate() + 14)
  ).toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  }),
});

const initialState = {
  formData: getInitialFormData(),
  ugcFormData: getInitialUgcFormData(),
};

const crawlingFormSlice = createSlice({
  name: 'crawlingForm',
  initialState,
  reducers: {
    updateFormData: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    resetFormData: (state) => {
      state.formData = getInitialFormData();
    },
    updateUgcFormData: (state, action) => {
      const { field, value } = action.payload;
      state.ugcFormData[field] = value;
    },
    setUgcFormData: (state, action) => {
      state.ugcFormData = { ...state.ugcFormData, ...action.payload };
    },
    resetUgcFormData: (state) => {
      state.ugcFormData = getInitialUgcFormData();
    },
    resetAllFormData: (state) => {
      state.formData = getInitialFormData();
      state.ugcFormData = getInitialUgcFormData();
    },
  },
});

export const {
  updateFormData,
  setFormData,
  resetFormData,
  updateUgcFormData,
  setUgcFormData,
  resetUgcFormData,
  resetAllFormData,
} = crawlingFormSlice.actions;

export default crawlingFormSlice.reducer;