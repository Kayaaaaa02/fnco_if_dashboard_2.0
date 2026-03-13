// 아웃리치 등록
export const insertOutreach = (data) => {
    const params = [
        data.campaign_id,
        data.profile_id,
        data.brief_content ? JSON.stringify(data.brief_content) : null,
        data.email_draft ? JSON.stringify(data.email_draft) : null,
        data.status || 'draft',
    ];

    return {
        insertQuery: `
            INSERT INTO dw_outreach (
                campaign_id,
                profile_id,
                brief_content,
                email_draft,
                status,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 아웃리치 벌크 등록
export const insertBulkOutreach = (campaignId, items) => {
    const values = [];
    const params = [];

    items.forEach((item, idx) => {
        const offset = idx * 4;
        params.push(
            campaignId,
            item.profile_id,
            item.brief_content ? JSON.stringify(item.brief_content) : null,
            item.email_draft ? JSON.stringify(item.email_draft) : null,
        );
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, 'draft', NOW(), NOW())`);
    });

    return {
        insertQuery: `
            INSERT INTO dw_outreach (
                campaign_id,
                profile_id,
                brief_content,
                email_draft,
                status,
                created_at,
                updated_at
            ) VALUES ${values.join(',\n                   ')}
            RETURNING *
        `,
        params,
    };
};
