import { deepClone } from "../utils/deepClone.js";

export const update_data_query = (param) => {
  const paraSet = deepClone(param);

  paraSet.seeding_product = !!paraSet.seeding_product
    ? `'${paraSet.seeding_product}'`
    : null;
  paraSet.keyword = !!paraSet.keyword ? `'${paraSet.keyword}'` : null;
  paraSet.crawling_start_dt = !!paraSet.crawling_start_dt
    ? `'${paraSet.crawling_start_dt}'`
    : null;
  paraSet.crawling_end_dt = !!paraSet.crawling_end_dt
    ? `'${paraSet.crawling_end_dt}'`
    : null;
  paraSet.seeding_cost = !!paraSet.seeding_cost ? paraSet.seeding_cost : 0;
  paraSet.content_summary = !!paraSet.content_summary
    ? `'${paraSet.content_summary}'`
    : null;
  paraSet.user_id = !!paraSet.user_id ? `'${paraSet.user_id}'` : null;
  paraSet.seeding_cntry = !!paraSet.seeding_cntry
    ? `'${paraSet.seeding_cntry}'`
    : null;

  return {
    updateQuery: `
    update fnco_influencer.mst_post_ugc 
    set 
      seeding_product = ${paraSet.seeding_product}, 
      keyword = ${paraSet.keyword}, 
      crawling_start_dt = ${paraSet.crawling_start_dt}, 
      crawling_end_dt = ${paraSet.crawling_end_dt}, 
      seeding_cost = ${paraSet.seeding_cost}, 
      content_summary = ${paraSet.content_summary},
      user_id = ${paraSet.user_id},
      seeding_cntry = ${paraSet.seeding_cntry}
    where id = ${paraSet.id}
      and post_id = '${paraSet.post_id}'
      `,
  };
};
