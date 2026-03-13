import { deepClone } from '../utils/deepClone.js';

export const insert_data_query = (param) => {
    const paraSet = deepClone(param);
    let get_insert_params = '';
    paraSet.forEach((e, idx) => {
        e.plan_doc_id = !!e.plan_doc_id ? `'${e.plan_doc_id}'` : null;
        e.status = !!e.status ? `'${e.status}'` : `'uploaded'`; // 기본값 'uploaded'
        e.file_name = !!e.file_name ? `'${String(e.file_name).replace(/'/g, "''")}'` : null;
        e.file_path = !!e.file_path ? `'${String(e.file_path).replace(/'/g, "''")}'` : null;
        e.cntry = !!e.cntry ? `'${e.cntry}'` : null;
        e.brand_cd = !!e.brand_cd ? `'${e.brand_cd}'` : null;
        e.category = !!e.category ? `'${e.category}'` : null;
        e.subcategory = !!e.subcategory ? `'${String(e.subcategory).replace(/'/g, "''")}'` : null;
        e.product_name = !!e.product_name ? `'${String(e.product_name).replace(/'/g, "''")}'` : null;
        e.keyword = !!e.keyword ? `'${String(e.keyword).replace(/'/g, "''")}'` : null;
        e.promotion_text = !!e.promotion_text ? `'${String(e.promotion_text).replace(/'/g, "''")}'` : null;
        e.user_nm = !!e.user_nm ? `'${String(e.user_nm).replace(/'/g, "''")}'` : null;

        if (idx == 0) {
            get_insert_params += `(${e.plan_doc_id},${e.status},${e.file_name},${e.file_path},${e.cntry},${e.brand_cd},${e.category},${e.subcategory},${e.product_name},${e.keyword},${e.promotion_text},${e.user_nm},(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date,(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul' + INTERVAL '14 days')::date)`;
        } else {
            get_insert_params += `,(${e.plan_doc_id},${e.status},${e.file_name},${e.file_path},${e.cntry},${e.brand_cd},${e.category},${e.subcategory},${e.product_name},${e.keyword},${e.promotion_text},${e.user_nm},(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date,(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul' + INTERVAL '14 days')::date)`;
        }
    });

    return {
        insertQuery: `
    insert into fnco_influencer.mst_plan_doc (
      plan_doc_id,
      status,
      file_name,
      file_path,
      cntry,
      brand_cd,
      category,
      subcategory,
      product_name,
      keyword,
      promotion_text,
      user_nm,
      scheduled_start_date,
      scheduled_end_date
    ) values 
     ${get_insert_params}
      `,
    };
};
