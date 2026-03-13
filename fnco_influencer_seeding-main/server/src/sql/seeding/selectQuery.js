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

    // 대시보드 캠페인 필터용 campaign_name은 vw_mst_post 에 포함되어야 함
    const selectQuery = `
      SELECT p.*
      FROM fnco_influencer.vw_mst_post p
      ${whereClause};
  `;

    return { selectQuery, params };
};
