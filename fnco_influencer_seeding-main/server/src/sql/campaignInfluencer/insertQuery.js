// 캠페인 인플루언서 매칭 등록
export const insertCampaignInfluencer = (data) => {
    const params = [
        data.campaign_id,
        data.profile_id,
        data.matched_concepts ? JSON.stringify(data.matched_concepts) : null,
        data.match_score || 0,
        data.match_reason ? JSON.stringify(data.match_reason) : null,
        data.status || 'matched',
    ];

    return {
        insertQuery: `
            INSERT INTO dw_campaign_influencer (
                campaign_id,
                profile_id,
                matched_concepts,
                match_score,
                match_reason,
                status,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, NOW()
            )
            RETURNING *
        `,
        params,
    };
};

// 캠페인 인플루언서 벌크 등록
export const insertBulkCampaignInfluencers = (campaignId, influencers) => {
    const values = [];
    const params = [];

    influencers.forEach((inf, idx) => {
        const offset = idx * 5;
        params.push(
            campaignId,
            inf.profile_id,
            inf.matched_concepts ? JSON.stringify(inf.matched_concepts) : null,
            inf.match_score || 0,
            inf.match_reason ? JSON.stringify(inf.match_reason) : null,
        );
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, 'matched', NOW())`);
    });

    return {
        insertQuery: `
            INSERT INTO dw_campaign_influencer (
                campaign_id,
                profile_id,
                matched_concepts,
                match_score,
                match_reason,
                status,
                created_at
            ) VALUES ${values.join(',\n                   ')}
            RETURNING *
        `,
        params,
    };
};
