import { deepClone } from '../utils/deepClone.js';

export const select_data_query = (param) => {
    const paraSet = deepClone(param || {});
    const scope = paraSet.scope; // 'read_all' | 'read_team' | 'read_self'
    const teamCodes = paraSet.team_codes; // array of org codes
    const userId = paraSet.user_id;

    const params = [];
    let whereClause = '';

    if (scope === 'read_team' && Array.isArray(teamCodes) && teamCodes.length > 0) {
        params.push(teamCodes);
        // team_code ANY array
        whereClause = 'WHERE p.team_code = ANY($1)';
    } else if (scope === 'read_self' && userId) {
        params.push(userId);
        whereClause = 'WHERE p.user_id = $1';
    } else {
        // read_all 또는 미지정: 전체 조회
        whereClause = '';
    }

    // 대시보드 캠페인 필터용 campaign_name은 vw_mst_post_performance 에 포함되어야 함
    const selectQuery = `
      SELECT p.*
      FROM fnco_influencer.vw_mst_post_performance p
      ${whereClause};
  `;

    return { selectQuery, params };
};

/**
 * post_id(shortcode)가 fnco_influencer.vw_mst_post_performance에 존재하는지 확인
 * @param {string|string[]} postIds - 단일 post_id 또는 post_id 배열
 * @returns {Object} { checkQuery: string, params: Array }
 */
export const check_post_exists_query = (postIds) => {
    const params = [];
    let checkQuery = '';

    // postIds가 배열인지 단일 값인지 확인
    if (Array.isArray(postIds)) {
        // 배열인 경우: ANY 사용
        params.push(postIds);
        checkQuery = `
            SELECT post_id
            FROM fnco_influencer.vw_mst_post_performance
            WHERE 1=1
            AND post_id = ANY($1)
        `;
    } else {
        // 단일 값인 경우
        params.push(postIds);
        checkQuery = `
            SELECT post_id
            FROM fnco_influencer.vw_mst_post_performance
            WHERE 1=1
            AND post_id = $1
        `;
    }

    return { checkQuery, params };
};
