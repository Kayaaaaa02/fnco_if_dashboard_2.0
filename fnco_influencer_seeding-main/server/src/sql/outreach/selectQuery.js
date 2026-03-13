// 아웃리치 목록 조회
export const selectOutreach = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                o.outreach_id,
                o.campaign_id,
                o.profile_id,
                o.brief_content,
                o.brief_version,
                o.email_draft,
                o.status,
                o.contract_amount,
                o.contract_note,
                o.sent_at,
                o.created_at,
                o.updated_at,
                i.username,
                i.platform,
                i.follower_count,
                i.profile_image
            FROM dw_outreach o
            LEFT JOIN mst_influencer i ON o.profile_id = i.profile_id
            WHERE o.campaign_id = $1
            ORDER BY o.created_at DESC
        `,
        params,
    };
};

// 아웃리치 단건 조회
export const selectOutreachById = (outreachId) => {
    const params = [outreachId];

    return {
        selectQuery: `
            SELECT
                o.outreach_id,
                o.campaign_id,
                o.profile_id,
                o.brief_content,
                o.brief_version,
                o.email_draft,
                o.status,
                o.contract_amount,
                o.contract_note,
                o.sent_at,
                o.created_at,
                o.updated_at,
                i.username,
                i.platform,
                i.follower_count,
                i.profile_image
            FROM dw_outreach o
            LEFT JOIN mst_influencer i ON o.profile_id = i.profile_id
            WHERE o.outreach_id = $1
        `,
        params,
    };
};
