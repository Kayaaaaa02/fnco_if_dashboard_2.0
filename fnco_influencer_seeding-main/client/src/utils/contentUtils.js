// 공통 유틸리티 함수들
import countries from 'i18n-iso-countries';
import koLocale from 'i18n-iso-countries/langs/ko.json';
import enLocale from 'i18n-iso-countries/langs/en.json';
import zhLocale from 'i18n-iso-countries/langs/zh.json';

// 다국어 로케일 등록
countries.registerLocale(koLocale);
countries.registerLocale(enLocale);
countries.registerLocale(zhLocale);

export const formatNumber = (num = 0) => {
    num = Number(num);
    return (!!num && num.toLocaleString()) || '-';
};

export const formatDate = (date, language = 'ko') => {
    if (!date) return '';

    // 한국어: YYYY년 MM월 DD일 형식
    if (language === 'ko') {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    // 영어/중국어: YYYY-MM-DD 형식
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatDateTime = (date) => {
    if (!date) return '-';
    try {
        // DB 문자열 그대로 사용하여 타임존 변환 없이 포맷만 변경
        const s = String(date).trim();
        const match = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
        return match ? `${match[1]} ${match[2]}` : '-';
    } catch {
        return '-';
    }
};

export const getPlatformLabel = (platform) => {
    switch (platform) {
        case 'youtube':
            return 'Youtube';
        case 'tiktok':
            return 'TikTok';
        case 'instagram':
            return 'Instagram';
        case 'x':
            return 'X';
        default:
            return platform;
    }
};

export const getPlatformColor = (platform) => {
    switch (platform) {
        case 'youtube':
            return 'bg-red-100 text-red-700';
        case 'tiktok':
            return 'bg-gray-100 text-gray-700';
        case 'instagram':
            return 'bg-pink-100 text-pink-700';
        case 'x':
            return 'bg-blue-100 text-blue-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

// media_url에 mp4 파일이 있는지 확인 (비디오 여부)
export const hasVideoFile = (content) => {
    // YouTube, TikTok은 무조건 비디오 플랫폼
    const videoPlatforms = ['youtube', 'tiktok'];
    if (videoPlatforms.includes(content?.platform?.toLowerCase())) {
        return true;
    }

    // 그 외의 경우 media_url에서 mp4 파일 확인
    if (!content?.media_url || content.media_url.length === 0) return false;
    return content.media_url.some((url) => url?.toLowerCase().includes('.mp4'));
};

// 콘텐츠 정렬 함수
export const sortContents = (contents, sortBy, direction) => {
    // contents가 배열이 아니면 빈 배열 반환
    if (!Array.isArray(contents)) {
        return [];
    }

    if (sortBy === 'default') {
        return contents;
    }

    const sorted = [...contents].sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case 'performance_score':
                aValue = a.performance_score || 0;
                bValue = b.performance_score || 0;
                break;
            case 'view_count':
                aValue = a.view_count || 0;
                bValue = b.view_count || 0;
                break;
            case 'like_count':
                aValue = a.like_count || 0;
                bValue = b.like_count || 0;
                break;
            case 'comment_count':
                aValue = a.comment_count || 0;
                bValue = b.comment_count || 0;
                break;
            case 'share_count':
                aValue = a.share_count || 0;
                bValue = b.share_count || 0;
                break;
            case 'seeding_cost':
                aValue = a.seeding_cost || 0;
                bValue = b.seeding_cost || 0;
                break;
            case 'crawling_start_dt':
                aValue = new Date(a.crawling_start_dt).getTime();
                bValue = new Date(b.crawling_start_dt).getTime();
                break;
            case 'scheduled_date':
                aValue = new Date(a.scheduled_date || a.crawling_start_dt || 0).getTime();
                bValue = new Date(b.scheduled_date || b.crawling_start_dt || 0).getTime();
                break;
            default:
                return 0;
        }

        if (direction === 'asc') {
            return aValue - bValue;
        } else {
            return bValue - aValue;
        }
    });

    return sorted;
};

// 국가 코드를 국가명으로 변환
// language: 'ko', 'en', 'zh' (기본값: 'ko')
export const getCountryName = (countryCode, language = 'ko') => {
    if (!countryCode) return '-';

    // 언어 코드 매핑 (i18n-iso-countries에서 사용하는 언어 코드)
    const localeMap = {
        ko: 'ko',
        en: 'en',
        zh: 'zh',
    };

    const locale = localeMap[language] || 'ko';
    const countryName = countries.getName(countryCode, locale, { select: 'official' });
    return countryName || countryCode; // 국가명을 찾지 못하면 코드 그대로 반환
};

// 순위를 언어별로 포맷팅
// language: 'ko', 'en', 'zh' (기본값: 'ko')
export const formatRank = (rank, language = 'ko') => {
    if (!rank && rank !== 0) return '';
    const rankNum = Number(rank);

    // 중문: 第1名, 第2名, ...
    if (language === 'zh') {
        return `第${rankNum}名`;
    }

    // 영어: 1st, 2nd, 3rd, 4th, ...
    if (language === 'en') {
        const lastDigit = rankNum % 10;
        const lastTwoDigits = rankNum % 100;

        // 11, 12, 13은 예외적으로 "th" 사용
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return `${rankNum}th`;
        }

        // 나머지는 마지막 자릿수에 따라 결정
        if (lastDigit === 1) return `${rankNum}st`;
        if (lastDigit === 2) return `${rankNum}nd`;
        if (lastDigit === 3) return `${rankNum}rd`;
        return `${rankNum}th`;
    }

    // 한국어: 숫자만 반환 (뒤에 "위" 텍스트가 추가됨)
    return String(rankNum);
};
