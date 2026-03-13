// 크리에이티브 단건 등록
export const insertCreative = (data) => {
    const params = [
        data.campaign_id,
        data.concept_id,
        data.calendar_id || null,
        data.copy_text || null,
        data.copy_variants ? JSON.stringify(data.copy_variants) : null,
        data.scenario ? JSON.stringify(data.scenario) : null,
        data.ai_images ? JSON.stringify(data.ai_images) : null,
        data.status || 'draft',
        data.created_by || null,
    ];

    return {
        insertQuery: `
            INSERT INTO dw_creative (
                campaign_id,
                concept_id,
                calendar_id,
                copy_text,
                copy_variants,
                scenario,
                ai_images,
                status,
                created_by,
                version,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, 1, NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 크리에이티브 벌크 등록
export const insertBulkCreatives = (campaignId, creatives) => {
    const params = [];
    const valueRows = [];

    creatives.forEach((cr, idx) => {
        const offset = idx * 8;
        params.push(
            campaignId,
            cr.concept_id,
            cr.calendar_id || null,
            cr.copy_text || null,
            cr.copy_variants ? JSON.stringify(cr.copy_variants) : null,
            cr.scenario ? JSON.stringify(cr.scenario) : null,
            cr.ai_images ? JSON.stringify(cr.ai_images) : null,
            cr.status || 'draft',
        );
        valueRows.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, '${cr.created_by || 'system'}', 1, NOW(), NOW())`
        );
    });

    return {
        insertQuery: `
            INSERT INTO dw_creative (
                campaign_id, concept_id, calendar_id, copy_text, copy_variants, scenario, ai_images, status, created_by, version, created_at, updated_at
            ) VALUES ${valueRows.join(', ')}
            RETURNING *
        `,
        params,
    };
};
