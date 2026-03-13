import { deepClone } from '../utils/deepClone.js';

/**
 * 영상 분석 상태만 조회하는 쿼리
 * @param {Object} param - { post_ids: string[] } 또는 { post_id: string }
 */
export const select_status_query = (param) => {
    const paraSet = deepClone(param || {});
    const postIds = paraSet.post_ids || (paraSet.post_id ? [paraSet.post_id] : []);

    const params = [];
    let whereClause = 'WHERE 1=1';

    if (postIds.length > 0) {
        params.push(postIds);
        whereClause += ` AND post_id = ANY($${params.length})`;
    }

    const selectQuery = `
        SELECT post_id, video_analysis_status
        FROM fnco_influencer.dw_post_ai_analysis
        ${whereClause}
        ORDER BY post_id;
    `;

    return { selectQuery, params };
};
