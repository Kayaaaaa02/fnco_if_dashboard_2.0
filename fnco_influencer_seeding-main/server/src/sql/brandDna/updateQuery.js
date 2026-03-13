// 브랜드 DNA 수정
export const updateBrandDna = (id, data) => {
    const allowedFields = ['brand_name', 'mission', 'tone_of_voice', 'visual_style', 'key_messages', 'updated_by'];
    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            params.push(data[field]);
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    setClauses.push('updated_at = NOW()');
    params.push(id);

    return {
        updateQuery: `
            UPDATE mst_brand_dna
            SET ${setClauses.join(', ')}
            WHERE brand_dna_id = $${params.length}
              AND is_deleted = false
            RETURNING *
        `,
        params,
    };
};
