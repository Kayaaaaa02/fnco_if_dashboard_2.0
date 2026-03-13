// 크리에이티브 필드 업데이트 (동적 필드)
export const updateCreative = (creativeId, data) => {
    const allowedFields = [
        'copy_text',
        'copy_variants',
        'scenario',
        'ai_images',
        'production_guide',
        'version',
        'status',
    ];

    const setClauses = [];
    const params = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            const isJsonField = ['copy_variants', 'scenario', 'ai_images', 'production_guide'].includes(field);
            params.push(
                isJsonField && typeof data[field] === 'object'
                    ? JSON.stringify(data[field])
                    : data[field]
            );
            setClauses.push(`${field} = $${params.length}`);
        }
    }

    // updated_at은 항상 갱신
    setClauses.push('updated_at = NOW()');

    params.push(creativeId);

    return {
        updateQuery: `
            UPDATE dw_creative
            SET ${setClauses.join(', ')}
            WHERE creative_id = $${params.length}
            RETURNING *
        `,
        params,
    };
};

// 크리에이티브 상태만 업데이트
export const updateCreativeStatus = (creativeId, status) => {
    const params = [status, creativeId];

    return {
        updateQuery: `
            UPDATE dw_creative
            SET
                status = $1,
                updated_at = NOW()
            WHERE creative_id = $2
            RETURNING *
        `,
        params,
    };
};

// 크리에이티브 AI 이미지만 업데이트
export const updateCreativeImages = (creativeId, aiImages) => {
    const params = [JSON.stringify(aiImages), creativeId];

    return {
        updateQuery: `
            UPDATE dw_creative
            SET
                ai_images = $1,
                updated_at = NOW()
            WHERE creative_id = $2
            RETURNING *
        `,
        params,
    };
};
