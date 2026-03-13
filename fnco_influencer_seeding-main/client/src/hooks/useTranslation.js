import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks.js';
import koTranslations from '../locales/ko.json';
import enTranslations from '../locales/en.json';
import zhTranslations from '../locales/zh.json';

const translations = {
    ko: koTranslations,
    en: enTranslations,
    zh: zhTranslations,
};

/**
 * 번역 훅
 * @param {string} key - 번역 키 (예: "login.title" 또는 "login.regions.korea")
 * @returns {string} 번역된 텍스트
 *
 * @example
 * const t = useTranslation();
 * <h1>{t('login.title')}</h1>
 * <p>{t('login.regions.korea')}</p>
 */
export function useTranslation() {
    const language = useAppSelector((state) => state.i18n?.language || 'ko');

    const t = useMemo(() => {
        return (key, params = {}) => {
            const keys = key.split('.');
            let value = translations[language];

            for (const k of keys) {
                if (value && typeof value === 'object') {
                    value = value[k];
                } else {
                    // 번역을 찾을 수 없으면 키 반환 또는 기본값 (한국어)
                    value = keys.reduce((acc, k) => acc?.[k], translations.ko);
                    break;
                }
            }

            let result = value !== undefined && value !== null ? value : key;

            // 파라미터 치환 ({{key}} 형식)
            if (typeof result === 'string' && Object.keys(params).length > 0) {
                Object.keys(params).forEach((paramKey) => {
                    result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), params[paramKey]);
                });
            }

            return result;
        };
    }, [language]);

    return t;
}

/**
 * 현재 언어 가져오기
 */
export function useLanguage() {
    return useAppSelector((state) => state.i18n?.language || 'ko');
}

/**
 * 현재 지역 가져오기
 */
export function useRegion() {
    return useAppSelector((state) => state.i18n?.region || 'korea');
}
