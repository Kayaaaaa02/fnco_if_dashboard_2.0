/**
 * 선택한 인플루언서를 is_selected = true 로 저장
 * @param {{ profile_ids: (string|number)[], updated_by: string|number }} param
 */
export const update_influencer_is_selected_query = (param) => {
    const profileIds = param?.profile_ids;
    const updatedBy = param?.updated_by;
    const targetSelected = param?.is_selected === false ? false : true;
    const params = [];

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
        return { updateQuery: null, params: [] };
    }

    params.push(targetSelected);
    params.push(updatedBy ?? null);
    const placeholders = profileIds.map((_, i) => `$${i + 3}`).join(', ');
    params.push(...profileIds);

    return {
        updateQuery: `
            UPDATE fnco_influencer.mst_influencer
            SET is_selected = $1,
                updated_at = NOW(),
                updated_by = $2
            WHERE profile_id IN (${placeholders})
        `,
        params,
    };
};
