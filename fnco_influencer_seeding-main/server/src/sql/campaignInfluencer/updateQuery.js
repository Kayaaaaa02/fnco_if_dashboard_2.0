// 인플루언서 상태 업데이트
export const updateInfluencerStatus = (campaignId, profileId, status, selectedBy) => {
    const params = [status, selectedBy, campaignId, profileId];

    return {
        updateQuery: `
            UPDATE dw_campaign_influencer
            SET
                status = $1,
                selected_by = $2,
                selected_at = NOW(),
                created_at = NOW()
            WHERE campaign_id = $3
              AND profile_id = $4
            RETURNING *
        `,
        params,
    };
};

// 인플루언서 딥 분석 결과 업데이트
export const updateInfluencerDeepAnalysis = (campaignId, profileId, deepAnalysis) => {
    const params = [
        JSON.stringify(deepAnalysis),
        campaignId,
        profileId,
    ];

    return {
        updateQuery: `
            UPDATE dw_campaign_influencer
            SET
                deep_analysis = $1,
                created_at = NOW()
            WHERE campaign_id = $2
              AND profile_id = $3
            RETURNING *
        `,
        params,
    };
};
