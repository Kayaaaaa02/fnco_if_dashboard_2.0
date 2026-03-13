import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 비동기 액션: 유저 그룹 정보 가져오기
export const fetchUserInfo = createAsyncThunk(
  'user/fetchUserInfo',
  async (userEmail, { rejectWithValue }) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBase}/user-info/${encodeURIComponent(userEmail)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('유저 정보 가져오기 실패:', error);
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: user_id로 유저 정보(메뉴 권한 포함) 가져오기
export const fetchUserAccess = createAsyncThunk(
  'user/fetchUserAccess',
  async (userId, { rejectWithValue }) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBase}/user-access/${encodeURIComponent(userId)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('user_id로 유저 접근 권한 가져오기 실패:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user_id: null,
  email: null,
  name: null,
  name_eng: null,
  team_codes: [],
  role: [],
  menu_access: {}
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserInfo: (state) => {
      state.user_id = null;
      state.email = null;
      state.name = null;
      state.name_eng = null;
      state.team_codes = [];
      state.role = [];
      state.menu_access = {};
    },
    setUser: (state, action) => {
      state.user_id = action.payload.user_id;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.name_eng = action.payload.name_eng;
      // team_codes 우선, 없으면 team_code 단일을 배열로 승격
      state.team_codes = Array.isArray(action.payload.team_codes)
        ? action.payload.team_codes
        : (action.payload.team_code ? [action.payload.team_code] : []);
      state.role = action.payload.role || [];
      state.menu_access = action.payload.menu_access || action.payload.menu || {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        // 로딩 상태는 필요시 추가
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.user_id = action.payload.user?.user_id || action.payload.user_id;
        state.email = action.payload.user?.email || action.payload.email;
        state.name = action.payload.user?.name || action.payload.name;
        state.name_eng = action.payload.user?.name_eng || action.payload.name_eng;
        const payloadOrgCodes = action.payload.user?.team_codes || action.payload.team_codes;
        const payloadOrgCode = action.payload.user?.team_code ?? action.payload.team_code;
        state.team_codes = Array.isArray(payloadOrgCodes)
          ? payloadOrgCodes
          : (payloadOrgCode ? [payloadOrgCode] : []);
        state.role = action.payload.user?.role || action.payload.role || [];
        state.menu_access = action.payload.menu_access || state.menu_access;
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.user_id = null;
        state.email = null;
        state.name = null;
        state.name_eng = null;
        state.team_codes = [];
        state.role = [];
        state.menu_access = {};
      })
      .addCase(fetchUserAccess.fulfilled, (state, action) => {
        state.user_id = action.payload.user_id;
        state.email = action.payload.email;
        state.name = action.payload.name;
        state.name_eng = action.payload.name_eng;
        state.menu_access = action.payload.menu_access || action.payload.menu || {};
      });
  },
});

export const { clearUserInfo, setUser } = userSlice.actions;

// 셀렉터들
export const selectUser = (state) => state.user;
export const selectMenuAccess = (state) => state.user.menu_access;


export default userSlice.reducer;
