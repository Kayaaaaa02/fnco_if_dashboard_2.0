// 캠페인 소프트 삭제 (is_deleted = true)
export const softDeleteCampaign = (campaignId) => {
    const params = [campaignId];

    return {
        updateQuery: `
            UPDATE mst_campaign
            SET
                is_deleted = true,
                updated_at = NOW()
            WHERE campaign_id = $1
              AND is_deleted = false
            RETURNING campaign_id
        `,
        params,
    };
};
