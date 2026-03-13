// 감사 로그 등록
export const insertAuditLog = (data) => {
    const params = [
        data.campaign_id,
        data.entity_type,
        data.entity_id || null,
        data.action,
        data.changes ? JSON.stringify(data.changes) : null,
        data.user_id || null,
        data.user_name || null,
    ];

    return {
        insertQuery: `
            INSERT INTO dw_audit_log (
                campaign_id,
                entity_type,
                entity_id,
                action,
                changes,
                user_id,
                user_name,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, NOW()
            )
            RETURNING *
        `,
        params,
    };
};
