// mst_plan_doc 테이블의 status를 'product_analyzed'로 업데이트
export const update_product_analyzed_status_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const params = [];

    if (planDocId) {
        params.push(planDocId);
    }

    return {
        updateQuery: `
            UPDATE fnco_influencer.mst_plan_doc
            SET 
                status = 'product_analyzed',
                updated_at = NOW()
            WHERE plan_doc_id = $1
        `,
        params,
    };
};

// mst_plan_doc 테이블의 target_platform 업데이트
export const update_target_platform_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const targetPlatform = param?.target_platform;
    const params = [];

    if (planDocId && targetPlatform) {
        params.push(targetPlatform, planDocId);
    }

    return {
        updateQuery: `
            UPDATE fnco_influencer.mst_plan_doc
            SET 
                target_platform = $1,
                updated_at = NOW()
            WHERE plan_doc_id = $2
        `,
        params,
    };
};

// mst_plan_doc 테이블의 scheduled_start_date, scheduled_end_date 업데이트
export const update_scheduled_dates_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const startDate = param?.scheduled_start_date;
    const endDate = param?.scheduled_end_date;
    const params = [];

    if (planDocId && startDate && endDate) {
        params.push(startDate, endDate, planDocId);
    }

    return {
        updateQuery: `
            UPDATE fnco_influencer.mst_plan_doc
            SET 
                scheduled_start_date = $1,
                scheduled_end_date = $2,
                updated_at = NOW()
            WHERE plan_doc_id = $3
        `,
        params,
    };
};

// mst_plan_doc 테이블의 is_selected를 false로 업데이트 (삭제 처리)
export const unmark_plan_doc_selected_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const params = [];

    if (planDocId) {
        params.push(planDocId);
    }

    return {
        updateQuery: `
            UPDATE fnco_influencer.mst_plan_doc
            SET 
                is_selected = false,
                updated_at = NOW()
            WHERE plan_doc_id = $1
        `,
        params,
    };
};
