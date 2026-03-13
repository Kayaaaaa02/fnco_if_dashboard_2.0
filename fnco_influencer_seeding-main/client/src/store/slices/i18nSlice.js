import { createSlice } from '@reduxjs/toolkit';

// localStorage에서 초기값 불러오기
const getInitialState = () => {
    if (typeof window !== 'undefined') {
        const savedLanguage = localStorage.getItem('i18n_language');
        const savedRegion = localStorage.getItem('i18n_region');
        return {
            language: savedLanguage || 'ko', // 'ko', 'en', 'zh'
            region: savedRegion || 'korea', // 'global', 'korea', 'china'
        };
    }
    return {
        language: 'ko',
        region: 'korea',
    };
};

const initialState = getInitialState();

const i18nSlice = createSlice({
    name: 'i18n',
    initialState,
    reducers: {
        setLanguage: (state, action) => {
            state.language = action.payload;
            // localStorage에 저장
            if (typeof window !== 'undefined') {
                localStorage.setItem('i18n_language', action.payload);
            }
            // 언어에 따라 기본 지역 설정 (선택사항)
            // if (action.payload === 'ko') state.region = 'korea';
            // else if (action.payload === 'zh') state.region = 'china';
        },
        setRegion: (state, action) => {
            state.region = action.payload;
            // localStorage에 저장
            if (typeof window !== 'undefined') {
                localStorage.setItem('i18n_region', action.payload);
            }
            // 지역에 따라 언어 자동 변경
            if (action.payload === 'korea') {
                state.language = 'ko';
                if (typeof window !== 'undefined') {
                    localStorage.setItem('i18n_language', 'ko');
                }
            } else if (action.payload === 'china') {
                state.language = 'zh';
                if (typeof window !== 'undefined') {
                    localStorage.setItem('i18n_language', 'zh');
                }
            } else if (action.payload === 'global') {
                state.language = 'en';
                if (typeof window !== 'undefined') {
                    localStorage.setItem('i18n_language', 'en');
                }
            }
        },
    },
});

export const { setLanguage, setRegion } = i18nSlice.actions;
export default i18nSlice.reducer;
