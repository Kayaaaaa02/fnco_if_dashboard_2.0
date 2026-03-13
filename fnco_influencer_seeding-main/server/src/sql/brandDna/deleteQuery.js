// 브랜드 DNA 소프트 삭제
export const softDeleteBrandDna = (id) => ({
    updateQuery: `
        UPDATE mst_brand_dna
        SET is_deleted = true, updated_at = NOW()
        WHERE brand_dna_id = $1
          AND is_deleted = false
        RETURNING brand_dna_id
    `,
    params: [id],
});
