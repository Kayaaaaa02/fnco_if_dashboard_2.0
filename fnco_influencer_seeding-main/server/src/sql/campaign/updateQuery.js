// 캠페인 필드 업데이트 (동적 필드)
export const updateCampaign = (campaignId, data) => {
    const allowedFields = [
        'campaign_name',
        'brand_cd',
        'category',
        'subcategory',
        'product_name',
        'country',
        'status',
        'current_phase',
        'brand_dna',
        'plan_doc_id',
        'scheduled_start',
        'scheduled_end',
        'updated_by',
    ];

    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            params.push(field === 'brand_dna' && typeof data[field] === 'object'
                ? JSON.stringify(data[field])
                : data[field]);
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    // updated_at은 항상 갱신
    setClauses.push('updated_at = NOW()');

    params.push(campaignId);

    return {
        updateQuery: `
            UPDATE mst_campaign
            SET ${setClauses.join(', ')}
            WHERE campaign_id = $${params.length}
              AND is_deleted = false
            RETURNING *
        `,
        params,
    };
};

// 캠페인 페이즈 업데이트
export const updateCampaignPhase = (campaignId, phase, updatedBy) => {
    const params = [phase, updatedBy, campaignId];

    return {
        updateQuery: `
            UPDATE mst_campaign
            SET
                current_phase = $1,
                updated_by = $2,
                updated_at = NOW()
            WHERE campaign_id = $3
              AND is_deleted = false
            RETURNING *
        `,
        params,
    };
};

// 캠페인 상태 업데이트
export const updateCampaignStatus = (campaignId, status, updatedBy) => {
    const params = [status, updatedBy, campaignId];

    return {
        updateQuery: `
            UPDATE mst_campaign
            SET
                status = $1,
                updated_by = $2,
                updated_at = NOW()
            WHERE campaign_id = $3
              AND is_deleted = false
            RETURNING *
        `,
        params,
    };
};
