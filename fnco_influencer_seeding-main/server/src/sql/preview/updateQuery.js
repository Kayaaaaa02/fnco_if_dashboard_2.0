import { deepClone } from '../utils/deepClone.js';

export const update_data_query = (param) => {
    const paraSet = deepClone(param);

    paraSet.seeding_product = !!paraSet.seeding_product ? `'${paraSet.seeding_product}'` : null;
    paraSet.keyword = !!paraSet.keyword ? `'${paraSet.keyword}'` : null;
    paraSet.scheduled_date = !!paraSet.scheduled_date ? `'${paraSet.scheduled_date}'` : null;
    paraSet.seeding_cost = !!paraSet.seeding_cost ? paraSet.seeding_cost : 0;
    paraSet.agency_nm = !!paraSet.agency_nm ? `'${paraSet.agency_nm}'` : null;
    paraSet.is_fnco_edit = !!paraSet.is_fnco_edit ? paraSet.is_fnco_edit : false;
    paraSet.content_summary = !!paraSet.content_summary ? `'${paraSet.content_summary}'` : null;
    paraSet.seeding_cntry = !!paraSet.seeding_cntry ? `'${paraSet.seeding_cntry}'` : null;

    return {
        updateQuery: `
    update fnco_influencer.mst_post_preview 
    set 
      seeding_product = ${paraSet.seeding_product}, 
      keyword = ${paraSet.keyword}, 
      scheduled_date = ${paraSet.scheduled_date}, 
      seeding_cost = ${paraSet.seeding_cost}, 
      agency_nm = ${paraSet.agency_nm}, 
      is_fnco_edit = ${paraSet.is_fnco_edit}, 
      content_summary = ${paraSet.content_summary},
      seeding_cntry = ${paraSet.seeding_cntry}
    where id = ${paraSet.id}
      and post_id = '${paraSet.post_id}'
      `,
    };
};
