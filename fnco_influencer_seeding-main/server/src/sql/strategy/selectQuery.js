// 캠페인 전략 최신 버전 조회
export const selectStrategy = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                strategy_id,
                campaign_id,
                version,
                strategy_ko,
                strategy_eng,
                strategy_cn,
                status,
                created_by,
                approved_by,
                approved_at,
                created_at
            FROM dw_campaign_strategy
            WHERE campaign_id = $1
            ORDER BY version DESC
            LIMIT 1
        `,
        params,
    };
};

// 캠페인 전략 히스토리 조회 (전체 버전)
export const selectStrategyHistory = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                strategy_id,
                campaign_id,
                version,
                strategy_ko,
                strategy_eng,
                strategy_cn,
                status,
                created_by,
                approved_by,
                approved_at,
                created_at
            FROM dw_campaign_strategy
            WHERE campaign_id = $1
            ORDER BY version DESC
        `,
        params,
    };
};
