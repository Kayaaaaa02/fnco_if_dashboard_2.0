// 전략 신규 등록
export const insertStrategy = (data) => {
    const params = [
        data.campaign_id,
        data.version || 1,
        data.strategy_ko ? JSON.stringify(data.strategy_ko) : null,
        data.strategy_eng ? JSON.stringify(data.strategy_eng) : null,
        data.strategy_cn ? JSON.stringify(data.strategy_cn) : null,
        data.created_by || null,
    ];

    return {
        insertQuery: `
            INSERT INTO dw_campaign_strategy (
                campaign_id,
                version,
                strategy_ko,
                strategy_eng,
                strategy_cn,
                status,
                created_by,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, 'draft', $6, NOW()
            )
            RETURNING *
        `,
        params,
    };
};
