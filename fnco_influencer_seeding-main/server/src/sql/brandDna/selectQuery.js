// 브랜드 DNA 전체 목록 조회
export const selectBrandDnaList = () => ({
    selectQuery: `
        SELECT brand_dna_id, brand_name, mission, tone_of_voice, visual_style, key_messages,
               created_by, updated_by, created_at, updated_at
        FROM mst_brand_dna
        WHERE is_deleted = false
        ORDER BY updated_at DESC
    `,
    params: [],
});

// 브랜드 DNA 단건 조회
export const selectBrandDnaById = (id) => ({
    selectQuery: `
        SELECT brand_dna_id, brand_name, mission, tone_of_voice, visual_style, key_messages,
               created_by, updated_by, created_at, updated_at
        FROM mst_brand_dna
        WHERE brand_dna_id = $1
          AND is_deleted = false
    `,
    params: [id],
});
