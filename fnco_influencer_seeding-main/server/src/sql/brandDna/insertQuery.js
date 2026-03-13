// 브랜드 DNA 등록
export const insertBrandDna = (data) => {
    const params = [
        data.brand_dna_id,
        data.brand_name,
        data.mission || null,
        data.tone_of_voice || null,
        data.visual_style || null,
        data.key_messages || null,
        data.created_by || null,
    ];

    return {
        insertQuery: `
            INSERT INTO mst_brand_dna (
                brand_dna_id, brand_name, mission, tone_of_voice, visual_style, key_messages,
                created_by, updated_by, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $7, NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};
