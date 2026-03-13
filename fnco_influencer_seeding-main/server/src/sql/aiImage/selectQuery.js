/**
 * plan_doc_id별 STEP(1~4) 이미지 목록 조회 (최종 검수 시나리오 이미지용)
 * is_selected = true 우선 정렬
 */
export const get_plan_ai_images_query = (param) => {
    const planDocId = param?.plan_doc_id;
    if (!planDocId || typeof planDocId !== 'string' || !planDocId.trim()) {
        return { selectQuery: null, params: [] };
    }
    return {
        selectQuery: `
            SELECT step, img_url, is_selected
            FROM fnco_influencer.dw_plan_ai_image
            WHERE plan_doc_id = $1
              AND step BETWEEN 1 AND 4
            ORDER BY step ASC, is_selected DESC NULLS LAST, created_at DESC
        `,
        params: [planDocId.trim()],
    };
};
