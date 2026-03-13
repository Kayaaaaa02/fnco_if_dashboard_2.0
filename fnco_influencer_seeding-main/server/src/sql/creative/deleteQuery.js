// 크리에이티브 삭제 (하드 삭제)
export const deleteCreative = (creativeId) => {
    const params = [creativeId];

    return {
        deleteQuery: `
            DELETE FROM dw_creative
            WHERE creative_id = $1
            RETURNING creative_id
        `,
        params,
    };
};
