const apiBase = import.meta.env.VITE_API_BASE_URL;

export async function fetchWithRetry(url, options = {}, maxRetries = 2) {
    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (error) {
            if (i === maxRetries) throw error; // 마지막 시도에서도 실패하면 에러 던지기
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // 지수 백오프
        }
    }
}

/**
 * post_id(shortcode)가 fnco_influencer.vw_mst_post_performance에 존재하는지 확인
 * @param {string} postId - 단일 post_id
 * @returns {Promise<{exists: boolean, post_id: string, message: string}>}
 */
export async function checkPostExistsInPerformance(postId) {
    try {
        const response = await fetchWithRetry(
            `${apiBase}/contents/performance/check?post_id=${encodeURIComponent(postId)}`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('post_id 존재 여부 확인 실패:', error);
        throw error;
    }
}

/**
 * 여러 post_id들이 fnco_influencer.vw_mst_post_performance에 존재하는지 확인
 * @param {string[]} postIds - post_id 배열
 * @returns {Promise<{results: Array<{post_id: string, exists: boolean}>}>}
 */
export async function checkMultiplePostsExistInPerformance(postIds) {
    try {
        const postIdsParam = postIds.join(',');
        const response = await fetchWithRetry(
            `${apiBase}/contents/performance/check?post_ids=${encodeURIComponent(postIdsParam)}`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('여러 post_id 존재 여부 확인 실패:', error);
        throw error;
    }
}

/**
 * 성과 우수 콘텐츠 감지 로그 저장 (메일 서버로 전송)
 * @param {Object} logData - 로그 데이터
 * @param {string} logData.post_id - 콘텐츠 post_id
 * @param {string} logData.post_url - 콘텐츠 URL
 * @param {string} logData.created_at - 감지 시점
 * @param {string} logData.user_id - 등록한 사용자 ID
 * @param {string} logData.user_nm - 등록한 사용자명
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */
export async function logPerformanceContentDetection(logData) {
    try {
        const response = await fetchWithRetry(`${apiBase}/contents/performance/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('성과 우수 콘텐츠 감지 로그 저장 실패:', error);
        throw error;
    }
}
