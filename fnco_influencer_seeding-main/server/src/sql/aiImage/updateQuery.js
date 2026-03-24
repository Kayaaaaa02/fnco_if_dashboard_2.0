/**
 * 생성된 이미지 선택 여부 업데이트 (dw_plan_ai_image.is_selected)
 * 테이블 컬럼: id, plan_doc_id, step, img_url, is_selected, created_at, created_by
 * 이미지 구별: 클라이언트가 가진 image.url = DB img_url
 * @param {{ img_url: string, is_selected: boolean, plan_doc_id?: string, step?: number }} param
 */
export const update_plan_ai_image_selected_query = (param) => {
    const imgUrl = param?.img_url;
    const isSelected = param?.is_selected === true;
    const planDocId = param?.plan_doc_id;
    const step = param?.step;

    if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.trim()) {
        return { updateQuery: null, params: [] };
    }

    const params = [isSelected, imgUrl.trim()];
    let whereClause = 'WHERE img_url = $2';

    if (planDocId != null && String(planDocId).trim()) {
        params.push(String(planDocId).trim());
        whereClause += ` AND plan_doc_id = $${params.length}`;
    }
    if (step != null && (step === 1 || step === 2 || step === 3 || step === 4)) {
        params.push(step);
        whereClause += ` AND step = $${params.length}`;
    }

    return {
        updateQuery: `
            UPDATE fnco_influencer.dw_plan_ai_image_v2
            SET is_selected = $1
            ${whereClause}
        `,
        params,
    };
};
