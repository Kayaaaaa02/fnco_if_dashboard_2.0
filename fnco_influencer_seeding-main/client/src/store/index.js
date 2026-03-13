import { configureStore } from '@reduxjs/toolkit';
import contentReducer from './slices/contentSlice';
import dashboardReducer from './slices/dashboardSlice';
import crawlReducer from './slices/crawlSlice';
import userReducer from './slices/userSlice';
import i18nReducer from './slices/i18nSlice';

export const store = configureStore({
    reducer: {
        content: contentReducer,
        dashboard: dashboardReducer,
        crawl: crawlReducer,
        user: userReducer,
        i18n: i18nReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Date 객체 등을 허용하기 위한 설정
                ignoredActions: ['content/addContent', 'content/updateContent', 'content/addUgcContent'],
                ignoredPaths: ['content.contents', 'content.ugcContents'],
            },
        }),
});
