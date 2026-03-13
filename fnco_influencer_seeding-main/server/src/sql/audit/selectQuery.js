// 캠페인별 감사 로그 조회 (최근 N건)
export const selectAuditLogs = (campaignId, limit = 50) => {
    const params = [campaignId, limit];

    return {
        selectQuery: `
            SELECT
                log_id,
                campaign_id,
                entity_type,
                entity_id,
                action,
                changes,
                user_id,
                user_name,
                created_at
            FROM dw_audit_log
            WHERE campaign_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `,
        params,
    };
};
