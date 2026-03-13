// 캠페인 신규 등록
export const insertCampaign = (data) => {
    const params = [
        data.campaign_id,
        data.campaign_name,
        data.brand_cd || null,
        data.category || null,
        data.subcategory || null,
        data.product_name || null,
        data.country || 'KR',
        data.brand_dna ? JSON.stringify(data.brand_dna) : null,
        data.scheduled_start || null,
        data.scheduled_end || null,
        data.created_by || null,
    ];

    return {
        insertQuery: `
            INSERT INTO mst_campaign (
                campaign_id,
                campaign_name,
                brand_cd,
                category,
                subcategory,
                product_name,
                country,
                brand_dna,
                scheduled_start,
                scheduled_end,
                created_by,
                updated_by,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};
