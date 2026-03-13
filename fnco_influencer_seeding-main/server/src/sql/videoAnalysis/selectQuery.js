import { deepClone } from '../utils/deepClone.js';

export const select_data_query = (param) => {
    const paraSet = deepClone(param || {});
    const postId = paraSet.post_id;

    const params = [];
    let whereClause = "where 1=1 and video_analysis_status = 'completed'";

    if (postId) {
        params.push(postId);
        whereClause += ` and post_id = $${params.length}`;
    }

    const selectQuery = `
      SELECT DISTINCT ON (post_id)
	   post_id,
       ai_improvement_suggestions,
       ai_improvement_suggestions_cn,
       ai_improvement_suggestions_eng
        FROM fnco_influencer.dw_post_ai_analysis
        ${whereClause}  
        AND (ai_improvement_suggestions IS NOT NULL 
             OR ai_improvement_suggestions_cn IS NOT NULL 
             OR ai_improvement_suggestions_eng IS NOT NULL)
        ORDER BY post_id, video_analyzed_at DESC
      ;
  `;

    return { selectQuery, params };
};
