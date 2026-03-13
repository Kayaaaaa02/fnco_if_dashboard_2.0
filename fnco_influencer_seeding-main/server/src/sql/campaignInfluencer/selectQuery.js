// 캠페인 인플루언서 매칭 목록 조회
export const selectCampaignInfluencers = (campaignId) => {
    const params = [campaignId];

    return {
        selectQuery: `
            SELECT
                ci.campaign_id,
                ci.profile_id,
                ci.matched_concepts,
                ci.match_score,
                ci.match_reason,
                ci.status,
                ci.deep_analysis AS campaign_deep_analysis,
                ci.selected_by,
                ci.selected_at,
                ci.created_at,
                ci.created_at AS updated_at,
                i.profile_nm AS username,
                i.platform,
                i.follow_count AS follower_count,
                i.profile_img AS profile_image,
                i.profile_url,
                i.influencer_type,
                i.post_count,
                b.quick_summary,
                b.quick_summary_eng,
                b.deep_analysis,
                b.deep_analysis_eng,
                b.deep_analysis_cn,
                b.avg_engagement_quick,
                b.avg_views_quick,
                b.content_types
            FROM dw_campaign_influencer ci
            LEFT JOIN fnco_influencer.mst_influencer i ON ci.profile_id = i.profile_id
            LEFT JOIN fnco_influencer.dw_influencer_ai_analysis b ON ci.profile_id = b.profile_id
            WHERE ci.campaign_id = $1
            ORDER BY ci.match_score DESC
        `,
        params,
    };
};

// 캠페인 인플루언서 단건 조회
export const selectCampaignInfluencer = (campaignId, profileId) => {
    const params = [campaignId, profileId];

    return {
        selectQuery: `
            SELECT
                ci.campaign_id,
                ci.profile_id,
                ci.matched_concepts,
                ci.match_score,
                ci.match_reason,
                ci.status,
                ci.deep_analysis AS campaign_deep_analysis,
                ci.selected_by,
                ci.selected_at,
                ci.created_at,
                ci.created_at AS updated_at,
                i.profile_nm AS username,
                i.platform,
                i.follow_count AS follower_count,
                i.profile_img AS profile_image,
                i.profile_url,
                i.influencer_type,
                b.quick_summary,
                b.deep_analysis,
                b.avg_engagement_quick,
                b.avg_views_quick,
                b.content_types
            FROM dw_campaign_influencer ci
            LEFT JOIN fnco_influencer.mst_influencer i ON ci.profile_id = i.profile_id
            LEFT JOIN fnco_influencer.dw_influencer_ai_analysis b ON ci.profile_id = b.profile_id
            WHERE ci.campaign_id = $1
              AND ci.profile_id = $2
        `,
        params,
    };
};
