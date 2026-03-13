import { deepClone } from '../utils/deepClone.js';

export const delete_data_query = (param) => {
    const paraSet = deepClone(param);

    return {
        mstDeleteQuery: `
      update fnco_influencer.mst_post 
      set is_deleted = true
      where id = ${paraSet}
      ;
    `,
        dwDdeleteQuery: `
      update fnco_influencer.dw_post_d a
      set is_deleted = true
      from (
        select distinct post_id 
        from fnco_influencer.mst_post
        where id = ${paraSet}
      ) b
      where a.post_id = b.post_id
      ;
    `,
    };
};
