import React, { useMemo } from 'react';
import Select from 'react-select';
import countries from 'i18n-iso-countries';
import { cn } from './ui/utils';
import { useAppSelector } from '../store/hooks.js';

// 다국어 로케일 불러오기
import enLocale from 'i18n-iso-countries/langs/en.json';
import koLocale from 'i18n-iso-countries/langs/ko.json';
import zhLocale from 'i18n-iso-countries/langs/zh.json';

// 로케일 등록
countries.registerLocale(enLocale);
countries.registerLocale(koLocale);
countries.registerLocale(zhLocale);

export default function CountrySelect({ value, onChange, placeholder = '국가를 선택하세요', className }) {
    const currentLanguage = useAppSelector((state) => state.i18n?.language || 'ko');

    // 언어 매핑: Redux의 language를 i18n-iso-countries의 locale로 변환
    const lang = useMemo(() => {
        const languageMap = {
            ko: 'ko',
            en: 'en',
            zh: 'zh',
        };
        return languageMap[currentLanguage] || 'ko';
    }, [currentLanguage]);

    // 언어별 국가 리스트 생성
    const options = useMemo(() => {
        const countryObj = countries.getNames(lang, { select: 'official' }); // ISO 기반 국가명
        return Object.entries(countryObj).map(([code, name]) => ({
            value: code,
            label: name,
        }));
    }, [lang]);

    const changeHandler = (selected) => {
        onChange(selected?.value || '');
    };

    // 현재 선택된 값 찾기
    const selectedOption = options.find((option) => option.value === value);

    return (
        <div className={cn('w-full', className)}>
            <Select
                options={options}
                value={selectedOption}
                onChange={changeHandler}
                placeholder={placeholder}
                isSearchable={true}
                isClearable={true}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                    control: (base, state) => ({
                        ...base,
                        minHeight: '36px', // h-9와 동일
                        height: '36px',
                        border: state.isFocused ? '1px solid #374151' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                        '&:hover': {
                            borderColor: state.isFocused ? '#374151' : '#9ca3af',
                        },
                    }),
                    valueContainer: (base) => ({
                        ...base,
                        padding: '0 12px', // px-3과 동일
                        height: '100%',
                    }),
                    input: (base) => ({
                        ...base,
                        margin: 0,
                        padding: 0,
                        color: '#111827',
                    }),
                    placeholder: (base) => ({
                        ...base,
                        color: '#9ca3af',
                        fontSize: '14px',
                    }),
                    singleValue: (base) => ({
                        ...base,
                        color: '#111827',
                        fontSize: '14px',
                    }),
                    menu: (base) => ({
                        ...base,
                        backgroundColor: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        zIndex: 50,
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#ffffff' : state.isFocused ? '#f3f4f6' : 'transparent',
                        color: state.isSelected ? '#111827' : '#111827',
                        fontSize: '14px',
                        padding: '8px 12px',
                        '&:hover': {
                            backgroundColor: state.isSelected ? '#ffffff' : '#f3f4f6',
                        },
                    }),
                    indicatorSeparator: () => ({
                        display: 'none',
                    }),
                    dropdownIndicator: (base) => ({
                        ...base,
                        color: '#9ca3af',
                        '&:hover': {
                            color: '#111827',
                        },
                    }),
                    clearIndicator: (base) => ({
                        ...base,
                        color: '#9ca3af',
                        '&:hover': {
                            color: '#111827',
                        },
                    }),
                }}
            />
        </div>
    );
}
