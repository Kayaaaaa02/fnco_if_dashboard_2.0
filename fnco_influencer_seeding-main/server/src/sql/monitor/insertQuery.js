// 성과 지표 단건 등록
export const insertMetric = (data) => {
    const params = [
        data.campaign_id,
        data.creative_id,
        data.concept_id || null,
        data.date,
        data.impressions || 0,
        data.reach || 0,
        data.clicks || 0,
        data.ctr || 0,
        data.cpa || 0,
        data.roas || 0,
        data.engaged_views || 0,
        data.conversions || 0,
        data.fatigue_score || 0,
    ];

    return {
        insertQuery: `
            INSERT INTO dw_performance_metric (
                campaign_id,
                creative_id,
                concept_id,
                date,
                impressions,
                reach,
                clicks,
                ctr,
                cpa,
                roas,
                engaged_views,
                conversions,
                fatigue_score,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 성과 지표 벌크 등록
export const insertBulkMetrics = (campaignId, metrics) => {
    const params = [];
    const valueRows = [];

    metrics.forEach((m, idx) => {
        const offset = idx * 12;
        params.push(
            campaignId,
            m.creative_id,
            m.concept_id || null,
            m.date,
            m.impressions || 0,
            m.reach || 0,
            m.clicks || 0,
            m.ctr || 0,
            m.cpa || 0,
            m.roas || 0,
            m.engaged_views || 0,
            m.conversions || 0,
        );
        valueRows.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, ${m.fatigue_score || 0}, NOW())`
        );
    });

    return {
        insertQuery: `
            INSERT INTO dw_performance_metric (
                campaign_id, creative_id, concept_id, date, impressions, reach, clicks, ctr, cpa, roas, engaged_views, conversions, fatigue_score, created_at
            ) VALUES ${valueRows.join(', ')}
            RETURNING *
        `,
        params,
    };
};
