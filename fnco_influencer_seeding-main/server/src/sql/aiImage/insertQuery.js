/**
 * 시나리오 이미지 업로드 시 dw_plan_ai_image에 INSERT (가이드: upload-image 응답 url → DB INSERT)
 * 컬럼: plan_doc_id, step, img_url, is_selected(TRUE), created_by. id/created_at은 DB 기본값.
 */
export const insert_plan_ai_image_query = (param) => {
    const planDocId = param?.plan_doc_id;
    const step = param?.step;
    const imgUrl = param?.img_url;
    const createdBy = param?.created_by;

    if (!planDocId || typeof planDocId !== 'string' || !planDocId.trim()) {
        return { insertQuery: null, params: [] };
    }
    if (step == null || step < 1 || step > 4) {
        return { insertQuery: null, params: [] };
    }
    if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.trim()) {
        return { insertQuery: null, params: [] };
    }

    return {
        insertQuery: `
            INSERT INTO fnco_influencer.dw_plan_ai_image_v2
                (plan_doc_id, step, img_url, is_selected, created_by)
            VALUES ($1, $2, $3, TRUE, $4)
        `,
        params: [planDocId.trim(), step, imgUrl.trim(), (createdBy && String(createdBy).trim()) || null],
    };
};
