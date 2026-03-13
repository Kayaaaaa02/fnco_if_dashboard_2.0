import { parseUrl } from '@common/utils.js';

/**
 * media_url 추출 헬퍼 함수
 * @param {Object} item - 콘텐츠 아이템
 * @returns {string|null} media_url 첫 번째 항목 또는 null
 */
export const getMediaUrl = (item) => {
    if (!item || !item.media_url) return null;
    return Array.isArray(item.media_url) ? item.media_url[0] : item.media_url;
};

/**
 * YouTube URL을 임베드 URL로 변환
 * @param {string} url - YouTube URL
 * @returns {string|null} YouTube embed URL 또는 null
 */
export const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const parsed = parseUrl(url);
    if (parsed && parsed.platform === 'youtube' && parsed.id) {
        return `https://www.youtube.com/embed/${parsed.id}`;
    }
    return null;
};

/**
 * YouTube URL에서 비디오 ID 추출
 * @param {string} url - YouTube URL
 * @returns {string|null} YouTube video ID 또는 null
 */
export const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const parsed = parseUrl(url);
    if (parsed && parsed.platform === 'youtube' && parsed.id) {
        return parsed.id;
    }
    return null;
};

/**
 * YouTube 썸네일 URL 생성
 * @param {string} url - YouTube URL
 * @param {string} quality - 썸네일 품질 ('maxresdefault' | 'hqdefault' | 'mqdefault' | 'sddefault')
 * @returns {string|null} YouTube 썸네일 URL 또는 null
 */
export const getYoutubeThumbnailUrl = (url, quality = 'maxresdefault') => {
    const videoId = getYoutubeVideoId(url);
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * 조회수 포맷팅 (만 단위로 변환)
 * @param {number|string} count - 조회수
 * @returns {string} 포맷팅된 조회수 문자열
 */
export const formatViewCount = (count) => {
    if (!count) return '';
    const num = typeof count === 'number' ? count : parseInt(count);
    if (isNaN(num)) return count;
    if (num >= 10000) {
        return `${(num / 10000).toFixed(1)}만 회`;
    }
    return `${num.toLocaleString()}회`;
};
