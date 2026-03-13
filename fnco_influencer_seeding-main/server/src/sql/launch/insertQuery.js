// 런칭 스케줄 단건 등록
export const insertLaunchItem = (data) => {
    const params = [
        data.campaign_id,
        data.creative_id,
        data.profile_id || null,
        data.platform || null,
        data.scheduled_at || null,
        data.status || 'scheduled',
    ];

    return {
        insertQuery: `
            INSERT INTO dw_launch_schedule (
                campaign_id,
                creative_id,
                profile_id,
                platform,
                scheduled_at,
                status,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 런칭 스케줄 벌크 등록
export const insertBulkLaunch = (campaignId, items) => {
    const params = [];
    const valueRows = [];

    items.forEach((item, idx) => {
        const offset = idx * 5;
        params.push(
            campaignId,
            item.creative_id,
            item.profile_id || null,
            item.platform || null,
            item.scheduled_at || null,
        );
        valueRows.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, 'scheduled', NOW(), NOW())`
        );
    });

    return {
        insertQuery: `
            INSERT INTO dw_launch_schedule (
                campaign_id, creative_id, profile_id, platform, scheduled_at, status, created_at, updated_at
            ) VALUES ${valueRows.join(', ')}
            RETURNING *
        `,
        params,
    };
};
