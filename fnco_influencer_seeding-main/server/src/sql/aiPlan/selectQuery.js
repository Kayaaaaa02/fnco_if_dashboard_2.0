// AI 플랜 문서 카운트 조회
export const get_plan_doc_count_query = () => {
    return {
        selectQuery: `
            SELECT count(plan_doc_id) as count
            FROM fnco_influencer.mst_plan_doc
            WHERE is_selected = true
        `,
    };
};

// 제품 분석 완료(status=product_analyzed) 기획안 건수 조회 (KPI용)
export const get_uploaded_plan_doc_count_query = () => {
    return {
        selectQuery: `
            SELECT count(a.plan_doc_id) as count
            FROM fnco_influencer.mst_plan_doc a
            LEFT JOIN fnco_influencer.dw_plan_doc_analysis b ON a.plan_doc_id = b.plan_doc_id
            WHERE a.status = 'product_analyzed' 
              AND a.is_selected = true
        `,
        params: [],
    };
};

// 완료(status=compleate) 기획안 건수 조회 (KPI용, 단순 COUNT)
export const get_completed_plan_doc_count_simple_query = () => {
    return {
        selectQuery: `
            SELECT count(a.plan_doc_id) as count
            FROM fnco_influencer.mst_plan_doc a
            LEFT JOIN fnco_influencer.dw_plan_doc_analysis b ON a.plan_doc_id = b.plan_doc_id
            WHERE a.status = 'compleate'
              AND a.is_selected = true
        `,
        params: [],
    };
};

// 제품 분석 완료(status=product_analyzed) 기획안 목록 조회 (모달 목록용)
export const get_uploaded_plan_doc_list_query = () => {
    return {
        selectQuery: `
            SELECT a.plan_doc_id, a.product_name, a.brand_cd, a.category, a.created_dt, a.user_nm, b.target_lang
            FROM fnco_influencer.mst_plan_doc a 
            LEFT JOIN fnco_influencer.dw_plan_doc_analysis b ON a.plan_doc_id = b.plan_doc_id
            WHERE a.status = 'product_analyzed'
              AND a.is_selected = true
            ORDER BY a.created_dt DESC
        `,
        params: [],
    };
};

// 완료된 기획안(status=compleate) 목록 조회 (최종 기획안 완료 건 모달용)
export const get_completed_plan_doc_list_query = () => {
    return {
        selectQuery: `
            SELECT a.plan_doc_id, a.product_name, a.brand_cd, a.category, a.created_dt, a.user_nm, b.target_lang
            FROM fnco_influencer.mst_plan_doc a
            LEFT JOIN fnco_influencer.dw_plan_doc_analysis b ON a.plan_doc_id = b.plan_doc_id
            WHERE a.status = 'compleate'
              AND a.is_selected = true
            ORDER BY a.created_dt DESC
        `,
        params: [],
    };
};

// 완료된 기획안 카운트 조회 (수정 버전 카운트용)
export const get_completed_plan_doc_count_query = () => {
    return {
        selectQuery: `
            SELECT sum(refined_ver_no)-count(plan_doc_id) as count
            FROM fnco_influencer.mst_plan_doc
            WHERE status = 'compleate'
              AND is_selected = true
        `,
    };
};

// plan_doc_id로 제품 분석 데이터 조회
export const get_plan_doc_analysis_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (planDocId) {
        params.push(planDocId);
        whereClause += ` AND a.plan_doc_id = $${params.length}`;
    }

    return {
        selectQuery: `
            SELECT 
                a.plan_doc_id,
                a.product_name,
                b.ai_product_insight_analysis,
                b.ai_product_insight_analysis_cn,
                b.ai_product_insight_analysis_eng,
                b.ai_top10_reels_plan,
                b.ai_top10_reels_plan_cn,
                b.ai_top10_reels_plan_eng,
                b.ai_content_format_strategy,
                b.ai_content_format_strategy_cn,
                b.ai_content_format_strategy_eng,
                b.analyzed_at as created_dt,
                a.promotion_text
            FROM fnco_influencer.mst_plan_doc a
            left join fnco_influencer.dw_plan_doc_analysis b
            ON a.plan_doc_id = b.plan_doc_id
            ${whereClause}
        `,
        params,
    };
};

// plan_doc_id로 refined_s3_prefix 조회
export const get_refined_s3_prefix_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (planDocId) {
        params.push(planDocId);
        whereClause += ` AND plan_doc_id = $${params.length}`;
    }

    return {
        selectQuery: `
            SELECT 
                plan_doc_id,
                refined_s3_prefix
            FROM fnco_influencer.mst_plan_doc
            ${whereClause}
            order by refined_updated_at desc
            LIMIT 1
        `,
        params,
    };
};

// plan_doc_id로 생성 제품 정보 조회 (제품 카테고리 / 세부 카테고리 / 제품명)
export const get_plan_product_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (planDocId) {
        params.push(planDocId);
        whereClause += ` AND plan_doc_id = $${params.length}`;
    }

    return {
        selectQuery: `
            SELECT category, subcategory, product_name, target_platform, promotion_text,
                   scheduled_start_date, scheduled_end_date
            FROM fnco_influencer.mst_plan_doc
            ${whereClause}
        `,
        params,
    };
};

// plan_doc_id와 platform으로 TOP 콘텐츠 조회 (서브쿼리로 subcategory 조회)
export const get_plan_issue_top_content_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const platform = param?.platform; // 'tiktok', 'youtube', 'Instagram'
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (planDocId) {
        params.push(planDocId);
        whereClause += ` AND subcategory = (
            SELECT subcategory 
            FROM fnco_influencer.mst_plan_doc
            WHERE 1=1 
            AND plan_doc_id = $${params.length}
        )`;
    }

    if (platform) {
        params.push(platform.toLowerCase());
        whereClause += ` AND LOWER(platform) = $${params.length}`;
    }

    return {
        selectQuery: `
            SELECT 
                id,
                post_id,
                rank_no,
                post_url,
                platform,
                category,
                subcategory,
                keyword,
                ai_post_summary,
                ai_post_summary_cn,
                ai_post_summary_eng,
                ai_channel_summary,
                ai_channel_summary_cn,
                ai_channel_summary_eng,
                created_dt,
                media_url,
                author_nm,
                view_count,
                title
            FROM fnco_influencer.mst_plan_issue_top_content
            ${whereClause}
            ORDER BY id desc, rank_no ASC
            LIMIT 3
        `,
        params,
    };
};
