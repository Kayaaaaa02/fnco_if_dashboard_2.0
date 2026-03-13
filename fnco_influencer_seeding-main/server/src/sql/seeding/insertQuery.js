import { deepClone } from '../utils/deepClone.js';

export const insert_data_query = (param) => {
    const paraSet = deepClone(param);
    let get_insert_params = '';
    paraSet.forEach((e, idx) => {
        e.post_id = !!e.post_id ? `'${e.post_id}'` : '';
        e.post_url = !!e.post_url ? `'${e.post_url}'` : null;
        e.platform = !!e.platform ? `'${e.platform}'` : null;
        e.seeding_product = !!e.seeding_product ? `'${e.seeding_product}'` : null;
        e.keyword = !!e.keyword ? `'${e.keyword}'` : null;
        e.crawling_start_dt = !!e.crawling_start_dt ? `'${e.crawling_start_dt}'` : null;
        e.crawling_end_dt = !!e.crawling_end_dt ? `'${e.crawling_end_dt}'` : null;
        e.seeding_cost = !!e.seeding_cost ? e.seeding_cost : 0;
        e.agency_nm = !!e.agency_nm ? `'${e.agency_nm}'` : null;
        e.second_crawling_start_dt = !!e.second_crawling_start_dt ? `'${e.second_crawling_start_dt}'` : null;
        e.second_crawling_end_dt = !!e.second_crawling_end_dt ? `'${e.second_crawling_end_dt}'` : null;
        e.content_summary = !!e.content_summary ? `'${e.content_summary}'` : null;
        e.user_id = !!e.user_id ? `'${e.user_id}'` : null;
        e.seeding_cntry = !!e.seeding_cntry ? `'${e.seeding_cntry}'` : null;
        e.user_nm = !!e.user_nm ? `'${String(e.user_nm).replace(/'/g, "''")}'` : null;
        e.campaign_name = !!e.campaign_name ? `'${String(e.campaign_name).replace(/'/g, "''")}'` : null;
        if (idx == 0) {
            get_insert_params += `(${e.post_id},${e.post_url},${e.platform},${e.seeding_product},${e.keyword},${e.crawling_start_dt},${e.crawling_end_dt},${e.seeding_cost},${e.agency_nm},${e.second_crawling_start_dt},${e.second_crawling_end_dt},${e.is_fnco_edit},${e.content_summary},${e.user_id},${e.seeding_cntry},${e.user_nm},${e.campaign_name})`;
        } else {
            get_insert_params += `,(${e.post_id},${e.post_url},${e.platform},${e.seeding_product},${e.keyword},${e.crawling_start_dt},${e.crawling_end_dt},${e.seeding_cost},${e.agency_nm},${e.second_crawling_start_dt},${e.second_crawling_end_dt},${e.is_fnco_edit},${e.content_summary},${e.user_id},${e.seeding_cntry},${e.user_nm},${e.campaign_name})`;
        }
    });

    const finalQuery = `
    insert into fnco_influencer.mst_post (
      post_id,
      post_url, 
      platform,
      seeding_product, 
      keyword, 
      crawling_start_dt, 
      crawling_end_dt, 
      seeding_cost, 
      agency_nm, 
      second_crawling_start_dt, 
      second_crawling_end_dt, 
      is_fnco_edit, 
      content_summary,
      user_id,
      seeding_cntry,
      user_nm,
      campaign_name
    ) values 
     ${get_insert_params}
      `;

    return {
        insertQuery: finalQuery,
    };
};
