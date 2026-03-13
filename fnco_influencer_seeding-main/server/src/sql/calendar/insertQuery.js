// 캘린더 아이템 단건 등록
export const insertCalendarItem = (data) => {
    const params = [
        data.campaign_id,
        data.concept_id || null,
        data.platform || null,
        data.scheduled_date || null,
        data.content_type || null,
        data.title || null,
        data.description || null,
        data.hashtags || null,
    ];

    return {
        insertQuery: `
            INSERT INTO dw_content_calendar (
                campaign_id,
                concept_id,
                platform,
                scheduled_date,
                content_type,
                title,
                description,
                hashtags,
                status,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, 'draft', NOW(), NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 캘린더 아이템 벌크 등록
export const insertBulkCalendar = (campaignId, items) => {
    const params = [];
    const valueRows = [];

    items.forEach((item, idx) => {
        const offset = idx * 8;
        params.push(
            campaignId,
            item.concept_id || null,
            item.platform || null,
            item.scheduled_date || null,
            item.content_type || null,
            item.title || null,
            item.description || null,
            item.hashtags || null,
        );
        valueRows.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, 'draft', NOW(), NOW())`
        );
    });

    return {
        insertQuery: `
            INSERT INTO dw_content_calendar (
                campaign_id, concept_id, platform, scheduled_date, content_type, title, description, hashtags, status, created_at, updated_at
            ) VALUES ${valueRows.join(', ')}
            RETURNING *
        `,
        params,
    };
};
