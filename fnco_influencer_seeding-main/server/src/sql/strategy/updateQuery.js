// 전략 상태 업데이트 (승인 처리)
export const updateStrategyStatus = (strategyId, status, approvedBy) => {
    const params = [status, approvedBy || null, strategyId];

    return {
        updateQuery: `
            UPDATE dw_campaign_strategy
            SET
                status = $1,
                approved_by = $2,
                approved_at = NOW()
            WHERE strategy_id = $3
            RETURNING *
        `,
        params,
    };
};

// 전략 콘텐츠 업데이트
export const updateStrategy = (strategyId, data) => {
    const allowedFields = [
        'strategy_ko',
        'strategy_eng',
        'strategy_cn',
        'status',
    ];

    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            params.push(
                (field === 'strategy_ko' || field === 'strategy_eng' || field === 'strategy_cn') && typeof data[field] === 'object'
                    ? JSON.stringify(data[field])
                    : data[field]
            );
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    // no updated_at column in table
    params.push(strategyId);

    return {
        updateQuery: `
            UPDATE dw_campaign_strategy
            SET ${setClauses.join(', ')}
            WHERE strategy_id = $${params.length}
            RETURNING *
        `,
        params,
    };
};
